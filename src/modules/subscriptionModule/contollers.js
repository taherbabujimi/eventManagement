const { messages } = require("./messages");
const {
  errorResponseWithoutData,
  successResponseData,
} = require("../../services/responses");
const { purchaseSubscriptionSchema } = require("./validations");
const { Subscription } = require("../../models/subscription");
const { SUBSCRIPTION } = require("../../services/constants");
const moment = require("moment");

const purchaseSubscription = async (req, res) => {
  try {
    const validationResponse = purchaseSubscriptionSchema(req.body, res);
    if (validationResponse !== false) return;

    const { subscriptionPlan } = req.body;
    let expiry;
    let purchasedOn = Date.now();

    if (subscriptionPlan === SUBSCRIPTION[0]) {
      expiry = moment(purchasedOn).add(3, "M").add(3, "days");
    }

    const subscription = await Subscription.create({
      userId: req.user._id,
      subscriptionPlan,
      purchasedOn,
      expiry,
    });

    if (!subscription) {
      return errorResponseWithoutData(
        res,
        messages.errorPurchaseSubscription,
        400
      );
    }

    return successResponseData(
      res,
      subscription,
      200,
      messages.successPurchaseSubscription
    );
  } catch (error) {
    console.log(messages.errorPurchaseSubscription, error);

    return errorResponseWithoutData(
      res,
      `${messages.errorPurchaseSubscription} : ${error}`,
      400
    );
  }
};

module.exports = {
  purchaseSubscription,
};
