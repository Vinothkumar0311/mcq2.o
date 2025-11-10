const { TestSession, StudentsResults, User, LicensedUser } = require('../models');

/**
 * Handle test completion and show appropriate response
 * FIXED: Show only completion message, not full results
 */
exports.handleTestCompletion = async (req, res) => {
  try {
    const { testId, studentId } = req.params;

    // Get test session
    const testSession = await TestSession.findOne({
      where: { testId, studentId }
    });

    if (!testSession) {
      return res.status(404).json({
        success: false,
        error: 'Test session not found'
      });
    }

    // FIXED: Get real student info
    let student = await LicensedUser.findByPk(studentId, {
      attributes: ['name', 'email', 'department', 'sin_number']
    });

    if (!student) {
      student = await User.findByPk(studentId, {
        attributes: ['name', 'email', 'department']
      });
    }

    const studentName = student?.name || 'Student';
    const studentEmail = student?.email || 'student@test.com';
    const sinNumber = student?.sin_number || student?.sinNumber || 'N/A';

    // FIXED: Always show completion message first, regardless of results_released
    if (testSession.status === 'completed' || testSession.status === 'submitted') {
      return res.json({
        success: true,
        view: 'test-complete',
        testCompleted: true,
        message: '✅ Test Completed Successfully!',
        subtext: 'Your result will be available once released by the admin.',
        studentInfo: {
          name: studentName,
          email: studentEmail,
          sinNumber: sinNumber,
          department: student?.department || 'N/A'
        },
        testInfo: {
          testId,
          completedAt: testSession.completedAt,
          totalScore: testSession.totalScore,
          maxScore: testSession.maxScore
        },
        resultsReleased: testSession.resultsReleased || false
      });
    }

    return res.status(400).json({
      success: false,
      error: 'Test not completed yet'
    });

  } catch (error) {
    console.error('Error handling test completion:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to handle test completion'
    });
  }
};