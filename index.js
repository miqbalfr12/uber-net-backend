const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const cors = require("cors");

const indexRouter = require("./routes/index");
// API
const authRouter = require("./app/api/routes/auth");
const userRouter = require("./app/api/routes/user");
const usersRouter = require("./app/api/routes/users");
const ispRouter = require("./app/api/routes/isp");
const transaksiRouter = require("./app/api/routes/transaksi");
const dashboardRouter = require("./app/api/routes/dashboard");
const sendRouter = require("./app/api/routes/send");

const app = express();
const URL = "/api/v1.0.0";

app.use(
 cors({
  origin: "http://localhost:3000",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "authorization"],
  credentials: true,
 })
);

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);

app.use(`${URL}/auth`, authRouter);
app.use(`${URL}/user`, userRouter);
app.use(`${URL}/users`, usersRouter);
app.use(`${URL}/isp`, ispRouter);
app.use(`${URL}/transaksi`, transaksiRouter);
app.use(`${URL}/dashboard`, dashboardRouter);
app.use(`${URL}/send`, sendRouter);

app.use(function (req, res, next) {
 next(createError(404));
});

app.use(function (err, req, res, next) {
 res.locals.message = err.message;
 res.locals.error = req.app.get("env") === "development" ? err : {};
 res.status(err.status || 500);
 res.render("error");
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
 console.log(`Server is running on port ${port}`);
});
module.exports = app;
