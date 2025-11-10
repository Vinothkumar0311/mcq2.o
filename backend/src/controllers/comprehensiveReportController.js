const { TestSession, Test, CodeSubmission, User, LicensedUser } = require('../models');
const PDFDocument = require('pdfkit');

exports.generateComprehensivePDFReport = async (req, res) => {
  try {
    const { testId, studentId } = req.params;
    
    console.log(`📄 Generating PDF report - Test: ${testId}, Student: ${studentId}`);
    
    const testSession = await TestSession.findOne({
      where: { testId, studentId }
    });
    
    if (!testSession) {
      return res.status(404).json({ success: false, error: 'Test session not found' });
    }
    
    const isAdminRequest = req.path.includes('/admin/');
    if (!isAdminRequest && !testSession.resultsReleased) {
      return res.status(403).json({ success: false, error: 'Results not yet released' });
    }
    
    let student = null;
    try {
      student = await LicensedUser.findByPk(studentId) || await User.findByPk(studentId);
    } catch (error) {
      console.log('Student lookup failed:', error.message);
    }
    
    const test = await Test.findByPk(testId);
    
    const codingSubmissions = await CodeSubmission.findAll({
      where: { testId, studentId, isDryRun: false }
    });
    
    const doc = new PDFDocument({ margin: 50 });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Test_Report_${testId}_${studentId}.pdf"`);
    
    doc.pipe(res);
    
    // Header
    doc.fillColor('#2563eb');
    doc.rect(0, 0, doc.page.width, 80).fill();
    doc.fillColor('white');
    doc.fontSize(24).font('Helvetica-Bold');
    doc.text('TEST REPORT', 50, 30, { align: 'center' });
    doc.fontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 50, 55, { align: 'center' });
    
    let y = 100;
    doc.fillColor('black');
    
    // Student Info
    doc.fillColor('#3b82f6');
    doc.rect(50, y, doc.page.width - 100, 20).fill();
    doc.fillColor('white');
    doc.fontSize(14).font('Helvetica-Bold');
    doc.text('STUDENT INFORMATION', 60, y + 6);
    
    y += 30;
    doc.fillColor('#eff6ff');
    doc.rect(50, y, doc.page.width - 100, 60).fill();
    doc.fillColor('black');
    doc.fontSize(10).font('Helvetica');
    doc.text(`Name: ${student?.name || 'Unknown'}`, 60, y + 15);
    doc.text(`Email: ${student?.email || 'N/A'}`, 60, y + 30);
    doc.text(`Student ID: ${studentId}`, 60, y + 45);
    
    y += 80;
    
    // Test Info
    doc.fillColor('#f59e0b');
    doc.rect(50, y, doc.page.width - 100, 20).fill();
    doc.fillColor('white');
    doc.fontSize(14).font('Helvetica-Bold');
    doc.text('TEST INFORMATION', 60, y + 6);
    
    y += 30;
    doc.fillColor('#fef3c7');
    doc.rect(50, y, doc.page.width - 100, 60).fill();
    doc.fillColor('black');
    doc.fontSize(10).font('Helvetica');
    doc.text(`Test: ${test?.name || 'Unknown Test'}`, 60, y + 15);
    doc.text(`Completed: ${new Date(testSession.completedAt).toLocaleString()}`, 60, y + 30);
    doc.text(`Status: ${testSession.status}`, 60, y + 45);
    
    y += 80;
    
    // Score
    const percentage = testSession.maxScore > 0 ? Math.round((testSession.totalScore / testSession.maxScore) * 100) : 0;
    const isPassed = percentage >= 60;
    
    doc.fillColor(isPassed ? '#10b981' : '#ef4444');
    doc.rect(50, y, doc.page.width - 100, 20).fill();
    doc.fillColor('white');
    doc.fontSize(14).font('Helvetica-Bold');
    doc.text('RESULTS', 60, y + 6);
    
    y += 30;
    doc.fillColor(isPassed ? '#d1fae5' : '#fee2e2');
    doc.rect(50, y, doc.page.width - 100, 50).fill();
    doc.fillColor('black');
    doc.fontSize(12).font('Helvetica-Bold');
    doc.text(`Score: ${testSession.totalScore}/${testSession.maxScore}`, 60, y + 15);
    doc.text(`Percentage: ${percentage}%`, 60, y + 30);
    doc.fillColor(isPassed ? '#059669' : '#dc2626');
    doc.text(`Result: ${isPassed ? 'PASS' : 'FAIL'}`, 300, y + 22);
    
    y += 70;
    
    // Coding Results
    if (codingSubmissions.length > 0) {
      if (y > 600) {
        doc.addPage();
        y = 50;
      }
      
      doc.fillColor('#8b5cf6');
      doc.rect(50, y, doc.page.width - 100, 20).fill();
      doc.fillColor('white');
      doc.fontSize(14).font('Helvetica-Bold');
      doc.text('CODING RESULTS', 60, y + 6);
      
      y += 30;
      
      codingSubmissions.forEach((submission, index) => {
        const testResults = submission.testResults || [];
        const passedTests = testResults.filter(t => t.passed).length;
        const totalTests = testResults.length;
        
        if (y > 650) {
          doc.addPage();
          y = 50;
        }
        
        doc.fillColor('#f3f4f6');
        doc.rect(50, y, doc.page.width - 100, 80).fill();
        doc.fillColor('black');
        doc.fontSize(10).font('Helvetica-Bold');
        doc.text(`Problem ${index + 1}`, 60, y + 10);
        doc.fontSize(9).font('Helvetica');
        doc.text(`Language: ${submission.language}`, 60, y + 25);
        doc.text(`Test Cases: ${passedTests}/${totalTests}`, 60, y + 40);
        doc.text(`Score: ${submission.score || 0}`, 60, y + 55);
        
        y += 90;
      });
    }
    
    // Summary
    if (y > 650) {
      doc.addPage();
      y = 50;
    }
    
    doc.fillColor('#10b981');
    doc.rect(50, y, doc.page.width - 100, 20).fill();
    doc.fillColor('white');
    doc.fontSize(14).font('Helvetica-Bold');
    doc.text('SUMMARY', 60, y + 6);
    
    y += 30;
    doc.fillColor('#f0fdf4');
    doc.rect(50, y, doc.page.width - 100, 60).fill();
    doc.fillColor('black');
    doc.fontSize(10).font('Helvetica');
    
    const summaryText = `Overall Score: ${testSession.totalScore}/${testSession.maxScore} (${percentage}%)
Result: ${isPassed ? 'PASSED' : 'FAILED'}
Coding Problems: ${codingSubmissions.length}
Completed: ${new Date(testSession.completedAt).toLocaleString()}`;
    
    doc.text(summaryText, 60, y + 15);
    
    // Footer
    doc.fontSize(8).fillColor('gray');
    doc.text(`Generated: ${new Date().toLocaleString()}`, 50, doc.page.height - 30, { align: 'center' });
    
    doc.end();
    
    console.log(`✅ PDF generated for Student: ${studentId}, Test: ${testId}`);
    
  } catch (error) {
    console.error('❌ PDF generation error:', error);
    res.status(500).json({ success: false, error: 'PDF generation failed' });
  }
};