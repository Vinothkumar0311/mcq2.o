const axios = require('axios');
const { TestSession, StudentsResults, sequelize } = require('./backend/src/models');

const BASE_URL = 'http://localhost:5000';
const TEST_DATA = {
  testId: '999',
  studentId: '1',
  studentEmail: 'test@example.com'
};

async function runTests() {
  console.log('🎯 TESTING ADMIN RELEASE RESULT FUNCTIONALITY\n');
  
  try {
    // Step 1: Check if resultsReleased field exists
    console.log('1️⃣ Checking database schema...');
    
    const testSessionFields = Object.keys(TestSession.rawAttributes);
    const studentsResultsFields = Object.keys(StudentsResults.rawAttributes);
    
    console.log('TestSession fields:', testSessionFields);
    console.log('StudentsResults fields:', studentsResultsFields);
    
    const hasResultsReleasedInSession = testSessionFields.includes('resultsReleased');
    const hasResultsReleasedInResults = studentsResultsFields.includes('resultsReleased');
    
    console.log(`✅ TestSession.resultsReleased exists: ${hasResultsReleasedInSession}`);
    console.log(`✅ StudentsResults.resultsReleased exists: ${hasResultsReleasedInResults}\n`);
    
    // Step 2: Create test data
    console.log('2️⃣ Creating test data...');
    
    // Clean up existing test data
    await TestSession.destroy({ where: { testId: TEST_DATA.testId, studentId: TEST_DATA.studentId } });
    await StudentsResults.destroy({ where: { testId: TEST_DATA.testId, userEmail: TEST_DATA.studentEmail } });
    
    // Create test session
    const testSession = await TestSession.create({
      studentId: TEST_DATA.studentId,
      studentType: 'user',
      testId: TEST_DATA.testId,
      status: 'completed',
      totalScore: 95,
      maxScore: 100,
      completedAt: new Date(),
      resultsReleased: false
    });
    
    // Create students results
    const studentsResult = await StudentsResults.create({
      testId: TEST_DATA.testId,
      testName: 'Test Release Functionality',
      userEmail: TEST_DATA.studentEmail,
      studentName: 'Test Student',
      totalScore: 95,
      maxScore: 100,
      percentage: 95,
      completedAt: new Date(),
      date: new Date().toISOString().split('T')[0],
      sessionId: `session_${Date.now()}`,
      resultsReleased: false
    });
    
    console.log('✅ Test data created successfully\n');
    
    // Step 3: Test student view before release
    console.log('3️⃣ Testing student view BEFORE release...');
    
    try {
      const response = await axios.get(`${BASE_URL}/api/test-results/${TEST_DATA.testId}/student/${TEST_DATA.studentId}`);
      
      if (response.data.success && response.data.results) {
        console.log('❌ FAIL: Student can see full results before release');
        console.log('Response:', JSON.stringify(response.data, null, 2));
      } else {
        console.log('✅ PASS: Student cannot see results before release');
      }
    } catch (error) {
      if (error.response && error.response.status === 403) {
        console.log('✅ PASS: Student access properly blocked before release');
      } else {
        console.log('❌ ERROR: Unexpected error:', error.message);
      }
    }
    
    console.log();
    
    // Step 4: Test admin release functionality
    console.log('4️⃣ Testing admin release functionality...');
    
    try {
      const releaseResponse = await axios.post(`${BASE_URL}/api/admin/results/release/${TEST_DATA.testId}/${TEST_DATA.studentId}`);
      
      if (releaseResponse.data.success) {
        console.log('✅ PASS: Admin release API works');
        console.log('Response:', releaseResponse.data.message);
      } else {
        console.log('❌ FAIL: Admin release API failed');
        console.log('Response:', releaseResponse.data);
      }
    } catch (error) {
      console.log('❌ ERROR: Admin release failed:', error.message);
      if (error.response) {
        console.log('Error response:', error.response.data);
      }
    }
    
    console.log();
    
    // Step 5: Verify database update
    console.log('5️⃣ Verifying database update...');
    
    const updatedSession = await TestSession.findOne({
      where: { testId: TEST_DATA.testId, studentId: TEST_DATA.studentId }
    });
    
    const updatedResult = await StudentsResults.findOne({
      where: { testId: TEST_DATA.testId, userEmail: TEST_DATA.studentEmail }
    });
    
    console.log(`TestSession.resultsReleased: ${updatedSession?.resultsReleased}`);
    console.log(`StudentsResults.resultsReleased: ${updatedResult?.resultsReleased}`);
    
    if (updatedSession?.resultsReleased && updatedResult?.resultsReleased) {
      console.log('✅ PASS: Database flags updated correctly');
    } else {
      console.log('❌ FAIL: Database flags not updated');
    }
    
    console.log();
    
    // Step 6: Test student view after release
    console.log('6️⃣ Testing student view AFTER release...');
    
    try {
      const response = await axios.get(`${BASE_URL}/api/test-results/${TEST_DATA.testId}/student/${TEST_DATA.studentId}`);
      
      if (response.data.success && response.data.results) {
        console.log('✅ PASS: Student can now see full results after release');
        console.log('Total Score:', response.data.results.totalScore);
        console.log('Max Score:', response.data.results.maxScore);
        console.log('Percentage:', response.data.results.percentage);
      } else {
        console.log('❌ FAIL: Student still cannot see results after release');
        console.log('Response:', response.data);
      }
    } catch (error) {
      console.log('❌ ERROR: Student view failed after release:', error.message);
    }
    
    console.log();
    
    // Step 7: Summary
    console.log('📊 TEST SUMMARY');
    console.log('================');
    
    const sessionHasField = testSessionFields.includes('resultsReleased');
    const resultsHasField = studentsResultsFields.includes('resultsReleased');
    const dbUpdated = updatedSession?.resultsReleased && updatedResult?.resultsReleased;
    
    if (sessionHasField && resultsHasField && dbUpdated) {
      console.log('✅ PASS: All core functionality working');
    } else {
      console.log('❌ FAIL: Issues found that need fixing');
      
      if (!sessionHasField) {
        console.log('- Missing resultsReleased field in TestSession model');
      }
      if (!resultsHasField) {
        console.log('- Missing resultsReleased field in StudentsResults model');
      }
      if (!dbUpdated) {
        console.log('- Database update not working properly');
      }
    }
    
  } catch (error) {
    console.error('❌ TEST FAILED:', error.message);
    console.error(error.stack);
  } finally {
    // Cleanup
    await TestSession.destroy({ where: { testId: TEST_DATA.testId, studentId: TEST_DATA.studentId } });
    await StudentsResults.destroy({ where: { testId: TEST_DATA.testId, userEmail: TEST_DATA.studentEmail } });
    
    await sequelize.close();
  }
}

// Run tests
runTests().catch(console.error);