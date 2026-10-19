ALTER TABLE "project_members" ALTER COLUMN "role" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "project_members" ALTER COLUMN "role" SET DEFAULT 'editor'::text;--> statement-breakpoint
UPDATE "project_members" SET "role" = 'editor' WHERE "role" = 'master';--> statement-breakpoint
DROP TYPE "public"."project_role";--> statement-breakpoint
CREATE TYPE "public"."project_role" AS ENUM('manager', 'editor', 'viewer', 'courier', 'accountant');--> statement-breakpoint
ALTER TABLE "project_members" ALTER COLUMN "role" SET DEFAULT 'editor'::"public"."project_role";--> statement-breakpoint
ALTER TABLE "project_members" ALTER COLUMN "role" SET DATA TYPE "public"."project_role" USING "role"::"public"."project_role";