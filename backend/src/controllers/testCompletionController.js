const { TestSession, SectionScore, sequelize, Section, StudentTestResult, Test, User, LicensedUser, CodeSubmission, CodingQuestion, MCQ } = require('../models');
const reportGenerationService = require('../services/reportGenerationService');
const { Op } = require('sequelize');

/**
 * Complete a test and calculate section-wise scores
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body
 * @param {string} req.body.sessionId - Test session ID
 * @param {Array} [req.body.sectionScores] - Array of section scores
 * @param {Object} [req.body.answers] - Student's answers (for future reference)
 */
exports.completeTest = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { sessionId, sectionScores = [], answers = {} } = req.body;

    if (!sessionId) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        error: 'Session ID is required'
      });
    }

    // Get test session with lock to prevent concurrent updates
    const session = await TestSession.findByPk(sessionId, {
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    if (!session) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        error: 'Test session not found'
      });
    }

    // Prevent multiple submissions
    if (session.status === 'completed' || session.status === 'submitted') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        error: 'Test has already been submitted',
        status: session.status
      });
    }

    // Get all sections for this test
    const sections = await Section.findAll({
      where: { testId: session.testId },
      transaction
    });

    let totalScore = 0;
    const sectionResults = [];
    const now = new Date();

    // Update section scores
    for (const section of sections) {
      const sectionScore = sectionScores.find(ss => ss.sectionId === section.id);
      
      if (sectionScore) {
        const marksObtained = parseFloat(sectionScore.marksObtained) || 0;
        totalScore += marksObtained;
        
        // Track unanswered questions
        const sectionAnswers = answers[section.id] || {};
        const unansweredQuestions = sectionScore.unansweredQuestions || [];
        
        await SectionScore.update(
          {
            marksObtained,
            status: 'completed',
            submittedAt: now,
            answers: sectionAnswers,
            unansweredQuestions,
            resultJson: sectionScore.resultJson || null
          },
          {
            where: {
              testSessionId: sessionId,
              sectionId: section.id
            },
            transaction
          }
        );
        
        sectionResults.push({
          sectionId: section.id,
          sectionName: section.name,
          marksObtained,
          maxMarks: section.maxMarks || 0,
          unansweredCount: (sectionScore.unansweredQuestions || []).length
        });
      }
    }

    // Update test session
    await session.update(
      {
        status: 'completed',
        totalScore,
        completedAt: now
      },
      { transaction }
    );

    // Save to StudentTestResult for admin reports
    await saveStudentTestResult(session, totalScore, now, transaction);
    
    // Also save detailed results for student reports
    await saveDetailedStudentResults(session, totalScore, now, transaction);

    // Get detailed test results including coding submissions
    const detailedResults = await getDetailedTestResults(session.testId, session.studentId, transaction);
    
    // Commit the transaction
    await transaction.commit();

    console.log(`✅ Test session ${sessionId} completed with score ${totalScore}`);

    // Generate report automatically (async, don't wait for it)
    setImmediate(() => {
      reportGenerationService.triggerReportGeneration(session.testId, session.studentId).catch(err => {
        console.error('Error generating report:', err);
      });
    });

    res.json({
      success: true,
      message: 'Test submitted successfully',
      sessionId,
      totalScore,
      sectionResults,
      submittedAt: now.toISOString(),
      detailedResults
    });

  } catch (error) {
    // Rollback transaction on error
    await transaction.rollback().catch(rollbackError => {
      console.error('Error rolling back transaction:', rollbackError);
    });
    
    console.error('Error completing test:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to complete test',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Auto-submit test when time expires
 * @param {string} sessionId - Test session ID
 */
exports.autoSubmitTest = async (sessionId) => {
  const transaction = await sequelize.transaction();
  
  try {
    // Get test session with lock
    const session = await TestSession.findByPk(sessionId, {
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    if (!session || session.status !== 'in_progress') {
      await transaction.rollback();
      return { success: false, error: 'Invalid session or already submitted' };
    }

    // Get all sections for this test
    const sectionScores = await SectionScore.findAll({
      where: { testSessionId: sessionId },
      transaction
    });

    // Calculate total score from completed sections
    let totalScore = 0;
    for (const score of sectionScores) {
      if (score.status === 'completed') {
        totalScore += parseFloat(score.marksObtained) || 0;
      }
    }

    const completedAt = new Date();
    
    // Update session
    await session.update(
      {
        status: 'auto-submitted',
        totalScore,
        completedAt
      },
      { transaction }
    );

    // Save to StudentTestResult for admin reports
    await saveStudentTestResult(session, totalScore, completedAt, transaction);

    await transaction.commit();
    console.log(`✅ Auto-submitted test session ${sessionId} with score ${totalScore}`);

    // Generate report automatically (async)
    setImmediate(() => {
      reportGenerationService.triggerReportGeneration(session.testId, session.studentId).catch(err => {
        console.error('Error generating report after auto-submit:', err);
      });
    });

    return { success: true, totalScore };
  } catch (error) {
    await transaction.rollback().catch(rollbackError => {
      console.error('Error rolling back auto-submit transaction:', rollbackError);
    });
    
    console.error('Error in auto-submit:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get detailed test results including coding submissions
 * @param {string} testId - Test ID
 * @param {string} studentId - Student ID
 * @param {Object} transaction - Database transaction
 */
async function getDetailedTestResults(testId, studentId, transaction) {
  try {
    // Get test details
    const test = await Test.findByPk(testId, {
      include: [{
        model: Section,
        as: 'sections',
        include: [
          { model: MCQ, as: 'questions' },
          { model: CodingQuestion, as: 'codingQuestions' }
        ]
      }],
      transaction
    });

    if (!test) return null;

    const results = {
      testId,
      testName: test.name,
      hasCodingQuestions: false,
      hasMCQQuestions: false,
      codingResults: [],
      mcqResults: null,
      totalScore: 0,
      maxScore: 0
    };

    // Get coding submissions
    const codingSubmissions = await CodeSubmission.findAll({
      where: { testId, studentId, isDryRun: false },
      include: [{
        model: CodingQuestion,
        as: 'codingQuestion'
      }],
      transaction
    });

    if (codingSubmissions.length > 0) {
      results.hasCodingQuestions = true;
      results.codingResults = codingSubmissions.map(submission => {
        const testResults = submission.testResults || [];
        const passedTests = testResults.filter(t => t.passed).length;
        const totalTests = testResults.length;
        const percentage = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;
        
        return {
          questionNumber: submission.codingQuestionId,
          questionName: submission.codingQuestion?.title || `Problem ${submission.codingQuestionId}`,
          problemStatement: submission.codingQuestion?.problemStatement || '',
          testCasesPassed: passedTests,
          totalTestCases: totalTests,
          score: submission.score || 0,
          maxScore: submission.codingQuestion?.marks || 0,
          language: submission.language,
          status: submission.status === 'passed' ? 'All Passed' : 'Some Failed',
          percentage,
          userCode: submission.code,
          testResults: testResults,
          executionTime: submission.executionTime
        };
      });
      
      results.totalScore = codingSubmissions.reduce((sum, sub) => sum + (sub.score || 0), 0);
      results.maxScore = codingSubmissions.reduce((sum, sub) => sum + (sub.codingQuestion?.marks || 0), 0);
    }

    // Check for MCQ sections (basic implementation)
    const mcqSections = test.sections?.filter(section => section.questions?.length > 0);
    if (mcqSections?.length > 0) {
      results.hasMCQQuestions = true;
      // MCQ results would be populated from section scores if needed
    }

    results.percentage = results.maxScore > 0 ? Math.round((results.totalScore / results.maxScore) * 100) : 0;

    return results;
  } catch (error) {
    console.error('Error getting detailed test results:', error);
    return null;
  }
}

/**
 * Helper function to save student test result for admin reports
 * @param {Object} session - Test session object
 * @param {number} totalScore - Total score achieved
 * @param {Date} completedAt - Completion timestamp
 * @param {Object} transaction - Database transaction
 */
async function saveStudentTestResult(session, totalScore, completedAt, transaction) {
  try {
    // Get test details
    const test = await Test.findByPk(session.testId, {
      attributes: ['name'],
      transaction
    });

    // FIXED: Get real student details dynamically
    let student = await LicensedUser.findByPk(session.studentId, {
      attributes: ['name', 'email', 'department', 'sin_number'],
      transaction
    });

    if (!student) {
      student = await User.findByPk(session.studentId, {
        attributes: ['name', 'email', 'department'],
        transaction
      });
    }

    if (!student || !test) {
      console.error(`CRITICAL: Missing student or test data for session ${session.id}`);
      console.error(`Student ID: ${session.studentId}, Test ID: ${session.testId}`);
      return;
    }

    console.log(`✅ Found student: ${student.name} (${student.email})`);
    
    // FIXED: Ensure we have real student data, not placeholders
    const studentName = student.name || 'Unknown Student';
    const studentEmail = student.email || 'unknown@email.com';
    const sinNumber = student.sin_number || student.sinNumber || 'N/A';
    const department = student.department || 'N/A';

    const maxScore = session.maxScore || 100;
    const percentage = maxScore > 0 ? ((totalScore / maxScore) * 100) : 0;

    // Check if result already exists
    const existingResult = await StudentTestResult.findOne({
      where: {
        testId: session.testId,
        userEmail: student.email
      },
      transaction
    });

    // FIXED: Use real student data, not placeholders
    const resultData = {
      testId: session.testId,
      testName: test.name,
      userEmail: studentEmail,
      studentName: studentName,
      sinNumber: sinNumber,
      department: department,
      totalScore,
      maxScore,
      percentage: Math.round(percentage * 100) / 100,
      completedAt,
      resultsReleased: false // FIXED: Default to false - admin must release
    };

    if (existingResult) {
      // Update existing result
      await existingResult.update(resultData, { transaction });
      console.log(`✅ Updated student test result for ${student.email}`);
    } else {
      // Create new result
      await StudentTestResult.create(resultData, { transaction });
      console.log(`✅ Created student test result for ${student.email}`);
    }
  } catch (error) {
    console.error('Error saving student test result:', error);
    // Don't throw error to avoid breaking the main flow
  }
}

/**
 * Save detailed student results for student reports
 * @param {Object} session - Test session object
 * @param {number} totalScore - Total score achieved
 * @param {Date} completedAt - Completion timestamp
 * @param {Object} transaction - Database transaction
 */
async function saveDetailedStudentResults(session, totalScore, completedAt, transaction) {
  try {
    // Get test details
    const test = await Test.findByPk(session.testId, {
      attributes: ['name', 'description'],
      transaction
    });

    // FIXED: Get real student details for detailed results
    let student = await LicensedUser.findByPk(session.studentId, {
      attributes: ['name', 'email', 'department', 'sin_number'],
      transaction
    });

    if (!student) {
      student = await User.findByPk(session.studentId, {
        attributes: ['name', 'email', 'department'],
        transaction
      });
    }

    if (!student || !test) {
      console.error(`CRITICAL: Missing student or test data for detailed results ${session.id}`);
      return;
    }

    // FIXED: Use real student data
    const studentName = student.name || 'Unknown Student';
    const studentEmail = student.email || 'unknown@email.com';
    const sinNumber = student.sin_number || student.sinNumber || 'N/A';
    const department = student.department || 'N/A';

    const maxScore = session.maxScore || 100;
    const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

    // FIXED: Store real student data in detailed results
    const resultData = {
      testId: session.testId,
      testName: test.name,
      userEmail: studentEmail,
      studentName: studentName,
      sinNumber: sinNumber,
      department: department,
      totalScore,
      maxScore,
      percentage,
      completedAt,
      sessionId: session.id,
      downloadUrl: `/api/student/download-report/${session.id}`,
      resultsReleased: false // FIXED: Default to false - admin must release
    };

    // Check if detailed result already exists
    const existingDetailedResult = await StudentTestResult.findOne({
      where: {
        testId: session.testId,
        userEmail: student.email,
        sessionId: session.id
      },
      transaction
    });

    if (existingDetailedResult) {
      await existingDetailedResult.update(resultData, { transaction });
    } else {
      await StudentTestResult.create(resultData, { transaction });
    }

    console.log(`✅ Saved detailed student result for ${student.email}`);
  } catch (error) {
    console.error('Error saving detailed student results:', error);
  }
}