const { messages } = require("./messages");
const {
  errorResponseWithoutData,
  successResponseData,
} = require("../../services/responses");
const { purchaseSubscriptionSchema } = require("./validations");
const { Subscription } = require("../../models/subscription");
const { Event } = require("../../models/event");
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

    const checkExistingSubscription = await Subscription.findOne(
      {
        userId: req.user._id,
      },
      {},
      { sort: { createdAt: -1 } }
    );

    if (checkExistingSubscription) {
      if (
        checkExistingSubscription.expiry > currentDate &&
        checkExistingSubscription.subscriptionPlan === SUBSCRIPTION[1]
      ) {
        return errorResponseWithoutData(
          res,
          messages.userAlreadySubscribed,
          400
        );
      } else if (
        checkExistingSubscription.expiry > currentDate &&
        checkExistingSubscription.subscriptionPlan === SUBSCRIPTION[0]
      ) {
        const previousEventCount = await Event.countDocuments({
          userId: req.user._id,
          $and: [
            { createdAt: { $gte: checkExistingSubscription.purchasedOn } },
            { createdAt: { $lt: checkExistingSubscription.expiry } },
          ],
        });

        console.log("PREVIUOS EVENT COUNTS: ", previousEventCount);

        if (previousEventCount !== 10 && subscriptionPlan === SUBSCRIPTION[0]) {
          return errorResponseWithoutData(
            res,
            `${messages.userAlreadySubscribed}, With remaining ${
              10 - previousEventCount
            } events to use`,
            400
          );
        }
      }
    }

    if (subscriptionPlan === SUBSCRIPTION[0]) {
      expiry = moment(currentDate).add(3, "M");

      subscription = await Subscription.create({
        userId: req.user._id,
        subscriptionPlan,
        purchasedOn: currentDate,
        expiry,
      });
    } else {
      expiry = moment(currentDate).add(1, "year");

      subscription = await Subscription.create({
        userId: req.user._id,
        subscriptionPlan,
        purchasedOn: currentDate,
        expiry,
      });
    }

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
