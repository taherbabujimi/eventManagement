const seatRoute = require("express").Router();
const { addSeats } = require("./controllers");
const { verifyJWT } = require("../../middlewares/authMiddleware");
const { verifyUserType } = require("../../middlewares/checkUsertype");

seatRoute.post(
  "/addSeats",
  verifyJWT,
  verifyUserType(["eventManager"]),
  addSeats
);

module.exports = seatRoute;
