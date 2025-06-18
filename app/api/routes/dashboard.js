const express = require("express");
const router = express.Router();
const {isLoginUser} = require("../../middleware/auth");
const {getDashboard} = require("../controllers/dashboard");

router.get("/", isLoginUser, getDashboard);

module.exports = router;
