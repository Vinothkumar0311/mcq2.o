// Simple API test for violation system
const testAPI = async () => {
  const baseURL = 'http://localhost:5000/api';
  
  console.log('🧪 Testing Violation Management API');
  console.log('===================================');
  
  try {
    // Test 1: Health check
    console.log('\n1️⃣ Testing server health...');
    const healthResponse = await fetch(`${baseURL}/health`);
    if (healthResponse.ok) {
      console.log('✅ Server is running');
    } else {
      console.log('❌ Server health check failed');
      return;
    }
    
    // Test 2: Log a violation
    console.log('\n2️⃣ Testing violation logging...');
    const logResponse = await fetch(`${baseURL}/violations/log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentId: 'test_student_1',
        testId: 'test_001',
        violationType: 'TabSwitch',
        description: 'API test violation',
        severity: 'Medium',
        evidence: JSON.stringify({ test: true })
      })
    });
    
    if (logResponse.ok) {
      const logData = await logResponse.json();
      console.log('✅ Violation logged successfully:', logData.message);
    } else {
      console.log('❌ Violation logging failed');
    }
    
    // Test 3: Get violations
    console.log('\n3️⃣ Testing violation retrieval...');
    const getResponse = await fetch(`${baseURL}/violations`);
    if (getResponse.ok) {
      const getData = await getResponse.json();
      console.log(`✅ Retrieved ${getData.violations?.length || 0} violations`);
      console.log(`📊 Statistics: Active: ${getData.statistics?.active || 0}, Blocked: ${getData.statistics?.blocked || 0}`);
    } else {
      console.log('❌ Violation retrieval failed');
    }
    
    // Test 4: Check eligibility
    console.log('\n4️⃣ Testing eligibility check...');
    const eligibilityResponse = await fetch(`${baseURL}/test-eligibility/check/test_student_1`);
    if (eligibilityResponse.ok) {
      const eligibilityData = await eligibilityResponse.json();
      console.log(`✅ Eligibility check: ${eligibilityData.eligible ? 'Eligible' : 'Not Eligible'}`);
      if (eligibilityData.warnings) {
        console.log(`⚠️  Warnings: ${eligibilityData.warnings.count} violations`);
      }
    } else {
      console.log('❌ Eligibility check failed');
    }
    
    console.log('\n🎉 API tests completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('- Run setup-violations-system.bat to create database table');
    console.log('- Add AdminViolations page to admin navigation');
    console.log('- Add ViolationWarning component to student pages');
    console.log('- Integrate violation detection in test controllers');
    
  } catch (error) {
    console.error('❌ API test failed:', error.message);
    console.log('\n🔧 Make sure:');
    console.log('- Backend server is running on port 5000');
    console.log('- Database is connected');
    console.log('- Violations table exists');
  }
};

// Run the test
testAPI();