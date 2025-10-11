const express = require('express');
const router = express.Router();
const studentTestResultController = require('../controllers/studentTestResultController');

// Get detailed student test results
router.get('/results/:testId/:studentId', studentTestResultController.getStudentTestResults);

// Download student test result
router.get('/download/:testId/:studentId', studentTestResultController.downloadStudentResult);

module.exports = router;