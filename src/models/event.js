const mongoose = require("mongoose");
const { Schema } = require("mongoose");

const eventSchema = new Schema(
  {
    name: {
      type: String,
      unique: true,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    numberOfSeats: {
      type: Number,
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
    dateTime: {
      type: Date,
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

const Event = mongoose.model("Event", eventSchema);

module.exports = { Event };
