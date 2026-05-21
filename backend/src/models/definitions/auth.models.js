const defineUser = require('./entities/user.model');
const defineRole = require('./entities/role.model');
const defineUserRole = require('./entities/user-role.model');

module.exports = (sequelize, DataTypes) => ({
  User: defineUser(sequelize, DataTypes),
  Role: defineRole(sequelize, DataTypes),
  UserRole: defineUserRole(sequelize, DataTypes),
});
