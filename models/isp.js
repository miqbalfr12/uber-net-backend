"use strict";
const {Model} = require("sequelize");

module.exports = (sequelize, DataTypes) => {
 class ISP extends Model {
  static associate(models) {
   this.hasMany(models.Order, {
    foreignKey: "isp_id",
    as: "orders",
   });
  }
 }

 ISP.init(
  {
   isp_id: {
    allowNull: false,
    primaryKey: true,
    type: DataTypes.STRING,
   },
   kode: {type: DataTypes.STRING, unique: true},
   speed: DataTypes.STRING,
   harga: DataTypes.INTEGER,
   deskripsi: DataTypes.TEXT,
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
   modelName: "ISP",
   tableName: "isp",
   timestamps: false,
  }
 );

 return ISP;
};
