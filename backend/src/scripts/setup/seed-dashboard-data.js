const { Test, TestAssignment, User, LicensedUser, Section, sequelize } = require('./models');

async function seedDashboardData() {
  try {
    console.log('🌱 Seeding dashboard data...');

    // Create sample test if none exists
    const existingTests = await Test.findAll();
    if (existingTests.length === 0) {
      console.log('Creating sample tests...');
      
      const sampleTest = await Test.create({
        testId: 'TEST001',
        name: 'JavaScript Fundamentals',
        description: 'Basic JavaScript concepts and syntax',
        instructions: 'Answer all questions to the best of your ability',
        status: 'scheduled',
        testDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Tomorrow
        startTime: '10:00:00',
        windowTime: 120
      });

      const sampleTest2 = await Test.create({
        testId: 'TEST002',
        name: 'React Components',
        description: 'Understanding React components and props',
        instructions: 'Complete all sections within the time limit',
        status: 'scheduled',
        testDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Day after tomorrow
        startTime: '14:00:00',
        windowTime: 90
      });

      console.log('✅ Sample tests created');
    }

    // Create sample user if none exists
    let sampleUser = await User.findOne({ where: { email: 'john.doe@example.com' } });
    if (!sampleUser) {
      sampleUser = await User.create({
        name: 'John Doe',
        email: 'john.doe@example.com',
        department: 'CSE'
      });
      console.log('✅ Sample user created with ID:', sampleUser.id);
    }

    // Create test assignments
    const assignments = await TestAssignment.findAll();
    if (assignments.length === 0) {
      await TestAssignment.create({
        testId: 'TEST001',
        departmentCode: 'CSE',
        testDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        startTime: '10:00:00',
        windowTime: 120
      });

      await TestAssignment.create({
        testId: 'TEST002',
        departmentCode: 'CSE',
        testDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        startTime: '14:00:00',
        windowTime: 90
      });

      console.log('✅ Test assignments created');
    }

    console.log('🎉 Dashboard data seeding completed!');
    
    // Show summary
    const testCount = await Test.count();
    const userCount = await User.count();
    const assignmentCount = await TestAssignment.count();
    
    console.log(`📊 Summary:`);
    console.log(`- Tests: ${testCount}`);
    console.log(`- Users: ${userCount}`);
    console.log(`- Assignments: ${assignmentCount}`);

  } catch (error) {
    console.error('❌ Error seeding data:', error);
  } finally {
    process.exit(0);
  }
}

seedDashboardData();