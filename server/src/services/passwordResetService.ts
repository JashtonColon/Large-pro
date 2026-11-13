
import User from "../models/User.js";
import AuthToken from "../models/AuthToken.js";
import { generateResetToken } from "../utils/generateResetToken.js";
import { sendPasswordResetEmail } from "./emailService.js";
import bcrypt from "bcryptjs";
import { createHash } from "node:crypto";

const RESET_TOKEN_EXPIRATION_MINUTES = 30;

export async function requestPasswordReset(
  email: string
): Promise<void> {
  // Normalize the email address.
  const normalizedEmail = email.trim().toLowerCase();

  // Look for the user in MongoDB.
  const user = await User.findOne({
    email: normalizedEmail,
  });

  // Don't reveal whether an account exists.
  if (!user) {
    return;
  }

  // Generate a secure random token and its hash.
  const { token, tokenHash } = generateResetToken();

  // Calculate when the token expires.
  const expiresAt = new Date(
    Date.now() + RESET_TOKEN_EXPIRATION_MINUTES * 60 * 1000
  );

  // Remove any previous password reset tokens for this user.
  await AuthToken.deleteMany({
    userId: user._id,
    type: "password_reset",
  });

  // Store the hashed token in MongoDB.
  await AuthToken.create({
    userId: user._id,
    type: "password_reset",
    tokenHash,
    expiresAt,
    attempts: 0,
  });

  // Construct the reset link.
  const frontendUrl =
    process.env.FRONTEND_URL || "http://localhost:5173";

  const resetLink =
    `${frontendUrl}/reset-password?token=${token}`;

  // Email the reset link to the student.
  await sendPasswordResetEmail(normalizedEmail, resetLink);
}

export async function completePasswordReset(
    token: string,
    newPassword: string
): Promise<boolean>{
    //hash token received from link
    const tokenHash = createHash("sha256").update(token).digest("hex");

    //find an unexpired reset token
    const resetToken = await AuthToken.findOne({
        tokenHash,
        type: "password_reset",
        expiresAt: {$gt: new Date()},
    });

    if(!resetToken) return false;

    //Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    //consume the token
    const consumedToken = await AuthToken.findOneAndDelete({
        _id: resetToken._id,
        tokenHash,
        type: "password_reset",
        expiresAt: {$gt: new Date()},
    });

    if(!consumedToken) return false;

    //update password in db
    const updatedUser = await User.findByIdAndUpdate(
        consumedToken.userId,
        {$set: {password: hashedPassword}},
        {new: true}
    );

    if(!updatedUser){
        throw new Error("User not found during password reset");
    }

    await AuthToken.deleteMany({
        userId: consumedToken.userId,
        type: "password_reset",
    });

    return true;
}