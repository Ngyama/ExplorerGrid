import { sqliteTable, text, real, integer, primaryKey, uniqueIndex } from "drizzle-orm/sqlite-core";

export const places = sqliteTable("places", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  category: text("category").notNull(),
  image: text("image").notNull().default(""),
  regionId: text("region_id"),
  importance: integer("importance").notNull().default(3),
  minZoom: real("min_zoom").notNull().default(10),
  /** curated | imported | custom */
  sourceType: text("source_type").notNull().default("curated"),
  /** pending | approved | rejected */
  reviewStatus: text("review_status").notNull().default("pending"),
  reviewedAt: text("reviewed_at"),
  /** manual | rule | curated | import */
  reviewSource: text("review_source"),
  nameJa: text("name_ja"),
  nameEn: text("name_en"),
  /** Soft duplicate hint — id of another place */
  possibleDuplicateOf: text("possible_duplicate_of"),
});

/** Links a Place to one or more external POI identities (OSM, Wikidata, …). */
export const placeExternalReferences = sqliteTable(
  "place_external_references",
  {
    id: text("id").primaryKey(),
    placeId: text("place_id")
      .notNull()
      .references(() => places.id),
    provider: text("provider").notNull(),
    externalId: text("external_id").notNull(),
    rawMetadata: text("raw_metadata"),
    sourceUpdatedAt: text("source_updated_at"),
  },
  (table) => [
    uniqueIndex("place_ext_ref_provider_external").on(
      table.provider,
      table.externalId
    ),
  ]
);

export const exploreLayers = sqliteTable("explore_layers", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  coverImage: text("cover_image").notNull(),
  regionId: text("region_id"),
  /** curated | dynamic | user */
  type: text("type").notNull().default("curated"),
  /** public | private | draft */
  visibility: text("visibility").notNull().default("public"),
});

export const exploreLayerPlaces = sqliteTable(
  "explore_layer_places",
  {
    layerId: text("layer_id")
      .notNull()
      .references(() => exploreLayers.id),
    placeId: text("place_id")
      .notNull()
      .references(() => places.id),
    priority: integer("priority").notNull().default(0),
    order: integer("order").notNull().default(0),
    /** Why this place belongs to the Explore View. */
    note: text("note"),
  },
  (table) => [primaryKey({ columns: [table.layerId, table.placeId] })]
);

export const collections = sqliteTable("collections", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  createdAt: text("created_at").notNull(),
});

export const collectionPlaces = sqliteTable(
  "collection_places",
  {
    collectionId: text("collection_id")
      .notNull()
      .references(() => collections.id),
    placeId: text("place_id")
      .notNull()
      .references(() => places.id),
    note: text("note"),
    order: integer("order").notNull().default(0),
  },
  (table) => [primaryKey({ columns: [table.collectionId, table.placeId] })]
);

export const userPlaces = sqliteTable(
  "user_places",
  {
    userId: text("user_id").notNull(),
    placeId: text("place_id")
      .notNull()
      .references(() => places.id),
    status: text("status").notNull(),
    rating: integer("rating"),
    note: text("note"),
  },
  (table) => [primaryKey({ columns: [table.userId, table.placeId] })]
);

export const visits = sqliteTable("visits", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  placeId: text("place_id")
    .notNull()
    .references(() => places.id),
  visitedAt: text("visited_at").notNull(),
  note: text("note"),
});

export const photos = sqliteTable("photos", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  placeId: text("place_id")
    .notNull()
    .references(() => places.id),
  visitId: text("visit_id").references(() => visits.id),
  url: text("url").notNull(),
  createdAt: text("created_at").notNull(),
});
