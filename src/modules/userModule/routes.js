const {
  registerUser,
  userLogin,
  forgotPassword,
  resetPassword,
  updateUserProfile,
} = require("./controllers");

const { verifyJWT } = require("../../middlewares/authMiddleware");

const userRoute = require("express").Router();

userRoute.post("/registerUser", registerUser);
userRoute.post("/userLogin", userLogin);
userRoute.post("/forgotPassword", forgotPassword);
userRoute.post("/resetPassword", resetPassword);
userRoute.put("/updateUserProfile", verifyJWT, updateUserProfile);

module.exports = userRoute;
