
import "dotenv/config";
import mongoose from "mongoose";
import AuthToken from "../models/AuthToken.js";

async function setupAuthTokenIndexes() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("MONGODB_URI is missing from .env");
  }

  // Avoid automatic index creation before our checks.
  mongoose.set("autoIndex", false);

  await mongoose.connect(uri);

  try {
    const db = mongoose.connection.db;

    if (!db || db.databaseName !== "studybuddy") {
      throw new Error(
        "Expected to connect to the studybuddy database."
      );
    }

    const collection = db.collection("authTokens");

    const count = await collection.countDocuments();

    if (count !== 0) {
      throw new Error(
        "authTokens is no longer empty. Review before proceeding."
      );
    }

    console.log("Connected database:", db.databaseName);
    console.log("Existing token documents:", count);

    // Apply the indexes defined in AuthToken.ts.
    await AuthToken.createIndexes();

    const indexes = await collection.listIndexes().toArray();

    console.log("Indexes after setup:");
    console.log(JSON.stringify(indexes, null, 2));
  } finally {
    await mongoose.disconnect();
  }
}

setupAuthTokenIndexes().catch((error) => {
  console.error("Index setup failed:", error.message);
  process.exitCode = 1;
});
