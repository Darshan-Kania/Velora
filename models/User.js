import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    // OAuth tokens
    accessToken: {
      type: String,
    },
    refreshToken: {
      type: String,
    },
    expiresAt: {
      type: Date, // Access token expiry
    },
    // JWT for your own app
    jwtToken: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export const UserModel = mongoose.model("User", userSchema);
