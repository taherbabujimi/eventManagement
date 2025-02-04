const mongoose = require("mongoose");

const connectDB = async function () {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}${process.env.DB_NAME}`
    );
    console.log(
      `MongoDB connected !! DB HOST: ${connectionInstance.connection.host}`
    );
  } catch (error) {
    console.log("MONGODB Connection error: ", error);
    process.exit(1);
  }
};

module.exports = { connectDB };
