module.exports = (sequelize, DataTypes) => {
  const TestSession = sequelize.define("TestSession", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    studentId: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'student_id',
      comment: 'Can be integer (User.id) or UUID (LicensedUser.id)'
    },
    studentType: { // Add this new field
      type: DataTypes.STRING,
      allowNull: false,
      field: 'student_type'
    },
    testId: {
      type: DataTypes.STRING,
      allowNull: false
    },
    currentSectionIndex: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    sectionStartTime: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When current section started'
    },
    sectionEndTime: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When current section should end'
    },
    completedSections: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
      comment: 'Array of completed section indices'
    },
    status: {
      type: DataTypes.ENUM('not_started', 'in_progress', 'on_break', 'completed', 'submitted', 'auto-submitted'),
      allowNull: false,
      defaultValue: 'not_started'
    },
    sectionSubmissions: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: []
    },
    breakStartTime: {
      type: DataTypes.DATE,
      allowNull: true
    },
    breakEndTime: {
      type: DataTypes.DATE,
      allowNull: true
    },
    startedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    completedAt: {
      type: DataTypes.DATE,
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
      defaultValue: 0
    },
    resultsReleased: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Whether admin has released results for viewing'
    }
  }, {
    tableName: 'test_sessions',
    underscored: true,
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['student_id', 'test_id'],
        name: 'unique_student_test_session'
      },
      {
        fields: ['student_id'],
        name: 'idx_test_sessions_student_id'
      },
      {
        fields: ['test_id'],
        name: 'idx_test_sessions_test_id'
      },
      {
        fields: ['status'],
        name: 'idx_test_sessions_status'
      }
    ]
  });

  return TestSession;
};