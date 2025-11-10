const express = require('express');
const router = express.Router();
const { handleTestCompletion } = require('../controllers/testCompletionRedirectController');

// FIXED: Route to check test completion status
router.get('/:testId/student/:studentId', handleTestCompletion);

module.exports = router;