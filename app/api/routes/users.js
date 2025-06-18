const express = require("express");
const router = express.Router();
const {getAllUsers, getTagihan} = require("../controllers/user");
const {isLoginUser} = require("../../middleware/auth");

router.get("/", isLoginUser, getAllUsers);
router.get("/tagihan", isLoginUser, getTagihan);

module.exports = router;
