const joi = require("joi");
const { commonMessages } = require("../../services/commonMessages");
const { errorResponseWithoutData } = require("../../services/responses");

const addEventSchema = (body, res) => {
  try {
    const Schema = joi.object({
      name: joi.string().min(3).max(30).required(),
      title: joi.string().min(3).max(30).required(),
      image: joi.string().required(),
      dateTime: joi.date().required().greater(Date.now()),
      description: joi.string().required(),
      location: joi.string().required(),
    });

    const validationResult = Schema.validate(body);

    if (validationResult.error) {
      return errorResponseWithoutData(
        res,
        `${commonMessages.errorWhileValidatingValues}: ${validationResult.error}`,
        400
      );
    } else {
      return false;
    }
  } catch (error) {
    return errorResponseWithoutData(
      res,
      `${commonMessages.errorWhileValidatingValues}: ${error}`,
      400
    );
  }
};

const updateEventSchema = (body, res) => {
  try {
    const Schema = joi.object({
      name: joi.string().min(3).max(30),
      title: joi.string().min(3).max(30),
      description: joi.string().min(3),
      location: joi.string().min(3),
      image: joi.string(),
      dateTime: joi.date(),
    });

    const validationResult = Schema.validate(body);

    if (validationResult.error) {
      return errorResponseWithoutData(
        res,
        `${commonMessages.errorWhileValidatingValues}: ${validationResult.error}`,
        400
      );
    } else {
      return false;
    }
  } catch (error) {
    return errorResponseWithoutData(
      res,
      `${commonMessages.errorWhileValidatingValues}: ${error}`,
      400
    );
  }
};

module.exports = {
  addEventSchema,
  updateEventSchema,
};
