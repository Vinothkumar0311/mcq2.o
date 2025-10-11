'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableDescription = await queryInterface.describeTable('students_results');
    
    // Add test_id column if missing
    if (!tableDescription.test_id) {
      await queryInterface.addColumn('students_results', 'test_id', {
        type: Sequelize.STRING(100),
        allowNull: false,
        defaultValue: '',
        after: 'id'
      });
      
      await queryInterface.addIndex('students_results', ['test_id'], {
        name: 'idx_students_results_test_id'
      });
    }
    
    // Add test_name column if missing
    if (!tableDescription.test_name) {
      await queryInterface.addColumn('students_results', 'test_name', {
        type: Sequelize.STRING(200),
        allowNull: false,
        defaultValue: '',
        after: 'test_id'
      });
      
      await queryInterface.addIndex('students_results', ['test_name'], {
        name: 'idx_students_results_test_name'
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    const tableDescription = await queryInterface.describeTable('students_results');
    
    // Remove test_name column and index
    if (tableDescription.test_name) {
      try {
        await queryInterface.removeIndex('students_results', 'idx_students_results_test_name');
      } catch (error) {
        console.log('test_name index may not exist:', error.message);
      }
      await queryInterface.removeColumn('students_results', 'test_name');
    }
    
    // Remove test_id column and index
    if (tableDescription.test_id) {
      try {
        await queryInterface.removeIndex('students_results', 'idx_students_results_test_id');
      } catch (error) {
        console.log('test_id index may not exist:', error.message);
      }
      await queryInterface.removeColumn('students_results', 'test_id');
    }
  }
};