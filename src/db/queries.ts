import dbPromise from "./db";
import { Database } from "sqlite";

interface User {
  name: string;
  pubkey: string;
}

export const getPubkeyByName = async (name: string): Promise<User | null> => {
  const db: Database = await dbPromise;
  const user = await db.get("SELECT name, pubkey FROM users WHERE name = ?", [
    name,
  ]);
  return user || null;
};

export const getAllUsers = async (): Promise<any[]> => {
  const db: Database = await dbPromise;
  return db.all("SELECT * FROM users");
};

export const addUser = async (
  name: string,
  pubkey: string
): Promise<number> => {
  const db: Database = await dbPromise;
  const result = await db.run(
    "INSERT INTO users (name, pubkey) VALUES (?, ?)",
    [name, pubkey]
  );

  if (result.lastID === undefined) {
    throw new Error("Failed to get the last inserted ID");
  }

  return result.lastID;
};
