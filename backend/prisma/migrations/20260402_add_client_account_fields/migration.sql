-- Migration: Ajout champs compte client (portail B2C)
-- Date: 2026-04-02

-- Référence client unique CLI-XXXXXX
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "clientRef" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "customers_clientRef_key" ON "customers"("clientRef");

-- Paiement différé accordé par le commercial
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "allowDeferredPayment" BOOLEAN NOT NULL DEFAULT false;

-- Authentification client (mot de passe hashé)
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "password" TEXT;
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "mustChangePassword" BOOLEAN NOT NULL DEFAULT false;
