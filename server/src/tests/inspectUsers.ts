
import mongoose from "mongoose";
import User from "../models/User.js";

async function inspectUsers() {
  try {
    const mongoUri = process.env.MONGODB_URI;

    if (!mongoUri) {
      throw new Error("MONGODB_URI is missing from .env");
    }

    await mongoose.connect(mongoUri);

    console.log("Connected database:", mongoose.connection.name);

    // Count how many users exist.
    const userCount = await User.countDocuments();

    console.log("Total users:", userCount);

    // Retrieve only email addresses, not passwords.
    const users = await User.find({})
      .select("email -_id")
      .lean();

    console.log("Registered email addresses:");

    for (const user of users) {
      console.log("-", user.email);
    }
  } catch (error) {
    console.error("Failed to inspect users:", error);
  } finally {
    await mongoose.disconnect();
  }
}

inspectUsers();
