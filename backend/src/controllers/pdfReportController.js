const { TestSession, StudentsResults, User, LicensedUser, CodeSubmission, CodingQuestion, SectionScore, Section, MCQ } = require('../models');
const PDFDocument = require('pdfkit');

exports.downloadTestReport = async (req, res) => {
  try {
    const { testId, studentId } = req.params;
    
    // Get test session and check if results are released
    const testSession = await TestSession.findOne({
      where: { testId, studentId }
    });
    
    if (!testSession || !testSession.resultsReleased) {
      return res.status(403).json({
        success: false,
        error: 'Results not released yet'
      });
    }
    
    // Get student info
    let student = await LicensedUser.findByPk(studentId) || await User.findByPk(studentId);
    
    // Get coding submissions
    const codingSubmissions = await CodeSubmission.findAll({
      where: { testId, studentId, isDryRun: false },
      include: [{ model: CodingQuestion, as: 'codingQuestion' }],
      order: [['codingQuestionId', 'ASC']]
    });
    
    // Get MCQ results
    const sectionScores = await SectionScore.findAll({
      where: { testSessionId: testSession.id },
      include: [{
        model: Section,
        as: 'section',
        include: [{ model: MCQ, as: 'MCQs' }]
      }]
    });
    
    // Create PDF
    const doc = new PDFDocument({ margin: 50 });
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Test_Report_${testId}_${studentId}.pdf"`);
    
    // Pipe PDF to response
    doc.pipe(res);
    
    // Header
    doc.fontSize(20).text('TEST RESULT REPORT', { align: 'center' });
    doc.moveDown();
    
    // Student Information
    doc.fontSize(14).text('STUDENT INFORMATION', { underline: true });
    doc.fontSize(12)
       .text(`Name: ${student?.name || 'Unknown'}`)
       .text(`Email: ${student?.email || 'N/A'}`)
       .text(`Student ID: ${studentId}`)
       .text(`Test ID: ${testId}`)
       .text(`Completed: ${testSession.completedAt ? new Date(testSession.completedAt).toLocaleString() : 'N/A'}`);
    
    doc.moveDown();
    
    // Overall Results
    doc.fontSize(14).text('OVERALL RESULTS', { underline: true });
    const percentage = testSession.maxScore > 0 ? Math.round((testSession.totalScore / testSession.maxScore) * 100) : 0;
    doc.fontSize(12)
       .text(`Total Score: ${testSession.totalScore}/${testSession.maxScore}`)
       .text(`Percentage: ${percentage}%`)
       .text(`Result: ${percentage >= 60 ? 'PASS' : 'FAIL'}`);
    
    doc.moveDown();
    
    // MCQ Results
    if (sectionScores.length > 0) {
      doc.fontSize(14).text('MCQ SECTION RESULTS', { underline: true });
      
      let totalMCQs = 0;
      let correctMCQs = 0;
      
      sectionScores.forEach(sectionScore => {
        if (sectionScore.section?.MCQs?.length > 0) {
          const questions = sectionScore.section.MCQs;
          const answers = sectionScore.answers || {};
          
          questions.forEach(question => {
            totalMCQs++;
            const userAnswer = answers[question.id];
            if (userAnswer === question.correctOptionLetter) {
              correctMCQs++;
            }
          });
        }
      });
      
      doc.fontSize(12)
         .text(`Total MCQ Questions: ${totalMCQs}`)
         .text(`Correct Answers: ${correctMCQs}`)
         .text(`Wrong Answers: ${totalMCQs - correctMCQs}`)
         .text(`MCQ Accuracy: ${totalMCQs > 0 ? Math.round((correctMCQs / totalMCQs) * 100) : 0}%`);
      
      doc.moveDown();
    }
    
    // Coding Results
    if (codingSubmissions.length > 0) {
      doc.fontSize(14).text('CODING SECTION RESULTS', { underline: true });
      
      codingSubmissions.forEach((submission, index) => {
        const testResults = submission.testResults || [];
        const passedTests = testResults.filter(t => t.passed).length;
        const totalTests = testResults.length;
        const successRate = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;
        
        doc.fontSize(12)
           .text(`Question ${index + 1}: ${submission.codingQuestion?.title || 'Coding Problem'}`)
           .text(`Language: ${submission.language}`)
           .text(`Test Cases Passed: ${passedTests}/${totalTests}`)
           .text(`Success Rate: ${successRate}%`)
           .text(`Score: ${submission.score}/${submission.codingQuestion?.marks || 0}`)
           .text(`Status: ${submission.status}`);
        
        if (submission.errorMessage) {
          doc.text(`Error: ${submission.errorMessage}`);
        }
        
        doc.moveDown();
      });
    }
    
    // Footer
    doc.fontSize(10)
       .text(`Report generated on: ${new Date().toLocaleString()}`, { align: 'center' });
    
    // Finalize PDF
    doc.end();
    
  } catch (error) {
    console.error('Error generating PDF report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate PDF report'
    });
  }
};