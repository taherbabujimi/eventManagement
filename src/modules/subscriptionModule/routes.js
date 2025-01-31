const subscriptionRoute = require("express").Router();
const { purchaseSubscription } = require("./contollers");
const { verifyJWT } = require("../../middlewares/authMiddleware");
const { verifyUserType } = require("../../middlewares/checkUsertype");

subscriptionRoute.post(
  "/purchaseSubscription",
  verifyJWT,
  verifyUserType(["eventManager"]),
  purchaseSubscription
);

module.exports = subscriptionRoute;
