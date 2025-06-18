"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
 async up(queryInterface, Sequelize) {
  await queryInterface.bulkInsert("users", [
   {
    user_id: "OWN001",
    name: "Owner Uber Net",
    email: "owner@example.com",
    username: "owner",
    password: "$2b$10$t2rBaetbFeEBE1UkNG20v.5hZaPL0fuQksKsMGY/GfHk5SMxxP9H2", // pastikan ini hash bcrypt
    number: "081234567890",
    alamat: "Jl. Contoh No. 123",
    role: "owner",
    created_by: "system",
    nik: "3201234567890001",
    created_at: new Date(),
    updated_at: new Date(),
   },
   {
    user_id: "ADM002",
    name: "Admin 1",
    email: "admin1@example.com",
    username: "admin1",
    password: "$2b$10$t2rBaetbFeEBE1UkNG20v.5hZaPL0fuQksKsMGY/GfHk5SMxxP9H2",
    number: "082233445566",
    alamat: "Desa Sample RT 01 RW 02",
    role: "admin",
    created_by: "system",
    nik: "3201234567890002",
    created_at: new Date(),
    updated_at: new Date(),
   },
  ]);
 },

 async down(queryInterface, Sequelize) {
  await queryInterface.bulkDelete("users", {
   user_id: {[Sequelize.Op.in]: ["OWN001", "ADM002"]},
  });
 },
};
