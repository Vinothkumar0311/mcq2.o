const { StudentsResults, Test, Section, MCQ, sequelize } = require('../models');

async function addMoreSampleData() {
  try {
    console.log('🔄 Adding more sample test results...');

    // Create another sample test
    const mathTest = await Test.create({
      testId: 'math-test-002',
      name: 'Mathematics Assessment',
      description: 'Basic mathematics and problem solving',
      duration: 45,
      totalMarks: 15,
      passingMarks: 9,
      isActive: true,
      createdBy: 'admin'
    });

    // Create a sample section
    const mathSection = await Section.create({
      testId: mathTest.testId,
      name: 'Mathematics',
      duration: 45,
      totalMarks: 15
    });

    // Create sample MCQs for math test
    const mathMCQs = [
      {
        sectionId: mathSection.id,
        questionText: 'What is the square root of 64?',
        optionA: '6',
        optionB: '7',
        optionC: '8',
        optionD: '9',
        correctOption: 'C',
        correctOptionLetter: 'C',
        marks: 1,
        explanation: 'The square root of 64 is 8 because 8 × 8 = 64.'
      },
      {
        sectionId: mathSection.id,
        questionText: 'If x + 5 = 12, what is x?',
        optionA: '5',
        optionB: '6',
        optionC: '7',
        optionD: '8',
        correctOption: 'C',
        correctOptionLetter: 'C',
        marks: 1,
        explanation: 'x = 12 - 5 = 7'
      },
      {
        sectionId: mathSection.id,
        questionText: 'What is 15% of 200?',
        optionA: '25',
        optionB: '30',
        optionC: '35',
        optionD: '40',
        correctOption: 'B',
        correctOptionLetter: 'B',
        marks: 1,
        explanation: '15% of 200 = (15/100) × 200 = 30'
      }
    ];

    await MCQ.bulkCreate(mathMCQs);
    console.log('✅ Created Mathematics test with MCQs');

    // Sample student data for math test
    const mathStudents = [
      {
        testId: mathTest.testId,
        testName: mathTest.name,
        userEmail: 'sarah.johnson@example.com',
        studentName: 'Sarah Johnson',
        department: 'Mathematics',
        sinNumber: 'SIN006',
        totalScore: 12,
        maxScore: 15,
        percentage: 80,
        completedAt: new Date(),
        date: new Date().toLocaleDateString(),
        answers: JSON.stringify({ 1: 'C', 2: 'C', 3: 'B' }),
        sessionId: 'session_006_' + Date.now()
      },
      {
        testId: mathTest.testId,
        testName: mathTest.name,
        userEmail: 'mike.taylor@example.com',
        studentName: 'Mike Taylor',
        department: 'Engineering',
        sinNumber: 'SIN007',
        totalScore: 14,
        maxScore: 15,
        percentage: 93,
        completedAt: new Date(),
        date: new Date().toLocaleDateString(),
        answers: JSON.stringify({ 1: 'C', 2: 'C', 3: 'B' }),
        sessionId: 'session_007_' + Date.now()
      },
      {
        testId: mathTest.testId,
        testName: mathTest.name,
        userEmail: 'lisa.white@example.com',
        studentName: 'Lisa White',
        department: 'Physics',
        sinNumber: 'SIN008',
        totalScore: 10,
        maxScore: 15,
        percentage: 67,
        completedAt: new Date(),
        date: new Date().toLocaleDateString(),
        answers: JSON.stringify({ 1: 'C', 2: 'B', 3: 'B' }),
        sessionId: 'session_008_' + Date.now()
      },
      {
        testId: mathTest.testId,
        testName: mathTest.name,
        userEmail: 'david.green@example.com',
        studentName: 'David Green',
        department: 'Computer Science',
        sinNumber: 'SIN009',
        totalScore: 8,
        maxScore: 15,
        percentage: 53,
        completedAt: new Date(),
        date: new Date().toLocaleDateString(),
        answers: JSON.stringify({ 1: 'A', 2: 'C', 3: 'A' }),
        sessionId: 'session_009_' + Date.now()
      },
      {
        testId: mathTest.testId,
        testName: mathTest.name,
        userEmail: 'emma.clark@example.com',
        studentName: 'Emma Clark',
        department: 'Mathematics',
        sinNumber: 'SIN010',
        totalScore: 13,
        maxScore: 15,
        percentage: 87,
        completedAt: new Date(),
        date: new Date().toLocaleDateString(),
        answers: JSON.stringify({ 1: 'C', 2: 'C', 3: 'B' }),
        sessionId: 'session_010_' + Date.now()
      }
    ];

    // Insert math test results
    await StudentsResults.bulkCreate(mathStudents);

    console.log(`✅ Successfully added ${mathStudents.length} more sample test results!`);
    console.log('📊 Math test data summary:');
    console.log(`   Test: ${mathTest.name} (${mathTest.testId})`);
    console.log(`   Students: ${mathStudents.length}`);
    console.log(`   Average Score: ${Math.round(mathStudents.reduce((sum, s) => sum + s.percentage, 0) / mathStudents.length)}%`);
    console.log(`   Pass Rate: ${Math.round((mathStudents.filter(s => s.percentage >= 60).length / mathStudents.length) * 100)}%`);

    // Add more results to the first test as well
    const firstTest = await Test.findOne({ where: { testId: 'coding_test_001' } });
    if (firstTest) {
      const additionalStudents = [
        {
          testId: firstTest.testId,
          testName: firstTest.name,
          userEmail: 'tom.anderson@example.com',
          studentName: 'Tom Anderson',
          department: 'Software Engineering',
          sinNumber: 'SIN011',
          totalScore: 9,
          maxScore: 10,
          percentage: 90,
          completedAt: new Date(),
          date: new Date().toLocaleDateString(),
          answers: JSON.stringify({ 1: 'C', 2: 'B', 3: 'B' }),
          sessionId: 'session_011_' + Date.now()
        },
        {
          testId: firstTest.testId,
          testName: firstTest.name,
          userEmail: 'amy.lee@example.com',
          studentName: 'Amy Lee',
          department: 'Computer Science',
          sinNumber: 'SIN012',
          totalScore: 4,
          maxScore: 10,
          percentage: 40,
          completedAt: new Date(),
          date: new Date().toLocaleDateString(),
          answers: JSON.stringify({ 1: 'A', 2: 'A', 3: 'A' }),
          sessionId: 'session_012_' + Date.now()
        }
      ];

      await StudentsResults.bulkCreate(additionalStudents);
      console.log(`✅ Added ${additionalStudents.length} more results to ${firstTest.name}`);
    }

    console.log('\n🎉 Sample data setup complete!');
    console.log('📈 Total tests with results: 2');
    console.log('👥 Total student results: 12');

  } catch (error) {
    console.error('❌ Error adding more sample data:', error);
  } finally {
    await sequelize.close();
  }
}

// Run the script
addMoreSampleData();