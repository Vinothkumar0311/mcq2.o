/**
 * Quick Database Check - See what data exists for testing
 */

const mysql = require('mysql2/promise');

async function checkDatabaseData() {
  let connection;
  
  try {
    // Connect to database
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '12345',
      database: 'projectinforce'
    });
    
    console.log('✅ Connected to database\n');
    
    // Check TestSessions
    const [testSessions] = await connection.execute(
      'SELECT testId, studentId, status, totalScore, maxScore, completedAt FROM test_sessions WHERE status IN ("completed", "submitted") ORDER BY completedAt DESC LIMIT 5'
    );
    
    console.log('📊 Recent Test Sessions:');
    if (testSessions.length > 0) {
      testSessions.forEach((session, index) => {
        console.log(`${index + 1}. Test: ${session.testId}, Student: ${session.studentId}, Score: ${session.totalScore}/${session.maxScore}, Status: ${session.status}`);
      });
    } else {
      console.log('   No completed test sessions found');
    }
    
    // Check CodeSubmissions
    const [codeSubmissions] = await connection.execute(
      'SELECT testId, studentId, codingQuestionId, language, status, score FROM CodeSubmissions WHERE isDryRun = 0 ORDER BY createdAt DESC LIMIT 5'
    );
    
    console.log('\\n💻 Recent Code Submissions:');
    if (codeSubmissions.length > 0) {
      codeSubmissions.forEach((submission, index) => {
        console.log(`${index + 1}. Test: ${submission.testId}, Student: ${submission.studentId}, Question: ${submission.codingQuestionId}, Language: ${submission.language}, Score: ${submission.score}`);
      });
    } else {
      console.log('   No code submissions found');
    }
    
    // Check Tests with coding questions
    const [testsWithCoding] = await connection.execute(`
      SELECT DISTINCT t.testId, t.name, COUNT(cq.id) as codingQuestions
      FROM Tests t 
      JOIN Sections s ON t.testId = s.testId 
      JOIN CodingQuestions cq ON s.id = cq.sectionId 
      GROUP BY t.testId, t.name
      LIMIT 5
    `);
    
    console.log('\\n🧪 Tests with Coding Questions:');
    if (testsWithCoding.length > 0) {
      testsWithCoding.forEach((test, index) => {
        console.log(`${index + 1}. ${test.name} (${test.testId}) - ${test.codingQuestions} coding questions`);
      });
    } else {
      console.log('   No tests with coding questions found');
    }
    
    // Check if we have matching data
    if (testSessions.length > 0 && codeSubmissions.length > 0) {
      console.log('\\n🎯 TESTING RECOMMENDATION:');
      const testSession = testSessions[0];
      const codeSubmission = codeSubmissions.find(cs => cs.testId === testSession.testId && cs.studentId === testSession.studentId);
      
      if (codeSubmission) {
        console.log(`✅ Found matching data! Test the API with:`);
        console.log(`   testId: ${testSession.testId}`);
        console.log(`   studentId: ${testSession.studentId}`);
        console.log(`   URL: http://localhost:5000/api/test-results/test/${testSession.testId}/student/${testSession.studentId}`);
      } else {
        console.log(`⚠️  No matching code submissions for recent test sessions`);
        if (codeSubmissions.length > 0) {
          const cs = codeSubmissions[0];
          console.log(`   Try with: testId=${cs.testId}, studentId=${cs.studentId}`);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Database error:', error.message);
    console.log('\\n💡 Make sure:');
    console.log('1. MySQL server is running');
    console.log('2. Database "projectinforce" exists');
    console.log('3. Credentials in .env are correct');
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkDatabaseData();