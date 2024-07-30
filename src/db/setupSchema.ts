import dbPromise from "./db";

const setupSchema = async () => {
  const db = await dbPromise;

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      pubkey TEXT NOT NULL
    )
  `);

  console.log("Schema setup complete.");
};

setupSchema().catch((err) => console.error("Error setting up schema:", err));
