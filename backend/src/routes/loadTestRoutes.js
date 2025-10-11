const express = require('express');
const router = express.Router();
const { StudentsResults, TestSession, SectionSubmission, sequelize } = require('../models');

// Submit load test results
router.post('/submit', async (req, res) => {
  try {
    const {
      testId,
      testName,
      studentId,
      studentName,
      studentEmail,
      department,
      sinNumber,
      totalScore,
      maxScore,
      percentage,
      completedAt,
      answers,
      type,
      mcqResults,
      codingResults
    } = req.body;

    console.log(`📝 Submitting test result for ${studentName} (${percentage}%)`);

    // Insert into StudentsResults table
    const result = await StudentsResults.create({
      testId,
      testName,
      studentName,
      userEmail: studentEmail,
      department,
      sinNumber,
      totalScore,
      maxScore,
      percentage,
      completedAt: new Date(completedAt),
      answers: typeof answers === 'string' ? answers : JSON.stringify(answers),
      sessionId: `${testId}_${studentId}`,
      date: new Date(completedAt).toISOString().split('T')[0]
    });

    // If section-based test, also create TestSession record
    if (type === 'section-based') {
      try {
        await TestSession.create({
          testId,
          studentId,
          totalScore,
          maxScore,
          status: 'completed',
          startedAt: new Date(completedAt),
          completedAt: new Date(completedAt)
        });
      } catch (sessionError) {
        console.log(`⚠️ TestSession creation failed for ${studentName}:`, sessionError.message);
      }
    }

    res.json({
      success: true,
      message: 'Test result submitted successfully',
      resultId: result.id
    });

  } catch (error) {
    console.error('Error submitting test result:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit test result',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Bulk insert load test data
router.post('/bulk-insert', async (req, res) => {
  try {
    const { testResults } = req.body;
    
    if (!Array.isArray(testResults) || testResults.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'testResults must be a non-empty array'
      });
    }

    console.log(`📦 Bulk inserting ${testResults.length} test results...`);

    const transaction = await sequelize.transaction();

    try {
      // Prepare data for bulk insert
      const studentsResultsData = testResults.map(result => ({
        testId: result.testId,
        testName: result.testName,
        studentName: result.studentName,
        userEmail: result.studentEmail,
        department: result.department,
        sinNumber: result.sinNumber,
        totalScore: result.totalScore,
        maxScore: result.maxScore,
        percentage: result.percentage,
        completedAt: new Date(result.completedAt),
        answers: typeof result.answers === 'string' ? result.answers : JSON.stringify(result.answers),
        sessionId: `${result.testId}_${result.studentId}`,
        date: new Date(result.completedAt).toISOString().split('T')[0]
      }));

      // Bulk insert into StudentsResults
      await StudentsResults.bulkCreate(studentsResultsData, { transaction });

      // Prepare TestSession data for section-based tests
      const testSessionData = testResults
        .filter(result => result.type === 'section-based')
        .map(result => ({
          testId: result.testId,
          studentId: result.studentId,
          totalScore: result.totalScore,
          maxScore: result.maxScore,
          status: 'completed',
          startedAt: new Date(result.completedAt),
          completedAt: new Date(result.completedAt)
        }));

      if (testSessionData.length > 0) {
        await TestSession.bulkCreate(testSessionData, { 
          transaction,
          ignoreDuplicates: true 
        });
      }

      await transaction.commit();

      console.log(`✅ Successfully inserted ${testResults.length} test results`);

      res.json({
        success: true,
        message: `Successfully inserted ${testResults.length} test results`,
        inserted: testResults.length
      });

    } catch (error) {
      await transaction.rollback();
      throw error;
    }

  } catch (error) {
    console.error('Error in bulk insert:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to bulk insert test results',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get load test statistics
router.get('/stats/:testId', async (req, res) => {
  try {
    const { testId } = req.params;

    const results = await StudentsResults.findAll({
      where: { testId },
      attributes: ['studentName', 'percentage', 'totalScore', 'maxScore', 'completedAt', 'department']
    });

    if (results.length === 0) {
      return res.json({
        success: true,
        stats: {
          totalStudents: 0,
          message: 'No results found for this test'
        }
      });
    }

    const scores = results.map(r => r.percentage);
    const departments = results.reduce((acc, r) => {
      acc[r.department] = (acc[r.department] || 0) + 1;
      return acc;
    }, {});

    const stats = {
      totalStudents: results.length,
      averageScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
      highestScore: Math.max(...scores),
      lowestScore: Math.min(...scores),
      passRate: Math.round((scores.filter(s => s >= 60).length / scores.length) * 100),
      departmentBreakdown: departments,
      scoreDistribution: {
        'A (90-100%)': scores.filter(s => s >= 90).length,
        'B (80-89%)': scores.filter(s => s >= 80 && s < 90).length,
        'C (70-79%)': scores.filter(s => s >= 70 && s < 80).length,
        'D (60-69%)': scores.filter(s => s >= 60 && s < 70).length,
        'F (0-59%)': scores.filter(s => s < 60).length
      }
    };

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Error getting load test stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get load test statistics'
    });
  }
});

module.exports = router;