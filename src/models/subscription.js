const mongoose = require("mongoose");
const { Schema } = require("mongoose");
const { SUBSCRIPTION } = require("../services/constants");

const subscriptionSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    subscriptionPlan: {
      type: String,
      enum: SUBSCRIPTION,
      required: true,
    },
    purchasedOn: {
      type: Date,
      required: true,
    },
    expiry: {
      type: Date,
      required: true,
    },
    remainingEvents: {
      type: Number,
    },
  },
  { timestamps: true }
);

const Subscription = mongoose.model("Subscription", subscriptionSchema);

module.exports = { Subscription };
