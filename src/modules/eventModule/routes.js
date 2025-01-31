const { addEvent, getUploadSignature } = require("./controllers");
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

module.exports = eventRoute;
