"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
 async up(queryInterface, Sequelize) {
  await queryInterface.createTable("transaksi", {
   transaksi_id: {
    allowNull: false,
    primaryKey: true,
    type: Sequelize.STRING,
   },
   order_id: {
    allowNull: false,
    type: Sequelize.STRING,
    references: {
     model: "order",
     key: "order_id",
    },
    onUpdate: "CASCADE",
    onDelete: "SET NULL",
   },
   jumlah: Sequelize.INTEGER,
   status: Sequelize.STRING,
   midtrans_id: Sequelize.STRING,
   snap_token: Sequelize.STRING,
   redirect_url: Sequelize.STRING,
   payment_type: Sequelize.STRING,
   transaction_time: Sequelize.STRING,
   midtrans_response: Sequelize.JSON,
   created_at: {
    type: Sequelize.DATE,
    defaultValue: Sequelize.fn("now"),
   },
  });
 },

 async down(queryInterface, Sequelize) {
  await queryInterface.dropTable("transaksi");
 },
};
