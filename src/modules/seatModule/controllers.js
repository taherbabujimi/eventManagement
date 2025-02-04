const { messages } = require("./messages");
const {
  errorResponseWithoutData,
  successResponseData,
  successResponseWithoutData,
} = require("../../services/responses");
const { Event } = require("../../models/event");
const { addSeatsSchema, selectSeatsSchema } = require("./validations");
const { Seat } = require("../../models/seat");
const mongoose = require("mongoose");

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
        status: "available",
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
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const validationResponse = selectSeatsSchema(req.body, res);
    if (validationResponse !== false) return;

    const { eventId } = req.query;
    const { seatIds } = req.body;

    const seats = await Seat.find({
      _id: { $in: seatIds },
      eventId: eventId,
      status: "available",
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
          status: "available",
          version: seat.version,
        },
        {
          $set: {
            status: "reserved",
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
    return successResponseData(res, updatedSeats, 200, messages.seatsReservedSuccessfully);
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

module.exports = {
  addSeats,
  selectSeats,
};
