const winston = require('winston');
require('winston-daily-rotate-file');
const moment = require('moment-timezone');

// Log format with IST timezone
const logFormat = winston.format.printf(info => {
  const timestampIST = moment().tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss');
  return `[${timestampIST}] ${info.level.toUpperCase()}: ${info.message}`;
});

// Daily rotating file transport for general logs
const rotateTransport = new winston.transports.DailyRotateFile({
  filename: 'logs/app-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: false,
  maxSize: '10m',
  maxFiles: '14d',
  level: 'info' // handles info, warn, error etc.
});

// Separate file transport for uncaught exceptions
const exceptionTransport = new winston.transports.DailyRotateFile({
  filename: 'logs/exceptions-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: false,
  maxSize: '5m',
  maxFiles: '30d'
});

// Create console transport with error handling
const consoleTransport = new winston.transports.Console({
  handleExceptions: false,
  handleRejections: false
});

// Handle EPIPE errors on console transport
consoleTransport.on('error', (err) => {
  if (err.code === 'EPIPE') {
    // Ignore EPIPE errors (broken pipe)
    return;
  }
  console.error('Console transport error:', err);
});

// Logger instance
const logger = winston.createLogger({
  level: 'info',
  format: logFormat,
  transports: [
    rotateTransport,
    consoleTransport
  ],
  exceptionHandlers: [exceptionTransport],
  rejectionHandlers: [exceptionTransport],
  exitOnError: false // Don't exit on handled exceptions
});

// Handle uncaught exceptions and unhandled rejections more gracefully
process.on('uncaughtException', (error) => {
  if (error.code === 'EPIPE') {
    // Ignore EPIPE errors
    return;
  }
  logger.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

//Export the logger instance
module.exports = logger;
