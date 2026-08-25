import { sqliteTable, text, real, integer, primaryKey } from "drizzle-orm/sqlite-core";

export const places = sqliteTable("places", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  category: text("category").notNull(),
  image: text("image").notNull(),
  regionId: text("region_id"),
  importance: integer("importance").notNull().default(3),
  minZoom: real("min_zoom").notNull().default(10),
});

export const exploreLayers = sqliteTable("explore_layers", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  coverImage: text("cover_image").notNull(),
  regionId: text("region_id"),
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
  },
  (table) => [primaryKey({ columns: [table.layerId, table.placeId] })]
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
