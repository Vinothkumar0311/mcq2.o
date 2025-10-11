const PDFDocument = require('pdfkit');
const { TestSession, SectionSubmission, Test, Section, MCQ, CodingQuestion, User, LicensedUser } = require('../models');

exports.downloadTestResultPDF = async (req, res) => {
  try {
    const { testId } = req.params;
    const { testResult } = req.body;

    if (!testResult) {
      return res.status(400).json({ success: false, error: 'Test result data required' });
    }

    // Get student ID from localStorage or session
    const studentId = req.headers['x-student-id'] || req.body.studentId;
    
    let student = null;
    
    if (studentId) {
      // Try LicensedUser first
      try {
        student = await LicensedUser.findByPk(studentId);
        console.log('Found LicensedUser:', student?.name);
      } catch (error) {
        console.log('LicensedUser lookup failed:', error.message);
      }
      
      // Fallback to User table
      if (!student) {
        try {
          student = await User.findByPk(studentId);
          console.log('Found User:', student?.name);
        } catch (error) {
          console.log('User lookup failed:', error.message);
        }
      }
    }
    
    // If still no student, try to get from test session
    if (!student) {
      const testSession = await TestSession.findOne({
        where: { testId },
        order: [['createdAt', 'DESC']]
      });
      
      if (testSession?.studentId) {
        try {
          student = await LicensedUser.findByPk(testSession.studentId) || 
                   await User.findByPk(testSession.studentId);
        } catch (error) {
          console.log('Session-based student lookup failed:', error.message);
        }
      }
    }
    
    console.log('PDF Generation - Final student data:', student ? {
      id: student.id,
      name: student.name,
      email: student.email,
      department: student.department,
      sinNumber: student.sinNumber
    } : 'No student found');

    // Create PDF document
    const doc = new PDFDocument({ margin: 50 });
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${testResult.testName.replace(/\s+/g, '_')}_Result.pdf"`);
    
    // Pipe PDF to response
    doc.pipe(res);

    // Header
    doc.fontSize(20).fillColor('#2563eb').text('TEST RESULT REPORT', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(12).fillColor('#666').text(`Generated on ${new Date().toLocaleDateString()}`, { align: 'center' });
    doc.moveDown(1);

    // Student Information
    doc.fontSize(16).fillColor('#000').text('STUDENT INFORMATION', { underline: true });
    doc.moveDown(0.5);
    
    const studentName = student?.name || 'Test Student';
    const studentEmail = student?.email || 'student@testplatform.com';
    const studentDept = student?.department || 'General';
    const studentSIN = student?.sinNumber || student?.sin_number || 'TS-' + Date.now().toString().slice(-6);
    
    doc.fontSize(12)
       .text(`Name: ${studentName}`)
       .text(`Email: ${studentEmail}`)
       .text(`Department: ${studentDept}`)
       .text(`SIN Number: ${studentSIN}`);
    doc.moveDown(1);

    // Test Information
    doc.fontSize(16).fillColor('#000').text('TEST INFORMATION', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(12)
       .text(`Test Name: ${testResult.testName}`)
       .text(`Test ID: ${testResult.testId}`)
       .text(`Total Questions: ${testResult.totalQuestions}`)
       .text(`Completed On: ${new Date().toLocaleDateString()}`);
    doc.moveDown(1);

    // Overall Results
    doc.fontSize(16).fillColor('#000').text('OVERALL RESULTS', { underline: true });
    doc.moveDown(0.5);
    
    let percentage, status, statusColor;
    
    // Use the actual test result data with proper fallbacks
    const totalScore = testResult.totalScore || 0;
    const maxScore = testResult.maxScore || testResult.totalQuestions || 0;
    percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
    
    // If we have MCQ results, use those for calculation
    if (testResult.mcqResults && testResult.mcqResults.totalQuestions > 0) {
      const mcqScore = testResult.mcqResults.correctAnswers || 0;
      const mcqMax = testResult.mcqResults.totalQuestions || 0;
      if (mcqMax > 0) {
        percentage = Math.round((mcqScore / mcqMax) * 100);
      }
    }
    
    status = percentage >= 60 ? 'PASS' : 'FAIL';
    statusColor = percentage >= 60 ? '#16a34a' : '#dc2626';
    
    console.log('PDF Generation - Calculated values:', {
      totalScore,
      maxScore,
      percentage,
      status,
      hasMCQResults: !!testResult.mcqResults
    });
    
    doc.fontSize(12)
       .text(`Total Score: ${totalScore}/${maxScore}`)
       .text(`Percentage: ${percentage}%`)
       .fillColor(statusColor)
       .text(`Status: ${status}`, { continued: false })
       .fillColor('#000');
    
    // Show MCQ results if available
    if (testResult.mcqResults) {
      doc.text(`MCQ Questions: ${testResult.mcqResults.totalQuestions || 0}`)
         .text(`Correct Answers: ${testResult.mcqResults.correctAnswers || 0}`)
         .text(`Wrong Answers: ${testResult.mcqResults.wrongAnswers || 0}`)
         .text(`Unanswered: ${testResult.mcqResults.unansweredCount || 0}`);
    }
    
    // Show coding results if available
    if (testResult.codingStatistics) {
      doc.text(`Coding Questions: ${testResult.codingStatistics.totalQuestions || 0}`)
         .text(`Test Cases Passed: ${testResult.codingStatistics.totalPassedTestCases || 0}/${testResult.codingStatistics.totalTestCases || 0}`)
         .text(`Test Case Success Rate: ${testResult.codingStatistics.testCaseSuccessRate || 0}%`)
         .text(`Questions Fully Passed: ${testResult.codingStatistics.questionsFullyPassed || 0}`)
         .text(`Questions Partially Passed: ${testResult.codingStatistics.questionsPartiallyPassed || 0}`);
    }
    doc.moveDown(1);

    // MCQ Questions Section
    if (testResult.mcqResults?.questions && testResult.mcqResults.questions.length > 0) {
      const questions = testResult.mcqResults.questions;
      doc.addPage();
      doc.fontSize(16).fillColor('#000').text('MCQ QUESTIONS & ANSWERS', { underline: true });
      doc.moveDown(1);

      questions.forEach((question, index) => {
        // Check if we need a new page
        if (doc.y > 700) {
          doc.addPage();
        }

        doc.fontSize(14).fillColor('#1f2937').text(`Question ${index + 1}:`, { continued: true });
        doc.fontSize(12).fillColor('#000').text(` ${question.questionText}`);
        doc.moveDown(0.5);

        // Options
        ['A', 'B', 'C', 'D'].forEach(option => {
          const optionText = question[`option${option}`];
          const isCorrect = question.correctOptionLetter === option;
          const isUserAnswer = question.userAnswer === option;
          
          let prefix = `${option}) `;
          let color = '#000';
          
          if (isCorrect) {
            prefix += '✓ ';
            color = '#16a34a';
          } else if (isUserAnswer && !isCorrect) {
            prefix += '✗ ';
            color = '#dc2626';
          }
          
          doc.fontSize(11).fillColor(color).text(`${prefix}${optionText}`);
        });

        // Answer status
        doc.moveDown(0.3);
        if (!question.userAnswer) {
          doc.fontSize(11).fillColor('#f59e0b').text('Status: Not Answered');
        } else if (question.isCorrect) {
          doc.fontSize(11).fillColor('#16a34a').text('Status: Correct Answer');
        } else {
          doc.fontSize(11).fillColor('#dc2626').text(`Status: Wrong Answer (Correct: ${question.correctOptionLetter})`);
        }

        if (question.explanation) {
          doc.moveDown(0.3);
          doc.fontSize(10).fillColor('#666').text(`Explanation: ${question.explanation}`);
        }

        doc.moveDown(1);
      });
    }

    // Coding Questions Section
    if (testResult.codingResults && testResult.codingResults.length > 0) {
      doc.addPage();
      doc.fontSize(16).fillColor('#000').text('CODING QUESTIONS & SOLUTIONS', { underline: true });
      doc.moveDown(1);

      // Coding Statistics Summary
      if (testResult.codingStatistics) {
        const stats = testResult.codingStatistics;
        doc.fontSize(14).fillColor('#1f2937').text('Coding Performance Summary:', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(12).fillColor('#000')
           .text(`Total Coding Questions: ${stats.totalQuestions || 0}`)
           .text(`Total Test Cases: ${stats.totalTestCases || 0}`)
           .text(`Test Cases Passed: ${stats.totalPassedTestCases || 0}`)
           .text(`Test Case Success Rate: ${stats.testCaseSuccessRate || 0}%`)
           .text(`Questions Fully Passed: ${stats.questionsFullyPassed || 0}`)
           .text(`Questions Partially Passed: ${stats.questionsPartiallyPassed || 0}`)
           .text(`Questions Failed: ${stats.questionsFailed || 0}`);
        doc.moveDown(1);
      }

      testResult.codingResults.forEach((coding, index) => {
        // Check if we need a new page
        if (doc.y > 500) {
          doc.addPage();
        }

        doc.fontSize(14).fillColor('#1f2937').text(`Coding Question ${index + 1}: ${coding.questionName || 'Unnamed Problem'}`);
        doc.moveDown(0.5);

        // Problem Statement
        doc.fontSize(12).fillColor('#000').text('Problem Statement:');
        doc.fontSize(11).fillColor('#374151').text(coding.problemStatement || 'N/A', { width: 500 });
        doc.moveDown(0.5);

        // Performance Summary
        doc.fontSize(12).fillColor('#000').text('Performance Summary:');
        const statusColor = coding.percentage >= 80 ? '#16a34a' : coding.percentage >= 60 ? '#f59e0b' : '#dc2626';
        doc.fontSize(11).fillColor('#000')
           .text(`Language: ${coding.language || 'N/A'}`)
           .text(`Score: ${coding.score || 0}/${coding.maxScore || 0} points`)
           .text(`Test Cases Passed: ${coding.testCasesPassed || 0}/${coding.totalTestCases || 0}`)
           .text(`Success Rate: ${coding.percentage || 0}%`)
           .fillColor(statusColor)
           .text(`Grade: ${coding.grade || 'N/A'}`)
           .text(`Status: ${coding.status || 'Unknown'}`)
           .fillColor('#000');
        
        if (coding.executionTime) {
          doc.text(`Execution Time: ${coding.executionTime}ms`);
        }
        if (coding.memoryUsed) {
          doc.text(`Memory Used: ${coding.memoryUsed}KB`);
        }
        doc.moveDown(0.5);

        // Test Cases Details
        if (coding.testResults && coding.testResults.length > 0) {
          doc.fontSize(12).fillColor('#000').text('Test Cases Results:');
          doc.moveDown(0.3);
          
          coding.testResults.forEach((testCase, tcIndex) => {
            if (doc.y > 700) {
              doc.addPage();
            }
            
            const tcColor = testCase.passed ? '#16a34a' : '#dc2626';
            const tcStatus = testCase.passed ? 'PASS' : 'FAIL';
            
            doc.fontSize(11).fillColor(tcColor)
               .text(`Test Case ${tcIndex + 1}: ${tcStatus}`);
            doc.fontSize(10).fillColor('#000')
               .text(`Input: ${testCase.input || 'No input'}`, { width: 500 })
               .text(`Expected: ${testCase.expectedOutput || 'No expected output'}`, { width: 500 })
               .text(`Actual: ${testCase.actualOutput || 'No output'}`, { width: 500 });
            
            if (testCase.error) {
              doc.fillColor('#dc2626').text(`Error: ${testCase.error}`, { width: 500 });
            }
            if (testCase.executionTime) {
              doc.fillColor('#666').text(`Execution Time: ${testCase.executionTime}ms`);
            }
            doc.fillColor('#000').moveDown(0.3);
          });
          doc.moveDown(0.5);
        }

        // User Code
        if (doc.y > 200) {
          doc.fontSize(12).fillColor('#000').text('Your Solution:');
          doc.fontSize(9).fillColor('#1f2937').font('Courier');
          
          const codeLines = (coding.userCode || 'No code submitted').split('\n');
          codeLines.forEach(line => {
            if (doc.y > 750) {
              doc.addPage();
            }
            doc.text(line.substring(0, 100)); // Limit line length for PDF
          });
          
          doc.font('Helvetica').fontSize(12).fillColor('#000');
          doc.moveDown(0.5);
        } else {
          doc.addPage();
          doc.fontSize(12).fillColor('#000').text('Your Solution:');
          doc.fontSize(9).fillColor('#1f2937').font('Courier');
          
          const codeLines = (coding.userCode || 'No code submitted').split('\n');
          codeLines.forEach(line => {
            if (doc.y > 750) {
              doc.addPage();
            }
            doc.text(line.substring(0, 100));
          });
          
          doc.font('Helvetica').fontSize(12).fillColor('#000');
          doc.moveDown(0.5);
        }

        // Compilation/Runtime Errors
        if (coding.errorMessage) {
          doc.fontSize(12).fillColor('#dc2626').text('Errors:');
          doc.fontSize(10).fillColor('#dc2626').text(coding.errorMessage, { width: 500 });
          doc.moveDown(0.5);
        }

        doc.moveDown(1);
      });
    }

    // Footer
    doc.fontSize(10).fillColor('#666').text(
      `Report generated by Test Platform on ${new Date().toLocaleString()}`,
      50,
      doc.page.height - 50,
      { align: 'center' }
    );

    // Finalize PDF
    doc.end();

  } catch (error) {
    console.error('Error generating PDF report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate PDF report'
    });
  }
};