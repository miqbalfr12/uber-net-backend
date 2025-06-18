"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
 async up(queryInterface, Sequelize) {
  await queryInterface.bulkInsert("isp", [
   {
    isp_id: "ISP001",
    kode: "PKT5",
    speed: "5 Mbps",
    harga: 150000,
    deskripsi: "Paket internet 5 Mbps cocok untuk 1-2 perangkat ringan.",
    created_by: "system",
    created_at: new Date(),
    updated_at: new Date(),
   },
   {
    isp_id: "ISP002",
    kode: "PKT10",
    speed: "10 Mbps",
    harga: 200000,
    deskripsi: "Paket internet 10 Mbps cocok untuk 2-4 perangkat sedang.",
    created_by: "system",
    created_at: new Date(),
    updated_at: new Date(),
   },
   {
    isp_id: "ISP003",
    kode: "PKT20",
    speed: "20 Mbps",
    harga: 250000,
    deskripsi: "Paket internet 20 Mbps cocok untuk streaming HD dan kerja tim.",
    created_by: "system",
    created_at: new Date(),
    updated_at: new Date(),
   },
   {
    isp_id: "ISP004",
    kode: "PKT30",
    speed: "30 Mbps",
    harga: 300000,
    deskripsi: "Paket internet 30 Mbps cocok untuk keluarga atau usaha kecil.",
    created_by: "system",
    created_at: new Date(),
    updated_at: new Date(),
   },
  ]);
 },

 async down(queryInterface, Sequelize) {
  await queryInterface.bulkDelete("transaksi", null, {});
  await queryInterface.bulkDelete("order", null, {});
  await queryInterface.bulkDelete("users", null, {});
  await queryInterface.bulkDelete("isp", {
   isp_id: {
    [Sequelize.Op.in]: ["ISP001", "ISP002", "ISP003", "ISP004"],
   },
  });
 },
};
