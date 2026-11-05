
import nodemailer from "nodemailer";
import "dotenv/config";

// Configure Brevo SMTP
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

// Send a 6-digit email verification code
export async function sendVerificationEmail(
  email: string,
  code: string
): Promise<void> {
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: email,
    subject: "Study Buddy Finder - Verify Your Email",
    text: `Welcome to Study Buddy Finder!

Your email verification code is: ${code}

This code expires in 10 minutes.

If you did not create an account, you can ignore this email.`,
  });

  console.log("Verification email submitted successfully");
}

// Send a password reset link
export async function sendPasswordResetEmail(
  email: string,
  resetLink: string
): Promise<void> {
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: email,
    subject: "Study Buddy Finder - Reset Your Password",
    text: `Hello!

We received a request to reset your Study Buddy Finder password.

Click the link below to reset your password:

${resetLink}

If you did not request a password reset, you can ignore this email.`,
  });

  console.log("Password reset email submitted successfully");
}
