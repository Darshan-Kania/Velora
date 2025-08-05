const express = require('express');
const router = express.Router();
const {registerGmailWatch,handleNotification} = require('../controllers/gmailController');

router.post('/watch', registerGmailWatch);
router.post('/notification', handleNotification);


module.exports = router;
