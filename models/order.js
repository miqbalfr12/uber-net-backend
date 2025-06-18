"use strict";
const {Model} = require("sequelize");
module.exports = (sequelize, DataTypes) => {
 class Order extends Model {
  static associate(models) {
   this.belongsTo(models.User, {
    foreignKey: "user_id",
    as: "pelanggan",
   });
   this.belongsTo(models.ISP, {
    foreignKey: "isp_id",
    as: "paket",
   });
   this.hasMany(models.Transaksi, {
    foreignKey: "order_id",
    as: "transaksi",
   });
  }
 }

 Order.init(
  {
   order_id: {
    allowNull: false,
    primaryKey: true,
    type: DataTypes.STRING,
   },
   user_id: {
    allowNull: false,
    type: DataTypes.STRING,
   },
   isp_id: {
    allowNull: false,
    type: DataTypes.STRING,
   },
   tanggal_mulai: DataTypes.DATE,
   tanggal_berakhir: DataTypes.DATE,
   status: {
    type: DataTypes.ENUM(
     "aktif",
     "non_aktif",
     "kadaluarsa",
     "menunggu_pembayaran"
    ),
    defaultValue: "menunggu_pembayaran",
   },
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
   modelName: "Order",
   tableName: "order",
   timestamps: false,
  }
 );

 return Order;
};
