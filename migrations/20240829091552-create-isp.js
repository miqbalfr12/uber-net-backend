"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
 async up(queryInterface, Sequelize) {
  await queryInterface.createTable("isp", {
   isp_id: {
    allowNull: false,
    primaryKey: true,
    type: Sequelize.STRING,
   },
   kode: {
    type: Sequelize.STRING,
    unique: true,
   },
   speed: Sequelize.STRING,
   harga: Sequelize.INTEGER,
   deskripsi: Sequelize.TEXT,
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
  await queryInterface.dropTable("isp");
 },
};
