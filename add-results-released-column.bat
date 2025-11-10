@echo off
echo Adding results_released column to database...

cd backend

node -e "
const { sequelize } = require('./src/models');
const migration = require('./src/migrations/add-results-released-column.js');

async function runMigration() {
  try {
    console.log('🔄 Running migration to add results_released column...');
    await migration.up(sequelize.getQueryInterface(), sequelize.constructor);
    console.log('✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration();
"

echo Migration completed!
pause