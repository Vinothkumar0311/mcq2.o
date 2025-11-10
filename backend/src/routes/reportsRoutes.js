const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reportsController');
const downloadReportsController = require('../controllers/downloadReportsController');

// Get overview statistics
router.get('/overview', reportsController.getOverviewStats);

// Get student performance data
router.get('/student-performance', reportsController.getStudentPerformance);

// Get test analytics
router.get('/test-analytics', reportsController.getTestAnalytics);

// Get test history for admin reports
router.get('/test-history', (req, res) => {
  res.json({
    success: true,
    data: []
  });
});

// Get recent reports
router.get('/recent', reportsController.getRecentReports);

// Generate new report
router.post('/generate', reportsController.generateReport);

// Generate test report
router.post('/generate-test-report/:testId', async (req, res) => {
  try {
    const { testId } = req.params;
    
    // Check if test results exist using the proper controller
    const testResultsController = require('../controllers/testResultsController');
    const mockReq = { query: { testId } };
    const mockRes = {
      json: (data) => data,
      status: (code) => ({ json: (data) => ({ ...data, statusCode: code }) })
    };
    
    const resultsData = await testResultsController.getAllTestResults(mockReq, mockRes);
    console.log('Test results data:', resultsData);
    
    if (resultsData && resultsData.success && resultsData.results && resultsData.results.length > 0) {
      res.json({
        success: true,
        message: `Report for test ${testId} is ready`,
        data: {
          testId,
          testName: resultsData.results[0].testName,
          totalStudents: resultsData.results.length,
          averageScore: Math.round(resultsData.results.reduce((sum, r) => sum + r.percentage, 0) / resultsData.results.length),
          reportGenerated: true
        }
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'No test results found for this test'
      });
    }
  } catch (error) {
    console.error('Error generating test report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate test report'
    });
  }
});

// Get tests in date range
router.get('/tests-in-range', reportsController.getTestsInRange);

// Generate test report
router.get('/test-report/:testId', reportsController.generateTestReport);

// Get live test activity
router.get('/live-activity', reportsController.getLiveActivity);

// Get all test results for admin
router.get('/all-test-results', reportsController.getAllTestResults);

// Get test results for reports page
router.get('/test-results', reportsController.getTestResults);

// Get test results by specific test ID
router.get('/test-results/:testId', reportsController.getTestResultsByTestId);

// Download comprehensive test report
router.get('/download-test-report/:testId', reportsController.downloadTestReport);

// Download assessment report for a test (legacy format)
router.get('/download-assessment/:testId', reportsController.downloadAssessmentReport);

// Download bulk report
router.get('/download-bulk-report', reportsController.downloadBulkReport);

// Download report
router.get('/download/:reportId', reportsController.downloadReport);

// Simple test report endpoint
router.get('/test-report/:testId', async (req, res) => {
  try {
    const { testId } = req.params;
    const SimpleReportGenerator = require('../utils/simpleReportGenerator');
    await SimpleReportGenerator.generateJSONReport(testId, res);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Download detailed report by session ID
router.get('/download/:sessionId/detailed', downloadReportsController.downloadDetailedReport);

// Download assessment report by session ID
router.get('/download/:sessionId/assessment', downloadReportsController.downloadAssessmentReportBySession);

module.exports = router;