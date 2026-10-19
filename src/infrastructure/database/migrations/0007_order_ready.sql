ALTER TYPE "public"."order_status" ADD VALUE 'ready' BEFORE 'completed';--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "ready_by" timestamp;