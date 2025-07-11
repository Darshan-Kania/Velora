// Imports
const express = require("express");
const cors = require("cors");
const session = require("express-session");
const passport = require("passport");
const authRoute=require("./routes/auth")
require("dotenv").config();
require("./service/googleAuth"); 
// Initialize Express app
const app = express();
// Middlewares or Pluggins
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
// Initializing Passport
app.use(
  session({
    secret: process.env.GOOGLE_SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());

// Auth Route
app.use("/auth",authRoute)
// Webhook
app.use("/webhook", require("./routes/webhook"));
// Listener
app.listen(process.env.PORT,() => {
  console.log(`Server is running on port ${process.env.PORT}`);
});
  
 