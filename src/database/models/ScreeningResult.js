module.exports = (sequelize, DataTypes) => {
  const ScreeningResult = sequelize.define(
    'ScreeningResult',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      userNumber: {
        type: DataTypes.STRING,
        allowNull: false,
        index: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      age: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      gender: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      answers: {
        type: DataTypes.JSON,
        allowNull: false,
      },
      score: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      riskLevel: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'low',
      },
      recommendation: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      followedUp: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      tableName: 'screening_results',
      timestamps: true,
    },
  );

  return ScreeningResult;
};
