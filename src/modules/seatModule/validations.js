const joi = require("joi");
const { commonMessages } = require("../../services/commonMessages");
const { errorResponseWithoutData } = require("../../services/responses");

const addSeatsSchema = (body, res) => {
  try {
    const Schema = joi.object({
      noOfRows: joi.number().required(),
      noOfSeatsInEachRow: joi.number().required(),
      amount: joi.object().length(body.noOfRows).required(),
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

const selectSeatsSchema = (body, res) => {
  try {
    const Schema = joi.object({
      seatIds: joi.array().required(),
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

module.exports = { addSeatsSchema, selectSeatsSchema };
