const mongoose = require("mongoose");
const { Schema } = require("mongoose");
const { SUBSCRIPTION } = require("../services/constants");
const { MODELNAMES } = require("../services/constants");

const subscriptionSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: MODELNAMES.user,
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
  },
  { timestamps: true }
);

const Subscription = mongoose.model(
  MODELNAMES.subscription,
  subscriptionSchema
);

module.exports = { Subscription };
