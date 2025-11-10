const { StudentViolation } = require('../models');
const { Op } = require('sequelize');

/**
 * Auto-detect and log violations during test sessions
 */
class ViolationDetector {
  
  // Log tab switch violation
  static async logTabSwitch(studentId, testId, sessionData = {}) {
    try {
      console.log(`🔄 Tab switch detected - Student: ${studentId}, Test: ${testId}`);
      
      await StudentViolation.create({
        studentId,
        testId,
        violationType: 'TabSwitch',
        description: 'Student switched browser tab during test session',
        severity: 'Medium',
        evidence: JSON.stringify({
          timestamp: new Date().toISOString(),
          userAgent: sessionData.userAgent,
          sessionId: sessionData.sessionId,
          currentQuestion: sessionData.currentQuestion
        })
      });
      
      // Check if student should be auto-blocked
      const blockCheck = await this.checkAutoBlock(studentId, testId);
      
      return { 
        success: true, 
        message: 'Tab switch violation logged',
        ...blockCheck
      };
    } catch (error) {
      console.error('❌ Error logging tab switch violation:', error);
      return { success: false, error: error.message };
    }
  }
  
  // Log time violation (overtime, early submission, etc.)
  static async logTimeViolation(studentId, testId, violationData) {
    try {
      const { type, timeLimit, actualTime, description } = violationData;
      
      console.log(`⏰ Time violation detected - Student: ${studentId}, Type: ${type}`);
      
      let severity = 'Medium';
      if (type === 'overtime' && actualTime > timeLimit * 1.5) {
        severity = 'High';
      } else if (type === 'suspicious_speed' && actualTime < timeLimit * 0.3) {
        severity = 'Critical';
      }
      
      await StudentViolation.create({
        studentId,
        testId,
        violationType: 'Time',
        description: description || `Time violation: ${type}`,
        severity,
        evidence: JSON.stringify({
          violationType: type,
          timeLimit: timeLimit,
          actualTime: actualTime,
          timestamp: new Date().toISOString()
        })
      });
      
      return { success: true, message: 'Time violation logged' };
    } catch (error) {
      console.error('❌ Error logging time violation:', error);
      return { success: false, error: error.message };
    }
  }
  
  // Log copy-paste violation
  static async logCopyPaste(studentId, testId, pasteData) {
    try {
      console.log(`📋 Copy-paste detected - Student: ${studentId}, Test: ${testId}`);
      
      await StudentViolation.create({
        studentId,
        testId,
        violationType: 'CopyPaste',
        description: 'Suspicious copy-paste activity detected during test',
        severity: 'High',
        evidence: JSON.stringify({
          pastedContent: pasteData.content?.substring(0, 500), // Limit content length
          questionId: pasteData.questionId,
          timestamp: new Date().toISOString(),
          contentLength: pasteData.content?.length || 0
        })
      });
      
      // Check if student should be auto-blocked
      const blockCheck = await this.checkAutoBlock(studentId, testId);
      
      return { 
        success: true, 
        message: 'Copy-paste violation logged',
        ...blockCheck
      };
    } catch (error) {
      console.error('❌ Error logging copy-paste violation:', error);
      return { success: false, error: error.message };
    }
  }
  
  // Log plagiarism detection
  static async logPlagiarism(studentId, testId, plagiarismData) {
    try {
      const { similarity, sourceText, suspiciousText, confidence } = plagiarismData;
      
      console.log(`📝 Plagiarism detected - Student: ${studentId}, Similarity: ${similarity}%`);
      
      let severity = 'Medium';
      if (similarity > 80) severity = 'Critical';
      else if (similarity > 60) severity = 'High';
      
      await StudentViolation.create({
        studentId,
        testId,
        violationType: 'Plagiarism',
        description: `Potential plagiarism detected with ${similarity}% similarity`,
        severity,
        evidence: JSON.stringify({
          similarityPercentage: similarity,
          confidence: confidence,
          sourceText: sourceText?.substring(0, 300),
          suspiciousText: suspiciousText?.substring(0, 300),
          timestamp: new Date().toISOString()
        })
      });
      
      // Check if student should be auto-blocked
      const blockCheck = await this.checkAutoBlock(studentId, testId);
      
      return { 
        success: true, 
        message: 'Plagiarism violation logged',
        ...blockCheck
      };
    } catch (error) {
      console.error('❌ Error logging plagiarism violation:', error);
      return { success: false, error: error.message };
    }
  }
  
  // Log technical violations (multiple devices, IP changes, etc.)
  static async logTechnicalViolation(studentId, testId, technicalData) {
    try {
      const { type, details, severity = 'Medium' } = technicalData;
      
      console.log(`⚙️ Technical violation detected - Student: ${studentId}, Type: ${type}`);
      
      await StudentViolation.create({
        studentId,
        testId,
        violationType: 'Technical',
        description: `Technical violation: ${type}`,
        severity,
        evidence: JSON.stringify({
          violationType: type,
          details: details,
          timestamp: new Date().toISOString(),
          userAgent: technicalData.userAgent,
          ipAddress: technicalData.ipAddress
        })
      });
      
      return { success: true, message: 'Technical violation logged' };
    } catch (error) {
      console.error('❌ Error logging technical violation:', error);
      return { success: false, error: error.message };
    }
  }
  
  // Log general cheating behavior
  static async logCheating(studentId, testId, cheatingData) {
    try {
      const { type, description, evidence, severity = 'High' } = cheatingData;
      
      console.log(`🚫 Cheating detected - Student: ${studentId}, Type: ${type}`);
      
      await StudentViolation.create({
        studentId,
        testId,
        violationType: 'Cheating',
        description: description || `Cheating behavior detected: ${type}`,
        severity,
        evidence: JSON.stringify({
          cheatingType: type,
          evidence: evidence,
          timestamp: new Date().toISOString()
        })
      });
      
      return { success: true, message: 'Cheating violation logged' };
    } catch (error) {
      console.error('❌ Error logging cheating violation:', error);
      return { success: false, error: error.message };
    }
  }
  
  // Get violation count for a student
  static async getViolationCount(studentId, testId = null) {
    try {
      const whereClause = { studentId };
      if (testId) whereClause.testId = testId;
      
      const count = await StudentViolation.count({
        where: whereClause
      });
      
      return count;
    } catch (error) {
      console.error('❌ Error getting violation count:', error);
      return 0;
    }
  }
  
  // Check if student should be auto-blocked (3 strikes rule)
  static async checkAutoBlock(studentId, testId) {
    try {
      const testViolations = await StudentViolation.findAll({
        where: {
          studentId,
          testId
        },
        order: [['createdAt', 'DESC']]
      });
      
      const violationCount = testViolations.length;
      
      // 3 strikes rule - block after 3 violations in same test
      if (violationCount >= 3) {
        console.log(`🚫 AUTO-BLOCKING: Student ${studentId} has ${violationCount} violations in test ${testId}`);
        
        // Block all violations for this student
        await StudentViolation.update(
          { 
            status: 'Blocked',
            adminNotes: `Auto-blocked: ${violationCount} violations in test ${testId} (3-strike rule)`,
          },
          { 
            where: { 
              studentId, 
              status: 'Active' 
            } 
          }
        );
        
        return { 
          shouldBlock: true, 
          ejectFromTest: true,
          violationCount,
          reason: `Student blocked due to ${violationCount} violations (3-strike rule)` 
        };
      }
      
      return { shouldBlock: false, violationCount };
    } catch (error) {
      console.error('❌ Error checking auto-block:', error);
      return { shouldBlock: false };
    }
  }
}

module.exports = ViolationDetector;