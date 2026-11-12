
import User from "../models/User.js";
import AuthToken from "../models/AuthToken.js";
import { generateResetToken } from "../utils/generateResetToken.js";
import { sendPasswordResetEmail } from "./emailService.js";

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
