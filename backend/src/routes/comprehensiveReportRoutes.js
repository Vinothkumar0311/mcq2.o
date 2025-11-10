const express = require('express');
const router = express.Router();
const { generateComprehensivePDFReport } = require('../controllers/comprehensiveReportController');

// Student PDF report download (requires results to be released)
router.get('/student/:testId/:studentId/download-report', generateComprehensivePDFReport);

// Admin PDF report download (no release requirement)
router.get('/admin/:testId/:studentId/download-report', generateComprehensivePDFReport);

module.exports = router;