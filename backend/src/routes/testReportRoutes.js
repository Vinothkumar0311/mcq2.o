const express = require('express');
const router = express.Router();
const { storeTestResult, getTestReport, downloadTestReport, getAllStudents } = require('../controllers/testReportController');

// Store student test result
router.post('/store', storeTestResult);

// Get student test report
router.get('/report', getTestReport);

// Download test report as PDF
router.get('/download', downloadTestReport);

// Get all students list
router.get('/students', getAllStudents);

module.exports = router;