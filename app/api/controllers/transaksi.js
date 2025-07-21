const {Op} = require("sequelize");
const fs = require("fs");
const {User, Order, ISP, Transaksi} = require("../../../models");
const {tokenizer} = require("../../../helper/midtrans/tokenizer");
const path = require("path");
const {generatePDFfromHTML} = require("../../../helper/html-pdf");
require("dotenv").config();

module.exports = {
 createTransaction: async (req, res) => {
  const user = req.user;
  const payload = req.body;

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

   let getTransaksi;
   let transaksi_id;
   do {
    charset = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    transaksi_id = user.user_id.charAt(0);
    for (var i = 0, n = charset.length; i < 8; ++i) {
     transaksi_id += charset.charAt(Math.floor(Math.random() * n));
    }

    getTransaksi = await Transaksi.findOne({where: {transaksi_id}});
   } while (getTransaksi !== null);

   let selectedOrder = userData.orders[0]; // default ke order pertama

   console.log(payload.order_id);
   if (payload.order_id) {
    const foundOrder = userData.orders.find(
     (order) => order.order_id === payload.order_id
    );
    const foundOrderIndex = userData.orders.findIndex(
     (order) => order.order_id === payload.order_id
    );
    console.log(foundOrder);
    console.log({selectedOrder});
    if (foundOrder) {
     selectedOrder = foundOrder;
    }
   }

   const getToken = await tokenizer({
    transaksi_id,
    harga: selectedOrder.paket.harga,
    paket: selectedOrder.paket.speed,
    isp_id: selectedOrder.paket.isp_id,
    nama: userData.name,
    email: userData.email,
    number: userData.number,
   });

   const transaksi = await selectedOrder.createTransaksi({
    transaksi_id: transaksi_id,
    jumlah: selectedOrder.paket.harga,
    snap_token: getToken.token,
    redirect_url: getToken.redirect_url,
    created_by: userData?.user_id,
   });

   if (transaksi) return res.status(201).json(getToken.token);

   return res.status(500).json({message: "Buat Transaksi gagal."});
  } catch (error) {
   console.log(error);
   return res.status(500).json({message: error.message});
  }
 },

 createTagihan: async (req, res) => {
  const user = req.user;
  const payload = req.body;

  console.log(payload);

  try {
   const userData = await User.findOne({
    where: {user_id: payload.user_id},
    include: [
     {
      model: Order,
      as: "orders",
      separate: true,
      order: [["created_at", "DESC"]],
      include: [
       {
        model: ISP,
        as: "paket",
       },
       {
        model: Transaksi,
        as: "transaksi",
       },
      ],
     },
    ],
   });

   console.log({userData});

   if (!userData) {
    return res.status(404).json({message: "User not found"});
   }

   console.log({paketTrakhir: userData?.orders[0]?.isp_id});

   let getOrder;
   do {
    charset = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    order_id = userData.name.charAt(0);
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
    isp_id: payload.isp_id || userData?.orders[0]?.isp_id,
    tanggal_mulai,
    tanggal_berakhir,
    created_by: user?.user_id,
   });
   console.log(newOrder);

   await userData.save();

   if (newOrder) {
    return res.status(201).json({message: "Buat Tagihan Berhasil."});
   }

   return res.status(500).json({message: "Buat Tagihan gagal."});
  } catch (error) {
   console.log(error);
   return res.status(500).json({message: error.message});
  }
 },

 settlementSet: async (req, res) => {
  try {
   //  `/api/v1.0.0/transaksi?order_id=${result.order_id}&status_code=200&transaction_status=settlement$payment_type=${result.payment_type}&transaction_time=${result.transaction_time}&transaction_id=${result.transaction_id}`
   const {
    order_id: transaksi_id,
    status_code,
    transaction_status: status,
    payment_type,
    transaction_time,
    transaction_id,
   } = req.query;

   console.log({
    transaksi_id,
    status_code,
    status,
    payment_type,
    transaction_time,
    transaction_id,
   });

   const transaksi = await Transaksi.findOne({where: {transaksi_id}});

   if (!transaksi) {
    const order = await Order.findOne({
     where: {order_id: transaksi_id},
     include: [
      {
       model: ISP,
       as: "paket",
      },
     ],
    });

    let getTransaksi;
    let new_transaksi_id;
    do {
     charset = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
     for (var i = 0, n = charset.length; i < 8; ++i) {
      new_transaksi_id += charset.charAt(Math.floor(Math.random() * n));
     }

     getTransaksi = await Transaksi.findOne({
      where: {transaksi_id: new_transaksi_id},
     });
    } while (getTransaksi !== null);

    // 2025-06-16 22:05:00
    const transaction_time = new Date()
     .toISOString()
     .slice(0, 19)
     .replace("T", " ");

    await order.createTransaksi({
     transaksi_id: new_transaksi_id,
     jumlah: order.paket.harga,
     transaction_time, //date 2025-06-16 22:05:00
     snap_token: null,
     redirect_url: null,
     created_by: payment_type,
     status,
     payment_type,
    });
    await order.update({
     status: "aktif",
    });
    return res.status(200).json({message: "Tagihan berhasil dilunasi."});
   }

   if (status_code === "200") {
    await transaksi.update({
     status,
     payment_type,
     transaction_time,
     midtrans_id: transaction_id,
    });
    await Order.update(
     {
      status: "aktif",
     },
     {where: {order_id: transaksi.order_id}}
    );
   }

   console.log("Redirecting to: Frontend");
   res.redirect(process.env.FRONT_END_URL);
  } catch (error) {
   console.log(error);
   return res.status(500).json({message: error.message});
  }
 },

 getPendapatan: async (req, res) => {
  try {
   const {bulan} = req.query;

   if (!bulan || isNaN(parseInt(bulan))) {
    return res.status(400).json({message: "Parameter 'bulan' tidak valid"});
   }

   const bulanIndex = parseInt(bulan); // 0 = Januari, 11 = Desember
   const now = new Date();
   const tahunIni = now.getFullYear();

   const startOfMonth = new Date(tahunIni, bulanIndex, 1);
   const endOfMonth = new Date(tahunIni, bulanIndex + 1, 0, 23, 59, 59, 999); // akhir bulan

   const total_hari_bulan = new Date(tahunIni, bulanIndex + 1, 0).getDate();

   console.log({startOfMonth, endOfMonth, total_hari_bulan});

   const pendapatan = await Transaksi.findAll({
    where: {
     status: "settlement",
     created_at: {
      [Op.between]: [startOfMonth, endOfMonth],
     },
    },
    include: {
     model: Order,
     as: "order",
     include: [
      {
       model: User,
       as: "pelanggan",
      },
      {
       model: ISP,
       as: "paket",
      },
     ],
    },
   });

   const chartDataBySpeed = {}; // { '10': [0,0,0,...], '20': [...], dst }

   pendapatan.forEach((item) => {
    const tgl = new Date(item.created_at).getDate(); // 1 - 31
    const speed = item.order?.paket?.speed || "Tidak Diketahui";
    const harga = item.jumlah;

    // Jika belum ada array speed, buat array isi 0 sebanyak jumlah hari
    if (!chartDataBySpeed[speed]) {
     chartDataBySpeed[speed] = new Array(total_hari_bulan).fill(0);
    }

    // Tambahkan harga ke tanggal tersebut (tgl - 1 karena index 0-based)
    chartDataBySpeed[speed][tgl - 1] += harga;
   });

   const colors = [
    "#36A2EB",
    "#FF6384",
    "#4BC0C0",
    "#FFCE56",
    "#9966FF",
    "#00A8A8",
    "#C9CBCF",
    "#FF9F40",
    "#EF476F",
    "#118AB2",
   ];

   const datasets = Object.keys(chartDataBySpeed).map((speed, index) => ({
    label: `${speed}`,
    data: chartDataBySpeed[speed],
    borderColor: colors[index % colors.length],
    backgroundColor: `${colors[index % colors.length]}55`,
   }));

   const dataChart = {
    labels: [...Array(total_hari_bulan).keys()].map((i) => i + 1), // 1 - 30/31
    datasets: datasets,
   };

   const jumlah_pendapatan = pendapatan.reduce((total, transaksi) => {
    return total + transaksi.jumlah;
   }, 0);
   const jumlah_transaksi = pendapatan.length;

   const header = [
    "no",
    "tanggal",
    "transaksi_id",
    "name",
    "total",
    "payment_type",
    "aksi",
   ];

   const listData = pendapatan.map((item, index) => {
    const tanggal = new Date(item.created_at).toLocaleDateString("id-ID", {
     day: "numeric",
     month: "long",
     year: "numeric",
    });
    const name = item.order?.pelanggan?.name || "Tidak Diketahui";
    const user_id = item.order?.pelanggan?.user_id || "Tidak Diketahui";
    const total = item.jumlah;
    const payment_type = item.payment_type;
    const order_id = item.order.order_id || "Tidak Diketahui";
    const transaksi_id = item.midtrans_id || "Tidak Diketahui";
    return {
     no: index + 1,
     tanggal,
     order_id,
     user_id,
     transaksi_id,
     name,
     total,
     payment_type,
     detail: item,
     aksi: ["settlement"],
    };
   });

   console.log(listData);
   const uniqueUserIds = new Set(listData.map((item) => item.user_id));
   const jumlah_pelanggan = uniqueUserIds.size;

   res.status(200).json({
    jumlah_pendapatan,
    jumlah_transaksi,
    jumlah_pelanggan,
    dataChart,
    listData,
   });
  } catch (err) {
   console.error(err);
   res
    .status(500)
    .json({message: "Terjadi kesalahan saat mengambil data pendapatan."});
  }
 },

 getLaporan: async (req, res) => {
  const user = req.user;
  const {bulan, paket} = req.query;
  console.log({bulan, paket});

  if (!bulan || isNaN(parseInt(bulan))) {
   return res.status(400).json({message: "Parameter 'bulan' tidak valid"});
  }

  const bulanIndex = parseInt(bulan); // 0 = Januari, 11 = Desember
  const now = new Date();
  const tahunIni = now.getFullYear();

  const startOfMonth = new Date(tahunIni, bulanIndex, 1);
  const endOfMonth = new Date(tahunIni, bulanIndex + 1, 0, 23, 59, 59, 999); // akhir bulan

  try {
   const transaksi = await Transaksi.findAll({
    where: {
     status: "settlement",
     created_at: {
      [Op.between]: [startOfMonth, endOfMonth],
     },
    },
    include: [
     {
      model: Order,
      as: "order",
      where: {
       status: {
        [Op.or]: ["aktif", "non_aktif"],
       },
      },
      include: [
       {
        model: User,
        as: "pelanggan",
       },
       {
        model: ISP,
        as: "paket",
        where: {
         isp_id: paket,
        },
       },
      ],
     },
    ],
   });

   const sum = transaksi.reduce((total, transaksi) => {
    return total + transaksi.jumlah;
   }, 0);

   const countTransaksi = transaksi.length;

   const transaksiJson = transaksi.map((item, index) => {
    const tanggal = new Date(item.created_at).toLocaleDateString("id-ID", {
     day: "numeric",
     month: "long",
     year: "numeric",
    });
    const name = item.order?.pelanggan?.name || "Tidak Diketahui";
    const user_id = item.order?.pelanggan?.user_id || "Tidak Diketahui";
    const total = item.jumlah;
    const payment_type = item.payment_type;
    const order_id = item.order.order_id || "Tidak Diketahui";
    const transaksi_id = item.midtrans_id || "Tidak Diketahui";
    return {
     no: index + 1,
     tanggal,
     order_id,
     user_id,
     transaksi_id,
     name,
     total,
     payment_type,
     detail: item,
     aksi: ["settlement"],
    };
   });

   const uniqueUserIds = new Set(transaksiJson.map((item) => item.user_id));
   const countPelanggan = uniqueUserIds.size;

   res
    .status(200)
    .json({transaksi: transaksiJson, sum, countTransaksi, countPelanggan});
  } catch (err) {
   console.error(err);
   res.status(500).json({message: "Terjadi kesalahan saat mengambil data."});
  }
 },

 cetakLaporan: async (req, res) => {
  if (
   !fs.existsSync(
    path.resolve(__dirname, "..", "..", "..", "public", "laporan")
   )
  ) {
   fs.mkdirSync(
    path.resolve(__dirname, "..", "..", "..", "public", "laporan"),
    {
     recursive: true,
    }
   );
  }
  const {bulan, paket} = req.query;
  console.log("cetak");

  if (!bulan || isNaN(parseInt(bulan))) {
   return res.status(400).json({message: "Parameter 'bulan' tidak valid"});
  }

  const bulanIndex = parseInt(bulan); // 0 = Januari, 11 = Desember
  const now = new Date();
  const tahunIni = now.getFullYear();

  const startOfMonth = new Date(tahunIni, bulanIndex, 1);
  const endOfMonth = new Date(tahunIni, bulanIndex + 1, 0, 23, 59, 59, 999); // akhir bulan

  try {
   const transaksi = await Transaksi.findAll({
    where: {
     status: "settlement",
     created_at: {
      [Op.between]: [startOfMonth, endOfMonth],
     },
    },
    include: [
     {
      model: Order,
      as: "order",
      where: {
       status: {
        [Op.or]: ["aktif", "non_aktif"],
       },
      },
      include: [
       {
        model: User,
        as: "pelanggan",
       },
       {
        model: ISP,
        as: "paket",
        where: {
         isp_id: paket,
        },
       },
      ],
     },
    ],
   });

   const sum = transaksi.reduce((total, transaksi) => {
    return total + transaksi.jumlah;
   }, 0);

   const countTransaksi = transaksi.length;

   const transaksiJson = transaksi.map((item, index) => {
    const tanggal = new Date(item.created_at).toLocaleDateString("id-ID", {
     day: "numeric",
     month: "long",
     year: "numeric",
    });
    const name = item.order?.pelanggan?.name || "Tidak Diketahui";
    const user_id = item.order?.pelanggan?.user_id || "Tidak Diketahui";
    const total = item.jumlah;
    const payment_type = item.payment_type;
    const order_id = item.order.order_id || "Tidak Diketahui";
    const transaksi_id = item.midtrans_id || "Tidak Diketahui";
    return {
     no: index + 1,
     tanggal,
     order_id,
     user_id,
     transaksi_id,
     name,
     total,
     payment_type,
     detail: item,
     aksi: ["settlement"],
    };
   });

   const uniqueUserIds = new Set(transaksiJson.map((item) => item.user_id));
   const countPelanggan = uniqueUserIds.size;

   const paginateData = (data) => {
    console.log({data: data.length});
    const pages = [];

    // Ambil halaman pertama dengan 14 data
    const firstPage = data.slice(0, 10);
    pages.push(firstPage);

    // Ambil halaman-halaman berikutnya dengan 20 data
    let remainingData = data.slice(10);

    while (remainingData.length > 0) {
     pages.push(remainingData.slice(0, 15)); // Ambil 15 data per halaman
     remainingData = remainingData.slice(15); // Sisa data untuk halaman berikutnya
    }

    return pages;
   };
   const dataPerHalaman = paginateData(transaksiJson);

   const rangkuman = (data) => {
    console.log({dataRangkuman: data.length});
    const TotalPendapatan = data.reduce((a, b) => a + b.total, 0);
    return `<table class='w-full'>
     <tr>
      <td class='bg-gray-100 px-4 py-1 text-sm text-center font-bold' colspan='6'>Rangkuman Halaman</td>
     </tr>
     <tr>
      <td class='bg-neutral-50 px-4 py-1 text-sm'>Pendapatan</td>
      <td class='bg-neutral-50 px-4 py-1 text-sm'>Rp</td>
      <td class='bg-neutral-50 px-4 py-1 text-sm text-end'>${TotalPendapatan}</td>
     </tr>
    </table>`;
   };
   const html = `<head>
  <script src='https://cdn.tailwindcss.com'></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/2.6.0/Chart.min.js"></script>
  <script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
  <style>
   @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700&display=swap');
   @layer base {
    body {
     font-family: 'Montserrat', sans-serif;
    }
   }
   p {
    color: rgb(75 85 99);
   }
  </style>
 </head>
 <body>
  ${dataPerHalaman
   .map((dataHalaman, indexHalaman) => {
    return `<div
   class='w-[20.99cm] h-[29.7cm] max-w-[20.99cm] max-h-[29.7cm] p-0 m-0 flex flex-col border-2'>
   ${
    indexHalaman == 0
     ? `<div
    class='w-full text-black mt-4 p-8 px-12 bg-gray-300 flex justify-end items-end'>
     <img
      class='h-[36px]'
      src='https://i.imgur.com/VhordOF.png' />
   </div>
   <div class='m-6 mt-8'>
    <h1 class='text-4xl font-bold text-gray-800 py-2'>LAPORAN </h1>
    <hr class='my-6 w-2/4 border border-8 border-gray-300 bg-gray-300' />
    <h2 class='text-xl font-semibold text-gray-600'>Uber Net</h2>
    <p>Bulan: ${parseInt(bulan) + 1}</p>
    <p>Paket: ${paket}</p>
   </div>`
     : `
   <div class='m-6 mt-8'>
 
    <h2 class='text-xl font-semibold text-gray-600'>Laporan - Uber Net</h2>
    <p>parseInt(Bulan): ${bulan + 1}</p>
    <p>Paket: ${paket}</p>
   </div>`
   }
   <div class='mx-6 pb-2 mt-6 bg-gray-100'>
    <table class='table-auto w-full'>
     <thead>
      <tr clas="table-row">
       <td class='px-4 py-1 text-sm text-center font-bold'>No</td>
       <td class='px-4 py-1 text-sm text-center font-bold'>Tanggal</td>
       <td class='px-4 py-1 text-sm text-center font-bold w-full'>Nama</td>
       <td class='px-4 py-1 text-sm text-center font-bold w-full'>Transaksi</td>
       <td class='px-4 py-1 text-sm text-center font-bold' colspan='2' >Nominal</td>
      </tr>
     </thead>
     <tbody>
      <!-- untuk page 1 maximal 10 dataHalaman -->
      ${dataHalaman
       .map((data, index) => {
        console.log({data});
        let color;
        if (index % 2 === 1) color = "bg-neutral-50";
        else color = "bg-white";
        return `
      <tr>
       <td class='${color} px-4 py-1 text-sm text-center'>${
         indexHalaman === 0 ? index + 1 : index + 11 + (indexHalaman - 1) * 15
        }</td>
       <td class='${color} px-4 py-1 text-sm text-center'>${data.tanggal}</td>
        <td class='${color} px-4 py-1 text-sm'>${data.name}</td>
        <td class='${color} px-4 py-1 text-sm'>${data.payment_type}</td>
       <td class='${color} px-4 py-1 text-sm'>Rp</td>
       <td class='${color} px-4 py-1 text-sm text-end '>${data.total.toLocaleString(
         "id-ID"
        )}</td>
      </tr>`;
       })
       .join("")}
     </tbody>
    </table>
   </div>
   <div class='mx-6 grow mt-6'>
       ${rangkuman(dataHalaman)}
   </div>
   <div class='mx-6 my-2 text-center'>
    Dicetak pada tanggal: ${new Date().toLocaleString("id-ID")} | Halaman ${
     indexHalaman + 1
    } dari ${dataPerHalaman.length}
   </div>
   <div class='bg-black w-full text-white text-center'>
    Copyright © 2024 Uber Net
   </div>
  </div>`;
   })
   .join("")}
 </body>
 `;

   const fileName = `${new Date().getTime()}.pdf`;

   const savePath = path.join(
    path.resolve(__dirname, "..", "..", "..", "public", "laporan"),
    fileName
   );

   await generatePDFfromHTML(html, savePath);

   res.status(200).json({
    link: process.env.BASE_URL + "/laporan/" + fileName,
   });
  } catch (err) {
   console.error(err);
   res.status(500).json({message: "Terjadi kesalahan saat mengambil data."});
  }
 },
};
