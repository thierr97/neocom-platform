-- Ajout du champ marque aux produits (idempotent)
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "brand" TEXT;
