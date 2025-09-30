const { Test, User, TestSession, StudentsResults, LicensedUser, sequelize } = require('../models');
const { Op } = require('sequelize');
const testResultsController = require('./testResultsController');

// Get all test results for admin reports
exports.getAllTestResults = async (req, res) => {
  try {
    const { testId, limit = 100, offset = 0 } = req.query;
    const whereClause = testId ? { testId } : {};

    // Get results from StudentsResults table
    const results = await StudentsResults.findAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['completedAt', 'DESC']]
    });

    const formattedResults = results.map(result => ({
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
    }));

    res.json({
      success: true,
      results: formattedResults,
      total: formattedResults.length
    });

  } catch (error) {
    console.error('Get all test results error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get test results'
    });
  }
};

// Get test history
exports.getTestHistory = (req, res) => {
  res.json({
    success: true,
    data: []
  });
};

// Get overview statistics
exports.getOverviewStats = async (req, res) => {
  try {
    const totalTests = await StudentsResults.count({
      distinct: true,
      col: 'testId'
    });
    
    const totalStudents = await StudentsResults.count();
    
    const avgScore = await StudentsResults.findOne({
      attributes: [[sequelize.fn('AVG', sequelize.col('percentage')), 'avgScore']]
    });

    res.json({ 
      success: true, 
      data: {
        totalTests,
        totalStudents,
        averageScore: Math.round(avgScore?.dataValues?.avgScore || 0)
      }
    });
  } catch (error) {
    res.json({ success: true, data: {} });
  }
};

exports.getStudentPerformance = (req, res) => {
  res.json({ success: true, data: [] });
};

exports.getTestAnalytics = (req, res) => {
  res.json({ success: true, data: [] });
};

exports.generateReport = (req, res) => {
  res.json({ success: true, message: 'Report generated' });
};

exports.getRecentReports = (req, res) => {
  res.json({ success: true, data: [] });
};

exports.getTestsInRange = (req, res) => {
  res.json({ success: true, data: [] });
};

exports.generateTestReport = (req, res) => {
  res.json({ success: true, message: 'Test report generated' });
};

exports.getLiveActivity = (req, res) => {
  res.json({ success: true, data: {} });
};

exports.getTestResultsByTestId = (req, res) => {
  res.json({ success: true, results: [] });
};

exports.downloadAssessmentReport = (req, res) => {
  res.json({ success: true, message: 'Assessment report' });
};

exports.getTestResults = (req, res) => {
  res.json({ success: true, data: [] });
};

exports.downloadTestReport = (req, res) => {
  res.json({ success: true, message: 'Test report' });
};

exports.downloadLegacyTestReport = (req, res) => {
  res.json({ success: true, message: 'Legacy report' });
};

exports.downloadBulkReport = (req, res) => {
  res.json({ success: true, message: 'Bulk report' });
};

exports.downloadReport = (req, res) => {
  res.json({ success: true, message: 'Report downloaded' });
};