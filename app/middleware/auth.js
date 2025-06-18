const config = require("../../config");
const jwt = require("jsonwebtoken");

const {User} = require("../../models");

const isLoginUser = async (req, res, next) => {
 try {
  const token = req.headers.authorization
   ? req.headers.authorization.replace("Bearer ", "")
   : null;

  if (!token) {
   console.log("!token");
   return res.status(401).json({
    message: "Not authorized to access this resources",
   });
  }
  if (token === "WHATSAPP") {
   req.user = {
    user_id: "WHATSAPP",
    name: "WHATSAPP",
    email: "WHATSAPP",
    username: "WHATSAPP",
    role: "WHATSAPP",
   };
   return next();
  }

  const data = jwt.verify(token, config.jwtKey);

  console.log({data});
  const exp = data.iat + 60 * 60 * 24; // 1 day
  const currentTime = Math.floor(Date.now() / 1000);
  const timeLeft = exp - currentTime;
  console.log({iat: data.iat, exp, currentTime, timeLeft});

  if (timeLeft < 0) {
   console.log("Token expired");
   return res.status(401).json({
    message: "Token expired",
   });
  }

  const user = await User.findOne({
   where: {
    user_id: data.user.user_id,
   },
  });

  if (!user) {
   console.log("Invalid Token");
   return res.status(401).json({
    message: "Invalid Token",
   });
  }

  if (user.deleted_at) {
   return res.status(401).json({
    message: "Akun anda Tidak Aktif!",
   });
  }

  if (user) {
   user.last_activity = new Date();
   await user.save();

   req.user = user;
   req.token = token;
   next();
  } else {
   throw new Error();
  }
 } catch (error) {
  //   if (req.route.path === "/register") {
  //    return next();
  //   }
  console.log(error);
  return res.status(401).json({
   message: "Not authorized to access this resources",
   error: error.message,
  });
 }
};

module.exports = {
 isLoginUser,
};
