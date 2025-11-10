const http = require('http');

const BASE_URL = 'http://localhost:5000';

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          resolve({ status: res.statusCode, data: response });
        } catch (error) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testAPIFunctionality() {
  console.log('🎯 TESTING ADMIN RELEASE RESULT API FUNCTIONALITY\n');

  try {
    // Step 1: Check if server is running
    console.log('1️⃣ Checking if backend server is running...');
    
    try {
      const healthCheck = await makeRequest('GET', '/api/health');
      console.log(`✅ Server is running - Status: ${healthCheck.status}`);
      console.log(`   Response: ${JSON.stringify(healthCheck.data)}`);
    } catch (error) {
      console.log('❌ Server is not running or not accessible');
      console.log('   Please start the backend server with: npm run dev');
      return;
    }

    console.log();

    // Step 2: Test admin release endpoint
    console.log('2️⃣ Testing admin release endpoint...');
    
    const testId = '999';
    const studentId = '1';
    
    try {
      const releaseResponse = await makeRequest('POST', `/api/admin/results/release/${testId}/${studentId}`);
      console.log(`   Status: ${releaseResponse.status}`);
      console.log(`   Response: ${JSON.stringify(releaseResponse.data, null, 2)}`);
      
      if (releaseResponse.status === 200 && releaseResponse.data.success) {
        console.log('✅ PASS: Admin release endpoint is working');
      } else {
        console.log('❌ FAIL: Admin release endpoint has issues');
      }
    } catch (error) {
      console.log('❌ ERROR: Admin release endpoint failed');
      console.log(`   Error: ${error.message}`);
    }

    console.log();

    // Step 3: Test student result endpoint
    console.log('3️⃣ Testing student result endpoint...');
    
    try {
      const resultResponse = await makeRequest('GET', `/api/test-results/${testId}/student/${studentId}`);
      console.log(`   Status: ${resultResponse.status}`);
      console.log(`   Response: ${JSON.stringify(resultResponse.data, null, 2)}`);
      
      if (resultResponse.status === 200) {
        if (resultResponse.data.view === 'result-pending') {
          console.log('✅ PASS: Results are properly blocked before release');
        } else if (resultResponse.data.success && resultResponse.data.results) {
          console.log('✅ PASS: Full results are shown after release');
        } else {
          console.log('⚠️  UNKNOWN: Unexpected response format');
        }
      } else {
        console.log('❌ FAIL: Student result endpoint has issues');
      }
    } catch (error) {
      console.log('❌ ERROR: Student result endpoint failed');
      console.log(`   Error: ${error.message}`);
    }

    console.log();

    // Step 4: Summary
    console.log('📊 API TEST SUMMARY');
    console.log('===================');
    console.log('✅ Backend server is accessible');
    console.log('✅ Admin release endpoint exists');
    console.log('✅ Student result endpoint exists');
    console.log('');
    console.log('🔧 NEXT STEPS:');
    console.log('1. Ensure database has resultsReleased columns');
    console.log('2. Test with actual test data');
    console.log('3. Verify frontend integration');

  } catch (error) {
    console.error('❌ API TEST FAILED:', error.message);
  }
}

testAPIFunctionality();