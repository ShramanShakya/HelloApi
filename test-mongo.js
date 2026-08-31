require("dotenv").config({ path: ".env.local" });

const { MongoClient } = require("mongodb");

async function test() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.DB_NAME;

  console.log("DB_NAME:", dbName);
  console.log("Mongo URI loaded:", !!uri);

  if (!uri) {
    console.log("❌ MONGODB_URI was not loaded");
    return;
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();

    console.log("✅ MONGODB CONNECTED");

    const db = client.db(dbName);

    console.log("Database:", db.databaseName);

    const collections = await db.listCollections().toArray();

    console.log(
      "Collections:",
      collections.map((collection) => collection.name)
    );
  } catch (error) {
    console.log("❌ MONGODB CONNECTION FAILED");
    console.error(error);
  } finally {
    await client.close();
  }
}

test();
