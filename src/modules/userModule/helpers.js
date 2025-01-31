const { User } = require("../../models/user");
const jwt = require("jsonwebtoken");

const findOne = async (value) => {
  const user = await User.findOne(value);
  return user;
};

const generateForgotPasswordToken = async (email) => {
  return await jwt.sign(
    {
      email: email,
    },
    process.env.FORGOTPASSWORD_TOKEN_SECRET,
    {
      expiresIn: process.env.FORGOTPASSWORD_TOKEN_EXPIRY,
    }
  );
};

module.exports = {
  findOne,
  generateForgotPasswordToken,
};
