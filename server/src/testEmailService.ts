
import { sendVerificationEmail } from "./services/emailService.js";
import { generateVerificationCode } from "./utils/generateVerificationCode.js";
import "dotenv/config";

async function test() {
  const email = process.env.TEST_EMAIL;

  if (!email) {
    throw new Error("TEST_EMAIL is missing from .env");
  }

  const code = generateVerificationCode();

  console.log("Generated verification code:", code);

  try {
    await sendVerificationEmail(email, code);
    console.log("Test completed successfully!");
  } catch (error) {
    console.error("Test failed:", error);
  }
}

test();
