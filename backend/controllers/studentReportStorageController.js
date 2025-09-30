const { TestSession, Test, User, LicensedUser, SectionSubmission, CodeSubmission } = require('../models');
const { findStudentById } = require('../utils/studentLookup');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Get student test results for reports page
exports.getStudentTestResults = async (req, res) => {
  try {
    const { studentEmail } = req.params;
    console.log(`📊 Fetching test results for student email: ${studentEmail}`);

    // Find student by email in both tables
    let student = await LicensedUser.findOne({ where: { email: studentEmail } });
    let studentId = student?.id;
    
    if (!student) {
      student = await User.findOne({ where: { email: studentEmail } });
      studentId = student?.id;
    }

    if (!student) {
      return res.json({
        success: true,
        results: [],
        message: 'No student found with this email'
      });
    }

    // Get completed test sessions
    const testSessions = await TestSession.findAll({
      where: { 
        studentId: String(studentId),
        status: ['completed', 'submitted']
      },
      order: [['completedAt', 'DESC']]
    });

    if (testSessions.length === 0) {
      return res.json({
        success: true,
        results: [],
        message: 'No completed tests found'
      });
    }

    // Get test details
    const testIds = [...new Set(testSessions.map(session => session.testId))];
    const tests = await Test.findAll({
      where: { testId: testIds }
    });
    const testMap = tests.reduce((map, test) => {
      map[test.testId] = test;
      return map;
    }, {});

    // Format results
    const results = testSessions.map(session => {
      const test = testMap[session.testId];
      const percentage = session.maxScore > 0 ? 
        Math.round((session.totalScore / session.maxScore) * 100) : 0;
      
      return {
        sessionId: session.id,
        testId: session.testId,
        testName: test?.name || 'Unknown Test',
        studentName: student.name,
        sinNumber: student.sin_number || 'N/A',
        department: student.department || 'N/A',
        totalScore: session.totalScore,
        maxScore: session.maxScore,
        percentage,
        date: session.completedAt?.toISOString().split('T')[0] || session.createdAt?.toISOString().split('T')[0],
        completedAt: session.completedAt,
        status: percentage >= 60 ? 'Pass' : 'Fail',
        downloadUrl: `/api/student/download-report/${session.id}`
      };
    });

    res.json({
      success: true,
      results,
      studentInfo: {
        name: student.name,
        email: student.email,
        department: student.department || 'N/A'
      }
    });

  } catch (error) {
    console.error('Error fetching student test results:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch test results'
    });
  }
};

// Download individual test report
exports.downloadTestReport = async (req, res) => {
  try {
    const { sessionId } = req.params;
    console.log(`📄 Generating report for session: ${sessionId}`);
    
    // Get test session
    const testSession = await TestSession.findByPk(sessionId);
    if (!testSession) {
      console.log(`❌ Test session ${sessionId} not found`);
      return res.status(404).json({
        success: false,
        message: 'Test session not found'
      });
    }
    
    console.log(`✅ Found test session: ${testSession.testId}`);

    // Get test details
    const test = await Test.findOne({ where: { testId: testSession.testId } });
    
    // Get student details
    const student = await findStudentById(testSession.studentId);
    
    // Get section submissions for detailed results
    const sectionSubmissions = await SectionSubmission.findAll({
      where: { testSessionId: testSession.id }
    });

    // Get coding submissions
    const codingSubmissions = await CodeSubmission.findAll({
      where: { 
        testId: testSession.testId,
        studentId: testSession.studentId,
        isDryRun: false
      }
    });

    const percentage = testSession.maxScore > 0 ? 
      Math.round((testSession.totalScore / testSession.maxScore) * 100) : 0;

    // Create text-based report
    const reportContent = `
TEST PERFORMANCE REPORT
======================

STUDENT INFORMATION
------------------
Name: ${student?.name || 'Unknown Student'}
Email: ${student?.email || 'N/A'}
Department: ${student?.department || 'N/A'}
Student ID: ${testSession.studentId}

TEST INFORMATION
---------------
Test Name: ${test?.name || 'Unknown Test'}
Test ID: ${test?.testId || testSession.testId}
Description: ${test?.description || 'N/A'}

OVERALL RESULTS
--------------
Total Score: ${testSession.totalScore}/${testSession.maxScore}
Percentage: ${percentage}%
Result: ${percentage >= 60 ? 'PASS' : 'FAIL'}
Test Date: ${testSession.completedAt ? new Date(testSession.completedAt).toLocaleDateString() : 'N/A'}
Duration: ${testSession.completedAt && testSession.startedAt ? 
  Math.round((new Date(testSession.completedAt) - new Date(testSession.startedAt)) / (1000 * 60)) + ' minutes' : 'N/A'}

${sectionSubmissions.length > 0 ? `SECTION-WISE PERFORMANCE
-----------------------
${sectionSubmissions.map((submission, index) => {
  const sectionPercentage = submission.maxScore > 0 ? 
    Math.round((submission.score / submission.maxScore) * 100) : 0;
  return `Section ${index + 1}: ${submission.score}/${submission.maxScore} (${sectionPercentage}%)
Time Spent: ${submission.timeSpent || 0} minutes`;
}).join('\n\n')}

` : ''}${codingSubmissions.length > 0 ? `CODING PERFORMANCE
-----------------
${codingSubmissions.map((submission, index) => {
  const testResults = submission.testResults || {};
  const passedTests = testResults.passed || 0;
  const totalTests = testResults.total || 0;
  return `Problem ${index + 1}:
  Language: ${submission.language}
  Score: ${submission.score}/${submission.maxScore || 0}
  Test Cases: ${passedTests}/${totalTests} passed
  Status: ${submission.status}`;
}).join('\n\n')}

` : ''}Report generated on: ${new Date().toLocaleString()}
This is an official test report from MCQ Platform
`;

    // Set response headers for text file
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="Test_Report_${sessionId}.txt"`);
    
    console.log('✅ Sending text report');
    res.send(reportContent);

  } catch (error) {
    console.error('Error generating test report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate test report'
    });
  }
};

// Download overall performance report
exports.downloadOverallReport = async (req, res) => {
  try {
    const { studentId } = req.params;
    
    // Get student details
    const student = await findStudentById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Get all completed test sessions
    const testSessions = await TestSession.findAll({
      where: { 
        studentId: String(studentId),
        status: ['completed', 'submitted']
      },
      order: [['completedAt', 'DESC']]
    });

    // Get test details
    const testIds = [...new Set(testSessions.map(session => session.testId))];
    const tests = await Test.findAll({
      where: { testId: testIds }
    });
    const testMap = tests.reduce((map, test) => {
      map[test.testId] = test;
      return map;
    }, {});

    // Calculate statistics
    const totalTests = testSessions.length;
    const totalScore = testSessions.reduce((sum, session) => sum + (session.totalScore || 0), 0);
    const totalMaxScore = testSessions.reduce((sum, session) => sum + (session.maxScore || 100), 0);
    const averageScore = totalMaxScore > 0 ? Math.round((totalScore / totalMaxScore) * 100) : 0;
    
    const scores = testSessions.map(session => 
      Math.round(((session.totalScore || 0) / (session.maxScore || 100)) * 100)
    );
    const bestScore = scores.length > 0 ? Math.max(...scores) : 0;
    const worstScore = scores.length > 0 ? Math.min(...scores) : 0;

    // Create PDF
    const doc = new PDFDocument({ margin: 50 });
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Overall_Report_${student.name.replace(/\s+/g, '_')}.pdf"`);
    
    doc.pipe(res);

    // Header
    doc.fontSize(20).text('OVERALL PERFORMANCE REPORT', { align: 'center' });
    doc.moveDown();

    // Student Information
    doc.fontSize(14).text('STUDENT INFORMATION', { underline: true });
    doc.fontSize(12)
       .text(`Name: ${student.name}`)
       .text(`Email: ${student.email}`)
       .text(`Department: ${student.department || 'N/A'}`)
       .text(`User Type: ${student.userType === 'licensed' ? 'Licensed User' : 'Regular User'}`);
    
    doc.moveDown();

    // Performance Summary
    doc.fontSize(14).text('PERFORMANCE SUMMARY', { underline: true });
    doc.fontSize(12)
       .text(`Total Tests Completed: ${totalTests}`)
       .text(`Average Score: ${averageScore}%`)
       .text(`Best Score: ${bestScore}%`)
       .text(`Lowest Score: ${worstScore}%`)
       .text(`Overall Grade: ${averageScore >= 90 ? 'A' : averageScore >= 80 ? 'B' : averageScore >= 70 ? 'C' : averageScore >= 60 ? 'D' : 'F'}`);
    
    doc.moveDown();

    // Test History
    if (testSessions.length > 0) {
      doc.fontSize(14).text('TEST HISTORY', { underline: true });
      
      testSessions.forEach((session, index) => {
        const test = testMap[session.testId];
        const percentage = session.maxScore > 0 ? 
          Math.round((session.totalScore / session.maxScore) * 100) : 0;
        
        doc.fontSize(11)
           .text(`${index + 1}. ${test?.name || 'Unknown Test'}`)
           .text(`   Date: ${session.completedAt ? new Date(session.completedAt).toLocaleDateString() : 'N/A'}`)
           .text(`   Score: ${session.totalScore}/${session.maxScore} (${percentage}%)`)
           .text(`   Result: ${percentage >= 60 ? 'PASS' : 'FAIL'}`);
        
        if (index < testSessions.length - 1) doc.moveDown(0.5);
      });
      
      doc.moveDown();
    }

    // Performance Analysis
    doc.fontSize(14).text('PERFORMANCE ANALYSIS', { underline: true });
    doc.fontSize(12);
    
    if (totalTests === 0) {
      doc.text('No tests completed yet. Start taking tests to see your performance analysis.');
    } else if (averageScore >= 90) {
      doc.text('Excellent performance! You consistently achieve high scores.');
    } else if (averageScore >= 80) {
      doc.text('Very good performance with strong understanding of concepts.');
    } else if (averageScore >= 70) {
      doc.text('Good performance with room for improvement in some areas.');
    } else if (averageScore >= 60) {
      doc.text('Satisfactory performance. Focus on strengthening weak areas.');
    } else {
      doc.text('Performance needs improvement. Consider additional study and practice.');
    }

    doc.moveDown();

    // Recommendations
    doc.fontSize(14).text('RECOMMENDATIONS', { underline: true });
    doc.fontSize(12);
    
    if (totalTests < 3) {
      doc.text('• Take more tests to get a comprehensive performance analysis');
    }
    if (averageScore < 80) {
      doc.text('• Review fundamental concepts and practice regularly');
      doc.text('• Focus on time management during tests');
    }
    if (bestScore - worstScore > 30) {
      doc.text('• Work on consistency in preparation and performance');
    }
    if (averageScore >= 80) {
      doc.text('• Continue excellent work and help others improve');
      doc.text('• Challenge yourself with advanced topics');
    }

    doc.moveDown();

    // Footer
    doc.fontSize(10)
       .text(`Report generated on: ${new Date().toLocaleString()}`, { align: 'right' })
       .text('This is an official performance report from MCQ Platform', { align: 'center' });

    doc.end();

  } catch (error) {
    console.error('Error generating overall report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate overall report'
    });
  }
};