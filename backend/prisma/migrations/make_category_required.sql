-- Migration: Rendre la catégorie obligatoire pour les produits
-- Date: 2025-11-30
-- Description: Un produit doit toujours être dans une catégorie

-- Étape 1: Créer une catégorie par défaut si elle n'existe pas
INSERT INTO categories (id, name, slug, description, "createdAt", "updatedAt")
VALUES (
  'default-category-id-000',
  'Non classé',
  'non-classe',
  'Catégorie par défaut pour les produits non classés',
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO NOTHING;

-- Étape 2: Assigner tous les produits sans catégorie à la catégorie "Non classé"
UPDATE products
SET "categoryId" = 'default-category-id-000'
WHERE "categoryId" IS NULL;

-- Étape 3: Rendre le champ categoryId NOT NULL
ALTER TABLE products
ALTER COLUMN "categoryId" SET NOT NULL;

-- Vérification
SELECT
  COUNT(*) as total_produits,
  COUNT("categoryId") as produits_avec_categorie,
  COUNT(*) - COUNT("categoryId") as produits_sans_categorie
FROM products;
