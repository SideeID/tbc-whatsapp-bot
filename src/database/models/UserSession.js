module.exports = (sequelize, DataTypes) => {
  const UserSession = sequelize.define(
    'UserSession',
    {
      number: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true,
      },
      state: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'welcome',
      },
      lastActivity: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      data: {
        type: DataTypes.JSON,
        allowNull: true,
      },
    },
    {
      tableName: 'user_sessions',
      timestamps: true,
    },
  );

  return UserSession;
};
