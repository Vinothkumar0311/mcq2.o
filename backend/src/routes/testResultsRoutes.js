const express = require('express');
const router = express.Router();
const testResultsController = require('../controllers/testResultsController');

// Get specific test result for a student
router.get('/test/:testId/student/:studentId', testResultsController.getTestResult);

// Get all test results for a student
router.get('/student/:studentId', testResultsController.getStudentTestResults);

// Get all test results (for admin)
router.get('/all', testResultsController.getAllTestResults);

// Get all test results (root route for admin reports)
router.get('/', testResultsController.getAllTestResults);

module.exports = router;