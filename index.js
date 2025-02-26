const express = require("express");
const dotenv = require("dotenv");
const { connectDB } = require("./src/db/index");
const app = express();
const indexRoute = require("./src/routers/indexRoute");

require("dotenv").config({ path: `.env.${process.env.NODE_ENV}` });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS permission
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  next();
});

app.use("/", indexRoute);

require.main === module
  ? connectDB()
      .then(() => {
        app.on("error", (error) => {
          console.log("ERROR: ", error);
          throw error;
        });

        app.listen(process.env.PORT || 3000, () => {
          console.log(
            `Server is running at PORT: ${process.env.PORT}, MODE: ${process.env.NODE_ENV}`
          );
        });
      })
      .catch((error) => {
        console.log("MONGODB connection failed !!!", error);
      })
  : null;

module.exports = { app, connectDB };
