const dotenv = require("dotenv");
const path = require("path");

dotenv.config();

module.exports = {
 rootPath: path.resolve(__dirname, ".."),
 suratMasukPath: path.resolve(__dirname, "..", "public", "surat-masuk"),
 suratKeluarPath: path.resolve(__dirname, "..", "public", "surat-keluar"),
 disposisiPath: path.resolve(__dirname, "..", "public", "disposisi"),
 jwtKey: process.env.SECRET,
};
