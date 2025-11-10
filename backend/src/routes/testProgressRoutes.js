const express = require('express');
const router = express.Router();
const { saveCodingProgress, saveMCQAnswer, autoSaveProgress } = require('../controllers/testProgressController');

// Save coding progress during test
router.post('/coding-progress', saveCodingProgress);

// Save MCQ answer during test
router.post('/mcq-answer', saveMCQAnswer);

// Auto-save test progress
router.post('/auto-save', autoSaveProgress);

module.exports = router;