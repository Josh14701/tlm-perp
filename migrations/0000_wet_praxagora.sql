CREATE TABLE "activity_log" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"action" text NOT NULL,
	"description" text NOT NULL,
	"user_id" varchar,
	"resource_type" text,
	"resource_id" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "agency_settings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agency_name" text DEFAULT 'ThirdLink Marketing' NOT NULL,
	"logo" text,
	"brand_colors" jsonb,
	"timezone" text DEFAULT 'Australia/Sydney',
	"working_hours" text DEFAULT '9:00-17:00',
	"ai_voice" text DEFAULT 'professional',
	"ai_tone" text DEFAULT 'friendly and strategic',
	"custom_prompt_templates" jsonb,
	"email_templates" jsonb,
	"notification_prefs" jsonb,
	"appearance" text DEFAULT 'system'
);
--> statement-breakpoint
CREATE TABLE "ai_sessions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" varchar NOT NULL,
	"title" text NOT NULL,
	"messages" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "clients" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_name" text NOT NULL,
	"industry" text,
	"website" text,
	"mrr" real DEFAULT 0,
	"status" text DEFAULT 'onboarding' NOT NULL,
	"contract_start" text,
	"contract_end" text,
	"notes" text,
	"assigned_team" text[],
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "content_pieces" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" varchar NOT NULL,
	"title" text NOT NULL,
	"type" text NOT NULL,
	"status" text DEFAULT 'idea' NOT NULL,
	"script" text,
	"caption" text,
	"hashtags" text[],
	"platforms" text[],
	"scheduled_date" text,
	"assigned_to" varchar,
	"plan_id" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "content_plans" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" varchar NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"ideas" jsonb,
	"status" text DEFAULT 'draft' NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "contracts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" varchar NOT NULL,
	"service_description" text NOT NULL,
	"monthly_value" real NOT NULL,
	"start_date" text NOT NULL,
	"end_date" text,
	"payment_terms" text,
	"gst_handling" text DEFAULT 'inclusive',
	"status" text DEFAULT 'draft' NOT NULL,
	"agency_signature" text,
	"client_signature" text,
	"signed_at" text,
	"share_token" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "generated_images" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"prompt" text NOT NULL,
	"model" text DEFAULT 'nano_banana_2' NOT NULL,
	"image_data" text NOT NULL,
	"style_notes" text,
	"client_id" varchar,
	"status" text DEFAULT 'pending',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "knowledge_base" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" varchar NOT NULL,
	"category" text NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contact_name" text NOT NULL,
	"email" text,
	"phone" text,
	"company" text,
	"proposal_value" real DEFAULT 0,
	"notes" text,
	"stage" text DEFAULT 'new' NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "revenue_goals" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" text NOT NULL,
	"target" real NOT NULL,
	"period" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "share_links" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" text NOT NULL,
	"resource_id" varchar NOT NULL,
	"token" text NOT NULL,
	"expires_at" text,
	"client_id" varchar,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "share_links_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "social_analytics" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" varchar NOT NULL,
	"platform" text NOT NULL,
	"date" text NOT NULL,
	"followers" integer DEFAULT 0,
	"impressions" integer DEFAULT 0,
	"engagement_rate" real DEFAULT 0,
	"reach" integer DEFAULT 0,
	"likes" integer DEFAULT 0,
	"comments" integer DEFAULT 0,
	"shares" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'todo' NOT NULL,
	"due_date" text,
	"assigned_to" varchar,
	"client_id" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "team_invites" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"role" text DEFAULT 'strategist' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"invited_by" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"avatar" text,
	"role" text DEFAULT 'strategist' NOT NULL,
	"agency_id" varchar,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
