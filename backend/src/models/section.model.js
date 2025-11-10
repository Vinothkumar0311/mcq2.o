module.exports = (sequelize, DataTypes) => {
  const Section = sequelize.define("Section", {
    name: DataTypes.STRING,
    duration: DataTypes.INTEGER,
    type: DataTypes.STRING,
    correctMarks: DataTypes.INTEGER,
    instructions: DataTypes.TEXT,
    testId: {
      type: DataTypes.STRING,
      allowNull: false,
    },

  });

  return Section;
};
