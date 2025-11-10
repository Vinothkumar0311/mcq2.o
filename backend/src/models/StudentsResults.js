module.exports = (sequelize, DataTypes) => {
  const StudentsResults = sequelize.define('StudentsResults', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    testId: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'test_id'
    },
    testName: {
      type: DataTypes.STRING(200),
      allowNull: false,
      field: 'test_name'
    },
    userEmail: {
      type: DataTypes.STRING(150),
      allowNull: false,
      field: 'user_email',
      validate: {
        isEmail: true
      }
    },
    studentName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'student_name'
    },
    department: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    sinNumber: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'sin_number'
    },
    totalScore: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'total_score'
    },
    maxScore: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'max_score'
    },
    percentage: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'completed_at'
    },
    date: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    answers: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    sessionId: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      field: 'session_id'
    },
    resultsReleased: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'results_released',
      comment: 'Whether admin has released results for viewing'
    }
  }, {
    tableName: 'students_results',
    timestamps: true,
    underscored: true
  });

  return StudentsResults;
};