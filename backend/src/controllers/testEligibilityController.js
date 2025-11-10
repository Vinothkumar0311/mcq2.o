const { StudentViolation, TestSession, User, LicensedUser } = require('../models');
const { Op } = require('sequelize');

/**
 * Check if student is eligible to take tests
 */
exports.checkTestEligibility = async (req, res) => {
  try {
    const { studentId } = req.params;
    
    console.log(`🔍 Checking test eligibility for student: ${studentId}`);
    
    // Check for active blocked violations
    const blockedViolation = await StudentViolation.findOne({
      where: { 
        studentId, 
        status: 'Blocked' 
      },
      order: [['createdAt', 'DESC']]
    });
    
    if (blockedViolation) {
      console.log(`🚫 Student ${studentId} is blocked due to violation: ${blockedViolation.violationType}`);
      
      return res.status(403).json({
        success: false,
        eligible: false,
        blocked: true,
        message: 'Access denied: You are blocked due to test violations',
        violation: {
          id: blockedViolation.id,
          type: blockedViolation.violationType,
          description: blockedViolation.description,
          severity: blockedViolation.severity,
          blockedAt: blockedViolation.reviewedAt,
          reason: blockedViolation.adminNotes
        }
      });
    }
    
    // Check for any active violations (warnings)
    const activeViolations = await StudentViolation.findAll({
      where: { 
        studentId, 
        status: 'Active' 
      },
      order: [['createdAt', 'DESC']],
      limit: 5
    });
    
    console.log(`✅ Student ${studentId} is eligible. Active violations: ${activeViolations.length}`);
    
    res.json({
      success: true,
      eligible: true,
      blocked: false,
      message: 'Student is eligible to take tests',
      warnings: activeViolations.length > 0 ? {
        count: activeViolations.length,
        message: `You have ${activeViolations.length} active violation(s). Please follow test guidelines.`,
        violations: activeViolations.map(v => ({
          type: v.violationType,
          severity: v.severity,
          date: v.createdAt
        }))
      } : null
    });
    
  } catch (error) {
    console.error('❌ Error checking test eligibility:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check test eligibility',
      details: error.message
    });
  }
};

/**
 * Get student violation history
 */
exports.getStudentViolationHistory = async (req, res) => {
  try {
    const { studentId } = req.params;
    
    const violations = await StudentViolation.findAll({
      where: { studentId },
      order: [['createdAt', 'DESC']],
      limit: 10
    });
    
    const summary = {
      total: violations.length,
      active: violations.filter(v => v.status === 'Active').length,
      blocked: violations.filter(v => v.status === 'Blocked').length,
      cleared: violations.filter(v => v.status === 'Cleared').length,
      byType: violations.reduce((acc, v) => {
        acc[v.violationType] = (acc[v.violationType] || 0) + 1;
        return acc;
      }, {}),
      bySeverity: violations.reduce((acc, v) => {
        acc[v.severity] = (acc[v.severity] || 0) + 1;
        return acc;
      }, {})
    };
    
    res.json({
      success: true,
      violations,
      summary
    });
    
  } catch (error) {
    console.error('❌ Error fetching violation history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch violation history'
    });
  }
};

/**
 * Middleware to check eligibility before test start
 */
exports.eligibilityMiddleware = async (req, res, next) => {
  try {
    const studentId = req.body.studentId || req.params.studentId || req.session?.studentId;
    
    if (!studentId) {
      return res.status(400).json({
        success: false,
        error: 'Student ID is required'
      });
    }
    
    // Check for blocked status
    const blockedViolation = await StudentViolation.findOne({
      where: { 
        studentId, 
        status: 'Blocked' 
      }
    });
    
    if (blockedViolation) {
      return res.status(403).json({
        success: false,
        blocked: true,
        message: 'You are blocked from taking tests due to violations',
        violation: {
          type: blockedViolation.violationType,
          reason: blockedViolation.adminNotes
        }
      });
    }
    
    // Add violation count to request for monitoring
    const activeViolationCount = await StudentViolation.count({
      where: { 
        studentId, 
        status: 'Active' 
      }
    });
    
    req.studentViolationCount = activeViolationCount;
    next();
    
  } catch (error) {
    console.error('❌ Error in eligibility middleware:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check eligibility'
    });
  }
};