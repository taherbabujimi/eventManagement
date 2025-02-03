const {
  addEvent,
  getUploadSignature,
  getUpcomingEventsByUser,
  updateEvent,
  saveEvent,
} = require("./controllers");
const { verifyJWT } = require("../../middlewares/authMiddleware");
const { verifyUserType } = require("../../middlewares/checkUsertype");
const eventRoute = require("express").Router();

eventRoute.get(
  "/getUploadSignature",
  verifyJWT,
  verifyUserType(["eventManager"]),
  getUploadSignature
);

eventRoute.post(
  "/addEvent",
  verifyJWT,
  verifyUserType(["eventManager"]),
  addEvent
);

eventRoute.get(
  "/getUpcomingEventsByUser",
  verifyJWT,
  verifyUserType(["eventManager"]),
  getUpcomingEventsByUser
);

eventRoute.put(
  "/updateEvent",
  verifyJWT,
  verifyUserType(["eventManager"]),
  updateEvent
);

eventRoute.post(
  "/saveEvent",
  verifyJWT,
  verifyUserType(["attendee"]),
  saveEvent
);

module.exports = eventRoute;
