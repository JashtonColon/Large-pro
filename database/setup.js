const { MongoClient } = require("mongodb");

async function main() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("MONGODB_URI is missing. Load your .env file.");
  }

  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 10000
  });

  try {
    await client.connect();
    const db = client.db("studybuddy");

    const collectionNames = [
      "courses",
      "users",
      "contactRequests",
      "blocks",
      "authTokens"
    ];

    for (const name of collectionNames) {
      try {
        await db.createCollection(name);
        console.log(`Created collection: ${name}`);
      } catch (error) {
        // Code 48 means this collection already exists.
        if (error.code !== 48) {
          throw error;
        }

        console.log(`Collection already exists: ${name}`);
      }
    }

    await db.collection("courses").createIndex(
      { prefix: 1, number: 1 },
      { unique: true, name: "unique_course_code" }
    );

    await db.collection("users").createIndex(
      { email: 1 },
      { unique: true, name: "unique_user_email" }
    );

    console.log("Success: collections and indexes are ready.");
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error(`Setup failed (${error.code || error.name}).`);
  process.exitCode = 1;
});