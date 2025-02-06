const { messages } = require("./messages");
const {
  errorResponseWithoutData,
  successResponseData,
  successResponseWithoutData,
} = require("../../services/responses");
const { STATUS } = require("../../services/constants");
const { Event } = require("../../models/event");
const { Booking } = require("../../models/booking");
const { addSeatsSchema, selectSeatsSchema } = require("./validations");
const { Seat } = require("../../models/seat");
const { User } = require("../../models/user");
const mongoose = require("mongoose");
const path = require("path");
const pug = require("pug");
const fs = require("fs");
const { emailTransport } = require("../../services/mailTransport");
const { paymentRefundSubject } = require("./constants");

const addSeats = async (req, res) => {
  try {
    const validationResponse = addSeatsSchema(req.body, res);
    if (validationResponse !== false) return;

    const { eventId } = req.query;

    const eventExists = await Event.findOne({
      $and: [{ _id: eventId }, { userId: req.user._id }],
    });

    if (!eventExists) {
      return errorResponseWithoutData(res, messages.userDoesNotHaveEvent, 400);
    }

    const { noOfRows, noOfSeatsInEachRow, amount } = req.body;

    const tickets = [];

    for (let i = 0; i < noOfSeatsInEachRow * noOfRows; i++) {
      const row = Math.floor(i / noOfSeatsInEachRow) + 1;
      tickets.push({
        eventId,
        seatNo: `${i + 1}`,
        row: row,
        column: (i % noOfSeatsInEachRow) + 1,
        status: STATUS[0],
        price: amount[row],
      });
    }

    const seat = await Seat.create(tickets);

    if (!seat) {
      return errorResponseWithoutData(res, messages.errorAddingSeats, 400);
    }

    return successResponseData(res, seat, 200, messages.seatsAddedSuccessfully);
  } catch (error) {
    console.log(`${messages.errorAddingSeats}: ${error}`);

    return errorResponseWithoutData(
      res,
      `${messages.errorAddingSeats}: ${error}`,
      400
    );
  }
};

const selectSeats = async (req, res) => {
  let session;

  try {
    session = await mongoose.startSession();
    session.startTransaction();

    const validationResponse = selectSeatsSchema(req.body, res);
    if (validationResponse !== false) return;

    const { eventId } = req.query;
    const { seatIds } = req.body;

    const seats = await Seat.find({
      _id: { $in: seatIds },
      eventId: eventId,
      status: STATUS[0],
    }).session(session);

    if (seats.length !== seatIds.length) {
      await session.abortTransaction();
      return errorResponseWithoutData(res, messages.seatsNotAvailable, 401);
    }

    const expiryTime = new Date(Date.now() + 15 * 60 * 1000);

    const updateSeatsPromises = seats.map((seat) =>
      Seat.findOneAndUpdate(
        {
          _id: seat._id,
          eventId: eventId,
          status: STATUS[0],
          version: seat.version,
        },
        {
          $set: {
            status: STATUS[2],
            userId: req.user._id,
            reservationExpiry: expiryTime,
          },
          $inc: { version: 1 },
        },
        {
          new: true,
          session: session,
        }
      )
    );

    const updatedSeats = await Promise.all(updateSeatsPromises);

    if (updatedSeats.some((seat) => !seat)) {
      await session.abortTransaction();
      return errorResponseWithoutData(res, messages.failedToReserveSeats, 401);
    }

    await session.commitTransaction();
    return successResponseData(
      res,
      updatedSeats,
      200,
      messages.seatsReservedSuccessfully
    );
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

// const createCheckoutSession = async (req, res) => {};

const bookSeats = async (req, res) => {
  let session;
  try {
    session = await mongoose.startSession();
    session.startTransaction();

    const { userId, eventId, amount, transactionId, seatIds } = req.query;
    const seatIdArray = JSON.parse(seatIds);

    const booking = await Booking.create(
      [
        {
          seatIds: seatIdArray,
          userId,
          eventId,
          amount,
          transactionId,
        },
      ],
      { session }
    );

    if (!booking) {
      await session.abortTransaction();
      return errorResponseWithoutData(res, messages.errorBookingSeats, 400);
    }

    const updateSeatStatus = seatIdArray.map((seatId) =>
      Seat.findOneAndUpdate(
        {
          _id: seatId,
          status: { $ne: STATUS[1] },
          eventId: eventId,
          userId: userId,
        },
        {
          $set: {
            status: STATUS[1],
            reservationExpiry: null,
          },
        },
        {
          new: true,
          session: session,
        }
      )
    );

    const updatedSeats = await Promise.all(updateSeatStatus);

    console.log("Updated Seats: ", updatedSeats);

    if (updatedSeats.some((seat) => !seat)) {
      const user = await User.findById(userId);

      await session.abortTransaction();

      const htmlPath = path.join(__dirname, "./view/paymentRefund.html");

      const html = fs.readFileSync(htmlPath, "utf-8");

      errorResponseWithoutData(res, messages.seatsAlreadyBooked, 400);

      await emailTransport(
        process.env.ADMIN_EMAIL,
        user.email,
        paymentRefundSubject,
        html
      );

      return;
    }

    await session.commitTransaction();
    return successResponseData(res, booking, 200, messages.bookingSuccessfull);
  } catch (error) {
    if (session) {
      await session.abortTransaction();
    }
    console.log(`${messages.errorBookingSeats}: ${error}`);
    return errorResponseWithoutData(
      res,
      `${messages.errorBookingSeats}: ${error}`,
      400
    );
  } finally {
    if (session) {
      session.endSession();
    }
  }
};

module.exports = {
  addSeats,
  selectSeats,
  bookSeats,
};
