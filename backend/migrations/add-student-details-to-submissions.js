const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('code_submissions', 'student_name', {
      type: DataTypes.STRING,
      allowNull: true
    });
    
    await queryInterface.addColumn('code_submissions', 'student_email', {
      type: DataTypes.STRING,
      allowNull: true
    });
    
    await queryInterface.addColumn('code_submissions', 'student_department', {
      type: DataTypes.STRING,
      allowNull: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('code_submissions', 'student_name');
    await queryInterface.removeColumn('code_submissions', 'student_email');
    await queryInterface.removeColumn('code_submissions', 'student_department');
  }
};