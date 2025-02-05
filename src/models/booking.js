const mongoose = require("mongoose");
const { Schema } = require("mongoose");

const bookingSchema = new Schema(
  {
    userId: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: true,
    },
    eventId: {
      type: mongoose.Types.ObjectId,
      ref: "Event",
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

const Booking = mongoose.model("Booking", bookingSchema);

module.exports = { Booking };
