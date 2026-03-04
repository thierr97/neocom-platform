-- Migration: Ajout système de conditionnement double (pack/unité) comme TOOERP
-- Date: 2026-03-04

-- Ajout des colonnes de conditionnement au modèle Product
-- Ces colonnes sont NULLABLES pour éviter l'erreur P2022 et permettre une migration sans problème

ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "packSize" INTEGER;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "packUnit" TEXT;

-- Commentaires pour documentation
COMMENT ON COLUMN "products"."packSize" IS 'Nombre d''unités par pack (ex: 24 pour "1 carton × 24")';
COMMENT ON COLUMN "products"."packUnit" IS 'Type de pack (ex: "carton", "箱", "boîte")';
