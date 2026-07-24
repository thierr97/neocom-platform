#!/usr/bin/env python3
"""
Script d'import des images HJK:
1. Extrait les images du Excel
2. Les uploade sur Cloudinary
3. Génère un script SQL pour la mise à jour de la base de production
Usage: python3 scripts/import_hjk_images.py
"""

import zipfile
import xml.etree.ElementTree as ET
import json
import os
import sys
import time
import cloudinary
import cloudinary.uploader

# ─── CONFIG ─────────────────────────────────────────────────────────────
EXCEL_PATH = '/Users/thierrycyrillefrancillette/Downloads/HJK - NOUVEAU PRODUITS  2.xlsx'
OUTPUT_SQL  = '/Users/thierrycyrillefrancillette/neoserv-platform/backend/scripts/update_hjk_images.sql'
OUTPUT_JSON = '/Users/thierrycyrillefrancillette/neoserv-platform/backend/scripts/hjk_images_mapping.json'

CLOUDINARY_CLOUD_NAME = 'dcckh4zyh'
CLOUDINARY_API_KEY    = '969449756617922'
CLOUDINARY_API_SECRET = 'UahSWpcv1PS_Pw_CIWqNQR-qdQg'

cloudinary.config(
    cloud_name=CLOUDINARY_CLOUD_NAME,
    api_key=CLOUDINARY_API_KEY,
    api_secret=CLOUDINARY_API_SECRET,
)

NS_XDR = 'http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing'
NS_A   = 'http://schemas.openxmlformats.org/drawingml/2006/main'
NS_R   = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'
NS_PKG = 'http://schemas.openxmlformats.org/package/2006/relationships'
NS_SML = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'

# ─── STEP 1: Parse Excel ─────────────────────────────────────────────────
print('📂 Lecture du fichier Excel...')

with zipfile.ZipFile(EXCEL_PATH) as z:
    # Shared strings
    with z.open('xl/sharedStrings.xml') as f:
        stree = ET.parse(f)
    strings = []
    for si in stree.findall('.//{%s}si' % NS_SML):
        t_nodes = si.findall('.//{%s}t' % NS_SML)
        strings.append(''.join(t.text or '' for t in t_nodes))

    # Sheet data
    with z.open('xl/worksheets/sheet1.xml') as f:
        wtree = ET.parse(f)

    rows_data = {}
    for row in wtree.findall('.//{%s}row' % NS_SML):
        row_idx = int(row.get('r', 0)) - 1  # 0-indexed
        cols = {}
        for c in row.findall('{%s}c' % NS_SML):
            ref = c.get('r', '')
            col = ''.join(ch for ch in ref if ch.isalpha())
            t = c.get('t', '')
            v = c.find('{%s}v' % NS_SML)
            val = ''
            if v is not None and v.text:
                if t == 's':
                    val = strings[int(v.text)]
                else:
                    val = v.text
            cols[col] = val
        rows_data[row_idx] = cols

    # Drawing rels: rId -> image path
    with z.open('xl/drawings/_rels/drawing1.xml.rels') as f:
        rtree = ET.parse(f)
    rid_to_file = {}
    for rel in rtree.findall('.//{%s}Relationship' % NS_PKG):
        target = rel.get('Target', '').replace('../', 'xl/')
        rid_to_file[rel.get('Id')] = target

    # Drawing: row -> rId
    with z.open('xl/drawings/drawing1.xml') as f:
        dtree = ET.parse(f)

    row_to_rid = {}
    for tag in ['twoCellAnchor', 'oneCellAnchor']:
        for anchor in dtree.findall('.//{%s}%s' % (NS_XDR, tag)):
            from_el = anchor.find('{%s}from' % NS_XDR)
            if from_el is None:
                continue
            row_el = from_el.find('{%s}row' % NS_XDR)
            if row_el is None:
                continue
            row_idx = int(row_el.text)
            blip = anchor.find('.//{%s}blip' % NS_A)
            if blip is not None:
                rid = blip.get('{%s}embed' % NS_R)
                if row_idx not in row_to_rid:
                    row_to_rid[row_idx] = rid

    # Build product list
    excel_products = {}
    for row_idx, cols in rows_data.items():
        if row_idx == 0:  # Header
            continue
        sku = cols.get('A', '').strip()
        barcode = cols.get('B', '').strip()
        name = (cols.get('D', '') or cols.get('E', '')).strip()
        if not sku and not name:
            continue
        image_file = None
        if row_idx in row_to_rid:
            rid = row_to_rid[row_idx]
            image_file = rid_to_file.get(rid)
        excel_products[row_idx] = {
            'sku': sku,
            'barcode': barcode,
            'name': name,
            'image_file': image_file,
        }

print(f'✅ {len(excel_products)} produits lus dans Excel')
with_images = sum(1 for p in excel_products.values() if p['image_file'])
print(f'   Dont {with_images} avec image')

# ─── STEP 2: Upload images vers Cloudinary ───────────────────────────────
print('\n🖼️  Upload des images vers Cloudinary...')
print('   (cela peut prendre plusieurs minutes)\n')

mapping = {}  # sku -> cloudinary_url
errors = 0
uploaded = 0

with zipfile.ZipFile(EXCEL_PATH) as z:
    products_with_images = [(ri, ep) for ri, ep in excel_products.items() if ep['image_file']]
    total = len(products_with_images)

    for i, (row_idx, ep) in enumerate(products_with_images):
        sku = ep['sku']
        name = ep['name']

        if not sku:
            continue

        # Nom unique pour Cloudinary basé sur le SKU
        safe_sku = sku.replace('/', '_').replace(' ', '_').replace('\\', '_')
        public_id = f"neoserv/products/hjk_{safe_sku}"

        # Extraire l'image
        try:
            img_data = z.read(ep['image_file'])
        except KeyError:
            errors += 1
            continue

        # Upload vers Cloudinary
        try:
            result = cloudinary.uploader.upload(
                img_data,
                public_id=public_id,
                overwrite=True,
                resource_type='image',
            )
            url = result['secure_url']
            mapping[sku] = {'url': url, 'name': name}
            uploaded += 1

            if (i + 1) % 10 == 0 or (i + 1) == total:
                print(f'  [{i+1}/{total}] ✅ {name[:40]}')
        except Exception as e:
            print(f'  [{i+1}/{total}] ❌ {name[:40]}: {e}')
            errors += 1

        # Petite pause
        time.sleep(0.2)

print(f'\n✅ {uploaded} images uploadées sur Cloudinary')
print(f'❌ {errors} erreurs')

# Sauvegarder le mapping JSON
with open(OUTPUT_JSON, 'w', encoding='utf-8') as f:
    json.dump(mapping, f, ensure_ascii=False, indent=2)
print(f'\n💾 Mapping sauvegardé: {OUTPUT_JSON}')

# ─── STEP 3: Générer le SQL ───────────────────────────────────────────────
print('\n📝 Génération du script SQL...')

sql_lines = [
    '-- Script de mise à jour des images produits HJK',
    '-- Généré automatiquement - à exécuter sur la base de production Render',
    '-- Dashboard Render > PostgreSQL > Shell > psql',
    '',
    'BEGIN;',
    '',
]

count = 0
for sku, data in mapping.items():
    url = data['url']
    name = data['name'].replace("'", "''")
    sku_escaped = sku.replace("'", "''")

    # Update par SKU (primary) ou par nom (fallback)
    sql_lines.append(f"-- {name}")
    sql_lines.append(
        f"UPDATE \"Product\" SET images = ARRAY['{url}'] "
        f"WHERE sku = '{sku_escaped}' AND (images IS NULL OR images = '{{}}' OR images[1] LIKE 'data:%');"
    )
    count += 1

sql_lines.extend(['', 'COMMIT;', '', f'-- Total: {count} produits'])

with open(OUTPUT_SQL, 'w', encoding='utf-8') as f:
    f.write('\n'.join(sql_lines))

print(f'✅ Script SQL généré: {OUTPUT_SQL}')
print(f'   {count} UPDATE statements')

print(f'\n{"="*60}')
print('PROCHAINE ÉTAPE:')
print('1. Va sur Render > Dashboard > PostgreSQL neoserv')
print('2. Onglet "Shell" ou "Connect"')
print('3. Exécute le contenu du fichier:')
print(f'   {OUTPUT_SQL}')
print('='*60)
