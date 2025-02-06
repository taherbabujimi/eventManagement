const mongoose = require("mongoose");
const { Schema } = require("mongoose");
const { MODELNAMES } = require("../services/constants");

const bookingSchema = new Schema(
  {
    userId: {
      type: mongoose.Types.ObjectId,
      ref: MODELNAMES.user,
      required: true,
    },
    eventId: {
      type: mongoose.Types.ObjectId,
      ref: MODELNAMES.event,
      required: true,
    },
    transactionId: {
      type: String,
      required: true,
    },
    seatIds: {
      type: Array,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

const Booking = mongoose.model(MODELNAMES.booking, bookingSchema);

module.exports = { Booking };
