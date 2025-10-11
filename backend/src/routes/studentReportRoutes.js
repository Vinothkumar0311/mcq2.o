const express = require('express');
const router = express.Router();
const { getStudentReport, getAllStudentReports } = require('../controllers/studentReportController');

// Get comprehensive report for specific student
router.get('/report/:studentId', getStudentReport);

// Get all student reports summary
router.get('/reports', getAllStudentReports);

module.exports = router;