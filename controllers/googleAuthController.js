const watchGmailInbox = require('../services/watchGmailInbox');

exports.googleAuthController = async (req, res) => {
  try {
    const user = req.user; // assuming set by passport
    const accessToken = user.accessToken;

    // Save token to DB if needed
    // await saveUserToDB(user);

    // 🔁 Auto-register Gmail watch
    await watchGmailInbox(accessToken);

    // Now respond
    res.redirect('/success'); // or send token to frontend if JWT-based
  } catch (error) {
    logger.error('❌ Google OAuth Callback Error:', error);
    res.status(500).send('OAuth processing failed');
  }
};
