const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Add section timing fields to test_sessions table
      await queryInterface.addColumn('test_sessions', 'section_start_time', {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'When current section started'
      });

      await queryInterface.addColumn('test_sessions', 'section_end_time', {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'When current section should end'
      });

      await queryInterface.addColumn('test_sessions', 'completed_sections', {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: '[]',
        comment: 'Array of completed section indices'
      });

      // Add auto_submitted field to section_submissions table if it doesn't exist
      try {
        await queryInterface.addColumn('section_submissions', 'auto_submitted', {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
          comment: 'Whether section was auto-submitted due to timeout'
        });
      } catch (error) {
        console.log('auto_submitted column may already exist:', error.message);
      }

      console.log('✅ Section timing fields added successfully');
    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.removeColumn('test_sessions', 'section_start_time');
      await queryInterface.removeColumn('test_sessions', 'section_end_time');
      await queryInterface.removeColumn('test_sessions', 'completed_sections');
      
      try {
        await queryInterface.removeColumn('section_submissions', 'auto_submitted');
      } catch (error) {
        console.log('auto_submitted column removal failed:', error.message);
      }

      console.log('✅ Section timing fields removed successfully');
    } catch (error) {
      console.error('❌ Rollback failed:', error);
      throw error;
    }
  }
};