const joi = require("joi");
const { commonMessages } = require("../../services/commonMessages");
const { errorResponseWithoutData } = require("../../services/responses");

const addEventSchema = (body, res) => {
  const Schema = joi.object({
    name: joi.string().min(3).max(30).required(),
    title: joi.string().min(3).max(30).required(),
    numberOfSeats: joi.number().required(),
    image: joi.string().required(),
    dateTime: joi.date().required(),
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
};

module.exports = {
  addEventSchema,
};
