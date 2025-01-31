const joi = require("joi");
const { errorResponseData } = require("../../services/responses");
const { commonMessages } = require("../../services/commonMessages");
const { USERTYPE } = require("../../services/constants");

const userRegisterSchema = (body, res) => {
  const Schema = joi.object({
    username: joi.string().min(3).max(30).required(),
    email: joi.string().email().required(),
    password: joi.string().min(3).max(30).required(),
    usertype: joi.string().valid(...USERTYPE),
    timezone: joi.string().required(),
  });

  const validationResult = Schema.validate(body);

  if (validationResult.error) {
    console.log(validationResult.error);

    return errorResponseData(
      res,
      commonMessages.errorWhileValidatingValues,
      validationResult.error,
      400
    );
  } else {
    return false;
  }
};

const userLoginSchema = (body, res) => {
  const Schema = joi.object({
    email: joi.string().email().required(),
    password: joi.string().min(3).max(30).required(),
  });

  const validationResult = Schema.validate(body);

  if (validationResult.error) {
    console.log(validationResult.error);

    return errorResponseData(
      res,
      commonMessages.errorWhileValidatingValues,
      validationResult.error,
      400
    );
  } else {
    return false;
  }
};

const forgotPasswordSchema = (body, res) => {
  const Schema = joi.object({
    email: joi.string().email().required(),
  });

  const validationResult = Schema.validate(body);

  if (validationResult.error) {
    console.log(validationResult.error);

    return errorResponseData(
      res,
      commonMessages.errorWhileValidatingValues,
      validationResult.error,
      400
    );
  } else {
    return false;
  }
};

const resetPasswordSchema = (body, res) => {
  const Schema = joi.object({
    newPassword: joi.string().min(3).max(30).required(),
  });

  const validationResult = Schema.validate(body);

  if (validationResult.error) {
    console.log(validationResult.error);

    return errorResponseData(
      res,
      commonMessages.errorWhileValidatingValues,
      validationResult.error,
      400
    );
  } else {
    return false;
  }
};

module.exports = {
  userRegisterSchema,
  userLoginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
};
