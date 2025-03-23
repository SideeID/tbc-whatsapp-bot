module.exports = (sequelize, DataTypes) => {
  const QueuedUser = sequelize.define(
    'QueuedUser',
    {
      number: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true,
      },
      queueTime: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      queuePosition: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
    },
    {
      tableName: 'queued_users',
      timestamps: true,
    },
  );

  return QueuedUser;
};
