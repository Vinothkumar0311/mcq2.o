const { Test, TestSession, CodeSubmission, CodingQuestion, User, LicensedUser, StudentTestResult, sequelize } = require('../models');
const { Op } = require('sequelize');

// Get comprehensive student report (MCQ + Coding)
exports.getStudentReport = async (req, res) => {
  try {
    const { studentId } = req.params;
    
    console.log(`📊 Generating report for student: ${studentId}`);

    // Get student details
    let student = null;
    try {
      student = await LicensedUser.findByPk(studentId);
    } catch (error) {
      const numericId = parseInt(studentId);
      if (!isNaN(numericId)) {
        student = await User.findByPk(numericId);
      }
    }

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Get MCQ test results
    const mcqResults = await StudentTestResult.findAll({
      where: { studentId: studentId.toString() },
      order: [['submissionDate', 'DESC']]
    });

    // Get coding test results
    const codingResults = await CodeSubmission.findAll({
      where: { 
        studentId: studentId.toString(),
        isDryRun: false 
      },
      include: [{
        model: CodingQuestion,
        as: 'codingQuestion',
        attributes: ['problemStatement', 'marks']
      }],
      order: [['createdAt', 'DESC']]
    });

    // Process MCQ results
    const mcqTests = mcqResults.map(result => ({
      testId: result.testId,
      testName: result.testName,
      score: result.totalScore || 0,
      maxScore: result.maxScore || 100,
      percentage: result.percentage || 0,
      status: result.status || 'Unknown',
      date: result.submissionDate,
      timeTaken: result.timeTaken || 0
    }));

    // Process coding results
    const codingTests = codingResults.map(submission => {
      const testResults = submission.testResults || [];
      const passedTests = testResults.filter(t => t.passed).length;
      const totalTests = testResults.length;
      
      return {
        testId: submission.testId,
        testName: `Coding Test ${submission.testId}`,
        language: submission.language,
        score: submission.score || 0,
        maxScore: submission.codingQuestion?.marks || 100,
        percentage: totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0,
        status: submission.status,
        passedTests,
        totalTests,
        executionTime: submission.executionTime || 0,
        date: submission.createdAt
      };
    });

    // Calculate summary
    const allTests = [...mcqTests, ...codingTests];
    const totalTests = allTests.length;
    const averageScore = totalTests > 0 ? 
      Math.round(allTests.reduce((sum, test) => sum + test.percentage, 0) / totalTests) : 0;
    const totalTimeTaken = mcqTests.reduce((sum, test) => sum + test.timeTaken, 0);
    const lastTestDate = allTests.length > 0 ? 
      Math.max(...allTests.map(test => new Date(test.date).getTime())) : null;

    const report = {
      student: {
        id: studentId,
        name: student.name,
        email: student.email,
        department: student.department || 'N/A'
      },
      mcqTests,
      codingTests,
      summary: {
        totalTests,
        mcqTestCount: mcqTests.length,
        codingTestCount: codingTests.length,
        averageScore,
        totalTimeTaken,
        lastTestDate: lastTestDate ? new Date(lastTestDate) : null
      }
    };

    console.log(`✅ Report generated: ${totalTests} tests, ${averageScore}% average`);

    res.json({
      success: true,
      data: report
    });

  } catch (error) {
    console.error('❌ Error generating student report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate student report'
    });
  }
};

// Get all students with their latest results
exports.getAllStudentReports = async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    
    console.log('📊 Fetching all student reports...');

    // Get all students with test results
    const [mcqStudents] = await sequelize.query(`
      SELECT DISTINCT studentId, studentName, studentEmail
      FROM student_test_results 
      WHERE studentName IS NOT NULL
      LIMIT ${parseInt(limit)}
    `);

    const [codingStudents] = await sequelize.query(`
      SELECT DISTINCT studentId, studentName, studentEmail
      FROM code_submissions 
      WHERE isDryRun = false AND studentName IS NOT NULL
      LIMIT ${parseInt(limit)}
    `);

    // Combine and deduplicate students
    const allStudents = new Map();
    
    mcqStudents.forEach(student => {
      allStudents.set(student.studentId, {
        id: student.studentId,
        name: student.studentName,
        email: student.studentEmail
      });
    });

    codingStudents.forEach(student => {
      if (!allStudents.has(student.studentId)) {
        allStudents.set(student.studentId, {
          id: student.studentId,
          name: student.studentName,
          email: student.studentEmail
        });
      }
    });

    // Get summary for each student
    const studentReports = await Promise.all(
      Array.from(allStudents.values()).map(async (student) => {
        // Get MCQ count and average
        const mcqStats = await StudentTestResult.findAll({
          where: { studentId: student.id },
          attributes: [
            [sequelize.fn('COUNT', sequelize.col('id')), 'testCount'],
            [sequelize.fn('AVG', sequelize.col('percentage')), 'avgScore']
          ],
          raw: true
        });

        // Get coding count and average
        const codingStats = await CodeSubmission.findAll({
          where: { 
            studentId: student.id,
            isDryRun: false 
          },
          attributes: [
            [sequelize.fn('COUNT', sequelize.col('id')), 'testCount']
          ],
          raw: true
        });

        const mcqCount = mcqStats[0]?.testCount || 0;
        const mcqAvg = mcqStats[0]?.avgScore || 0;
        const codingCount = codingStats[0]?.testCount || 0;

        return {
          ...student,
          mcqTestCount: parseInt(mcqCount),
          codingTestCount: parseInt(codingCount),
          totalTests: parseInt(mcqCount) + parseInt(codingCount),
          averageScore: Math.round(mcqAvg)
        };
      })
    );

    console.log(`✅ Found ${studentReports.length} students with test results`);

    res.json({
      success: true,
      data: studentReports
    });

  } catch (error) {
    console.error('❌ Error fetching student reports:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch student reports'
    });
  }
};

module.exports = {
  getStudentReport: exports.getStudentReport,
  getAllStudentReports: exports.getAllStudentReports
};