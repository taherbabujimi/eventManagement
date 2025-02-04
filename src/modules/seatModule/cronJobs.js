const cron = require("node-cron");
const { messages } = require("./messages");
const { Seat } = require("../../models/seat");
const mongoose = require("mongoose");

cron.schedule("* * * * *", async () => {
  let session;
  try {
    session = await mongoose.startSession();
    session.startTransaction();

    let currentTime = Date.now();

    const updateSeatsWithExpiredReservation = await Seat.updateMany(
      {
        status: "reserved",
        reservationExpiry: { $lt: currentTime },
      },
      {
        $set: {
          status: "available",
          userId: null,
          reservationExpiry: null,
          $inc: { version: 1 },
        },
      },
      { session }
    );

    await session.commitTransaction();

    console.log(
      `${messages.ExpriredReservedSeatsUpdatedSuccessfully}: `,
      updateSeatsWithExpiredReservation
    );
  } catch (error) {
    await session.abortTransaction();
    console.log(`${messages.errorWhileCheckingExpiredReservation}: ${error}`);
  } finally {
    session.endSession();
  }
});
