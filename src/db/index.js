const mongoose = require("mongoose");
const { commonMessages } = require("../services/commonMessages");

const connectDB = async function () {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}${process.env.DB_NAME}`
    );
    console.log(
      `${commonMessages.serverConnected}${connectionInstance.connection.host}`
    );
  } catch (error) {
    console.log(commonMessages.connectingServerError, error);
    process.exit(1);
  }
};

module.exports = { connectDB };
