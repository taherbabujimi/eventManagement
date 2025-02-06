const mongoose = require("mongoose");
const { Schema } = require("mongoose");
const { EVENTTYPE } = require("../services/constants");
const { MODELNAMES } = require("../services/constants");

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
      ref: MODELNAMES.user,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    eventType: {
      type: String,
      enum: EVENTTYPE,
    },
  },
  { timestamps: true }
);

const Event = mongoose.model(MODELNAMES.event, eventSchema);

module.exports = { Event };
