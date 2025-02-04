const indexRoute = require("express").Router();
const userRoute = require("../modules/userModule/routes");
const eventRoute = require("../modules/eventModule/routes");
const subscriptionRoute = require("../modules/subscriptionModule/routes");
const seatRoute = require("../modules/seatModule/routes");

indexRoute.use("/v1/users", userRoute);
indexRoute.use("/v1/events", eventRoute);
indexRoute.use("/v1/subscriptions", subscriptionRoute);
indexRoute.use("/v1/seats", seatRoute);

module.exports = indexRoute;
