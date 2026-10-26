CREATE TABLE "app_private"."crud_tests" (
    "id" UUID NOT NULL,
    "message" VARCHAR(200) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "crud_tests_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "app_private"."crud_tests" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "app_private"."crud_tests" FROM PUBLIC;
