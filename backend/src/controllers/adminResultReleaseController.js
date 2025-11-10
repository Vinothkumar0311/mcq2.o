const { TestSession, StudentsResults } = require('../models');
const { Op } = require('sequelize');

// Release results for a specific test and student (ONE-TIME ONLY)
exports.releaseTestResult = async (req, res) => {
  try {
    const { testId, studentId } = req.params;
    
    console.log(`🔓 Admin releasing results for Student: ${studentId}, Test: ${testId}`);
    
    // Check if already released (PREVENT MULTIPLE RELEASES)
    const existingSession = await TestSession.findOne({
      where: { testId, studentId }
    });
    
    if (!existingSession) {
      return res.status(404).json({
        success: false,
        message: 'Test session not found'
      });
    }
    
    if (existingSession.resultsReleased) {
      console.log(`⚠️ Result already released for Student: ${studentId}, Test: ${testId}`);
      return res.json({
        success: false,
        message: 'Result already released for this student'
      });
    }
    
    // ONE-TIME RELEASE: Update TestSession
    const [sessionUpdated] = await TestSession.update(
      { resultsReleased: true },
      { where: { testId, studentId, resultsReleased: false } }
    );
    
    // Also update StudentsResults table for compatibility
    await StudentsResults.update(
      { resultsReleased: true },
      { where: { testId, studentId } }
    );
    
    console.log(`✅ Successfully released results for Student: ${studentId}, Test: ${testId}`);
    
    res.json({
      success: true,
      message: 'Results released successfully',
      updated: sessionUpdated > 0
    });
  } catch (error) {
    console.error('❌ Error releasing results:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to release results',
      details: error.message
    });
  }
};

// Release results for all students in a test (BULK RELEASE)
exports.releaseAllTestResults = async (req, res) => {
  try {
    const { testId } = req.params;
    
    console.log(`🔓 Admin releasing ALL results for Test: ${testId}`);
    
    // Count unreleased sessions
    const unreleasedCount = await TestSession.count({
      where: { testId, resultsReleased: false }
    });
    
    if (unreleasedCount === 0) {
      return res.json({
        success: false,
        message: 'All results are already released for this test'
      });
    }
    
    // Update all unreleased TestSessions for this test
    const [sessionUpdated] = await TestSession.update(
      { resultsReleased: true },
      { where: { testId, resultsReleased: false } }
    );
    
    // Update all StudentsResults for this test
    await StudentsResults.update(
      { resultsReleased: true },
      { where: { testId } }
    );
    
    console.log(`✅ Released results for ${sessionUpdated} students in Test: ${testId}`);
    
    res.json({
      success: true,
      message: `Results released for ${sessionUpdated} students`,
      releasedCount: sessionUpdated
    });
  } catch (error) {
    console.error('❌ Error releasing all results:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to release all results',
      details: error.message
    });
  }
};

