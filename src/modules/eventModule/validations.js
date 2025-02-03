const joi = require("joi");
const { commonMessages } = require("../../services/commonMessages");
const { errorResponseWithoutData } = require("../../services/responses");

const addEventSchema = (body, res) => {
  try {
    const Schema = joi.object({
      name: joi.string().min(3).max(30).required(),
      title: joi.string().min(3).max(30).required(),
      numberOfSeats: joi.number().required(),
      image: joi.string().required(),
      dateTime: joi.date().required().greater(Date.now()),
      description: joi.string().required(),
      location: joi.string().required(),
    });

    const validationResult = Schema.validate(body);

    if (validationResult.error) {
      console.log(
        commonMessages.errorWhileValidatingValues,
        validationResult.error
      );

      return errorResponseWithoutData(
        res,
        `${commonMessages.errorWhileValidatingValues}: ${validationResult.error}`,
        400
      );
    } else {
      return false;
    }
  } catch (error) {
    console.log(`${commonMessages.errorWhileValidatingValues}: ${error}`);

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
      numberOfSeats: joi.number(),
      image: joi.string(),
      dateTime: joi.date(),
    });

    const validationResult = Schema.validate(body);

    if (validationResult.error) {
      console.log(
        `${commonMessages.errorWhileValidatingValues}: ${validationResult.error}`
      );

      return errorResponseWithoutData(
        res,
        `${commonMessages.errorWhileValidatingValues}: ${validationResult.error}`,
        400
      );
    } else {
      return false;
    }
  } catch (error) {
    console.log(`${commonMessages.errorWhileValidatingValues}: ${error}`);

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
