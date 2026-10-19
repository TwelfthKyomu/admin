ALTER TABLE "employee_assignments" ADD COLUMN "site_commission_rate" integer;--> statement-breakpoint
ALTER TABLE "payouts" ADD COLUMN "site_revenue" bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "payouts" ADD COLUMN "site_commission_rate" integer;--> statement-breakpoint
ALTER TABLE "payouts" ADD COLUMN "site_commission_pay" bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "payouts" RENAME COLUMN "services_revenue" TO "store_revenue";--> statement-breakpoint
UPDATE "employee_assignments" SET "commission_rate" = NULL;
