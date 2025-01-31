const express = require("express");
const dotenv = require("dotenv");
const { connectDB } = require("./src/db/index");
const app = express();
const indexRoute = require("./src/routers/indexRoute");

dotenv.config({
  path: "./.env",
});

// For parsing the express payloads
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

connectDB()
  .then(() => {
    app.on("error", (error) => {
      console.log("ERROR: ", error);
      throw error;
    });

    app.listen(process.env.PORT || 3000, () => {
      console.log(`Server is running at PORT: ${process.env.PORT}`);
    });
  })
  .catch((error) => {
    console.log("MONGODB connection failed !!!", error);
  });
