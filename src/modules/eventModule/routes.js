const {
  addEvent,
  getUploadSignature,
  getUpcomingEventsByEventManager,
  updateEvent,
  saveEvent,
  getSavedEvents,
  getUpcomingEvents,
  getPastEventsCreatedByEventManager,
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
  getUpcomingEventsByEventManager
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

eventRoute.get(
  "/getSavedEvents",
  verifyJWT,
  verifyUserType(["attendee"]),
  getSavedEvents
);

eventRoute.get(
  "/getUpcomingEvents",
  verifyJWT,
  verifyUserType(["attendee"]),
  getUpcomingEvents
);

eventRoute.get(
  "/getPastEventsByUser",
  verifyJWT,
  verifyUserType(["eventManager"]),
  getPastEventsCreatedByEventManager
);

module.exports = eventRoute;
