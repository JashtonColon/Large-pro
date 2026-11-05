//To test, run: npx tsx src/testEmail.ts
//Make sure you are in the server dir when running this command
import nodemailer from "nodemailer";
import "dotenv/config";

async function testEmail() {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: process.env.TEST_EMAIL,
      subject: "Study Buddy Finder - Test Email",
      text: "Hello! This is a test email from the Study Buddy Finder backend.",
    });

    console.log("Email submitted successfully!");
    console.log("Message ID:", info.messageId);
  } catch (error) {
    console.error("Failed to send email:", error);
  }
}

testEmail();
