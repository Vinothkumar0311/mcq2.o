const ExcelJS = require('exceljs');
const { TestSession, StudentsResults, User, LicensedUser, CodeSubmission, SectionScore } = require('../models');

exports.downloadExcelReport = async (req, res) => {
  try {
    const { testId } = req.params;
    
    // Get all test sessions for this test
    const testSessions = await TestSession.findAll({
      where: { testId },
      include: [{
        model: Test,
        as: 'test',
        attributes: ['name']
      }]
    });
    
    if (testSessions.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No test results found'
      });
    }
    
    // Create workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Test Results');
    
    // Define columns
    worksheet.columns = [
      { header: 'Student Name', key: 'studentName', width: 25 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Student ID', key: 'studentId', width: 15 },
      { header: 'Department', key: 'department', width: 20 },
      { header: 'Total Score', key: 'totalScore', width: 12 },
      { header: 'Max Score', key: 'maxScore', width: 12 },
      { header: 'Percentage', key: 'percentage', width: 12 },
      { header: 'Grade', key: 'grade', width: 10 },
      { header: 'Status', key: 'status', width: 10 },
      { header: 'Completed At', key: 'completedAt', width: 20 },
      { header: 'Results Released', key: 'resultsReleased', width: 15 },
      { header: 'MCQ Score', key: 'mcqScore', width: 12 },
      { header: 'Coding Score', key: 'codingScore', width: 12 }
    ];
    
    // Process each test session
    for (const session of testSessions) {
      // Get student info
      let student = await LicensedUser.findByPk(session.studentId) || await User.findByPk(session.studentId);
      
      // Get coding submissions
      const codingSubmissions = await CodeSubmission.findAll({
        where: { testId, studentId: session.studentId, isDryRun: false }
      });
      
      // Get MCQ scores
      const sectionScores = await SectionScore.findAll({
        where: { testSessionId: session.id }
      });
      
      const codingScore = codingSubmissions.reduce((sum, sub) => sum + (sub.score || 0), 0);
      const mcqScore = sectionScores.reduce((sum, score) => sum + (score.marksObtained || 0), 0);
      const percentage = session.maxScore > 0 ? Math.round((session.totalScore / session.maxScore) * 100) : 0;
      
      // Calculate grade
      let grade = 'F';
      if (percentage >= 90) grade = 'A+';
      else if (percentage >= 85) grade = 'A';
      else if (percentage >= 80) grade = 'A-';
      else if (percentage >= 75) grade = 'B+';
      else if (percentage >= 70) grade = 'B';
      else if (percentage >= 65) grade = 'B-';
      else if (percentage >= 60) grade = 'C+';
      else if (percentage >= 55) grade = 'C';
      else if (percentage >= 50) grade = 'C-';
      else if (percentage >= 40) grade = 'D';
      
      worksheet.addRow({
        studentName: student?.name || 'Unknown',
        email: student?.email || 'N/A',
        studentId: session.studentId,
        department: student?.department || 'N/A',
        totalScore: session.totalScore || 0,
        maxScore: session.maxScore || 0,
        percentage: percentage,
        grade: grade,
        status: percentage >= 60 ? 'PASS' : 'FAIL',
        completedAt: session.completedAt ? new Date(session.completedAt).toLocaleString() : 'N/A',
        resultsReleased: session.resultsReleased ? 'Yes' : 'No',
        mcqScore: mcqScore,
        codingScore: codingScore
      });
    }
    
    // Style the header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE6F3FF' }
    };
    
    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="Test_Results_${testId}.xlsx"`);
    
    // Write to response
    await workbook.xlsx.write(res);
    res.end();
    
  } catch (error) {
    console.error('Error generating Excel report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate Excel report'
    });
  }
};