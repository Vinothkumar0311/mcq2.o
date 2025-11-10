const express = require('express');
const router = express.Router();
const {
  checkTestEligibility,
  getStudentViolationHistory,
  eligibilityMiddleware
} = require('../controllers/testEligibilityController');

// Check if student is eligible to take tests
router.get('/check/:studentId', checkTestEligibility);

// Get student violation history
router.get('/history/:studentId', getStudentViolationHistory);

module.exports = router;
module.exports.eligibilityMiddleware = eligibilityMiddleware;