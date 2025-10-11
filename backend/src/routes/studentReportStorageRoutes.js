const express = require('express');
const router = express.Router();
const studentReportStorageController = require('../controllers/studentReportStorageController');

// Get student test results for reports page
router.get('/test-results/:studentEmail', studentReportStorageController.getStudentTestResults);

// Download individual test report
router.get('/download-report/:sessionId', studentReportStorageController.downloadTestReport);

// Download overall performance report
router.get('/overall-report/:studentId', studentReportStorageController.downloadOverallReport);

module.exports = router;