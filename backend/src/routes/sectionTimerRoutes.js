const express = require('express');
const router = express.Router();
const sectionTimerController = require('../controllers/sectionTimerController');

// Start section timer
router.post('/:testId/:studentId/start-section', sectionTimerController.startSectionTimer);

// Get section timer status
router.get('/:testId/:studentId/timer', sectionTimerController.getSectionTimer);

// Auto-submit section when timer expires
router.post('/:testId/:studentId/auto-submit', sectionTimerController.autoSubmitSection);

module.exports = router;