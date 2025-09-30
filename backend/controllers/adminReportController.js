const { Test, TestSession, Section, SectionScore, User, Department, StudentTestResult, sequelize } = require('../models');
const { Op } = require('sequelize');
const { generatePDFReport } = require('../utils/pdfGenerator');
const XLSX = require('xlsx');

/**
 * Get all tests with report data for admin dashboard
 */
const getAllTestsWithReports = async (req, res) => {
  try {
    // Use the new test results controller to get all results
    const testResultsController = require('./testResultsController');
    
    // Create a mock request/response to get all test results
    const mockReq = { query: {} };
    const mockRes = {
      json: (data) => data,
      status: (code) => ({ json: (data) => ({ status: code, ...data }) })
    };
    
    // Get all test results
    const resultsData = await new Promise((resolve, reject) => {
      try {
        testResultsController.getAllTestResults(mockReq, {
          json: resolve,
          status: (code) => ({ json: (data) => resolve({ status: code, ...data }) })
        });
      } catch (error) {
        console.error('❌ Error calling testResultsController for all tests:', error);
        reject(error);
      }
    });
    
    if (resultsData.success && resultsData.results) {
      // Group results by testId
      const testGroups = resultsData.results.reduce((acc, result) => {
        if (!acc[result.testId]) {
          acc[result.testId] = {
            testId: result.testId,
            testName: result.testName,
            students: [],
            createdAt: result.completedAt
          };
        }
        acc[result.testId].students.push(result);
        return acc;
      }, {});
      
      // Convert to test stats format
      const testStats = Object.values(testGroups).map(group => {
        const students = group.students;
        const totalStudents = students.length;
        const averageScore = totalStudents > 0 ? 
          Math.round(students.reduce((sum, s) => sum + s.percentage, 0) / totalStudents) : 0;
        
        return {
          testId: group.testId,
          testName: group.testName,
          description: `Test with ${totalStudents} completed students`,
          testDate: new Date(group.createdAt).toISOString().split('T')[0],
          startTime: new Date(group.createdAt).toTimeString().split(' ')[0],
          totalStudents: totalStudents,
          withReports: totalStudents,
          hasReports: totalStudents > 0,
          averageScore: averageScore
        };
      });
      
      const totalTests = testStats.length;
      const testsWithReports = testStats.filter(t => t.hasReports).length;
      const totalStudents = testStats.reduce((sum, t) => sum + t.totalStudents, 0);
      const pendingReports = 0; // All results are already in database
      
      res.json({
        success: true,
        data: {
          summary: {
            totalTests,
            testsWithReports,
            totalStudents,
            pendingReports
          },
          tests: testStats
        }
      });
    } else {
      res.json({
        success: true,
        data: {
          summary: {
            totalTests: 0,
            testsWithReports: 0,
            totalStudents: 0,
            pendingReports: 0
          },
          tests: []
        }
      });
    }
  } catch (error) {
    console.error('Error fetching tests with reports:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch test reports data'
    });
  }
};

/**
 * Get test report data
 * @param {Object} req - Express request object
 * @param {string} req.params.testId - Test ID
 */
const getTestReport = async (req, res) => {
  const { testId } = req.params;
  
  // Input validation
  if (!testId || typeof testId !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Invalid test ID provided'
    });
  }
  
  try {
    // Use the new test results controller to get results for this test
    const testResultsController = require('./testResultsController');
    
    // Create a mock request/response to get test results
    const mockReq = { query: { testId } };
    const mockRes = {
      json: (data) => data,
      status: (code) => ({ json: (data) => ({ status: code, ...data }) })
    };
    
    // Get test results
    const resultsData = await new Promise((resolve, reject) => {
      try {
        testResultsController.getAllTestResults(mockReq, {
          json: resolve,
          status: (code) => ({ json: (data) => resolve({ status: code, ...data }) })
        });
      } catch (error) {
        console.error('❌ Error calling testResultsController:', error);
        reject(error);
      }
    });
    
    if (!resultsData.success || !resultsData.results || resultsData.results.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No test results found for this test'
      });
    }
    
    const testResults = resultsData.results;
    const firstResult = testResults[0];
    
    // Format the response
    const reportData = {
      test: {
        id: testId,
        name: firstResult.testName,
        description: `Test completed by ${testResults.length} students`,
        testDate: new Date(firstResult.completedAt).toISOString().split('T')[0],
        startTime: new Date(firstResult.completedAt).toTimeString().split(' ')[0],
        totalStudents: testResults.length
      },
      sections: [
        { id: 1, name: 'Overall Test', type: 'mixed' }
      ],
      students: []
    };
    
    // Process student data
    reportData.students = testResults.map((result, index) => ({
      id: result.studentId,
      name: result.studentName || 'Unknown Student',
      email: result.studentEmail || 'N/A',
      department: result.department || 'N/A',
      status: 'completed',
      startedAt: result.completedAt,
      completedAt: result.completedAt,
      totalScore: result.totalScore || 0,
      maxScore: result.maxScore || 0,
      averageScore: result.percentage || 0,
      sectionScores: {
        1: {
          marksObtained: result.totalScore || 0,
          maxMarks: result.maxScore || 0,
          status: 'completed'
        }
      }
    }));
    
    // Compute ranks
    const sortedByScore = [...reportData.students].sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0));
    let lastScore = null;
    let lastRank = 0;
    sortedByScore.forEach((s, idx) => {
      if (lastScore === null || s.totalScore !== lastScore) {
        lastRank = idx + 1;
        lastScore = s.totalScore;
      }
      s.rank = lastRank;
    });
    
    const rankMap = new Map(sortedByScore.map(s => [s.id, s.rank]));
    reportData.students = reportData.students.map(s => ({ ...s, rank: rankMap.get(s.id) }));
    
    // Calculate statistics
    const totalScores = reportData.students.map(s => s.totalScore || 0);
    const stats = {
      totalStudents: reportData.students.length,
      averageScore: totalScores.length > 0 ? totalScores.reduce((a, b) => a + b, 0) / totalScores.length : 0,
      highestScore: totalScores.length > 0 ? Math.max(...totalScores) : 0,
      lowestScore: totalScores.length > 0 ? Math.min(...totalScores) : 0,
      sectionStats: {
        1: {
          totalMarks: totalScores.reduce((a, b) => a + b, 0),
          count: totalScores.length,
          highest: totalScores.length > 0 ? Math.max(...totalScores) : 0,
          lowest: totalScores.length > 0 ? Math.min(...totalScores) : 0,
          average: totalScores.length > 0 ? totalScores.reduce((a, b) => a + b, 0) / totalScores.length : 0
        }
      }
    };
    
    reportData.statistics = stats;
    
    res.json({
      success: true,
      data: reportData
    });
    
  } catch (error) {
    console.error('Error generating test report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate test report',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Generate and download PDF report
 * @param {Object} req - Express request object
 * @param {string} req.params.testId - Test ID
 */
const downloadPDFReport = async (req, res) => {
  const { testId } = req.params;
  
  console.log('📄 PDF Report request for testId:', testId);
  
  // Input validation
  if (!testId || typeof testId !== 'string') {
    console.error('❌ Invalid test ID provided:', testId);
    return res.status(400).json({
      success: false,
      error: 'Invalid test ID provided'
    });
  }
  
  try {
    console.log('🔍 Getting report data for testId:', testId);
    
    // Get report data
    const reportData = await getTestReportData(testId);
    
    if (!reportData) {
      console.error('❌ No report data found for testId:', testId);
      return res.status(404).json({
        success: false,
        error: 'Test report data not found'
      });
    }

    console.log('✅ Report data found, generating PDF...');
    console.log('📊 Students count:', reportData.students?.length || 0);

    // Try to generate PDF, fallback to simple text report if it fails
    try {
      const pdfBuffer = await generatePDFReport(reportData);
      
      console.log('✅ PDF generated successfully, size:', pdfBuffer.length, 'bytes');
      
      // Set response headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=test-report-${testId}.pdf`);
      res.setHeader('Content-Length', pdfBuffer.length);
      
      // Send the PDF
      res.send(pdfBuffer);
    } catch (pdfError) {
      console.error('❌ PDF generation failed, creating simple text report:', pdfError);
      
      // Fallback: Create a simple text report
      const textReport = createSimpleTextReport(reportData);
      
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', `attachment; filename=test-report-${testId}.txt`);
      res.send(textReport);
    }
    
  } catch (error) {
    console.error('❌ Error generating PDF report:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({
      success: false,
      error: 'Failed to generate PDF report',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get report generation status
 * @param {Object} req - Express request object
 * @param {string} req.params.testId - Test ID
 */
const getReportStatus = async (req, res) => {
  const { testId } = req.params;
  
  // Input validation
  if (!testId || typeof testId !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Invalid test ID provided'
    });
  }
  
  try {
    // Use the new test results controller to check if results exist
    const testResultsController = require('./testResultsController');
    
    // Create a mock request/response to get test results
    const mockReq = { query: { testId } };
    const mockRes = {
      json: (data) => data,
      status: (code) => ({ json: (data) => ({ status: code, ...data }) })
    };
    
    // Get test results
    const resultsData = await new Promise((resolve, reject) => {
      try {
        testResultsController.getAllTestResults(mockReq, {
          json: resolve,
          status: (code) => ({ json: (data) => resolve({ status: code, ...data }) })
        });
      } catch (error) {
        console.error('❌ Error calling testResultsController for status:', error);
        reject(error);
      }
    });
    
    const reportReady = resultsData.success && resultsData.results && resultsData.results.length > 0;
    const sessionCount = reportReady ? resultsData.results.length : 0;
    
    res.json({
      success: true,
      data: {
        reportReady,
        nextGenerationTime: reportReady ? null : new Date(Date.now() + 5 * 60000).toISOString(),
        testId,
        sessionsProcessed: sessionCount
      }
    });
    
  } catch (error) {
    console.error('Error getting report status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get report status',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Helper function to get test report data (used by both JSON and PDF endpoints)
 * @param {string} testId - Test ID
 * @returns {Promise<Object>} Report data
 */
async function getTestReportData(testId) {
  // Input validation
  if (!testId || typeof testId !== 'string') {
    throw new Error('Invalid test ID provided');
  }
  
  try {
    console.log('🔍 getTestReportData called for testId:', testId);
    
    // Use the new test results controller to get results
    const testResultsController = require('./testResultsController');
    
    // Create a mock request/response to get test results
    const mockReq = { query: { testId } };
    const mockRes = {
      json: (data) => data,
      status: (code) => ({ json: (data) => ({ status: code, ...data }) })
    };
    
    console.log('📞 Calling testResultsController.getAllTestResults...');
    
    // Get test results
    const resultsData = await new Promise((resolve, reject) => {
      try {
        testResultsController.getAllTestResults(mockReq, {
          json: resolve,
          status: (code) => ({ json: (data) => resolve({ status: code, ...data }) })
        });
      } catch (error) {
        console.error('❌ Error in testResultsController call:', error);
        reject(error);
      }
    });
    
    console.log('📊 Results data received:', {
      success: resultsData.success,
      resultsCount: resultsData.results?.length || 0
    });
    
    if (!resultsData.success || !resultsData.results || resultsData.results.length === 0) {
      console.log('❌ No valid results found');
      return null;
    }
    
    const testResults = resultsData.results;
    const firstResult = testResults[0];
    
    console.log('✅ Processing', testResults.length, 'test results');
    console.log('📝 First result sample:', {
      testName: firstResult.testName,
      studentName: firstResult.studentName,
      totalScore: firstResult.totalScore,
      maxScore: firstResult.maxScore
    });
    
    // Format the data
    const reportData = {
      test: {
        id: testId,
        name: firstResult.testName || 'Unknown Test',
        description: `Test completed by ${testResults.length} students`,
        testDate: new Date(firstResult.completedAt).toISOString().split('T')[0],
        startTime: new Date(firstResult.completedAt).toTimeString().split(' ')[0],
        totalStudents: testResults.length
      },
      sections: [
        { id: 1, name: 'Overall Test', type: 'mixed' }
      ],
      students: testResults.map(result => ({
        id: result.studentId,
        name: result.studentName || 'Unknown Student',
        email: result.studentEmail || 'N/A',
        department: result.department || 'N/A',
        status: 'completed',
        startedAt: result.completedAt,
        completedAt: result.completedAt,
        totalScore: result.totalScore || 0,
        maxScore: result.maxScore || 0,
        sectionScores: {
          1: {
            marksObtained: result.totalScore || 0,
            maxMarks: result.maxScore || 0,
            status: 'completed'
          }
        }
      }))
    };
    
    console.log('✅ Report data formatted successfully');
    return reportData;
  } catch (error) {
    console.error('❌ Error in getTestReportData:', error);
    console.error('Stack trace:', error.stack);
    throw error;
  }
}

// Download Excel report
const downloadXlsxReport = async (req, res) => {
  const { testId } = req.params;
  
  console.log('📊 Excel Report request for testId:', testId);
  
  try {
    console.log('🔍 Getting report data for Excel export...');
    const data = await getTestReportData(testId);
    
    if (!data) {
      console.error('❌ No report data found for Excel export, testId:', testId);
      return res.status(404).json({ success: false, error: 'Test report data not found' });
    }

    console.log('✅ Report data found for Excel, students count:', data.students?.length || 0);

    // Compute ranks and averages (if not present)
    const students = data.students.map(s => ({
      ...s,
      averageScore: s.maxScore > 0 ? Math.round(((s.totalScore || 0) / s.maxScore) * 1000) / 10 : 0
    }));
    const sorted = [...students].sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0));
    let last = null, lastRank = 0;
    sorted.forEach((s, i) => {
      if (last === null || s.totalScore !== last) {
        lastRank = i + 1;
        last = s.totalScore;
      }
      s.rank = lastRank;
    });
    const rankMap = new Map(sorted.map(s => [s.id, s.rank]));

    // Build worksheet rows
    // Dynamic section columns ordered by data.sections
    const sectionIds = data.sections.map(s => s.id);
    const sectionHeaders = data.sections.map((s, idx) => `Section ${idx + 1} Score`);

    const rows = students.map(st => {
      const row = {
        'Student Name': st.name,
        'Total Score': st.totalScore || 0,
        'Average Score (%)': st.averageScore || 0,
        'Rank': rankMap.get(st.id) || ''
      };
      sectionIds.forEach((sid, idx) => {
        const score = st.sectionScores[sid]?.marksObtained || 0;
        row[sectionHeaders[idx]] = score;
      });
      return row;
    });

    console.log('📋 Creating Excel workbook with', rows.length, 'rows');
    
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Report');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    console.log('✅ Excel file generated successfully, size:', buf.length, 'bytes');

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${data.test.name.replace(/[^a-zA-Z0-9]/g, '_')}_Report.xlsx"`);
    return res.send(buf);
  } catch (err) {
    console.error('❌ Error generating XLSX report:', err);
    console.error('Stack trace:', err.stack);
    return res.status(500).json({ success: false, error: 'Failed to generate Excel report', details: process.env.NODE_ENV === 'development' ? err.message : undefined });
  }
};

/**
 * Create a simple text report as fallback
 * @param {Object} reportData - Report data
 * @returns {string} Text report
 */
function createSimpleTextReport(reportData) {
  let report = '';
  report += '='.repeat(60) + '\n';
  report += 'TEST REPORT\n';
  report += '='.repeat(60) + '\n\n';
  
  report += `Test Name: ${reportData.test.name}\n`;
  report += `Test ID: ${reportData.test.id}\n`;
  report += `Description: ${reportData.test.description}\n`;
  report += `Test Date: ${reportData.test.testDate}\n`;
  report += `Total Students: ${reportData.test.totalStudents}\n\n`;
  
  report += '-'.repeat(60) + '\n';
  report += 'STUDENT RESULTS\n';
  report += '-'.repeat(60) + '\n\n';
  
  reportData.students.forEach((student, index) => {
    report += `${index + 1}. ${student.name}\n`;
    report += `   Email: ${student.email}\n`;
    report += `   Department: ${student.department}\n`;
    report += `   Total Score: ${student.totalScore}/${student.maxScore}\n`;
    report += `   Percentage: ${Math.round((student.totalScore / student.maxScore) * 100)}%\n`;
    report += `   Status: ${student.status}\n`;
    report += `   Completed: ${new Date(student.completedAt).toLocaleString()}\n\n`;
  });
  
  report += '-'.repeat(60) + '\n';
  report += `Generated on: ${new Date().toLocaleString()}\n`;
  report += '='.repeat(60) + '\n';
  
  return report;
}

module.exports = {
  getAllTestsWithReports,
  getTestReport,
  downloadPDFReport,
  getReportStatus,
  downloadXlsxReport
};
