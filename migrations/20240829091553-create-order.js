"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
 async up(queryInterface, Sequelize) {
  await queryInterface.createTable("order", {
   order_id: {
    allowNull: false,
    primaryKey: true,
    type: Sequelize.STRING,
   },
   user_id: {
    allowNull: false,
    type: Sequelize.STRING,
    references: {
     model: "users",
     key: "user_id",
    },
    onUpdate: "CASCADE",
    onDelete: "SET NULL",
   },
   isp_id: {
    allowNull: false,
    type: Sequelize.STRING,
    references: {
     model: "isp",
     key: "isp_id",
    },
    onUpdate: "CASCADE",
    onDelete: "SET NULL",
   },
   tanggal_mulai: Sequelize.DATE,
   tanggal_berakhir: Sequelize.DATE,
   status: {
    type: Sequelize.ENUM(
     "aktif",
     "non_aktif",
     "kadaluarsa",
     "menunggu_pembayaran"
    ),
    defaultValue: "menunggu_pembayaran",
   },
   created_by: Sequelize.STRING,
   created_at: {
    type: Sequelize.DATE,
    defaultValue: Sequelize.fn("now"),
   },
   updated_by: Sequelize.STRING,
   updated_at: {
    type: Sequelize.DATE,
    defaultValue: Sequelize.fn("now"),
   },
   deleted_by: Sequelize.STRING,
   deleted_at: {
    type: Sequelize.DATE,
   },
  });
 },

 async down(queryInterface, Sequelize) {
  await queryInterface.dropTable("order");
 },
};
