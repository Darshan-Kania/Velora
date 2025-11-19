import mongoose from "mongoose";

const replyBackEmailSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    originalEmail: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Email",
      required: false, // Optional: null for composed emails, set for replies
    },
    gmailMessageId: {
      type: String,
      required: true, // ID of the sent reply message
      index: true,
    },
    threadId: {
      type: String,
      required: true, // Same thread as original email
    },
    to: String, // Encrypted
    cc: String, // Encrypted
    bcc: String, // Encrypted
    subject: String, // Encrypted
    body: String, // Encrypted
    sentAt: {
      type: Date,
      default: Date.now,
    },
    isAIGenerated: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export const ReplyBackEmailModel = mongoose.model("ReplyBackEmail", replyBackEmailSchema);
