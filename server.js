import express, { json } from "express";
import connectDb from "./utils/dbConn.js";
import "dotenv/config";
import passport from "passport";
import cookieParser from "cookie-parser";
import "./middleware/passport.js";
import { logger } from "./utils/logger.js";
import { authRoutes } from "./routes/authRoutes.js";
import { gmailRoutes } from "./routes/gmailRoutes.js";

const app = express();
connectDb();
// Middleware
app.use(cookieParser());
// Initialize Passport
app.use(express.json());
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
app.use("/gmail", express.json(), gmailRoutes);
app.get("/", (req, res) => {
  logger.info("👋 Root endpoint hit");
  res.status(200).send("Hello World");
});
app.get("/health", (req, res) => {
  try {
    logger.info("🩺 Health check endpoint hit");
    res.status(200).send("Server is healthy");
  } catch (err) {
    logger.error("❌ Health check error: " + (err.stack || err.message || err));
    res.status(500).send("Health check failed");
  }
});

// Error Handler
app.use((err, req, res, next) => {
  logger.error("❌ Unhandled error: " + (err.stack || err.message || err));
  res.status(500).send("Internal Server Error");
});

app.listen(process.env.PORT, () => {
  logger.info(`🚀 Server is running on port ${process.env.PORT}`);
});
