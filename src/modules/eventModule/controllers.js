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

    const tickets = [];

    const { name, title, seats, dateTime, image, description, location } =
      req.body;

    console.log("SEATS: ", seats);

    for (let i = 0; i < seats.noOfSeatsInEachRow * seats.noOfRows; i++) {
      const row = Math.floor(i / seats.noOfSeatsInEachRow) + 1;
      tickets.push({
        seatNo: `${i + 1}`,
        row: row,
        column: (i % seats.noOfSeatsInEachRow) + 1,
        status: "available",
        price: seats.amount[row], // Use the price from the amount object
      });
    }

    console.log("TICKETS :", tickets);

    const existingEvent = await findOne({ title });
    if (existingEvent) {
      return errorResponseWithoutData(res, messages.eventExists, 400);
    }

    const event = await Event.create({
      name,
      title,
      seats: tickets,
      image,
      dateTime,
      userId: req.user._id,
      description,
      location,
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

const getUpcomingEvents = async (req, res) => {
  try {
    let { page = 0, limit = 10, sortBy = SORT_BY[0], sortType } = req.query;

    if (page !== 0 && page !== "0") {
      page -= 1;
    }

    if (!SORT_BY.includes(sortBy)) {
      sortBy = SORT_BY[0];
    }

    sortType = sortType === "desc" ? -1 : 1;

    const currentDate = Date.now();

    const upcomingEvents = await Event.find({ dateTime: { $gt: currentDate } })
      .limit(limit)
      .skip(page * limit);

    if (!upcomingEvents) {
      return successResponseWithoutData(res, messages.noUpcomingEvents, 200);
    }

    return successResponseData(
      res,
      upcomingEvents,
      200,
      messages.fetchedUpcomingEvents
    );
  } catch (error) {
    console.log(`${messages.errorGettingUpcomingEvents}: ${error}`);

    errorResponseWithoutData(
      res,
      `${messages.errorGettingUpcomingEvents}: ${error}`,
      400
    );
  }
};

const getUpcomingEventsByEventManager = async (req, res) => {
  try {
    let { page = 0, limit = 10, sortBy = SORT_BY[0], sortType } = req.query;

    if (page !== 0 && page !== "0") {
      page -= 1;
    }

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

const getSavedEvents = async (req, res) => {
  try {
    let { page = 0, limit = 10, sortBy = SORT_BY[0], sortType } = req.query;

    if (page !== 0 && page !== "0") {
      page -= 1;
    }

    if (!SORT_BY.includes(sortBy)) {
      sortBy = SORT_BY[0];
    }

    sortType = sortType === "desc" ? -1 : 1;

    const savedEventsIds = req.user.savedEvents;

    if (savedEventsIds.length === 0) {
      return successResponseWithoutData(res, messages.zeroSavedEvents, 200);
    }

    const savedEvents = await Event.find({ _id: { $in: savedEventsIds } })
      .limit(limit)
      .skip(page * limit)
      .sort({ [sortBy]: sortType });

    if (!savedEvents) {
      return errorResponseWithoutData(
        res,
        messages.errorGettingSavedEvents,
        400
      );
    }

    return successResponseData(
      res,
      savedEvents,
      200,
      messages.successfullyFetchedSavedEvents
    );
  } catch (error) {
    console.log(`${messages.errorGettingSavedEvents} : ${error}`);

    return errorResponseWithoutData(
      res,
      `${messages.errorGettingSavedEvents} : ${error}`,
      400
    );
  }
};

const getPastEventsCreatedByEventManager = async (req, res) => {
  try {
    let { page = 0, limit = 10, sortBy = SORT_BY[0], sortType } = req.query;

    if (page !== 0 && page !== "0") {
      page -= 1;
    }

    if (!SORT_BY.includes(sortBy)) {
      sortBy = SORT_BY[0];
    }

    sortType = sortType === "desc" ? -1 : 1;

    const currentDate = Date.now();

    const eventsCreatedInPast = await Event.find({
      $and: [{ userId: req.user._id }, { dateTime: { $lt: currentDate } }],
    })
      .limit(limit)
      .skip(page * limit)
      .sort({ [sortBy]: sortType });

    if (!eventsCreatedInPast) {
      return successResponseWithoutData(
        res,
        messages.zeroPastEventByManager,
        200
      );
    }

    return successResponseData(
      res,
      eventsCreatedInPast,
      200,
      messages.pastEventByManagerFetchedSuccess
    );
  } catch (error) {
    console.log(`${messages.errorGettingPastEvents}: ${error}`);

    return errorResponseWithoutData(
      res,
      `${messages.errorGettingPastEvents}: ${error}`,
      400
    );
  }
};

module.exports = {
  addEvent,
  getUploadSignature,
  getUpcomingEventsByEventManager,
  updateEvent,
  saveEvent,
  getSavedEvents,
  getUpcomingEvents,
  getPastEventsCreatedByEventManager,
};
