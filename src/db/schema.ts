import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  boolean,
} from "drizzle-orm/pg-core";

export const objectsTable = pgTable("objects", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  price: integer("price").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  reviewAt: timestamp("review_at").notNull(),
  notified: boolean("notified").default(false).notNull(),
});

export const pushSubscriptionsTable = pgTable("push_subscriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  endpoint: text("endpoint").notNull().unique(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type InsertObject = typeof objectsTable.$inferInsert;
export type SelectObject = typeof objectsTable.$inferSelect;

export type InsertPushSubscription =
  typeof pushSubscriptionsTable.$inferInsert;
export type SelectPushSubscription =
  typeof pushSubscriptionsTable.$inferSelect;
