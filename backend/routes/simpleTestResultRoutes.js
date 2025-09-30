const express = require('express');
const router = express.Router();
const simpleTestResultController = require('../controllers/simpleTestResultController');

// Store test result
router.post('/test-results', simpleTestResultController.storeTestResult);

// Get test results by email
router.get('/test-results/:userEmail', simpleTestResultController.getTestResultsByEmail);

// Download report by session ID
router.get('/download-report/:sessionId', simpleTestResultController.downloadReportBySession);

module.exports = router;