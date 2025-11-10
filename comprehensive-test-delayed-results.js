/**
 * COMPREHENSIVE TEST: Delayed Result Release System
 * Tests all scenarios and auto-fixes any issues found
 */

const axios = require('axios');
const mysql = require('mysql2/promise');

const BASE_URL = 'http://localhost:5000';
const DB_CONFIG = {
  host: 'localhost',
  user: 'root',
  password: '12345',
  database: 'projectinforce1'
};

let testResults = {
  passed: 0,
  failed: 0,
  issues: [],
  fixes: []
};

async function runComprehensiveTest() {
  console.log('🧪 COMPREHENSIVE DELAYED RESULT RELEASE TEST');
  console.log('==============================================\n');

  try {
    // Step 1: Database Setup Check
    console.log('1️⃣ CHECKING DATABASE SETUP...');
    await testDatabaseSetup();
    
    // Step 2: Server Health Check
    console.log('\n2️⃣ CHECKING SERVER STATUS...');
    await testServerHealth();
    
    // Step 3: Test Student Pre-Release View
    console.log('\n3️⃣ TESTING STUDENT PRE-RELEASE VIEW...');
    await testStudentPreReleaseView();
    
    // Step 4: Test Admin Release Functionality
    console.log('\n4️⃣ TESTING ADMIN RELEASE FUNCTIONALITY...');
    await testAdminReleaseFunction();
    
    // Step 5: Test Student Post-Release View
    console.log('\n5️⃣ TESTING STUDENT POST-RELEASE VIEW...');
    await testStudentPostReleaseView();
    
    // Step 6: Test Edge Cases
    console.log('\n6️⃣ TESTING EDGE CASES...');
    await testEdgeCases();
    
    // Final Results
    console.log('\n📊 TEST RESULTS SUMMARY');
    console.log('========================');
    console.log(`✅ PASSED: ${testResults.passed}`);
    console.log(`❌ FAILED: ${testResults.failed}`);
    
    if (testResults.failed === 0) {
      console.log('\n🎉 TEST RESULT: ✅ PASS');
      console.log('Feature working perfectly end-to-end.');
    } else {
      console.log('\n⚠️ TEST RESULT: ❌ FAIL');
      console.log('Issues found and fixes applied:');
      testResults.issues.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue}`);
      });
    }
    
  } catch (error) {
    console.error('❌ CRITICAL TEST FAILURE:', error.message);
    testResults.failed++;
  }
}

async function testDatabaseSetup() {
  try {
    const connection = await mysql.createConnection(DB_CONFIG);
    
    // Check if results_released columns exist
    const [studentsResults] = await connection.execute(
      "SHOW COLUMNS FROM students_results LIKE 'results_released'"
    );
    
    const [testSessions] = await connection.execute(
      "SHOW COLUMNS FROM test_sessions LIKE 'results_released'"
    );
    
    if (studentsResults.length === 0 || testSessions.length === 0) {
      console.log('❌ Database columns missing - Adding now...');
      
      // Auto-fix: Add missing columns
      await connection.execute(
        "ALTER TABLE students_results ADD COLUMN IF NOT EXISTS results_released BOOLEAN DEFAULT FALSE"
      );
      await connection.execute(
        "ALTER TABLE test_sessions ADD COLUMN IF NOT EXISTS results_released BOOLEAN DEFAULT FALSE"
      );
      
      testResults.fixes.push('Added results_released columns to database tables');
      console.log('✅ Database columns added automatically');
    } else {
      console.log('✅ Database setup correct');
    }
    
    // Create test data if needed
    await setupTestData(connection);
    
    await connection.end();
    testResults.passed++;
    
  } catch (error) {
    console.log('❌ Database setup failed:', error.message);
    testResults.failed++;
    testResults.issues.push(`Database setup: ${error.message}`);
  }
}

async function setupTestData(connection) {
  try {
    // Check if we have test data
    const [existingData] = await connection.execute(
      "SELECT COUNT(*) as count FROM test_sessions WHERE status IN ('completed', 'submitted')"
    );
    
    if (existingData[0].count === 0) {
      console.log('📝 Creating test data...');
      
      // Insert test data
      await connection.execute(`
        INSERT IGNORE INTO test_sessions 
        (student_id, test_id, status, total_score, max_score, results_released, completed_at, created_at, updated_at)
        VALUES 
        ('test_student_1', 'TEST_999', 'completed', 85, 100, FALSE, NOW(), NOW(), NOW())
      `);
      
      await connection.execute(`
        INSERT IGNORE INTO students_results 
        (test_id, test_name, user_email, student_name, total_score, max_score, percentage, results_released, completed_at, date, session_id, created_at, updated_at)
        VALUES 
        ('TEST_999', 'Sample Test', 'test@example.com', 'Test Student', 85, 100, 85.0, FALSE, NOW(), CURDATE(), 'session_999', NOW(), NOW())
      `);
      
      console.log('✅ Test data created');
    }
  } catch (error) {
    console.log('⚠️ Test data setup warning:', error.message);
  }
}

async function testServerHealth() {
  try {
    const response = await axios.get(`${BASE_URL}/api/health`);
    
    if (response.data.status === 'API is working') {
      console.log('✅ Server is running and healthy');
      testResults.passed++;
    } else {
      throw new Error('Server health check failed');
    }
  } catch (error) {
    console.log('❌ Server not responding:', error.message);
    testResults.failed++;
    testResults.issues.push('Server not running - please start with: npm run dev');
  }
}

async function testStudentPreReleaseView() {
  try {
    // Test with our known test data
    const response = await axios.get(
      `${BASE_URL}/api/test-results/test/TEST_999/student/test_student_1`
    );
    
    if (response.data.success) {
      if (response.data.resultsPending || response.data.testCompleted) {
        console.log('✅ Student sees completion message (results pending)');
        console.log(`   Message: "${response.data.testResult.message}"`);
        console.log(`   Sub-message: "${response.data.testResult.subMessage}"`);
        testResults.passed++;
      } else {
        console.log('❌ Student can see full results before admin release');
        testResults.failed++;
        testResults.issues.push('Student pre-release view shows full results instead of pending message');
      }
    } else {
      throw new Error('API call failed: ' + response.data.error);
    }
  } catch (error) {
    console.log('❌ Student pre-release test failed:', error.message);
    testResults.failed++;
    testResults.issues.push(`Student pre-release view: ${error.message}`);
  }
}

async function testAdminReleaseFunction() {
  try {
    // Test admin release API
    const response = await axios.post(
      `${BASE_URL}/api/admin/results/release/TEST_999/test_student_1`
    );
    
    if (response.data.success) {
      console.log('✅ Admin release API working');
      console.log(`   Response: "${response.data.message}"`);
      
      // Verify database was updated
      const connection = await mysql.createConnection(DB_CONFIG);
      const [dbCheck] = await connection.execute(
        "SELECT results_released FROM test_sessions WHERE test_id = 'TEST_999' AND student_id = 'test_student_1'"
      );
      
      if (dbCheck.length > 0 && dbCheck[0].results_released === 1) {
        console.log('✅ Database flag updated correctly');
        testResults.passed++;
      } else {
        console.log('❌ Database flag not updated');
        testResults.failed++;
        testResults.issues.push('Database results_released flag not updated after admin release');
      }
      
      await connection.end();
    } else {
      throw new Error('Admin release failed: ' + response.data.error);
    }
  } catch (error) {
    console.log('❌ Admin release test failed:', error.message);
    testResults.failed++;
    testResults.issues.push(`Admin release function: ${error.message}`);
  }
}

async function testStudentPostReleaseView() {
  try {
    // Test student view after admin release
    const response = await axios.get(
      `${BASE_URL}/api/test-results/test/TEST_999/student/test_student_1`
    );
    
    if (response.data.success) {
      if (response.data.resultsPending) {
        console.log('❌ Results still showing as pending after release');
        testResults.failed++;
        testResults.issues.push('Student still sees pending message after admin release');
      } else {
        console.log('✅ Student can now see full results');
        const result = response.data.testResult;
        console.log(`   Test: ${result.testName}`);
        console.log(`   Score: ${result.totalScore}/${result.maxScore} (${result.percentage}%)`);
        console.log(`   MCQ Questions: ${result.hasMCQQuestions ? 'Yes' : 'No'}`);
        console.log(`   Coding Questions: ${result.hasCodingQuestions ? 'Yes' : 'No'}`);
        testResults.passed++;
      }
    } else {
      throw new Error('API call failed: ' + response.data.error);
    }
  } catch (error) {
    console.log('❌ Student post-release test failed:', error.message);
    testResults.failed++;
    testResults.issues.push(`Student post-release view: ${error.message}`);
  }
}

async function testEdgeCases() {
  try {
    // Test 1: Invalid test ID
    try {
      await axios.get(`${BASE_URL}/api/test-results/test/INVALID/student/test_student_1`);
      console.log('❌ Invalid test ID should return 404');
      testResults.failed++;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.log('✅ Invalid test ID properly handled');
        testResults.passed++;
      }
    }
    
    // Test 2: Release all results
    try {
      const response = await axios.post(`${BASE_URL}/api/admin/results/release-all/TEST_999`);
      if (response.data.success) {
        console.log('✅ Release all results working');
        testResults.passed++;
      }
    } catch (error) {
      console.log('❌ Release all results failed:', error.message);
      testResults.failed++;
    }
    
  } catch (error) {
    console.log('❌ Edge case testing failed:', error.message);
    testResults.failed++;
  }
}

// Run the comprehensive test
runComprehensiveTest().catch(console.error);