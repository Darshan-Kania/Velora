const {app,logger,express}=require('./index');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((req,res,next) => {
  logger.info(`${req.method} ${req.url}`);
  res.on('finish', () => {
    logger.info(`Response status: ${res.statusCode}`);
  });
  next();
});

app.get('/', (req, res) => {
  res.send('Hello, World!').status(200);
});

// Start server
app.listen(8000, () => {
  logger.info('Server started on port 8000');
});
