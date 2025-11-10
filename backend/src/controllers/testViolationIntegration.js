const ViolationDetector = require('./violationDetectionController');

/**
 * Integration functions to be used in existing test controllers
 */

// Add to testSessionController.js - when student switches tabs
exports.handleTabSwitch = async (req, res) => {
  try {
    const { studentId, testId, sessionId } = req.body;
    
    // Log the violation
    await ViolationDetector.logTabSwitch(studentId, testId, {
      sessionId,
      userAgent: req.headers['user-agent'],
      currentQuestion: req.body.currentQuestion
    });
    
    // Check if student should be auto-blocked
    const blockCheck = await ViolationDetector.checkAutoBlock(studentId, testId);
    
    res.json({
      success: true,
      message: 'Tab switch recorded',
      warning: 'Please stay on the test page to avoid violations',
      shouldBlock: blockCheck.shouldBlock,
      blockReason: blockCheck.reason
    });
  } catch (error) {
    console.error('Error handling tab switch:', error);
    res.status(500).json({ success: false, error: 'Failed to record tab switch' });
  }
};

// Add to coding submission controller - detect copy-paste
exports.handleCodeSubmission = async (req, res, next) => {
  try {
    const { studentId, testId, code, questionId } = req.body;
    
    // Simple plagiarism detection (can be enhanced with more sophisticated algorithms)
    if (code && code.length > 100) {
      // Check for suspicious patterns
      const suspiciousPatterns = [
        /\/\*.*copied.*\*\//i,
        /\/\/.*copied.*from/i,
        /\/\/.*source.*:/i,
        /\/\*.*stackoverflow.*\*\//i
      ];
      
      const hasSuspiciousComments = suspiciousPatterns.some(pattern => pattern.test(code));
      
      if (hasSuspiciousComments) {
        await ViolationDetector.logPlagiarism(studentId, testId, {
          similarity: 75, // Estimated based on suspicious comments
          suspiciousText: code.substring(0, 300),
          confidence: 0.8
        });
      }
      
      // Check for excessive copy-paste (if code was pasted in large chunks)
      if (req.body.pasteDetected) {
        await ViolationDetector.logCopyPaste(studentId, testId, {
          content: code,
          questionId: questionId
        });
      }
    }
    
    next(); // Continue with normal submission process
  } catch (error) {
    console.error('Error in code submission violation check:', error);
    next(); // Don't block submission on error
  }
};

// Add to test timer controller - detect time violations
exports.handleTestCompletion = async (req, res, next) => {
  try {
    const { studentId, testId, timeSpent, timeLimit } = req.body;
    
    if (timeSpent && timeLimit) {
      // Check for overtime
      if (timeSpent > timeLimit * 1.1) { // 10% grace period
        await ViolationDetector.logTimeViolation(studentId, testId, {
          type: 'overtime',
          timeLimit: timeLimit,
          actualTime: timeSpent,
          description: `Test completed ${Math.round((timeSpent - timeLimit) / 60)} minutes overtime`
        });
      }
      
      // Check for suspiciously fast completion
      if (timeSpent < timeLimit * 0.3) { // Completed in less than 30% of time
        await ViolationDetector.logTimeViolation(studentId, testId, {
          type: 'suspicious_speed',
          timeLimit: timeLimit,
          actualTime: timeSpent,
          description: `Test completed suspiciously fast in ${Math.round(timeSpent / 60)} minutes`
        });
      }
    }
    
    next();
  } catch (error) {
    console.error('Error in test completion violation check:', error);
    next();
  }
};

// Add to test start controller - check eligibility
exports.checkEligibilityBeforeStart = async (req, res, next) => {
  try {
    const { studentId } = req.body;
    
    // Use the eligibility middleware
    const { eligibilityMiddleware } = require('./testEligibilityController');
    await eligibilityMiddleware(req, res, next);
  } catch (error) {
    console.error('Error checking eligibility:', error);
    res.status(500).json({ success: false, error: 'Failed to check eligibility' });
  }
};

// Detect multiple device usage
exports.handleDeviceChange = async (req, res) => {
  try {
    const { studentId, testId, newDevice, previousDevice } = req.body;
    
    await ViolationDetector.logTechnicalViolation(studentId, testId, {
      type: 'device_change',
      details: {
        previousDevice: previousDevice,
        newDevice: newDevice,
        changeTime: new Date().toISOString()
      },
      severity: 'High',
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip
    });
    
    res.json({
      success: true,
      message: 'Device change recorded',
      warning: 'Using multiple devices during test is not allowed'
    });
  } catch (error) {
    console.error('Error handling device change:', error);
    res.status(500).json({ success: false, error: 'Failed to record device change' });
  }
};

// Detect IP address changes
exports.handleIPChange = async (req, res) => {
  try {
    const { studentId, testId, newIP, previousIP } = req.body;
    
    await ViolationDetector.logTechnicalViolation(studentId, testId, {
      type: 'ip_change',
      details: {
        previousIP: previousIP,
        newIP: newIP,
        changeTime: new Date().toISOString()
      },
      severity: 'Medium',
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip
    });
    
    res.json({
      success: true,
      message: 'IP change recorded'
    });
  } catch (error) {
    console.error('Error handling IP change:', error);
    res.status(500).json({ success: false, error: 'Failed to record IP change' });
  }
};