CREATE TYPE "public"."billing_payment_status" AS ENUM('pending', 'paid', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."chat_channel_type" AS ENUM('organization', 'project', 'direct');--> statement-breakpoint
CREATE TYPE "public"."coupon_discount_type" AS ENUM('percentage', 'fixed_amount');--> statement-breakpoint
CREATE TYPE "public"."coupon_status" AS ENUM('active', 'inactive');--> statement-breakpoint
CREATE TYPE "public"."currency" AS ENUM('RUB', 'USD', 'EUR', 'KZT');--> statement-breakpoint
CREATE TYPE "public"."delivery_carrier" AS ENUM('cdek', 'boxberry', 'russian_post', 'yandex', 'other');--> statement-breakpoint
CREATE TYPE "public"."delivery_kind" AS ENUM('courier', 'carrier');--> statement-breakpoint
CREATE TYPE "public"."delivery_status" AS ENUM('queued', 'assigned', 'picked_up', 'delivered', 'failed', 'returned', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."employee_kind" AS ENUM('specialist', 'courier');--> statement-breakpoint
CREATE TYPE "public"."integration_type" AS ENUM('storefront', 'payment_provider', 'storage');--> statement-breakpoint
CREATE TYPE "public"."order_event_type" AS ENUM('created', 'status_changed', 'discount_applied', 'payment_recorded', 'refund_recorded', 'assigned_employee_changed', 'scheduled_at_changed', 'shipment_updated');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show');--> statement-breakpoint
CREATE TYPE "public"."order_type" AS ENUM('booking', 'sale', 'mixed');--> statement-breakpoint
CREATE TYPE "public"."organization_role" AS ENUM('owner', 'admin', 'member', 'billing');--> statement-breakpoint
CREATE TYPE "public"."payment_direction" AS ENUM('charge', 'refund');--> statement-breakpoint
CREATE TYPE "public"."payment_intent_status" AS ENUM('pending', 'succeeded', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('cash', 'card', 'transfer', 'online', 'other');--> statement-breakpoint
CREATE TYPE "public"."payment_provider" AS ENUM('yookassa', 'cloudpayments', 'stripe');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('unpaid', 'partial', 'paid', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."product_status" AS ENUM('draft', 'active', 'unlisted', 'archived');--> statement-breakpoint
CREATE TYPE "public"."product_type" AS ENUM('physical', 'service');--> statement-breakpoint
CREATE TYPE "public"."project_category_type" AS ENUM('product', 'service', 'generic');--> statement-breakpoint
CREATE TYPE "public"."project_role" AS ENUM('manager', 'editor', 'viewer', 'guest', 'courier');--> statement-breakpoint
CREATE TYPE "public"."project_type" AS ENUM('shop');--> statement-breakpoint
CREATE TYPE "public"."shift_cancel_reason" AS ENUM('sick', 'day_off', 'vacation', 'replaced', 'other');--> statement-breakpoint
CREATE TYPE "public"."shift_status" AS ENUM('scheduled', 'in_progress', 'completed', 'cancelled', 'no_show');--> statement-breakpoint
CREATE TYPE "public"."stock_movement_reason" AS ENUM('sale', 'return', 'manual', 'write_off');--> statement-breakpoint
CREATE TYPE "public"."subscription_plan" AS ENUM('free', 'pro', 'enterprise');--> statement-breakpoint
CREATE TYPE "public"."task_priority" AS ENUM('none', 'low', 'medium', 'high', 'urgent');--> statement-breakpoint
CREATE TYPE "public"."task_status" AS ENUM('backlog', 'todo', 'in_progress', 'review', 'done');--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"project_id" text,
	"actor_user_id" text,
	"action" text NOT NULL,
	"target_type" text NOT NULL,
	"target_id" text,
	"summary" text NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cash_collections" (
	"id" text PRIMARY KEY NOT NULL,
	"cash_shift_id" text NOT NULL,
	"amount" bigint NOT NULL,
	"note" text,
	"created_by" text,
	"occurred_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "cash_collections_amount_positive" CHECK ("cash_collections"."amount" > 0)
);
--> statement-breakpoint
CREATE TABLE "cash_shifts" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"opening_amount" bigint DEFAULT 0 NOT NULL,
	"closing_counted_amount" bigint,
	"closing_note" text,
	"opened_by" text,
	"closed_by" text,
	"closed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "cash_shifts_id_project_unique" UNIQUE("id","project_id"),
	CONSTRAINT "cash_shifts_opening_non_negative" CHECK ("cash_shifts"."opening_amount" >= 0),
	CONSTRAINT "cash_shifts_closed_shape" CHECK (("cash_shifts"."closed_at" is null) = ("cash_shifts"."closing_counted_amount" is null))
);
--> statement-breakpoint
CREATE TABLE "courier_handovers" (
	"id" text PRIMARY KEY NOT NULL,
	"cash_shift_id" text NOT NULL,
	"project_id" text NOT NULL,
	"employee_id" text NOT NULL,
	"amount" bigint NOT NULL,
	"created_by" text,
	"occurred_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "courier_handovers_amount_positive" CHECK ("courier_handovers"."amount" > 0)
);
--> statement-breakpoint
CREATE TABLE "chat_attachments" (
	"id" text PRIMARY KEY NOT NULL,
	"channel_id" text NOT NULL,
	"message_id" text,
	"uploaded_by" text,
	"filename" varchar(64) NOT NULL,
	"name" varchar(255) NOT NULL,
	"content_type" varchar(128) NOT NULL,
	"size_bytes" bigint NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "chat_attachments_size_positive" CHECK ("chat_attachments"."size_bytes" > 0)
);
--> statement-breakpoint
CREATE TABLE "chat_channels" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"type" "chat_channel_type" NOT NULL,
	"project_id" text,
	"user_a_id" text,
	"user_b_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "chat_channels_shape" CHECK ((
                ("chat_channels"."type" = 'organization' and "chat_channels"."project_id" is null and "chat_channels"."user_a_id" is null and "chat_channels"."user_b_id" is null)
                or ("chat_channels"."type" = 'project' and "chat_channels"."project_id" is not null and "chat_channels"."user_a_id" is null and "chat_channels"."user_b_id" is null)
                or ("chat_channels"."type" = 'direct' and "chat_channels"."project_id" is null and "chat_channels"."user_a_id" is not null and "chat_channels"."user_b_id" is not null and "chat_channels"."user_a_id" < "chat_channels"."user_b_id")
            ))
);
--> statement-breakpoint
CREATE TABLE "chat_message_reactions" (
	"message_id" text NOT NULL,
	"user_id" text NOT NULL,
	"emoji" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "chat_message_reactions_message_id_user_id_pk" PRIMARY KEY("message_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "chat_messages" (
	"id" text PRIMARY KEY NOT NULL,
	"channel_id" text NOT NULL,
	"author_user_id" text,
	"reply_to_id" text,
	"thread_root_id" text,
	"body" text NOT NULL,
	"pinned_at" timestamp,
	"edited_at" timestamp,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_reads" (
	"channel_id" text NOT NULL,
	"user_id" text NOT NULL,
	"last_read_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "chat_reads_channel_id_user_id_pk" PRIMARY KEY("channel_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "clients" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"email" varchar(320),
	"phone" varchar(32),
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100),
	"middle_name" varchar(100),
	"total_orders" integer DEFAULT 0 NOT NULL,
	"total_spent_amount" bigint DEFAULT 0 NOT NULL,
	"last_visit_at" timestamp,
	"password_hash" text,
	"email_verified_at" timestamp,
	"verification_code_hash" text,
	"verification_code_expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "clients_id_project_unique" UNIQUE("id","project_id"),
	CONSTRAINT "clients_contact_present" CHECK ("clients"."email" is not null or "clients"."phone" is not null)
);
--> statement-breakpoint
CREATE TABLE "coupon_redemptions" (
	"id" text PRIMARY KEY NOT NULL,
	"coupon_id" text NOT NULL,
	"order_id" text NOT NULL,
	"project_id" text NOT NULL,
	"client_id" text,
	"amount" bigint NOT NULL,
	CONSTRAINT "coupon_redemptions_amount_non_negative" CHECK ("coupon_redemptions"."amount" >= 0)
);
--> statement-breakpoint
CREATE TABLE "coupons" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"code" varchar(32) NOT NULL,
	"label" varchar(255) NOT NULL,
	"discount_type" "coupon_discount_type" NOT NULL,
	"discount_value" bigint NOT NULL,
	"scope" jsonb DEFAULT '{"rules":[]}'::jsonb NOT NULL,
	"status" "coupon_status" DEFAULT 'active' NOT NULL,
	"valid_from" timestamp,
	"valid_until" timestamp,
	"max_uses" integer,
	"uses_count" integer DEFAULT 0 NOT NULL,
	"max_uses_per_client" integer,
	"min_order_amount" bigint,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "coupons_id_project_unique" UNIQUE("id","project_id"),
	CONSTRAINT "coupons_discount_value_positive" CHECK ("coupons"."discount_value" > 0),
	CONSTRAINT "coupons_percentage_in_range" CHECK ("coupons"."discount_type" <> 'percentage' or "coupons"."discount_value" <= 100),
	CONSTRAINT "coupons_max_uses_positive" CHECK ("coupons"."max_uses" is null or "coupons"."max_uses" > 0),
	CONSTRAINT "coupons_max_uses_per_client_positive" CHECK ("coupons"."max_uses_per_client" is null or "coupons"."max_uses_per_client" > 0),
	CONSTRAINT "coupons_min_order_non_negative" CHECK ("coupons"."min_order_amount" is null or "coupons"."min_order_amount" >= 0),
	CONSTRAINT "coupons_uses_count_non_negative" CHECK ("coupons"."uses_count" >= 0),
	CONSTRAINT "coupons_valid_range" CHECK ("coupons"."valid_from" is null or "coupons"."valid_until" is null or "coupons"."valid_from" <= "coupons"."valid_until")
);
--> statement-breakpoint
CREATE TABLE "deliveries" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"organization_id" text NOT NULL,
	"order_id" text NOT NULL,
	"kind" "delivery_kind" NOT NULL,
	"status" "delivery_status" DEFAULT 'queued' NOT NULL,
	"courier_id" text,
	"carrier" "delivery_carrier",
	"tracking_number" varchar(120),
	"window_start" timestamp,
	"window_end" timestamp,
	"address" varchar(500),
	"recipient_name" varchar(255),
	"recipient_phone" varchar(32),
	"cash_due" bigint DEFAULT 0 NOT NULL,
	"failure_reason" varchar(255),
	"assigned_at" timestamp,
	"picked_up_at" timestamp,
	"delivered_at" timestamp,
	"failed_at" timestamp,
	"cancelled_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "deliveries_kind_shape" CHECK (("deliveries"."kind" = 'courier' and "deliveries"."carrier" is null and "deliveries"."tracking_number" is null)
                or ("deliveries"."kind" = 'carrier' and "deliveries"."courier_id" is null and "deliveries"."window_start" is null and "deliveries"."window_end" is null)),
	CONSTRAINT "deliveries_window_order" CHECK ("deliveries"."window_start" is null or "deliveries"."window_end" is null or "deliveries"."window_end" > "deliveries"."window_start"),
	CONSTRAINT "deliveries_cash_due_non_negative" CHECK ("deliveries"."cash_due" >= 0),
	CONSTRAINT "deliveries_courier_when_assigned" CHECK ("deliveries"."kind" <> 'courier' or "deliveries"."status" not in ('assigned', 'picked_up', 'delivered') or "deliveries"."courier_id" is not null)
);
--> statement-breakpoint
CREATE TABLE "employee_assignments" (
	"id" text PRIMARY KEY NOT NULL,
	"employee_id" text NOT NULL,
	"project_id" text NOT NULL,
	"organization_id" text NOT NULL,
	"position" varchar(120) NOT NULL,
	"kind" "employee_kind" DEFAULT 'specialist' NOT NULL,
	"is_bookable" boolean DEFAULT false NOT NULL,
	"shift_rate_amount" bigint,
	"commission_rate" integer,
	"delivery_rate_amount" bigint,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"ended_at" timestamp,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employee_shifts" (
	"id" text PRIMARY KEY NOT NULL,
	"employee_id" text NOT NULL,
	"project_id" text NOT NULL,
	"organization_id" text NOT NULL,
	"starts_at" timestamp NOT NULL,
	"ends_at" timestamp NOT NULL,
	"status" "shift_status" DEFAULT 'scheduled' NOT NULL,
	"cancel_reason" "shift_cancel_reason",
	"break_minutes" integer DEFAULT 0 NOT NULL,
	"notes" text,
	"seeking_replacement" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "shift_ends_after_starts" CHECK ("employee_shifts"."ends_at" > "employee_shifts"."starts_at"),
	CONSTRAINT "shift_break_non_negative" CHECK ("employee_shifts"."break_minutes" >= 0)
);
--> statement-breakpoint
CREATE TABLE "project_integrations" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"name" varchar(255) NOT NULL,
	"site_url" text,
	"type" "integration_type" DEFAULT 'storefront' NOT NULL,
	"api_key_prefix" varchar(16),
	"api_key_hash" text,
	"provider" "payment_provider",
	"credentials" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "project_integrations_id_project_unique" UNIQUE("id","project_id"),
	CONSTRAINT "project_integrations_api_key_shape" CHECK (("project_integrations"."api_key_hash" is null) = ("project_integrations"."api_key_prefix" is null) and ("project_integrations"."api_key_hash" is null or "project_integrations"."type" = 'storefront')),
	CONSTRAINT "project_integrations_provider_shape" CHECK (("project_integrations"."type" = 'payment_provider') = ("project_integrations"."provider" is not null and "project_integrations"."credentials" is not null))
);
--> statement-breakpoint
CREATE TABLE "project_look_items" (
	"id" text PRIMARY KEY NOT NULL,
	"look_id" text NOT NULL,
	"project_id" text NOT NULL,
	"product_id" text NOT NULL,
	"x" integer NOT NULL,
	"y" integer NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "project_look_items_x_range" CHECK ("project_look_items"."x" between 0 and 100),
	CONSTRAINT "project_look_items_y_range" CHECK ("project_look_items"."y" between 0 and 100)
);
--> statement-breakpoint
CREATE TABLE "project_looks" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"title" varchar(64) NOT NULL,
	"description" text,
	"image" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "project_looks_id_project_unique" UNIQUE("id","project_id")
);
--> statement-breakpoint
CREATE TABLE "order_events" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"type" "order_event_type" NOT NULL,
	"by_user_id" text,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"product_id" text,
	"variant_id" text,
	"performer_employee_id" text,
	"name" varchar(255) NOT NULL,
	"type" "product_type" NOT NULL,
	"unit_price_amount" bigint NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"total_amount" bigint NOT NULL,
	"duration_minutes" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "order_items_quantity_positive" CHECK ("order_items"."quantity" > 0),
	CONSTRAINT "order_items_unit_price_non_negative" CHECK ("order_items"."unit_price_amount" >= 0),
	CONSTRAINT "order_items_total_non_negative" CHECK ("order_items"."total_amount" >= 0),
	CONSTRAINT "order_items_duration_positive" CHECK ("order_items"."duration_minutes" is null or "order_items"."duration_minutes" > 0)
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"organization_id" text NOT NULL,
	"type" "order_type" DEFAULT 'sale' NOT NULL,
	"status" "order_status" DEFAULT 'pending' NOT NULL,
	"client_id" text,
	"customer_name" varchar(255),
	"customer_phone" varchar(32),
	"customer_email" varchar(255),
	"assigned_employee_id" text,
	"scheduled_at" timestamp,
	"duration_minutes" integer,
	"completed_at" timestamp,
	"currency" "currency" DEFAULT 'RUB' NOT NULL,
	"subtotal_amount" bigint DEFAULT 0 NOT NULL,
	"discount_amount" bigint DEFAULT 0 NOT NULL,
	"total_amount" bigint DEFAULT 0 NOT NULL,
	"paid_amount" bigint DEFAULT 0 NOT NULL,
	"refunded_amount" bigint DEFAULT 0 NOT NULL,
	"payment_status" "payment_status" DEFAULT 'unpaid' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "orders_id_project_unique" UNIQUE("id","project_id"),
	CONSTRAINT "orders_subtotal_non_negative" CHECK ("orders"."subtotal_amount" >= 0),
	CONSTRAINT "orders_discount_non_negative" CHECK ("orders"."discount_amount" >= 0),
	CONSTRAINT "orders_total_non_negative" CHECK ("orders"."total_amount" >= 0),
	CONSTRAINT "orders_paid_non_negative" CHECK ("orders"."paid_amount" >= 0),
	CONSTRAINT "orders_refunded_non_negative" CHECK ("orders"."refunded_amount" >= 0),
	CONSTRAINT "orders_duration_positive" CHECK ("orders"."duration_minutes" is null or "orders"."duration_minutes" > 0),
	CONSTRAINT "orders_scheduled_for_booking" CHECK ("orders"."type" = 'sale' or "orders"."scheduled_at" is not null or "orders"."status" = 'cancelled')
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" text PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"plan" "subscription_plan" DEFAULT 'free' NOT NULL,
	"plan_expires_at" timestamp,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization_members" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"organization_id" text NOT NULL,
	"role" "organization_role" DEFAULT 'member' NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL,
	"left_at" timestamp,
	CONSTRAINT "organization_members_id_org_unique" UNIQUE("id","organization_id")
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"order_id" text NOT NULL,
	"direction" "payment_direction" NOT NULL,
	"amount" bigint NOT NULL,
	"method" "payment_method",
	"source_intent_id" text,
	"reason" varchar(255),
	"recorded_by" text,
	"collected_by_employee_id" text,
	"cash_shift_id" text,
	"occurred_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "payments_cash_shift_only_register_cash" CHECK ("payments"."cash_shift_id" is null or ("payments"."method" = 'cash' and "payments"."collected_by_employee_id" is null)),
	CONSTRAINT "payments_amount_positive" CHECK ("payments"."amount" > 0)
);
--> statement-breakpoint
CREATE TABLE "payment_intents" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"integration_id" text NOT NULL,
	"provider_payment_id" varchar(128),
	"order_id" text NOT NULL,
	"amount" bigint NOT NULL,
	"currency" "currency" NOT NULL,
	"status" "payment_intent_status" DEFAULT 'pending' NOT NULL,
	"confirmation_url" text,
	"idempotence_key" varchar(128) NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "payment_intents_amount_positive" CHECK ("payment_intents"."amount" > 0)
);
--> statement-breakpoint
CREATE TABLE "payouts" (
	"id" text PRIMARY KEY NOT NULL,
	"employee_id" text NOT NULL,
	"project_id" text NOT NULL,
	"organization_id" text NOT NULL,
	"period_start" timestamp NOT NULL,
	"period_end" timestamp NOT NULL,
	"shifts_count" integer DEFAULT 0 NOT NULL,
	"shift_rate_amount" bigint DEFAULT 0 NOT NULL,
	"shifts_pay" bigint DEFAULT 0 NOT NULL,
	"services_revenue" bigint DEFAULT 0 NOT NULL,
	"commission_rate" integer DEFAULT 0 NOT NULL,
	"commission_pay" bigint DEFAULT 0 NOT NULL,
	"deliveries_count" integer DEFAULT 0 NOT NULL,
	"delivery_rate_amount" bigint DEFAULT 0 NOT NULL,
	"deliveries_pay" bigint DEFAULT 0 NOT NULL,
	"total_amount" bigint DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "payouts_employee_project_period_unique" UNIQUE("employee_id","project_id","period_start","period_end"),
	CONSTRAINT "payouts_total_non_negative" CHECK ("payouts"."total_amount" >= 0)
);
--> statement-breakpoint
CREATE TABLE "product_badges" (
	"product_id" text NOT NULL,
	"badge_id" text NOT NULL,
	"project_id" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "product_badges_product_id_badge_id_pk" PRIMARY KEY("product_id","badge_id")
);
--> statement-breakpoint
CREATE TABLE "product_performers" (
	"product_id" text NOT NULL,
	"employee_id" text NOT NULL,
	"project_id" text NOT NULL,
	"organization_id" text NOT NULL,
	CONSTRAINT "product_performers_product_id_employee_id_pk" PRIMARY KEY("product_id","employee_id")
);
--> statement-breakpoint
CREATE TABLE "product_variants" (
	"id" text PRIMARY KEY NOT NULL,
	"product_id" text NOT NULL,
	"project_id" text NOT NULL,
	"option_values" jsonb NOT NULL,
	"sku" varchar(64),
	"price" bigint,
	"stock" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "product_variants_price_non_negative" CHECK ("product_variants"."price" is null or "product_variants"."price" >= 0),
	CONSTRAINT "product_variants_stock_non_negative" CHECK ("product_variants"."stock" is null or "product_variants"."stock" >= 0)
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"category_id" text,
	"type" "product_type" DEFAULT 'physical' NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(140) NOT NULL,
	"sku" varchar(64) NOT NULL,
	"description" text,
	"price" bigint DEFAULT 0 NOT NULL,
	"currency" "currency" DEFAULT 'RUB' NOT NULL,
	"status" "product_status" DEFAULT 'active' NOT NULL,
	"images" text[] DEFAULT '{}'::text[] NOT NULL,
	"attributes" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"options" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"stock" integer,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "products_id_project_unique" UNIQUE("id","project_id"),
	CONSTRAINT "products_stock_non_negative" CHECK ("products"."stock" is null or "products"."stock" >= 0),
	CONSTRAINT "products_stock_not_for_service" CHECK ("products"."type" <> 'service' or "products"."stock" is null)
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" "project_type" DEFAULT 'shop' NOT NULL,
	"slug" varchar(100) NOT NULL,
	"key" varchar(10) NOT NULL,
	"description" text,
	"color" varchar(7) DEFAULT '#3b82f6' NOT NULL,
	"default_currency" "currency" DEFAULT 'RUB' NOT NULL,
	"task_counter" integer DEFAULT 0 NOT NULL,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "projects_id_org_unique" UNIQUE("id","organization_id"),
	CONSTRAINT "key_format" CHECK ("projects"."key" ~ '^[A-Z]{2,10}$')
);
--> statement-breakpoint
CREATE TABLE "project_badges" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"code" varchar(32) NOT NULL,
	"label" varchar(64) NOT NULL,
	"color" varchar(9) DEFAULT '#737373' NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "project_badges_id_project_unique" UNIQUE("id","project_id")
);
--> statement-breakpoint
CREATE TABLE "project_categories" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"parent_id" text,
	"name" varchar(120) NOT NULL,
	"slug" varchar(140) NOT NULL,
	"type" "project_category_type" DEFAULT 'generic' NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "project_categories_id_project_unique" UNIQUE("id","project_id"),
	CONSTRAINT "project_categories_name_not_empty" CHECK (length(trim("project_categories"."name")) >= 1),
	CONSTRAINT "project_categories_no_self_parent" CHECK ("project_categories"."parent_id" IS NULL OR "project_categories"."parent_id" <> "project_categories"."id")
);
--> statement-breakpoint
CREATE TABLE "project_files" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"url" varchar(2048) NOT NULL,
	"size_bytes" bigint NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_invites" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"email" varchar(255),
	"token" varchar(64) NOT NULL,
	"verification_code" varchar(6) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"accepted_at" timestamp,
	"accepted_by" text,
	"revoked_at" timestamp,
	"created_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_members" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"project_id" text NOT NULL,
	"role" "project_role" DEFAULT 'guest' NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL,
	"left_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "stock_movements" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"product_id" text NOT NULL,
	"variant_id" text,
	"quantity_delta" integer NOT NULL,
	"reason" "stock_movement_reason" NOT NULL,
	"order_id" text,
	"note" text,
	"created_by" text,
	"occurred_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "stock_movements_quantity_delta_non_zero" CHECK ("stock_movements"."quantity_delta" <> 0)
);
--> statement-breakpoint
CREATE TABLE "stock_reservations" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"order_id" text NOT NULL,
	"product_id" text NOT NULL,
	"variant_id" text,
	"quantity" integer NOT NULL,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "stock_reservations_quantity_positive" CHECK ("stock_reservations"."quantity" > 0)
);
--> statement-breakpoint
CREATE TABLE "billing_payments" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"plan" "subscription_plan" NOT NULL,
	"amount" bigint NOT NULL,
	"period_days" integer DEFAULT 30 NOT NULL,
	"currency" "currency" NOT NULL,
	"status" "billing_payment_status" DEFAULT 'pending' NOT NULL,
	"provider_session_id" varchar(255) NOT NULL,
	"created_by" text,
	"paid_at" timestamp,
	"period_end" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "billing_payments_amount_positive" CHECK ("billing_payments"."amount" > 0),
	CONSTRAINT "billing_payments_paid_shape" CHECK (("billing_payments"."status" = 'paid') = ("billing_payments"."paid_at" is not null and "billing_payments"."period_end" is not null))
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"number" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"status" "task_status" DEFAULT 'todo' NOT NULL,
	"priority" "task_priority" DEFAULT 'none' NOT NULL,
	"assignee_user_id" text,
	"due_at" timestamp,
	"labels" text[] DEFAULT '{}'::text[] NOT NULL,
	"subtasks" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"chat_message_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"access_token_expires_at" timestamp (6) with time zone,
	"refresh_token_expires_at" timestamp (6) with time zone,
	"scope" text,
	"id_token" text,
	"password" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"token" varchar(255) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verifications" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cash_collections" ADD CONSTRAINT "cash_collections_cash_shift_id_cash_shifts_id_fk" FOREIGN KEY ("cash_shift_id") REFERENCES "public"."cash_shifts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cash_collections" ADD CONSTRAINT "cash_collections_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cash_shifts" ADD CONSTRAINT "cash_shifts_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cash_shifts" ADD CONSTRAINT "cash_shifts_opened_by_users_id_fk" FOREIGN KEY ("opened_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cash_shifts" ADD CONSTRAINT "cash_shifts_closed_by_users_id_fk" FOREIGN KEY ("closed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courier_handovers" ADD CONSTRAINT "courier_handovers_cash_shift_id_cash_shifts_id_fk" FOREIGN KEY ("cash_shift_id") REFERENCES "public"."cash_shifts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courier_handovers" ADD CONSTRAINT "courier_handovers_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courier_handovers" ADD CONSTRAINT "courier_handovers_employee_id_organization_members_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."organization_members"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courier_handovers" ADD CONSTRAINT "courier_handovers_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courier_handovers" ADD CONSTRAINT "courier_handovers_shift_project_fk" FOREIGN KEY ("cash_shift_id","project_id") REFERENCES "public"."cash_shifts"("id","project_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_attachments" ADD CONSTRAINT "chat_attachments_channel_id_chat_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."chat_channels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_attachments" ADD CONSTRAINT "chat_attachments_message_id_chat_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."chat_messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_attachments" ADD CONSTRAINT "chat_attachments_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_channels" ADD CONSTRAINT "chat_channels_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_channels" ADD CONSTRAINT "chat_channels_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_channels" ADD CONSTRAINT "chat_channels_user_a_id_users_id_fk" FOREIGN KEY ("user_a_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_channels" ADD CONSTRAINT "chat_channels_user_b_id_users_id_fk" FOREIGN KEY ("user_b_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_message_reactions" ADD CONSTRAINT "chat_message_reactions_message_id_chat_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."chat_messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_message_reactions" ADD CONSTRAINT "chat_message_reactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_channel_id_chat_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."chat_channels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_author_user_id_users_id_fk" FOREIGN KEY ("author_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_reply_to_id_chat_messages_id_fk" FOREIGN KEY ("reply_to_id") REFERENCES "public"."chat_messages"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_thread_root_id_chat_messages_id_fk" FOREIGN KEY ("thread_root_id") REFERENCES "public"."chat_messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_reads" ADD CONSTRAINT "chat_reads_channel_id_chat_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."chat_channels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_reads" ADD CONSTRAINT "chat_reads_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_redemptions" ADD CONSTRAINT "coupon_redemptions_coupon_id_coupons_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_redemptions" ADD CONSTRAINT "coupon_redemptions_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_redemptions" ADD CONSTRAINT "coupon_redemptions_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_redemptions" ADD CONSTRAINT "coupon_redemptions_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_redemptions" ADD CONSTRAINT "coupon_redemptions_coupon_project_fk" FOREIGN KEY ("coupon_id","project_id") REFERENCES "public"."coupons"("id","project_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_redemptions" ADD CONSTRAINT "coupon_redemptions_order_project_fk" FOREIGN KEY ("order_id","project_id") REFERENCES "public"."orders"("id","project_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_redemptions" ADD CONSTRAINT "coupon_redemptions_client_project_fk" FOREIGN KEY ("client_id","project_id") REFERENCES "public"."clients"("id","project_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupons" ADD CONSTRAINT "coupons_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_courier_id_organization_members_id_fk" FOREIGN KEY ("courier_id") REFERENCES "public"."organization_members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_project_org_fk" FOREIGN KEY ("project_id","organization_id") REFERENCES "public"."projects"("id","organization_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_order_project_fk" FOREIGN KEY ("order_id","project_id") REFERENCES "public"."orders"("id","project_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_courier_org_fk" FOREIGN KEY ("courier_id","organization_id") REFERENCES "public"."organization_members"("id","organization_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_assignments" ADD CONSTRAINT "employee_assignments_employee_id_organization_members_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."organization_members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_assignments" ADD CONSTRAINT "employee_assignments_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_assignments" ADD CONSTRAINT "employee_assignments_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_assignments" ADD CONSTRAINT "employee_assignments_employee_org_fk" FOREIGN KEY ("employee_id","organization_id") REFERENCES "public"."organization_members"("id","organization_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_assignments" ADD CONSTRAINT "employee_assignments_project_org_fk" FOREIGN KEY ("project_id","organization_id") REFERENCES "public"."projects"("id","organization_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_shifts" ADD CONSTRAINT "employee_shifts_employee_id_organization_members_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."organization_members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_shifts" ADD CONSTRAINT "employee_shifts_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_shifts" ADD CONSTRAINT "employee_shifts_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_shifts" ADD CONSTRAINT "employee_shifts_employee_org_fk" FOREIGN KEY ("employee_id","organization_id") REFERENCES "public"."organization_members"("id","organization_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_shifts" ADD CONSTRAINT "employee_shifts_project_org_fk" FOREIGN KEY ("project_id","organization_id") REFERENCES "public"."projects"("id","organization_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_integrations" ADD CONSTRAINT "project_integrations_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_look_items" ADD CONSTRAINT "project_look_items_look_project_fk" FOREIGN KEY ("look_id","project_id") REFERENCES "public"."project_looks"("id","project_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_look_items" ADD CONSTRAINT "project_look_items_product_project_fk" FOREIGN KEY ("product_id","project_id") REFERENCES "public"."products"("id","project_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_looks" ADD CONSTRAINT "project_looks_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_events" ADD CONSTRAINT "order_events_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_events" ADD CONSTRAINT "order_events_by_user_id_users_id_fk" FOREIGN KEY ("by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_performer_employee_id_organization_members_id_fk" FOREIGN KEY ("performer_employee_id") REFERENCES "public"."organization_members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_assigned_employee_id_organization_members_id_fk" FOREIGN KEY ("assigned_employee_id") REFERENCES "public"."organization_members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_client_project_fk" FOREIGN KEY ("client_id","project_id") REFERENCES "public"."clients"("id","project_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_project_org_fk" FOREIGN KEY ("project_id","organization_id") REFERENCES "public"."projects"("id","organization_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_employee_org_fk" FOREIGN KEY ("assigned_employee_id","organization_id") REFERENCES "public"."organization_members"("id","organization_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_source_intent_id_payment_intents_id_fk" FOREIGN KEY ("source_intent_id") REFERENCES "public"."payment_intents"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_recorded_by_users_id_fk" FOREIGN KEY ("recorded_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_collected_by_employee_id_organization_members_id_fk" FOREIGN KEY ("collected_by_employee_id") REFERENCES "public"."organization_members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_project_fk" FOREIGN KEY ("order_id","project_id") REFERENCES "public"."orders"("id","project_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_cash_shift_project_fk" FOREIGN KEY ("cash_shift_id","project_id") REFERENCES "public"."cash_shifts"("id","project_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_intents" ADD CONSTRAINT "payment_intents_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_intents" ADD CONSTRAINT "payment_intents_order_project_fk" FOREIGN KEY ("order_id","project_id") REFERENCES "public"."orders"("id","project_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_intents" ADD CONSTRAINT "payment_intents_integration_project_fk" FOREIGN KEY ("integration_id","project_id") REFERENCES "public"."project_integrations"("id","project_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_employee_id_organization_members_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."organization_members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_employee_org_fk" FOREIGN KEY ("employee_id","organization_id") REFERENCES "public"."organization_members"("id","organization_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_project_org_fk" FOREIGN KEY ("project_id","organization_id") REFERENCES "public"."projects"("id","organization_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_badges" ADD CONSTRAINT "product_badges_product_project_fk" FOREIGN KEY ("product_id","project_id") REFERENCES "public"."products"("id","project_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_badges" ADD CONSTRAINT "product_badges_badge_project_fk" FOREIGN KEY ("badge_id","project_id") REFERENCES "public"."project_badges"("id","project_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_performers" ADD CONSTRAINT "product_performers_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_performers" ADD CONSTRAINT "product_performers_product_project_fk" FOREIGN KEY ("product_id","project_id") REFERENCES "public"."products"("id","project_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_performers" ADD CONSTRAINT "product_performers_employee_org_fk" FOREIGN KEY ("employee_id","organization_id") REFERENCES "public"."organization_members"("id","organization_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_product_project_fk" FOREIGN KEY ("product_id","project_id") REFERENCES "public"."products"("id","project_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_project_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."project_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_category_project_fk" FOREIGN KEY ("category_id","project_id") REFERENCES "public"."project_categories"("id","project_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_badges" ADD CONSTRAINT "project_badges_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_categories" ADD CONSTRAINT "project_categories_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_categories" ADD CONSTRAINT "project_categories_parent_id_project_categories_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."project_categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_categories" ADD CONSTRAINT "project_categories_parent_project_fk" FOREIGN KEY ("parent_id","project_id") REFERENCES "public"."project_categories"("id","project_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_files" ADD CONSTRAINT "project_files_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_invites" ADD CONSTRAINT "project_invites_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_invites" ADD CONSTRAINT "project_invites_accepted_by_users_id_fk" FOREIGN KEY ("accepted_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_invites" ADD CONSTRAINT "project_invites_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_product_project_fk" FOREIGN KEY ("product_id","project_id") REFERENCES "public"."products"("id","project_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_order_project_fk" FOREIGN KEY ("order_id","project_id") REFERENCES "public"."orders"("id","project_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_reservations" ADD CONSTRAINT "stock_reservations_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_reservations" ADD CONSTRAINT "stock_reservations_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_reservations" ADD CONSTRAINT "stock_reservations_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_reservations" ADD CONSTRAINT "stock_reservations_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_reservations" ADD CONSTRAINT "stock_reservations_order_project_fk" FOREIGN KEY ("order_id","project_id") REFERENCES "public"."orders"("id","project_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_payments" ADD CONSTRAINT "billing_payments_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_payments" ADD CONSTRAINT "billing_payments_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assignee_user_id_users_id_fk" FOREIGN KEY ("assignee_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_chat_message_id_chat_messages_id_fk" FOREIGN KEY ("chat_message_id") REFERENCES "public"."chat_messages"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_audit_logs_org_created" ON "audit_logs" USING btree ("organization_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_audit_logs_action" ON "audit_logs" USING btree ("action");--> statement-breakpoint
CREATE INDEX "cash_collections_shift_idx" ON "cash_collections" USING btree ("cash_shift_id");--> statement-breakpoint
CREATE UNIQUE INDEX "cash_shifts_one_open_per_project" ON "cash_shifts" USING btree ("project_id") WHERE "cash_shifts"."closed_at" is null;--> statement-breakpoint
CREATE INDEX "cash_shifts_project_idx" ON "cash_shifts" USING btree ("project_id","created_at");--> statement-breakpoint
CREATE INDEX "courier_handovers_shift_idx" ON "courier_handovers" USING btree ("cash_shift_id");--> statement-breakpoint
CREATE INDEX "courier_handovers_employee_idx" ON "courier_handovers" USING btree ("project_id","employee_id");--> statement-breakpoint
CREATE UNIQUE INDEX "chat_attachments_channel_filename_unique" ON "chat_attachments" USING btree ("channel_id","filename");--> statement-breakpoint
CREATE INDEX "chat_attachments_message_idx" ON "chat_attachments" USING btree ("message_id");--> statement-breakpoint
CREATE INDEX "chat_attachments_channel_created_idx" ON "chat_attachments" USING btree ("channel_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "chat_channels_org_unique" ON "chat_channels" USING btree ("organization_id") WHERE "chat_channels"."type" = 'organization';--> statement-breakpoint
CREATE UNIQUE INDEX "chat_channels_project_unique" ON "chat_channels" USING btree ("project_id") WHERE "chat_channels"."type" = 'project';--> statement-breakpoint
CREATE UNIQUE INDEX "chat_channels_direct_unique" ON "chat_channels" USING btree ("organization_id","user_a_id","user_b_id") WHERE "chat_channels"."type" = 'direct';--> statement-breakpoint
CREATE INDEX "chat_channels_org_idx" ON "chat_channels" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "chat_channels_user_a_idx" ON "chat_channels" USING btree ("user_a_id");--> statement-breakpoint
CREATE INDEX "chat_channels_user_b_idx" ON "chat_channels" USING btree ("user_b_id");--> statement-breakpoint
CREATE INDEX "chat_messages_channel_created_idx" ON "chat_messages" USING btree ("channel_id","created_at");--> statement-breakpoint
CREATE INDEX "chat_messages_author_idx" ON "chat_messages" USING btree ("author_user_id");--> statement-breakpoint
CREATE INDEX "chat_messages_reply_idx" ON "chat_messages" USING btree ("reply_to_id");--> statement-breakpoint
CREATE INDEX "chat_messages_thread_idx" ON "chat_messages" USING btree ("thread_root_id","created_at");--> statement-breakpoint
CREATE INDEX "chat_messages_pinned_idx" ON "chat_messages" USING btree ("channel_id","pinned_at");--> statement-breakpoint
CREATE INDEX "chat_reads_user_idx" ON "chat_reads" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "clients_project_email_unique" ON "clients" USING btree ("project_id","email");--> statement-breakpoint
CREATE INDEX "clients_project_idx" ON "clients" USING btree ("project_id");--> statement-breakpoint
CREATE UNIQUE INDEX "coupon_redemptions_coupon_order_unique" ON "coupon_redemptions" USING btree ("coupon_id","order_id");--> statement-breakpoint
CREATE INDEX "coupon_redemptions_coupon_client_idx" ON "coupon_redemptions" USING btree ("coupon_id","client_id");--> statement-breakpoint
CREATE UNIQUE INDEX "coupons_project_code_unique" ON "coupons" USING btree ("project_id","code") WHERE "coupons"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "coupons_project_idx" ON "coupons" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "coupons_status_idx" ON "coupons" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "deliveries_order_unique" ON "deliveries" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "deliveries_project_status_idx" ON "deliveries" USING btree ("project_id","status");--> statement-breakpoint
CREATE INDEX "deliveries_courier_window_idx" ON "deliveries" USING btree ("courier_id","window_start");--> statement-breakpoint
CREATE UNIQUE INDEX "employee_assignments_active_unique" ON "employee_assignments" USING btree ("employee_id","project_id") WHERE "employee_assignments"."ended_at" is null;--> statement-breakpoint
CREATE INDEX "employee_assignments_project_idx" ON "employee_assignments" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "employee_assignments_employee_idx" ON "employee_assignments" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "employee_shifts_employee_starts_idx" ON "employee_shifts" USING btree ("employee_id","starts_at");--> statement-breakpoint
CREATE INDEX "employee_shifts_project_starts_idx" ON "employee_shifts" USING btree ("project_id","starts_at");--> statement-breakpoint
CREATE INDEX "employee_shifts_status_idx" ON "employee_shifts" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "project_integrations_project_name_unique" ON "project_integrations" USING btree ("project_id","name");--> statement-breakpoint
CREATE UNIQUE INDEX "project_integrations_api_key_hash_unique" ON "project_integrations" USING btree ("api_key_hash") WHERE "project_integrations"."api_key_hash" is not null;--> statement-breakpoint
CREATE INDEX "project_integrations_project_idx" ON "project_integrations" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "project_look_items_look_idx" ON "project_look_items" USING btree ("look_id");--> statement-breakpoint
CREATE INDEX "project_looks_project_idx" ON "project_looks" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "order_events_order_idx" ON "order_events" USING btree ("order_id","created_at");--> statement-breakpoint
CREATE INDEX "order_events_type_idx" ON "order_events" USING btree ("type");--> statement-breakpoint
CREATE INDEX "order_items_order_idx" ON "order_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "order_items_product_idx" ON "order_items" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "order_items_variant_idx" ON "order_items" USING btree ("variant_id") WHERE "order_items"."variant_id" is not null;--> statement-breakpoint
CREATE INDEX "order_items_performer_idx" ON "order_items" USING btree ("performer_employee_id");--> statement-breakpoint
CREATE INDEX "orders_project_status_idx" ON "orders" USING btree ("project_id","status");--> statement-breakpoint
CREATE INDEX "orders_project_scheduled_idx" ON "orders" USING btree ("project_id","scheduled_at");--> statement-breakpoint
CREATE INDEX "orders_project_created_idx" ON "orders" USING btree ("project_id","created_at");--> statement-breakpoint
CREATE INDEX "orders_employee_scheduled_idx" ON "orders" USING btree ("assigned_employee_id","scheduled_at");--> statement-breakpoint
CREATE INDEX "orders_client_idx" ON "orders" USING btree ("client_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_organizations_created_by" ON "organizations" USING btree ("created_by");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_org_members_user_id" ON "organization_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_org_members_org_id" ON "organization_members" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_org_members_role" ON "organization_members" USING btree ("role");--> statement-breakpoint
CREATE INDEX "idx_org_members_org_left_joined" ON "organization_members" USING btree ("organization_id","left_at","joined_at");--> statement-breakpoint
CREATE INDEX "idx_org_members_org_role_left" ON "organization_members" USING btree ("organization_id","role","left_at");--> statement-breakpoint
CREATE INDEX "payments_cash_shift_idx" ON "payments" USING btree ("cash_shift_id") WHERE "payments"."cash_shift_id" is not null;--> statement-breakpoint
CREATE INDEX "payments_order_idx" ON "payments" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "payments_project_created_idx" ON "payments" USING btree ("project_id","created_at");--> statement-breakpoint
CREATE INDEX "payments_collected_by_idx" ON "payments" USING btree ("collected_by_employee_id") WHERE "payments"."collected_by_employee_id" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "payments_source_intent_charge_unique" ON "payments" USING btree ("source_intent_id") WHERE "payments"."source_intent_id" is not null and "payments"."direction" = 'charge';--> statement-breakpoint
CREATE UNIQUE INDEX "payment_intents_integration_provider_payment_unique" ON "payment_intents" USING btree ("integration_id","provider_payment_id") WHERE "payment_intents"."provider_payment_id" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "payment_intents_integration_idempotence_unique" ON "payment_intents" USING btree ("integration_id","idempotence_key");--> statement-breakpoint
CREATE INDEX "payment_intents_order_idx" ON "payment_intents" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "payment_intents_project_created_idx" ON "payment_intents" USING btree ("project_id","created_at");--> statement-breakpoint
CREATE INDEX "payment_intents_status_idx" ON "payment_intents" USING btree ("status");--> statement-breakpoint
CREATE INDEX "payouts_project_period_idx" ON "payouts" USING btree ("project_id","period_start","period_end");--> statement-breakpoint
CREATE INDEX "product_badges_badge_idx" ON "product_badges" USING btree ("badge_id");--> statement-breakpoint
CREATE INDEX "product_performers_employee_idx" ON "product_performers" USING btree ("employee_id","project_id");--> statement-breakpoint
CREATE UNIQUE INDEX "product_variants_combo_unique" ON "product_variants" USING btree ("product_id",("option_values"::text));--> statement-breakpoint
CREATE UNIQUE INDEX "product_variants_project_sku_unique" ON "product_variants" USING btree ("project_id","sku") WHERE "product_variants"."sku" is not null;--> statement-breakpoint
CREATE INDEX "product_variants_product_idx" ON "product_variants" USING btree ("product_id");--> statement-breakpoint
CREATE UNIQUE INDEX "products_project_slug_unique" ON "products" USING btree ("project_id","slug") WHERE "products"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "products_project_sku_unique" ON "products" USING btree ("project_id","sku") WHERE "products"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "products_project_idx" ON "products" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "products_category_idx" ON "products" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "products_status_idx" ON "products" USING btree ("status");--> statement-breakpoint
CREATE INDEX "products_type_idx" ON "products" USING btree ("type");--> statement-breakpoint
CREATE INDEX "products_deleted_idx" ON "products" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "products_featured_idx" ON "products" USING btree ("is_featured");--> statement-breakpoint
CREATE UNIQUE INDEX "projects_organization_slug_unique" ON "projects" USING btree ("organization_id","slug") WHERE "projects"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "projects_organization_key_unique" ON "projects" USING btree ("organization_id","key") WHERE "projects"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "projects_organization_id_idx" ON "projects" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "project_badges_project_code_unique" ON "project_badges" USING btree ("project_id","code") WHERE "project_badges"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "project_badges_project_idx" ON "project_badges" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "project_badges_active_idx" ON "project_badges" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "project_categories_project_idx" ON "project_categories" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "project_categories_parent_idx" ON "project_categories" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "project_categories_project_parent_position_idx" ON "project_categories" USING btree ("project_id","parent_id","position");--> statement-breakpoint
CREATE UNIQUE INDEX "project_categories_project_parent_slug_unique" ON "project_categories" USING btree ("project_id",coalesce("parent_id", ''),"slug") WHERE "project_categories"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "project_files_project_url_unique" ON "project_files" USING btree ("project_id","url");--> statement-breakpoint
CREATE INDEX "project_files_project_idx" ON "project_files" USING btree ("project_id");--> statement-breakpoint
CREATE UNIQUE INDEX "project_invites_token_unique" ON "project_invites" USING btree ("token");--> statement-breakpoint
CREATE INDEX "project_invites_project_idx" ON "project_invites" USING btree ("project_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_project_members" ON "project_members" USING btree ("user_id","project_id");--> statement-breakpoint
CREATE INDEX "idx_project_members_project" ON "project_members" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "stock_movements_project_idx" ON "stock_movements" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "stock_movements_product_idx" ON "stock_movements" USING btree ("product_id","occurred_at");--> statement-breakpoint
CREATE UNIQUE INDEX "stock_movements_order_line_reason_unique" ON "stock_movements" USING btree ("order_id","product_id",coalesce("variant_id", ''),"reason") WHERE "stock_movements"."order_id" is not null;--> statement-breakpoint
CREATE INDEX "stock_reservations_product_idx" ON "stock_reservations" USING btree ("product_id","variant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "stock_reservations_order_line_unique" ON "stock_reservations" USING btree ("order_id","product_id",coalesce("variant_id", ''));--> statement-breakpoint
CREATE UNIQUE INDEX "billing_payments_provider_session_unique" ON "billing_payments" USING btree ("provider_session_id");--> statement-breakpoint
CREATE INDEX "billing_payments_organization_idx" ON "billing_payments" USING btree ("organization_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "tasks_project_number_unique" ON "tasks" USING btree ("project_id","number");--> statement-breakpoint
CREATE INDEX "tasks_project_status_idx" ON "tasks" USING btree ("project_id","status");--> statement-breakpoint
CREATE INDEX "tasks_assignee_idx" ON "tasks" USING btree ("assignee_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tasks_chat_message_unique" ON "tasks" USING btree ("chat_message_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_accounts_provider_account" ON "accounts" USING btree ("provider_id","account_id");--> statement-breakpoint
CREATE INDEX "idx_accounts_user_id" ON "accounts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_sessions_user_id" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_sessions_expires_at" ON "sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_verifications_identifier_value" ON "verifications" USING btree ("identifier","value");--> statement-breakpoint
CREATE INDEX "idx_verifications_expires_at" ON "verifications" USING btree ("expires_at");