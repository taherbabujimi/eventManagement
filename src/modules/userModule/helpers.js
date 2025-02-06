const { User } = require("../../models/user");
const jwt = require("jsonwebtoken");

//In this function provide field, On the basis of which you want to find the specific user
const findOneUser = async (field) => {
  const user = await User.findOne(field);
  return user;
};

//In this function provide value, in which you want to remove any unwanted whitespaces
const removeWhitespaces = (value) => {
  let value2 = value.replace(/\s{2,}/g, " ");
  return value2.trim();
};

//Here all values is a object you can pass, which contains all the neccessary data needs to create a data
const createUser = async (allValues) => {
  const user = await User.create(allValues);

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
  findOneUser,
  generateForgotPasswordToken,
  removeWhitespaces,
  createUser,
};
