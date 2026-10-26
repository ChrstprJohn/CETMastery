CREATE SCHEMA IF NOT EXISTS "app_private";

CREATE TABLE "app_private"."profiles" (
    "id" UUID NOT NULL,
    "display_name" VARCHAR(120),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- The API owns application data access. No browser policies are granted.
ALTER TABLE "app_private"."profiles" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON SCHEMA "app_private" FROM PUBLIC;
REVOKE ALL ON TABLE "app_private"."profiles" FROM PUBLIC;
