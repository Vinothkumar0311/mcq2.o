const { StudentsResults } = require('../models');

// Store test result
exports.storeTestResult = async (req, res) => {
  try {
    const {
      testId,
      testName,
      userEmail,
      studentName,
      department,
      sinNumber,
      totalScore,
      maxScore,
      percentage,
      completedAt,
      date,
      answers,
      sessionId
    } = req.body;

    console.log('Storing test result:', { testId, testName, userEmail, studentName });

    // Create or update test result
    const result = await StudentsResults.create({
      testId,
      testName,
      userEmail,
      studentName,
      department: department || 'N/A',
      sinNumber: sinNumber || 'N/A',
      totalScore: totalScore || 0,
      maxScore: maxScore || 0,
      percentage: percentage || 0,
      completedAt: completedAt || new Date(),
      date: date || new Date().toISOString().split('T')[0],
      answers: JSON.stringify(answers || {}),
      sessionId: sessionId || `session_${testId}_${Date.now()}`
    });

    console.log('✅ Test result stored successfully:', result.id);

    res.json({
      success: true,
      message: 'Test result stored successfully',
      resultId: result.id
    });

  } catch (error) {
    console.error('❌ Error storing test result:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to store test result',
      message: error.message
    });
  }
};

// Get test results by user email
exports.getTestResultsByEmail = async (req, res) => {
  try {
    const { userEmail } = req.params;

    console.log('Fetching test results for email:', userEmail);

    const results = await StudentsResults.findAll({
      where: { userEmail },
      order: [['completedAt', 'DESC']]
    });

    console.log(`Found ${results.length} test results for ${userEmail}`);

    const formattedResults = results.map(result => ({
      sessionId: result.sessionId,
      testName: result.testName,
      studentName: result.studentName,
      sinNumber: result.sinNumber,
      department: result.department,
      percentage: result.percentage,
      totalScore: result.totalScore,
      maxScore: result.maxScore,
      date: result.date,
      completedAt: result.completedAt,
      downloadUrl: `/api/student/download-report/${result.sessionId}`
    }));

    res.json({
      success: true,
      results: formattedResults
    });

  } catch (error) {
    console.error('❌ Error fetching test results:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch test results',
      message: error.message
    });
  }
};

// Download report by session ID
exports.downloadReportBySession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const result = await StudentsResults.findOne({
      where: { sessionId }
    });

    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Test result not found'
      });
    }

    // Generate simple PDF
    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument({ margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${result.testName}_Result.pdf"`);

    doc.pipe(res);

    // Header
    doc.fontSize(20).fillColor('#2563eb').text('TEST RESULT REPORT', { align: 'center' });
    doc.moveDown(1);

    // Student Info
    doc.fontSize(16).fillColor('#000').text('STUDENT INFORMATION', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(12)
       .text(`Name: ${result.studentName}`)
       .text(`Email: ${result.userEmail}`)
       .text(`Department: ${result.department}`)
       .text(`SIN Number: ${result.sinNumber}`);
    doc.moveDown(1);

    // Test Info
    doc.fontSize(16).fillColor('#000').text('TEST INFORMATION', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(12)
       .text(`Test Name: ${result.testName}`)
       .text(`Date: ${result.date}`)
       .text(`Completed: ${new Date(result.completedAt).toLocaleString()}`);
    doc.moveDown(1);

    // Results
    doc.fontSize(16).fillColor('#000').text('RESULTS', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(12)
       .text(`Score: ${result.totalScore}/${result.maxScore}`)
       .text(`Percentage: ${result.percentage}%`)
       .fillColor(result.percentage >= 60 ? '#16a34a' : '#dc2626')
       .text(`Status: ${result.percentage >= 60 ? 'PASS' : 'FAIL'}`)
       .fillColor('#000');

    doc.end();

  } catch (error) {
    console.error('❌ Error downloading report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to download report'
    });
  }
};