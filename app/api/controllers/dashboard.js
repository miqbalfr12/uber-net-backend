require("dotenv").config();

const {Op, where} = require("sequelize");
const {User, Order, Transaksi} = require("../../../models");
const {addTicks} = require("sequelize/lib/utils");

module.exports = {
 getDashboard: async (req, res) => {
  try {
   const userData = req.user;
   const {data} = req.query;
   const dataDiperlukan = data ? data.split(",") : [];
   console.log(dataDiperlukan);

   let responseData = {};

   if (dataDiperlukan.includes("owner")) {
    const dataTotalPelanggan = await User.count({
     where: {
      role: "pelanggan",
     },
    });
    const dataOrderAktif = await Order.count({
     where: {
      status: "aktif",
      tanggal_mulai: {[Op.lte]: new Date()},
      tanggal_berakhir: {[Op.gte]: new Date()},
     },
    });
    const dataTagihan = await Order.count({
     where: {
      status: "menunggu_pembayaran",
      tanggal_mulai: {[Op.lte]: new Date()},
      tanggal_berakhir: {[Op.gte]: new Date()},
     },
    });
    // const dataPelangganAktif = await User.findAll({
    //  where: {
    //   role: "pelanggan",
    //  },
    //  include: [
    //   {
    //    model: Order,
    //    as: "orders",
    //    required: true,
    //    limit: 1, // ambil hanya satu order
    //    separate: true, // agar limit bekerja di include
    //    order: [["tanggal_mulai", "DESC"]], // ambil yang terbaru
    //    where: {
    //     status: "lunas",
    //    },
    //    //    include: [
    //    //     {
    //    //      model: Transaksi,
    //    //      as: "transaksi",
    //    //      required: true,
    //    //      where: {
    //    //       status: "settlement",
    //    //      },
    //    //     },
    //    //    ],
    //   },
    //  ],
    // });
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1); // tgl 1 bulan ini
    const endOfMonth = new Date(
     now.getFullYear(),
     now.getMonth() + 1,
     0,
     23,
     59,
     59,
     999
    ); // tgl terakhir bulan ini

    const pendapatanBulanIni = await Transaksi.sum("jumlah", {
     where: {
      status: "settlement",
      created_at: {
       [Op.between]: [startOfMonth, endOfMonth],
      },
     },
    });

    responseData.dataOrderAktif = dataOrderAktif;
    responseData.pendapatan = pendapatanBulanIni;
    responseData.tagihan = dataTagihan;
    responseData.pelanggan = {
     total: dataTotalPelanggan,
     aktif: dataOrderAktif,
    };
   }

   console.log(responseData);

   return res.status(200).json(responseData);
  } catch (error) {
   console.log(error);
   return res.status(500).json({message: error.message});
  }
 },
};
