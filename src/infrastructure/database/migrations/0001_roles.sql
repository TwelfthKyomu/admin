ALTER TABLE "organization_members" ALTER COLUMN "role" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "organization_members" ALTER COLUMN "role" SET DEFAULT 'member'::text;--> statement-breakpoint
UPDATE "organization_members" SET "role" = 'member' WHERE "role" = 'billing';--> statement-breakpoint
DROP TYPE "public"."organization_role";--> statement-breakpoint
CREATE TYPE "public"."organization_role" AS ENUM('owner', 'admin', 'member');--> statement-breakpoint
ALTER TABLE "organization_members" ALTER COLUMN "role" SET DEFAULT 'member'::"public"."organization_role";--> statement-breakpoint
ALTER TABLE "organization_members" ALTER COLUMN "role" SET DATA TYPE "public"."organization_role" USING "role"::"public"."organization_role";--> statement-breakpoint
ALTER TABLE "project_members" ALTER COLUMN "role" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "project_members" ALTER COLUMN "role" SET DEFAULT 'master'::text;--> statement-breakpoint
UPDATE "project_members" SET "role" = 'master' WHERE "role" = 'guest';--> statement-breakpoint
DROP TYPE "public"."project_role";--> statement-breakpoint
CREATE TYPE "public"."project_role" AS ENUM('manager', 'editor', 'viewer', 'master', 'courier', 'accountant');--> statement-breakpoint
ALTER TABLE "project_members" ALTER COLUMN "role" SET DEFAULT 'master'::"public"."project_role";--> statement-breakpoint
ALTER TABLE "project_members" ALTER COLUMN "role" SET DATA TYPE "public"."project_role" USING "role"::"public"."project_role";