import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import fs from "fs";
import path from "path";
import * as schema from "./schema";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "explorer-grid.db");

function columnExists(
  sqlite: Database.Database,
  table: string,
  column: string
) {
  const rows = sqlite.prepare(`PRAGMA table_info(${table})`).all() as Array<{
    name: string;
  }>;
  return rows.some((row) => row.name === column);
}

function ensureColumn(
  sqlite: Database.Database,
  table: string,
  column: string,
  definition: string
) {
  if (!columnExists(sqlite, table, column)) {
    sqlite.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

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
      image TEXT NOT NULL DEFAULT '',
      region_id TEXT,
      importance INTEGER NOT NULL DEFAULT 3,
      min_zoom REAL NOT NULL DEFAULT 10,
      source_type TEXT NOT NULL DEFAULT 'curated',
      review_status TEXT NOT NULL DEFAULT 'pending',
      reviewed_at TEXT,
      review_source TEXT,
      name_ja TEXT,
      name_en TEXT,
      possible_duplicate_of TEXT
    );

    CREATE TABLE IF NOT EXISTS place_external_references (
      id TEXT PRIMARY KEY,
      place_id TEXT NOT NULL REFERENCES places(id),
      provider TEXT NOT NULL,
      external_id TEXT NOT NULL,
      raw_metadata TEXT,
      source_updated_at TEXT
    );

    CREATE UNIQUE INDEX IF NOT EXISTS place_ext_ref_provider_external
      ON place_external_references(provider, external_id);

    CREATE TABLE IF NOT EXISTS explore_layers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      cover_image TEXT NOT NULL,
      region_id TEXT,
      type TEXT NOT NULL DEFAULT 'curated',
      visibility TEXT NOT NULL DEFAULT 'public'
    );

    CREATE TABLE IF NOT EXISTS explore_layer_places (
      layer_id TEXT NOT NULL REFERENCES explore_layers(id),
      place_id TEXT NOT NULL REFERENCES places(id),
      priority INTEGER NOT NULL DEFAULT 0,
      "order" INTEGER NOT NULL DEFAULT 0,
      note TEXT,
      PRIMARY KEY (layer_id, place_id)
    );

    CREATE TABLE IF NOT EXISTS collections (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS collection_places (
      collection_id TEXT NOT NULL REFERENCES collections(id),
      place_id TEXT NOT NULL REFERENCES places(id),
      note TEXT,
      "order" INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (collection_id, place_id)
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

  // Migrate older local DBs.
  ensureColumn(sqlite, "places", "region_id", "TEXT");
  ensureColumn(sqlite, "places", "importance", "INTEGER NOT NULL DEFAULT 3");
  ensureColumn(sqlite, "places", "min_zoom", "REAL NOT NULL DEFAULT 10");
  ensureColumn(sqlite, "places", "source_type", "TEXT NOT NULL DEFAULT 'curated'");
  ensureColumn(
    sqlite,
    "places",
    "review_status",
    "TEXT NOT NULL DEFAULT 'pending'"
  );
  ensureColumn(sqlite, "places", "reviewed_at", "TEXT");
  ensureColumn(sqlite, "places", "review_source", "TEXT");
  ensureColumn(sqlite, "places", "name_ja", "TEXT");
  ensureColumn(sqlite, "places", "name_en", "TEXT");
  ensureColumn(sqlite, "places", "possible_duplicate_of", "TEXT");
  ensureColumn(sqlite, "explore_layers", "region_id", "TEXT");
  ensureColumn(sqlite, "explore_layers", "type", "TEXT NOT NULL DEFAULT 'curated'");
  ensureColumn(
    sqlite,
    "explore_layers",
    "visibility",
    "TEXT NOT NULL DEFAULT 'public'"
  );
  ensureColumn(sqlite, "explore_layer_places", "note", "TEXT");

  // Backfill: curated / custom → approved; imported stays pending if still default.
  sqlite.exec(`
    UPDATE places
    SET review_status = 'approved',
        review_source = COALESCE(review_source, 'curated'),
        reviewed_at = COALESCE(reviewed_at, datetime('now'))
    WHERE source_type IN ('curated', 'custom')
      AND (review_status IS NULL OR review_status = 'pending' OR review_status = '');
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
