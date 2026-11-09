ALTER TABLE "order_items" ADD COLUMN "unit_cost_amount" bigint;--> statement-breakpoint
ALTER TABLE "product_variants" ADD COLUMN "barcode" varchar(64);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "barcode" varchar(64);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "cost_amount" bigint;--> statement-breakpoint
CREATE UNIQUE INDEX "product_variants_project_barcode_unique" ON "product_variants" USING btree ("project_id","barcode") WHERE "product_variants"."barcode" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "products_project_barcode_unique" ON "products" USING btree ("project_id","barcode") WHERE ("products"."barcode" is not null and "products"."deleted_at" is null);--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_cost_amount_non_negative" CHECK ("products"."cost_amount" is null or "products"."cost_amount" >= 0);