const { sequelize } = require('../../models');

async function addMissingColumns() {
  try {
    console.log('🔄 Adding missing section timing columns...');
    
    // Add section_end_time column
    try {
      await sequelize.query(`
        ALTER TABLE test_sessions 
        ADD COLUMN section_end_time DATETIME NULL 
        COMMENT 'When current section should end'
      `);
      console.log('✅ Added section_end_time column');
    } catch (error) {
      if (error.original?.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️ section_end_time column already exists');
      } else {
        throw error;
      }
    }
    
    // Add completed_sections column
    try {
      await sequelize.query(`
        ALTER TABLE test_sessions 
        ADD COLUMN completed_sections JSON NULL 
        COMMENT 'Array of completed section indices'
      `);
      console.log('✅ Added completed_sections column');
    } catch (error) {
      if (error.original?.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️ completed_sections column already exists');
      } else {
        throw error;
      }
    }
    
    // Add auto_submitted column to section_submissions table
    try {
      await sequelize.query(`
        ALTER TABLE section_submissions 
        ADD COLUMN auto_submitted BOOLEAN NOT NULL DEFAULT FALSE 
        COMMENT 'Whether section was auto-submitted due to timeout'
      `);
      console.log('✅ Added auto_submitted column to section_submissions');
    } catch (error) {
      if (error.original?.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️ auto_submitted column already exists in section_submissions');
      } else {
        throw error;
      }
    }
    
    console.log('✅ All missing columns added successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding columns:', error);
    process.exit(1);
  }
}

addMissingColumns();