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
   const tanggalMulai = new Date(req.body.tanggal_mulai);
   const tanggalBerakhir = new Date(req.body.tanggal_berakhir);
   const bulanTagihan = tanggalMulai.toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
   });
   const tanggalAkhirStr = tanggalBerakhir.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
   });
   const harga = parseInt(req.body.detailPaket.harga);
   const formattedHarga = harga.toLocaleString("id-ID");

   const message = `Hallo! Rekan UBER NET

PELANGGAN
Yth. Bpk/Ibu
${req.body.pelanggan.name}

PEMBERITAHUAN
Tagihan Bulan : ${bulanTagihan}
Jenis Paket : ${req.body.detailPaket.speed}
Biaya Paket : Rp. ${formattedHarga}
PPN 0% : Rp. 0
Diskon : Rp. 0
Besar Tagihan : Rp. ${formattedHarga}

Masa aktif s/d ${tanggalAkhirStr}

Ket : ${req.body.status === "lunas" ? "LUNAS ✅" : "BELUM LUNAS ❌"}

INFO PEMBAYARAN TRANSFER
Rekening Pembayaran :
BCA        : 4460609823
Dana      : 082317400606
a/n Danih Jian Hidayat

Uber net (${req.user.user_id})`;

   console.log(message);

   await fetch("http://localhost:3002/send-group", {
    method: "POST",
    body: JSON.stringify({
     number: req.body.pelanggan.wag,
     message: message,
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
     const order = user.orders[0];
     const tanggalMulai = new Date(order.tanggal_mulai);
     const tanggalBerakhir = new Date(order.tanggal_berakhir);
     const bulanTagihan = tanggalMulai.toLocaleDateString("id-ID", {
      month: "long",
      year: "numeric",
     });
     const tanggalAkhirStr = tanggalBerakhir.toISOString().split("T")[0];
     const harga = parseInt(order.paket.harga);
     const formattedHarga = harga.toLocaleString("id-ID");

     const message = `Hallo! Rekan UBER NET\n\nPELANGGAN\nYth. Bpk/Ibu\n${
      user.name
     }\n\nPEMBERITAHUAN\nTagihan Bulan : ${bulanTagihan}
Jenis Paket : ${order.paket.speed}
Biaya Paket : Rp. ${formattedHarga}
PPN 0% : Rp. 0
Diskon : Rp. 0
Besar Tagihan : Rp. ${formattedHarga}

Masa aktif s/d ${tanggalAkhirStr}

Ket : ${
      order.status === "lunas"
       ? "LUNAS ✅"
       : order.status === "kadaluarsa"
       ? "KADALUARSA ❌"
       : "MENUNGGU PEMBAYARAN"
     }

INFO PEMBAYARAN TRANSFER
Rekening Pembayaran :
BCA        : 4460609823
Dana      : 082317400606
a/n Danih Jian Hidayat

Uber net (${req.user.user_id})`;
     return {
      number: user.wag,
      message: message,
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
