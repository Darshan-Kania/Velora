const express = require("express");
const passport = require("passport");
const logger = require("../utils/logger");
require("dotenv").config();
const router = express.Router();

router.get(
  "/google",
  passport.authenticate("google", {
    scope: [
      "profile",
      "email",
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/gmail.send",
      "https://www.googleapis.com/auth/gmail.labels",
    ],
  })
);

router.get('/google/callback', passport.authenticate('google', { failureRedirect: '/error401' }), (req, res) => {
  // Successful authentication, redirect or handle the user as desired
  logger.info(`User ${req.user.email} authenticated successfully`);
  res.redirect('/');
});

module.exports = {router};