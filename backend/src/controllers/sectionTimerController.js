const { TestSession, Test, Section, MCQ, CodingQuestion, SectionSubmission, sequelize } = require('../models');

// Start section timer when student enters a section
exports.startSectionTimer = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { testId, studentId } = req.params;
    const { sectionIndex } = req.body;

    const session = await TestSession.findOne({
      where: { testId, studentId }
    });

    if (!session) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        error: 'Test session not found'
      });
    }

    // Get test with sections to validate section index and get duration
    const test = await Test.findByPk(testId, {
      include: [{ model: Section }]
    });

    if (!test || !test.Sections[sectionIndex]) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        error: 'Section not found'
      });
    }

    const section = test.Sections[sectionIndex];
    const sectionDurationMs = section.duration * 60 * 1000; // Convert minutes to milliseconds
    const now = new Date();
    const sectionEndTime = new Date(now.getTime() + sectionDurationMs);

    // Update session with section timing
    await TestSession.update({
      currentSectionIndex: sectionIndex,
      sectionStartTime: now,
      sectionEndTime: sectionEndTime,
      status: 'in_progress'
    }, {
      where: { id: session.id },
      transaction
    });

    await transaction.commit();

    console.log(`⏰ Section ${sectionIndex + 1} timer started - Duration: ${section.duration} minutes`);

    res.json({
      success: true,
      sectionStartTime: now,
      sectionEndTime: sectionEndTime,
      sectionDuration: section.duration,
      timeRemaining: sectionDurationMs / 1000 // seconds
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Start section timer error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start section timer'
    });
  }
};

// Get current section timer status
exports.getSectionTimer = async (req, res) => {
  try {
    const { testId, studentId } = req.params;

    const session = await TestSession.findOne({
      where: { testId, studentId }
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Test session not found'
      });
    }

    const now = new Date();
    let timeRemaining = 0;
    let sectionExpired = false;

    if (session.sectionEndTime) {
      const remainingMs = session.sectionEndTime.getTime() - now.getTime();
      timeRemaining = Math.max(0, Math.floor(remainingMs / 1000));
      sectionExpired = remainingMs <= 0;
    }

    res.json({
      success: true,
      currentSectionIndex: session.currentSectionIndex,
      sectionStartTime: session.sectionStartTime,
      sectionEndTime: session.sectionEndTime,
      timeRemaining,
      sectionExpired,
      completedSections: session.completedSections || [],
      status: session.status
    });

  } catch (error) {
    console.error('Get section timer error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get section timer'
    });
  }
};

// Auto-submit section when timer expires
exports.autoSubmitSection = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { testId, studentId } = req.params;

    const session = await TestSession.findOne({
      where: { testId, studentId }
    });

    if (!session) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        error: 'Test session not found'
      });
    }

    // Check if section has actually expired
    const now = new Date();
    if (!session.sectionEndTime || now < session.sectionEndTime) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        error: 'Section has not expired yet'
      });
    }

    // Get test with sections
    const test = await Test.findByPk(testId, {
      include: [{ model: Section }]
    });

    const currentSection = test.Sections[session.currentSectionIndex];
    if (!currentSection) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        error: 'Current section not found'
      });
    }

    // Mark current section as completed (with 0 score for auto-submission)
    const completedSections = session.completedSections || [];
    if (!completedSections.includes(session.currentSectionIndex)) {
      completedSections.push(session.currentSectionIndex);
    }

    // Create empty section submission for auto-submitted section
    await SectionSubmission.create({
      testSessionId: session.id,
      sectionId: currentSection.id,
      sectionIndex: session.currentSectionIndex,
      mcqAnswers: JSON.stringify({}),
      codingSubmissions: JSON.stringify([]),
      detailedCodingResults: JSON.stringify([]),
      score: 0,
      maxScore: 0,
      timeSpent: currentSection.duration * 60, // Full duration used
      submittedAt: new Date(),
      autoSubmitted: true
    }, { transaction });

    const isLastSection = session.currentSectionIndex >= test.Sections.length - 1;
    
    if (isLastSection) {
      // Test completed - calculate total score from all submissions
      const allSubmissions = await SectionSubmission.findAll({
        where: { testSessionId: session.id }
      });
      const totalScore = allSubmissions.reduce((sum, sub) => sum + (sub.score || 0), 0);
      const maxScore = allSubmissions.reduce((sum, sub) => sum + (sub.maxScore || 0), 0);

      await TestSession.update({
        status: 'completed',
        completedAt: new Date(),
        totalScore,
        maxScore,
        completedSections,
        sectionStartTime: null,
        sectionEndTime: null
      }, {
        where: { id: session.id },
        transaction
      });

      await transaction.commit();

      console.log(`🏁 Test auto-completed due to section timeout - Student: ${studentId}, Test: ${testId}`);

      return res.json({
        success: true,
        testCompleted: true,
        autoSubmitted: true,
        totalScore,
        maxScore,
        message: 'Test completed due to section timeout'
      });
    } else {
      // Move to next section
      const nextSectionIndex = session.currentSectionIndex + 1;
      const nextSection = test.Sections[nextSectionIndex];
      const nextSectionDurationMs = nextSection.duration * 60 * 1000;
      const nextSectionEndTime = new Date(now.getTime() + nextSectionDurationMs);

      await TestSession.update({
        currentSectionIndex: nextSectionIndex,
        sectionStartTime: now,
        sectionEndTime: nextSectionEndTime,
        completedSections,
        status: 'in_progress'
      }, {
        where: { id: session.id },
        transaction
      });

      await transaction.commit();

      console.log(`⏭️ Auto-moved to section ${nextSectionIndex + 1} due to timeout - Student: ${studentId}, Test: ${testId}`);

      return res.json({
        success: true,
        sectionCompleted: true,
        autoSubmitted: true,
        nextSectionIndex,
        nextSectionStartTime: now,
        nextSectionEndTime: nextSectionEndTime,
        nextSectionDuration: nextSection.duration,
        message: `Section ${session.currentSectionIndex + 1} auto-submitted due to timeout. Moved to section ${nextSectionIndex + 1}.`
      });
    }

  } catch (error) {
    await transaction.rollback();
    console.error('Auto-submit section error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to auto-submit section'
    });
  }
};

module.exports = exports;