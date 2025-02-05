const { User } = require("../../models/user");
const jwt = require("jsonwebtoken");

//In this function provide field, On the basis of which you want to find the specific user
const findOne = async (field) => {
  const user = await User.findOne(field);
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
