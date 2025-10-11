const { TestSession, SectionSubmission, StudentsResults, Test, Section, MCQ, CodingQuestion, User, LicensedUser, sequelize } = require('../models');
const { Op } = require('sequelize');

// Get test results for a specific test and student
exports.getTestResult = async (req, res) => {
  try {
    const { testId, studentId } = req.params;

    // First try to get from TestSession (section-based tests)
    let testResult = await TestSession.findOne({
      where: { testId, studentId },
      include: [{
        model: SectionSubmission,
        as: 'submissions',
        include: [{
          model: Section,
          as: 'section',
          include: [
            { model: MCQ },
            { model: CodingQuestion, as: 'codingQuestions' }
          ]
        }]
      }]
    });

    if (testResult) {
      // Get test details
      const test = await Test.findByPk(testId);
      
      // Format section-based test results
      const formattedResult = {
        testId: testResult.testId,
        testName: test?.name || 'Unknown Test',
        totalScore: testResult.totalScore,
        maxScore: testResult.maxScore,
        percentage: Math.round((testResult.totalScore / testResult.maxScore) * 100),
        status: testResult.status,
        completedAt: testResult.completedAt,
        startedAt: testResult.startedAt,
        hasMCQQuestions: false,
        hasCodingQuestions: false,
        mcqResults: {
          totalQuestions: 0,
          correctAnswers: 0,
          unansweredCount: 0,
          questions: []
        },
        codingResults: []
      };

      // Process section submissions
      for (const submission of testResult.submissions || []) {
        const mcqAnswers = JSON.parse(submission.mcqAnswers || '{}');
        const detailedCodingResults = JSON.parse(submission.detailedCodingResults || '[]');
        
        // Process MCQ results
        if (submission.section?.MCQs && submission.section.MCQs.length > 0) {
          formattedResult.hasMCQQuestions = true;
          for (const mcq of submission.section.MCQs) {
            formattedResult.mcqResults.totalQuestions++;
            const userAnswer = mcqAnswers[mcq.id];
            const isCorrect = userAnswer === mcq.correctOptionLetter;
            if (isCorrect) formattedResult.mcqResults.correctAnswers++;
            if (!userAnswer) formattedResult.mcqResults.unansweredCount++;
            
            formattedResult.mcqResults.questions.push({
              id: mcq.id,
              questionText: mcq.questionText,
              optionA: mcq.optionA,
              optionB: mcq.optionB,
              optionC: mcq.optionC,
              optionD: mcq.optionD,
              correctOption: mcq.correctOption,
              correctOptionLetter: mcq.correctOptionLetter,
              userAnswer: userAnswer || null,
              isCorrect,
              explanation: mcq.explanation
            });
          }
        }
        
        // Process coding results
        if (detailedCodingResults && detailedCodingResults.length > 0) {
          formattedResult.hasCodingQuestions = true;
          detailedCodingResults.forEach((codingResult, index) => {
            formattedResult.codingResults.push({
              questionNumber: index + 1,
              questionName: `Problem ${index + 1}`,
              problemStatement: codingResult.problemStatement?.substring(0, 100) + '...' || 'Coding Problem',
              testCasesPassed: codingResult.testCasesPassed || 0,
              totalTestCases: codingResult.totalTestCases || 0,
              score: codingResult.score || 0,
              maxScore: codingResult.maxScore || 0,
              language: codingResult.language || 'Unknown',
              status: codingResult.testCasesPassed === codingResult.totalTestCases ? 'All Passed' : 'Partial',
              percentage: codingResult.totalTestCases > 0 ? 
                Math.round((codingResult.testCasesPassed / codingResult.totalTestCases) * 100) : 0
            });
          });
        }
      }

      return res.json({
        success: true,
        testResult: formattedResult
      });
    }

    // If not found in TestSession, try StudentsResults (simple MCQ tests)
    testResult = await StudentsResults.findOne({
      where: { testId, userEmail: { [Op.like]: `%${studentId}%` } }
    });

    if (testResult) {
      const answers = JSON.parse(testResult.answers || '{}');
      
      // Get test and questions for detailed results
      const test = await Test.findByPk(testId, {
        include: [{
          model: Section,
          include: [{ model: MCQ }]
        }]
      });

      const formattedResult = {
        testId: testResult.testId,
        testName: testResult.testName,
        totalScore: testResult.totalScore,
        maxScore: testResult.maxScore,
        percentage: testResult.percentage,
        status: 'completed',
        completedAt: testResult.completedAt,
        startedAt: testResult.completedAt, // Use completedAt as startedAt for simple tests
        hasMCQQuestions: true,
        hasCodingQuestions: false,
        mcqResults: {
          totalQuestions: 0,
          correctAnswers: testResult.totalScore,
          unansweredCount: 0,
          questions: []
        },
        codingResults: []
      };

      // Process MCQ questions if test data is available
      if (test && test.Sections) {
        for (const section of test.Sections) {
          for (const mcq of section.MCQs || []) {
            formattedResult.mcqResults.totalQuestions++;
            const userAnswer = answers[mcq.id];
            const isCorrect = userAnswer === mcq.correctOptionLetter;
            if (!userAnswer) formattedResult.mcqResults.unansweredCount++;
            
            formattedResult.mcqResults.questions.push({
              id: mcq.id,
              questionText: mcq.questionText,
              optionA: mcq.optionA,
              optionB: mcq.optionB,
              optionC: mcq.optionC,
              optionD: mcq.optionD,
              correctOption: mcq.correctOption,
              correctOptionLetter: mcq.correctOptionLetter,
              userAnswer: userAnswer || null,
              isCorrect,
              explanation: mcq.explanation
            });
          }
        }
      }

      return res.json({
        success: true,
        testResult: formattedResult
      });
    }

    return res.status(404).json({
      success: false,
      error: 'Test result not found'
    });

  } catch (error) {
    console.error('Get test result error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get test result'
    });
  }
};

// Get all test results for a student
exports.getStudentTestResults = async (req, res) => {
  try {
    const { studentId } = req.params;

    // Get results from both TestSession and StudentsResults
    const [sessionResults, simpleResults] = await Promise.all([
      TestSession.findAll({
        where: { 
          studentId,
          status: ['completed', 'submitted']
        },
        include: [{
          model: Test,
          as: 'test',
          attributes: ['testId', 'name', 'description']
        }],
        order: [['completedAt', 'DESC']]
      }),
      StudentsResults.findAll({
        where: { 
          [Op.or]: [
            { userEmail: { [Op.like]: `%${studentId}%` } },
            { sinNumber: { [Op.like]: `%${studentId}%` } }
          ]
        },
        order: [['completedAt', 'DESC']]
      })
    ]);

    const allResults = [];

    // Format session-based results
    for (const session of sessionResults) {
      allResults.push({
        testId: session.testId,
        testName: session.test?.name || 'Unknown Test',
        totalScore: session.totalScore,
        maxScore: session.maxScore,
        percentage: Math.round((session.totalScore / session.maxScore) * 100),
        completedAt: session.completedAt,
        status: session.status,
        type: 'section-based'
      });
    }

    // Format simple test results
    for (const result of simpleResults) {
      allResults.push({
        testId: result.testId,
        testName: result.testName,
        totalScore: result.totalScore,
        maxScore: result.maxScore,
        percentage: result.percentage,
        completedAt: result.completedAt,
        status: 'completed',
        type: 'simple'
      });
    }

    // Sort by completion date
    allResults.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));

    res.json({
      success: true,
      results: allResults
    });

  } catch (error) {
    console.error('Get student test results error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get student test results'
    });
  }
};

// Get all test results for admin reports
exports.getAllTestResults = async (req, res) => {
  try {
    const { testId, limit = 100, offset = 0 } = req.query;

    const whereClause = testId ? { testId } : {};

    // Get results from both sources
    const [sessionResults, simpleResults] = await Promise.all([
      TestSession.findAll({
        where: {
          ...whereClause,
          status: ['completed', 'submitted']
        },
        include: [{
          model: Test,
          as: 'test',
          attributes: ['testId', 'name', 'description']
        }],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['completedAt', 'DESC']]
      }),
      StudentsResults.findAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['completedAt', 'DESC']]
      })
    ]);

    const allResults = [];

    // Format session-based results
    for (const session of sessionResults) {
      // Get student details
      let student = null;
      try {
        student = await LicensedUser.findByPk(session.studentId);
      } catch (error) {
        try {
          const numericId = parseInt(session.studentId);
          if (!isNaN(numericId)) {
            student = await User.findByPk(numericId);
          }
        } catch (e) {
          console.log('Could not find student:', session.studentId);
        }
      }

      allResults.push({
        testId: session.testId,
        testName: session.test?.name || 'Unknown Test',
        studentId: session.studentId,
        studentName: student?.name || 'Unknown Student',
        studentEmail: student?.email || 'N/A',
        department: student?.department || 'N/A',
        totalScore: session.totalScore,
        maxScore: session.maxScore,
        percentage: Math.round((session.totalScore / session.maxScore) * 100),
        completedAt: session.completedAt,
        status: session.status,
        type: 'section-based'
      });
    }

    // Format simple test results
    for (const result of simpleResults) {
      allResults.push({
        testId: result.testId,
        testName: result.testName,
        studentId: result.sinNumber || result.userEmail,
        studentName: result.studentName,
        studentEmail: result.userEmail,
        department: result.department,
        totalScore: result.totalScore,
        maxScore: result.maxScore,
        percentage: result.percentage,
        completedAt: result.completedAt,
        status: 'completed',
        type: 'simple'
      });
    }

    // Sort by completion date
    allResults.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));

    res.json({
      success: true,
      results: allResults,
      total: allResults.length
    });

  } catch (error) {
    console.error('Get all test results error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get test results'
    });
  }
};