-- Hand-edited: drizzle-kit emits a bare SET DATA TYPE, which makes Postgres
-- reinterpret the stored wall clocks in whatever the session TimeZone happens to
-- be. Every existing row was written by a container running UTC, so UTC is the
-- only correct reading; without the explicit USING the timers of any deployment
-- migrating from a non-UTC session silently shift by the offset.
ALTER TABLE "objects" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone USING "created_at" AT TIME ZONE 'UTC';--> statement-breakpoint
ALTER TABLE "objects" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "objects" ALTER COLUMN "review_at" SET DATA TYPE timestamp with time zone USING "review_at" AT TIME ZONE 'UTC';--> statement-breakpoint
ALTER TABLE "push_subscriptions" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone USING "created_at" AT TIME ZONE 'UTC';--> statement-breakpoint
ALTER TABLE "push_subscriptions" ALTER COLUMN "created_at" SET DEFAULT now();
