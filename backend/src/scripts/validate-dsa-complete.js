const { testDSA } = require('./test-dsa');
const { testAdvancedDSA } = require('./test-advanced-dsa');

async function validateDSAComplete() {
  console.log('🎯 COMPLETE DSA VALIDATION');
  console.log('===========================\n');
  
  // Run basic DSA tests
  console.log('1️⃣ Running Basic DSA Tests...');
  const basicPassed = await testDSA();
  console.log(`   Result: ${basicPassed ? '✅ PASS' : '❌ FAIL'}\n`);
  
  // Run advanced DSA tests
  console.log('2️⃣ Running Advanced DSA Tests...');
  const advancedPassed = await testAdvancedDSA();
  console.log(`   Result: ${advancedPassed ? '✅ PASS' : '❌ FAIL'}\n`);
  
  const allPassed = basicPassed && advancedPassed;
  
  console.log('📋 DSA VALIDATION SUMMARY');
  console.log('=========================');
  console.log(`✅ Basic DSA: ${basicPassed ? 'PASS' : 'FAIL'}`);
  console.log(`✅ Advanced DSA: ${advancedPassed ? 'PASS' : 'FAIL'}`);
  
  console.log(`\n🎉 DSA SYSTEM STATUS: ${allPassed ? 'FULLY OPERATIONAL' : 'ISSUES DETECTED'}`);
  
  if (allPassed) {
    console.log('\nSupported DSA Features:');
    console.log('  📊 Arrays & Sorting Algorithms');
    console.log('  🔍 Search Algorithms (Binary Search)');
    console.log('  📚 Stacks & Queues');
    console.log('  🔗 Linked Lists');
    console.log('  🌳 Trees & Tree Traversal');
    console.log('  🗺️  Graphs & BFS/DFS');
    console.log('  📖 Hash Maps & Sets');
    console.log('  🔢 Mathematical Operations');
    
    console.log('\nLanguage Support:');
    console.log('  ☕ Java: Full OOP support, Collections Framework');
    console.log('  🐍 Python: Built-in data structures, Libraries');
    console.log('  ⚡ C++: STL containers, Algorithms library');
  }
  
  return allPassed;
}

if (require.main === module) {
  validateDSAComplete().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('DSA validation failed:', error);
    process.exit(1);
  });
}

module.exports = { validateDSAComplete };