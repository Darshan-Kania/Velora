import mongoose from "mongoose";

const emailSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    gmailMessageId: {
      type: String,
      required: true,
      index: true,
    },
    threadId: {
      type: String,
    },
    historyId: {
      type: String,
    },
    labelIds: [String],
    from: String,
    to: String,
    subject: String,
    snippet: String,
    bodyPlain: String,
    bodyHtml: String,
    receivedAt: Date,
    toSummarize: {
      type: Boolean,
      default: true,
    },
    isSummarized: {
      type: Boolean,
      default: false,
    },
    toAutoReply: {
      type: Boolean,
      default: false,
    },
    isReplyBacked: {
      type: Boolean,
      default: false,
    },
    isAutoReplied: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export const EmailModel = mongoose.model("Email", emailSchema);
