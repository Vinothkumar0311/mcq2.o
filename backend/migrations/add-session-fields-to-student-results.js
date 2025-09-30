const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Add sessionId column
      await queryInterface.addColumn('student_test_results', 'session_id', {
        type: DataTypes.INTEGER,
        allowNull: true
      });

      // Add downloadUrl column
      await queryInterface.addColumn('student_test_results', 'download_url', {
        type: DataTypes.STRING,
        allowNull: true
      });

      console.log('✅ Added sessionId and downloadUrl columns to student_test_results');
    } catch (error) {
      console.error('❌ Error adding columns to student_test_results:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.removeColumn('student_test_results', 'session_id');
      await queryInterface.removeColumn('student_test_results', 'download_url');
      console.log('✅ Removed sessionId and downloadUrl columns from student_test_results');
    } catch (error) {
      console.error('❌ Error removing columns from student_test_results:', error);
      throw error;
    }
  }
};