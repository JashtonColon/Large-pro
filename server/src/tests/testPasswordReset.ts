//npx tsx src/testPasswordReset.ts
import "dotenv/config";
import { generateResetToken } from "../utils/generateResetToken.js";
import { sendPasswordResetEmail } from "../services/emailService.js";

async function testPasswordReset() {
  const email = process.env.TEST_EMAIL;

  if (!email) {
    throw new Error("TEST_EMAIL is missing from .env");
  }

  const { token, tokenHash } = generateResetToken();

  // This is a test URL. The reset page doesn't exist yet.
  const resetLink =
    `http://localhost:5173/reset-password?token=${token}`;

  console.log("Reset token generated successfully");
  console.log("Token hash generated:", Boolean(tokenHash));

  await sendPasswordResetEmail(email, resetLink);

  console.log("Password reset email submitted successfully!");
}

testPasswordReset().catch(console.error);
