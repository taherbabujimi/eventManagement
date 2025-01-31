"use strict";

const jwt = require("jsonwebtoken");
const { errorResponseWithoutData } = require("../services/responses");
const { commonMessages } = require("../services/commonMessages");
const { User } = require("../models/user");

const verifyJWT = async (req, res, next) => {
  try {
    const token = req.header("Authorization").replace("Bearer ", "");

    if (!token) {
      return errorResponseWithoutData(res, commonMessages.badRequest, 400);
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const user = await User.findById(decodedToken?._id).select("-password");

    if (!user) {
      return errorResponseWithoutData(res, commonMessages.badRequest, 400);
    }

    req.user = user;

    next();
  } catch (error) {
    console.log(error);
    return errorResponseWithoutData(res, commonMessages.badRequest, 400);
  }
};

module.exports = {
  verifyJWT,
};
