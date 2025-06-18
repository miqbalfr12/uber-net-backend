const express = require("express");
const router = express.Router();
const {isLoginUser} = require("../../middleware/auth");
const {User, Order, ISP, Transaksi} = require("../../../models");
const {Op} = require("sequelize");

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

  res.status(200).json({
   message: "Sending Message",
  });

  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  for (let i = 0; i < userData.length; i++) {
   const user = userData[i];

   await fetch("http://localhost:3002/send-group", {
    method: "POST",
    body: JSON.stringify({
     number: user.wag,
     message: `*Blast Announcement*\n\n${req.body.message}\n\n_Uber net (${req.user.user_id})_`,
    }),
    headers: {
     "Content-Type": "application/json",
    },
   }).catch((err) => console.log(err));

   console.log(`Message sent to ${user.wag} (${i + 1} of ${userData.length})`);

   // jeda setelah setiap user
   await delay(5000);

   // jeda tambahan setiap 5 user (kecuali jika itu user terakhir)
   if ((i + 1) % 5 === 0 && i + 1 < userData.length) {
    console.log(`Menunggu 2 menit setelah ${i + 1} user...`);
    await delay(2 * 60 * 1000); // 2 menit
   }
  }
 } catch (error) {
  console.log(error);
  return res.status(500).json({message: error.message});
 }
});

module.exports = router;
