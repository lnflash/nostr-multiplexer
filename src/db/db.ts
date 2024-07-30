import sqlite3 from "sqlite3";
import { open, Database } from "sqlite";

// Open a database connection
const dbPromise: Promise<Database> = open({
  filename: "./flash-nostr.db",
  driver: sqlite3.Database,
});

export default dbPromise;
