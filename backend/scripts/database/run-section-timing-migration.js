const { sequelize } = require('../../models');
const migration = require('../../migrations/add-section-timing-fields');

async function runMigration() {
  try {
    console.log('🔄 Running section timing migration...');
    
    await migration.up(sequelize.getQueryInterface(), sequelize.constructor);
    
    console.log('✅ Section timing migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();