"use strict";
const {Model} = require("sequelize");

module.exports = (sequelize, DataTypes) => {
 class User extends Model {
  static associate(models) {
   this.hasMany(models.Order, {
    foreignKey: "user_id",
    as: "orders",
   });
  }
 }

 User.init(
  {
   user_id: {
    allowNull: false,
    primaryKey: true,
    type: DataTypes.STRING,
   },
   name: DataTypes.STRING,
   nik: {type: DataTypes.BIGINT, unique: true},
   email: {type: DataTypes.STRING, unique: true},
   username: {type: DataTypes.STRING, unique: true},
   password: DataTypes.STRING,
   number: DataTypes.STRING,
   wag: DataTypes.STRING,
   alamat: DataTypes.STRING,
   role: {
    type: DataTypes.ENUM("owner", "admin", "pelanggan"),
    defaultValue: "pelanggan",
   },
   last_signin: DataTypes.DATE,
   created_by: DataTypes.STRING,
   created_at: {
    type: DataTypes.DATE,
    defaultValue: sequelize.fn("now"),
   },
   updated_by: DataTypes.STRING,
   updated_at: {
    type: DataTypes.DATE,
    defaultValue: sequelize.fn("now"),
   },
   deleted_by: DataTypes.STRING,
   deleted_at: {
    type: DataTypes.DATE,
   },
  },
  {
   sequelize,
   modelName: "User",
   tableName: "users",
   timestamps: false,
  }
 );

 return User;
};
