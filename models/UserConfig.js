import mongoose from "mongoose";

const userConfigSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // one-to-one relationship
    },
    watchExpiration: {
      type: Date, // When Gmail watch expires
    },
    lastHistoryId: {
      type: String, // Last synced history ID
    },
    isWatchActive: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export const UserConfigModel = mongoose.model("UserConfig", userConfigSchema);
