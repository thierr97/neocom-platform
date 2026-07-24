-- Script de mise à jour des images produits HJK
-- Généré automatiquement - à exécuter sur la base de production Render
-- Dashboard Render > PostgreSQL > Shell > psql

BEGIN;

-- allumettes fumeurs 10*40 allumettes
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773837890/neoserv/products/hjk_0900103.png'] WHERE sku = '0900103' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Briquets électroniques rechargeables IMP Solid 5 colors COLORFUN
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773837891/neoserv/products/hjk_12010.png'] WHERE sku = '12010' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Gants orange a 21 aiguilles
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773837892/neoserv/products/hjk_51690.png'] WHERE sku = '51690' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Gants 23 cm
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773837893/neoserv/products/hjk_51686.png'] WHERE sku = '51686' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Gants 23 cm
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773837894/neoserv/products/hjk_51683.png'] WHERE sku = '51683' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- rape inox avec reservoir 16*19,5cm
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773837895/neoserv/products/hjk_100167.png'] WHERE sku = '100167' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- pompe a ballons
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773837896/neoserv/products/hjk_K46736.png'] WHERE sku = 'K46736' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- pompe a ballons
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773837897/neoserv/products/hjk_K46735.png'] WHERE sku = 'K46735' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Pot  Ø 750ml SURT VRM
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773837898/neoserv/products/hjk_144751A.png'] WHERE sku = '144751A' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Pot Montecarlo Slim 500 ml avec couvercle en metal
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773837899/neoserv/products/hjk_15238.png'] WHERE sku = '15238' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- chargeur usb TYPE -C
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773837900/neoserv/products/hjk_EZ-P13.png'] WHERE sku = 'EZ-P13' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Talkie-walkie T328 (CE)
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773837902/neoserv/products/hjk_194338.png'] WHERE sku = '194338' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- FER A FRISER 25W
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773837902/neoserv/products/hjk_2303983.png'] WHERE sku = '2303983' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- lampe de torch a pile plonge  FA-XQ-1
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773837903/neoserv/products/hjk_K46185.png'] WHERE sku = 'K46185' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Balle de tennis 6,5 cm
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773837904/neoserv/products/hjk_38198.png'] WHERE sku = '38198' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- bougie en verre parfumee mangue  300g
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773837905/neoserv/products/hjk_90045.png'] WHERE sku = '90045' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Le câble d''alimentation HP
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773837906/neoserv/products/hjk_CAB123.png'] WHERE sku = 'CAB123' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- etagere de rangement pour toilettes 16 mm 166 x 47 x 25 cm
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773837907/neoserv/products/hjk_2407000.png'] WHERE sku = '2407000' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- etagere pour machine a laver
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773837908/neoserv/products/hjk_2407001.png'] WHERE sku = '2407001' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- ventrouse de toilettes 1A832
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773837909/neoserv/products/hjk_H130003_31242.png'] WHERE sku = 'H130003/31242' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- BIC LAMES 5PCS CHROME PLATINIUM
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773837910/neoserv/products/hjk_701502.png'] WHERE sku = '701502' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Florida Water 7.5oz
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773837911/neoserv/products/hjk_000149.png'] WHERE sku = '000149' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- ALCOLADO - 125ML
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773837912/neoserv/products/hjk_000013.png'] WHERE sku = '000013' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- ALCOLADO - 500ML
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773837912/neoserv/products/hjk_00037.png'] WHERE sku = '00037' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- ALCOLADO - 250ML
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773837913/neoserv/products/hjk_00020.png'] WHERE sku = '00020' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- piles LR44 x10pcs
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773837914/neoserv/products/hjk_LR44-SODA.png'] WHERE sku = 'LR44-SODA' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Panier a pinces modern
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773837915/neoserv/products/hjk_11794.png'] WHERE sku = '11794' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Pot rond 30 cm
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773837916/neoserv/products/hjk_11274.png'] WHERE sku = '11274' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Pot rond 30 cm BLANC
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773837917/neoserv/products/hjk_1127401.png'] WHERE sku = '1127401' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Soucoupe 26 cm
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773837918/neoserv/products/hjk_11456.png'] WHERE sku = '11456' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Soucoupe 36 cm
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773837918/neoserv/products/hjk_11278.png'] WHERE sku = '11278' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Soucoupe 30 cm
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773837919/neoserv/products/hjk_11457.png'] WHERE sku = '11457' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Couvercle micro-ondes moyen
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773837920/neoserv/products/hjk_11206.png'] WHERE sku = '11206' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Couvercle micro-ondes cloche moyenne
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773837921/neoserv/products/hjk_11257.png'] WHERE sku = '11257' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Essoreuse a salade
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773837923/neoserv/products/hjk_11593.png'] WHERE sku = '11593' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- presse-agrumes pichet
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773837925/neoserv/products/hjk_11793.png'] WHERE sku = '11793' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Pot Classic Ø 2 L SURT VRM
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773837926/neoserv/products/hjk_143091A.png'] WHERE sku = '143091A' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Boite alimentaire CLASSIC 2.5 L
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773837927/neoserv/products/hjk_11550.png'] WHERE sku = '11550' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Lot de 3 boites hermetiques 250 ml
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773837928/neoserv/products/hjk_11307.png'] WHERE sku = '11307' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Lot de 4 boites hermetiques rect. Urban
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773837929/neoserv/products/hjk_11844.png'] WHERE sku = '11844' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Boite a lunch en verre avec couvercle a valve CLICK 640 ML
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773837930/neoserv/products/hjk_14173.png'] WHERE sku = '14173' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Boite a lunch en verre avec couvercle a valve CLICK 1.040 L
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773837931/neoserv/products/hjk_14174.png'] WHERE sku = '14174' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Bassine ronde 10 L  N
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773837931/neoserv/products/hjk_11506.png'] WHERE sku = '11506' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Desodorisant gel fruitier - 12 unites
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773837932/neoserv/products/hjk_00358.png'] WHERE sku = '00358' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Desodorisant gel 12 unites - parfums assortis
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773837933/neoserv/products/hjk_00277.png'] WHERE sku = '00277' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Entonnoir 12 cm
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773837935/neoserv/products/hjk_11453.png'] WHERE sku = '11453' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Arrosoir 4 L  COULEUR
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773837935/neoserv/products/hjk_1149005.png'] WHERE sku = '1149005' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Boite a savon nouvelle
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773837936/neoserv/products/hjk_11450.png'] WHERE sku = '11450' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Passoire Daily 27 cm
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773837937/neoserv/products/hjk_11351.png'] WHERE sku = '11351' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Passoire Classic 31 cm
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773837939/neoserv/products/hjk_11141.png'] WHERE sku = '11141' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Vase DALIA
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773837942/neoserv/products/hjk_12217.png'] WHERE sku = '12217' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Pot rond 20 cm
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773837943/neoserv/products/hjk_11276.png'] WHERE sku = '11276' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Pot rond 22 cm
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773837944/neoserv/products/hjk_11954.png'] WHERE sku = '11954' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Pot rond 22 cm BLANC
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773837944/neoserv/products/hjk_1195401.png'] WHERE sku = '1195401' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Pot rond 25 cm
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773837945/neoserv/products/hjk_11275.png'] WHERE sku = '11275' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Pot rond 35 cm
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773837946/neoserv/products/hjk_11273.png'] WHERE sku = '11273' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Huilier
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773837948/neoserv/products/hjk_12237.png'] WHERE sku = '12237' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Entonnoir 14 cm
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773837949/neoserv/products/hjk_11454.png'] WHERE sku = '11454' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Pot Classic Ø 1 L SURT VRM
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773837950/neoserv/products/hjk_143071A.png'] WHERE sku = '143071A' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Boite Alimentaire CLASSIC 4 L
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773837951/neoserv/products/hjk_14647.png'] WHERE sku = '14647' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Boite alimentaire CLASSIC 600 ML
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773837952/neoserv/products/hjk_11572.png'] WHERE sku = '11572' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Boite alimentaire CLASSIC 800 ml
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773837952/neoserv/products/hjk_11303.png'] WHERE sku = '11303' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Boite alimentaire CLASSIC 500 ML SURT VRM
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773837953/neoserv/products/hjk_115711A.png'] WHERE sku = '115711A' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Boite Alimentaire Classic 1.2 L
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773837954/neoserv/products/hjk_11302.png'] WHERE sku = '11302' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Boite Alimentaire BASIC ronde 1 L
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773837955/neoserv/products/hjk_11569.png'] WHERE sku = '11569' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Boite alimentaire CLASSIC 1750 ml
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773837955/neoserv/products/hjk_14553.png'] WHERE sku = '14553' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Lot de 5 boites alimentaires carrees URBAN
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773837956/neoserv/products/hjk_11859.png'] WHERE sku = '11859' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Boite Alimentaire CLASSIC 3.7 L
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773837957/neoserv/products/hjk_11544.png'] WHERE sku = '11544' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Boite alimentaire CLASSIC 3 L
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773837958/neoserv/products/hjk_11300.png'] WHERE sku = '11300' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Bassine ronde 15 L
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773837959/neoserv/products/hjk_11507.png'] WHERE sku = '11507' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Bassine ronde 6 L
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773837960/neoserv/products/hjk_11480.png'] WHERE sku = '11480' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Bassine ronde 3 L  N
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773837961/neoserv/products/hjk_11505.png'] WHERE sku = '11505' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Boite Nº10 5 L
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773837962/neoserv/products/hjk_11339.png'] WHERE sku = '11339' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Bac a litière avec pelle MAX
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773837963/neoserv/products/hjk_11361.png'] WHERE sku = '11361' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Panier a linge rectangulaire
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773837965/neoserv/products/hjk_11365.png'] WHERE sku = '11365' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Sechoir a linge en resine Nº1 - 20M
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773837966/neoserv/products/hjk_12938.png'] WHERE sku = '12938' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Boite Nº 3 36 L
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773837966/neoserv/products/hjk_11120.png'] WHERE sku = '11120' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Boite Nº 2 25 L
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773837968/neoserv/products/hjk_11117.png'] WHERE sku = '11117' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Bouteille 500 ml S-231  SURTIDO K M
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773837969/neoserv/products/hjk_1153459.png'] WHERE sku = '1153459' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Passoire Daily 27 cm BLANC
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773837970/neoserv/products/hjk_1135101.png'] WHERE sku = '1135101' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Pilulier Nº5 – 3 prises Blister FR
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773837971/neoserv/products/hjk_12613FR.png'] WHERE sku = '12613FR' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Verre Rhomb Elite 500 ml GAMME TRANSLUCIDE
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773837971/neoserv/products/hjk_1B00244.png'] WHERE sku = '1B00244' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Boite alimentaire empilable avec anse Nº 1 SURT VRM
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773837972/neoserv/products/hjk_153821A.png'] WHERE sku = '153821A' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Lot de 6 tupperware rectangulaires urban
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773837973/neoserv/products/hjk_15336.png'] WHERE sku = '15336' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Jardinière pour balcon Zeus TERRE CUITE
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773837975/neoserv/products/hjk_2006511.png'] WHERE sku = '2006511' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Boite alimentaire Lunch Nº2 1.20 L
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773837975/neoserv/products/hjk_15076.png'] WHERE sku = '15076' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Boite Alimentaire Classic ronde 1.7 L
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773837976/neoserv/products/hjk_14886.png'] WHERE sku = '14886' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Bouteille a large goulot 500 ml S-212 SURT VRM
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773837978/neoserv/products/hjk_115301A.png'] WHERE sku = '115301A' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Boite a lunch en verre avec couvercle a valve LUXE 320 ML
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773837978/neoserv/products/hjk_14159.png'] WHERE sku = '14159' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Distributeur de savon COTTON
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773837979/neoserv/products/hjk_12874.png'] WHERE sku = '12874' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Boite alimentaire Frost Nº7 6.5 L TRANSPARENT
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773837980/neoserv/products/hjk_1203606.png'] WHERE sku = '1203606' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Entonnoir 12 cm TRANSPARENT
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773837981/neoserv/products/hjk_1145306.png'] WHERE sku = '1145306' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Pot rond 35 cm BLANC
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773837982/neoserv/products/hjk_1127301.png'] WHERE sku = '1127301' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Boite a omelette 2 L
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773837983/neoserv/products/hjk_11613.png'] WHERE sku = '11613' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Boite Alimentaire BASIC carree 1 L
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773837984/neoserv/products/hjk_11512.png'] WHERE sku = '11512' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Compte-gouttes essence GRAND EXPOSANT
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773837985/neoserv/products/hjk_020611Z.png'] WHERE sku = '020611Z' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Gel oval FRUITS DES BOIS
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773837986/neoserv/products/hjk_0198800.png'] WHERE sku = '0198800' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Compte-gouttes essence
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773837987/neoserv/products/hjk_02061.png'] WHERE sku = '02061' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Recharge anti-moustiques comun et tigre
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773837987/neoserv/products/hjk_01986.png'] WHERE sku = '01986' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Mikado 30 ml
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773837988/neoserv/products/hjk_01960.png'] WHERE sku = '01960' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Gel anti-moustiques
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773837989/neoserv/products/hjk_01951.png'] WHERE sku = '01951' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Bouteille de parfum accrochante de voiture FR. DE
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773837990/neoserv/products/hjk_01854.png'] WHERE sku = '01854' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Desodorisants Boscalia New carre
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773837991/neoserv/products/hjk_01802.png'] WHERE sku = '01802' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Porte-tampon a recurer double bacs SURT VRM
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773837991/neoserv/products/hjk_403711A.png'] WHERE sku = '403711A' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Boite alimentaire CLICK rectangulaire 1 L
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773837992/neoserv/products/hjk_11677.png'] WHERE sku = '11677' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Pot Candy avec poignee 2 L SURT VRM
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773837993/neoserv/products/hjk_154971A.png'] WHERE sku = '154971A' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Passoire avec poignee Classic 26.5 cm BLANC
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773837994/neoserv/products/hjk_1537201.png'] WHERE sku = '1537201' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Passoire avec poignee Classic 26.5 cm
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773837995/neoserv/products/hjk_15372.png'] WHERE sku = '15372' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Lot de 7 boites alimentaires carrees Urban
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773837996/neoserv/products/hjk_15311.png'] WHERE sku = '15311' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Pot Montecarlo Slim 300 ml avec couvercle en metal
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773837997/neoserv/products/hjk_15236.png'] WHERE sku = '15236' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Carafe Slim 650 ml TRANSPARENT
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773837998/neoserv/products/hjk_1518606.png'] WHERE sku = '1518606' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Pot + plateau Botanic 12 cm Areca SURTIDO SUMMER
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773837999/neoserv/products/hjk_20062BX.png'] WHERE sku = '20062BX' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Pelle a poussière pliable ROLL Assortiment ARV TP F21
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773837999/neoserv/products/hjk_149134N.png'] WHERE sku = '149134N' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Boite Alimentaire Classic carree 1.5 L
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838000/neoserv/products/hjk_14885.png'] WHERE sku = '14885' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Pelle antibasculante x28 Assortiment BAG
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838001/neoserv/products/hjk_12106AE.png'] WHERE sku = '12106AE' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Boite alimentaire BIG ronde 3.8 L SURT VRM
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838002/neoserv/products/hjk_116141A.png'] WHERE sku = '116141A' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Gamelle animaux DANA M SURT VRM
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838002/neoserv/products/hjk_113991A.png'] WHERE sku = '113991A' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Boite alimentaire Frost Nº 8 9.5 L BLANC
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838004/neoserv/products/hjk_1203701.png'] WHERE sku = '1203701' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Pot rond 25 cm BLANC
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838005/neoserv/products/hjk_1127501.png'] WHERE sku = '1127501' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Bouteille 500 ml S-231  TRANSPARENT
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838005/neoserv/products/hjk_1153406.png'] WHERE sku = '1153406' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Passoire Classic 31 cm BLANC
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838006/neoserv/products/hjk_1114101.png'] WHERE sku = '1114101' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Gamelle animaux DANA M
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838007/neoserv/products/hjk_11399.png'] WHERE sku = '11399' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Domino 5010D
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838008/neoserv/products/hjk_06041.png'] WHERE sku = '06041' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Miroir rectangle Miroir 23*30
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838009/neoserv/products/hjk_700994.png'] WHERE sku = '700994' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- lavette en tissu 33*38cm
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838010/neoserv/products/hjk_13660.png'] WHERE sku = '13660' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Assiette ronde en pvc (27 x 3 cm)
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838010/neoserv/products/hjk_25017.png'] WHERE sku = '25017' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- NAPPE CIRE TRANPARNT 0.17*1.40*30 M-65732-10T guadeloupe
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838013/neoserv/products/hjk_K42502.png'] WHERE sku = 'K42502' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Assiette ronde en pvc (17 x 2 cm)
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838014/neoserv/products/hjk_25013.png'] WHERE sku = '25013' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Assiette ronde de en pvc  14.6 x 1.7 cm
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838015/neoserv/products/hjk_25012.png'] WHERE sku = '25012' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Bol a soupe en pvc (17.3 x 5.8 cm)
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838016/neoserv/products/hjk_25009.png'] WHERE sku = '25009' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- plateaux  35.5*24 cm
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838017/neoserv/products/hjk_20592.png'] WHERE sku = '20592' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Assiette plate de 25 cm en pvc
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838018/neoserv/products/hjk_20561.png'] WHERE sku = '20561' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- cintres  39.5 x 20.5 cm x10pcs
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838019/neoserv/products/hjk_22395.png'] WHERE sku = '22395' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Ensemble de 24 couverts avec manches bicolores
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838020/neoserv/products/hjk_66151.png'] WHERE sku = '66151' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Grand support a fleurs avec crochets D
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838022/neoserv/products/hjk_51351.png'] WHERE sku = '51351' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Pince perforatrice robuste de 250 mm (10 pouces)
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838023/neoserv/products/hjk_50045.png'] WHERE sku = '50045' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- noeud blduc 3.3 cm 6 pi eces
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838023/neoserv/products/hjk_45523.png'] WHERE sku = '45523' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- feutrine EVA 2 mm 40 x 60 cm or profond
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838027/neoserv/products/hjk_28701.png'] WHERE sku = '28701' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- feutrine EVA 2 mm 40 x 60 cm bleu lac
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838029/neoserv/products/hjk_28695.png'] WHERE sku = '28695' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- feutrine EVA 2 mm 40 x 60 cm rouge  brillant
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838030/neoserv/products/hjk_28689.png'] WHERE sku = '28689' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- feutrine EVA 2 mm 40 x 60 cm verte
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838031/neoserv/products/hjk_28687.png'] WHERE sku = '28687' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- feutrine EVA 2 mm 40 x 60 cm rouge rose
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838031/neoserv/products/hjk_28684.png'] WHERE sku = '28684' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- feutrine EVA 2 mm 40 x 60 cm blanc
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838032/neoserv/products/hjk_28683.png'] WHERE sku = '28683' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- feutrine EVA 2 mm 40 x 60 cm rose brillant
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838034/neoserv/products/hjk_28682.png'] WHERE sku = '28682' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- feutrine EVA 2 mm 40 x 60 cm orange brillant
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838035/neoserv/products/hjk_28681.png'] WHERE sku = '28681' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- feutrine EVA 2 mm 40 x 60 cm  jaune brillant
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838036/neoserv/products/hjk_28680.png'] WHERE sku = '28680' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- feutrine EVA 2 mm 40 x 60 cm fushia brillant
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838037/neoserv/products/hjk_28679.png'] WHERE sku = '28679' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- feutrine EVA 2 mm 40 x 60 cm  noir brillant
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838038/neoserv/products/hjk_28678.png'] WHERE sku = '28678' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Balance pese bagage  40 kg
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838039/neoserv/products/hjk_80342.png'] WHERE sku = '80342' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Balance portative EL-B
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838043/neoserv/products/hjk_15195.png'] WHERE sku = '15195' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Sonnette 8O3D
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838044/neoserv/products/hjk_06565.png'] WHERE sku = '06565' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Serrure a empreinte digitale pour portes de securite
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838045/neoserv/products/hjk_Z-2.png'] WHERE sku = 'Z-2' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Tondeuse a poils de nez
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838046/neoserv/products/hjk_SK-115.png'] WHERE sku = 'SK-115' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Serrure a empreinte digitale pour porte interieure
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838046/neoserv/products/hjk_S-2.png'] WHERE sku = 'S-2' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Ensemble de ballons couronne en argent rose 55 pi eces
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838047/neoserv/products/hjk_JT-SR01-8.png'] WHERE sku = 'JT-SR01-8' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Ensemble de ballons 55 pi eces en or noir et blanc, type couronne
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838048/neoserv/products/hjk_JT-SR01-6.png'] WHERE sku = 'JT-SR01-6' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Ensemble de ballons guirlandes de ballons B (97 pi eces)
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838049/neoserv/products/hjk_JT-L0001-19.png'] WHERE sku = 'JT-L0001-19' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Ensemble de ballons guirlandes de ballons B (97 pi eces)
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838050/neoserv/products/hjk_JT-L0001-18.png'] WHERE sku = 'JT-L0001-18' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Ensemble de ballons guirlandes de ballons B (97 pi eces)
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838051/neoserv/products/hjk_JT-L0001-16.png'] WHERE sku = 'JT-L0001-16' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Ensemble de ballons de guirlandes de ballons B (97 pi eces)
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838052/neoserv/products/hjk_JT-L0001-15.png'] WHERE sku = 'JT-L0001-15' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- souris sans fil
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838053/neoserv/products/hjk_F660.png'] WHERE sku = 'F660' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- piles CR2032 x5pcs
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838054/neoserv/products/hjk_CR2032.png'] WHERE sku = 'CR2032' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- ENCENS X 20PCS Patchouli
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838055/neoserv/products/hjk_CKX015.png'] WHERE sku = 'CKX015' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- ENCENS X 20PCS
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838056/neoserv/products/hjk_CKX013.png'] WHERE sku = 'CKX013' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- ciseaux
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838057/neoserv/products/hjk_C-8948.png'] WHERE sku = 'C-8948' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- ciseaux
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838058/neoserv/products/hjk_C-6820.png'] WHERE sku = 'C-6820' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Pince a epiler pour sourcils
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838059/neoserv/products/hjk_C-6688.png'] WHERE sku = 'C-6688' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Ciseaux de bureau 120 mm
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838060/neoserv/products/hjk_WB-22001.png'] WHERE sku = 'WB-22001' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- gant  noires
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838062/neoserv/products/hjk_BM23402.png'] WHERE sku = 'BM23402' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Miroir 8.5cm
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838063/neoserv/products/hjk_701010.png'] WHERE sku = '701010' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Miroir rectangle 28*38
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838064/neoserv/products/hjk_700995.png'] WHERE sku = '700995' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Miroir rectangle 18*24
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838065/neoserv/products/hjk_700993.png'] WHERE sku = '700993' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Tringle a rideau de douche 140-260 cm
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838066/neoserv/products/hjk_610425.png'] WHERE sku = '610425' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- tringle a rideau de douche 110 a 200 cm
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838068/neoserv/products/hjk_610424.png'] WHERE sku = '610424' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- balles de ping-pong x 6pcs
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838069/neoserv/products/hjk_550583.png'] WHERE sku = '550583' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- football
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838070/neoserv/products/hjk_550441.png'] WHERE sku = '550441' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- raphia naturel 20 g
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838071/neoserv/products/hjk_350119.png'] WHERE sku = '350119' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Butee de porte  3 x 94 cm
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838072/neoserv/products/hjk_200908.png'] WHERE sku = '200908' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Ballon de football
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838074/neoserv/products/hjk_193720.png'] WHERE sku = '193720' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Sachets en tissu  rouge vif 9 cm x 12 cm
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838075/neoserv/products/hjk_177201.png'] WHERE sku = '177201' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- elastique en nylon noir uni de 5 cm (5 pi eces)
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838076/neoserv/products/hjk_160294.png'] WHERE sku = '160294' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Rasoir a sourcils (a piles)
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838077/neoserv/products/hjk_138209.png'] WHERE sku = '138209' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- pot a fleur metale mural 16*26cm
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838078/neoserv/products/hjk_131356.png'] WHERE sku = '131356' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- pot a fleur metale mural
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838080/neoserv/products/hjk_131354.png'] WHERE sku = '131354' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- arrosoir en matale
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838081/neoserv/products/hjk_131352.png'] WHERE sku = '131352' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- seau de rangement metale
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838082/neoserv/products/hjk_131346.png'] WHERE sku = '131346' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Toile simple 270 g
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838083/neoserv/products/hjk_130972.png'] WHERE sku = '130972' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Desodorisant 250 ml
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838084/neoserv/products/hjk_130320.png'] WHERE sku = '130320' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Tabouret extensible
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838085/neoserv/products/hjk_130247.png'] WHERE sku = '130247' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Gazon artificiel 40*60 16A
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838086/neoserv/products/hjk_120955.png'] WHERE sku = '120955' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Papier autocollant peint imprime 45 cm x 2 m
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838087/neoserv/products/hjk_80672.png'] WHERE sku = '80672' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Gazon artificiel 40*60 5A
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838088/neoserv/products/hjk_120954.png'] WHERE sku = '120954' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- chaise de  lune
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838088/neoserv/products/hjk_120203.png'] WHERE sku = '120203' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- corbeille de fruits 3 NIVEAU
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838089/neoserv/products/hjk_110383.png'] WHERE sku = '110383' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Papier autocollant peint imprime 45 cm x 2 m
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838090/neoserv/products/hjk_80651.png'] WHERE sku = '80651' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Papier autocollant peint imprime 45 cm x 2 m
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838091/neoserv/products/hjk_80650.png'] WHERE sku = '80650' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Papier autocollant peint imprime 45 cm x 2 m
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838092/neoserv/products/hjk_80649.png'] WHERE sku = '80649' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Papier autocollant peint imprime 45 cm x 2 m
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838092/neoserv/products/hjk_80639.png'] WHERE sku = '80639' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Papier autocollant peint imprime 45 cm x 2 m
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838097/neoserv/products/hjk_80632.png'] WHERE sku = '80632' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Poêle Marmite en fonte noire de 16 cm
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838099/neoserv/products/hjk_60555.png'] WHERE sku = '60555' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Poêle a frire en fonte noire de 28 cm
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838100/neoserv/products/hjk_60553.png'] WHERE sku = '60553' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Poêle a frire en fonte noire de 20 cm
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838101/neoserv/products/hjk_60551.png'] WHERE sku = '60551' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Poêle a frire en fonte noire de 18 cm
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838102/neoserv/products/hjk_60550.png'] WHERE sku = '60550' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- cadenas en laiton de 20 mm
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838102/neoserv/products/hjk_57222.png'] WHERE sku = '57222' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Jeu de 8 tournevis
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838103/neoserv/products/hjk_56652.png'] WHERE sku = '56652' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Jeu de 4 tournevis
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838104/neoserv/products/hjk_56649.png'] WHERE sku = '56649' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Cordon de rideau de 5 m etres
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838105/neoserv/products/hjk_52827.png'] WHERE sku = '52827' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Mousqueton en mousse de 14 cm
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838106/neoserv/products/hjk_52535.png'] WHERE sku = '52535' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Mousqueton 50 mm x2pcs
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838107/neoserv/products/hjk_52517.png'] WHERE sku = '52517' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Bâtonnets de colle transparents 18 cm x8pcs
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838108/neoserv/products/hjk_51722.png'] WHERE sku = '51722' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Corde  2,4 x 10 m etres
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838109/neoserv/products/hjk_51369.png'] WHERE sku = '51369' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- fil de fer  0.6 x 10 m etres
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838110/neoserv/products/hjk_51306.png'] WHERE sku = '51306' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Ensemble tournevis + douilles de 25 pi eces
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838112/neoserv/products/hjk_51123.png'] WHERE sku = '51123' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Tournevis plat 100 mm
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838113/neoserv/products/hjk_51071.png'] WHERE sku = '51071' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Tournevis cruciforme 100 mm
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838113/neoserv/products/hjk_51070.png'] WHERE sku = '51070' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Tournevis plat 75 mm
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838114/neoserv/products/hjk_51069.png'] WHERE sku = '51069' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Tournevis Phillips 75 mm
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838115/neoserv/products/hjk_51068.png'] WHERE sku = '51068' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- tournevis plats de 100 mm
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838116/neoserv/products/hjk_51067.png'] WHERE sku = '51067' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Cloueuse a boîte en plastique
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838117/neoserv/products/hjk_51046.png'] WHERE sku = '51046' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- stylo electrique transparent
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838118/neoserv/products/hjk_50935.png'] WHERE sku = '50935' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Tournevis precission 6 pcs
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838119/neoserv/products/hjk_50715.png'] WHERE sku = '50715' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Tournevis 5 e (2 pi eces)
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838120/neoserv/products/hjk_50698.png'] WHERE sku = '50698' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- agrafeuse Cloueuse 4-14 901
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838121/neoserv/products/hjk_50681.png'] WHERE sku = '50681' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- panier coco suspendu de 30cm
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838122/neoserv/products/hjk_49412.png'] WHERE sku = '49412' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- panier coco suspendu de 20cm
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838123/neoserv/products/hjk_49410.png'] WHERE sku = '49410' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Support a fleurs a double crochet pour pots
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838123/neoserv/products/hjk_49394.png'] WHERE sku = '49394' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- baca  glaçons de 12 cubes
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838124/neoserv/products/hjk_49371.png'] WHERE sku = '49371' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Parasol de 85 cm
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838125/neoserv/products/hjk_46078.png'] WHERE sku = '46078' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Hamac en toile 300 g
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838126/neoserv/products/hjk_46062.png'] WHERE sku = '46062' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- noeud blduc 3.3 cm 6 pi eces
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838127/neoserv/products/hjk_45525.png'] WHERE sku = '45525' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- lime a ongles
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838128/neoserv/products/hjk_45469.png'] WHERE sku = '45469' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- corde a linge 5 mm x 10 m
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838129/neoserv/products/hjk_41279.png'] WHERE sku = '41279' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- corde a linge3 mm x 20 m
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838130/neoserv/products/hjk_41213.png'] WHERE sku = '41213' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- corde a linge  3 mm x 10 m
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838131/neoserv/products/hjk_41212.png'] WHERE sku = '41212' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Aquarium rond de 11 L n° 4 en plastique
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838132/neoserv/products/hjk_40796.png'] WHERE sku = '40796' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Aquarium rond 4L n° 2 en plastique
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838133/neoserv/products/hjk_40795.png'] WHERE sku = '40795' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Ballon de basket-ball
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838134/neoserv/products/hjk_29695.png'] WHERE sku = '29695' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Ballon de football
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838135/neoserv/products/hjk_29690.png'] WHERE sku = '29690' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Ballon de football
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838135/neoserv/products/hjk_29689.png'] WHERE sku = '29689' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- rideau de douche 58G 180*180CM
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838136/neoserv/products/hjk_28973.png'] WHERE sku = '28973' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Rideau de douche uni, orange 200 x 180 cm
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838137/neoserv/products/hjk_28798.png'] WHERE sku = '28798' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Rideau de douche uni 200 x 180 cm
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838138/neoserv/products/hjk_28792.png'] WHERE sku = '28792' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Rideau de douche uni kaki 200 x 180 cm
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838139/neoserv/products/hjk_28786.png'] WHERE sku = '28786' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- feutrine EVA 2 mm 40 x 60 cm vert Bifu
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838140/neoserv/products/hjk_28708.png'] WHERE sku = '28708' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- feutrine EVA 2 mm 40 x 60 cm bleu ciel
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838141/neoserv/products/hjk_28697.png'] WHERE sku = '28697' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- feutrine EVA 2 mm 40 x 60 cm fushia brillant
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838142/neoserv/products/hjk_28692.png'] WHERE sku = '28692' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- feutrine EVA 2 mm 40 x 60 cm bleu fonce
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838143/neoserv/products/hjk_28688.png'] WHERE sku = '28688' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- feutrine EVA 2 mm 40 x 60 cm bleu clair
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838144/neoserv/products/hjk_28686.png'] WHERE sku = '28686' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- feutrine EVA 2 mm 40 x 60 cm violette
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838145/neoserv/products/hjk_28685.png'] WHERE sku = '28685' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Ensemble de 3 pistolets droits 1/2 pour tuyau
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838145/neoserv/products/hjk_27770.png'] WHERE sku = '27770' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Ensemble de connecteurs en 3 pi eces 3/4
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838146/neoserv/products/hjk_27769.png'] WHERE sku = '27769' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Raccord universel pour tuyau d eau 1/2
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838147/neoserv/products/hjk_27750.png'] WHERE sku = '27750' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Kit de pistolet pour tuyau  1/2
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838148/neoserv/products/hjk_27733.png'] WHERE sku = '27733' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Connecteur d entree d eau 1/2
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838149/neoserv/products/hjk_27720.png'] WHERE sku = '27720' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- couteau faucille de 60 cm
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838150/neoserv/products/hjk_27686.png'] WHERE sku = '27686' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Secateur  20 cm
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838151/neoserv/products/hjk_27617.png'] WHERE sku = '27617' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Secateur a manche en plastique de 20 cm
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838152/neoserv/products/hjk_27613.png'] WHERE sku = '27613' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Bac a glace  12.5 x 14.5 cm
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838153/neoserv/products/hjk_24720.png'] WHERE sku = '24720' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Bougie chauffe plat 3.5 cm  11 g blanche x50pcs
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838154/neoserv/products/hjk_20746.png'] WHERE sku = '20746' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Bougie chauffe plat 3.5 cm  5,5 g blanche x50pcs
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838156/neoserv/products/hjk_20745.png'] WHERE sku = '20745' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Bougie chauffe plat 3.5 cm 6 g x10pcs blanc
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838156/neoserv/products/hjk_20740.png'] WHERE sku = '20740' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Bougie chauffe plat 3.5 cm 6 g x10pcs rouge
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838157/neoserv/products/hjk_20739.png'] WHERE sku = '20739' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Bougie chauffe plat blanc 5.5 g x 50pcs
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838158/neoserv/products/hjk_10698.png'] WHERE sku = '10698' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- poelle friteusede 28 cm
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838159/neoserv/products/hjk_09576.png'] WHERE sku = '09576' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- poelle friteuse de 26 cm
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838161/neoserv/products/hjk_09575.png'] WHERE sku = '09575' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Coudi eres tricotees
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838161/neoserv/products/hjk_09044.png'] WHERE sku = '09044' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Supports de mollet tricotes
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838162/neoserv/products/hjk_09043.png'] WHERE sku = '09043' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Support de cheville tricote
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838163/neoserv/products/hjk_09042.png'] WHERE sku = '09042' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Support de paume tricote
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838164/neoserv/products/hjk_09041.png'] WHERE sku = '09041' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Sonnette 8O4D
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838165/neoserv/products/hjk_06566.png'] WHERE sku = '06566' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Sonnette V002
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838167/neoserv/products/hjk_06561.png'] WHERE sku = '06561' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Domino couleur  5010T
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838171/neoserv/products/hjk_06045.png'] WHERE sku = '06045' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- orth eses de genou
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838172/neoserv/products/hjk_05108.png'] WHERE sku = '05108' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Protection de la cheville
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838173/neoserv/products/hjk_05107.png'] WHERE sku = '05107' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- prot ege-mains
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838174/neoserv/products/hjk_05105.png'] WHERE sku = '05105' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Miroir rond 10.16cm
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838175/neoserv/products/hjk_04149.png'] WHERE sku = '04149' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- attelle de cheville de compression
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838176/neoserv/products/hjk_02527.png'] WHERE sku = '02527' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- genouill ere de compression
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838177/neoserv/products/hjk_02526.png'] WHERE sku = '02526' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Bâtons de colle  1.1 x 19.5 cm x6pcs
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838178/neoserv/products/hjk_02379.png'] WHERE sku = '02379' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Bâtons de colle  0.7*19.5CM x10pcs
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838179/neoserv/products/hjk_02378.png'] WHERE sku = '02378' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- cadenas 40 mm
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838180/neoserv/products/hjk_00028.png'] WHERE sku = '00028' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- adheisf pour ballons 100 points
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838181/neoserv/products/hjk_3FC0026.png'] WHERE sku = '3FC0026' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Pompe pour ballons en plastique 5 x 28 cm 1 pi ece
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838182/neoserv/products/hjk_3FC0002.png'] WHERE sku = '3FC0002' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Kit de 14 ballons en avec chiffre 9 degrade 80 cm
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838184/neoserv/products/hjk_3FB0957.png'] WHERE sku = '3FB0957' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Kit de 14 ballons en avec chiffre 8 degrade 80 cm
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838186/neoserv/products/hjk_3FB0956.png'] WHERE sku = '3FB0956' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Kit de 14 ballons en avec chiffre 7 degrade 80 cm
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838187/neoserv/products/hjk_3FB0955.png'] WHERE sku = '3FB0955' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Kit de 14 ballons en avec chiffre 6 degrade 80 cm
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838187/neoserv/products/hjk_3FB0954.png'] WHERE sku = '3FB0954' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Kit de 14 ballons en avec chiffre 5 degrade 80 cm
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838188/neoserv/products/hjk_3FB0953.png'] WHERE sku = '3FB0953' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Kit de 14 ballons en avec chiffre 4 degrade 80 cm
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838189/neoserv/products/hjk_3FB0952.png'] WHERE sku = '3FB0952' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Kit de 14 ballons en avec chiffre 3 degrade 80 cm
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838190/neoserv/products/hjk_3FB0951.png'] WHERE sku = '3FB0951' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Kit de 14 ballons en avec chiffre 2 degrade 80 cm
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838191/neoserv/products/hjk_3FB0950.png'] WHERE sku = '3FB0950' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Kit de 14 ballons en avec chiffre 1 degrade 80 cm
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838192/neoserv/products/hjk_3FB0949.png'] WHERE sku = '3FB0949' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Kit de 14 ballons en avec chiffre 0 degrade 80 cm
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838193/neoserv/products/hjk_3FB0948.png'] WHERE sku = '3FB0948' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Ballons en latex mat 1.5G 25 cm x10pcs  bleu
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838194/neoserv/products/hjk_3FA1169.png'] WHERE sku = '3FA1169' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Ballons en latex mat 1.5G 25 cm x10pcs blanc
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838195/neoserv/products/hjk_3FA1157.png'] WHERE sku = '3FA1157' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Ballons en latex mat 1.5G 25 cm x10pcs blanc
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838196/neoserv/products/hjk_3FA1138.png'] WHERE sku = '3FA1138' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- cadenas  20 mm
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838197/neoserv/products/hjk_00001.png'] WHERE sku = '00001' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- REVLON COLORSILK N°34 BOURGOGNE PROFOND
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838198/neoserv/products/hjk_695349.png'] WHERE sku = '695349' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- REVLON COLORSILK N°30 CHATAIN FONCE
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838199/neoserv/products/hjk_695301.png'] WHERE sku = '695301' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- REVLON COLORSILK N°20 BRUN NOIR
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838199/neoserv/products/hjk_695202.png'] WHERE sku = '695202' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- REVLON COLORSILK N°11 NOIR FONDANT
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838200/neoserv/products/hjk_695110.png'] WHERE sku = '695110' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- REVLON COLORSILK N°10 NOIR NATUREL
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838202/neoserv/products/hjk_695103.png'] WHERE sku = '695103' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- REVLON COLORSILK N°48 BOURGOGNE
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838203/neoserv/products/hjk_623481.png'] WHERE sku = '623481' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- REVLON COLORSILK N°12 NOIR BLEUTE NATUREL
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838205/neoserv/products/hjk_623122.png'] WHERE sku = '623122' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- REVLON COLORSILK N°45 AUBURN CLAIR
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838207/neoserv/products/hjk_695455.png'] WHERE sku = '695455' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- REVLON COLORSILK N°54 CHATAIN DORÉ CLAIR
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838208/neoserv/products/hjk_695547.png'] WHERE sku = '695547' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- allumettes 4 * 180allumettes
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838209/neoserv/products/hjk_8900072.png'] WHERE sku = '8900072' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- bouteille pvc 3039杯
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838211/neoserv/products/hjk_K47495.png'] WHERE sku = 'K47495' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- CUILLÈRE réutilisable en plastique X50PCS
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838212/neoserv/products/hjk_17TR.png'] WHERE sku = '17TR' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Fourchettes reutilisable transp X50PCS
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838213/neoserv/products/hjk_15TR.png'] WHERE sku = '15TR' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- GOBELET RPET 30/40 CL AVEC COUVERCLE X 20PCS 500ML
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838214/neoserv/products/hjk_K43592.png'] WHERE sku = 'K43592' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Lot de 50 pot a sauce reutilisable avec couvercle
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838215/neoserv/products/hjk_K43470.png'] WHERE sku = 'K43470' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Boite à pâtes en kraft 500ML X50PCS
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838216/neoserv/products/hjk_K48438.png'] WHERE sku = 'K48438' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Bac gastro INOX 
Avec couvercle 1/1x15 cm
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838218/neoserv/products/hjk_K41758.png'] WHERE sku = 'K41758' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- EDC Reine Des Fleurs - 100ml
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838219/neoserv/products/hjk_621083.png'] WHERE sku = '621083' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- EDC Reine Des Fleurs - 423ml
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838220/neoserv/products/hjk_0620086.png'] WHERE sku = '0620086' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Lotion Rêve d''or - 100ml
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838221/neoserv/products/hjk_0672528.png'] WHERE sku = '0672528' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Lotion Rêve d''or - 423 ml
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838222/neoserv/products/hjk_0620529.png'] WHERE sku = '0620529' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Lotion Pompeia - 100ml
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838223/neoserv/products/hjk_0621076.png'] WHERE sku = '0621076' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Lotion Pompeia - 423ml
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838224/neoserv/products/hjk_0620512.png'] WHERE sku = '0620512' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- HEliotrope Blanc - 100ml
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838225/neoserv/products/hjk_0621052.png'] WHERE sku = '0621052' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- HEliotrope Blanc - 423ml
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838226/neoserv/products/hjk_0620055.png'] WHERE sku = '0620055' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Pot Carton Kraft  chaud et froid avec couvercle1000 ml X25PCS
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838227/neoserv/products/hjk_K48429.png'] WHERE sku = 'K48429' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Barquette Carre en Carton Kraft et Couvercle Fraîcheur PET 1000ML X 25PCS
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838228/neoserv/products/hjk_K48418.png'] WHERE sku = 'K48418' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Barquette Rond en Carton Kraft et Couvercle Fraîcheur PET500ML X 25PCS
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838229/neoserv/products/hjk_K48422.png'] WHERE sku = 'K48422' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Barquette Rond en Carton Kraft et Couvercle Fraîcheur PET 750ML X 25PCS
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838230/neoserv/products/hjk_K48423.png'] WHERE sku = 'K48423' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Barquette Rond en Carton Kraft et Couvercle Fraîcheur PET 1100ML X 25PCS
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838231/neoserv/products/hjk_K48424.png'] WHERE sku = 'K48424' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Barquette Rond en Carton Kraft et Couvercle Fraîcheur PET 1300ML X 25PCS
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838232/neoserv/products/hjk_K48425.png'] WHERE sku = 'K48425' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- sacs en papier Kraft pour vente à emporter 21*11*27 X 25PCS
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838233/neoserv/products/hjk_K48426.png'] WHERE sku = 'K48426' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- sacs en papier Kraft pour vente à emporter 25*13.5*27 X 25PCS
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838234/neoserv/products/hjk_K48427.png'] WHERE sku = 'K48427' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Boîte rectangulaire carton brun avec couvercle à fenêtre 1200 ml  X50PCS
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838235/neoserv/products/hjk_K48415.png'] WHERE sku = 'K48415' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Broom ELY  ''3 FIBRE'' soft-medium-strong
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838235/neoserv/products/hjk_079037.png'] WHERE sku = '079037' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- ADOBO GOYA AVEC POIVRE 435 G ROUGE
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838236/neoserv/products/hjk_3827.png'] WHERE sku = '3827' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- GRANDES FOURCHETTES PS ORANGE.15U
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838237/neoserv/products/hjk_1368.png'] WHERE sku = '1368' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- SUPPORT ASSIETTES 175-1
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838238/neoserv/products/hjk_K44128.png'] WHERE sku = 'K44128' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- bonnet Turban pour homme en satin NK303BLAM
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838239/neoserv/products/hjk_K47254.png'] WHERE sku = 'K47254' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- bonnet Turban pour homme en satin NK304BLAM
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838240/neoserv/products/hjk_K47255.png'] WHERE sku = 'K47255' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- BONNET CAP 23CM L
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838241/neoserv/products/hjk_K41423.png'] WHERE sku = 'K41423' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- BONNET CAP 45CM XL
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838242/neoserv/products/hjk_K41424.png'] WHERE sku = 'K41424' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- mascara M3373
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838244/neoserv/products/hjk_K45982.png'] WHERE sku = 'K45982' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- mascara R6664
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838245/neoserv/products/hjk_R6664.png'] WHERE sku = 'R6664' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- mascara M3498
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838246/neoserv/products/hjk_K45981.png'] WHERE sku = 'K45981' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- mascara R6598E
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838247/neoserv/products/hjk_R6598E.png'] WHERE sku = 'R6598E' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- bols reutilisable18cm x50pcs
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838248/neoserv/products/hjk_K46934.png'] WHERE sku = 'K46934' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- bocal 500ML
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838249/neoserv/products/hjk_K44515.png'] WHERE sku = 'K44515' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Jolly Jolly Nata de Coco Saveur FRUIT DE PASSION 320ML
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838250/neoserv/products/hjk_8611166PASS.png'] WHERE sku = '8611166PASS' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- crayon
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838250/neoserv/products/hjk_K44186.png'] WHERE sku = 'K44186' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- crayon
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838251/neoserv/products/hjk_K44185.png'] WHERE sku = 'K44185' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- COLLE SUPER INSTANTANÉE - 3pcs
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838253/neoserv/products/hjk_K41452.png'] WHERE sku = 'K41452' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Boite a gateaux en carton blanc 350 g  31*31*8CM R:B-1
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838253/neoserv/products/hjk_K47800.png'] WHERE sku = 'K47800' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- kits aiguille pour tissage
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838255/neoserv/products/hjk_K47258.png'] WHERE sku = 'K47258' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- ADHESIF SIGNALISATION 50mm*5m
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838256/neoserv/products/hjk_80172.png'] WHERE sku = '80172' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- ADHESIF SCOTCH 18mm*35m 2pcs
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838257/neoserv/products/hjk_80034.png'] WHERE sku = '80034' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- BATON DE COLLE 0.7*18cm 12pcs
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838259/neoserv/products/hjk_02481.png'] WHERE sku = '02481' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- ADHESIF NOIR 18mm*10m
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838263/neoserv/products/hjk_80137.png'] WHERE sku = '80137' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- BONNET CAP TISSU 45CM NOIR
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838264/neoserv/products/hjk_K41422.png'] WHERE sku = 'K41422' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- bonnet satin NOIR 50cm
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838265/neoserv/products/hjk_K41464.png'] WHERE sku = 'K41464' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- BONNET CAP NOIR * 2PCS
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838266/neoserv/products/hjk_K41966.png'] WHERE sku = 'K41966' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- kit Aiguille fil pour tissage 140103C
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838267/neoserv/products/hjk_K41409.png'] WHERE sku = 'K41409' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- bonnet  cap durag
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838268/neoserv/products/hjk_K41408.png'] WHERE sku = 'K41408' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Boite a gateaux en carton blanc 350 g 
38*38*8CM
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838268/neoserv/products/hjk_K48455.png'] WHERE sku = 'K48455' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Boite a gateaux en carton blanc 350 g 
21*21*8CM
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838269/neoserv/products/hjk_K47802.png'] WHERE sku = 'K47802' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Boite a gateaux en carton blanc 350 g 
26*26*8CM
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838270/neoserv/products/hjk_K47801.png'] WHERE sku = 'K47801' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Boite a gateaux en carton blanc 350 g 
36 x 36 x 8 cm
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838271/neoserv/products/hjk_K47799.png'] WHERE sku = 'K47799' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Boite a gateaux en carton blanc 350 g 
40 x 40 x 8 cm
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838272/neoserv/products/hjk_K47798.png'] WHERE sku = 'K47798' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Bandana coton 54*54CM
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838273/neoserv/products/hjk_K47252.png'] WHERE sku = 'K47252' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Meche synthetique
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838274/neoserv/products/hjk_K47259.png'] WHERE sku = 'K47259' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- KITS aiguille pour BALLONS
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838274/neoserv/products/hjk_01533.png'] WHERE sku = '01533' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- BATON DE COLLE 0.7*10cm 6pcs
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838275/neoserv/products/hjk_02484.png'] WHERE sku = '02484' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- BATON DE COLLE1.1*18cm 5pcs
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838276/neoserv/products/hjk_02554.png'] WHERE sku = '02554' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- ADHESIF TRANSPARENT 48*25MM AVEC SUPPORT
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838276/neoserv/products/hjk_80270.png'] WHERE sku = '80270' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- ADHESIF POUR TAPIS SOL 24MM X 10M
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838278/neoserv/products/hjk_80377.png'] WHERE sku = '80377' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- ASHESIF SCOTCH 18mm*35m 2pcs
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838279/neoserv/products/hjk_80037.png'] WHERE sku = '80037' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- RUBAN SCRATCH 36*36mm 4pcs
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838280/neoserv/products/hjk_03853.png'] WHERE sku = '03853' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- AMPOULE TUBE LINOLITE 7W 6500K
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838282/neoserv/products/hjk_K91014.png'] WHERE sku = 'K91014' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- bonnet imprime NK1002-P
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838283/neoserv/products/hjk_K47253.png'] WHERE sku = 'K47253' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- KITS aiguille pour BALLONS
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838284/neoserv/products/hjk_01532.png'] WHERE sku = '01532' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- BARQUETTE ALUM  500ML 15*12cm 
 AVEC COURVECLE X 50PCS
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838285/neoserv/products/hjk_K48433.png'] WHERE sku = 'K48433' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Film étirable transparent 45cm * 20mic * 365m / 3.33Kg
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838286/neoserv/products/hjk_K43480.png'] WHERE sku = 'K43480' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Sac bretelle biodégradable en rouleau X 300pcs 26,5 X 45.5  Rouge
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838286/neoserv/products/hjk_K47841_R.png'] WHERE sku = 'K47841/R' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Sac bretelle reutilisable（26+6+6*43.6）*63.8mic 1000 pcs
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838288/neoserv/products/hjk_K48447.png'] WHERE sku = 'K48447' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Sac bretelle reutilisable（18.5+5.5+5.5）*34.5*70mic 2000 pcs/ctn
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838289/neoserv/products/hjk_K48448.png'] WHERE sku = 'K48448' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Sac bretelle reutilisable（33+9.5+9.5）*62*75mic 500 pcs/ctn
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838290/neoserv/products/hjk_K48446.png'] WHERE sku = 'K48446' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Sac bretelle biodégradable en rouleau X 300pcs 26,5 X 45.5  Bleu
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838290/neoserv/products/hjk_K47841_B.png'] WHERE sku = 'K47841/B' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Sac biodégradable en rouleau X 300pc 30*40
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838291/neoserv/products/hjk_K47840.png'] WHERE sku = 'K47840' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- pince cheveux
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838292/neoserv/products/hjk_K47196.png'] WHERE sku = 'K47196' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- coupe dessert en pvc reutilisable 220ml  x50pcs
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838293/neoserv/products/hjk_K47812A.png'] WHERE sku = 'K47812A' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- porte cle
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838293/neoserv/products/hjk_K46870.png'] WHERE sku = 'K46870' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Short de plage filigrane enfant S/M/L/XL
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838294/neoserv/products/hjk_K43765.png'] WHERE sku = 'K43765' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Papier de soie 50*66 cm 17g 5 pièces jaune fluo
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838295/neoserv/products/hjk_ME031-5.png'] WHERE sku = 'ME031-5' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Papier crépon 50*200cm 21g Violet Fluo
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838296/neoserv/products/hjk_ME032-32.png'] WHERE sku = 'ME032-32' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- decor Halloween  Masque de cri + tissu
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838297/neoserv/products/hjk_K48102.png'] WHERE sku = 'K48102' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- decor Halloween  Masque pour les yeux bombés + tissu
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838298/neoserv/products/hjk_K48101.png'] WHERE sku = 'K48101' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- decor Halloween  masque
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838300/neoserv/products/hjk_K48097.png'] WHERE sku = 'K48097' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- petit plat à saveur HXD-1598A
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838301/neoserv/products/hjk_101852.png'] WHERE sku = '101852' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Couteau chien black edition
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838302/neoserv/products/hjk_CC000004.png'] WHERE sku = 'CC000004' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- ROULEAU ALUMINIUM 10 MIC 30cm*300m
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838304/neoserv/products/hjk_K43525.png'] WHERE sku = 'K43525' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Barquettes PP reutilisable micro ondes transp  avec couvercle 1000ML *25PCS
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838304/neoserv/products/hjk_K43547.png'] WHERE sku = 'K43547' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- assiette dessert reutilisable 18cm x50pcs
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838305/neoserv/products/hjk_K46936.png'] WHERE sku = 'K46936' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- BARQUETTES EN ALU OVAL 45,3*8,5*35,5CM
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838306/neoserv/products/hjk_K47645.png'] WHERE sku = 'K47645' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- GOUDRE ISOTHEME IMPRI GP 350ML
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838307/neoserv/products/hjk_K47266.png'] WHERE sku = 'K47266' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- pince pour cheveux
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838308/neoserv/products/hjk_K46648.png'] WHERE sku = 'K46648' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- rasoir soucils 3pcs
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838309/neoserv/products/hjk_K46812.png'] WHERE sku = 'K46812' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- sac a paille
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838309/neoserv/products/hjk_K45806.png'] WHERE sku = 'K45806' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- crayon sourcils jumbo marron
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838310/neoserv/products/hjk_1221.png'] WHERE sku = '1221' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- baton lumineux a pile
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838311/neoserv/products/hjk_K43162.png'] WHERE sku = 'K43162' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- baton lumineux a pile
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838312/neoserv/products/hjk_K43161.png'] WHERE sku = 'K43161' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- set 6 pcs petit tableau noir
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838313/neoserv/products/hjk_K45818.png'] WHERE sku = 'K45818' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- strass autocollant
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838314/neoserv/products/hjk_K42576.png'] WHERE sku = 'K42576' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Autocollants a trous ronds 70 autocollants * 5 PCS
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838315/neoserv/products/hjk_MU063.png'] WHERE sku = 'MU063' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- strass autocollant
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838316/neoserv/products/hjk_K42588.png'] WHERE sku = 'K42588' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- strass autocollant
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838317/neoserv/products/hjk_K42592.png'] WHERE sku = 'K42592' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- strass autocollant
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838318/neoserv/products/hjk_K42579.png'] WHERE sku = 'K42579' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- strass autocollant
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838319/neoserv/products/hjk_K42585.png'] WHERE sku = 'K42585' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- brosse cheveux
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838321/neoserv/products/hjk_K46627.png'] WHERE sku = 'K46627' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- HADAY SIGNATURE DARK SOY SAUCE 4.9L 海天招牌老抽王
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838321/neoserv/products/hjk_5001492.png'] WHERE sku = '5001492' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- pince pour drap de lit
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838323/neoserv/products/hjk_K43778.png'] WHERE sku = 'K43778' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- crayon couleur 8*120mm 24couleur
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838324/neoserv/products/hjk_MP008-24.png'] WHERE sku = 'MP008-24' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- gouache 12 couleurs 12ml peinture a l''huile
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838325/neoserv/products/hjk_MP057.png'] WHERE sku = 'MP057' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- 2650-1 Boîte de couleurs pour crayons hexagonaux Color Core 18 Couleur
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838326/neoserv/products/hjk_MP047-2.png'] WHERE sku = 'MP047-2' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- boîte de couleur tige hexagonale pastel à l''huile 73mm 18 couleurs
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838327/neoserv/products/hjk_MP015-18.png'] WHERE sku = 'MP015-18' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- MONTRE  ELECTRONIQUE couleur dégradée
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838327/neoserv/products/hjk_K43452.png'] WHERE sku = 'K43452' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- BOL À SALADE RONDE ROUGE 500CC PS 25U
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838328/neoserv/products/hjk_1059.png'] WHERE sku = '1059' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- MONTRE  ELECTRONIQUE couleur dégradée
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838329/neoserv/products/hjk_K43448.png'] WHERE sku = 'K43448' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- MONTRE  ELECTRONIQUE couleur dégradée
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838330/neoserv/products/hjk_K43450.png'] WHERE sku = 'K43450' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- MONTRE  ELECTRONIQUE couleur dégradée
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838331/neoserv/products/hjk_K43449.png'] WHERE sku = 'K43449' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- MONTRE  ELECTRONIQUE couleur dégradée
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838332/neoserv/products/hjk_K43453.png'] WHERE sku = 'K43453' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- MONTRE  ELECTRONIQUE couleur dégradée
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838333/neoserv/products/hjk_K43451.png'] WHERE sku = 'K43451' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- MONTRE  ELECTRONIQUE couleur dégradée
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838334/neoserv/products/hjk_K43447.png'] WHERE sku = 'K43447' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- rasoir soucils 3pcs
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838336/neoserv/products/hjk_K46813.png'] WHERE sku = 'K46813' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Ramette de papier A4 (21x29,7 cm) 500 feuilles, 80g blanc
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838337/neoserv/products/hjk_9137345.png'] WHERE sku = '9137345' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Creme of Nature Argan Oil Intensive Conditioning Treatment 20o
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838338/neoserv/products/hjk_252714.png'] WHERE sku = '252714' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- PROLINE ARGAN OIL 128G
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838339/neoserv/products/hjk_PRO0046.png'] WHERE sku = 'PRO0046' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- BARQUETTE ALUM 2COMP 900ML
 AVEC COURVECLE X50PCS
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838339/neoserv/products/hjk_K43501.png'] WHERE sku = 'K43501' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- BARQUETTE ALUM 2COMP 900ML
 AVEC COURVECLE X10PCS
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838341/neoserv/products/hjk_K46951.png'] WHERE sku = 'K46951' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Bulle de Savon Barbie 60ML
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838342/neoserv/products/hjk_70095126.png'] WHERE sku = '70095126' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- CHEMIN  de table 13*72
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838343/neoserv/products/hjk_K45835.png'] WHERE sku = 'K45835' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- eponge twist MM
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838344/neoserv/products/hjk_K39635.png'] WHERE sku = 'K39635' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- eponge twist GM
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838344/neoserv/products/hjk_K39636.png'] WHERE sku = 'K39636' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- eponge twist GM
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838345/neoserv/products/hjk_K39634.png'] WHERE sku = 'K39634' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- lampe PORTE CLE
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838346/neoserv/products/hjk_K42187.png'] WHERE sku = 'K42187' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- lime pour ongle VKN-DM2000打磨机
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838348/neoserv/products/hjk_K42646.png'] WHERE sku = 'K42646' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- AXE DEO CLICK 150ML
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838349/neoserv/products/hjk_1029295.png'] WHERE sku = '1029295' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- AXE DEO SPRAY 150ML   ADRENALIN
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838350/neoserv/products/hjk_7364652.png'] WHERE sku = '7364652' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- AXE DEO SPRAY 150ML EXCITE
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838351/neoserv/products/hjk_1114502.png'] WHERE sku = '1114502' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- AXE DEO APOLLO 150ML
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838352/neoserv/products/hjk_1114472.png'] WHERE sku = '1114472' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- AXE DEO ANARCHY FOR HER 150ML
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838353/neoserv/products/hjk_1114458.png'] WHERE sku = '1114458' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Bol rond PP reutilisable micro ondes noires  avec couvercle 800ML X25PCS
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838354/neoserv/products/hjk_K43552.png'] WHERE sku = 'K43552' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Brochettes en bambou 3.0 x 18 cm. 70 PCS
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838354/neoserv/products/hjk_5404242.png'] WHERE sku = '5404242' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- AXE DEO ANARCHY FOR HIM 150ML
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838355/neoserv/products/hjk_1114465.png'] WHERE sku = '1114465' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- AXE DEODORANT MUSK 48H FRAIS 150ML
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838356/neoserv/products/hjk_1114557.png'] WHERE sku = '1114557' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- air horn
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838357/neoserv/products/hjk_K43996.png'] WHERE sku = 'K43996' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- CF Coloration permanente#31 Vivid Red *12
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838358/neoserv/products/hjk_640313.png'] WHERE sku = '640313' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- CF Coloration permanente #32 Spiced Red*12
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838358/neoserv/products/hjk_640320.png'] WHERE sku = '640320' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- CF Coloration permanente#20 Light Golden Brown *12
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838359/neoserv/products/hjk_640207.png'] WHERE sku = '640207' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- CF Coloration permanente#41 Honey Blonde*12
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838362/neoserv/products/hjk_640412.png'] WHERE sku = '640412' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- CF Coloration permanente #10 Jet Black  *12
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838362/neoserv/products/hjk_640108.png'] WHERE sku = '640108' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- CF Coloration permanenteHC #21 Rich Brown *12
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838363/neoserv/products/hjk_640214.png'] WHERE sku = '640214' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- CF Coloration permanente#43 Lightest Blonde*12
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838364/neoserv/products/hjk_640405.png'] WHERE sku = '640405' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- CF Coloration permanente#42 Light Golden Blonde*12
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838365/neoserv/products/hjk_780422.png'] WHERE sku = '780422' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- CF Coloration permanente#1 Natural Black - Moisture-Rich*12
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838366/neoserv/products/hjk_770010.png'] WHERE sku = '770010' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- CF Coloration permanente#3 Jet Black - Moisture-Rich*12
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838366/neoserv/products/hjk_770034.png'] WHERE sku = '770034' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- CF Coloration permanente- 10.0 Honey Blonde*12
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838368/neoserv/products/hjk_4062627.png'] WHERE sku = '4062627' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- CF Coloration permanente- 7.3 Medium Warm Brown*12
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838368/neoserv/products/hjk_4062863.png'] WHERE sku = '4062863' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- CF Coloration permanente- 9.2 Light Carmel Brown*12
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838369/neoserv/products/hjk_4062665.png'] WHERE sku = '4062665' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- CF Coloration permanente- 1.0 Intense Black*12
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838370/neoserv/products/hjk_232679.png'] WHERE sku = '232679' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- CF Coloration permanente- 3.0 Soft Black*12
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838371/neoserv/products/hjk_232686.png'] WHERE sku = '232686' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- CF Coloration permanente- 7.64 Bronze Copper*12
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838372/neoserv/products/hjk_232693.png'] WHERE sku = '232693' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- CF Coloration permanente- 7.6 Intensive Red*12
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838373/neoserv/products/hjk_232761.png'] WHERE sku = '232761' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- CF Coloration permanente- 6.4 Red Copper*12
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838373/neoserv/products/hjk_232723.png'] WHERE sku = '232723' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- CF Coloration permanente- 10.01 Ginger Blonde*12
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838374/neoserv/products/hjk_232785.png'] WHERE sku = '232785' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- CF Coloration permanente- 6.2 Burgundy Blaze*12
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838375/neoserv/products/hjk_66200.png'] WHERE sku = '66200' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- CF Coloration permanente- 9.23 Light Golden Blonde*12
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838377/neoserv/products/hjk_4062658.png'] WHERE sku = '4062658' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- TISSU DE LIN 1.8M*30M
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838377/neoserv/products/hjk_K48350.png'] WHERE sku = 'K48350' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- BULLE DE SAVON STITCH 60ML
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838378/neoserv/products/hjk_5007931.png'] WHERE sku = '5007931' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- BULLE DE SAVON MICKEY - 60ML
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838379/neoserv/products/hjk_5041201.png'] WHERE sku = '5041201' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- BULLE DE SAVON PRINCESS 60ML
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838380/neoserv/products/hjk_5044806.png'] WHERE sku = '5044806' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- BULLE DE SAVON CARS 60ML
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838381/neoserv/products/hjk_5049009.png'] WHERE sku = '5049009' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- BULLE DE SAVON MINNIE  60ML
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838382/neoserv/products/hjk_5053808.png'] WHERE sku = '5053808' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- BULLE DE SAVON AVENGERS 60ML
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838383/neoserv/products/hjk_559003.png'] WHERE sku = '559003' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- BULLE DE SAVON FROZEN 60ML
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838383/neoserv/products/hjk_5823005.png'] WHERE sku = '5823005' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- BULLE DE SAVON SPIDER MAN  60ML
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838385/neoserv/products/hjk_5513005.png'] WHERE sku = '5513005' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Arcade verrou double entre 3 cles
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838385/neoserv/products/hjk_CA8613.png'] WHERE sku = 'CA8613' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Arcade verrou a bouton 3 cles
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838386/neoserv/products/hjk_CA8611.png'] WHERE sku = 'CA8611' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- ROULEAU DE PAPIER CB 54X40X10
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838387/neoserv/products/hjk_CB3456.png'] WHERE sku = 'CB3456' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- SANDALE ENFANT PAW PATROL
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838388/neoserv/products/hjk_PW13473.png'] WHERE sku = 'PW13473' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- SANDALE ENFANT PRINCESSE 23-30
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838389/neoserv/products/hjk_WD13690.png'] WHERE sku = 'WD13690' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- SANDALE ENFANT LEECOOPER 30-35
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838389/neoserv/products/hjk_LCKIDS.png'] WHERE sku = 'LCKIDS' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- SANDALE ENFANT LION KING 24-32
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838390/neoserv/products/hjk_WD13721.png'] WHERE sku = 'WD13721' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- SANDALE ENFANT LOONEY TUNES
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838391/neoserv/products/hjk_Loo21.png'] WHERE sku = 'Loo21' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- SANDALE ENFANT SAM FIRMAN
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838393/neoserv/products/hjk_FIR021.png'] WHERE sku = 'FIR021' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Panier Rattan 2,3 L Ø 15,5 x 17,9 cm SURT VRM
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838393/neoserv/products/hjk_151201A.png'] WHERE sku = '151201A' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Aneth vert d''impression de couleur de clôture de plante de simulation
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838394/neoserv/products/hjk_2902409.png'] WHERE sku = '2902409' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Pot Quartz 19 cm SURTIDO FUTURE
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838395/neoserv/products/hjk_20027W9.png'] WHERE sku = '20027W9' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- pince pour cheveux
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838397/neoserv/products/hjk_K46647.png'] WHERE sku = 'K46647' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- panier rangement 306
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838398/neoserv/products/hjk_K47600.png'] WHERE sku = 'K47600' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Accessoire Bain Nº 3
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838399/neoserv/products/hjk_12334.png'] WHERE sku = '12334' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Entonnoir en plastique 9.8 x 8.5 cm
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838400/neoserv/products/hjk_2407281.png'] WHERE sku = '2407281' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- tase en verre avec paille 450ml
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838403/neoserv/products/hjk_K46849.png'] WHERE sku = 'K46849' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- COCOTE ALU JETABLE AVEC COUVERCLE  L-25,5CM H-14CM
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838406/neoserv/products/hjk_K45921.png'] WHERE sku = 'K45921' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- BARQUETTE 800ML BLANCHE CANNE A SUCRE AVEC COUVERCLE X25PCS
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838407/neoserv/products/hjk_90017.png'] WHERE sku = '90017' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- verrine 6.3*21.5cm transparent reutilisable x 6pcs
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838408/neoserv/products/hjk_K42700.png'] WHERE sku = 'K42700' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Gobelets carton 250ml x25pcs VERT ANIS
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838409/neoserv/products/hjk_K42718.png'] WHERE sku = 'K42718' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- FONENG Cable de donnees et de charge rapide  XS07Type-C 3A. noir. 1.2 m
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838410/neoserv/products/hjk_511526.png'] WHERE sku = '511526' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- 100 SERVIETTES 30*30CM
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838411/neoserv/products/hjk_4900490_902BL.png'] WHERE sku = '4900490/902BL' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Short de plagepour homme avec filet intérieur XL/XXL/XXXL
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838412/neoserv/products/hjk_K43760.png'] WHERE sku = 'K43760' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- LOT X2 FICELLE ALIMENTAIRE 50M
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838413/neoserv/products/hjk_4420527.png'] WHERE sku = '4420527' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- FONENG Batterie externe PX109 10 000 mAh. noire
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838414/neoserv/products/hjk_511267.png'] WHERE sku = '511267' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- CABAS IMPRIME-MQ 45*40*20
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838415/neoserv/products/hjk_K41915.png'] WHERE sku = 'K41915' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- boite de gommes lot de 6pcs
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838418/neoserv/products/hjk_MK079-4.png'] WHERE sku = 'MK079-4' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- TROUSSE ECOLE 22*9*6.5CM
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838419/neoserv/products/hjk_MX032-3.png'] WHERE sku = 'MX032-3' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- TROUSSE ECOLE 20*7*6CM
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838420/neoserv/products/hjk_MX032-1.png'] WHERE sku = 'MX032-1' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- lenor perles 224g DROMEN
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838421/neoserv/products/hjk_0090299.png'] WHERE sku = '0090299' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- LENOR PERLE SPRING 224G
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838422/neoserv/products/hjk_0090350.png'] WHERE sku = '0090350' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- LENOR PERLE DROY MRS HINCH 224G
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838423/neoserv/products/hjk_6032827.png'] WHERE sku = '6032827' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Ruban d''avertissement  50MM*5M
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838424/neoserv/products/hjk_8701054.png'] WHERE sku = '8701054' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- ruban signalisation rouge blanc  48MM X 50M
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838424/neoserv/products/hjk_80168.png'] WHERE sku = '80168' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Chaine antivol pour moto 6*900mm
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838427/neoserv/products/hjk_2001255.png'] WHERE sku = '2001255' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- meche à cannelure  4-20mm
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838428/neoserv/products/hjk_9363773.png'] WHERE sku = '9363773' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Mèche à béton 5PCS
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838429/neoserv/products/hjk_D6313318.png'] WHERE sku = 'D6313318' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Eponge 11*6.5*3CM
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838430/neoserv/products/hjk_D5404120.png'] WHERE sku = 'D5404120' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- mousqueton 8# 74*33mm
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838431/neoserv/products/hjk_00290.png'] WHERE sku = '00290' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- cadenas 70mm
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838431/neoserv/products/hjk_01297.png'] WHERE sku = '01297' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- boite rangement en tissu 16504# 50*30*22CM
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838432/neoserv/products/hjk_K46494.png'] WHERE sku = 'K46494' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Ensemble de douche1.5M
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838434/neoserv/products/hjk_3283022.png'] WHERE sku = '3283022' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- kit de réparation de pneus 3 pcs
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838439/neoserv/products/hjk_2000939.png'] WHERE sku = '2000939' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Casse-noix 175MM 6313455
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838440/neoserv/products/hjk_9363670.png'] WHERE sku = '9363670' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Boite micro-ondes cuiseur riz vapeur 2600ML
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838440/neoserv/products/hjk_107.png'] WHERE sku = '107' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- BATH brush
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838441/neoserv/products/hjk_000765.png'] WHERE sku = '000765' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Seau à roulettes Slider GAMME CLEAN
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838442/neoserv/products/hjk_1496133.png'] WHERE sku = '1496133' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- vase fleur PVC 9243SN
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838443/neoserv/products/hjk_K47449.png'] WHERE sku = 'K47449' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Boîte à chaussures 10 L
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838444/neoserv/products/hjk_12641.png'] WHERE sku = '12641' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Boîte alimentaire Frost Nº7 6,5 L BLANC
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838445/neoserv/products/hjk_1203601.png'] WHERE sku = '1203601' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Pot Viena 1L SURT VRM COMBI
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838447/neoserv/products/hjk_142734M.png'] WHERE sku = '142734M' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- CLOCHE MICRO ONDE
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838447/neoserv/products/hjk_12011121.png'] WHERE sku = '12011121' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Couvercle micro-ondes petit
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838448/neoserv/products/hjk_11215.png'] WHERE sku = '11215' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Plateau blanc  S
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838449/neoserv/products/hjk_11180.png'] WHERE sku = '11180' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- goudre a paille 600ml
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838450/neoserv/products/hjk_K44606.png'] WHERE sku = 'K44606' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- etiquettes de prix 13.5x9.5cm 10pcs
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838450/neoserv/products/hjk_MU143-2.png'] WHERE sku = 'MU143-2' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- BALLONS BLANC 12P*10PCS
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838451/neoserv/products/hjk_K40940.png'] WHERE sku = 'K40940' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Gant de toilette en coton et lin
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838452/neoserv/products/hjk_3280413.png'] WHERE sku = '3280413' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- tournevis 5x120mm
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838453/neoserv/products/hjk_2308955.png'] WHERE sku = '2308955' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- porte cle 50mm 5# 2Uds
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838454/neoserv/products/hjk_02770.png'] WHERE sku = '02770' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- cadenas 90mm
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838454/neoserv/products/hjk_01299.png'] WHERE sku = '01299' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Presse à main en plastique à quatre boutons 16,5 cm
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838455/neoserv/products/hjk_8201773.png'] WHERE sku = '8201773' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- cadenas 3pz
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838456/neoserv/products/hjk_00572.png'] WHERE sku = '00572' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Bande arrière en coton et lin
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838457/neoserv/products/hjk_3280410.png'] WHERE sku = '3280410' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- peigne
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838458/neoserv/products/hjk_K46635.png'] WHERE sku = 'K46635' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- peigne
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838458/neoserv/products/hjk_K46632.png'] WHERE sku = 'K46632' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- peigne
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838460/neoserv/products/hjk_K46631.png'] WHERE sku = 'K46631' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- housse coussin 45*45cm
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838461/neoserv/products/hjk_3283253.png'] WHERE sku = '3283253' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Couvercle en inox
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838462/neoserv/products/hjk_D5404151.png'] WHERE sku = 'D5404151' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- boite de gommes lot de 6pcs
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838462/neoserv/products/hjk_MK079-5.png'] WHERE sku = 'MK079-5' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Etui multi-usages CUISINE TRANSPARENT
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838463/neoserv/products/hjk_1215406.png'] WHERE sku = '1215406' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- panier decoration
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838464/neoserv/products/hjk_K45819.png'] WHERE sku = 'K45819' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- PLATEAU ALU AVEC POIGNE 48*33*8
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838464/neoserv/products/hjk_K46137.png'] WHERE sku = 'K46137' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- assiettes carre reutilisable 25,50cm * 6 pcs
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838465/neoserv/products/hjk_K47825.png'] WHERE sku = 'K47825' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Bac gastro en PET incassable 1/2x10
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838466/neoserv/products/hjk_K43075.png'] WHERE sku = 'K43075' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- BROSSE WC 9802座刷  精装
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838467/neoserv/products/hjk_K47556.png'] WHERE sku = 'K47556' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- BACHE marron
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838468/neoserv/products/hjk_2902773.png'] WHERE sku = '2902773' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- flute a champagne dore
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838469/neoserv/products/hjk_K46670.png'] WHERE sku = 'K46670' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- FLUTE CHAMPAGNE CHROME TURQUOISE 深蓝/L16
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838470/neoserv/products/hjk_K46678.png'] WHERE sku = 'K46678' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- serringue pour gateau + 8 bouches
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838471/neoserv/products/hjk_5404015.png'] WHERE sku = '5404015' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Bol bambou carre 20*5CM
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838472/neoserv/products/hjk_D5403192.png'] WHERE sku = 'D5403192' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- FLUTE CHAMPAGNE ORANGE DORE 橙底上金渐变/L16
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838473/neoserv/products/hjk_K46687.png'] WHERE sku = 'K46687' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Poêle à steak 5404068
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838475/neoserv/products/hjk_2407769.png'] WHERE sku = '2407769' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Eponge en fer
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838476/neoserv/products/hjk_D5404333.png'] WHERE sku = 'D5404333' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Laine d''acier 5G 6 pièces
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838477/neoserv/products/hjk_150309.png'] WHERE sku = '150309' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- FLUTE CHAMPAGNE CHROME ROSE DORE 3057粉红底上金渐变
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838477/neoserv/products/hjk_K46683.png'] WHERE sku = 'K46683' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- VERRE A VIN CHROME ORANGE DORE 3057橙底上金渐变
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838478/neoserv/products/hjk_K46682.png'] WHERE sku = 'K46682' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- VERRE A VIN CHROME VIOLET DORE 3057紫底上金渐变
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838479/neoserv/products/hjk_K46681.png'] WHERE sku = 'K46681' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Marteau de maçonnerie manche bois 2KG
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838480/neoserv/products/hjk_8103207.png'] WHERE sku = '8103207' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Niveau magnétique d''aluminium 50CM
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838481/neoserv/products/hjk_8103972.png'] WHERE sku = '8103972' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Niveau aluminium 80CM
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838482/neoserv/products/hjk_8103974.png'] WHERE sku = '8103974' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- guirlande en Pile 20L/2M BLANC
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838484/neoserv/products/hjk_K42755.png'] WHERE sku = 'K42755' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- guirlande en Pile 20L/2M BLEU
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838485/neoserv/products/hjk_K42755BLEU.png'] WHERE sku = 'K42755BLEU' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- guirlande en Pile 20L/2M MULTI COULEUR
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838486/neoserv/products/hjk_K42755M.png'] WHERE sku = 'K42755M' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- VERRE A VIN CHROME TURQUOISE 3057全浅蓝
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838487/neoserv/products/hjk_K46700.png'] WHERE sku = 'K46700' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- VERRE A VIN  330ML
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838488/neoserv/products/hjk_K46668.png'] WHERE sku = 'K46668' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- VERRE A VIN CHROME  GRIS 3057烟灰
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838488/neoserv/products/hjk_K46675.png'] WHERE sku = 'K46675' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- VERRE A VIN CHROME TURQUOISE 3057深蓝
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838489/neoserv/products/hjk_K46677.png'] WHERE sku = 'K46677' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- VERRE A VIN CHROME NOIR 3057全黑
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838490/neoserv/products/hjk_K46673.png'] WHERE sku = 'K46673' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- FLUTE CHAMPAGNE BLEU DORE 蓝底上金渐变/L16
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838491/neoserv/products/hjk_K46685.png'] WHERE sku = 'K46685' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- VERRE A VIN CHROME DORE TURQUOISE 3057浅蓝金渐变
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838491/neoserv/products/hjk_K46699.png'] WHERE sku = 'K46699' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- VERRE A VIN CHROME ROUGE 3057全红
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838492/neoserv/products/hjk_K46671.png'] WHERE sku = 'K46671' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- FLUTE CHAMPAGNE VIOLET DORE 紫底上金渐变/L16
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838493/neoserv/products/hjk_K46686.png'] WHERE sku = 'K46686' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- mini ventilateur  a pile
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838494/neoserv/products/hjk_MB004-1.png'] WHERE sku = 'MB004-1' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- feuilleur couleur 50*70cm 25F beige
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838495/neoserv/products/hjk_MU072-23.png'] WHERE sku = 'MU072-23' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- feuilleur couleur 50*70cm 25F vert
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838495/neoserv/products/hjk_MU072-24.png'] WHERE sku = 'MU072-24' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- correcteur 20ml
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838496/neoserv/products/hjk_MK007-1.png'] WHERE sku = 'MK007-1' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- symboles de numéro magnétique 37pcs
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838497/neoserv/products/hjk_MA040-3.png'] WHERE sku = 'MA040-3' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- gants de douche 18*21cm
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838498/neoserv/products/hjk_51094.png'] WHERE sku = '51094' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- sac a dos
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838499/neoserv/products/hjk_K42445.png'] WHERE sku = 'K42445' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- pochette de telephone etanche 5.5
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838500/neoserv/products/hjk_8904288.png'] WHERE sku = '8904288' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Masseur de tête BY-333-8
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838501/neoserv/products/hjk_K43819.png'] WHERE sku = 'K43819' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- kit balai de table 388A-3913
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838501/neoserv/products/hjk_K45855.png'] WHERE sku = 'K45855' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- lot de 4 correcteur 6ml
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838502/neoserv/products/hjk_MK042-2.png'] WHERE sku = 'MK042-2' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- lot de 12 crayons
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838503/neoserv/products/hjk_MC050-18.png'] WHERE sku = 'MC050-18' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Robinet de douche double trou
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838504/neoserv/products/hjk_8402505.png'] WHERE sku = '8402505' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- marteau en caoutchouc noir 600G
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838505/neoserv/products/hjk_8103136.png'] WHERE sku = '8103136' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Hache forgée avec manche en bois 600G
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838508/neoserv/products/hjk_8103217.png'] WHERE sku = '8103217' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Hache forgée avec manche en bois 800G
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838508/neoserv/products/hjk_8103218.png'] WHERE sku = '8103218' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- tuyau antidéflagrant 30mm
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838509/neoserv/products/hjk_03811.png'] WHERE sku = '03811' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- tuyau antidéflagrant 40mm
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838510/neoserv/products/hjk_03812.png'] WHERE sku = '03812' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Niveau magnétique  d''aluminium 60CM
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838511/neoserv/products/hjk_8103973.png'] WHERE sku = '8103973' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- set 2 brosse pour nettoy visage
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838511/neoserv/products/hjk_K46792.png'] WHERE sku = 'K46792' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- boule de laine mélangées  20g
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838512/neoserv/products/hjk_K45580.png'] WHERE sku = 'K45580' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- sac a dos
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838513/neoserv/products/hjk_K42449.png'] WHERE sku = 'K42449' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- batonnet
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838514/neoserv/products/hjk_ME017.png'] WHERE sku = 'ME017' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Sachet alimentaire en papier 100g 8*13cm 10cps orange
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838515/neoserv/products/hjk_ME143-9.png'] WHERE sku = 'ME143-9' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Trombone Zèbre 50mm 20pcs
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838515/neoserv/products/hjk_MA002-9.png'] WHERE sku = 'MA002-9' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- stylo bleu 0.7mm
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838516/neoserv/products/hjk_MC111-10.png'] WHERE sku = 'MC111-10' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Sac alimentaire en papier 100g 8*13cm 10cps fruit vert
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838517/neoserv/products/hjk_ME143-10.png'] WHERE sku = 'ME143-10' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Sac alimentaire en papier 100g 8*13cm 10cps bleu ciel
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838518/neoserv/products/hjk_ME143-8.png'] WHERE sku = 'ME143-8' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- set 12 crayon couleur
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838518/neoserv/products/hjk_MC148-1.png'] WHERE sku = 'MC148-1' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- set 12 crayon couleur
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838519/neoserv/products/hjk_MC096-1.png'] WHERE sku = 'MC096-1' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- boite de correcteur 20ml 12 pcs
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838520/neoserv/products/hjk_MK065-3.png'] WHERE sku = 'MK065-3' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- taie crayon 4cm
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838521/neoserv/products/hjk_MK082-6.png'] WHERE sku = 'MK082-6' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- BOULE LIEGE de 18mm 4pcs
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838522/neoserv/products/hjk_MA017-5.png'] WHERE sku = 'MA017-5' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- porte-clés 2pcs 0006-90
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838523/neoserv/products/hjk_MA015-3.png'] WHERE sku = 'MA015-3' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- épingle en argent 50mm 20pcs 0006-42   4#
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838524/neoserv/products/hjk_MA005-6.png'] WHERE sku = 'MA005-6' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- sac a dos 400D
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838525/neoserv/products/hjk_MX028-3.png'] WHERE sku = 'MX028-3' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- table d''impression à   bleue 2621-2
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838526/neoserv/products/hjk_MI035-2.png'] WHERE sku = 'MI035-2' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- broche dorée 22mm 80pcs 0006-43   00#
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838526/neoserv/products/hjk_MA005-7.png'] WHERE sku = 'MA005-7' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- GILLETTE LAMES 5PCS 7 O CLOCK - SHARPEDGE
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838527/neoserv/products/hjk_316259.png'] WHERE sku = '316259' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Assiettes carrées fibres naturelles 20cm X25PCS
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838528/neoserv/products/hjk_990021.png'] WHERE sku = '990021' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- gobelets Reutilisable 200cc Blancs x100PCS
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838531/neoserv/products/hjk_218036.png'] WHERE sku = '218036' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- gobelets Reutilisable 200cc Blancs x50PCS
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838532/neoserv/products/hjk_K48400.png'] WHERE sku = 'K48400' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- CUILLÈRE A CAFE réutilisable en plastique X50 PCS
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838533/neoserv/products/hjk_K42707.png'] WHERE sku = 'K42707' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- GOBELET CAFE REUTILISABLE 90ML /3OZ*50PCS BLANC
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838533/neoserv/products/hjk_K46051.png'] WHERE sku = 'K46051' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Fourchettes 19.9cm dore réutilisable en pvc x12pcs
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838535/neoserv/products/hjk_K42673.png'] WHERE sku = 'K42673' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- GOBELETS EN CARTONS CAFE 4OZ X50PCS
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838538/neoserv/products/hjk_K45914.png'] WHERE sku = 'K45914' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- GOBELET CAFE REUTILISABLE 90ML /3OZ *50PCS TRANSP
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838539/neoserv/products/hjk_K46050.png'] WHERE sku = 'K46050' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- GOBELET RPET 30/40 CL AVEC COUVERCLE X 20PCS 600ML
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838540/neoserv/products/hjk_K43591.png'] WHERE sku = 'K43591' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- GOBELET REUTILISABLE 500ML *50PCS TRANSPARENT
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838541/neoserv/products/hjk_K46046.png'] WHERE sku = 'K46046' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- tasse a cafe reutisable 200ml x 12pcs blanc
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838542/neoserv/products/hjk_K47024.png'] WHERE sku = 'K47024' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- PLATEAU REPAS A 5C EN BAGASSE DE CANNE A SUCRE 26,5X21,5CM X50PCS
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838547/neoserv/products/hjk_90052.png'] WHERE sku = '90052' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- assiette plat reutilisable 26cm x25pcs
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838548/neoserv/products/hjk_K46940.png'] WHERE sku = 'K46940' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- GOBELETS EN CARTONS CAFE 6OZ X50PCS
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838548/neoserv/products/hjk_K45915.png'] WHERE sku = 'K45915' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- GOBELET REUTILISABLE 500ML *25PCS BLANC
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838549/neoserv/products/hjk_K46049.png'] WHERE sku = 'K46049' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- assiette plat reutilisable 26cm x50pcs
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838550/neoserv/products/hjk_K47023.png'] WHERE sku = 'K47023' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- CUILLÈRE 19.8cm Rouge réutilisable en pvc x12pcs
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838551/neoserv/products/hjk_K42677.png'] WHERE sku = 'K42677' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Couteau 21,7cm Rouge réutilisable en pvc x12pcs
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838552/neoserv/products/hjk_K42675.png'] WHERE sku = 'K42675' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- Fourchettes 19.9cm Rouge réutilisable en pvc x12pcs
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838553/neoserv/products/hjk_K42676.png'] WHERE sku = 'K42676' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- mini fourchettes 9.8cm transparent reutilisable x50pcs
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838554/neoserv/products/hjk_K42708.png'] WHERE sku = 'K42708' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- FLUTE A CHAMPAGNE REUTILISABLE *6 JAUNE
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838555/neoserv/products/hjk_K41839.png'] WHERE sku = 'K41839' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- COUTEAU  REUTILISABLE *12 ROUGE
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838556/neoserv/products/hjk_K41836.png'] WHERE sku = 'K41836' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- BROSSE DE NETTOYAGE
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838557/neoserv/products/hjk_13459.png'] WHERE sku = '13459' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- BROSSE DE NETTOYAGE
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838558/neoserv/products/hjk_D130053.png'] WHERE sku = 'D130053' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- CASQUE D''ÉCOUTE Bluetooth
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838560/neoserv/products/hjk_Ez-067.png'] WHERE sku = 'Ez-067' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- CASQUE D''ÉCOUTE Bluetooth
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838561/neoserv/products/hjk_EZ-076.png'] WHERE sku = 'EZ-076' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- BOUGIE LED AVEC PILE  FROME SAPIN
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838561/neoserv/products/hjk_K479672.png'] WHERE sku = 'K479672' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- ARBRE NOEL SYNTHETIQUE
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838562/neoserv/products/hjk_K48312.png'] WHERE sku = 'K48312' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- COURONNE NOEL SYNTHETIQUE
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838563/neoserv/products/hjk_K48310.png'] WHERE sku = 'K48310' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');
-- GUIRLANDE SYNTHETIQUE 2M
UPDATE "Product" SET images = ARRAY['https://res.cloudinary.com/dcckh4zyh/image/upload/v1773838564/neoserv/products/hjk_K48302.png'] WHERE sku = 'K48302' AND (images IS NULL OR images = '{}' OR images[1] LIKE 'data:%');

COMMIT;

-- Total: 655 produits