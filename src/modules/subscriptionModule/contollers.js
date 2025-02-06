const { messages } = require("./messages");
const {
  errorResponseWithoutData,
  successResponseData,
} = require("../../services/responses");
const { purchaseSubscriptionSchema } = require("./validations");
const { Subscription } = require("../../models/subscription");
const { SUBSCRIPTION } = require("../../services/constants");
const moment = require("moment");
const { default: mongoose } = require("mongoose");

const purchaseSubscription = async (req, res) => {
  let session;
  try {
    session = await mongoose.startSession();
    session.startTransaction();

    const validationResponse = purchaseSubscriptionSchema(req.body, res);
    if (validationResponse !== false) return;

    const { subscriptionPlan } = req.body;
    let expiry;
    let subscription;
    let currentDate = Date.now();

    const checkExistingSubscription = await Subscription.findOne({
      userId: req.user._id,
    });

    if (checkExistingSubscription) {
      if (
        checkExistingSubscription.expiry > currentDate &&
        checkExistingSubscription.subscriptionPlan === "oneYear"
      ) {
        return errorResponseWithoutData(
          res,
          messages.userAlreadySubscribed,
          400
        );
      } else if (
        checkExistingSubscription.expiry > currentDate &&
        checkExistingSubscription.subscriptionPlan === "threeMonth" &&
        checkExistingSubscription.remainingEvents !== 0
      ) {
        return errorResponseWithoutData(
          res,
          `${messages.userAlreadySubscribed}, With remaining ${checkExistingSubscription.remainingEvents} events to use`,
          400
        );
      }
    }

    await Subscription.deleteMany({ userId: req.user._id }, { session });

    if (subscriptionPlan === SUBSCRIPTION[0]) {
      expiry = moment(currentDate).add(3, "M");

      subscription = await Subscription.create(
        [
          {
            userId: req.user._id,
            subscriptionPlan,
            purchasedOn: currentDate,
            expiry,
            remainingEvents: 10,
          },
        ],
        { session }
      );
    } else {
      expiry = moment(currentDate).add(1, "year");

      subscription = await Subscription.create(
        [
          {
            userId: req.user._id,
            subscriptionPlan,
            purchasedOn: currentDate,
            expiry,
          },
        ],
        { session }
      );
    }

    if (!subscription) {
      await session.abortTransaction();

      return errorResponseWithoutData(
        res,
        messages.errorPurchaseSubscription,
        400
      );
    }

    await session.commitTransaction();

    return successResponseData(
      res,
      subscription,
      200,
      messages.successPurchaseSubscription
    );
  } catch (error) {
    await session.abortTransaction();

    console.log(messages.errorPurchaseSubscription, error);

    return errorResponseWithoutData(
      res,
      `${messages.errorPurchaseSubscription} : ${error}`,
      400
    );
  } finally {
    await session.endSession();
  }
};

module.exports = {
  purchaseSubscription,
};
