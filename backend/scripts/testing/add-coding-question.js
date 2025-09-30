const { Test, Section, CodingQuestion, sequelize } = require('../../models');

async function addCodingQuestion() {
  const transaction = await sequelize.transaction();
  
  try {
    console.log('🔧 Adding coding question to existing test...');

    // Get the first test
    const test = await Test.findOne({
      include: [{ model: Section }]
    });

    if (!test || !test.Sections.length) {
      console.log('❌ No test with sections found');
      return;
    }

    const section = test.Sections[0];
    console.log(`📝 Using test: ${test.name} (${test.testId})`);
    console.log(`📋 Using section: ${section.name} (${section.id})`);

    // Update section type to include coding
    await section.update({
      type: 'MIXED' // or 'CODING'
    }, { transaction });

    // Add a coding question
    const codingQuestion = await CodingQuestion.create({
      sectionId: section.id,
      problemStatement: `Write a function called 'add' that takes two numbers as parameters and returns their sum.

Example:
- add(2, 3) should return 5
- add(10, 15) should return 25

Your function should handle both positive and negative numbers.`,
      marks: 10,
      timeLimit: 300, // 5 minutes
      allowedLanguages: ['javascript', 'python', 'java'],
      sampleTestCases: [
        { input: '2 3', expectedOutput: '5' },
        { input: '10 15', expectedOutput: '25' },
        { input: '-5 3', expectedOutput: '-2' }
      ],
      hiddenTestCases: [
        { input: '0 0', expectedOutput: '0' },
        { input: '100 200', expectedOutput: '300' }
      ]
    }, { transaction });

    await transaction.commit();

    console.log(`✅ Added coding question: ${codingQuestion.id}`);
    console.log(`📊 Problem: ${codingQuestion.problemStatement.substring(0, 50)}...`);
    console.log(`🎯 Marks: ${codingQuestion.marks}`);
    console.log(`⏱️ Time limit: ${codingQuestion.timeLimit} seconds`);
    console.log(`💻 Languages: ${codingQuestion.allowedLanguages.join(', ')}`);
    console.log(`🧪 Sample test cases: ${codingQuestion.sampleTestCases.length}`);

    console.log('\n🎉 Coding question added successfully!');
    console.log(`Now you can test coding functionality with test ID: ${test.testId}`);

  } catch (error) {
    await transaction.rollback();
    console.error('❌ Failed to add coding question:', error.message);
  }
}

if (require.main === module) {
  addCodingQuestion().then(() => process.exit(0));
}

module.exports = addCodingQuestion;