-- AlterTable
ALTER TABLE "users" ADD COLUMN     "currentSessionId" TEXT,
ADD COLUMN     "isOnline" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastSeenAt" TIMESTAMP(3),
ADD COLUMN     "timezone" TEXT DEFAULT 'Europe/Paris',
ADD COLUMN     "workDays" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "workEndTime" TEXT,
ADD COLUMN     "workStartTime" TEXT;

-- CreateTable
CREATE TABLE "connection_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "loginAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "logoutAt" TIMESTAMP(3),
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "duration" INTEGER,

    CONSTRAINT "connection_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "connection_logs_sessionId_key" ON "connection_logs"("sessionId");

-- CreateIndex
CREATE INDEX "connection_logs_userId_idx" ON "connection_logs"("userId");

-- CreateIndex
CREATE INDEX "connection_logs_loginAt_idx" ON "connection_logs"("loginAt");

-- AddForeignKey
ALTER TABLE "connection_logs" ADD CONSTRAINT "connection_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
