const express = require('express');
const router = express.Router();
const { getAllTestsWithReports, getTestReport, downloadPDFReport, getReportStatus, downloadXlsxReport } = require('../controllers/adminReportController');
const { Test, StudentTestResult, sequelize } = require('../models');
const { Op } = require('sequelize');

// Get all tests with reports summary
router.get('/tests-summary', getAllTestsWithReports);

// Get specific test report
router.get('/test/:testId', getTestReport);

// Download PDF report
router.get('/test/:testId/pdf', downloadPDFReport);

// Download Excel report
router.get('/test/:testId/excel', downloadXlsxReport);

// Get report status
router.get('/test/:testId/status', getReportStatus);

// Test endpoint for debugging
router.get('/test/:testId/debug', async (req, res) => {
  const { testId } = req.params;
  
  try {
    console.log('🔍 Debug endpoint called for testId:', testId);
    
    // Test the getTestReportData function
    const { getTestReportData } = require('../controllers/adminReportController');
    
    // This is a private function, so we'll test the controller directly
    const testResultsController = require('../controllers/testResultsController');
    
    const mockReq = { query: { testId } };
    const mockRes = {
      json: (data) => data,
      status: (code) => ({ json: (data) => ({ status: code, ...data }) })
    };
    
    const resultsData = await new Promise((resolve, reject) => {
      try {
        testResultsController.getAllTestResults(mockReq, {
          json: resolve,
          status: (code) => ({ json: (data) => resolve({ status: code, ...data }) })
        });
      } catch (error) {
        reject(error);
      }
    });
    
    res.json({
      success: true,
      debug: {
        testId,
        resultsFound: resultsData.success,
        resultsCount: resultsData.results?.length || 0,
        sampleResult: resultsData.results?.[0] || null
      }
    });
    
  } catch (error) {
    console.error('❌ Debug endpoint error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get all tests with their student results for admin reports (legacy)
router.get('/admin/reports', async (req, res) => {
  try {
    console.log('📊 Fetching admin reports data...');
    
    // Get all tests with their student results
    const tests = await Test.findAll({
      attributes: ['testId', 'name', 'description', 'createdAt'],
      order: [['createdAt', 'DESC']]
    });
    
    const reportsData = [];
    
    for (const test of tests) {
      // Get all student results for this test
      const studentResults = await StudentTestResult.findAll({
        where: { testId: test.testId },
        order: [['percentage', 'DESC'], ['completedAt', 'ASC']]
      });
      
      // Calculate statistics
      let totalScore = 0;
      let highestScore = 0;
      let lowestScore = studentResults.length > 0 ? studentResults[0].percentage : 0;
      
      studentResults.forEach(result => {
        totalScore += result.percentage;
        if (result.percentage > highestScore) {
          highestScore = result.percentage;
        }
        if (result.percentage < lowestScore) {
          lowestScore = result.percentage;
        }
      });
      
      const averageScore = studentResults.length > 0 ? totalScore / studentResults.length : 0;
      
      // Add ranking to student results
      let currentRank = 1;
      let previousScore = null;
      const rankedResults = studentResults.map((result, index) => {
        if (previousScore !== null && result.percentage < previousScore) {
          currentRank = index + 1;
        }
        previousScore = result.percentage;
        
        return {
          ...result.toJSON(),
          rank: currentRank
        };
      });
      
      reportsData.push({
        test: {
          testId: test.testId,
          name: test.name,
          description: test.description,
          createdAt: test.createdAt
        },
        statistics: {
          totalStudents: studentResults.length,
          averageScore: Math.round(averageScore * 100) / 100,
          highestScore: Math.round(highestScore * 100) / 100,
          lowestScore: Math.round(lowestScore * 100) / 100
        },
        students: rankedResults
      });
    }
    
    console.log(`Returning reports for ${reportsData.length} tests`);
    
    res.json({
      success: true,
      data: reportsData,
      summary: {
        totalTests: reportsData.length,
        totalStudents: reportsData.reduce((sum, test) => sum + test.statistics.totalStudents, 0)
      }
    });
    
  } catch (error) {
    console.error('Error fetching admin reports:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch admin reports',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get specific test report
router.get('/admin/reports/:testId', async (req, res) => {
  try {
    const { testId } = req.params;
    
    const test = await Test.findOne({
      where: { testId },
      attributes: ['testId', 'name', 'description', 'createdAt']
    });
    
    if (!test) {
      return res.status(404).json({
        success: false,
        error: 'Test not found'
      });
    }
    
    const studentResults = await StudentTestResult.findAll({
      where: { testId },
      order: [['percentage', 'DESC'], ['completedAt', 'ASC']]
    });
    
    // Add ranking
    let currentRank = 1;
    let previousScore = null;
    const rankedResults = studentResults.map((result, index) => {
      if (previousScore !== null && result.percentage < previousScore) {
        currentRank = index + 1;
      }
      previousScore = result.percentage;
      
      return {
        ...result.toJSON(),
        rank: currentRank
      };
    });
    
    // Calculate statistics
    let totalScore = 0;
    let highestScore = 0;
    let lowestScore = studentResults.length > 0 ? studentResults[0].percentage : 0;
    
    studentResults.forEach(result => {
      totalScore += result.percentage;
      if (result.percentage > highestScore) {
        highestScore = result.percentage;
      }
      if (result.percentage < lowestScore) {
        lowestScore = result.percentage;
      }
    });
    
    const averageScore = studentResults.length > 0 ? totalScore / studentResults.length : 0;
    
    res.json({
      success: true,
      data: {
        test: {
          testId: test.testId,
          name: test.name,
          description: test.description,
          createdAt: test.createdAt
        },
        statistics: {
          totalStudents: studentResults.length,
          averageScore: Math.round(averageScore * 100) / 100,
          highestScore: Math.round(highestScore * 100) / 100,
          lowestScore: Math.round(lowestScore * 100) / 100
        },
        students: rankedResults
      }
    });
    
  } catch (error) {
    console.error('Error fetching test report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch test report',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;