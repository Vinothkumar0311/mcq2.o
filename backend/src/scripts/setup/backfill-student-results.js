const { TestSession, StudentTestResult, Test, User, LicensedUser, sequelize } = require('./models');

async function backfillStudentResults() {
  const transaction = await sequelize.transaction();
  
  try {
    console.log('🔄 Starting backfill of student test results...');
    
    // Get all completed test sessions that don't have corresponding StudentTestResult entries
    const completedSessions = await TestSession.findAll({
      where: {
        status: ['completed', 'auto-submitted']
      },
      transaction
    });
    
    console.log(`Found ${completedSessions.length} completed sessions`);
    
    let processed = 0;
    let created = 0;
    let updated = 0;
    let errors = 0;
    
    for (const session of completedSessions) {
      try {
        // Get test details
        const test = await Test.findByPk(session.testId, {
          attributes: ['name'],
          transaction
        });
        
        if (!test) {
          console.warn(`Test not found for session ${session.id}`);
          errors++;
          continue;
        }
        
        // Get student details
        let student = await LicensedUser.findByPk(session.studentId, {
          attributes: ['name', 'email', 'department', 'sinNumber'],
          transaction
        });
        
        if (!student) {
          student = await User.findByPk(session.studentId, {
            attributes: ['name', 'email'],
            transaction
          });
        }
        
        if (!student) {
          console.warn(`Student not found for session ${session.id}`);
          errors++;
          continue;
        }
        
        const totalScore = session.totalScore || 0;
        const maxScore = session.maxScore || 100;
        const percentage = maxScore > 0 ? ((totalScore / maxScore) * 100) : 0;
        
        // Check if result already exists
        const existingResult = await StudentTestResult.findOne({
          where: {
            testId: session.testId,
            userEmail: student.email
          },
          transaction
        });
        
        const resultData = {
          testId: session.testId,
          testName: test.name,
          userEmail: student.email,
          studentName: student.name,
          sinNumber: student.sinNumber || 'N/A',
          department: student.department || 'N/A',
          totalScore,
          maxScore,
          percentage: Math.round(percentage * 100) / 100,
          completedAt: session.completedAt || session.updatedAt
        };
        
        if (existingResult) {
          // Update existing result with latest data
          await existingResult.update(resultData, { transaction });
          updated++;
          console.log(`✅ Updated result for ${student.name} (${student.email})`);
        } else {
          // Create new result
          await StudentTestResult.create(resultData, { transaction });
          created++;
          console.log(`✅ Created result for ${student.name} (${student.email})`);
        }
        
        processed++;
      } catch (sessionError) {
        console.error(`Error processing session ${session.id}:`, sessionError.message);
        errors++;
      }
    }
    
    await transaction.commit();
    
    console.log('\n📊 Backfill Summary:');
    console.log(`Total sessions processed: ${processed}`);
    console.log(`New results created: ${created}`);
    console.log(`Existing results updated: ${updated}`);
    console.log(`Errors encountered: ${errors}`);
    console.log('✅ Backfill completed successfully!');
    
  } catch (error) {
    await transaction.rollback();
    console.error('❌ Error during backfill:', error);
    throw error;
  }
}

// Run the backfill if this script is executed directly
if (require.main === module) {
  backfillStudentResults()
    .then(() => {
      console.log('Backfill process completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Backfill process failed:', error);
      process.exit(1);
    });
}

module.exports = { backfillStudentResults };