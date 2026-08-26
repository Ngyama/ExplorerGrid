-- Additive content-system migration (SQLite).
-- Applied automatically by ensureDatabase() in src/data/db/index.ts.
-- Kept here as the formal migration record.

ALTER TABLE places ADD COLUMN source_type TEXT NOT NULL DEFAULT 'curated';

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

ALTER TABLE explore_layers ADD COLUMN type TEXT NOT NULL DEFAULT 'curated';
ALTER TABLE explore_layers ADD COLUMN visibility TEXT NOT NULL DEFAULT 'public';
ALTER TABLE explore_layer_places ADD COLUMN note TEXT;

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
