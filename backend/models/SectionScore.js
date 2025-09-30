module.exports = (sequelize, DataTypes) => {
  const SectionScore = sequelize.define('SectionScore', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    testSessionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'test_sessions',
        key: 'id'
      }
    },
    sectionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'sections',
        key: 'id'
      }
    },
    sectionIndex: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    sectionName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    score: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    maxScore: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    percentage: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0
    },
    marksObtained: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'pending'
    },
    submittedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    answers: {
      type: DataTypes.JSON,
      allowNull: true
    },
    unansweredQuestions: {
      type: DataTypes.JSON,
      allowNull: true
    }
  }, {
    tableName: 'section_scores',
    timestamps: true,
    underscored: true
  });

  return SectionScore;
};