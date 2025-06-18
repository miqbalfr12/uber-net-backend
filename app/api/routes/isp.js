const express = require("express");
const router = express.Router();
const {isLoginUser} = require("../../middleware/auth");
const {getAllPaket} = require("../controllers/isp");

router.get("/", isLoginUser, getAllPaket);

module.exports = router;
