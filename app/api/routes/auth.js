const express = require("express");
const {register, signIn, resetPassword} = require("../controllers/auth");
const {deleteUser, restoreUser} = require("../controllers/user");
const {isLoginUser} = require("../../middleware/auth");
const router = express.Router();

router.post("/register", isLoginUser, register);
router.post("/signin", signIn);
router.post("/reset", resetPassword);
router.post("/delete", isLoginUser, deleteUser);
router.post("/restore", isLoginUser, restoreUser);

module.exports = router;
