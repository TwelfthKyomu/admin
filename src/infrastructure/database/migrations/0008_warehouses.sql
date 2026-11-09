ALTER TYPE "public"."stock_movement_reason" ADD VALUE 'receipt';--> statement-breakpoint
ALTER TYPE "public"."stock_movement_reason" ADD VALUE 'transfer';--> statement-breakpoint
CREATE TABLE "warehouse_stock" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"warehouse_id" text NOT NULL,
	"product_id" text NOT NULL,
	"variant_id" text,
	"quantity" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "warehouse_stock_quantity_non_negative" CHECK ("warehouse_stock"."quantity" >= 0)
);
--> statement-breakpoint
CREATE TABLE "warehouses" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"name" varchar(100) NOT NULL,
	"for_site" boolean DEFAULT true NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "warehouses_id_project_unique" UNIQUE("id","project_id")
);
--> statement-breakpoint
DROP INDEX "stock_movements_order_line_reason_unique";--> statement-breakpoint
DROP INDEX "stock_reservations_order_line_unique";--> statement-breakpoint
ALTER TABLE "stock_movements" ADD COLUMN "warehouse_id" text;--> statement-breakpoint
ALTER TABLE "stock_reservations" ADD COLUMN "warehouse_id" text;--> statement-breakpoint
INSERT INTO "warehouses" ("id", "project_id", "name", "for_site", "position")
SELECT gen_random_uuid()::text, "id", 'Основной склад', true, 0 FROM "projects";--> statement-breakpoint
INSERT INTO "warehouse_stock" ("id", "project_id", "warehouse_id", "product_id", "variant_id", "quantity")
SELECT gen_random_uuid()::text, p."project_id", w."id", p."id", NULL, p."stock"
FROM "products" p JOIN "warehouses" w ON w."project_id" = p."project_id"
WHERE p."stock" IS NOT NULL;--> statement-breakpoint
INSERT INTO "warehouse_stock" ("id", "project_id", "warehouse_id", "product_id", "variant_id", "quantity")
SELECT gen_random_uuid()::text, v."project_id", w."id", v."product_id", v."id", v."stock"
FROM "product_variants" v JOIN "warehouses" w ON w."project_id" = v."project_id"
WHERE v."stock" IS NOT NULL;--> statement-breakpoint
UPDATE "stock_movements" m SET "warehouse_id" = w."id" FROM "warehouses" w WHERE w."project_id" = m."project_id";--> statement-breakpoint
UPDATE "stock_reservations" r SET "warehouse_id" = w."id" FROM "warehouses" w WHERE w."project_id" = r."project_id";--> statement-breakpoint
ALTER TABLE "stock_movements" ALTER COLUMN "warehouse_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "stock_reservations" ALTER COLUMN "warehouse_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "warehouse_stock" ADD CONSTRAINT "warehouse_stock_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse_stock" ADD CONSTRAINT "warehouse_stock_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse_stock" ADD CONSTRAINT "warehouse_stock_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse_stock" ADD CONSTRAINT "warehouse_stock_warehouse_project_fk" FOREIGN KEY ("warehouse_id","project_id") REFERENCES "public"."warehouses"("id","project_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse_stock" ADD CONSTRAINT "warehouse_stock_product_project_fk" FOREIGN KEY ("product_id","project_id") REFERENCES "public"."products"("id","project_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouses" ADD CONSTRAINT "warehouses_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "warehouse_stock_line_unique" ON "warehouse_stock" USING btree ("warehouse_id","product_id",coalesce("variant_id", ''));--> statement-breakpoint
CREATE INDEX "warehouse_stock_product_idx" ON "warehouse_stock" USING btree ("product_id","variant_id");--> statement-breakpoint
CREATE INDEX "warehouses_project_idx" ON "warehouses" USING btree ("project_id");--> statement-breakpoint
CREATE UNIQUE INDEX "warehouses_project_name_unique" ON "warehouses" USING btree ("project_id","name") WHERE "warehouses"."deleted_at" is null;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_warehouse_project_fk" FOREIGN KEY ("warehouse_id","project_id") REFERENCES "public"."warehouses"("id","project_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_reservations" ADD CONSTRAINT "stock_reservations_warehouse_project_fk" FOREIGN KEY ("warehouse_id","project_id") REFERENCES "public"."warehouses"("id","project_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "stock_movements_order_line_reason_unique" ON "stock_movements" USING btree ("order_id","product_id",coalesce("variant_id", ''),"warehouse_id","reason") WHERE "stock_movements"."order_id" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "stock_reservations_order_line_unique" ON "stock_reservations" USING btree ("order_id","product_id",coalesce("variant_id", ''),"warehouse_id");