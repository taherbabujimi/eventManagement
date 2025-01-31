const indexRoute = require("express").Router();
const userRoute = require("../modules/userModule/routes");
const eventRoute = require("../modules/eventModule/routes");
const subscriptionRoute = require("../modules/subscriptionModule/routes");

indexRoute.use("/v1/users", userRoute);
indexRoute.use("/v1/events", eventRoute);
indexRoute.use("/v1/subscriptions", subscriptionRoute);

module.exports = indexRoute;
