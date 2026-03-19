CREATE TABLE IF NOT EXISTS "share_feedback" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "share_link_id" varchar NOT NULL,
  "resource_type" text NOT NULL,
  "resource_id" varchar NOT NULL,
  "kind" text DEFAULT 'comment' NOT NULL,
  "author_name" text,
  "author_email" text,
  "message" text,
  "created_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "invoice_drafts" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "client_id" varchar NOT NULL,
  "contract_id" varchar,
  "title" text NOT NULL,
  "recipient_name" text NOT NULL,
  "recipient_email" text,
  "billing_company" text,
  "billing_abn" text,
  "currency" text DEFAULT 'aud' NOT NULL,
  "line_items" jsonb,
  "notes" text,
  "payment_terms" text,
  "due_in_days" integer DEFAULT 14,
  "status" text DEFAULT 'draft' NOT NULL,
  "stripe_invoice_id" text,
  "stripe_invoice_url" text,
  "stripe_invoice_pdf" text,
  "last_synced_at" timestamp,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);
