const { StudentsResults, sequelize } = require('../models');

async function populateTestData() {
  try {
    console.log('🔄 Populating sample test data...');

    // Sample test data
    const sampleData = [
      {
        testId: 'test_001',
        testName: 'JavaScript Fundamentals Test',
        userEmail: 'john.doe@example.com',
        studentName: 'John Doe',
        department: 'Computer Science',
        sinNumber: 'SIN001',
        totalScore: 85,
        maxScore: 100,
        percentage: 85,
        completedAt: new Date('2024-01-15T10:30:00Z'),
        date: '2024-01-15',
        answers: JSON.stringify({
          1: 'A', 2: 'B', 3: 'C', 4: 'A', 5: 'D',
          6: 'B', 7: 'A', 8: 'C', 9: 'B', 10: 'A'
        }),
        sessionId: 'session_test_001_1705315800000'
      },
      {
        testId: 'test_001',
        testName: 'JavaScript Fundamentals Test',
        userEmail: 'jane.smith@example.com',
        studentName: 'Jane Smith',
        department: 'Computer Science',
        sinNumber: 'SIN002',
        totalScore: 92,
        maxScore: 100,
        percentage: 92,
        completedAt: new Date('2024-01-15T11:15:00Z'),
        date: '2024-01-15',
        answers: JSON.stringify({
          1: 'A', 2: 'B', 3: 'C', 4: 'A', 5: 'D',
          6: 'B', 7: 'A', 8: 'C', 9: 'B', 10: 'A'
        }),
        sessionId: 'session_test_001_1705318500000'
      },
      {
        testId: 'test_001',
        testName: 'JavaScript Fundamentals Test',
        userEmail: 'bob.wilson@example.com',
        studentName: 'Bob Wilson',
        department: 'Information Technology',
        sinNumber: 'SIN003',
        totalScore: 78,
        maxScore: 100,
        percentage: 78,
        completedAt: new Date('2024-01-15T14:20:00Z'),
        date: '2024-01-15',
        answers: JSON.stringify({
          1: 'A', 2: 'C', 3: 'B', 4: 'A', 5: 'D',
          6: 'B', 7: 'C', 8: 'C', 9: 'B', 10: 'A'
        }),
        sessionId: 'session_test_001_1705329600000'
      },
      {
        testId: 'test_002',
        testName: 'Python Programming Assessment',
        userEmail: 'alice.brown@example.com',
        studentName: 'Alice Brown',
        department: 'Computer Science',
        sinNumber: 'SIN004',
        totalScore: 88,
        maxScore: 100,
        percentage: 88,
        completedAt: new Date('2024-01-16T09:45:00Z'),
        date: '2024-01-16',
        answers: JSON.stringify({
          1: 'B', 2: 'A', 3: 'C', 4: 'D', 5: 'A',
          6: 'C', 7: 'B', 8: 'A', 9: 'D', 10: 'C'
        }),
        sessionId: 'session_test_002_1705399500000'
      },
      {
        testId: 'test_002',
        testName: 'Python Programming Assessment',
        userEmail: 'charlie.davis@example.com',
        studentName: 'Charlie Davis',
        department: 'Software Engineering',
        sinNumber: 'SIN005',
        totalScore: 95,
        maxScore: 100,
        percentage: 95,
        completedAt: new Date('2024-01-16T13:30:00Z'),
        date: '2024-01-16',
        answers: JSON.stringify({
          1: 'B', 2: 'A', 3: 'C', 4: 'D', 5: 'A',
          6: 'C', 7: 'B', 8: 'A', 9: 'D', 10: 'C'
        }),
        sessionId: 'session_test_002_1705413000000'
      },
      {
        testId: 'test_003',
        testName: 'Data Structures and Algorithms',
        userEmail: 'diana.miller@example.com',
        studentName: 'Diana Miller',
        department: 'Computer Science',
        sinNumber: 'SIN006',
        totalScore: 82,
        maxScore: 100,
        percentage: 82,
        completedAt: new Date('2024-01-17T10:15:00Z'),
        date: '2024-01-17',
        answers: JSON.stringify({
          1: 'C', 2: 'B', 3: 'A', 4: 'D', 5: 'C',
          6: 'A', 7: 'B', 8: 'D', 9: 'C', 10: 'A'
        }),
        sessionId: 'session_test_003_1705488900000'
      }
    ];

    // Clear existing data
    await StudentsResults.destroy({ where: {} });
    console.log('🗑️ Cleared existing test results');

    // Insert sample data
    await StudentsResults.bulkCreate(sampleData);
    console.log(`✅ Inserted ${sampleData.length} sample test results`);

    // Verify data
    const count = await StudentsResults.count();
    console.log(`📊 Total test results in database: ${count}`);

    const testGroups = await StudentsResults.findAll({
      attributes: ['testId', 'testName', [sequelize.fn('COUNT', sequelize.col('testId')), 'count']],
      group: ['testId', 'testName']
    });

    console.log('📋 Test summary:');
    testGroups.forEach(group => {
      console.log(`  - ${group.testName}: ${group.dataValues.count} students`);
    });

    console.log('✅ Sample test data populated successfully!');
    
  } catch (error) {
    console.error('❌ Error populating test data:', error);
  } finally {
    await sequelize.close();
  }
}

// Run if called directly
if (require.main === module) {
  populateTestData();
}

module.exports = populateTestData;