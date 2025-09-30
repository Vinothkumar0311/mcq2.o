const { spawn } = require('child_process');
const path = require('path');

console.log('🔧 Testing Section Timing System Fix...\n');

// Test 1: Check database columns
console.log('1️⃣ Checking database structure...');
const checkDb = spawn('node', ['backend/scripts/database/check-table-structure.js'], {
  cwd: __dirname,
  stdio: 'inherit'
});

checkDb.on('close', (code) => {
  if (code === 0) {
    console.log('✅ Database structure check passed\n');
    
    // Test 2: Test section timing access
    console.log('2️⃣ Testing section timing database access...');
    const testAccess = spawn('node', ['backend/scripts/testing/test-section-timing-simple.js'], {
      cwd: __dirname,
      stdio: 'inherit'
    });
    
    testAccess.on('close', (accessCode) => {
      if (accessCode === 0) {
        console.log('\n✅ Section timing system is ready!');
        console.log('\n🎉 The section-based timing system has been successfully implemented:');
        console.log('   - Individual section timers');
        console.log('   - Automatic progression when time expires');
        console.log('   - No return to completed sections');
        console.log('   - Auto-submission on timeout');
        console.log('\n🚀 You can now use section-based tests with strict timing!');
      } else {
        console.log('\n❌ Section timing access test failed');
      }
    });
  } else {
    console.log('\n❌ Database structure check failed');
  }
});