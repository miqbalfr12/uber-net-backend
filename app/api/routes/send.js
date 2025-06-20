const express = require("express");
const router = express.Router();
const {isLoginUser} = require("../../middleware/auth");
const {User, Order, ISP, Transaksi} = require("../../../models");
const {Op, where} = require("sequelize");

router.post("/group", isLoginUser, async (req, res) => {
 console.log(req.body);
 await fetch("http://localhost:3002/send-group", {
  method: "POST",
  body: JSON.stringify({
   number: req.body.number,
   message: `*Personal Announcement*\n\n${req.body.message}\n\n_Uber net (${req.user.user_id})_ `,
  }),
  headers: {
   "Content-Type": "application/json",
  },
 }).catch((err) => console.log(err));
 res.status(200).json({
  message: "success",
 });
});

router.post("/tagihan", isLoginUser, async (req, res) => {
 if (req.body?.order_id) {
  try {
   await fetch("http://localhost:3002/send-group", {
    method: "POST",
    body: JSON.stringify({
     number: req.body.pelanggan.wag,
     message: `*Pemberitahuan Tagihan* (${req.body.order_id})\n\nAtas nama: ${
      req.body.pelanggan.name
     }\nLayanan: ${req.body.detailPaket.speed}\nNominal: Rp ${parseInt(
      req.body.detailPaket.harga
     ).toLocaleString("id-ID")}\nTanggal Mulai: ${
      req.body.tanggal_mulai.split("T")[0]
     }\nTanggal Berakhir: ${
      req.body.tanggal_berakhir.split("T")[0]
     }\n\nStatus: ${req.body.status}${
      req.body.status === "menunggu_pembayaran"
       ? `\n\nSilahkan lakukan pembayaran diwebsite resmi kami!`
       : ""
     }\n\n_Uber net (${req.user.user_id})_ `,
    }),
    headers: {
     "Content-Type": "application/json",
    },
   })
    .then(() =>
     res.status(200).json({
      message: "Sending Message",
     })
    )
    .catch((err) => console.log(err));
  } catch (error) {
   console.log(error);
   return res.status(500).json({message: error.message});
  }
 } else {
  try {
   const userData = await User.findAll({
    where: {
     // user have wag
     role: "pelanggan",
     wag: {
      [Op.and]: [
       {[Op.ne]: null}, // bukan null
       {[Op.ne]: ""}, // bukan string kosong
      ],
     },
    },
    include: [
     {
      model: Order,
      as: "orders",
      separate: true,
      order: [["created_at", "DESC"]], // atau "tanggal_mulai" jika kamu pakai itu,
      include: [
       {
        model: ISP,
        as: "paket", // ini sesuai alias yang kamu pakai di associate Order.js
       },
      ],
     },
    ],
   });

   const dataBlash = userData.map((user) => {
    console.log(user.name);
    console.log(user.orders[0].status === "menunggu_pembayaran");
    if (user.orders[0].status === "menunggu_pembayaran") {
     console.log(user.orders[0]);
     return {
      number: user.wag,
      message: `*Pemberitahuan Tagihan* (${
       user.orders[0].order_id
      })\n\nAtas nama: ${user.name}\nLayanan: ${
       user.orders[0].paket.speed
      }\nNominal: Rp ${parseInt(user.orders[0].paket.harga).toLocaleString(
       "id-ID"
      )}\nTanggal Mulai: ${user.orders[0].tanggal_mulai}\nTanggal Berakhir: ${
       user.orders[0].tanggal_berakhir
      }\n\nStatus: ${user.orders[0].status}${
       user.orders[0].status === "menunggu_pembayaran"
        ? `\n\nSilahkan lakukan pembayaran diwebsite resmi kami!`
        : ""
      }\n\n_Uber net (${req.user.user_id})_ `,
     };
    }
   });

   console.log({dataBlash});

   await fetch("http://localhost:3002/send-group", {
    method: "POST",
    body: JSON.stringify(dataBlash),
    headers: {
     "Content-Type": "application/json",
    },
   })
    .then(() =>
     res.status(200).json({
      message: "Sending Message",
     })
    )
    .catch((err) => console.log(err));
  } catch (error) {
   console.log(error);
   return res.status(500).json({message: error.message});
  }
 }
});
router.post("/pelanggan", isLoginUser, async (req, res) => {
 console.log(req.body);
 try {
  const userData = await User.findAll({
   where: {
    // user have wag
    role: "pelanggan",
    wag: {
     [Op.and]: [
      {[Op.ne]: null}, // bukan null
      {[Op.ne]: ""}, // bukan string kosong
     ],
    },
   },
  });

  const dataBlash = userData.map((user) => {
   return {
    number: user.wag,
    message: `*Personal Announcement*\n\n${req.body.message}\n\n_Uber net (${req.user.user_id})_ `,
   };
  });

  await fetch("http://localhost:3002/send-group", {
   method: "POST",
   body: JSON.stringify(dataBlash),
   headers: {
    "Content-Type": "application/json",
   },
  })
   .then(() =>
    res.status(200).json({
     message: "Sending Message",
    })
   )
   .catch((err) => console.log(err));
 } catch (error) {
  console.log(error);
  return res.status(500).json({message: error.message});
 }
});

module.exports = router;
