const express = require('express');
const router = express.Router();
const { TestSession } = require('../models');

// Create test session
router.post('/create', async (req, res) => {
  try {
    const { testId, studentId } = req.body;
    
    // Check if session already exists
    let session = await TestSession.findOne({
      where: { testId, studentId }
    });
    
    if (!session) {
      session = await TestSession.create({
        testId,
        studentId,
        status: 'in_progress',
        startedAt: new Date(),
        totalScore: 0,
        maxScore: 100
      });
    }
    
    res.json({
      success: true,
      sessionId: session.id,
      message: 'Test session created'
    });
    
  } catch (error) {
    console.error('Error creating test session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create test session'
    });
  }
});

module.exports = router;