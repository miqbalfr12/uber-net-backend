const express = require("express");
const router = express.Router();
const {isLoginUser} = require("../../middleware/auth");
const {getProfile, editUser, getPelanggan} = require("../controllers/user");

router.put("/", isLoginUser, editUser);
router.get("/pelanggan", isLoginUser, getPelanggan);
router.get("/profile", isLoginUser, getProfile);

module.exports = router;
