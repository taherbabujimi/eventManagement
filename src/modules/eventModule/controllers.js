const { Event } = require("../../models/event");
const {
  errorResponseWithoutData,
  successResponseData,
  errorResponseData,
  successResponseWithoutData,
} = require("../../services/responses");
const { messages } = require("./messages");
const { addEventSchema, updateEventSchema } = require("./validations");
const { findOne } = require("./helpers");
const cloudinary = require("cloudinary").v2;
const { SORT_BY } = require("./constants");
const { User } = require("../../models/user");

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

const getUpcomingEventsByUser = async (req, res) => {
  try {
    let { page = 0, limit = 10, sortBy = SORT_BY[0], sortType } = req.query;
    page -= 1;

    if (!SORT_BY.includes(sortBy)) {
      sortBy = SORT_BY[0];
    }

    sortType = sortType === "desc" ? -1 : 1;

    const eventCount = await Event.find({
      userId: req.user.id,
      dateTime: { $gt: Date.now() },
    }).countDocuments();

    const events = await Event.find({
      userId: req.user.id,
      dateTime: { $gt: Date.now() },
    })
      .limit(limit)
      .skip(page * limit)
      .sort({ [sortBy]: sortType });

    if (!events) {
      return errorResponseWithoutData(
        res,
        messages.errorGettingUpcomingEventByUser,
        400
      );
    }

    return successResponseData(
      res,
      events,
      400,
      messages.allEventsByUserFetched,
      { count: eventCount }
    );
  } catch (error) {
    console.log(`${messages.errorGettingUpcomingEventByUser} : ${error}`);

    return errorResponseWithoutData(
      res,
      `${messages.errorGettingUpcomingEventByUser} : ${error}`,
      400
    );
  }
};

const updateEvent = async (req, res) => {
  try {
    const validationResponse = updateEventSchema(req.body, res);
    if (validationResponse !== false) return;

    const { eventId } = req.query;

    const checkEvent = await Event.findOne({
      $and: [{ userId: req.user._id }, { _id: eventId }],
    });

    if (!checkEvent) {
      return errorResponseWithoutData(res, messages.eventAccessNotAllowed, 400);
    }

    const { name, title, numberOfSeats, image, dateTime } = req.body;

    if (
      name?.trim() === "" ||
      title?.trim() === "" ||
      numberOfSeats?.trim() === "" ||
      image?.trim() === "" ||
      dateTime?.trim() === ""
    ) {
      return errorResponseWithoutData(res, messages.valueCannotBeEmpty, 400);
    }

    const event = await Event.findByIdAndUpdate(
      eventId,
      {
        name,
        title,
        numberOfSeats,
        image,
        dateTime,
      },
      { new: true }
    );

    if (!event) {
      return errorResponseWithoutData(res, messages.errorUpdatingEvent, 400);
    }

    return successResponseData(
      res,
      event,
      200,
      messages.userUpdatedSuccessfully
    );
  } catch (error) {
    console.log(`${messages.errorUpdatingEvent}: ${error}`);

    return errorResponseWithoutData(
      res,
      `${messages.errorUpdatingEvent}: ${error}`,
      400
    );
  }
};

const saveEvent = async (req, res) => {
  try {
    const { eventId } = req.query;

    const eventExists = await Event.findOne({ _id: eventId });

    if (!eventExists) {
      return errorResponseWithoutData(res, messages.eventNotExists, 400);
    }

    const eventAlreadySaved = await User.findOne({
      $and: [{ _id: req.user._id }, { savedEvents: { $in: eventId } }],
    });

    if (eventAlreadySaved !== null) {
      return successResponseWithoutData(res, messages.eventAlreadySaved, 200);
    }

    console.log("Already Saved : ", eventAlreadySaved);

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        $push: { savedEvents: eventId },
      },
      { new: true }
    );

    if (!user) {
      return errorResponseWithoutData(res, messages.errorSavingEvent, 400);
    }

    return successResponseWithoutData(res, messages.successSavingEvent, 200);
  } catch (error) {
    console.log(`${messages.errorSavingEvent}: ${error}`);

    return errorResponseWithoutData(
      res,
      `${messages.errorSavingEvent}: ${error}`,
      400
    );
  }
};

module.exports = {
  addEvent,
  getUploadSignature,
  getUpcomingEventsByUser,
  updateEvent,
  saveEvent,
};
