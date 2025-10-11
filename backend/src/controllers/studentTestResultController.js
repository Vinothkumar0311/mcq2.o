const { TestSession, SectionSubmission, CodeSubmission, Test, Section, MCQ, CodingQuestion, User, LicensedUser } = require('../models');
const { findStudentById } = require('../utils/studentLookup');

// Get detailed student test results with proper coding display
exports.getStudentTestResults = async (req, res) => {
  try {
    const { testId, studentId } = req.params;
    
    // Get test session
    const testSession = await TestSession.findOne({
      where: { testId, studentId, status: 'completed' }
    });
    
    if (!testSession) {
      return res.status(404).json({
        success: false,
        message: 'Test results not found'
      });
    }
    
    // Get test details
    const test = await Test.findOne({
      where: { testId }
    });
    
    // Get sections separately
    const sections = await Section.findAll({
      where: { testId },
      order: [['id', 'ASC']]
    });
    
    // Get MCQs and Coding Questions for each section
    for (const section of sections) {
      if (section.type === 'MCQ') {
        section.MCQs = await MCQ.findAll({ where: { sectionId: section.id } });
        section.CodingQuestions = [];
      } else if (section.type === 'CODING') {
        section.CodingQuestions = await CodingQuestion.findAll({ where: { sectionId: section.id } });
        section.MCQs = [];
      }
    }
    
    test.Sections = sections;
    
    // Get section submissions
    const sectionSubmissions = await SectionSubmission.findAll({
      where: { testSessionId: testSession.id },
      order: [['sectionIndex', 'ASC']]
    });
    
    // Get coding submissions
    const codingSubmissions = await CodeSubmission.findAll({
      where: { testId, studentId, isDryRun: false }
    });
    
    // Format results by section
    const sectionResults = [];
    
    for (const section of test.Sections) {
      const sectionSubmission = sectionSubmissions.find(s => s.sectionId === section.id);
      
      if (section.type === 'MCQ') {
        // MCQ Section Results
        const mcqAnswers = sectionSubmission?.mcqAnswers || {};
        const mcqs = section.MCQs || [];
        
        let correctCount = 0;
        let wrongCount = 0;
        let skippedCount = 0;
        
        const questionResults = mcqs.map(mcq => {
          const studentAnswer = mcqAnswers[mcq.id];
          const isCorrect = studentAnswer === mcq.correctOptionLetter;
          
          if (!studentAnswer) {
            skippedCount++;
            return { questionId: mcq.id, status: 'skipped', studentAnswer: null, correctAnswer: mcq.correctOptionLetter };
          } else if (isCorrect) {
            correctCount++;
            return { questionId: mcq.id, status: 'correct', studentAnswer, correctAnswer: mcq.correctOptionLetter };
          } else {
            wrongCount++;
            return { questionId: mcq.id, status: 'wrong', studentAnswer, correctAnswer: mcq.correctOptionLetter };
          }
        });
        
        sectionResults.push({
          sectionId: section.id,
          sectionName: section.name,
          sectionType: 'MCQ',
          score: sectionSubmission?.score || 0,
          maxScore: sectionSubmission?.maxScore || 0,
          timeSpent: sectionSubmission?.timeSpent || 0,
          mcqResults: {
            totalQuestions: mcqs.length,
            correctCount,
            wrongCount,
            skippedCount,
            questionResults
          }
        });
        
      } else if (section.type === 'CODING') {
        // Coding Section Results
        const codingQuestions = section.CodingQuestions || [];
        const codingResults = [];
        
        for (const question of codingQuestions) {
          const submission = codingSubmissions.find(s => s.codingQuestionId === question.id);
          
          if (submission) {
            const testResults = submission.testResults || [];
            const totalTestCases = testResults.length;
            const passedTestCases = testResults.filter(t => t.passed).length;
            const failedTestCases = totalTestCases - passedTestCases;
            
            codingResults.push({
              questionId: question.id,
              questionTitle: `Problem ${codingResults.length + 1}`,
              problemStatement: question.problemStatement.substring(0, 100) + '...',
              language: submission.language,
              status: submission.status,
              score: submission.score,
              maxScore: question.marks,
              testCaseResults: {
                totalTestCases,
                passedTestCases,
                failedTestCases,
                percentage: totalTestCases > 0 ? Math.round((passedTestCases / totalTestCases) * 100) : 0
              },
              executionTime: submission.executionTime,
              submittedAt: submission.createdAt
            });
          } else {
            codingResults.push({
              questionId: question.id,
              questionTitle: `Problem ${codingResults.length + 1}`,
              problemStatement: question.problemStatement.substring(0, 100) + '...',
              status: 'not_attempted',
              score: 0,
              maxScore: question.marks,
              testCaseResults: {
                totalTestCases: 0,
                passedTestCases: 0,
                failedTestCases: 0,
                percentage: 0
              }
            });
          }
        }
        
        sectionResults.push({
          sectionId: section.id,
          sectionName: section.name,
          sectionType: 'CODING',
          score: sectionSubmission?.score || 0,
          maxScore: sectionSubmission?.maxScore || 0,
          timeSpent: sectionSubmission?.timeSpent || 0,
          codingResults
        });
      }
    }
    
    // Get student details using utility function
    const student = await findStudentById(studentId);
    
    const finalResults = {
      testInfo: {
        testId: test.testId,
        testName: test.name,
        description: test.description
      },
      studentInfo: {
        studentId,
        name: student?.name || 'Unknown Student',
        email: student?.email || 'N/A'
      },
      overallResults: {
        totalScore: testSession.totalScore,
        maxScore: testSession.maxScore,
        percentage: testSession.maxScore > 0 ? Math.round((testSession.totalScore / testSession.maxScore) * 100) : 0,
        status: testSession.maxScore > 0 && (testSession.totalScore / testSession.maxScore) * 100 >= 60 ? 'Pass' : 'Fail',
        completedAt: testSession.completedAt,
        timeTaken: testSession.completedAt && testSession.startedAt ? 
          Math.round((new Date(testSession.completedAt) - new Date(testSession.startedAt)) / (1000 * 60)) : 0
      },
      sectionResults
    };
    
    res.json({
      success: true,
      data: finalResults
    });
    
  } catch (error) {
    console.error('Error fetching student test results:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch test results'
    });
  }
};

// Download student test result as PDF
exports.downloadStudentResult = async (req, res) => {
  try {
    const { testId, studentId } = req.params;
    const { format = 'pdf' } = req.query;
    
    // Get test results
    const mockReq = { params: { testId, studentId } };
    const mockRes = {
      json: (data) => {
        if (!data.success) {
          return res.status(404).json(data);
        }
        
        const results = data.data;
        
        if (format === 'json') {
          return res.json({
            success: true,
            data: results
          });
        }
        
        // Generate PDF report
        const PDFDocument = require('pdfkit');
        const doc = new PDFDocument({ margin: 40 });
        
        const filename = `${results.studentInfo.name}_${results.testInfo.testName}_Result.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        
        doc.pipe(res);
        
        // Header
        doc.fontSize(18).text('TEST RESULT REPORT', { align: 'center' });
        doc.moveDown();
        
        // Student Info
        doc.fontSize(12)
           .text(`Student: ${results.studentInfo.name}`)
           .text(`Email: ${results.studentInfo.email}`)
           .text(`Test: ${results.testInfo.testName}`)
           .text(`Score: ${results.overallResults.totalScore}/${results.overallResults.maxScore} (${results.overallResults.percentage}%)`)
           .text(`Status: ${results.overallResults.status}`)
           .text(`Time Taken: ${results.overallResults.timeTaken} minutes`);
        
        doc.moveDown();
        
        // Section Results
        results.sectionResults.forEach(section => {
          doc.fontSize(14).text(`${section.sectionName} (${section.sectionType})`, { underline: true });
          doc.fontSize(12).text(`Score: ${section.score}/${section.maxScore}`);
          
          if (section.sectionType === 'MCQ') {
            const mcq = section.mcqResults;
            doc.text(`Correct: ${mcq.correctCount}, Wrong: ${mcq.wrongCount}, Skipped: ${mcq.skippedCount}`);
          } else if (section.sectionType === 'CODING') {
            section.codingResults.forEach((coding, index) => {
              doc.text(`${coding.questionTitle}: ${coding.testCaseResults.passedTestCases}/${coding.testCaseResults.totalTestCases} test cases passed (${coding.score}/${coding.maxScore} marks)`);
            });
          }
          
          doc.moveDown();
        });
        
        doc.end();
      }
    };
    
    await this.getStudentTestResults(mockReq, mockRes);
    
  } catch (error) {
    console.error('Error downloading student result:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download result'
    });
  }
};