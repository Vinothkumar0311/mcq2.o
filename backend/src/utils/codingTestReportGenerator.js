const { TestSession, Test, SectionSubmission, CodeSubmission } = require('../models');
const { findStudentById } = require('./studentLookup');

async function generateCodingTestReport(sessionId) {
  try {
    console.log(`📋 Generating coding test report for session: ${sessionId}`);
    
    // Get test session
    const session = await TestSession.findByPk(sessionId);
    if (!session) {
      throw new Error('Test session not found');
    }
    
    // Get test details
    const test = await Test.findOne({ where: { testId: session.testId } });
    if (!test) {
      throw new Error('Test not found');
    }
    
    // Get student details
    const student = await findStudentById(session.studentId);
    if (!student) {
      throw new Error('Student not found');
    }
    
    // Get section submissions
    const sectionSubmissions = await SectionSubmission.findAll({
      where: { testSessionId: session.id }
    });
    
    // Get coding submissions
    const codingSubmissions = await CodeSubmission.findAll({
      where: { 
        testId: session.testId,
        studentId: session.studentId,
        isDryRun: false
      }
    });
    
    // Calculate overall statistics
    const totalScore = session.totalScore || 0;
    const maxScore = session.maxScore || 100;
    const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
    const grade = getGrade(percentage);
    const status = percentage >= 60 ? 'PASS' : 'FAIL';
    
    // Process coding results
    const codingResults = [];
    let totalTestCases = 0;
    let passedTestCases = 0;
    
    codingSubmissions.forEach((submission, index) => {
      const testResults = submission.testResults || {};
      const passed = testResults.passed || 0;
      const total = testResults.total || 0;
      
      totalTestCases += total;
      passedTestCases += passed;
      
      codingResults.push({
        problemNumber: index + 1,
        language: submission.language,
        score: submission.score || 0,
        maxScore: submission.maxScore || 0,
        testCasesPassed: passed,
        totalTestCases: total,
        successRate: total > 0 ? Math.round((passed / total) * 100) : 0,
        status: submission.status || 'submitted',
        executionTime: submission.executionTime || 0,
        codeLength: submission.code ? submission.code.length : 0,
        submittedAt: submission.createdAt
      });
    });
    
    // Generate detailed report
    const report = {
      // Header Information
      reportId: `CR_${sessionId}_${Date.now()}`,
      generatedAt: new Date().toISOString(),
      reportType: 'CODING_TEST_REPORT',
      
      // Student Information
      student: {
        id: session.studentId,
        name: student.name,
        email: student.email,
        department: student.department || 'N/A',
        userType: student.userType
      },
      
      // Test Information
      test: {
        id: session.testId,
        name: test.name,
        description: test.description,
        type: 'CODING_ASSESSMENT'
      },
      
      // Session Information
      session: {
        id: session.id,
        startedAt: session.startedAt,
        completedAt: session.completedAt,
        duration: session.completedAt && session.startedAt ? 
          Math.round((new Date(session.completedAt) - new Date(session.startedAt)) / (1000 * 60)) : 0,
        status: session.status
      },
      
      // Overall Results
      results: {
        totalScore,
        maxScore,
        percentage,
        grade,
        status,
        totalProblems: codingResults.length,
        solvedProblems: codingResults.filter(r => r.score > 0).length,
        totalTestCases,
        passedTestCases,
        overallTestCaseSuccess: totalTestCases > 0 ? Math.round((passedTestCases / totalTestCases) * 100) : 0
      },
      
      // Detailed Problem Results
      problems: codingResults,
      
      // Performance Analysis
      analysis: {
        strengths: generateStrengths(codingResults, percentage),
        improvements: generateImprovements(codingResults, percentage),
        recommendations: generateRecommendations(codingResults, percentage),
        languageUsage: getLanguageUsage(codingResults),
        performanceMetrics: {
          averageExecutionTime: codingResults.length > 0 ? 
            Math.round(codingResults.reduce((sum, r) => sum + r.executionTime, 0) / codingResults.length) : 0,
          averageCodeLength: codingResults.length > 0 ? 
            Math.round(codingResults.reduce((sum, r) => sum + r.codeLength, 0) / codingResults.length) : 0,
          averageSuccessRate: codingResults.length > 0 ? 
            Math.round(codingResults.reduce((sum, r) => sum + r.successRate, 0) / codingResults.length) : 0
        }
      }
    };
    
    console.log(`✅ Generated coding test report: ${report.reportId}`);
    return report;
    
  } catch (error) {
    console.error('❌ Error generating coding test report:', error);
    throw error;
  }
}

function getGrade(percentage) {
  if (percentage >= 90) return 'A+';
  if (percentage >= 85) return 'A';
  if (percentage >= 80) return 'A-';
  if (percentage >= 75) return 'B+';
  if (percentage >= 70) return 'B';
  if (percentage >= 65) return 'B-';
  if (percentage >= 60) return 'C+';
  if (percentage >= 55) return 'C';
  if (percentage >= 50) return 'C-';
  return 'F';
}

function generateStrengths(codingResults, percentage) {
  const strengths = [];
  
  if (percentage >= 90) {
    strengths.push('Excellent problem-solving skills demonstrated');
  } else if (percentage >= 80) {
    strengths.push('Strong algorithmic thinking and implementation');
  } else if (percentage >= 70) {
    strengths.push('Good understanding of programming concepts');
  }
  
  const highSuccessProblems = codingResults.filter(r => r.successRate >= 80);
  if (highSuccessProblems.length > 0) {
    strengths.push(`Successfully solved ${highSuccessProblems.length} problem(s) with high test case success rate`);
  }
  
  const languages = [...new Set(codingResults.map(r => r.language))];
  if (languages.length > 1) {
    strengths.push(`Demonstrated versatility by using multiple programming languages: ${languages.join(', ')}`);
  }
  
  return strengths.length > 0 ? strengths : ['Completed the coding assessment'];
}

function generateImprovements(codingResults, percentage) {
  const improvements = [];
  
  if (percentage < 60) {
    improvements.push('Focus on fundamental programming concepts and problem-solving techniques');
  } else if (percentage < 80) {
    improvements.push('Work on optimizing solutions and handling edge cases');
  }
  
  const lowSuccessProblems = codingResults.filter(r => r.successRate < 50);
  if (lowSuccessProblems.length > 0) {
    improvements.push(`Review and practice problems similar to Problem ${lowSuccessProblems.map(p => p.problemNumber).join(', ')}`);
  }
  
  const failedProblems = codingResults.filter(r => r.score === 0);
  if (failedProblems.length > 0) {
    improvements.push('Practice more coding problems to improve implementation skills');
  }
  
  return improvements.length > 0 ? improvements : ['Continue practicing to maintain current skill level'];
}

function generateRecommendations(codingResults, percentage) {
  const recommendations = [];
  
  if (percentage >= 90) {
    recommendations.push('Excellent work! Consider mentoring others or tackling advanced algorithmic challenges');
  } else if (percentage >= 80) {
    recommendations.push('Strong performance! Focus on advanced data structures and algorithms');
  } else if (percentage >= 70) {
    recommendations.push('Good foundation! Practice more complex problems and optimize your solutions');
  } else if (percentage >= 60) {
    recommendations.push('Solid effort! Review fundamental concepts and practice regularly');
  } else {
    recommendations.push('Keep practicing! Focus on basic programming concepts and simple problem-solving');
  }
  
  const avgExecutionTime = codingResults.length > 0 ? 
    codingResults.reduce((sum, r) => sum + r.executionTime, 0) / codingResults.length : 0;
  
  if (avgExecutionTime > 2000) {
    recommendations.push('Work on writing more efficient algorithms to reduce execution time');
  }
  
  return recommendations;
}

function getLanguageUsage(codingResults) {
  const usage = {};
  codingResults.forEach(result => {
    usage[result.language] = (usage[result.language] || 0) + 1;
  });
  return usage;
}

module.exports = {
  generateCodingTestReport
};