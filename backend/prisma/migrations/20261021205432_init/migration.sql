-- CreateEnum
CREATE TYPE "Role" AS ENUM ('admin', 'dependencia');

-- CreateEnum
CREATE TYPE "CourseType" AS ENUM ('curso', 'charla', 'taller', 'seminario', 'diploma');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('enrolled', 'completed');

-- CreateEnum
CREATE TYPE "CertificateStatus" AS ENUM ('valid', 'revoked');

-- CreateEnum
CREATE TYPE "Orientation" AS ENUM ('landscape', 'portrait');

-- CreateEnum
CREATE TYPE "PageSize" AS ENUM ('letter', 'A4');

-- CreateTable
CREATE TABLE "dependencies" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "abbreviation" VARCHAR(50),
    "logo_path" VARCHAR(500),
    "manager_name" VARCHAR(255),
    "signature_path" VARCHAR(500),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dependencies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "full_name" VARCHAR(255) NOT NULL,
    "role" "Role" NOT NULL,
    "dependency_id" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certificate_templates" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "html_content" TEXT NOT NULL,
    "orientation" "Orientation" NOT NULL DEFAULT 'landscape',
    "page_size" "PageSize" NOT NULL DEFAULT 'letter',
    "thumbnail_path" VARCHAR(500),
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER,

    CONSTRAINT "certificate_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "courses" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(500) NOT NULL,
    "description" TEXT,
    "type" "CourseType" NOT NULL,
    "duration_hours" INTEGER,
    "instructor" VARCHAR(255),
    "signature_path" VARCHAR(500),
    "template_id" INTEGER,
    "start_date" DATE,
    "end_date" DATE,
    "dependency_id" INTEGER,
    "created_by" INTEGER,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_dependencies" (
    "id" SERIAL NOT NULL,
    "course_id" INTEGER NOT NULL,
    "dependency_id" INTEGER NOT NULL,
    "display_order" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "course_dependencies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "participants" (
    "id" SERIAL NOT NULL,
    "full_name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255),
    "dependency_id" INTEGER,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "logo_path" VARCHAR(500),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "participant_tags" (
    "id" SERIAL NOT NULL,
    "participant_id" INTEGER NOT NULL,
    "tag_id" INTEGER NOT NULL,

    CONSTRAINT "participant_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "branding_versions" (
    "id" SERIAL NOT NULL,
    "version_label" VARCHAR(50) NOT NULL,
    "logo_path" VARCHAR(500) NOT NULL,
    "primary_color" VARCHAR(7) NOT NULL,
    "secondary_color" VARCHAR(7) NOT NULL,
    "font_family" VARCHAR(100) NOT NULL,
    "organization_name" VARCHAR(255) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER,

    CONSTRAINT "branding_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certificates" (
    "id" SERIAL NOT NULL,
    "uuid" UUID NOT NULL DEFAULT gen_random_uuid(),
    "participant_id" INTEGER NOT NULL,
    "course_id" INTEGER NOT NULL,
    "issued_by" INTEGER,
    "issue_date" DATE NOT NULL,
    "branding_version_id" INTEGER,
    "template_id" INTEGER,
    "pdf_path" VARCHAR(500),
    "status" "CertificateStatus" NOT NULL DEFAULT 'valid',
    "revocation_reason" TEXT,
    "revoked_at" TIMESTAMP(6),
    "revoked_by" INTEGER,
    "reprint_count" INTEGER NOT NULL DEFAULT 0,
    "last_reprinted_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "certificates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "revocation_log" (
    "id" SERIAL NOT NULL,
    "certificate_id" INTEGER NOT NULL,
    "revoked_by" INTEGER,
    "reason" TEXT NOT NULL,
    "revoked_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "revocation_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_participants" (
    "id" SERIAL NOT NULL,
    "course_id" INTEGER NOT NULL,
    "participant_id" INTEGER NOT NULL,
    "enrollment_date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "attendance_status" "AttendanceStatus" NOT NULL DEFAULT 'enrolled',

    CONSTRAINT "course_participants_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_dependency_id_idx" ON "users"("dependency_id");

-- CreateIndex
CREATE UNIQUE INDEX "certificate_templates_slug_key" ON "certificate_templates"("slug");

-- CreateIndex
CREATE INDEX "courses_dependency_id_idx" ON "courses"("dependency_id");

-- CreateIndex
CREATE UNIQUE INDEX "course_dependencies_course_id_dependency_id_key" ON "course_dependencies"("course_id", "dependency_id");

-- CreateIndex
CREATE UNIQUE INDEX "tags_slug_key" ON "tags"("slug");

-- CreateIndex
CREATE INDEX "participant_tags_participant_id_idx" ON "participant_tags"("participant_id");

-- CreateIndex
CREATE INDEX "participant_tags_tag_id_idx" ON "participant_tags"("tag_id");

-- CreateIndex
CREATE UNIQUE INDEX "participant_tags_participant_id_tag_id_key" ON "participant_tags"("participant_id", "tag_id");

-- CreateIndex
CREATE UNIQUE INDEX "certificates_uuid_key" ON "certificates"("uuid");

-- CreateIndex
CREATE INDEX "certificates_status_idx" ON "certificates"("status");

-- CreateIndex
CREATE INDEX "certificates_course_id_idx" ON "certificates"("course_id");

-- CreateIndex
CREATE INDEX "certificates_participant_id_idx" ON "certificates"("participant_id");

-- CreateIndex
CREATE UNIQUE INDEX "course_participants_course_id_participant_id_key" ON "course_participants"("course_id", "participant_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_dependency_id_fkey" FOREIGN KEY ("dependency_id") REFERENCES "dependencies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificate_templates" ADD CONSTRAINT "certificate_templates_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "certificate_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_dependency_id_fkey" FOREIGN KEY ("dependency_id") REFERENCES "dependencies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_dependencies" ADD CONSTRAINT "course_dependencies_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_dependencies" ADD CONSTRAINT "course_dependencies_dependency_id_fkey" FOREIGN KEY ("dependency_id") REFERENCES "dependencies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participants" ADD CONSTRAINT "participants_dependency_id_fkey" FOREIGN KEY ("dependency_id") REFERENCES "dependencies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participant_tags" ADD CONSTRAINT "participant_tags_participant_id_fkey" FOREIGN KEY ("participant_id") REFERENCES "participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participant_tags" ADD CONSTRAINT "participant_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "branding_versions" ADD CONSTRAINT "branding_versions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_participant_id_fkey" FOREIGN KEY ("participant_id") REFERENCES "participants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_issued_by_fkey" FOREIGN KEY ("issued_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_revoked_by_fkey" FOREIGN KEY ("revoked_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_branding_version_id_fkey" FOREIGN KEY ("branding_version_id") REFERENCES "branding_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "certificate_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "revocation_log" ADD CONSTRAINT "revocation_log_certificate_id_fkey" FOREIGN KEY ("certificate_id") REFERENCES "certificates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "revocation_log" ADD CONSTRAINT "revocation_log_revoked_by_fkey" FOREIGN KEY ("revoked_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_participants" ADD CONSTRAINT "course_participants_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_participants" ADD CONSTRAINT "course_participants_participant_id_fkey" FOREIGN KEY ("participant_id") REFERENCES "participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
