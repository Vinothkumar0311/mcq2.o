const { TestSession, SectionSubmission, Test, Section, CodingQuestion, CodeSubmission, sequelize } = require('../../models');

async function simulateCodingTest() {
  const transaction = await sequelize.transaction();
  
  try {
    console.log('🧪 Simulating coding test completion...');

    // Create a test session
    const session = await TestSession.create({
      testId: 'TEST_CODING_001',
      studentId: 'student123',
      currentSectionIndex: 0,
      status: 'in_progress',
      startedAt: new Date(),
      maxScore: 100
    }, { transaction });

    console.log(`✅ Created test session: ${session.id}`);

    // Create a coding question
    const codingQuestion = await CodingQuestion.create({
      sectionId: 1,
      problemStatement: 'Write a function to add two numbers',
      marks: 10,
      timeLimit: 300,
      allowedLanguages: ['javascript', 'python'],
      sampleTestCases: [
        { input: '2 3', expectedOutput: '5' },
        { input: '10 15', expectedOutput: '25' }
      ]
    }, { transaction });

    console.log(`✅ Created coding question: ${codingQuestion.id}`);

    // Create a code submission
    const codeSubmission = await CodeSubmission.create({
      studentId: 'student123',
      codingQuestionId: codingQuestion.id,
      testId: 'TEST_CODING_001',
      code: 'function add(a, b) { return a + b; }',
      language: 'javascript',
      status: 'passed',
      score: 10,
      testResults: {
        passed: 2,
        total: 2,
        percentage: 100,
        results: [
          { input: '2 3', expectedOutput: '5', actualOutput: '5', passed: true },
          { input: '10 15', expectedOutput: '25', actualOutput: '25', passed: true }
        ]
      },
      executionTime: 15,
      isDryRun: false
    }, { transaction });

    console.log(`✅ Created code submission: ${codeSubmission.id}`);

    // Create detailed coding results
    const detailedCodingResults = [{
      id: codingQuestion.id,
      problemStatement: codingQuestion.problemStatement,
      userCode: codeSubmission.code,
      language: codeSubmission.language,
      testCasesPassed: 2,
      totalTestCases: 2,
      score: codeSubmission.score,
      maxScore: codingQuestion.marks,
      executionTime: codeSubmission.executionTime,
      errors: [],
      testCaseResults: codeSubmission.testResults.results
    }];

    // Create section submission with detailed coding results
    const sectionSubmission = await SectionSubmission.create({
      testSessionId: session.id,
      sectionId: 1,
      sectionIndex: 0,
      mcqAnswers: JSON.stringify({}),
      codingSubmissions: JSON.stringify([{
        questionId: codingQuestion.id,
        submissionId: codeSubmission.id,
        score: 10,
        maxScore: 10,
        testResults: { passed: 2, total: 2, percentage: 100 }
      }]),
      detailedCodingResults: JSON.stringify(detailedCodingResults),
      score: 10,
      maxScore: 10,
      timeSpent: 300,
      submittedAt: new Date()
    }, { transaction });

    console.log(`✅ Created section submission: ${sectionSubmission.id}`);

    // Update session to completed
    await session.update({
      status: 'completed',
      completedAt: new Date(),
      totalScore: 10,
      maxScore: 10
    }, { transaction });

    await transaction.commit();

    console.log('\n🎉 Test simulation completed successfully!');
    console.log('📊 Results:');
    console.log(`   Session ID: ${session.id}`);
    console.log(`   Total Score: ${session.totalScore}/${session.maxScore}`);
    console.log(`   Coding Results: ${detailedCodingResults.length} questions`);
    console.log(`   Test Cases Passed: ${detailedCodingResults[0].testCasesPassed}/${detailedCodingResults[0].totalTestCases}`);

    // Test retrieval
    const retrievedSubmission = await SectionSubmission.findByPk(sectionSubmission.id);
    const parsedResults = JSON.parse(retrievedSubmission.detailedCodingResults);
    
    console.log('\n✅ Retrieval test:');
    console.log(`   Retrieved ${parsedResults.length} coding results`);
    console.log(`   First result: ${parsedResults[0].language} code with ${parsedResults[0].testCasesPassed} passed tests`);

  } catch (error) {
    await transaction.rollback();
    console.error('❌ Simulation failed:', error.message);
  }
}

if (require.main === module) {
  simulateCodingTest().then(() => process.exit(0));
}

module.exports = simulateCodingTest;