// Imports
const express = require("express");
const { logger } = require("./utils/logger");
const passport = require("passport");
require("dotenv").config();
// Import passport configuration to register strategies
require("./middleware/passport");
const app = express();
// Routes
const authRoutes = require("./routes/authRoutes").router;
// Middleware
app.use(passport.initialize());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
  if (req.url != "/favicon.ico") {
    logger.info(`${req.method} ${req.url}}`);
    res.on("finish", () => {
      logger.info(`Response status: ${res.statusCode}`);
    });
  }
  next();
});

// Routes
app.use("/auth", authRoutes);
app.get("/", (req, res) => {
  res.send("Hello World").status(200);
});


app.use((err, req, res, next) => {
  logger.error(`Unhandled error: ${err.stack || err.message || err}`);
  res.status(500).send("Internal Server Error");
});
app.listen(process.env.PORT, () => {
  logger.info(`Server is running on port ${process.env.PORT}`);
});
