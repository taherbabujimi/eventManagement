const joi = require("joi");
const { commonMessages } = require("../../services/commonMessages");
const { errorResponseWithoutData } = require("../../services/responses");
const { SUBSCRIPTION } = require("../../services/constants");

const purchaseSubscriptionSchema = (body, res) => {
  try {
    const Schema = joi.object({
      subscriptionPlan: joi.string().valid(...SUBSCRIPTION),
    });

    const validationResult = Schema.validate(body);

    if (validationResult.error) {
      return errorResponseWithoutData(
        res,
        `${commonMessages.errorWhileValidatingValues} : ${validationResult.error}`,
        400
      );
    } else {
      return false;
    }
  } catch (error) {
    console.log(`${commonMessages.errorWhileValidatingValues} : ${error}`);

    return errorResponseWithoutData(
      res,
      `${commonMessages.errorWhileValidatingValues} : ${error}`,
      400
    );
  }
};

module.exports = {
  purchaseSubscriptionSchema,
};
