const { TestSession, SectionSubmission, StudentsResults, Test, Section, MCQ, CodingQuestion, CodeSubmission, User, LicensedUser, sequelize } = require('../models');
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
      
      // Check if results are released by admin
      if (!testResult.resultsReleased) {
        return res.json({
          success: true,
          resultsPending: true,
          testCompleted: true,
          testResult: {
            testId: testResult.testId,
            testName: test?.name || 'Unknown Test',
            status: 'completed',
            completedAt: testResult.completedAt,
            message: '✅ Test Completed Successfully!',
            subMessage: 'Your results will be available once released by the admin.',
            showLogo: true,
            resultsReleased: false
          }
        });
      }
      
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
        resultsReleased: testResult.resultsReleased,
        mcqResults: {
          totalQuestions: 0,
          correctAnswers: 0,
          wrongAnswers: 0,
          unansweredCount: 0,
          accuracyRate: 0,
          questions: [],
          performance: {
            excellent: false,
            good: false,
            average: false,
            needsImprovement: false
          }
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
              questionText: mcq.questionText || 'Question text not available',
              questionImage: mcq.questionImage,
              optionA: mcq.optionA || 'Option A',
              optionAImage: mcq.optionAImage,
              optionB: mcq.optionB || 'Option B',
              optionBImage: mcq.optionBImage,
              optionC: mcq.optionC || 'Option C',
              optionCImage: mcq.optionCImage,
              optionD: mcq.optionD || 'Option D',
              optionDImage: mcq.optionDImage,
              correctOption: mcq.correctOption || mcq.correctOptionLetter || 'A',
              correctOptionLetter: mcq.correctOptionLetter || 'A',
              userAnswer: userAnswer || null,
              isCorrect,
              isUnanswered: !userAnswer,
              explanation: mcq.explanation || `The correct answer is ${mcq.correctOptionLetter || 'A'}.`
            });
          }
        }
        
        // Process coding results from actual CodeSubmission records
        if (submission.section?.codingQuestions && submission.section.codingQuestions.length > 0) {
          formattedResult.hasCodingQuestions = true;
          
          // Get actual code submissions for this test and student
          const codeSubmissions = await CodeSubmission.findAll({
            where: { 
              testId: testResult.testId, 
              studentId: testResult.studentId,
              isDryRun: false 
            },
            include: [{
              model: CodingQuestion,
              as: 'codingQuestion'
            }],
            order: [['codingQuestionId', 'ASC']]
          });
          
          // Process each code submission if found
          if (codeSubmissions && codeSubmissions.length > 0) {
            for (const codeSubmission of codeSubmissions) {
            const testResults = codeSubmission.testResults || [];
            const passedTests = testResults.filter(t => t.passed).length;
            const totalTests = testResults.length;
            const percentage = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;
            
            // Determine status
            let status = 'Failed';
            if (percentage === 100) {
              status = 'All Passed';
            } else if (percentage >= 50) {
              status = 'Partially Passed';
            } else if (percentage > 0) {
              status = 'Some Passed';
            }
            
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
            
            formattedResult.codingResults.push({
              submissionId: codeSubmission.id,
              questionNumber: codeSubmission.codingQuestionId,
              questionName: codeSubmission.codingQuestion?.title || `Problem ${codeSubmission.codingQuestionId}`,
              problemStatement: codeSubmission.codingQuestion?.problemStatement || '',
              testCasesPassed: passedTests,
              totalTestCases: totalTests,
              score: codeSubmission.score || 0,
              maxScore: codeSubmission.codingQuestion?.marks || 0,
              language: codeSubmission.language,
              status,
              grade,
              percentage,
              userCode: codeSubmission.code,
              testResults: testResults.map((tr, index) => ({
                testCaseNumber: index + 1,
                input: tr.input,
                expectedOutput: tr.expectedOutput,
                actualOutput: tr.actualOutput,
                passed: tr.passed,
                error: tr.error,
                executionTime: tr.executionTime || 0
              })),
              executionTime: codeSubmission.executionTime,
              memoryUsed: codeSubmission.memoryUsed,
              errorMessage: codeSubmission.errorMessage,
              submittedAt: codeSubmission.createdAt,
              compilationError: codeSubmission.errorMessage && codeSubmission.errorMessage.includes('compilation'),
              runtimeError: codeSubmission.errorMessage && codeSubmission.errorMessage.includes('runtime')
            });
            }
          } else {
            // Fallback: Use detailedCodingResults from section submission if CodeSubmission records are missing
            console.log('⚠️ No CodeSubmission records found, using fallback data from section submission');
            if (detailedCodingResults && detailedCodingResults.length > 0) {
              detailedCodingResults.forEach((codingResult, index) => {
                const testResults = codingResult.testResults || [];
                const passedTests = testResults.filter(t => t.passed).length;
                const totalTests = testResults.length;
                const percentage = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;
                
                let status = 'Failed';
                if (percentage === 100) status = 'All Passed';
                else if (percentage >= 50) status = 'Partially Passed';
                else if (percentage > 0) status = 'Some Passed';
                
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
                
                formattedResult.codingResults.push({
                  submissionId: index + 1,
                  questionNumber: index + 1,
                  questionName: codingResult.questionName || `Problem ${index + 1}`,
                  problemStatement: codingResult.problemStatement || 'Coding Problem',
                  testCasesPassed: passedTests,
                  totalTestCases: totalTests,
                  score: codingResult.score || 0,
                  maxScore: codingResult.maxScore || 0,
                  language: codingResult.language || 'Unknown',
                  status,
                  grade,
                  percentage,
                  userCode: codingResult.code || codingResult.userCode || '// Code not available',
                  testResults: testResults.map((tr, tcIndex) => ({
                    testCaseNumber: tcIndex + 1,
                    input: tr.input || 'No input',
                    expectedOutput: tr.expectedOutput || 'No expected output',
                    actualOutput: tr.actualOutput || 'No output',
                    passed: tr.passed || false,
                    error: tr.error || null,
                    executionTime: tr.executionTime || 0
                  })),
                  executionTime: codingResult.executionTime || 0,
                  memoryUsed: codingResult.memoryUsed || 0,
                  errorMessage: codingResult.errorMessage || null,
                  submittedAt: codingResult.submittedAt || new Date().toISOString(),
                  compilationError: codingResult.errorMessage && codingResult.errorMessage.includes('compilation'),
                  runtimeError: codingResult.errorMessage && codingResult.errorMessage.includes('runtime')
                });
              });
            }
          }
        }
      }

      // Calculate overall coding statistics if coding questions exist
      if (formattedResult.hasCodingQuestions && formattedResult.codingResults.length > 0) {
        const totalCodingTests = formattedResult.codingResults.reduce((sum, cr) => sum + cr.totalTestCases, 0);
        const totalPassedTests = formattedResult.codingResults.reduce((sum, cr) => sum + cr.testCasesPassed, 0);
        const totalCodingScore = formattedResult.codingResults.reduce((sum, cr) => sum + cr.score, 0);
        const totalCodingMaxScore = formattedResult.codingResults.reduce((sum, cr) => sum + cr.maxScore, 0);
        
        formattedResult.codingStatistics = {
          totalQuestions: formattedResult.codingResults.length,
          totalTestCases: totalCodingTests,
          totalPassedTestCases: totalPassedTests,
          testCaseSuccessRate: totalCodingTests > 0 ? Math.round((totalPassedTests / totalCodingTests) * 100) : 0,
          totalScore: totalCodingScore,
          totalMaxScore: totalCodingMaxScore,
          averageScore: formattedResult.codingResults.length > 0 ? Math.round(totalCodingScore / formattedResult.codingResults.length) : 0,
          questionsFullyPassed: formattedResult.codingResults.filter(cr => cr.percentage === 100).length,
          questionsPartiallyPassed: formattedResult.codingResults.filter(cr => cr.percentage > 0 && cr.percentage < 100).length,
          questionsFailed: formattedResult.codingResults.filter(cr => cr.percentage === 0).length
        };
      }

      // Calculate MCQ performance metrics
      if (formattedResult.hasMCQQuestions && formattedResult.mcqResults.totalQuestions > 0) {
        const totalQuestions = formattedResult.mcqResults.totalQuestions;
        const correctAnswers = formattedResult.mcqResults.correctAnswers;
        const wrongAnswers = totalQuestions - correctAnswers - formattedResult.mcqResults.unansweredCount;
        
        formattedResult.mcqResults.wrongAnswers = wrongAnswers;
        formattedResult.mcqResults.accuracyRate = Math.round((correctAnswers / totalQuestions) * 100);
        formattedResult.mcqResults.performance = {
          excellent: correctAnswers >= totalQuestions * 0.9,
          good: correctAnswers >= totalQuestions * 0.7,
          average: correctAnswers >= totalQuestions * 0.5,
          needsImprovement: correctAnswers < totalQuestions * 0.5
        };
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
      // Check if results are released by admin
      if (!testResult.resultsReleased) {
        return res.json({
          success: true,
          resultsPending: true,
          testCompleted: true,
          testResult: {
            testId: testResult.testId,
            testName: testResult.testName,
            status: 'completed',
            completedAt: testResult.completedAt,
            message: '✅ Test Completed Successfully!',
            subMessage: 'Your results will be available once released by the admin.',
            showLogo: true,
            resultsReleased: false
          }
        });
      }
      
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
          wrongAnswers: 0,
          unansweredCount: 0,
          accuracyRate: 0,
          questions: [],
          performance: {
            excellent: false,
            good: false,
            average: false,
            needsImprovement: false
          }
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
              questionText: mcq.questionText || 'Question text not available',
              questionImage: mcq.questionImage,
              optionA: mcq.optionA || 'Option A',
              optionAImage: mcq.optionAImage,
              optionB: mcq.optionB || 'Option B',
              optionBImage: mcq.optionBImage,
              optionC: mcq.optionC || 'Option C',
              optionCImage: mcq.optionCImage,
              optionD: mcq.optionD || 'Option D',
              optionDImage: mcq.optionDImage,
              correctOption: mcq.correctOption || mcq.correctOptionLetter || 'A',
              correctOptionLetter: mcq.correctOptionLetter || 'A',
              userAnswer: userAnswer || null,
              isCorrect,
              isUnanswered: !userAnswer,
              explanation: mcq.explanation || `The correct answer is ${mcq.correctOptionLetter || 'A'}.`
            });
          }
        }
      }

      // Calculate MCQ performance metrics for simple tests
      if (formattedResult.mcqResults.totalQuestions > 0) {
        const totalQuestions = formattedResult.mcqResults.totalQuestions;
        const correctAnswers = formattedResult.mcqResults.correctAnswers;
        const wrongAnswers = totalQuestions - correctAnswers - formattedResult.mcqResults.unansweredCount;
        
        formattedResult.mcqResults.wrongAnswers = wrongAnswers;
        formattedResult.mcqResults.accuracyRate = Math.round((correctAnswers / totalQuestions) * 100);
        formattedResult.mcqResults.performance = {
          excellent: correctAnswers >= totalQuestions * 0.9,
          good: correctAnswers >= totalQuestions * 0.7,
          average: correctAnswers >= totalQuestions * 0.5,
          needsImprovement: correctAnswers < totalQuestions * 0.5
        };
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