CREATE TYPE "app_private"."ProfileRole" AS ENUM ('user', 'admin');

ALTER TABLE "app_private"."profiles"
ADD COLUMN "role" "app_private"."ProfileRole" NOT NULL DEFAULT 'user';

-- Profiles are server-managed, including role assignments.
REVOKE ALL ON TABLE "app_private"."profiles" FROM PUBLIC, anon, authenticated;
