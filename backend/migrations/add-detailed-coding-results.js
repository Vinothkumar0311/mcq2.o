const { sequelize } = require('../models');

async function addDetailedCodingResults() {
  try {
    console.log('🔧 Adding detailed_coding_results column to section_submissions table...');
    
    // Check if column exists first
    const [results] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'section_submissions' 
      AND COLUMN_NAME = 'detailed_coding_results'
    `);
    
    if (results.length === 0) {
      await sequelize.query(`
        ALTER TABLE section_submissions 
        ADD COLUMN detailed_coding_results JSON NULL
      `);
      console.log('✅ Added detailed_coding_results column');
    } else {
      console.log('✅ Column already exists');
    }
    
  } catch (error) {
    if (error.message.includes('Duplicate column name')) {
      console.log('✅ Column already exists');
    } else {
      console.error('❌ Error:', error.message);
      throw error;
    }
  }
}

if (require.main === module) {
  addDetailedCodingResults()
    .then(() => {
      console.log('✅ Migration completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
}

module.exports = addDetailedCodingResults;