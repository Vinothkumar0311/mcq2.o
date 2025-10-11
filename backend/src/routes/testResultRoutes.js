const express = require('express');
const router = express.Router();
const { downloadTestResultPDF } = require('../controllers/testResultPDFController');
const { getTestResults, getCodingTestCaseDetails, downloadCodingTestReport } = require('../controllers/testResultController');

// Get comprehensive test results
router.get('/:testId/student/:studentId', getTestResults);

// Get coding test case details
router.get('/coding/:submissionId/details', getCodingTestCaseDetails);

// Download test result as PDF
router.post('/:testId/download-pdf', downloadTestResultPDF);

// Download coding test report
router.get('/:testId/student/:studentId/download-report', downloadCodingTestReport);

module.exports = router;