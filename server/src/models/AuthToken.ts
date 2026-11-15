
import mongoose, { Schema, model } from "mongoose";

export interface IAuthToken {
  userId: mongoose.Types.ObjectId;
  type: "email_verification" | "password_reset";
  tokenHash: string;
  expiresAt: Date;
  attempts: number;
  createdAt: Date;
}

const authTokenSchema = new Schema<IAuthToken>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },

  type: {
    type: String,
    enum: ["email_verification", "password_reset"],
    required: true,
  },

  tokenHash: {
    type: String,
    required: true,
  },

  expiresAt: {
    type: Date,
    required: true,
  },

  attempts: {
    type: Number,
    default: 0,
    min: 0,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Automatically remove expired token documents.
// MongoDB TTL deletion is asynchronous, so validation must
// still check expiresAt before accepting a token.
authTokenSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 }
);

const AuthToken =
  mongoose.models.AuthToken ||
  model<IAuthToken>(
    "AuthToken",
    authTokenSchema,
    "authTokens"
  );

export default AuthToken;
