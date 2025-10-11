const { Test, TestSession, User, LicensedUser, SectionScore } = require('../models');

// Check if PDFKit is available, if not use basic PDF generation
let PDFDocument;
try {
  PDFDocument = require('pdfkit');
} catch (error) {
  console.warn('PDFKit not available, using basic PDF generation');
}

// Check if ExcelJS is available
let ExcelJS;
try {
  ExcelJS = require('exceljs');
} catch (error) {
  console.warn('ExcelJS not available, Excel reports disabled');
}

class EnhancedReportGenerator {
  
  // Generate comprehensive test report with modern styling
  static async generateStyledTestReport(testId, res) {
    try {
      // Get test data
      const test = await Test.findOne({
        where: { testId },
        attributes: ['testId', 'name', 'description', 'createdAt']
      });

      if (!test) {
        throw new Error('Test not found');
      }

      // Get test sessions with student details
      const testSessions = await TestSession.findAll({
        where: { testId, status: 'completed' },
        attributes: ['id', 'studentId', 'totalScore', 'maxScore', 'startedAt', 'completedAt'],
        order: [['totalScore', 'DESC']]
      });

      // Create PDF with modern styling
      const doc = new PDFDocument({ 
        margin: 40, 
        size: 'A4',
        info: {
          Title: `${test.name} - Assessment Report`,
          Author: 'MCQ Platform',
          Subject: 'Test Assessment Report'
        }
      });

      // Set response headers
      const filename = `${test.name.replace(/[^a-zA-Z0-9]/g, '_')}_Report.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      doc.pipe(res);

      // Header with logo placeholder and styling
      this.addReportHeader(doc, test);
      
      // Test information section
      this.addTestInformation(doc, test, testSessions.length);
      
      // Statistics section
      this.addStatisticsSection(doc, testSessions);
      
      // Results table with modern styling
      await this.addResultsTable(doc, testSessions);
      
      // Footer
      this.addReportFooter(doc);
      
      doc.end();
      
    } catch (error) {
      console.error('Error generating styled report:', error);
      throw error;
    }
  }

  // Add modern header with styling
  static addReportHeader(doc, test) {
    // Header background
    doc.rect(0, 0, doc.page.width, 80)
       .fill('#2563eb');
    
    // Title
    doc.fillColor('white')
       .fontSize(24)
       .font('Helvetica-Bold')
       .text('ASSESSMENT REPORT', 50, 25, { align: 'center' });
    
    // Subtitle
    doc.fontSize(12)
       .font('Helvetica')
       .text('Comprehensive Test Analysis & Results', 50, 50, { align: 'center' });
    
    doc.moveDown(3);
  }

  // Add test information section
  static addTestInformation(doc, test, totalStudents) {
    const startY = doc.y;
    
    // Section header
    doc.fillColor('#1f2937')
       .fontSize(16)
       .font('Helvetica-Bold')
       .text('Test Information', 50, startY);
    
    // Underline
    doc.moveTo(50, startY + 20)
       .lineTo(200, startY + 20)
       .strokeColor('#3b82f6')
       .lineWidth(2)
       .stroke();
    
    doc.moveDown(1);
    
    // Information grid
    const infoY = doc.y;
    doc.fillColor('#374151')
       .fontSize(11)
       .font('Helvetica')
       .text(`Test Name: ${test.name}`, 50, infoY)
       .text(`Test ID: ${test.testId}`, 50, infoY + 20)
       .text(`Description: ${test.description || 'N/A'}`, 50, infoY + 40)
       .text(`Total Participants: ${totalStudents}`, 300, infoY)
       .text(`Report Generated: ${new Date().toLocaleDateString()}`, 300, infoY + 20)
       .text(`Status: Completed`, 300, infoY + 40);
    
    doc.moveDown(4);
  }

  // Add statistics section with visual elements
  static addStatisticsSection(doc, testSessions) {
    if (testSessions.length === 0) return;
    
    const startY = doc.y;
    
    // Section header
    doc.fillColor('#1f2937')
       .fontSize(16)
       .font('Helvetica-Bold')
       .text('Performance Statistics', 50, startY);
    
    // Underline
    doc.moveTo(50, startY + 20)
       .lineTo(250, startY + 20)
       .strokeColor('#10b981')
       .lineWidth(2)
       .stroke();
    
    doc.moveDown(1);
    
    // Calculate statistics
    const totalStudents = testSessions.length;
    const scores = testSessions.map(s => s.maxScore > 0 ? (s.totalScore / s.maxScore) * 100 : 0);
    const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const passedStudents = scores.filter(s => s >= 60).length;
    const highestScore = Math.max(...scores);
    const lowestScore = Math.min(...scores);
    
    // Statistics boxes
    const boxY = doc.y;
    const boxWidth = 120;
    const boxHeight = 60;
    
    // Box 1 - Average Score
    doc.rect(50, boxY, boxWidth, boxHeight)
       .fillAndStroke('#ecfdf5', '#10b981');
    
    doc.fillColor('#065f46')
       .fontSize(20)
       .font('Helvetica-Bold')
       .text(`${Math.round(averageScore)}%`, 50 + 10, boxY + 15, { width: boxWidth - 20, align: 'center' });
    
    doc.fontSize(10)
       .font('Helvetica')
       .text('Average Score', 50 + 10, boxY + 40, { width: boxWidth - 20, align: 'center' });
    
    // Box 2 - Pass Rate
    doc.rect(180, boxY, boxWidth, boxHeight)
       .fillAndStroke('#eff6ff', '#3b82f6');
    
    doc.fillColor('#1e40af')
       .fontSize(20)
       .font('Helvetica-Bold')
       .text(`${Math.round((passedStudents/totalStudents)*100)}%`, 180 + 10, boxY + 15, { width: boxWidth - 20, align: 'center' });
    
    doc.fontSize(10)
       .font('Helvetica')
       .text('Pass Rate', 180 + 10, boxY + 40, { width: boxWidth - 20, align: 'center' });
    
    // Box 3 - Highest Score
    doc.rect(310, boxY, boxWidth, boxHeight)
       .fillAndStroke('#fef3c7', '#f59e0b');
    
    doc.fillColor('#92400e')
       .fontSize(20)
       .font('Helvetica-Bold')
       .text(`${Math.round(highestScore)}%`, 310 + 10, boxY + 15, { width: boxWidth - 20, align: 'center' });
    
    doc.fontSize(10)
       .font('Helvetica')
       .text('Highest Score', 310 + 10, boxY + 40, { width: boxWidth - 20, align: 'center' });
    
    // Box 4 - Total Students
    doc.rect(440, boxY, boxWidth, boxHeight)
       .fillAndStroke('#fce7f3', '#ec4899');
    
    doc.fillColor('#be185d')
       .fontSize(20)
       .font('Helvetica-Bold')
       .text(`${totalStudents}`, 440 + 10, boxY + 15, { width: boxWidth - 20, align: 'center' });
    
    doc.fontSize(10)
       .font('Helvetica')
       .text('Total Students', 440 + 10, boxY + 40, { width: boxWidth - 20, align: 'center' });
    
    doc.moveDown(6);
  }

  // Add results table with modern styling
  static async addResultsTable(doc, testSessions) {
    const startY = doc.y;
    
    // Section header
    doc.fillColor('#1f2937')
       .fontSize(16)
       .font('Helvetica-Bold')
       .text('Detailed Results', 50, startY);
    
    // Underline
    doc.moveTo(50, startY + 20)
       .lineTo(180, startY + 20)
       .strokeColor('#ef4444')
       .lineWidth(2)
       .stroke();
    
    doc.moveDown(1.5);
    
    // Table headers
    const tableTop = doc.y;
    const cols = {
      rank: 50,
      name: 100,
      email: 250,
      score: 380,
      percentage: 450,
      status: 500
    };
    
    // Header background
    doc.rect(cols.rank - 5, tableTop - 5, 500, 25)
       .fill('#f3f4f6');
    
    // Header text
    doc.fillColor('#1f2937')
       .fontSize(11)
       .font('Helvetica-Bold')
       .text('Rank', cols.rank, tableTop + 5)
       .text('Student Name', cols.name, tableTop + 5)
       .text('Email', cols.email, tableTop + 5)
       .text('Score', cols.score, tableTop + 5)
       .text('Percentage', cols.percentage, tableTop + 5)
       .text('Status', cols.status, tableTop + 5);
    
    let currentY = tableTop + 30;
    
    // Table rows
    for (let i = 0; i < testSessions.length; i++) {
      const session = testSessions[i];
      
      // Check for new page
      if (currentY > 700) {
        doc.addPage();
        currentY = 50;
      }
      
      // Get student details
      let student = await LicensedUser.findByPk(session.studentId, {
        attributes: ['name', 'email']
      });
      
      if (!student) {
        student = await User.findByPk(session.studentId, {
          attributes: ['name', 'email']
        });
      }
      
      const percentage = session.maxScore > 0 ? Math.round((session.totalScore / session.maxScore) * 100) : 0;
      const status = percentage >= 60 ? 'Pass' : 'Fail';
      
      // Alternate row colors
      if (i % 2 === 0) {
        doc.rect(cols.rank - 5, currentY - 3, 500, 20)
           .fill('#f9fafb');
      }
      
      // Row data
      doc.fillColor('#374151')
         .fontSize(10)
         .font('Helvetica')
         .text(`${i + 1}`, cols.rank, currentY)
         .text((student?.name || 'Unknown').substring(0, 20), cols.name, currentY)
         .text((student?.email || 'N/A').substring(0, 25), cols.email, currentY)
         .text(`${session.totalScore}/${session.maxScore}`, cols.score, currentY)
         .text(`${percentage}%`, cols.percentage, currentY);
      
      // Status with color
      doc.fillColor(status === 'Pass' ? '#059669' : '#dc2626')
         .text(status, cols.status, currentY);
      
      currentY += 20;
    }
  }

  // Add professional footer
  static addReportFooter(doc) {
    const pageCount = doc.bufferedPageRange().count;
    
    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);
      
      // Footer line
      doc.moveTo(50, doc.page.height - 50)
         .lineTo(doc.page.width - 50, doc.page.height - 50)
         .strokeColor('#e5e7eb')
         .stroke();
      
      // Footer text
      doc.fillColor('#6b7280')
         .fontSize(9)
         .font('Helvetica')
         .text('Generated by MCQ Assessment Platform', 50, doc.page.height - 40)
         .text(`Page ${i + 1} of ${pageCount}`, doc.page.width - 100, doc.page.height - 40);
      
      // Confidential watermark
      doc.fillColor('#f3f4f6')
         .fontSize(8)
         .text('CONFIDENTIAL', doc.page.width - 150, doc.page.height - 25);
    }
  }

  // Generate Excel report with advanced formatting
  static async generateStyledExcelReport(testId, res) {
    try {
      // Get test data (similar to PDF)
      const test = await Test.findOne({
        where: { testId },
        attributes: ['testId', 'name', 'description', 'createdAt']
      });

      if (!test) {
        throw new Error('Test not found');
      }

      const testSessions = await TestSession.findAll({
        where: { testId, status: 'completed' },
        order: [['totalScore', 'DESC']]
      });

      // Create workbook
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'MCQ Assessment Platform';
      workbook.created = new Date();

      // Summary sheet
      const summarySheet = workbook.addWorksheet('Summary', {
        pageSetup: { paperSize: 9, orientation: 'portrait' }
      });

      // Add summary data
      this.addExcelSummary(summarySheet, test, testSessions);

      // Detailed results sheet
      const resultsSheet = workbook.addWorksheet('Detailed Results');
      await this.addExcelResults(resultsSheet, testSessions);

      // Set response headers
      const filename = `${test.name.replace(/[^a-zA-Z0-9]/g, '_')}_Report.xlsx`;
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      // Write to response
      await workbook.xlsx.write(res);
      res.end();

    } catch (error) {
      console.error('Error generating Excel report:', error);
      throw error;
    }
  }

  // Add Excel summary with formatting
  static addExcelSummary(sheet, test, testSessions) {
    // Title
    sheet.mergeCells('A1:F1');
    sheet.getCell('A1').value = 'TEST ASSESSMENT REPORT';
    sheet.getCell('A1').font = { size: 18, bold: true, color: { argb: 'FF2563eb' } };
    sheet.getCell('A1').alignment = { horizontal: 'center' };

    // Test information
    sheet.getCell('A3').value = 'Test Information';
    sheet.getCell('A3').font = { size: 14, bold: true };
    
    sheet.getCell('A4').value = 'Test Name:';
    sheet.getCell('B4').value = test.name;
    sheet.getCell('A5').value = 'Test ID:';
    sheet.getCell('B5').value = test.testId;
    sheet.getCell('A6').value = 'Total Participants:';
    sheet.getCell('B6').value = testSessions.length;

    // Statistics
    if (testSessions.length > 0) {
      const scores = testSessions.map(s => s.maxScore > 0 ? (s.totalScore / s.maxScore) * 100 : 0);
      const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;
      const passedStudents = scores.filter(s => s >= 60).length;

      sheet.getCell('A8').value = 'Performance Statistics';
      sheet.getCell('A8').font = { size: 14, bold: true };
      
      sheet.getCell('A9').value = 'Average Score:';
      sheet.getCell('B9').value = `${Math.round(averageScore)}%`;
      sheet.getCell('A10').value = 'Pass Rate:';
      sheet.getCell('B10').value = `${Math.round((passedStudents/testSessions.length)*100)}%`;
      sheet.getCell('A11').value = 'Highest Score:';
      sheet.getCell('B11').value = `${Math.round(Math.max(...scores))}%`;
    }

    // Format columns
    sheet.getColumn('A').width = 20;
    sheet.getColumn('B').width = 30;
  }

  // Add Excel results with formatting
  static async addExcelResults(sheet, testSessions) {
    // Headers
    const headers = ['Rank', 'Student Name', 'Email', 'Score', 'Max Score', 'Percentage', 'Status', 'Completed At'];
    sheet.addRow(headers);
    
    // Format header row
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563eb' } };
    
    // Add data rows
    for (let i = 0; i < testSessions.length; i++) {
      const session = testSessions[i];
      
      // Get student details
      let student = await LicensedUser.findByPk(session.studentId, {
        attributes: ['name', 'email']
      });
      
      if (!student) {
        student = await User.findByPk(session.studentId, {
          attributes: ['name', 'email']
        });
      }
      
      const percentage = session.maxScore > 0 ? Math.round((session.totalScore / session.maxScore) * 100) : 0;
      const status = percentage >= 60 ? 'Pass' : 'Fail';
      
      const row = sheet.addRow([
        i + 1,
        student?.name || 'Unknown',
        student?.email || 'N/A',
        session.totalScore,
        session.maxScore,
        `${percentage}%`,
        status,
        session.completedAt ? new Date(session.completedAt).toLocaleString() : 'N/A'
      ]);
      
      // Color code status
      const statusCell = row.getCell(7);
      statusCell.font = { 
        color: { argb: status === 'Pass' ? 'FF059669' : 'FFdc2626' },
        bold: true 
      };
      
      // Alternate row colors
      if (i % 2 === 0) {
        row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFf9fafb' } };
      }
    }
    
    // Auto-fit columns
    sheet.columns.forEach(column => {
      column.width = 15;
    });
  }
}

module.exports = EnhancedReportGenerator;