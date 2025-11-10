const { sequelize } = require('./backend/src/models');

async function addResultsReleasedColumns() {
  try {
    console.log('🔧 Adding resultsReleased columns to database...\n');

    // Add resultsReleased column to test_sessions table
    await sequelize.query(`
      ALTER TABLE test_sessions 
      ADD COLUMN results_released BOOLEAN NOT NULL DEFAULT FALSE 
      COMMENT 'Whether admin has released results for viewing'
    `);
    console.log('✅ Added results_released column to test_sessions');

    // Add resultsReleased column to students_results table
    await sequelize.query(`
      ALTER TABLE students_results 
      ADD COLUMN results_released BOOLEAN NOT NULL DEFAULT FALSE 
      COMMENT 'Whether admin has released results for viewing'
    `);
    console.log('✅ Added results_released column to students_results');

    // Add indexes for better performance
    await sequelize.query(`ALTER TABLE test_sessions ADD INDEX idx_results_released (results_released)`);
    await sequelize.query(`ALTER TABLE students_results ADD INDEX idx_results_released (results_released)`);
    console.log('✅ Added performance indexes');

    console.log('\n🎉 Database migration completed successfully!');
    
  } catch (error) {
    if (error.message.includes('Duplicate column name')) {
      console.log('ℹ️  Columns already exist, skipping migration');
    } else {
      console.error('❌ Migration failed:', error.message);
    }
  } finally {
    await sequelize.close();
  }
}

addResultsReleasedColumns();