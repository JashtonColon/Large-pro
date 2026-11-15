
import { createHmac, timingSafeEqual } from "node:crypto";
import User from "../models/User.js";
import AuthToken from "../models/AuthToken.js";
import { generateVerificationCode } from "../utils/generateVerificationCode.js";
import { sendVerificationEmail } from "./emailService.js";
const CODE_EXPIRATION_MINUTES = 10;
const MAX_VERIFICATION_ATTEMPTS = 5;

export async function requestEmailVerification(
    email: string
): Promise<void>{
    const normalizedEmail = email.trim().toLocaleLowerCase();

    //find in db
    const user = await User.findOne({
        email: normalizedEmail,
    });

    if(!user || user.emailVerified){
        return;
    }

    //generate random 6 digit code
    const code = generateVerificationCode();
    const secret = process.env.VERIFICATION_CODE_SECRET;
    if(!secret){
        throw new Error("VERIFICATION_CODE_SECRET is missing");
    }

    const tokenHash = createHmac("sha256",secret).update(`${user._id}:${code}`).digest("hex");

    //code expires after 10 min
    const expiresAt = new Date(Date.now() + CODE_EXPIRATION_MINUTES * 60 * 1000);

    //remove previous verification codes from this user
    await AuthToken.deleteMany({
        userId: user._id,
        type: "email_verification",
    });

    //store only the protected code
    await AuthToken.create({
        userId: user._id,
        type: "email_verification",
        tokenHash,
        expiresAt,
        attempts: 0,
    });

    await sendVerificationEmail(normalizedEmail, code);

}

export async function verifyEmailCode(
  email: string,
  code: string
): Promise<boolean> {
  const normalizedEmail = email.trim().toLowerCase();

  // Find the student in MongoDB.
  const user = await User.findOne({
    email: normalizedEmail,
  });

  if (!user || user.emailVerified) {
    return false;
  }

  // Find the student's active verification code.
  const verificationToken = await AuthToken.findOne({
    userId: user._id,
    type: "email_verification",
    expiresAt: { $gt: new Date() },
    attempts: { $lt: MAX_VERIFICATION_ATTEMPTS },
  });

  if (!verificationToken) {
    return false;
  }

  // Use the same secret used when generating the code.
  const secret = process.env.VERIFICATION_CODE_SECRET;

  if (!secret) {
    throw new Error("VERIFICATION_CODE_SECRET is missing");
  }

  // Hash the submitted code.
  const submittedHash = createHmac("sha256", secret)
    .update(`${user._id}:${code}`)
    .digest("hex");

  // Compare the hashes securely.
  const expectedBuffer = Buffer.from(
    verificationToken.tokenHash,
    "hex"
  );

  const submittedBuffer = Buffer.from(
    submittedHash,
    "hex"
  );

  const isMatch =
    expectedBuffer.length === submittedBuffer.length &&
    timingSafeEqual(expectedBuffer, submittedBuffer);

  if (!isMatch) {
    // Increment attempts atomically for an incorrect code.
    await AuthToken.updateOne(
      {
        _id: verificationToken._id,
        attempts: { $lt: MAX_VERIFICATION_ATTEMPTS },
      },
      { $inc: { attempts: 1 } }
    );

    return false;
  }

  // Consume the code so it cannot be reused.
  const consumedToken = await AuthToken.findOneAndDelete({
    _id: verificationToken._id,
    tokenHash: submittedHash,
    expiresAt: { $gt: new Date() },
    attempts: { $lt: MAX_VERIFICATION_ATTEMPTS },
  });

  if (!consumedToken) {
    return false;
  }

  // Mark the student's email as verified.
  const updatedUser = await User.findByIdAndUpdate(
    consumedToken.userId,
    { $set: { emailVerified: true } },
    { new: true }
  );

  if (!updatedUser) {
    throw new Error("User not found during email verification");
  }

  return true;
}