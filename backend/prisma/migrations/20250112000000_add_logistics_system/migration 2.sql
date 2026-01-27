-- Add new user roles for logistics system
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'STAFF_PREPA';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'SUB_ADMIN';

-- Add logistics fields to orders table
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "fulfillment_flow" TEXT DEFAULT 'DIRECT'; -- DIRECT or INBOUND_THEN_LAST_MILE

-- Inbound logistics (FRANCE → GUADELOUPE)
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "inbound_carrier" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "inbound_tracking_number" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "inbound_status" TEXT DEFAULT 'NOT_STARTED'; -- NOT_STARTED, SHIPPED, IN_TRANSIT, RECEIVED
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "inbound_shipped_at" TIMESTAMP;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "inbound_received_at" TIMESTAMP;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "inbound_proof_url" TEXT; -- Photo/scan de réception
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "inbound_notes" TEXT;

-- Last mile delivery (LOCAL DELIVERY in Guadeloupe)
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "last_mile_type" TEXT; -- INTERNAL_DRIVER or EXTERNAL_CARRIER
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "last_mile_carrier" TEXT; -- Si external
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "last_mile_tracking_number" TEXT; -- Si external
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "last_mile_notes" TEXT;

-- Create tasks table (interventions)
CREATE TABLE IF NOT EXISTS "tasks" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "order_id" TEXT NOT NULL,
    "type" TEXT NOT NULL, -- RECEPTION_INBOUND, DELIVERY_LAST_MILE, SHIP_LAST_MILE
    "status" TEXT NOT NULL DEFAULT 'TODO', -- TODO, IN_PROGRESS, DONE, APPROVED, REJECTED, ISSUE

    -- Assignment
    "assigned_to_id" TEXT, -- User ID (STAFF_PREPA or DELIVERY)
    "assigned_by_id" TEXT, -- Admin/SUB_ADMIN who assigned
    "assigned_at" TIMESTAMP,

    -- Scheduling
    "scheduled_at" TIMESTAMP,
    "started_at" TIMESTAMP,
    "completed_at" TIMESTAMP,

    -- Details
    "title" TEXT NOT NULL,
    "description" TEXT,
    "notes" TEXT,

    -- Location (if applicable)
    "location_address" TEXT,
    "location_latitude" DOUBLE PRECISION,
    "location_longitude" DOUBLE PRECISION,

    -- Metadata
    "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT "tasks_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE,
    CONSTRAINT "tasks_assigned_to_id_fkey" FOREIGN KEY ("assigned_to_id") REFERENCES "users"("id") ON DELETE SET NULL,
    CONSTRAINT "tasks_assigned_by_id_fkey" FOREIGN KEY ("assigned_by_id") REFERENCES "users"("id") ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS "tasks_order_id_idx" ON "tasks"("order_id");
CREATE INDEX IF NOT EXISTS "tasks_assigned_to_id_idx" ON "tasks"("assigned_to_id");
CREATE INDEX IF NOT EXISTS "tasks_status_idx" ON "tasks"("status");
CREATE INDEX IF NOT EXISTS "tasks_type_idx" ON "tasks"("type");

-- Create task proofs table (photos, signatures, GPS)
CREATE TABLE IF NOT EXISTS "task_proofs" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "task_id" TEXT NOT NULL,

    -- Proof type
    "type" TEXT NOT NULL, -- PHOTO, SIGNATURE, GPS, NOTE, DOCUMENT

    -- Content
    "file_url" TEXT, -- For photos/documents
    "signature_data" TEXT, -- Base64 signature
    "note_text" TEXT,

    -- GPS data
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "accuracy" DOUBLE PRECISION,
    "address" TEXT,

    -- Metadata
    "uploaded_by_id" TEXT, -- User who uploaded
    "uploaded_at" TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT "task_proofs_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE,
    CONSTRAINT "task_proofs_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id") ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS "task_proofs_task_id_idx" ON "task_proofs"("task_id");
CREATE INDEX IF NOT EXISTS "task_proofs_type_idx" ON "task_proofs"("type");

-- Create task reviews table (SUB_ADMIN validation)
CREATE TABLE IF NOT EXISTS "task_reviews" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "task_id" TEXT NOT NULL,

    -- Review details
    "status" TEXT NOT NULL, -- APPROVED, REJECTED, PENDING_INFO
    "comments" TEXT,

    -- Reviewer
    "reviewed_by_id" TEXT NOT NULL, -- SUB_ADMIN or ADMIN
    "reviewed_at" TIMESTAMP NOT NULL DEFAULT NOW(),

    -- Actions taken
    "actions_taken" TEXT, -- JSON string of actions (reassigned, reopened, etc.)

    CONSTRAINT "task_reviews_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE,
    CONSTRAINT "task_reviews_reviewed_by_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "task_reviews_task_id_idx" ON "task_reviews"("task_id");
CREATE INDEX IF NOT EXISTS "task_reviews_reviewed_by_id_idx" ON "task_reviews"("reviewed_by_id");

-- Add order timeline events for logistics
-- Using existing activities table, add new activity types
-- (This is done via application code, not schema)

-- Add permissions for new roles
INSERT INTO "permissions" ("id", "name", "description", "resource", "action", "created_at", "updated_at")
VALUES
    (gen_random_uuid()::text, 'staff_prepa.view_reception', 'View reception tasks', 'ORDERS', 'VIEW', NOW(), NOW()),
    (gen_random_uuid()::text, 'staff_prepa.manage_reception', 'Manage reception tasks', 'ORDERS', 'EDIT', NOW(), NOW()),
    (gen_random_uuid()::text, 'sub_admin.view_all_tasks', 'View all tasks', 'ORDERS', 'VIEW', NOW(), NOW()),
    (gen_random_uuid()::text, 'sub_admin.review_tasks', 'Review and validate tasks', 'ORDERS', 'EDIT', NOW(), NOW()),
    (gen_random_uuid()::text, 'sub_admin.reassign_tasks', 'Reassign tasks', 'ORDERS', 'EDIT', NOW(), NOW())
ON CONFLICT ("name") DO NOTHING;

-- Add comments for documentation
COMMENT ON COLUMN "orders"."fulfillment_flow" IS 'DIRECT: Normal delivery | INBOUND_THEN_LAST_MILE: Shipped from France then local delivery';
COMMENT ON COLUMN "orders"."inbound_status" IS 'NOT_STARTED, SHIPPED, IN_TRANSIT, RECEIVED';
COMMENT ON COLUMN "orders"."last_mile_type" IS 'INTERNAL_DRIVER: Use existing delivery system | EXTERNAL_CARRIER: External shipping company';
COMMENT ON TABLE "tasks" IS 'Task/intervention management for logistics workflow';
COMMENT ON TABLE "task_proofs" IS 'Proofs attached to tasks (photos, signatures, GPS, notes)';
COMMENT ON TABLE "task_reviews" IS 'SUB_ADMIN reviews and validations of completed tasks';
