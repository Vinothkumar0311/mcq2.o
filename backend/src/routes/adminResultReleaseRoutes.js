const express = require('express');
const router = express.Router();
const { releaseTestResult, releaseAllTestResults } = require('../controllers/adminResultReleaseController');

// Release result for specific student
router.post('/release/:testId/:studentId', releaseTestResult);

// Release results for all students in a test
router.post('/release-all/:testId', releaseAllTestResults);

module.exports = router;