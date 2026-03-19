ALTER TABLE "clients"
ADD COLUMN IF NOT EXISTS "is_personal" boolean DEFAULT false NOT NULL;
