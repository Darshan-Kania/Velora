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
  zippedArchive: true,
  maxSize: '5m',
  maxFiles: '30d'
});

// Logger instance
const logger = winston.createLogger({
  level: 'info',
  format: logFormat,
  transports: [
    rotateTransport,
    new winston.transports.Console()
  ],
  exceptionHandlers: [exceptionTransport],
  rejectionHandlers: [exceptionTransport]
});

//Export the logger instance
module.exports = {logger};
