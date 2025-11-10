const { TestSession, CodeSubmission, SectionScore, MCQ } = require('../models');

/**
 * Save coding progress during test
 */
exports.saveCodingProgress = async (req, res) => {
  try {
    const { studentId, testId, questionId, code, language, testResults, score } = req.body;
    
    console.log(`💾 Saving coding progress - Student: ${studentId}, Test: ${testId}, Question: ${questionId}`);
    
    // Upsert coding submission
    await CodeSubmission.upsert({
      studentId,
      testId,
      codingQuestionId: questionId,
      code,
      language,
      testResults: testResults || [],
      score: score || 0,
      status: testResults && testResults.length > 0 ? 'completed' : 'pending',
      isDryRun: false
    });
    
    console.log(`✅ Coding progress saved successfully`);
    
    res.json({ 
      success: true, 
      message: 'Coding progress saved successfully' 
    });
  } catch (error) {
    console.error('❌ Error saving coding progress:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save coding progress',
      details: error.message
    });
  }
};

/**
 * Save MCQ answer during test
 */
exports.saveMCQAnswer = async (req, res) => {
  try {
    const { studentId, testId, sectionId, questionId, selectedOption } = req.body;
    
    console.log(`💾 Saving MCQ answer - Student: ${studentId}, Test: ${testId}, Question: ${questionId}, Answer: ${selectedOption}`);
    
    // Get the test session
    const testSession = await TestSession.findOne({
      where: { studentId, testId }
    });
    
    if (!testSession) {
      return res.status(404).json({
        success: false,
        error: 'Test session not found'
      });
    }
    
    // Get or create section score
    let sectionScore = await SectionScore.findOne({
      where: { 
        testSessionId: testSession.id,
        sectionId: sectionId
      }
    });
    
    if (!sectionScore) {
      sectionScore = await SectionScore.create({
        testSessionId: testSession.id,
        sectionId: sectionId,
        score: 0,
        maxScore: 0,
        answers: {},
        unansweredQuestions: []
      });
    }
    
    // Update answers
    const currentAnswers = sectionScore.answers || {};
    currentAnswers[questionId] = selectedOption;
    
    // Get question to check if answer is correct
    const question = await MCQ.findByPk(questionId);
    let newScore = sectionScore.score;
    
    if (question && question.correctOptionLetter === selectedOption) {
      // Check if this is a new correct answer
      const previousAnswer = sectionScore.answers ? sectionScore.answers[questionId] : null;
      if (previousAnswer !== selectedOption) {
        newScore += question.marks || 1;
      }
    }
    
    // Update section score
    await sectionScore.update({
      answers: currentAnswers,
      score: newScore
    });
    
    console.log(`✅ MCQ answer saved successfully`);
    
    res.json({ 
      success: true, 
      message: 'MCQ answer saved successfully',
      score: newScore
    });
  } catch (error) {
    console.error('❌ Error saving MCQ answer:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save MCQ answer',
      details: error.message
    });
  }
};

/**
 * Auto-save test progress (called periodically)
 */
exports.autoSaveProgress = async (req, res) => {
  try {
    const { studentId, testId, currentSection, answers, codingSubmissions } = req.body;
    
    console.log(`🔄 Auto-saving progress - Student: ${studentId}, Test: ${testId}`);
    
    // Update test session with current progress
    await TestSession.update(
      { 
        currentSectionIndex: currentSection,
        sectionSubmissions: answers || []
      },
      { where: { studentId, testId } }
    );
    
    // Save any coding submissions
    if (codingSubmissions && codingSubmissions.length > 0) {
      for (const submission of codingSubmissions) {
        await CodeSubmission.upsert({
          studentId,
          testId,
          codingQuestionId: submission.questionId,
          code: submission.code,
          language: submission.language,
          testResults: submission.testResults || [],
          score: submission.score || 0,
          status: 'auto-saved',
          isDryRun: false
        });
      }
    }
    
    console.log(`✅ Auto-save completed successfully`);
    
    res.json({ 
      success: true, 
      message: 'Progress auto-saved successfully' 
    });
  } catch (error) {
    console.error('❌ Error auto-saving progress:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to auto-save progress',
      details: error.message
    });
  }
};