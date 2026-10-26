CREATE TABLE "app_private"."subjects" (
    "id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "slug" VARCHAR(160) NOT NULL,
    "description" VARCHAR(2000) NOT NULL DEFAULT '',
    "sort_order" INTEGER NOT NULL DEFAULT 0 CHECK ("sort_order" >= 0),
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "subjects_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "subjects_slug_key" ON "app_private"."subjects" ("slug");
CREATE INDEX "subjects_sort_order_id_idx" ON "app_private"."subjects" ("sort_order", "id");
ALTER TABLE "app_private"."subjects" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "app_private"."subjects" FROM PUBLIC, anon, authenticated;

CREATE TABLE "app_private"."topics" (
    "id" UUID NOT NULL,
    "subject_id" UUID NOT NULL REFERENCES "app_private"."subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    "title" VARCHAR(120) NOT NULL,
    "slug" VARCHAR(160) NOT NULL,
    "description" VARCHAR(2000) NOT NULL DEFAULT '',
    "sort_order" INTEGER NOT NULL DEFAULT 0 CHECK ("sort_order" >= 0),
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "topics_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "topics_subject_id_slug_key" ON "app_private"."topics" ("subject_id", "slug");
CREATE INDEX "topics_subject_id_sort_order_id_idx" ON "app_private"."topics" ("subject_id", "sort_order", "id");
ALTER TABLE "app_private"."topics" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "app_private"."topics" FROM PUBLIC, anon, authenticated;

CREATE TABLE "app_private"."lessons" (
    "id" UUID NOT NULL,
    "topic_id" UUID NOT NULL REFERENCES "app_private"."topics"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    "title" VARCHAR(120) NOT NULL,
    "slug" VARCHAR(160) NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "summary" VARCHAR(2000) NOT NULL DEFAULT '',
    "sort_order" INTEGER NOT NULL DEFAULT 0 CHECK ("sort_order" >= 0),
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "lessons_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "lessons_topic_id_slug_key" ON "app_private"."lessons" ("topic_id", "slug");
CREATE INDEX "lessons_topic_id_sort_order_id_idx" ON "app_private"."lessons" ("topic_id", "sort_order", "id");
ALTER TABLE "app_private"."lessons" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "app_private"."lessons" FROM PUBLIC, anon, authenticated;

