import { pgTable, uuid, text, integer, timestamp } from "drizzle-orm/pg-core";

export const objectsTable = pgTable("objects", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  price: integer("price").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  reviewAt: timestamp("review_at").notNull(),
});

export type InsertObject = typeof objectsTable.$inferInsert;
export type SelectObject = typeof objectsTable.$inferSelect;
