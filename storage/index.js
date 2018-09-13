module.exports = {
  Dynamodb: require('./dynamodbStorage'),
  File: require('./fileStorage'),
  Memory: require('./memoryStorage'),
  Sequelize: require('./sequelizeStorage')
}
