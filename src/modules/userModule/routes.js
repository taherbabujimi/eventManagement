const {
  registerUser,
  userLogin,
  forgotPassword,
  resetPassword,
} = require("./controllers");

const userRoute = require("express").Router();

userRoute.post("/registerUser", registerUser);
userRoute.post("/userLogin", userLogin);
userRoute.post("/forgotPassword", forgotPassword);
userRoute.post("/resetPassword", resetPassword);

module.exports = userRoute;
