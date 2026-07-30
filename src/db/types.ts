import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";

/**
 * A Postgres-speaking drizzle client, whichever driver is behind it.
 *
 * Production runs node-postgres with the schema attached, the tests run pglite
 * without it. Both extend `PgDatabase`, but its schema generic is invariant, so
 * naming a concrete schema here would reject one of the two callers.
 *
 * The repositories never use the schema generic: they pass table objects to
 * `select().from()` explicitly and never touch `db.query.*`, which is the only
 * API that reads it. Hence the two wildcards — the alternative is an `any` in
 * every repository constructor, unexplained, which is what this replaces.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AppDatabase = PgDatabase<PgQueryResultHKT, any, any>;
