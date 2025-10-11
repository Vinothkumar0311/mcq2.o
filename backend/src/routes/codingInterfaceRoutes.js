const express = require('express');
const router = express.Router();
const codingInterfaceController = require('../controllers/codingInterfaceController');

// Get coding question for interface
router.get('/question/:questionId', codingInterfaceController.getCodingQuestion);

// Execute code with custom input (Dry Run)
router.post('/execute-custom', codingInterfaceController.executeCustomInput);

// Run code against sample test cases
router.post('/run-samples', codingInterfaceController.runSampleTests);

// Submit final solution
router.post('/submit-solution', codingInterfaceController.submitSolution);

module.exports = router;