const express = require('express');
const router = express.Router();
const { getCodingTestResults, getCodingTestReport, downloadCodingTestReport } = require('../controllers/codingReportsController');

// Get coding test results
router.get('/results', getCodingTestResults);

// Get detailed coding test report
router.get('/report/:testId', getCodingTestReport);

// Download coding test report as PDF
router.get('/download/:testId', downloadCodingTestReport);

module.exports = router;