const { sequelize } = require('../models');

async function addUserColumns() {
  try {
    console.log('🔧 Adding SIN number and department columns to users table...');
    
    await sequelize.query(`
      ALTER TABLE users 
      ADD COLUMN sin_number VARCHAR(50) NULL,
      ADD COLUMN department VARCHAR(100) NULL
    `);
    console.log('✅ Added user columns successfully');
    
  } catch (error) {
    if (error.message.includes('Duplicate column name')) {
      console.log('✅ Columns already exist');
    } else {
      console.error('❌ Error:', error.message);
    }
  }
}

if (require.main === module) {
  addUserColumns().then(() => process.exit(0));
}

module.exports = addUserColumns;