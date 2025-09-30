const { Test, TestSession, CodeSubmission, CodingQuestion, User, LicensedUser, sequelize } = require('../models');
const { Op } = require('sequelize');

// Get coding test results for reports
exports.getCodingTestResults = async (req, res) => {
  try {
    const { testId, limit = 50 } = req.query;
    
    console.log(`📊 Fetching coding test results for testId: ${testId}`);
    
    let whereClause = { isDryRun: false };
    if (testId) {
      whereClause.testId = testId;
    }

    const submissions = await CodeSubmission.findAll({
      where: whereClause,
      include: [
        {
          model: CodingQuestion,
          as: 'codingQuestion',
          attributes: ['problemStatement', 'marks', 'difficulty']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit)
    });

    console.log(`✅ Found ${submissions.length} coding submissions`);

    const results = submissions.map((submission) => {
      const testResults = submission.testResults || [];
      const passedTests = testResults.filter(t => t.passed).length;
      const totalTests = testResults.length;
      const percentage = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;

      return {
        submissionId: submission.id,
        studentId: submission.studentId,
        studentName: submission.studentName || 'Unknown Student',
        studentEmail: submission.studentEmail || 'N/A',
        department: submission.studentDepartment || 'N/A',
        testId: submission.testId,
        questionId: submission.codingQuestionId,
        language: submission.language,
        status: submission.status,
        score: submission.score || 0,
        maxScore: submission.codingQuestion?.marks || 100,
        percentage,
        passedTests,
        totalTests,
        executionTime: submission.executionTime || 0,
        submissionDate: submission.createdAt,
        code: submission.code,
        testResults: testResults
      };
    });

    res.json({
      success: true,
      data: results,
      total: results.length
    });

  } catch (error) {
    console.error('❌ Error fetching coding test results:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch coding test results'
    });
  }
};

// Get detailed coding test report
exports.getCodingTestReport = async (req, res) => {
  try {
    const { testId } = req.params;
    
    console.log(`📋 Generating coding test report for: ${testId}`);

    // Get test details
    const test = await Test.findOne({
      where: { testId },
      include: [{
        model: CodingQuestion,
        as: 'codingQuestions',
        attributes: ['id', 'problemStatement', 'marks', 'difficulty']
      }]
    });

    if (!test) {
      return res.status(404).json({
        success: false,
        message: 'Test not found'
      });
    }

    // Get all coding submissions for this test
    const submissions = await CodeSubmission.findAll({
      where: { 
        testId,
        isDryRun: false 
      },
      include: [{
        model: CodingQuestion,
        as: 'codingQuestion',
        attributes: ['problemStatement', 'marks']
      }],
      order: [['createdAt', 'DESC']]
    });

    console.log(`📊 Found ${submissions.length} submissions for test ${testId}`);

    // Process submissions with student details
    const results = await Promise.all(submissions.map(async (submission) => {
      let student = null;
      
      // Try LicensedUser first
      try {
        student = await LicensedUser.findByPk(submission.studentId);
      } catch (error) {
        // Try regular User table
        try {
          const numericId = parseInt(submission.studentId);
          if (!isNaN(numericId)) {
            student = await User.findByPk(numericId);
          }
        } catch (err) {
          console.log('Student not found');
        }
      }

      const testResults = submission.testResults || [];
      const passedTests = testResults.filter(t => t.passed).length;
      const totalTests = testResults.length;

      return {
        studentName: student?.name || `Student ${submission.studentId}`,
        studentEmail: student?.email || 'N/A',
        language: submission.language,
        status: submission.status,
        score: submission.score || 0,
        maxScore: submission.codingQuestion?.marks || 100,
        percentage: totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0,
        passedTests,
        totalTests,
        executionTime: submission.executionTime || 0,
        submissionDate: submission.createdAt,
        testResults
      };
    }));

    // Calculate statistics
    const totalSubmissions = results.length;
    const passedSubmissions = results.filter(r => r.status === 'passed').length;
    const averageScore = totalSubmissions > 0 ? 
      Math.round(results.reduce((sum, r) => sum + r.percentage, 0) / totalSubmissions) : 0;

    const report = {
      test: {
        testId: test.testId,
        name: test.name,
        description: test.description,
        codingQuestions: test.codingQuestions || []
      },
      statistics: {
        totalSubmissions,
        passedSubmissions,
        failedSubmissions: totalSubmissions - passedSubmissions,
        passRate: totalSubmissions > 0 ? Math.round((passedSubmissions / totalSubmissions) * 100) : 0,
        averageScore
      },
      results
    };

    res.json({
      success: true,
      data: report
    });

  } catch (error) {
    console.error('❌ Error generating coding test report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate coding test report'
    });
  }
};

// Download coding test report as PDF
exports.downloadCodingTestReport = async (req, res) => {
  try {
    const { testId } = req.params;
    
    console.log(`📄 Generating PDF report for coding test: ${testId}`);

    // Get test and submissions data
    const test = await Test.findOne({ where: { testId } });
    if (!test) {
      return res.status(404).json({
        success: false,
        message: 'Test not found'
      });
    }

    const submissions = await CodeSubmission.findAll({
      where: { testId, isDryRun: false },
      include: [{
        model: CodingQuestion,
        as: 'codingQuestion',
        attributes: ['problemStatement', 'marks']
      }],
      order: [['createdAt', 'ASC']]
    });

    if (submissions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No coding submissions found for this test'
      });
    }

    // Generate PDF
    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument({ margin: 40 });

    const filename = `${test.name.replace(/[^a-zA-Z0-9]/g, '_')}_Coding_Report.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    doc.pipe(res);

    // Header
    doc.fontSize(18).text('CODING TEST REPORT', { align: 'center' });
    doc.moveDown();

    doc.fontSize(12)
       .text(`Test Name: ${test.name}`)
       .text(`Test ID: ${testId}`)
       .text(`Generated: ${new Date().toLocaleString()}`)
       .text(`Total Submissions: ${submissions.length}`);

    doc.moveDown();

    // Results table
    doc.fontSize(14).text('Submission Results', { underline: true });
    doc.moveDown(0.5);

    let currentY = doc.y;
    const cols = {
      sno: 40,
      student: 100,
      language: 200,
      status: 280,
      score: 350,
      tests: 420
    };

    // Table headers
    doc.fontSize(10)
       .text('S.No', cols.sno, currentY)
       .text('Student', cols.student, currentY)
       .text('Language', cols.language, currentY)
       .text('Status', cols.status, currentY)
       .text('Score', cols.score, currentY)
       .text('Tests', cols.tests, currentY);

    currentY += 20;
    doc.moveTo(cols.sno, currentY).lineTo(cols.tests + 60, currentY).stroke();
    currentY += 10;

    // Process each submission
    for (let i = 0; i < submissions.length; i++) {
      const submission = submissions[i];
      
      if (currentY > 700) {
        doc.addPage();
        currentY = 50;
      }

      // Get student name
      let studentName = `Student ${submission.studentId}`;
      try {
        let student = await LicensedUser.findByPk(submission.studentId);
        if (!student) {
          const numericId = parseInt(submission.studentId);
          if (!isNaN(numericId)) {
            student = await User.findByPk(numericId);
          }
        }
        if (student) {
          studentName = student.name;
        }
      } catch (error) {
        console.log('Error getting student name');
      }

      const testResults = submission.testResults || [];
      const passedTests = testResults.filter(t => t.passed).length;
      const totalTests = testResults.length;

      doc.fontSize(9)
         .text((i + 1).toString(), cols.sno, currentY)
         .text(studentName.substring(0, 15), cols.student, currentY)
         .text(submission.language, cols.language, currentY)
         .fillColor(submission.status === 'passed' ? 'green' : 'red')
         .text(submission.status.toUpperCase(), cols.status, currentY)
         .fillColor('black')
         .text(`${submission.score}/${submission.codingQuestion?.marks || 100}`, cols.score, currentY)
         .text(`${passedTests}/${totalTests}`, cols.tests, currentY);

      currentY += 20;
    }

    // Summary
    doc.moveDown(2);
    const passedCount = submissions.filter(s => s.status === 'passed').length;
    const passRate = Math.round((passedCount / submissions.length) * 100);

    doc.fontSize(12)
       .text(`Summary: ${passedCount}/${submissions.length} students passed (${passRate}%)`)
       .text(`Report generated on: ${new Date().toLocaleDateString()}`);

    doc.end();
    console.log(`✅ PDF report generated for test ${testId}`);

  } catch (error) {
    console.error('❌ Error generating PDF report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate PDF report'
    });
  }
};

module.exports = {
  getCodingTestResults: exports.getCodingTestResults,
  getCodingTestReport: exports.getCodingTestReport,
  downloadCodingTestReport: exports.downloadCodingTestReport
};