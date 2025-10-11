module.exports = (sequelize, DataTypes) => {
  const StudentTestResult = sequelize.define('StudentTestResult', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    testId: {
      type: DataTypes.STRING,
      allowNull: false
    },
    testName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    userEmail: {
      type: DataTypes.STRING,
      allowNull: false
    },
    studentName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    sinNumber: {
      type: DataTypes.STRING,
      allowNull: true
    },
    department: {
      type: DataTypes.STRING,
      allowNull: true
    },
    totalScore: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    maxScore: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 100
    },
    percentage: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: false
    },
    answers: {
      type: DataTypes.JSON,
      allowNull: true
    },
    sessionId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    downloadUrl: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    tableName: 'student_test_results',
    timestamps: true,
    underscored: true
  });

  return StudentTestResult;
};