DELETE FROM "payments" WHERE "order_id" IN (SELECT "id" FROM "orders" WHERE "type" IN ('booking', 'mixed'));--> statement-breakpoint
DELETE FROM "orders" WHERE "type" IN ('booking', 'mixed');--> statement-breakpoint
DELETE FROM "order_events" WHERE "type" IN ('assigned_employee_changed', 'scheduled_at_changed');--> statement-breakpoint
UPDATE "orders" SET "status" = 'cancelled' WHERE "status" = 'no_show';--> statement-breakpoint
ALTER TABLE "product_performers" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "product_performers" CASCADE;--> statement-breakpoint
ALTER TABLE "order_items" DROP CONSTRAINT "order_items_duration_positive";--> statement-breakpoint
ALTER TABLE "orders" DROP CONSTRAINT "orders_duration_positive";--> statement-breakpoint
ALTER TABLE "orders" DROP CONSTRAINT "orders_scheduled_for_booking";--> statement-breakpoint
ALTER TABLE "order_items" DROP CONSTRAINT "order_items_performer_employee_id_organization_members_id_fk";
--> statement-breakpoint
ALTER TABLE "orders" DROP CONSTRAINT "orders_assigned_employee_id_organization_members_id_fk";
--> statement-breakpoint
ALTER TABLE "orders" DROP CONSTRAINT "orders_employee_org_fk";
--> statement-breakpoint
ALTER TABLE "order_events" ALTER COLUMN "type" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."order_event_type";--> statement-breakpoint
CREATE TYPE "public"."order_event_type" AS ENUM('created', 'status_changed', 'discount_applied', 'payment_recorded', 'refund_recorded', 'shipment_updated', 'seller_changed');--> statement-breakpoint
ALTER TABLE "order_events" ALTER COLUMN "type" SET DATA TYPE "public"."order_event_type" USING "type"::"public"."order_event_type";--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'pending'::text;--> statement-breakpoint
DROP TYPE "public"."order_status";--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('pending', 'confirmed', 'in_progress', 'completed', 'cancelled');--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'pending'::"public"."order_status";--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "status" SET DATA TYPE "public"."order_status" USING "status"::"public"."order_status";--> statement-breakpoint
DROP INDEX "order_items_performer_idx";--> statement-breakpoint
DROP INDEX "orders_project_scheduled_idx";--> statement-breakpoint
DROP INDEX "orders_employee_scheduled_idx";--> statement-breakpoint
ALTER TABLE "employee_assignments" DROP COLUMN "is_bookable";--> statement-breakpoint
ALTER TABLE "order_items" DROP COLUMN "performer_employee_id";--> statement-breakpoint
ALTER TABLE "order_items" DROP COLUMN "duration_minutes";--> statement-breakpoint
ALTER TABLE "orders" DROP COLUMN "type";--> statement-breakpoint
ALTER TABLE "orders" DROP COLUMN "assigned_employee_id";--> statement-breakpoint
ALTER TABLE "orders" DROP COLUMN "scheduled_at";--> statement-breakpoint
ALTER TABLE "orders" DROP COLUMN "duration_minutes";--> statement-breakpoint
ALTER TABLE "orders" DROP COLUMN "reminder_sent_at";--> statement-breakpoint
DROP TYPE "public"."order_type";