const express = require('express');
const router = express.Router();
const { downloadTestReport } = require('../controllers/pdfReportController');

// Download PDF report (for both admin and student)
router.get('/:testId/student/:studentId/download-report', downloadTestReport);

module.exports = router;