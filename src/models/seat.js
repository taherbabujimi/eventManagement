const mongoose = require("mongoose");
const { Schema } = require("mongoose");
const { STATUS } = require("../services/constants");
const { MODELNAMES } = require("../services/constants");

const seatSchema = new Schema(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: MODELNAMES.event,
      required: true,
    },
    seatNo: {
      type: String,
      required: true,
    },
    row: {
      type: Number,
      required: true,
    },
    column: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: STATUS,
      default: STATUS[0],
    },
    price: {
      type: Number,
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: MODELNAMES.user,
      default: null,
    },
    version: {
      type: Number,
      default: 0,
    },
    reservationExpiry: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

seatSchema.index({ eventId: 1, status: 1 });
seatSchema.index({ eventId: 1, seatNo: 1 }, { unique: true });

const Seat = mongoose.model(MODELNAMES.seat, seatSchema);

module.exports = { Seat };
