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

    const courses = db.collection("courses");
    const users = db.collection("users");

    const sampleCourses = [
      {
        prefix: "COP",
        number: "3502C",
        name: "Computer Science I"
      },
      {
        prefix: "COP",
        number: "3503C",
        name: "Computer Science II"
      }
    ];

    for (const course of sampleCourses) {
      const result = await courses.updateOne(
        {
          prefix: course.prefix,
          number: course.number
        },
        {
          $setOnInsert: course
        },
        {
          upsert: true
        }
      );

      console.log(
        `${course.prefix} ${course.number}: ${
          result.upsertedCount ? "added" : "already exists"
        }`
      );
    }

    // Retrieve the actual course ID instead of hardcoding one.
    const course = await courses.findOne({
      prefix: "COP",
      number: "3502C"
    });

    if (!course) {
      throw new Error("The demo course could not be found.");
    }

    const demoEmail = "demo.student@example.com";

    // Avoid using an existing non-demo account as test data.
    const existingUser = await users.findOne({
      email: demoEmail
    });

    if (existingUser && existingUser.isDemo !== true) {
      throw new Error("The demo email belongs to a non-demo record.");
    }

    const result = await users.updateOne(
      { email: demoEmail },
      {
        $setOnInsert: {
          firstName: "Demo",
          lastName: "Student",
          email: demoEmail,
          emailVerified: false,
          profileComplete: true,
          major: "Computer Science",
          minor: "Physics",
          gender: "male",
          genderPreference: "no_preference",
          semester: "Fall 2026",
          courseIds: [course._id],
          availability: [
            {
              dayOfWeek: 1,
              startMinute: 840,
              endMinute: 960
            }
          ],
          availabilityConfirmedAt: null,
          isDemo: true
        }
      },
      { upsert: true }
    );

    console.log(
      result.upsertedCount
        ? "Demo student added."
        : "Demo student already exists; left unchanged."
    );

    console.log("Success: seed data is ready.");
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error(`Seed failed (${error.code || error.name}).`);
  process.exitCode = 1;
});