const express = require('express');
const passport = require('passport');
const logger = require('./utils/logger');
require('./middleware/passport'); // ✅ Google OAuth Strategy setup

const authRouter = require('./routes/GoogleauthRoutes');
const gmailRouter = require('./routes/GmailRoutes'); 

const app = express();

// Middleware
app.use(passport.initialize());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/auth', authRouter);
app.use('/gmail', gmailRouter);

app.get('/', (req, res) => {
  res.send('Hello, World!');
  logger.info('Handled request for /');
});

// Start server
app.listen(8000, () => {
  console.log('Server is running on port 8000');
  logger.info('Server started on port 8000');
});

module.exports = app;
