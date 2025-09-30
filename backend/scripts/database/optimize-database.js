const { sequelize } = require('../models');

async function optimizeDatabase() {
  try {
    console.log('🔧 Starting database optimization...');

    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_test_sessions_student_test ON test_sessions(student_id, test_id)',
      'CREATE INDEX IF NOT EXISTS idx_test_sessions_status ON test_sessions(status)',
      'CREATE INDEX IF NOT EXISTS idx_test_assignments_test ON test_assignments(test_id)',
      'CREATE INDEX IF NOT EXISTS idx_section_scores_session ON section_scores(test_session_id)',
      'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)',
      'CREATE INDEX IF NOT EXISTS idx_licensed_users_email ON license_user(email)'
    ];

    for (const indexQuery of indexes) {
      try {
        await sequelize.query(indexQuery);
        console.log('✅ Created index:', indexQuery.split('idx_')[1]?.split(' ')[0]);
      } catch (error) {
        if (!error.message.includes('already exists')) {
          console.warn('⚠️ Index creation warning:', error.message);
        }
      }
    }

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const [deletedSessions] = await sequelize.query(`
      DELETE FROM test_sessions 
      WHERE created_at < ? AND status NOT IN ('completed', 'submitted')
    `, { replacements: [sixMonthsAgo] });
    
    console.log(`✅ Cleaned up ${deletedSessions.affectedRows || 0} old test sessions`);
    console.log('🎉 Database optimization completed successfully!');
    
  } catch (error) {
    console.error('❌ Database optimization failed:', error);
    throw error;
  }
}

if (require.main === module) {
  optimizeDatabase().then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = optimizeDatabase;