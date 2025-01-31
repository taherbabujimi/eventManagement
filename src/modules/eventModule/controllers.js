const { Event } = require("../../models/event");
const {
  errorResponseWithoutData,
  successResponseData,
} = require("../../services/responses");
const { messages } = require("./messages");
const { addEventSchema } = require("./validations");
const { findOne } = require("./helpers");
const cloudinary = require("cloudinary").v2;

const getUploadSignature = async (req, res) => {
  try {
    const timestamp = new Date().getTime();
    const signature = await cloudinary.utils.api_sign_request(
      {
        timestamp,
      },
      process.env.CLOUDINARY_API_SECRET
    );

    if (!signature) {
      return errorResponseWithoutData(
        res,
        messages.errorSendingUploadSignature,
        400
      );
    }

    return successResponseData(
      res,
      { timestamp: timestamp, signature: signature },
      200
    );
  } catch (error) {
    console.log(messages.errorSendingUploadSignature, error);

    return errorResponseWithoutData(
      res,
      messages.errorSendingUploadSignature,
      400
    );
  }
};

const addEvent = async (req, res) => {
  try {
    const validationResponse = addEventSchema(req.body, res);
    if (validationResponse !== false) return;

    const { name, title, numberOfSeats, dateTime, image } = req.body;

    const existingEvent = await findOne({ title });
    if (existingEvent) {
      return errorResponseWithoutData(res, messages.eventExists, 400);
    }

    const event = await Event.create({
      name,
      title,
      numberOfSeats,
      image,
      dateTime,
      userId: req.user._id,
    });

    if (!event) {
      return errorResponseWithoutData(
        res,
        messages.somethingWentWrongAddingEvent,
        400
      );
    }

    return successResponseData(res, event, 200, messages.addEventSuccess);
  } catch (error) {
    console.log(messages.somethingWentWrongAddingEvent, error);

    return errorResponseWithoutData(
      res,
      messages.somethingWentWrongAddingEvent,
      400
    );
  }
};


module.exports = {
  addEvent,
  getUploadSignature,
};
