"use strict";
const {Model} = require("sequelize");
module.exports = (sequelize, DataTypes) => {
 class Transaksi extends Model {
  static associate(models) {
   this.belongsTo(models.Order, {
    foreignKey: "order_id",
    as: "order",
   });
  }
 }

 Transaksi.init(
  {
   transaksi_id: {
    allowNull: false,
    primaryKey: true,
    type: DataTypes.STRING,
   },
   order_id: {
    allowNull: false,
    type: DataTypes.STRING,
   },
   jumlah: DataTypes.INTEGER,
   status: DataTypes.STRING,
   midtrans_id: DataTypes.STRING,
   payment_type: DataTypes.STRING,
   transaction_time: DataTypes.STRING,
   snap_token: DataTypes.STRING,
   redirect_url: DataTypes.STRING,
   midtrans_response: DataTypes.JSON,
   created_at: {
    type: DataTypes.DATE,
    defaultValue: sequelize.fn("now"),
   },
  },
  {
   sequelize,
   modelName: "Transaksi",
   tableName: "transaksi",
   timestamps: false,
  }
 );

 return Transaksi;
};
