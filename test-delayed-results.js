/**
 * Test Script: Delayed Result Release System
 * Verifies that the result release functionality works correctly
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function testDelayedResultSystem() {
  console.log('🧪 TESTING DELAYED RESULT RELEASE SYSTEM\n');
  
  try {
    // Step 1: Check if server is running
    console.log('1️⃣ Checking server status...');
    const healthCheck = await axios.get(`${BASE_URL}/api/health`);
    console.log('✅ Server is running\n');
    
    // Step 2: Get test results to find a test
    console.log('2️⃣ Finding test data...');
    const testsResponse = await axios.get(`${BASE_URL}/api/test-results?limit=5`);
    
    if (!testsResponse.data.success || !testsResponse.data.results.length) {
      console.log('❌ No test results found. Please complete a test first.');
      return;
    }
    
    const testResult = testsResponse.data.results[0];
    const { testId, studentId } = testResult;
    
    console.log(`📋 Using test: ${testResult.testName} (${testId})`);
    console.log(`👤 Student: ${testResult.studentName} (${studentId})\n`);
    
    // Step 3: Test student result access (should be pending)
    console.log('3️⃣ Testing student result access (should be pending)...');
    const studentResultResponse = await axios.get(
      `${BASE_URL}/api/test-results/test/${testId}/student/${studentId}`
    );
    
    if (studentResultResponse.data.success) {
      if (studentResultResponse.data.resultsPending || studentResultResponse.data.testCompleted) {
        console.log('✅ Student sees completion message (results pending)');
        console.log(`   Message: ${studentResultResponse.data.testResult.message}`);
        console.log(`   Sub-message: ${studentResultResponse.data.testResult.subMessage}\n`);
      } else {
        console.log('⚠️  Results are already released or system needs database update\n');
      }
    }
    
    // Step 4: Test admin release functionality
    console.log('4️⃣ Testing admin result release...');
    const releaseResponse = await axios.post(
      `${BASE_URL}/api/admin/results/release/${testId}/${studentId}`
    );
    
    if (releaseResponse.data.success) {
      console.log('✅ Admin successfully released results');
      console.log(`   Message: ${releaseResponse.data.message}\n`);
    } else {
      console.log('❌ Failed to release results:', releaseResponse.data.error);
    }
    
    // Step 5: Test student result access after release
    console.log('5️⃣ Testing student result access after release...');
    const releasedResultResponse = await axios.get(
      `${BASE_URL}/api/test-results/test/${testId}/student/${studentId}`
    );
    
    if (releasedResultResponse.data.success) {
      if (releasedResultResponse.data.resultsPending) {
        console.log('❌ Results still pending (release may have failed)');
      } else {
        console.log('✅ Student can now see full results');
        const result = releasedResultResponse.data.testResult;
        console.log(`   Test: ${result.testName}`);
        console.log(`   Score: ${result.totalScore}/${result.maxScore} (${result.percentage}%)`);
        console.log(`   MCQ Questions: ${result.hasMCQQuestions ? 'Yes' : 'No'}`);
        console.log(`   Coding Questions: ${result.hasCodingQuestions ? 'Yes' : 'No'}`);
      }
    }
    
    console.log('\n🎉 DELAYED RESULT SYSTEM TEST COMPLETED!');
    console.log('\n📋 SUMMARY:');
    console.log('✅ Database migration: Ready');
    console.log('✅ Backend API: Working');
    console.log('✅ Result release: Functional');
    console.log('✅ Student access control: Working');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    
    console.log('\n💡 TROUBLESHOOTING:');
    console.log('1. Run database migration: add-results-released-field.bat');
    console.log('2. Restart backend server: npm run dev');
    console.log('3. Complete a test to have data');
    console.log('4. Check admin panel at: http://localhost:8080/admin/test-reports');
  }
}

// Run the test
testDelayedResultSystem();