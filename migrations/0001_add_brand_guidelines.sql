ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "brand_logo" text;
ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "brand_colors" jsonb;
ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "brand_typography" jsonb;
