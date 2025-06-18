"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
 async up(queryInterface, Sequelize) {
  await queryInterface.createTable("users", {
   user_id: {
    allowNull: false,
    primaryKey: true,
    type: Sequelize.STRING,
   },
   name: Sequelize.STRING,
   nik: {
    type: Sequelize.BIGINT,
    unique: true,
   },
   email: {
    type: Sequelize.STRING,
    unique: true,
   },
   username: {
    type: Sequelize.STRING,
    unique: true,
   },
   password: Sequelize.STRING,
   number: Sequelize.STRING,
   wag: Sequelize.STRING,
   alamat: Sequelize.STRING,
   role: {
    type: Sequelize.ENUM("owner", "admin", "pelanggan"),
    defaultValue: "pelanggan",
   },
   last_signin: Sequelize.DATE,
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
  await queryInterface.dropTable("users");
 },
};
