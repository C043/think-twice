import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  boolean,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

/**
 * Every timestamp carries a timezone.
 *
 * A bare `timestamp` stores a wall clock with no offset, so `created_at` written
 * by the database clock and `review_at` written by the application ended up on
 * two different scales whenever the two did not agree on UTC. The waiting period
 * — the entire point of the product — was measured between them.
 */
export const objectsTable = pgTable("objects", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  price: integer("price").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  reviewAt: timestamp("review_at", { withTimezone: true }).notNull(),
  notified: boolean("notified").default(false).notNull(),
});

export const pushSubscriptionsTable = pgTable("push_subscriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  endpoint: text("endpoint").notNull().unique(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

/**
 * Application settings, constrained to exactly one row.
 *
 * `locale` and `currency` are kept apart on purpose: they are orthogonal, and
 * both are needed server-side because prices and dates are formatted during SSR
 * too. A value that only lived in the browser would hydrate against different
 * markup.
 */
export const settingsTable = pgTable(
  "settings",
  {
    id: integer("id").primaryKey().default(1),
    locale: text("locale").notNull().default("it-IT"),
    currency: text("currency").notNull().default("EUR"),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [check("settings_singleton", sql`${table.id} = 1`)],
);

export type InsertObject = typeof objectsTable.$inferInsert;
export type SelectObject = typeof objectsTable.$inferSelect;

export type InsertPushSubscription =
  typeof pushSubscriptionsTable.$inferInsert;
export type SelectPushSubscription =
  typeof pushSubscriptionsTable.$inferSelect;

export type InsertSettings = typeof settingsTable.$inferInsert;
export type SelectSettings = typeof settingsTable.$inferSelect;
