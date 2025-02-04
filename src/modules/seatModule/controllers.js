const { messages } = require("./messages");
const {
  errorResponseWithoutData,
  successResponseData,
} = require("../../services/responses");
const { Event } = require("../../models/event");
const { addSeatsSchema } = require("./validations");
const { Seat } = require("../../models/seat");

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

const purchaseSeat = async (req, res) => {
  try { 

  } catch (error) {
    console.log(`${errorPurchasingTicket}: ${error}`);

    return errorResponseWithoutData(
      res,
      `${errorPurchasingTicket}: ${error}`,
      400
    );
  }
};

module.exports = {
  addSeats,
};
