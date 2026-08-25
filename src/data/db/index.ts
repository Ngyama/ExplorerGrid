import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import fs from "fs";
import path from "path";
import * as schema from "./schema";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "explorer-grid.db");

function ensureDatabase() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const sqlite = new Database(DB_PATH);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS places (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      category TEXT NOT NULL,
      image TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS explore_layers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      cover_image TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS explore_layer_places (
      layer_id TEXT NOT NULL REFERENCES explore_layers(id),
      place_id TEXT NOT NULL REFERENCES places(id),
      priority INTEGER NOT NULL DEFAULT 0,
      "order" INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (layer_id, place_id)
    );

    CREATE TABLE IF NOT EXISTS user_places (
      user_id TEXT NOT NULL,
      place_id TEXT NOT NULL REFERENCES places(id),
      status TEXT NOT NULL,
      rating INTEGER,
      note TEXT,
      PRIMARY KEY (user_id, place_id)
    );

    CREATE TABLE IF NOT EXISTS visits (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      place_id TEXT NOT NULL REFERENCES places(id),
      visited_at TEXT NOT NULL,
      note TEXT
    );

    CREATE TABLE IF NOT EXISTS photos (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      place_id TEXT NOT NULL REFERENCES places(id),
      visit_id TEXT REFERENCES visits(id),
      url TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);

  return sqlite;
}

const globalForDb = globalThis as unknown as {
  __explorerSqlite?: Database.Database;
};

const sqlite = globalForDb.__explorerSqlite ?? ensureDatabase();

if (process.env.NODE_ENV !== "production") {
  globalForDb.__explorerSqlite = sqlite;
}

export const db = drizzle(sqlite, { schema });
export { DB_PATH };
