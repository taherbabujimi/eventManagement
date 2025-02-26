const { Event } = require("../../models/event");
const {
  errorResponseWithoutData,
  successResponseData,
  successResponseWithoutData,
} = require("../../services/responses");
const { messages } = require("./messages");
const { addEventSchema, updateEventSchema } = require("./validations");
const { findOne } = require("./helpers");
const cloudinary = require("cloudinary").v2;
const { SORT_BY, SORT_TYPE } = require("./constants");
const { User } = require("../../models/user");
const { Subscription } = require("../../models/subscription");
const { SUBSCRIPTION } = require("../../services/constants");

const getUploadSignature = async (req, res) => {
  try {
    const timestamp = new Date().getTime();

    const signature = await cloudinary.utils.sign_request(
      {
        timestamp,
      },
      {
        api_secret: process.env.CLOUDINARY_API_SECRET,
        api_key: process.env.CLOUDINARY_API_KEY,
      }
    );

    return successResponseData(
      res,
      { timestamp: signature.timestamp, signature: signature.signature },
      200
    );
  } catch (error) {
    return errorResponseWithoutData(
      res,
      messages.errorSendingUploadSignature,
      400
    );
  }
};

const addEvent = async (req, res) => {
  try {
    const subscribed = await Subscription.findOne(
      {
        userId: req.user._id,
      },
      {},
      { sort: { createdAt: -1 } }
    );

    const currentDate = Date.now();

    if (!subscribed) {
      let testHours = Math.abs(currentDate - req.user.createdAt) / 36e5;

      if (testHours >= 72) {
        return errorResponseWithoutData(res, messages.trialCompleted, 400);
      }

      const validationResponse = addEventSchema(req.body, res);
      if (validationResponse !== false) return;

      const { name, title, dateTime, image, description, location } = req.body;

      const existingEvent = await findOne({ title });
      if (existingEvent) {
        return errorResponseWithoutData(res, messages.eventExists, 400);
      }

      const event = await Event.create({
        name,
        title,
        image,
        dateTime,
        userId: req.user._id,
        description,
        location,
        eventType: "trial",
      });

      return successResponseData(res, event, 200, messages.addEventSuccess);
    }

    if (subscribed.expiry <= currentDate) {
      return errorResponseWithoutData(res, messages.subscriptionExpired, 400);
    }

    if (subscribed.subscriptionPlan === SUBSCRIPTION[0]) {
      const previousEventCount = await Event.countDocuments({
        userId: req.user._id,
        $and: [
          { createdAt: { $gte: subscribed.purchasedOn } },
          { createdAt: { $lt: subscribed.expiry } },
        ],
      });

      if (previousEventCount === 10) {
        return errorResponseWithoutData(
          res,
          messages.NoOfAllowedEventsCompleted,
          400
        );
      }
    }

    const validationResponse = addEventSchema(req.body, res);
    if (validationResponse !== false) return;

    const { name, title, dateTime, image, description, location } = req.body;

    const existingEvent = await findOne({ title });

    if (existingEvent) {
      return errorResponseWithoutData(res, messages.eventExists, 400);
    }

    const event = await Event.create({
      name,
      title,
      image,
      dateTime,
      userId: req.user._id,
      description,
      location,
    });

    return successResponseData(res, event, 200, messages.addEventSuccess);
  } catch (error) {
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

    page = [0, "0"].indexOf(page) === -1 ? page - 1 : page;

    sortBy = SORT_BY.includes(sortBy) ? sortBy : SORT_BY[0];

    sortType = sortType === SORT_TYPE[0] ? -1 : 1;

    const currentDate = Date.now();

    const upcomingEvents = await Event.find({
      dateTime: { $gt: currentDate },
      eventType: { $ne: "trial" },
    })
      .limit(limit)
      .skip(page * limit);

    return successResponseData(
      res,
      upcomingEvents,
      200,
      messages.fetchedUpcomingEvents
    );
  } catch (error) {
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

    page = [0, "0"].indexOf(page) === -1 ? page - 1 : page;

    sortBy = SORT_BY.includes(sortBy) ? sortBy : SORT_BY[0];

    sortType = sortType === SORT_TYPE[0] ? -1 : 1;

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

    return successResponseData(
      res,
      events,
      200,
      messages.allEventsByUserFetched,
      { count: eventCount }
    );
  } catch (error) {
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

    const { name, title, image, dateTime, description, location } = req.body;

    if (
      name?.trim() === "" ||
      title?.trim() === "" ||
      image?.trim() === "" ||
      description?.trim() === "" ||
      location?.trim() === "" ||
      dateTime?.trim() === ""
    ) {
      return errorResponseWithoutData(res, messages.valueCannotBeEmpty, 400);
    }

    const event = await Event.findByIdAndUpdate(
      eventId,
      {
        name,
        title,
        image,
        dateTime,
        description,
        location,
      },
      { new: true }
    );

    return successResponseData(
      res,
      event,
      200,
      messages.userUpdatedSuccessfully
    );
  } catch (error) {
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

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        $push: { savedEvents: eventId },
      },
      { new: true }
    );

    return successResponseWithoutData(res, messages.successSavingEvent, 200);
  } catch (error) {
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

    page = [0, "0"].indexOf(page) === -1 ? page - 1 : page;

    sortBy = SORT_BY.includes(sortBy) ? sortBy : SORT_BY[0];

    sortType = sortType === SORT_TYPE[0] ? -1 : 1;

    const savedEventsIds = req.user.savedEvents;

    if (savedEventsIds.length === 0) {
      return successResponseWithoutData(res, messages.zeroSavedEvents, 200);
    }

    const savedEvents = await Event.find({ _id: { $in: savedEventsIds } })
      .limit(limit)
      .skip(page * limit)
      .sort({ [sortBy]: sortType });

    return successResponseData(
      res,
      savedEvents,
      200,
      messages.successfullyFetchedSavedEvents
    );
  } catch (error) {
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

    page = ([0, '0'].indexOf(page) === -1) ? page - 1 : page;

    sortBy = SORT_BY.includes(sortBy) ? sortBy : SORT_BY[0];

    sortType = sortType === SORT_TYPE[0] ? -1 : 1;

    const currentDate = Date.now();

    const eventsCreatedInPast = await Event.find({
      $and: [{ userId: req.user._id }, { dateTime: { $lt: currentDate } }],
    })
      .limit(limit)
      .skip(page * limit)
      .sort({ [sortBy]: sortType });

    if (eventsCreatedInPast.length === 0) {
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
