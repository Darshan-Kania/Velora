const express = require('express');
const passport = require('passport');
const logger = require('./utils/logger');
require('./middleware/passport'); // ✅ Google OAuth Strategy setup

const authRouter = require('./routes/GoogleauthRoutes');
const gmailRouter = require('./routes/GmailRoutes'); 

const app = express();
// Logger Middleware
app.use((req,res,next)=>{
  logger.info("Handling Request from: "+req.url)
  next();
})
// Middleware
app.use(passport.initialize());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/auth', authRouter);
app.use('/gmail', gmailRouter);

app.get('/', (req, res) => {
  res.send('Hello, World!');
});

// Global error handler middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  if (!res.headersSent) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start server
const server = app.listen(8000, () => {
  console.log('Server is running on port 8000');
  logger.info('Server started on port 8000');
});

// Handle server errors
server.on('error', (error) => {
  if (error.code === 'EPIPE') {
    // Ignore EPIPE errors
    return;
  }
  logger.error('Server error:', error);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

module.exports = app;
