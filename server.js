const express = require("express");
const connectDb=require("./utils/dbConn")
const { logger } = require("./utils/logger");
require("dotenv").config();
const passport = require("passport");
require("./middleware/passport");
const { router: authRoutes } = require("./routes/authRoutes");

const app = express();
connectDb();
// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Initialize Passport
app.use(passport.initialize());

// Logging middleware
app.use((req, res, next) => {
  if (req.url !== "/favicon.ico") {
    logger.info(`${req.method} ${req.url}`);
    res.on("finish", () => {
      logger.info(`↩️ Response status: ${res.statusCode}`);
    });
  }
  next();
});

// Routes
app.use("/auth", authRoutes);

app.get("/", (req, res) => {
  logger.info("👋 Root endpoint hit");
  res.status(200).send("Hello World");
});

// Error Handler
app.use((err, req, res, next) => {
  logger.error("❌ Unhandled error: " + (err.stack || err.message || err));
  res.status(500).send("Internal Server Error");
});

app.listen(process.env.PORT || 8000, () => {
  logger.info(`🚀 Server is running on port ${process.env.PORT || 8000}`);
});
