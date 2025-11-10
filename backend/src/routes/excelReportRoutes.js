const express = require('express');
const router = express.Router();
const { downloadExcelReport } = require('../controllers/excelReportController');

// Download Excel report for admin
router.get('/:testId/excel', downloadExcelReport);

module.exports = router;