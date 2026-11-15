
import "dotenv/config";
import mongoose from "mongoose";

async function inspectAuthTokens() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("MONGODB_URI is missing from .env");
  }

  await mongoose.connect(uri);

  try {
    const db = mongoose.connection.db;

    if (!db) {
      throw new Error("MongoDB database connection unavailable");
    }

    console.log("Connected database:", db.databaseName);

    const collection = db.collection("authTokens");

    const count = await collection.countDocuments();
    const indexes = await collection.listIndexes().toArray();

    console.log("Number of documents:", count);
    console.log("Indexes:", JSON.stringify(indexes, null, 2));
  } finally {
    await mongoose.disconnect();
  }
}

inspectAuthTokens().catch((error) => {
  console.error("Inspection failed:", error.message);
  process.exitCode = 1;
});
