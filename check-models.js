const { TestSession, StudentsResults } = require('./backend/src/models');

console.log('🔍 CHECKING MODEL FIELDS\n');

console.log('TestSession fields:');
const sessionFields = Object.keys(TestSession.rawAttributes);
sessionFields.forEach(field => console.log(`  - ${field}`));

console.log('\nStudentsResults fields:');
const resultsFields = Object.keys(StudentsResults.rawAttributes);
resultsFields.forEach(field => console.log(`  - ${field}`));

console.log('\n📊 ANALYSIS:');
console.log(`TestSession has resultsReleased: ${sessionFields.includes('resultsReleased')}`);
console.log(`StudentsResults has resultsReleased: ${resultsFields.includes('resultsReleased')}`);

if (!sessionFields.includes('resultsReleased')) {
  console.log('\n❌ MISSING: TestSession.resultsReleased field');
}

if (!resultsFields.includes('resultsReleased')) {
  console.log('❌ MISSING: StudentsResults.resultsReleased field');
}

process.exit(0);