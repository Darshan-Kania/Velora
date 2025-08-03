const express= require('express');
const logger=require('./utils/logger');
const app = express();
app.listen(8000, () => {
  console.log('Server is running on port 8000');
  logger.info('Server started on port 8000');
});
app.get('/', (req, res) => {
  res.send('Hello, World!');
  logger.info('Handled request for /');
});
module.exports = app;