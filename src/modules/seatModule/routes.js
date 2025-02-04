const seatRoute = require("express").Router();
const { addSeats, selectSeats } = require("./controllers");
const { verifyJWT } = require("../../middlewares/authMiddleware");
const { verifyUserType } = require("../../middlewares/checkUsertype");

seatRoute.post(
  "/addSeats",
  verifyJWT,
  verifyUserType(["eventManager"]),
  addSeats
);

seatRoute.put(
  "/selectSeats",
  verifyJWT,
  verifyUserType(["attendee"]),
  selectSeats
);

module.exports = seatRoute;
