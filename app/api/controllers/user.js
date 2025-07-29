const {Op, where} = require("sequelize");
const bcrypt = require("bcrypt");
const {User, Order, ISP, Transaksi} = require("../../../models");

const salt = 10;

module.exports = {
 getAllUsers: async (req, res) => {
  const userData = req.user;

  const {keperluan} = req.query;

  const dataDiperlukan = keperluan ? keperluan.split(",")[0] : 0;
  console.log(dataDiperlukan);

  // Only Owner and Admin can get all users
  if (userData.role !== "owner" && userData.role !== "admin") {
   return res.status(403).json({
    status: 403,
    message: "Forbidden",
   });
  }

  let userWhereClause = {};

  if (userData.role === "admin") {
   userWhereClause = {
    role: "pelanggan", // only customer
   };
  }

  const dataUser = await User.findAll({
   where: dataDiperlukan ? {[Op.or]: {role: dataDiperlukan}} : userWhereClause,
   include: [
    {
     model: Order,
     as: "orders",
     separate: true,
     limit: 1,
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

  const dataUserJson = JSON.parse(JSON.stringify(dataUser));

  dataUserJson
   .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
   .map((item, index) => {
    item.no = index + 1;
    console.log(item.wag);
    console.log(item.deleted_at);
    if (item.role === "owner") item.aksi = ["view"];
    else
     item.aksi = [
      ...(item.wag ? ["sendAnnounce"] : []),
      "view",
      ...(item.deleted_at ? ["restore"] : ["edit", "delete"]),
     ];
   });

  res.status(200).json(dataUserJson.filter((item) => item.deleted_at === null));
 },
 getProfile: async (req, res) => {
  const user = req.user;

  res.status(200).json(user);
 },

 getPelanggan: async (req, res) => {
  const user = req.user;

  try {
   const userData = await User.findOne({
    where: {user_id: user.user_id},
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
       {
        model: Transaksi,
        as: "transaksi",
       },
      ],
     },
    ],
   });
   if (!userData) {
    return res.status(404).json({message: "User not found"});
   }

   const userDataJson = JSON.parse(JSON.stringify(userData));

   userDataJson.orders = userDataJson.orders.map((order, index) => {
    const adaSettlement = order.transaksi.some(
     (t) => t.status === "settlement"
    );

    return {
     no: index + 1,
     order_id: order.order_id,
     speed: order.paket.speed,
     harga: order.paket.harga,
     tanggal_mulai: order.tanggal_mulai.split("T")[0],
     tanggal_berakhir: order.tanggal_berakhir.split("T")[0],
     status: order.status
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" "),
     //  ...order,
     detail: order,
     aksi: adaSettlement
      ? ["settlement"]
      : order.status === "kadaluarsa"
      ? []
      : ["bayar"],
    };
   });

   res.status(200).json(userDataJson);
  } catch (error) {
   console.log(error);
   return res.status(500).json({message: error.message});
  }
 },

 getTagihan: async (req, res) => {
  const user = req.user;
  try {
   const dataOrder = await Order.findAll({
    order: [["created_at", "DESC"]],
    include: [
     {
      model: User,
      as: "pelanggan",
     },
     {
      model: ISP,
      as: "paket", // ini sesuai alias yang kamu pakai di associate Order.js
     },
     {
      model: Transaksi,
      as: "transaksi",
     },
    ],
   });

   const dataJson = JSON.parse(JSON.stringify(dataOrder));

   dataJson.map((order) => {
    order.tanggal = order.created_at.split("T")[0];
    order.speed = order.paket.speed;
    order.harga = order.paket.harga;
    if (order.status === "kadaluarsa") order.aksi = ["viewOrder"];
    if (order.status === "aktif" || order.status === "non_aktif") {
     order.aksi = [order?.pelanggan?.wag ? "sendSettlement" : "", "settlement"];
     order.status = "lunas";
    }
    if (order.status === "menunggu_pembayaran")
     order.aksi = [
      order?.pelanggan?.wag ? "sendOrder" : "",
      "viewOrder",
      "editOrder",
     ];
   });

   res.status(200).json(dataJson);
  } catch (error) {
   console.log(error);
   return res.status(500).json({message: error.message});
  }
 },

 deleteUser: async (req, res) => {
  const user = req.user;
  const {user_id} = req.body;

  console.log(user_id);
  try {
   const userData = await User.findOne({where: {user_id}}).then((userData) => {
    userData.updated_at = new Date();
    userData.updated_by = user.user_id;
    userData.deleted_at = new Date();
    userData.deleted_by = user.user_id;
    return userData;
   });
   await userData.save().then(() => {
    console.log("User deleted");
    return res.status(200).json({message: "User deleted"});
   });
  } catch (error) {
   return res.status(500).json({message: error.message});
  }
 },
 restoreUser: async (req, res) => {
  const user = req.user;
  const {user_id} = req.body;

  console.log(user_id);
  try {
   const userData = await User.findOne({where: {user_id}}).then((userData) => {
    userData.updated_at = new Date();
    userData.updated_by = user.user_id;
    userData.deleted_at = null;
    userData.deleted_by = null;
    return userData;
   });
   await userData.save().then(() => {
    console.log("User deleted");
    return res.status(200).json({message: "User restored"});
   });
  } catch (error) {
   return res.status(500).json({message: error.message});
  }
 },

 editUser: async (req, res) => {
  const user = req.user;
  const payload = req.body;
  console.log(user);
  console.log({payload});

  try {
   const userData = await User.findOne({
    where: {user_id: payload.user_id},
    include: [
     {
      model: Order,
      as: "orders",
      separate: true,
      // limit: 1,
      order: [["created_at", "DESC"]],
      include: [
       {
        model: ISP,
        as: "paket", // ini sesuai alias yang kamu pakai di associate Order.js
       },
      ],
     },
    ],
   });

   if (!userData) {
    return res.status(404).json({message: "User not found"});
   }

   userData.updated_at = new Date();
   userData.updated_by = user.user_id;
   userData.name = payload.name;
   userData.email = payload.email;
   userData.nik = payload.nik;
   userData.number = payload.number;
   userData.wag = payload.wag;
   userData.alamat = payload.alamat;
   userData.username = payload.username;

   if (payload?.password) {
    const hash = await bcrypt.hash(payload.password, salt);
    userData.password = hash;
   }

   console.log({paketTrakhir: userData?.orders[0]?.isp_id});

   if (payload?.paket && payload.paket !== userData?.orders[0]?.isp_id) {
    console.log(payload.paket);
    let getOrder;
    do {
     charset = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
     order_id = user.user_id.charAt(0);
     for (var i = 0, n = charset.length; i < 8; ++i) {
      order_id += charset.charAt(Math.floor(Math.random() * n));
     }

     getOrder = await Order.findOne({where: {order_id}});
    } while (getOrder !== null);

    const tanggal_mulai = new Date();
    const tanggal_berakhir = new Date();
    tanggal_berakhir.setMonth(tanggal_mulai.getMonth() + 1);
    tanggal_berakhir.setDate(tanggal_berakhir.getDate() - 1);

    userData.orders.map(async (order) => {
     if (order.status === "menunggu_pembayaran") {
      order.status = "kadaluarsa";
      await order.save();
     }
     if (order.status === "aktif") {
      order.status = "non_aktif";
      await order.save();
     }
    });

    const newOrder = await userData.createOrder({
     order_id: order_id,
     isp_id: payload.paket,
     tanggal_mulai,
     tanggal_berakhir,
     created_by: user?.user_id || user_id,
    });
    console.log(newOrder);
   }

   await userData.save();

   return res.status(200).json({message: "User updated"});
  } catch (error) {
   console.log(error);
   return res.status(500).json({message: error.message});
  }
 },
};
