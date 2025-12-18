-- CreateEnum
CREATE TYPE "DeliveryStatus" AS ENUM ('CREATED', 'OFFERED', 'ACCEPTED', 'TO_PICKUP', 'AT_PICKUP', 'PICKED_UP', 'TO_DROPOFF', 'AT_DROPOFF', 'DELIVERED', 'COMPLETED', 'CANCELED', 'FAILED', 'INCIDENT');

-- CreateEnum
CREATE TYPE "DeliveryEventType" AS ENUM ('STATUS_CHANGE', 'LOCATION_UPDATE', 'NOTE_ADDED', 'PHOTO_ADDED', 'SIGNATURE_ADDED', 'REASSIGNED', 'INCIDENT', 'CUSTOMER_CONTACT', 'ETA_UPDATE');

-- CreateEnum
CREATE TYPE "CourierStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'SUSPENDED', 'BANNED');

-- CreateEnum
CREATE TYPE "VehicleType" AS ENUM ('BIKE', 'SCOOTER', 'CAR', 'VAN', 'TRUCK', 'ON_FOOT');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('ID_CARD', 'DRIVERS_LICENSE', 'VEHICLE_REGISTRATION', 'INSURANCE', 'CRIMINAL_RECORD', 'PROOF_ADDRESS', 'BANK_RIB', 'OTHER');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('DELIVERY_ASSIGNED', 'DELIVERY_OFFERED', 'STATUS_UPDATED', 'COURIER_ARRIVED', 'DELIVERY_COMPLETED', 'INCIDENT_REPORTED', 'MESSAGE_RECEIVED', 'DOCUMENT_VERIFIED', 'PROFILE_APPROVED', 'PROFILE_REJECTED', 'PAYOUT_READY', 'SYSTEM_ALERT');

-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELED');

-- CreateTable: Delivery
CREATE TABLE "deliveries" (
    "id" TEXT NOT NULL,
    "orderId" TEXT,
    "customerId" TEXT,
    "salesUserId" TEXT,
    "courierId" TEXT,
    "status" "DeliveryStatus" NOT NULL DEFAULT 'CREATED',
    "pickupAddress" TEXT NOT NULL,
    "pickupLatitude" DOUBLE PRECISION,
    "pickupLongitude" DOUBLE PRECISION,
    "deliveryAddress" TEXT NOT NULL,
    "deliveryLatitude" DOUBLE PRECISION,
    "deliveryLongitude" DOUBLE PRECISION,
    "scheduledPickupAt" TIMESTAMP(3),
    "scheduledDeliveryAt" TIMESTAMP(3),
    "actualPickupAt" TIMESTAMP(3),
    "actualDeliveryAt" TIMESTAMP(3),
    "estimatedDeliveryAt" TIMESTAMP(3),
    "specialInstructions" TEXT,
    "deliveryFee" DECIMAL(10,2),
    "courierEarnings" DECIMAL(10,2),
    "deliveryPhotos" TEXT[],
    "deliverySignature" TEXT,
    "recipientName" TEXT,
    "statusChangedAt" TIMESTAMP(3),
    "previousStatus" "DeliveryStatus",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable: DeliveryEvent
CREATE TABLE "delivery_events" (
    "id" TEXT NOT NULL,
    "deliveryId" TEXT NOT NULL,
    "type" "DeliveryEventType" NOT NULL,
    "description" TEXT NOT NULL,
    "oldStatus" "DeliveryStatus",
    "newStatus" "DeliveryStatus",
    "userId" TEXT,
    "actorRole" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,
    CONSTRAINT "delivery_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable: CourierProfile
CREATE TABLE "courier_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "CourierStatus" NOT NULL DEFAULT 'DRAFT',
    "vehicleType" "VehicleType" NOT NULL,
    "vehicleBrand" TEXT,
    "vehicleModel" TEXT,
    "vehicleYear" INTEGER,
    "vehiclePlateNumber" TEXT,
    "isAvailable" BOOLEAN NOT NULL DEFAULT false,
    "rating" DOUBLE PRECISION DEFAULT 0,
    "totalDeliveries" INTEGER DEFAULT 0,
    "completedDeliveries" INTEGER DEFAULT 0,
    "canceledDeliveries" INTEGER DEFAULT 0,
    "iban" TEXT,
    "bic" TEXT,
    "bankName" TEXT,
    "accountHolder" TEXT,
    "approvedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "rejectedAt" TIMESTAMP(3),
    "rejectedReason" TEXT,
    "suspendedAt" TIMESTAMP(3),
    "suspendedReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "courier_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable: CourierDocument
CREATE TABLE "courier_documents" (
    "id" TEXT NOT NULL,
    "courierProfileId" TEXT NOT NULL,
    "type" "DocumentType" NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "fileMimeType" TEXT NOT NULL,
    "status" "DocumentStatus" NOT NULL DEFAULT 'PENDING',
    "verifiedAt" TIMESTAMP(3),
    "verifiedBy" TEXT,
    "rejectedReason" TEXT,
    "expiresAt" TIMESTAMP(3),
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "courier_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable: CourierLocation
CREATE TABLE "courier_locations" (
    "id" TEXT NOT NULL,
    "courierId" TEXT NOT NULL,
    "deliveryId" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "accuracy" DOUBLE PRECISION,
    "speed" DOUBLE PRECISION,
    "heading" DOUBLE PRECISION,
    "altitude" DOUBLE PRECISION,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "courier_locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Notification
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Payout
CREATE TABLE "payouts" (
    "id" TEXT NOT NULL,
    "courierId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "status" "PayoutStatus" NOT NULL DEFAULT 'PENDING',
    "period" TEXT NOT NULL,
    "deliveryIds" TEXT[],
    "processedAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "payouts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "courier_profiles_userId_key" ON "courier_profiles"("userId");

-- CreateIndex
CREATE INDEX "deliveries_status_idx" ON "deliveries"("status");
CREATE INDEX "deliveries_courierId_idx" ON "deliveries"("courierId");
CREATE INDEX "deliveries_customerId_idx" ON "deliveries"("customerId");
CREATE INDEX "deliveries_orderId_idx" ON "deliveries"("orderId");

-- CreateIndex
CREATE INDEX "delivery_events_deliveryId_idx" ON "delivery_events"("deliveryId");
CREATE INDEX "delivery_events_timestamp_idx" ON "delivery_events"("timestamp");

-- CreateIndex
CREATE INDEX "courier_documents_courierProfileId_idx" ON "courier_documents"("courierProfileId");

-- CreateIndex
CREATE INDEX "courier_locations_courierId_idx" ON "courier_locations"("courierId");
CREATE INDEX "courier_locations_deliveryId_idx" ON "courier_locations"("deliveryId");
CREATE INDEX "courier_locations_timestamp_idx" ON "courier_locations"("timestamp");

-- CreateIndex
CREATE INDEX "notifications_userId_idx" ON "notifications"("userId");
CREATE INDEX "notifications_isRead_idx" ON "notifications"("isRead");

-- CreateIndex
CREATE INDEX "payouts_courierId_idx" ON "payouts"("courierId");
CREATE INDEX "payouts_status_idx" ON "payouts"("status");

-- AddForeignKey
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_salesUserId_fkey" FOREIGN KEY ("salesUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_courierId_fkey" FOREIGN KEY ("courierId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_events" ADD CONSTRAINT "delivery_events_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "deliveries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_events" ADD CONSTRAINT "delivery_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courier_profiles" ADD CONSTRAINT "courier_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courier_profiles" ADD CONSTRAINT "courier_profiles_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courier_documents" ADD CONSTRAINT "courier_documents_courierProfileId_fkey" FOREIGN KEY ("courierProfileId") REFERENCES "courier_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courier_documents" ADD CONSTRAINT "courier_documents_verifiedBy_fkey" FOREIGN KEY ("verifiedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courier_locations" ADD CONSTRAINT "courier_locations_courierId_fkey" FOREIGN KEY ("courierId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courier_locations" ADD CONSTRAINT "courier_locations_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "deliveries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_courierId_fkey" FOREIGN KEY ("courierId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
