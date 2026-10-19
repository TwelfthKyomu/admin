CREATE TYPE "public"."order_source" AS ENUM('store', 'storefront');--> statement-breakpoint
ALTER TYPE "public"."order_event_type" ADD VALUE 'seller_changed';--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "seller_id" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "sold_at" timestamp;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "source" "order_source" DEFAULT 'store' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_seller_id_organization_members_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."organization_members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_seller_org_fk" FOREIGN KEY ("seller_id","organization_id") REFERENCES "public"."organization_members"("id","organization_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "orders_seller_sold_idx" ON "orders" USING btree ("seller_id","sold_at");--> statement-breakpoint
CREATE INDEX "orders_project_sold_idx" ON "orders" USING btree ("project_id","sold_at");--> statement-breakpoint
UPDATE "orders" AS o SET "source" = 'storefront'
FROM "order_events" AS e
WHERE e."order_id" = o."id" AND e."type" = 'created' AND e."payload"->>'source' = 'storefront';--> statement-breakpoint
UPDATE "orders" AS o SET "seller_id" = m."id", "sold_at" = o."created_at"
FROM "order_events" AS e
JOIN "organization_members" AS m ON m."user_id" = e."by_user_id"
WHERE e."order_id" = o."id" AND e."type" = 'created' AND m."organization_id" = o."organization_id"
  AND o."source" = 'store' AND o."type" = 'sale';--> statement-breakpoint
UPDATE "orders" AS o SET "seller_id" = c."member_id", "sold_at" = c."created_at"
FROM (
    SELECT DISTINCT ON (e."order_id") e."order_id", m."id" AS "member_id", e."created_at"
    FROM "order_events" AS e
    JOIN "orders" AS x ON x."id" = e."order_id"
    JOIN "organization_members" AS m ON m."user_id" = e."by_user_id" AND m."organization_id" = x."organization_id"
    WHERE e."type" = 'status_changed' AND e."payload"->>'to' = 'confirmed'
    ORDER BY e."order_id", e."created_at"
) AS c
WHERE c."order_id" = o."id" AND o."source" = 'storefront';
