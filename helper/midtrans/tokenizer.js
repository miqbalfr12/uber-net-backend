const Midtrans = require("midtrans-client");

let snap = new Midtrans.Snap({
 isProduction: false,
 serverKey: process.env.MIDTRANS_SERVER_KEY,
 clientKey: process.env.MIDTRANS_CLIENT_KEY,
});

module.exports = {
 tokenizer: async function ({
  transaksi_id,
  harga,
  paket,
  isp_id,
  nama,
  email,
  number,
 }) {
  console.log("Tokenizer");
  let parameter = {
   transaction_details: {
    order_id: transaksi_id,
    gross_amount: harga,
   },
   item_details: [
    {
     id: isp_id,
     price: harga,
     quantity: 1,
     name: paket,
     brand: "Wifi",
     category: "Internet",
     merchant_name: "Uber Net",
    },
   ],
   customer_details: {
    first_name: nama,
    email: email,
    phone: number,
   },
  };

  const token = await snap.createTransaction(parameter);
  console.log(token);
  return token;
 },
};
