
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/User.js";

async function createTestUser() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    const testEmail = process.env.TEST_EMAIL?.trim().toLowerCase();
    const testPassword = process.env.TEST_USER_PASSWORD;

    if (!mongoUri) {
      throw new Error("MONGODB_URI is missing");
    }

    if (!testEmail || !testPassword) {
      throw new Error(
        "TEST_EMAIL or TEST_USER_PASSWORD is missing"
      );
    }

    if (testPassword.length < 8) {
      throw new Error("Test password must be at least 8 characters");
    }

    await mongoose.connect(mongoUri);

    console.log("Connected database:", mongoose.connection.name);

    // Prevent duplicate test users.
    const existingUser = await User.findOne({
      email: testEmail,
    });

    if (existingUser) {
      console.log("A user with this email already exists.");
      return;
    }

    // Hash the password using the team's bcryptjs settings.
    const hashedPassword = await bcrypt.hash(testPassword, 12);

    // Create a test user in MongoDB.
    await User.create({
      firstName: "Test",
      lastName: "Student",
      email: testEmail,
      password: hashedPassword,
    });

    console.log("Test user created successfully.");
  } catch (error) {
    console.error("Failed to create test user:", error);
  } finally {
    await mongoose.disconnect();
  }
}

createTestUser();
