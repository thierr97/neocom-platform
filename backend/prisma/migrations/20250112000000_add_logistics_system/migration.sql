-- AlterEnum: Add new user roles
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'STAFF_PREPA';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'SUB_ADMIN';

-- AlterTable: Add logistics fields to orders
ALTER TABLE "orders" ADD COLUMN "fulfillmentFlow" TEXT DEFAULT 'DIRECT',
ADD COLUMN "inboundCarrier" TEXT,
ADD COLUMN "inboundTrackingNumber" TEXT,
ADD COLUMN "inboundStatus" TEXT DEFAULT 'NOT_STARTED',
ADD COLUMN "inboundShippedAt" TIMESTAMP(3),
ADD COLUMN "inboundReceivedAt" TIMESTAMP(3),
ADD COLUMN "inboundProofUrl" TEXT,
ADD COLUMN "inboundNotes" TEXT,
ADD COLUMN "lastMileType" TEXT,
ADD COLUMN "lastMileCarrier" TEXT,
ADD COLUMN "lastMileTrackingNumber" TEXT,
ADD COLUMN "lastMileNotes" TEXT;

-- CreateEnum: Task enums
CREATE TYPE "TaskType" AS ENUM ('RECEPTION_INBOUND', 'DELIVERY_LAST_MILE', 'SHIP_LAST_MILE');
CREATE TYPE "TaskStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'DONE', 'APPROVED', 'REJECTED', 'ISSUE');
CREATE TYPE "TaskProofType" AS ENUM ('PHOTO', 'SIGNATURE', 'GPS', 'NOTE', 'DOCUMENT');
CREATE TYPE "TaskReviewStatus" AS ENUM ('APPROVED', 'REJECTED', 'PENDING_INFO');

-- CreateTable: tasks
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "type" "TaskType" NOT NULL,
    "status" "TaskStatus" NOT NULL DEFAULT 'TODO',
    "assignedToId" TEXT,
    "assignedById" TEXT,
    "assignedAt" TIMESTAMP(3),
    "scheduledAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "title" TEXT NOT NULL,
    "description" TEXT,
    "notes" TEXT,
    "locationAddress" TEXT,
    "locationLatitude" DOUBLE PRECISION,
    "locationLongitude" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable: task_proofs
CREATE TABLE "task_proofs" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "type" "TaskProofType" NOT NULL,
    "fileUrl" TEXT,
    "signatureData" TEXT,
    "noteText" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "accuracy" DOUBLE PRECISION,
    "address" TEXT,
    "uploadedById" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_proofs_pkey" PRIMARY KEY ("id")
);

-- CreateTable: task_reviews
CREATE TABLE "task_reviews" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "status" "TaskReviewStatus" NOT NULL,
    "comments" TEXT,
    "actionsTaken" JSONB,
    "reviewedById" TEXT NOT NULL,
    "reviewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tasks_orderId_idx" ON "tasks"("orderId");
CREATE INDEX "tasks_assignedToId_idx" ON "tasks"("assignedToId");
CREATE INDEX "tasks_status_idx" ON "tasks"("status");
CREATE INDEX "tasks_type_idx" ON "tasks"("type");
CREATE INDEX "tasks_scheduledAt_idx" ON "tasks"("scheduledAt");

CREATE INDEX "task_proofs_taskId_idx" ON "task_proofs"("taskId");
CREATE INDEX "task_proofs_type_idx" ON "task_proofs"("type");

CREATE INDEX "task_reviews_taskId_idx" ON "task_reviews"("taskId");
CREATE INDEX "task_reviews_reviewedById_idx" ON "task_reviews"("reviewedById");
CREATE INDEX "task_reviews_status_idx" ON "task_reviews"("status");

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "task_proofs" ADD CONSTRAINT "task_proofs_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "task_proofs" ADD CONSTRAINT "task_proofs_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "task_reviews" ADD CONSTRAINT "task_reviews_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "task_reviews" ADD CONSTRAINT "task_reviews_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
