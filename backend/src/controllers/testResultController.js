const { TestSession, Test, Section, MCQ, CodingQuestion, CodeSubmission, SectionScore, User, LicensedUser } = require('../models');
const PDFDocument = require('pdfkit');

/**
 * Get comprehensive test results for a student
 */
exports.getTestResults = async (req, res) => {
  try {
    const { testId, studentId } = req.params;

    // Get test session
    const testSession = await TestSession.findOne({
      where: { testId, studentId },
      include: [{
        model: Test,
        as: 'test',
        attributes: ['name', 'description']
      }]
    });

    if (!testSession) {
      return res.status(404).json({
        success: false,
        error: 'Test session not found'
      });
    }

    // Get test details with sections
    const test = await Test.findByPk(testId, {
      include: [{
        model: Section,
        as: 'sections',
        include: [
          { model: MCQ, as: 'questions' },
          { model: CodingQuestion, as: 'codingQuestions' }
        ]
      }]
    });

    const results = {
      testId,
      testName: test.name,
      totalScore: testSession.totalScore || 0,
      maxScore: testSession.maxScore || 0,
      percentage: 0,
      hasCodingQuestions: false,
      hasMCQQuestions: false,
      codingResults: [],
      mcqResults: null,
      completedAt: testSession.completedAt,
      status: testSession.status,
      startedAt: testSession.createdAt
    };

    // Calculate percentage
    if (results.maxScore > 0) {
      results.percentage = Math.round((results.totalScore / results.maxScore) * 100);
    }
    
    console.log(`📊 Test Results Debug - Student: ${studentId}, Test: ${testId}`);
    console.log(`📊 Scores - Total: ${results.totalScore}, Max: ${results.maxScore}, Percentage: ${results.percentage}%`);
    console.log(`📊 Session Status: ${testSession.status}, Completed: ${testSession.completedAt}`);
    console.log(`📊 Has Coding: ${results.hasCodingQuestions}, Has MCQ: ${results.hasMCQQuestions}`);
    
    // Always use session scores as primary source
    if (testSession.totalScore !== null && testSession.totalScore !== undefined) {
      results.totalScore = testSession.totalScore;
    }
    if (testSession.maxScore !== null && testSession.maxScore !== undefined) {
      results.maxScore = testSession.maxScore;
    }
    
    // Recalculate percentage with session data
    if (results.maxScore > 0) {
      results.percentage = Math.round((results.totalScore / results.maxScore) * 100);
    }
    
    console.log(`📊 Final Scores - Total: ${results.totalScore}, Max: ${results.maxScore}, Percentage: ${results.percentage}%`);

    // Get coding submissions and results
    const codingSubmissions = await CodeSubmission.findAll({
      where: { testId, studentId, isDryRun: false },
      include: [{
        model: CodingQuestion,
        as: 'codingQuestion'
      }],
      order: [['codingQuestionId', 'ASC']]
    });

    if (codingSubmissions.length > 0) {
      results.hasCodingQuestions = true;
      results.codingResults = codingSubmissions.map(submission => {
        const testResults = submission.testResults || [];
        const passedTests = testResults.filter(t => t.passed).length;
        const totalTests = testResults.length;
        const percentage = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;
        
        // Determine status based on test results
        let status = 'Failed';
        if (percentage === 100) {
          status = 'All Passed';
        } else if (percentage >= 50) {
          status = 'Partially Passed';
        } else if (percentage > 0) {
          status = 'Some Passed';
        }
        
        // Calculate grade based on percentage
        let grade = 'F';
        if (percentage >= 90) grade = 'A+';
        else if (percentage >= 85) grade = 'A';
        else if (percentage >= 80) grade = 'A-';
        else if (percentage >= 75) grade = 'B+';
        else if (percentage >= 70) grade = 'B';
        else if (percentage >= 65) grade = 'B-';
        else if (percentage >= 60) grade = 'C+';
        else if (percentage >= 55) grade = 'C';
        else if (percentage >= 50) grade = 'C-';
        else if (percentage >= 40) grade = 'D';
        
        return {
          submissionId: submission.id,
          questionNumber: submission.codingQuestionId,
          questionName: submission.codingQuestion?.title || `Problem ${submission.codingQuestionId}`,
          problemStatement: submission.codingQuestion?.problemStatement || '',
          testCasesPassed: passedTests,
          totalTestCases: totalTests,
          score: submission.score || 0,
          maxScore: submission.codingQuestion?.marks || 0,
          language: submission.language,
          status,
          grade,
          percentage,
          userCode: submission.code,
          testResults: testResults.map((tr, index) => ({
            testCaseNumber: index + 1,
            input: tr.input,
            expectedOutput: tr.expectedOutput,
            actualOutput: tr.actualOutput,
            passed: tr.passed,
            error: tr.error,
            executionTime: tr.executionTime || 0
          })),
          executionTime: submission.executionTime,
          memoryUsed: submission.memoryUsed,
          errorMessage: submission.errorMessage,
          submittedAt: submission.createdAt,
          compilationError: submission.errorMessage && submission.errorMessage.includes('compilation'),
          runtimeError: submission.errorMessage && submission.errorMessage.includes('runtime')
        };
      });
    }

    // Get MCQ results from section scores
    const sectionScores = await SectionScore.findAll({
      where: { testSessionId: testSession.id },
      include: [{
        model: Section,
        as: 'section',
        include: [{
          model: MCQ,
          as: 'questions'
        }]
      }]
    });

    const mcqSections = sectionScores.filter(ss => ss.section?.questions?.length > 0);
    if (mcqSections.length > 0) {
      results.hasMCQQuestions = true;
      
      let totalQuestions = 0;
      let correctAnswers = 0;
      let unansweredCount = 0;
      const allQuestions = [];

      mcqSections.forEach(sectionScore => {
        const questions = sectionScore.section.questions || [];
        const answers = sectionScore.answers || {};
        const unanswered = sectionScore.unansweredQuestions || [];

        questions.forEach(question => {
          totalQuestions++;
          const userAnswer = answers[question.id];
          const isCorrect = userAnswer === question.correctOptionLetter;
          const isUnanswered = unanswered.includes(question.id);

          if (isUnanswered) {
            unansweredCount++;
          } else if (isCorrect) {
            correctAnswers++;
          }

          allQuestions.push({
            id: question.id,
            questionText: question.questionText,
            questionImage: question.questionImage,
            optionA: question.optionA,
            optionAImage: question.optionAImage,
            optionB: question.optionB,
            optionBImage: question.optionBImage,
            optionC: question.optionC,
            optionCImage: question.optionCImage,
            optionD: question.optionD,
            optionDImage: question.optionDImage,
            correctOption: question.correctOption,
            correctOptionLetter: question.correctOptionLetter,
            explanation: question.explanation,
            userAnswer,
            isCorrect,
            isUnanswered
          });
        });
      });

      const wrongAnswers = totalQuestions - correctAnswers - unansweredCount;
      const accuracyRate = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
      
      results.mcqResults = {
        totalQuestions,
        correctAnswers,
        wrongAnswers,
        unansweredCount,
        accuracyRate,
        questions: allQuestions,
        performance: {
          excellent: correctAnswers >= totalQuestions * 0.9,
          good: correctAnswers >= totalQuestions * 0.7,
          average: correctAnswers >= totalQuestions * 0.5,
          needsImprovement: correctAnswers < totalQuestions * 0.5
        }
      };
    }

    // Add overall coding statistics
    if (results.hasCodingQuestions) {
      const totalCodingTests = results.codingResults.reduce((sum, cr) => sum + cr.totalTestCases, 0);
      const totalPassedTests = results.codingResults.reduce((sum, cr) => sum + cr.testCasesPassed, 0);
      const totalCodingScore = results.codingResults.reduce((sum, cr) => sum + cr.score, 0);
      const totalCodingMaxScore = results.codingResults.reduce((sum, cr) => sum + cr.maxScore, 0);
      
      results.codingStatistics = {
        totalQuestions: results.codingResults.length,
        totalTestCases: totalCodingTests,
        totalPassedTestCases: totalPassedTests,
        testCaseSuccessRate: totalCodingTests > 0 ? Math.round((totalPassedTests / totalCodingTests) * 100) : 0,
        totalScore: totalCodingScore,
        totalMaxScore: totalCodingMaxScore,
        averageScore: results.codingResults.length > 0 ? Math.round(totalCodingScore / results.codingResults.length) : 0,
        questionsFullyPassed: results.codingResults.filter(cr => cr.percentage === 100).length,
        questionsPartiallyPassed: results.codingResults.filter(cr => cr.percentage > 0 && cr.percentage < 100).length,
        questionsFailed: results.codingResults.filter(cr => cr.percentage === 0).length
      };
    }

    res.json({
      success: true,
      results
    });

  } catch (error) {
    console.error('Error getting test results:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get test results',
      message: error.message
    });
  }
};

/**
 * Get coding test case details for a specific submission
 */
exports.getCodingTestCaseDetails = async (req, res) => {
  try {
    const { submissionId } = req.params;

    const submission = await CodeSubmission.findByPk(submissionId, {
      include: [{
        model: CodingQuestion,
        as: 'codingQuestion'
      }]
    });

    if (!submission) {
      return res.status(404).json({
        success: false,
        error: 'Submission not found'
      });
    }

    const testResults = submission.testResults || [];
    const passedTests = testResults.filter(t => t.passed).length;
    const totalTests = testResults.length;
    const percentage = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;

    // Calculate grade
    let grade = 'F';
    if (percentage >= 90) grade = 'A+';
    else if (percentage >= 85) grade = 'A';
    else if (percentage >= 80) grade = 'A-';
    else if (percentage >= 75) grade = 'B+';
    else if (percentage >= 70) grade = 'B';
    else if (percentage >= 65) grade = 'B-';
    else if (percentage >= 60) grade = 'C+';
    else if (percentage >= 55) grade = 'C';
    else if (percentage >= 50) grade = 'C-';
    else if (percentage >= 40) grade = 'D';

    res.json({
      success: true,
      submission: {
        id: submission.id,
        questionName: submission.codingQuestion?.title || 'Coding Problem',
        problemStatement: submission.codingQuestion?.problemStatement,
        language: submission.language,
        code: submission.code,
        status: submission.status,
        score: submission.score,
        maxScore: submission.codingQuestion?.marks || 0,
        executionTime: submission.executionTime,
        memoryUsed: submission.memoryUsed,
        testCasesPassed: passedTests,
        totalTestCases: totalTests,
        percentage,
        grade,
        testResults: testResults.map((tr, index) => ({
          testCase: index + 1,
          input: tr.input || 'No input',
          expectedOutput: tr.expectedOutput || 'No expected output',
          actualOutput: tr.actualOutput || 'No output',
          passed: tr.passed,
          error: tr.error || null,
          executionTime: tr.executionTime || 0,
          status: tr.passed ? 'PASS' : 'FAIL'
        })),
        errorMessage: submission.errorMessage,
        submittedAt: submission.createdAt,
        studentName: submission.studentName,
        studentEmail: submission.studentEmail,
        compilationError: submission.errorMessage && submission.errorMessage.includes('compilation'),
        runtimeError: submission.errorMessage && submission.errorMessage.includes('runtime')
      }
    });

  } catch (error) {
    console.error('Error getting coding test case details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get test case details',
      message: error.message
    });
  }
};

/**
 * Download coding test results as detailed report
 */
exports.downloadCodingTestReport = async (req, res) => {
  try {
    const { testId, studentId } = req.params;
    const { format = 'json' } = req.query;

    // Get test session
    const testSession = await TestSession.findOne({
      where: { testId, studentId },
      include: [{
        model: Test,
        as: 'test',
        attributes: ['name', 'description']
      }]
    });

    if (!testSession) {
      return res.status(404).json({
        success: false,
        error: 'Test session not found'
      });
    }

    // Get coding submissions
    const codingSubmissions = await CodeSubmission.findAll({
      where: { testId, studentId, isDryRun: false },
      include: [{
        model: CodingQuestion,
        as: 'codingQuestion'
      }],
      order: [['codingQuestionId', 'ASC']]
    });

    // Get student info
    let student = null;
    try {
      student = await LicensedUser.findByPk(studentId) || await User.findByPk(studentId);
    } catch (error) {
      console.log('Student lookup failed:', error.message);
    }

    // Process coding results
    const codingResults = codingSubmissions.map(submission => {
      const testResults = submission.testResults || [];
      const passedTests = testResults.filter(t => t.passed).length;
      const totalTests = testResults.length;
      const percentage = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;
      
      return {
        submissionId: submission.id,
        questionNumber: submission.codingQuestionId,
        questionName: submission.codingQuestion?.title || `Problem ${submission.codingQuestionId}`,
        problemStatement: submission.codingQuestion?.problemStatement || '',
        testCasesPassed: passedTests,
        totalTestCases: totalTests,
        score: submission.score || 0,
        maxScore: submission.codingQuestion?.marks || 0,
        language: submission.language,
        percentage,
        userCode: submission.code,
        testResults: testResults.map((tr, index) => ({
          testCaseNumber: index + 1,
          input: tr.input,
          expectedOutput: tr.expectedOutput,
          actualOutput: tr.actualOutput,
          passed: tr.passed,
          error: tr.error,
          executionTime: tr.executionTime || 0
        })),
        executionTime: submission.executionTime,
        memoryUsed: submission.memoryUsed,
        errorMessage: submission.errorMessage,
        submittedAt: submission.createdAt
      };
    });

    const reportData = {
      reportGeneratedAt: new Date().toISOString(),
      testInfo: {
        testId,
        testName: testSession.test?.name || 'Unknown Test',
        completedAt: testSession.completedAt
      },
      studentInfo: {
        studentId,
        name: student?.name || 'Unknown Student',
        email: student?.email || 'N/A',
        department: student?.department || 'N/A'
      },
      overallResults: {
        totalScore: testSession.totalScore || 0,
        maxScore: testSession.maxScore || 0,
        percentage: testSession.maxScore > 0 ? Math.round((testSession.totalScore / testSession.maxScore) * 100) : 0,
        status: testSession.status || 'unknown'
      },
      codingResults,
      summary: {
        totalQuestions: codingResults.length,
        totalTestCases: codingResults.reduce((sum, cr) => sum + cr.totalTestCases, 0),
        totalPassedTestCases: codingResults.reduce((sum, cr) => sum + cr.testCasesPassed, 0),
        averageScore: codingResults.length > 0 ? Math.round(codingResults.reduce((sum, cr) => sum + cr.score, 0) / codingResults.length) : 0
      }
    };

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="coding_test_report_${testId}_${studentId}.json"`);
      res.json(reportData);
    } else {
      res.json({ success: true, data: reportData });
    }

  } catch (error) {
    console.error('Error downloading coding test report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate report',
      message: error.message
    });
  }
};