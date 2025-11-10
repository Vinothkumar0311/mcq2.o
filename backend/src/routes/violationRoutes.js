const express = require('express');
const router = express.Router();
const {
  logViolation,
  getViolations,
  blockStudent,
  unblockStudent,
  unblockAllStudents,
  checkStudentEligibility,
  exportExcel,
  exportPDF
} = require('../controllers/violationController');

// Log a new violation
router.post('/log', logViolation);

// Get all violations with filtering
router.get('/', getViolations);

// Block a student
router.post('/block', blockStudent);

// Unblock a student
router.post('/unblock', unblockStudent);

// Unblock all students
router.post('/unblock-all', unblockAllStudents);

// Block only plagiarism students
router.post('/block-plagiarism-only', async (req, res) => {
  try {
    const { StudentViolation } = require('../models');
    
    console.log('🚫 Blocking only plagiarism students...');
    
    const [updatedCount] = await StudentViolation.update(
      { status: 'Blocked' },
      { 
        where: { 
          violationType: 'Plagiarism',
          status: 'Active'
        } 
      }
    );
    
    console.log(`✅ Blocked ${updatedCount} plagiarism violations`);
    
    res.json({
      success: true,
      message: `Blocked ${updatedCount} students for plagiarism only`,
      blockedPlagiarism: updatedCount
    });
  } catch (error) {
    console.error('❌ Error blocking plagiarism students:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to block plagiarism students'
    });
  }
});

// Check if student is eligible (not blocked)
router.get('/check-eligibility/:studentId', checkStudentEligibility);

// Get all students with violations/plagiarism
router.get('/students-with-violations', async (req, res) => {
  try {
    const { StudentViolation } = require('../models');
    
    const violatedStudents = await StudentViolation.findAll({
      attributes: [
        'studentId',
        'violationType',
        'status',
        'severity',
        'createdAt'
      ],
      where: {
        violationType: ['Plagiarism', 'TabSwitch', 'CopyPaste', 'Cheating']
      },
      order: [['createdAt', 'DESC']]
    });
    
    // Group by student
    const studentGroups = {};
    violatedStudents.forEach(violation => {
      if (!studentGroups[violation.studentId]) {
        studentGroups[violation.studentId] = {
          studentId: violation.studentId,
          violations: [],
          totalViolations: 0,
          isBlocked: false,
          plagiarismCount: 0,
          otherViolationsCount: 0
        };
      }
      
      studentGroups[violation.studentId].violations.push({
        type: violation.violationType,
        severity: violation.severity,
        status: violation.status,
        date: violation.createdAt
      });
      
      studentGroups[violation.studentId].totalViolations++;
      
      if (violation.status === 'Blocked') {
        studentGroups[violation.studentId].isBlocked = true;
      }
      
      if (violation.violationType === 'Plagiarism') {
        studentGroups[violation.studentId].plagiarismCount++;
      } else {
        studentGroups[violation.studentId].otherViolationsCount++;
      }
    });
    
    const result = Object.values(studentGroups);
    
    res.json({
      success: true,
      totalStudents: result.length,
      blockedStudents: result.filter(s => s.isBlocked).length,
      studentsWithPlagiarism: result.filter(s => s.plagiarismCount > 0).length,
      students: result
    });
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Export violations to Excel
router.get('/export/excel', exportExcel);

// Export violations to PDF
router.get('/export/pdf', exportPDF);

// Test violation logging
router.post('/test-log', async (req, res) => {
  try {
    const { StudentViolation } = require('../models');
    
    const violation = await StudentViolation.create({
      studentId: 'test-student',
      testId: 'test-001',
      violationType: 'TabSwitch',
      description: 'Test violation for debugging',
      severity: 'Medium',
      status: 'Active'
    });
    
    res.json({ success: true, violationId: violation.id, message: 'Test violation created' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Auto-detect violations
const ViolationDetector = require('../controllers/violationDetectionController');

router.post('/detect/tab-switch', async (req, res) => {
  try {
    const { studentId, testId, sessionData } = req.body;
    const result = await ViolationDetector.logTabSwitch(studentId, testId, sessionData);
    
    if (result.shouldBlock && result.ejectFromTest) {
      console.log(`🚨 EJECTING STUDENT: ${studentId} from test ${testId}`);
      return res.status(403).json({
        ...result,
        ejected: true,
        message: `You have been ejected from the test due to ${result.violationCount} violations. Contact admin for assistance.`
      });
    }
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/detect/copy-paste', async (req, res) => {
  try {
    const { studentId, testId, pasteData } = req.body;
    const result = await ViolationDetector.logCopyPaste(studentId, testId, pasteData);
    
    if (result.shouldBlock && result.ejectFromTest) {
      console.log(`🚨 EJECTING STUDENT: ${studentId} from test ${testId}`);
      return res.status(403).json({
        ...result,
        ejected: true,
        message: `You have been ejected from the test due to ${result.violationCount} violations. Contact admin for assistance.`
      });
    }
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/detect/plagiarism', async (req, res) => {
  try {
    const { studentId, testId, plagiarismData } = req.body;
    const result = await ViolationDetector.logPlagiarism(studentId, testId, plagiarismData);
    
    if (result.shouldBlock && result.ejectFromTest) {
      console.log(`🚨 EJECTING STUDENT: ${studentId} from test ${testId}`);
      return res.status(403).json({
        ...result,
        ejected: true,
        message: `You have been ejected from the test due to ${result.violationCount} violations. Contact admin for assistance.`
      });
    }
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;