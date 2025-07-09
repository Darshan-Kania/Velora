const express = require("express");
const cors = require("cors");
const env = require("dotenv").config();
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.listen(process.env.PORT,() => {
  console.log(`Server is running on port ${process.env.PORT}`);
});
 