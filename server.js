const express = require("express");
const passport = require("passport");
const { logger } = require("./utils/logger");
require("dotenv").config();
require("./middleware/passport");

const app = express();
const authRoutes = require("./routes/authRoutes").router;

// ✅ REQUIRED
app.use(passport.initialize());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  if (req.url !== "/favicon.ico") {
    logger.info(`${req.method} ${req.url}`);
    res.on("finish", () => {
      logger.info(`Response status: ${res.statusCode}`);
    });
  }
  next();
});

app.use("/auth", authRoutes);

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.use((err, req, res, next) => {
  logger.error(`Unhandled error: ${err.stack || err.message || err}`);
  res.status(500).send("Internal Server Error");
});

app.listen(process.env.PORT, () => {
  logger.info(`Server is running on port ${process.env.PORT}`);
});
