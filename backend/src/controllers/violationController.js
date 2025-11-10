const { StudentViolation, User, Test, LicensedUser, sequelize } = require('../models');
const { Op } = require('sequelize');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

// Log a new violation
exports.logViolation = async (req, res) => {
  try {
    const { studentId, testId, violationType, description, severity, evidence } = req.body;
    
    console.log(`🚨 Logging violation - Student: ${studentId}, Type: ${violationType}`);
    
    const violation = await StudentViolation.create({
      studentId,
      testId,
      violationType,
      description,
      severity: severity || 'Medium',
      evidence
    });
    
    console.log(`✅ Violation logged with ID: ${violation.id}`);
    
    res.json({ 
      success: true, 
      message: 'Violation logged successfully',
      violationId: violation.id
    });
  } catch (error) {
    console.error('❌ Error logging violation:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to log violation' 
    });
  }
};

// Get all violations with filtering
exports.getViolations = async (req, res) => {
  try {
    const { 
      status, 
      violationType, 
      severity, 
      search, 
      page = 1, 
      limit = 20 
    } = req.query;
    
    const whereClause = {};
    
    if (status) whereClause.status = status;
    if (violationType) whereClause.violationType = violationType;
    if (severity) whereClause.severity = severity;
    
    const includeClause = [
      {
        model: User,
        as: 'student',
        attributes: ['id', 'name', 'email', 'department'],
        where: search ? {
          [Op.or]: [
            { name: { [Op.like]: `%${search}%` } },
            { email: { [Op.like]: `%${search}%` } }
          ]
        } : undefined,
        required: false
      }
    ];
    
    const offset = (page - 1) * limit;
    
    const { count, rows: violations } = await StudentViolation.findAndCountAll({
      where: whereClause,
      include: includeClause,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: offset
    });
    
    // Get statistics
    const stats = await StudentViolation.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['status'],
      raw: true
    });
    
    const statistics = {
      total: count,
      active: stats.find(s => s.status === 'Active')?.count || 0,
      blocked: stats.find(s => s.status === 'Blocked')?.count || 0,
      reviewed: stats.find(s => s.status === 'Reviewed')?.count || 0,
      cleared: stats.find(s => s.status === 'Cleared')?.count || 0
    };
    
    res.json({
      success: true,
      violations,
      statistics,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalItems: count,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('❌ Error fetching violations:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch violations' 
    });
  }
};

// Block a student
exports.blockStudent = async (req, res) => {
  try {
    const { studentId, reason, adminId } = req.body;
    
    console.log(`🔒 Blocking student: ${studentId}`);
    
    const [updatedCount] = await StudentViolation.update(
      { 
        status: 'Blocked',
        adminNotes: reason
      },
      { 
        where: { 
          studentId, 
          status: { [Op.in]: ['Active', 'Reviewed'] }
        } 
      }
    );
    
    if (updatedCount > 0) {
      console.log(`✅ Student ${studentId} blocked successfully`);
      res.json({ 
        success: true, 
        message: 'Student blocked successfully',
        blockedViolations: updatedCount
      });
    } else {
      res.json({ 
        success: false, 
        message: 'No active violations found for this student' 
      });
    }
  } catch (error) {
    console.error('❌ Error blocking student:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to block student' 
    });
  }
};

// Unblock a student
exports.unblockStudent = async (req, res) => {
  try {
    const { studentId, reason, adminId } = req.body;
    
    console.log(`🔓 Unblocking student: ${studentId}`);
    
    const [updatedCount] = await StudentViolation.update(
      { 
        status: 'Cleared',
        adminNotes: reason
      },
      { 
        where: { 
          studentId, 
          status: 'Blocked'
        } 
      }
    );
    
    if (updatedCount > 0) {
      console.log(`✅ Student ${studentId} unblocked successfully`);
      res.json({ 
        success: true, 
        message: 'Student unblocked successfully',
        clearedViolations: updatedCount
      });
    } else {
      res.json({ 
        success: false, 
        message: 'No blocked violations found for this student' 
      });
    }
  } catch (error) {
    console.error('❌ Error unblocking student:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to unblock student' 
    });
  }
};

// Check if student is blocked
exports.checkStudentEligibility = async (req, res) => {
  try {
    const { studentId } = req.params;
    
    const blockedViolation = await StudentViolation.findOne({
      where: { 
        studentId, 
        status: 'Blocked' 
      },
      include: [
        {
          model: User,
          as: 'student',
          attributes: ['name', 'email']
        }
      ]
    });
    
    if (blockedViolation) {
      res.json({
        success: false,
        blocked: true,
        message: 'Student is blocked due to test violations',
        violation: {
          type: blockedViolation.violationType,
          description: blockedViolation.description,
          blockedAt: blockedViolation.updatedAt
        }
      });
    } else {
      res.json({
        success: true,
        blocked: false,
        message: 'Student is eligible to take tests'
      });
    }
  } catch (error) {
    console.error('❌ Error checking student eligibility:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to check student eligibility' 
    });
  }
};

// Export violations to Excel
exports.exportExcel = async (req, res) => {
  try {
    console.log('📊 Generating Excel export for violations');
    
    const violations = await StudentViolation.findAll({
      include: [
        {
          model: User,
          as: 'student',
          attributes: ['name', 'email', 'department'],
          required: false
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Violations Report');
    
    // Add headers
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Student Name', key: 'studentName', width: 25 },
      { header: 'Student Email', key: 'studentEmail', width: 30 },
      { header: 'Department', key: 'department', width: 20 },
      { header: 'Test Name', key: 'testName', width: 25 },
      { header: 'Violation Type', key: 'violationType', width: 15 },
      { header: 'Severity', key: 'severity', width: 12 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Description', key: 'description', width: 40 },
      { header: 'Created At', key: 'createdAt', width: 20 },
      { header: 'Admin Notes', key: 'adminNotes', width: 30 }
    ];
    
    // Style headers
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE6E6FA' }
    };
    
    // Add data
    violations.forEach(violation => {
      worksheet.addRow({
        id: violation.id,
        studentName: violation.student?.name || 'Unknown',
        studentEmail: violation.student?.email || 'N/A',
        department: violation.student?.department || 'N/A',
        testName: violation.testId || 'N/A',
        violationType: violation.violationType,
        severity: violation.severity,
        status: violation.status,
        description: violation.description || 'N/A',
        createdAt: new Date(violation.createdAt).toLocaleString(),
        adminNotes: violation.adminNotes || 'N/A'
      });
    });
    
    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="Violations_Report_${new Date().toISOString().split('T')[0]}.xlsx"`);
    
    await workbook.xlsx.write(res);
    res.end();
    
    console.log('✅ Excel export completed');
  } catch (error) {
    console.error('❌ Error exporting to Excel:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to export Excel report' 
    });
  }
};

// Check if student is blocked (utility function)
exports.checkStudentBlocked = async (studentId) => {
  try {
    const blockedViolation = await StudentViolation.findOne({
      where: { 
        studentId, 
        status: 'Blocked' 
      }
    });
    
    return !!blockedViolation;
  } catch (error) {
    console.error('❌ Error checking if student is blocked:', error);
    return false;
  }
};

// Unblock all violated students
exports.unblockAllStudents = async (req, res) => {
  try {
    console.log('🔓 Unblocking all violated students...');
    
    const [updatedCount] = await StudentViolation.update(
      { status: 'Cleared' },
      { where: { status: 'Blocked' } }
    );
    
    console.log(`✅ Unblocked ${updatedCount} students`);
    
    res.json({
      success: true,
      message: `Successfully unblocked ${updatedCount} students`,
      unblocked: updatedCount
    });
  } catch (error) {
    console.error('❌ Error unblocking all students:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to unblock all students'
    });
  }
};

// Export violations to PDF
exports.exportPDF = async (req, res) => {
  try {
    console.log('📄 Generating PDF export for violations');
    
    const violations = await StudentViolation.findAll({
      include: [
        {
          model: User,
          as: 'student',
          attributes: ['name', 'email', 'department'],
          required: false
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    const doc = new PDFDocument({ margin: 50 });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Violations_Report_${new Date().toISOString().split('T')[0]}.pdf"`);
    
    doc.pipe(res);
    
    // Header
    doc.fillColor('#dc2626');
    doc.rect(0, 0, doc.page.width, 80).fill();
    doc.fillColor('white');
    doc.fontSize(24).font('Helvetica-Bold');
    doc.text('🚨 VIOLATIONS & PLAGIARISM REPORT', 50, 30, { align: 'center' });
    doc.fontSize(10);
    doc.text(`Generated on ${new Date().toLocaleString()}`, 50, 55, { align: 'center' });
    
    let y = 100;
    doc.fillColor('black');
    
    // Summary
    const stats = {
      total: violations.length,
      active: violations.filter(v => v.status === 'Active').length,
      blocked: violations.filter(v => v.status === 'Blocked').length,
      cleared: violations.filter(v => v.status === 'Cleared').length
    };
    
    doc.fillColor('#f59e0b');
    doc.rect(50, y, doc.page.width - 100, 20).fill();
    doc.fillColor('white');
    doc.fontSize(14).font('Helvetica-Bold');
    doc.text('SUMMARY STATISTICS', 60, y + 6);
    
    y += 30;
    doc.fillColor('#fef3c7');
    doc.rect(50, y, doc.page.width - 100, 40).fill();
    doc.fillColor('black');
    doc.fontSize(10).font('Helvetica');
    doc.text(`Total Violations: ${stats.total}`, 60, y + 10);
    doc.text(`Active: ${stats.active}`, 60, y + 25);
    doc.text(`Blocked: ${stats.blocked}`, 200, y + 10);
    doc.text(`Cleared: ${stats.cleared}`, 200, y + 25);
    
    y += 60;
    
    // Violations list
    doc.fillColor('#dc2626');
    doc.rect(50, y, doc.page.width - 100, 20).fill();
    doc.fillColor('white');
    doc.fontSize(14).font('Helvetica-Bold');
    doc.text('VIOLATION DETAILS', 60, y + 6);
    
    y += 30;
    
    violations.forEach((violation, index) => {
      if (y > 700) {
        doc.addPage();
        y = 50;
      }
      
      const statusColor = {
        'Active': '#fef3c7',
        'Blocked': '#fee2e2',
        'Reviewed': '#e0f2fe',
        'Cleared': '#d1fae5'
      }[violation.status] || '#f3f4f6';
      
      doc.fillColor(statusColor);
      doc.rect(50, y, doc.page.width - 100, 80).fill();
      
      doc.fillColor('black');
      doc.fontSize(10).font('Helvetica-Bold');
      doc.text(`${index + 1}. ${violation.student?.name || 'Unknown Student'}`, 60, y + 10);
      
      doc.fontSize(9).font('Helvetica');
      doc.text(`Email: ${violation.student?.email || 'N/A'}`, 60, y + 25);
      doc.text(`Test: ${violation.testId || 'N/A'}`, 60, y + 35);
      doc.text(`Type: ${violation.violationType}`, 60, y + 45);
      doc.text(`Severity: ${violation.severity}`, 200, y + 25);
      doc.text(`Status: ${violation.status}`, 200, y + 35);
      doc.text(`Date: ${new Date(violation.createdAt).toLocaleDateString()}`, 200, y + 45);
      
      if (violation.description) {
        doc.text(`Description: ${violation.description.substring(0, 100)}...`, 60, y + 60);
      }
      
      y += 90;
    });
    
    // Footer
    doc.fontSize(8).fillColor('gray');
    doc.text(`Report generated on ${new Date().toLocaleString()}`, 50, doc.page.height - 30, { align: 'center' });
    
    doc.end();
    
    console.log('✅ PDF export completed');
  } catch (error) {
    console.error('❌ Error exporting to PDF:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to export PDF report' 
    });
  }
};