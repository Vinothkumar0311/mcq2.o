const { sequelize } = require('../models');

async function addUnansweredQuestionsTracking() {
  try {
    console.log('🔧 Adding unanswered questions tracking to section_scores table...');
    
    // Add new columns to section_scores table
    await sequelize.query(`
      ALTER TABLE section_scores 
      ADD COLUMN IF NOT EXISTS marks_obtained DECIMAL(5,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending',
      ADD COLUMN IF NOT EXISTS submitted_at DATETIME NULL,
      ADD COLUMN IF NOT EXISTS answers JSON NULL,
      ADD COLUMN IF NOT EXISTS unanswered_questions JSON NULL
    `);
    
    console.log('✅ Added unanswered questions tracking columns');
    
  } catch (error) {
    if (error.message.includes('Duplicate column name')) {
      console.log('✅ Columns already exist');
    } else {
      console.error('❌ Error:', error.message);
      throw error;
    }
  }
}

if (require.main === module) {
  addUnansweredQuestionsTracking()
    .then(() => {
      console.log('✅ Migration completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
}

module.exports = addUnansweredQuestionsTracking;