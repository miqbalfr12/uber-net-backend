const express = require("express");
const router = express.Router();
const {isLoginUser} = require("../../middleware/auth");
const {
 settlementSet,
 createTransaction,
 getPendapatan,
 getLaporan,
 createTagihan,
} = require("../controllers/transaksi");

router.get("/", settlementSet);
router.post("/", isLoginUser, createTransaction);
router.post("/tagihan", isLoginUser, createTagihan);
router.get("/pendapatan", isLoginUser, getPendapatan);
router.get("/laporan", isLoginUser, getLaporan);

module.exports = router;
