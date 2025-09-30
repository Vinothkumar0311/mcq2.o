const { StudentsResults, sequelize } = require('../models');
const { Op } = require('sequelize');

// Validate email format
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Store student test result
exports.storeTestResult = async (req, res) => {
  try {
    const { studentName, email, rollNumber, subjects } = req.body;

    // Validate email
    if (!email || !validateEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid or missing Email ID. Please enter a correct email."
      });
    }

    // Validate required fields
    if (!studentName || !subjects || !Array.isArray(subjects)) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: studentName, email, subjects"
      });
    }

    const transaction = await sequelize.transaction();

    try {
      // Delete existing records for this student+email combination
      await StudentsResults.destroy({
        where: {
          studentName,
          email
        },
        transaction
      });

      // Calculate totals
      let totalMarks = 0;
      let totalMaxMarks = 0;

      const results = [];

      // Store each subject result
      for (const subject of subjects) {
        const { name, marks, maxMarks = 100 } = subject;
        
        if (!name || marks === undefined) {
          throw new Error(`Invalid subject data: ${JSON.stringify(subject)}`);
        }

        totalMarks += parseInt(marks);
        totalMaxMarks += parseInt(maxMarks);

        const percentage = (marks / maxMarks) * 100;
        const status = percentage >= 60 ? 'PASS' : 'FAIL';

        const result = await StudentsResults.create({
          studentName,
          email,
          rollNumber: rollNumber || `ROLL${Date.now()}`,
          subject: name,
          marks: parseInt(marks),
          total: parseInt(maxMarks),
          percentage: parseFloat(percentage.toFixed(2)),
          status
        }, { transaction });

        results.push(result);
      }

      await transaction.commit();

      // Calculate overall result
      const overallPercentage = (totalMarks / totalMaxMarks) * 100;
      const overallStatus = overallPercentage >= 60 ? 'PASS' : 'FAIL';

      console.log(`✅ Stored results for ${studentName} (${email}): ${totalMarks}/${totalMaxMarks} (${overallPercentage.toFixed(2)}%)`);

      res.json({
        success: true,
        message: "Test results stored successfully",
        data: {
          studentName,
          email,
          rollNumber: rollNumber || `ROLL${Date.now()}`,
          totalMarks,
          totalMaxMarks,
          percentage: parseFloat(overallPercentage.toFixed(2)),
          status: overallStatus,
          subjects: results.length
        }
      });

    } catch (error) {
      await transaction.rollback();
      throw error;
    }

  } catch (error) {
    console.error('❌ Error storing test result:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to store test result'
    });
  }
};

// Get student test report
exports.getTestReport = async (req, res) => {
  try {
    const { studentName, email } = req.query;

    // Validate email
    if (!email || !validateEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid or missing Email ID. Please enter a correct email."
      });
    }

    if (!studentName) {
      return res.status(400).json({
        success: false,
        message: "Student name is required"
      });
    }

    // Fetch student results
    const results = await StudentsResults.findAll({
      where: {
        studentName,
        email
      },
      order: [['subject', 'ASC']]
    });

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No test results found for this student"
      });
    }

    // Calculate totals
    const totalMarks = results.reduce((sum, result) => sum + result.marks, 0);
    const totalMaxMarks = results.reduce((sum, result) => sum + result.total, 0);
    const overallPercentage = (totalMarks / totalMaxMarks) * 100;
    const overallStatus = overallPercentage >= 60 ? 'PASS' : 'FAIL';

    const report = {
      studentName: results[0].studentName,
      email: results[0].email,
      rollNumber: results[0].rollNumber,
      subjects: results.map(result => ({
        name: result.subject,
        marks: result.marks,
        total: result.total,
        percentage: result.percentage
      })),
      totalMarks,
      totalMaxMarks,
      overallPercentage: parseFloat(overallPercentage.toFixed(2)),
      status: overallStatus,
      generatedAt: new Date()
    };

    console.log(`📊 Generated report for ${studentName} (${email})`);

    res.json({
      success: true,
      data: report
    });

  } catch (error) {
    console.error('❌ Error generating test report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate test report'
    });
  }
};

// Download test report as PDF
exports.downloadTestReport = async (req, res) => {
  try {
    const { studentName, email } = req.query;

    // Validate email
    if (!email || !validateEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid or missing Email ID. Please enter a correct email."
      });
    }

    // Fetch student results
    const results = await StudentsResults.findAll({
      where: {
        studentName,
        email
      },
      order: [['subject', 'ASC']]
    });

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No test results found for this student"
      });
    }

    // Calculate totals
    const totalMarks = results.reduce((sum, result) => sum + result.marks, 0);
    const totalMaxMarks = results.reduce((sum, result) => sum + result.total, 0);
    const overallPercentage = (totalMarks / totalMaxMarks) * 100;
    const overallStatus = overallPercentage >= 60 ? 'PASS' : 'FAIL';

    // Generate PDF
    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument({ margin: 50 });

    const filename = `${studentName.replace(/[^a-zA-Z0-9]/g, '_')}_Test_Report.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    doc.pipe(res);

    // Header
    doc.fontSize(20).text('Student Test Report', { align: 'center' });
    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();

    // Student Details
    doc.fontSize(14)
       .text(`Name: ${results[0].studentName}`)
       .text(`Email: ${results[0].email}`)
       .text(`Roll No: ${results[0].rollNumber}`)
       .moveDown();

    // Subject-wise marks
    doc.fontSize(12).text('Subject-wise Marks:', { underline: true });
    doc.moveDown(0.5);

    results.forEach(result => {
      doc.text(`Subject: ${result.subject} – ${result.marks}/${result.total} (${result.percentage}%)`);
    });

    doc.moveDown();

    // Overall Result
    doc.fontSize(14)
       .text(`Total: ${totalMarks}/${totalMaxMarks}`)
       .text(`Percentage: ${overallPercentage.toFixed(2)}%`)
       .fillColor(overallStatus === 'PASS' ? 'green' : 'red')
       .text(`Result: ${overallStatus}`)
       .fillColor('black');

    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();

    // Footer
    doc.fontSize(10)
       .text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' });

    doc.end();

    console.log(`📄 PDF report generated for ${studentName} (${email})`);

  } catch (error) {
    console.error('❌ Error generating PDF report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate PDF report'
    });
  }
};

// Get all students list
exports.getAllStudents = async (req, res) => {
  try {
    const students = await StudentsResults.findAll({
      attributes: [
        'studentName',
        'email',
        'rollNumber',
        [sequelize.fn('COUNT', sequelize.col('subject')), 'subjectCount'],
        [sequelize.fn('SUM', sequelize.col('marks')), 'totalMarks'],
        [sequelize.fn('SUM', sequelize.col('total')), 'totalMaxMarks']
      ],
      group: ['studentName', 'email', 'rollNumber'],
      order: [['studentName', 'ASC']]
    });

    const studentList = students.map(student => {
      const percentage = (student.dataValues.totalMarks / student.dataValues.totalMaxMarks) * 100;
      return {
        studentName: student.studentName,
        email: student.email,
        rollNumber: student.rollNumber,
        subjectCount: student.dataValues.subjectCount,
        totalMarks: student.dataValues.totalMarks,
        totalMaxMarks: student.dataValues.totalMaxMarks,
        percentage: parseFloat(percentage.toFixed(2)),
        status: percentage >= 60 ? 'PASS' : 'FAIL'
      };
    });

    res.json({
      success: true,
      data: studentList
    });

  } catch (error) {
    console.error('❌ Error fetching students:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch students list'
    });
  }
};

module.exports = {
  storeTestResult: exports.storeTestResult,
  getTestReport: exports.getTestReport,
  downloadTestReport: exports.downloadTestReport,
  getAllStudents: exports.getAllStudents
};