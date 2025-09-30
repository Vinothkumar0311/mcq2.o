const { StudentsResults, Test, Section, MCQ, sequelize } = require('../models');

async function addSampleTestResults() {
  try {
    console.log('🔄 Adding sample test results...');

    // First, let's check if we have any tests
    const tests = await Test.findAll({
      include: [{
        model: Section,
        include: [MCQ]
      }]
    });

    if (tests.length === 0) {
      console.log('❌ No tests found. Creating a sample test first...');
      
      // Create a sample test
      const sampleTest = await Test.create({
        testId: 'sample-test-001',
        name: 'Sample MCQ Test',
        description: 'A sample test for demonstration purposes',
        duration: 30,
        totalMarks: 10,
        passingMarks: 6,
        isActive: true,
        createdBy: 'admin'
      });

      // Create a sample section
      const sampleSection = await Section.create({
        testId: sampleTest.testId,
        name: 'General Knowledge',
        duration: 30,
        totalMarks: 10
      });

      // Create sample MCQs
      const sampleMCQs = [
        {
          sectionId: sampleSection.id,
          questionText: 'What is the capital of France?',
          optionA: 'London',
          optionB: 'Berlin',
          optionC: 'Paris',
          optionD: 'Madrid',
          correctOption: 'C',
          correctOptionLetter: 'C',
          marks: 1,
          explanation: 'Paris is the capital and largest city of France.'
        },
        {
          sectionId: sampleSection.id,
          questionText: 'Which planet is known as the Red Planet?',
          optionA: 'Venus',
          optionB: 'Mars',
          optionC: 'Jupiter',
          optionD: 'Saturn',
          correctOption: 'B',
          correctOptionLetter: 'B',
          marks: 1,
          explanation: 'Mars is called the Red Planet due to its reddish appearance.'
        },
        {
          sectionId: sampleSection.id,
          questionText: 'What is 2 + 2?',
          optionA: '3',
          optionB: '4',
          optionC: '5',
          optionD: '6',
          correctOption: 'B',
          correctOptionLetter: 'B',
          marks: 1,
          explanation: 'Basic arithmetic: 2 + 2 = 4'
        }
      ];

      await MCQ.bulkCreate(sampleMCQs);
      console.log('✅ Created sample test with MCQs');
    }

    // Get the first test for sample results
    const firstTest = await Test.findOne({
      include: [{
        model: Section,
        include: [MCQ]
      }]
    });

    if (!firstTest) {
      console.log('❌ No test found to create results for');
      return;
    }

    console.log(`📝 Creating sample results for test: ${firstTest.name}`);

    // Sample student data
    const sampleStudents = [
      {
        testId: firstTest.testId,
        testName: firstTest.name,
        userEmail: 'john.doe@example.com',
        studentName: 'John Doe',
        department: 'Computer Science',
        sinNumber: 'SIN001',
        totalScore: 8,
        maxScore: 10,
        percentage: 80,
        completedAt: new Date(),
        date: new Date().toLocaleDateString(),
        answers: JSON.stringify({ 1: 'C', 2: 'B', 3: 'B' }),
        sessionId: 'session_001_' + Date.now()
      },
      {
        testId: firstTest.testId,
        testName: firstTest.name,
        userEmail: 'jane.smith@example.com',
        studentName: 'Jane Smith',
        department: 'Information Technology',
        sinNumber: 'SIN002',
        totalScore: 9,
        maxScore: 10,
        percentage: 90,
        completedAt: new Date(),
        date: new Date().toLocaleDateString(),
        answers: JSON.stringify({ 1: 'C', 2: 'B', 3: 'B' }),
        sessionId: 'session_002_' + Date.now()
      },
      {
        testId: firstTest.testId,
        testName: firstTest.name,
        userEmail: 'bob.wilson@example.com',
        studentName: 'Bob Wilson',
        department: 'Electronics',
        sinNumber: 'SIN003',
        totalScore: 6,
        maxScore: 10,
        percentage: 60,
        completedAt: new Date(),
        date: new Date().toLocaleDateString(),
        answers: JSON.stringify({ 1: 'C', 2: 'A', 3: 'B' }),
        sessionId: 'session_003_' + Date.now()
      },
      {
        testId: firstTest.testId,
        testName: firstTest.name,
        userEmail: 'alice.brown@example.com',
        studentName: 'Alice Brown',
        department: 'Computer Science',
        sinNumber: 'SIN004',
        totalScore: 7,
        maxScore: 10,
        percentage: 70,
        completedAt: new Date(),
        date: new Date().toLocaleDateString(),
        answers: JSON.stringify({ 1: 'C', 2: 'B', 3: 'A' }),
        sessionId: 'session_004_' + Date.now()
      },
      {
        testId: firstTest.testId,
        testName: firstTest.name,
        userEmail: 'charlie.davis@example.com',
        studentName: 'Charlie Davis',
        department: 'Mechanical Engineering',
        sinNumber: 'SIN005',
        totalScore: 5,
        maxScore: 10,
        percentage: 50,
        completedAt: new Date(),
        date: new Date().toLocaleDateString(),
        answers: JSON.stringify({ 1: 'A', 2: 'A', 3: 'B' }),
        sessionId: 'session_005_' + Date.now()
      }
    ];

    // Check if results already exist
    const existingResults = await StudentsResults.findAll({
      where: { testId: firstTest.testId }
    });

    if (existingResults.length > 0) {
      console.log(`⚠️  Found ${existingResults.length} existing results. Clearing them first...`);
      await StudentsResults.destroy({
        where: { testId: firstTest.testId }
      });
    }

    // Insert sample results
    await StudentsResults.bulkCreate(sampleStudents);

    console.log(`✅ Successfully added ${sampleStudents.length} sample test results!`);
    console.log('📊 Sample data summary:');
    console.log(`   Test: ${firstTest.name} (${firstTest.testId})`);
    console.log(`   Students: ${sampleStudents.length}`);
    console.log(`   Average Score: ${Math.round(sampleStudents.reduce((sum, s) => sum + s.percentage, 0) / sampleStudents.length)}%`);
    console.log(`   Pass Rate: ${Math.round((sampleStudents.filter(s => s.percentage >= 60).length / sampleStudents.length) * 100)}%`);

  } catch (error) {
    console.error('❌ Error adding sample test results:', error);
  } finally {
    await sequelize.close();
  }
}

// Run the script
addSampleTestResults();