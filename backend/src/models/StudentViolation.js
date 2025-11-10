module.exports = (sequelize, DataTypes) => {
  const StudentViolation = sequelize.define('StudentViolation', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    studentId: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'student_id'
    },
    testId: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'test_id'
    },
    violationType: {
      type: DataTypes.ENUM('Time', 'Plagiarism', 'TabSwitch', 'CopyPaste', 'Technical', 'Cheating'),
      allowNull: false,
      field: 'violation_type'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    severity: {
      type: DataTypes.ENUM('Low', 'Medium', 'High', 'Critical'),
      defaultValue: 'Medium'
    },
    status: {
      type: DataTypes.ENUM('Active', 'Blocked', 'Reviewed', 'Cleared'),
      defaultValue: 'Active'
    },
    evidence: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    adminNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'admin_notes'
    }
  }, {
    tableName: 'student_violations',
    underscored: true,
    timestamps: true,
    indexes: [
      {
        fields: ['student_id']
      },
      {
        fields: ['test_id']
      },
      {
        fields: ['status']
      },
      {
        fields: ['violation_type']
      }
    ]
  });

  StudentViolation.associate = (models) => {
    StudentViolation.belongsTo(models.User, { 
      foreignKey: 'studentId', 
      as: 'student',
      constraints: false
    });
    StudentViolation.belongsTo(models.LicensedUser, { 
      foreignKey: 'studentId', 
      as: 'licensedStudent',
      constraints: false
    });
  };

  return StudentViolation;
};