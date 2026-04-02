-- Migration: Rendre l'email client optionnel
-- Date: 2026-04-02

ALTER TABLE "customers" ALTER COLUMN "email" DROP NOT NULL;
