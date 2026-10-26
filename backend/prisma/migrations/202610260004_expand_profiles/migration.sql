ALTER TABLE "app_private"."profiles"
    ADD COLUMN "first_name" VARCHAR(120),
    ADD COLUMN "last_name" VARCHAR(120),
    ADD COLUMN "avatar_url" VARCHAR(2048),
    ADD COLUMN "locale" VARCHAR(35),
    ADD COLUMN "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "app_private"."profiles" SET "updated_at" = "created_at";
