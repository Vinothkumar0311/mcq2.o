const { TestSession, Test } = require('../models');

/**
 * Clean up invalid test sessions from the database
 */
async function cleanupInvalidTestSessions() {
  try {
    console.log('🧹 Starting cleanup of invalid test sessions...');
    
    // Find test sessions with invalid or missing test names
    const invalidSessions = await TestSession.findAll({
      include: [{
        model: Test,
        as: 'test',
        attributes: ['name']
      }],
      where: {
        // Add conditions for invalid sessions if needed
      }
    });
    
    let cleanedCount = 0;
    
    for (const session of invalidSessions) {
      // Check if test name is invalid
      if (!session.test || 
          !session.test.name || 
          session.test.name.trim() === '' || 
          session.test.name === 'dfdf' ||
          (session.totalScore === 0 && session.maxScore === 0 && session.status === 'completed')) {
        
        console.log(`🗑️  Removing invalid test session: ${session.id} - Test: "${session.test?.name || 'N/A'}"`);
        
        // Uncomment the line below to actually delete the sessions
        // await session.destroy();
        cleanedCount++;
      }
    }
    
    console.log(`✅ Cleanup completed. Found ${cleanedCount} invalid sessions.`);
    console.log('💡 To actually delete them, uncomment the destroy() line in the script.');
    
    return cleanedCount;
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  }
}

// Run the cleanup if this script is executed directly
if (require.main === module) {
  cleanupInvalidTestSessions()
    .then((count) => {
      console.log(`🎉 Cleanup process finished. ${count} invalid sessions identified.`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Cleanup failed:', error);
      process.exit(1);
    });
}

module.exports = { cleanupInvalidTestSessions };