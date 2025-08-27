import { google } from "googleapis";
import { logger } from "../utils/logger.js";
import { UserConfigModel } from "../models/UserConfig.js";
import { UserModel } from "../models/User.js";
import { EmailModel } from "../models/Email.js";
import { decodeBase64Url } from "../utils/base64Helper.js";
import { encryptField } from "../utils/encryptHelper.js";
async function startWatch(gmail) {
  return await gmail.users.watch({
    userId: "me",
    requestBody: {
      labelIds: ["INBOX"],
      topicName: process.env.GOOGLE_PUBSUB_TOPIC,
      historyTypes: ["messageAdded"],
    },
  });
}
async function fetchRecentMessages(gmail) {
  const res = await gmail.users.messages.list({
    userId: "me",
    q: "newer_than:7d",
    maxResults: 10,
  });

  const messages = res.data.messages || [];
  logger.info(`📬 Found ${messages.length} recent messages`);
  if (messages.length === 0) {
    logger.info("No recent messages found");
    return [];
  }
  const fullMsg = await gmail.users.messages.get({
    userId: "me",
    id: messages[0].id,
    format: "metadata", // lightweight, still includes historyId
  });
  const firstHistoryId = fullMsg.data.historyId;

  return firstHistoryId;
}

function createOAuth2Client(userData) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_CALLBACK_URL
  );
  logger.info("🔑 Setting OAuth2 credentials");
  oauth2Client.setCredentials({
    access_token: userData.accessToken,
    refresh_token: userData.refreshToken,
  });
  return oauth2Client;
}
/** Save User Configuration */
async function saveUserConfig(email, userConfigObj) {
  try {
    logger.info(`💾 Saving user config for ${email}`);
    // Find user by email
    const user = await UserModel.findOne({ email });
    if (!user) {
      logger.warn(`⚠️ No user found with email: ${email}`);
      throw new Error("User not found");
    }
    // Save or update user config for the user
    const userConfig = await UserConfigModel.findOneAndUpdate(
      { user: user._id },
      { $set: userConfigObj },
      { new: true, upsert: true }
    );
    return userConfig;
  } catch (err) {
    logger.error(`❌ Failed to save user config for ${email}`, {
      error: err.message,
      stack: err.stack,
    });
    throw new Error("User config save failed");
  }
}

/** Start Gmail Service After OAuth Success Detected */
async function startGmailWatchService(userData) {
  try {
    logger.info("🔗 Initializing Gmail API client");
    const oauth2Client = createOAuth2Client(userData);

    const gmail = google.gmail({ version: "v1", auth: oauth2Client });

    // ===== 2. Get current historyId =====
    const profile = await gmail.users.getProfile({ userId: "me" });
    logger.info("📋 Current historyId:", profile.data.historyId);

    // ===== 3. Fetch recent activity log =====
    const historyId = await fetchRecentMessages(gmail);

    // ===== 4. Start Gmail Watch =====
    const watchRes = await startWatch(gmail);
    if (watchRes.data.expiration) {
      logger.info(
        `⏳ Watch expires at: ${new Date(Number(watchRes.data.expiration))}`
      );
    }
    const userConfigObj = {
      watchExpiration: watchRes.data.expiration
        ? new Date(Number(watchRes.data.expiration))
        : null,
      lastHistoryId: historyId, //Will be updated later
      isWatchActive: true,
    };
    const response = await saveUserConfig(userData.email, userConfigObj);
    logger.info(`👤 User config saved for ${userData.email}`, {
      userConfig: response,
    });
    logger.info(`📡 Gmail watch started`, watchRes.data);
  } catch (err) {
    logger.error("❌ Failed to initialize Gmail client", {
      error: err.message,
      stack: err.stack,
    });
  }
}
async function extractDataFromPubSub(req) {
  try {
    logger.info("🔍 Extracting data from Pub/Sub notification");

    // Google Cloud Pub/Sub sends data in this format:
    // { message: { data: "base64-encoded-string", messageId: "...", publishTime: "..." } }
    const pubsubMessage = req.body?.message;

    if (!pubsubMessage) {
      logger.warn("⚠️ No Pub/Sub message found in request body");
      return null;
    }

    if (!pubsubMessage.data) {
      logger.warn("⚠️ No data found in Pub/Sub message");
      return null;
    }

    // Decode the base64 data
    const decodedData = Buffer.from(pubsubMessage.data, "base64").toString(
      "utf8"
    );
    logger.info(`📨 Decoded Pub/Sub data: ${decodedData}`);

    // Parse the JSON data
    const gmailNotification = JSON.parse(decodedData);
    logger.info(
      `📬 Gmail notification details: ${JSON.stringify(
        gmailNotification,
        null,
        2
      )}`
    );

    // Extract important information
    const { emailAddress, historyId } = gmailNotification;
    logger.info(`👤 Email: ${emailAddress}, 📋 New HistoryId: ${historyId}`);

    return {
      email: emailAddress,
      historyId,
      messageId: pubsubMessage.messageId,
      publishTime: pubsubMessage.publishTime,
      rawNotification: gmailNotification,
    };
  } catch (err) {
    logger.error("❌ Failed to extract Pub/Sub data", {
      error: err.message,
      stack: err.stack,
    });
    return null;
  }
}
async function updateUserHistory(email, historyId) {
  try {
    logger.info(`📜 Updating user history for ${email}`);
    const userModel = await UserModel.findOne({ email });
    if (!userModel) {
      logger.warn(`⚠️ No user found with email: ${email}`);
      throw new Error("User not found");
    }
    const userConfigObj = await UserConfigModel.findOne({
      user: userModel._id,
    });
    if (!userConfigObj) {
      logger.warn(`⚠️ No user config found for email: ${email}`);
      throw new Error("User config not found");
    }
    const previousHistoryId = userConfigObj.lastHistoryId;
    userConfigObj.lastHistoryId = historyId;
    await userConfigObj.save();
    logger.info(`✅ User history updated for ${email}`);
    return previousHistoryId;
  } catch (err) {
    logger.error(`❌ Failed to update user history for ${email}`, {
      error: err.message,
      stack: err.stack,
    });
    throw new Error("User history update failed");
  }
}
async function getEmailsBetweenHistoryIds(email, startHistoryId, endHistoryId) {
  try {
    logger.info(
      `📥 Fetching emails between history IDs for ${email} ${startHistoryId}, ${endHistoryId}`,
      {
        email,
        startHistoryId,
        endHistoryId,
      }
    );
    const user = await UserModel.findOne({ email });
    if (!user || !user.accessToken) {
      throw new Error("User not found or missing access token");
    }
    if (!startHistoryId || !endHistoryId) {
      logger.warn("⚠️ Missing start or end history ID");
      return [];
    }
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: user.accessToken });
    const gmail = google.gmail({ version: "v1", auth });
    const historyRes = await gmail.users.history.list({
      userId: "me",
      startHistoryId,
      historyTypes: ["messageAdded"],
      maxResults: 50,
    });
    if (!historyRes.data.history) {
      logger.info("No new history found between IDs", {
        startHistoryId,
        endHistoryId,
      });
      return [];
    }
    try {
      const messages = await extractMessageData(historyRes, gmail, user);
      await storeMessageInDb(user._id, messages);
      return messages;
    } catch (error) {
      logger.error("❌ Failed to extract or store messages", {
        email,
        startHistoryId,
        endHistoryId,
        error: error.message,
        stack: error.stack,
      });
      throw new Error("Failed to extract or store messages");
    }
  } catch (err) {
    logger.error(
      `❌ Failed to fetch emails between history IDs for ${email} ${err.message} ${err.stack}`
    );
    throw new Error("Failed to fetch emails");
  }
}
async function extractMessageData(historyRes, gmail, user) {
  try {
    const messages = []; // Initialize messages array
    for (const record of historyRes.data.history) {
      if (record.messagesAdded) {
        for (const added of record.messagesAdded) {
          const msgId = added.message.id;
          const msgRes = await gmail.users.messages.get({
            userId: "me",
            id: msgId,
            format: "full",
          });

          const payload = msgRes.data.payload || {};
          const headers = payload.headers || [];
          const getHeader = (name) =>
            headers.find((h) => h.name.toLowerCase() === name.toLowerCase())
              ?.value || "";

          let bodyPlain = "";
          let bodyHtml = "";

          if (payload.parts) {
            for (const part of payload.parts) {
              if (part.mimeType === "text/plain" && part.body?.data) {
                bodyPlain += decodeBase64Url(part.body.data);
              }
              if (part.mimeType === "text/html" && part.body?.data) {
                bodyHtml += decodeBase64Url(part.body.data);
              }
            }
          } else if (payload.body?.data) {
            bodyPlain = decodeBase64Url(payload.body.data);
          }

          const emailDoc = {
            user: user._id,
            gmailMessageId: msgId,
            threadId: msgRes.data.threadId,
            historyId: msgRes.data.historyId,
            labelIds: msgRes.data.labelIds,
            from: getHeader("From"),
            to: getHeader("To"),
            subject: getHeader("Subject"),
            snippet: msgRes.data.snippet,
            bodyPlain,
            bodyHtml,
            receivedAt: new Date(getHeader("Date")),
            toSummarize: true,
            isSummarized: false,
            toAutoReply: false,
            isReplyBacked: false,
            isAutoReplied: false,
          };
          const encryptedEmailDoc = encryptionBeforeStoring(emailDoc);
          messages.push(encryptedEmailDoc);
        }
      }
    }
    logger.info(`✅ Retrieved ${messages.length} new emails for ${user.email}`);
    return messages;
  } catch (error) {
    logger.error(`❌ Failed to extract message data ${error.message}`, {
      error: error.message,
      stack: error.stack,
    });
    throw new Error("Failed to extract message data");
  }
}
async function storeMessageInDb(userId, messages) {
  try {
    await EmailModel.insertMany(
      messages.map((msg) => ({ ...msg, user: userId }))
    );
    logger.info(`✅ Stored ${messages.length} emails for user ${userId}`);
  } catch (error) {
    logger.error("❌ Failed to store messages in DB", {
      error: error.message,
      stack: error.stack,
    });
    throw new Error("Failed to store messages in DB");
  }
}
function encryptionBeforeStoring(emailDoc) {
  const fieldsToEncrypt = [
    "from",
    "to",
    "subject",
    "bodyPlain",
    "bodyHtml",
    "snippet",
  ];
  const encryptedDoc = { ...emailDoc };

  for (const field of fieldsToEncrypt) {
    if (encryptedDoc[field]) {
      const encrypted = encryptField(encryptedDoc[field]);
      encryptedDoc[field] = encrypted;
    }
  }
  logger.info("🔒 Encrypted email document");
  return encryptedDoc;
}
export {
  startGmailWatchService,
  extractDataFromPubSub,
  updateUserHistory,
  getEmailsBetweenHistoryIds,
};
