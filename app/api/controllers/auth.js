const nodemailer = require("nodemailer");
const Mailgen = require("mailgen");
const bcrypt = require("bcrypt");
const config = require("../../../config");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const path = require("path");
const {tokenizer} = require("../../../helper/midtrans/tokenizer");

const {Op} = require("sequelize");

const {User, Order, ISP, Transaksi} = require("../../../models");

dotenv.config();

const salt = 10;

module.exports = {
 register: async (req, res, next) => {
  try {
   let payload = req.body;
   let userData = req.user;

   const checkArry = [{nik: payload.nik.toString()}, {email: payload.email}];

   if (payload?.username?.trim()) {
    checkArry.push({username: payload.username});
   }

   const existingUser = await User.findOne({
    where: {
     [Op.or]: checkArry,
    },
   });

   if (existingUser) {
    if (existingUser.nik === payload.nik.toString()) {
     return res.status(422).json({message: "NIK sudah terdaftar"});
    }
    if (existingUser.email === payload.email) {
     return res.status(422).json({message: "Email sudah terdaftar"});
    }
    if (existingUser.username === payload.username) {
     return res.status(422).json({message: "Username sudah terdaftar"});
    }
   }

   let getUser;
   do {
    charset = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    user_id =
     payload.role === "owner"
      ? "OWN"
      : payload.role === "admin"
      ? "ADM"
      : "USR" + payload.name.charAt(0);
    for (var i = 0, n = charset.length; i < 8; ++i) {
     user_id += charset.charAt(Math.floor(Math.random() * n));
    }

    getUser = await User.findOne({where: {user_id}});
   } while (getUser !== null);

   if (!payload.password) {
    return res.status(400).json({
     status: 400,
     message: "Password harus diisi",
    });
   }

   if (payload?.password.length < 8) {
    return res.status(400).json({
     status: 400,
     message: "Password minimal 8 karakter",
    });
   }

   bcrypt.hash(payload.password, salt, async (err, hash) => {
    if (err) throw error;

    payload = {
     ...payload,
     user_id,
     username: payload?.username || user_id,
     password: hash,
     created_by: userData?.user_id || user_id,
     updated_by: userData?.user_id || user_id,
    };

    try {
     const dataUser = await User.create(payload);

     if (payload?.paket) {
      const paketData = await ISP.findOne({where: {isp_id: payload.paket}});

      if (!paketData) {
       return res.status(404).json({message: "Paket tidak ditemukan!"});
      }

      let getOrder;
      do {
       charset = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
       order_id = payload.name.charAt(0);
       for (var i = 0, n = charset.length; i < 8; ++i) {
        order_id += charset.charAt(Math.floor(Math.random() * n));
       }

       getOrder = await Order.findOne({where: {order_id}});
      } while (getOrder !== null);

      const tanggal_mulai = new Date();
      const tanggal_berakhir = new Date();
      tanggal_berakhir.setMonth(tanggal_mulai.getMonth() + 1);
      tanggal_berakhir.setDate(tanggal_berakhir.getDate() - 1);

      const order = await dataUser.createOrder({
       order_id: order_id,
       isp_id: payload.paket,
       tanggal_mulai,
       tanggal_berakhir,
       created_by: userData?.user_id || user_id,
      });

      if (order) {
       return res
        .status(201)
        .json({message: "Akun dan Order berhasil dibuat."});
      } else {
       return res.status(500).json({message: "Order gagal dibuat."});
      }
     }

     return res.status(201).json({
      message: "Daftar berhasil.",
      dataUser,
     });
    } catch (err) {
     console.log(err);
     if (err && err.name === "ValidationError") {
      return res.status(422).json({
       error: 1,
       message: err.message,
       fields: err.errors,
      });
     }
     next(err);
    }
   });
  } catch (err) {
   console.log(err);
   if (err && err.name === "ValidationError") {
    return res.status(422).json({
     error: 1,
     message: err.message,
     fields: err.errors,
    });
   }
   next(err);
  }
 },

 signIn: async (req, res) => {
  try {
   const {password, id} = req.body;

   const getUser = await User.findOne({
    where: {
     [Op.or]: [{user_id: id}, {email: id}, {username: id}],
    },
   });

   const dataUser = JSON.parse(JSON.stringify(getUser));

   if (!getUser)
    return res.status(404).json({message: "Akun tidak ditemukan!"});

   const confirm = bcrypt.compareSync(password, dataUser.password);

   if (!confirm) return res.status(403).json({message: "Password salah!"});

   if (dataUser.deleted_at)
    return res.status(404).json({message: "Akun anda Tidak Aktif!"});

   const token = jwt.sign(
    {
     user: {
      user_id: dataUser.user_id,
      nik: dataUser.nik,
      name: dataUser.name,
      email: dataUser.email,
      username: dataUser.username,
      number: dataUser.number,
     },
    },
    config.jwtKey
   );

   await User.update(
    {last_signin: new Date(), update_at: new Date()},
    {
     where: {
      user_id: dataUser.user_id,
     },
    }
   );

   if (dataUser)
    return res
     .status(200)
     .json({message: "Login Berhasil!", user: {...dataUser, token}});
  } catch (error) {
   console.log(error);
   res.status(500).json({
    message: error.message || `Internal server error!`,
   });
  }
 },

 resetPassword: async (req, res) => {
  try {
   const {nik, email} = req.body;
   const getUser = await User.findOne({where: {nik, email}});
   console.log(getUser);
   if (getUser !== null) {
    // if (getUser.last_reset) {
    //  const lastReset = new Date(getUser.last_reset);
    //  const currentDate = new Date();

    //  const timeDifference = currentDate - lastReset;
    //  const minutesDifference = timeDifference / (1000 * 60);
    //  const hoursDifference = timeDifference / (1000 * 60 * 60);
    //  if (hoursDifference < 1) {
    //   res.status(403).json({
    //    message: `Reset password hanya dapat dilakukan sekali dalam 1 jam! Silahkan coba kembali dalam ${(
    //     60 - minutesDifference
    //    ).toFixed(0)} menit lagi!`,
    //   });
    //   return;
    //  }
    // }

    var length = 15;
    charset =
     "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyz";
    password = "";
    for (var i = 0, n = charset.length; i < length; ++i) {
     password += charset.charAt(Math.floor(Math.random() * n));
    }

    let transporter = nodemailer.createTransport({
     host: process.env.EMAIL_HOST,
     port: process.env.EMAIL_PORT,
     secure: true,
     auth: {
      user: process.env.EMAIL,
      pass: process.env.PASSWORD,
     },
     tls: {
      rejectUnauthorized: false,
     },
    });

    let MailGenerator = new Mailgen({
     theme: {
      path: path.resolve("assets/theme.html"),
     },
     product: {
      username: getUser.fullname,
      password: password,
      title: "Password Akun Anda berhasil direset!",
      paragraph: [
       "Dengan hormat, kami ingin menginformasikan bahwa Reset password akun Anda telah berhasil.",
       "Silakan masuk dengan menggunakan password baru di bawah ini.",
      ],
      name: "REID Team",
      link: "https://reidteam.web.id",
     },
    });

    let response = {
     product: {
      name: "REID Team",
      link: "https://reidteam.web.id",
      logo: "https://reidteam.web.id/reidteam.svg",
      logoHeight: "80px",
     },
     body: {
      name: getUser.fullname,
      intro:
       "Dengan hormat, kami ingin menginformasikan bahwa Reset password akun Anda telah berhasil. Silakan masuk dengan menggunakan password baru di bawah ini.",
      dictionary: {
       Password: password,
      },
      action: {
       instructions: "Klik tombol di bawah untuk melanjutkan ke proses masuk.",
       button: {
        color: "#1E90FF",
        text: "Masuk Sekarang",
        link: "https://reidteam.web.id",
       },
      },
      signature: "Hormat Kami",
     },
    };

    let mail = MailGenerator.generate(response);

    let message = {
     from: process.env.EMAIL_FROM,
     to: getUser.email,
     subject:
      "Password Akun Anda berhasil direset, Silahkan Lihat Password Baru!",
     html: mail,
    };

    bcrypt.hash(password, salt, async (err, hash) => {
     if (err) throw error;

     getUser.password = hash;
     getUser.updated_at = new Date();
     getUser.last_reset = new Date();
     getUser.updated_by = "Reset Password";
     await getUser.save();

     fetch("https://whatsapp.reidteam.web.id/send-html-pdf", {
      method: "POST",
      headers: {
       "Content-Type": "application/json",
      },
      body: JSON.stringify({
       message:
        "Reset Password Akun Berhasil!\n\nSilahkan buka PDF untuk melihat Password Baru.",
       number: getUser.phone_number,
       type: "@c.us",
       html: html(
        "Reset Password Berhasil",
        getUser.fullname,
        "reset Password akun Anda telah berhasil",
        password
       ),
       title: "Reset-Password",
      }),
     }).catch((err) => console.log(err));

     transporter
      .sendMail(message)
      .then((info) => {
       return res.status(201).json({
        message:
         "Password Akun Anda berhasil direset, Password baru telah terkirim lewat email.",
        password,
       });
      })
      .catch((error) => {
       return res.status(500).json({message: error.message});
      });
    });
   } else {
    return res.status(403).json({
     message: "Nik dan Email tidak sesuai dengan yang terdaftar!",
    });
   }
  } catch (error) {
   return res.status(500).json({
    message: error.message || `Internal server error!`,
   });
  }
 },
};
