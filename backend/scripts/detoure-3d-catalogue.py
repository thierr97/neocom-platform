"""Détourage 3D du catalogue complet NeoServ.

Pour chaque produit dont images[0] est une photo Cloudinary classique :
télécharge la photo, détoure (rembg/isnet), contrôle qualité, uploade le PNG
transparent dans neoserv/products/3d/ et met à jour la base
(images = [détouré, ...anciennes], thumbnail = détouré).

Reprise automatique : les produits dont images[0] contient /products/3d/
sont considérés comme déjà traités.

Lancement :
  export PROD_DB='postgresql://...render.com/...?sslmode=require'
  export CLOUDINARY_CLOUD_NAME=... CLOUDINARY_API_KEY=... CLOUDINARY_API_SECRET=...
  uv run --python 3.12 --with "rembg[cpu]" --with "numba>=0.59" \
     --with pillow --with cloudinary --with "psycopg[binary]" \
     python scripts/detoure-3d-catalogue.py
"""
import io
import json
import os
import pathlib
import re
import sys
import time
import unicodedata
import urllib.request

import socket

import cloudinary
import cloudinary.uploader
import psycopg

socket.setdefaulttimeout(60)  # aucun appel réseau ne peut bloquer indéfiniment
from PIL import Image
from rembg import remove, new_session

LOG = pathlib.Path(__file__).parent / "detoure-3d-progress.jsonl"
UA = {"User-Agent": "Mozilla/5.0 (NeoServ 3D pipeline)"}
MIN_SUBJECT_RATIO = 0.12  # rejette les détourages qui perdent le sujet

cloudinary.config(
    cloud_name=os.environ["CLOUDINARY_CLOUD_NAME"],
    api_key=os.environ["CLOUDINARY_API_KEY"],
    api_secret=os.environ["CLOUDINARY_API_SECRET"],
)


def slug(sku: str) -> str:
    s = unicodedata.normalize("NFKD", sku).encode("ascii", "ignore").decode()
    return re.sub(r"[^A-Za-z0-9]+", "_", s).strip("_") or "produit"


def log(entry: dict) -> None:
    entry["ts"] = time.strftime("%H:%M:%S")
    with LOG.open("a") as f:
        f.write(json.dumps(entry, ensure_ascii=False) + "\n")


def db_connect():
    conn = psycopg.connect(
        os.environ["PROD_DB"], connect_timeout=15,
        keepalives=1, keepalives_idle=30, keepalives_interval=10, keepalives_count=3,
    )
    conn.autocommit = True
    return conn


def main() -> None:
    session = new_session("isnet-general-use")
    conn = db_connect()
    cur = conn.cursor()

    cur.execute(
        """
        SELECT id, sku, images FROM products
        WHERE cardinality(images) > 0
          AND images[1] LIKE 'https://res.cloudinary.com%%'
          AND images[1] NOT LIKE '%%/products/3d/%%'
        ORDER BY "updatedAt" DESC
        """
    )
    rows = cur.fetchall()
    limit = int(os.environ.get("LIMIT", "0"))
    if limit:
        rows = rows[:limit]
    print(f"produits à traiter : {len(rows)}", flush=True)

    done = fail = skip = 0
    t0 = time.time()
    for i, (pid, sku, images) in enumerate(rows):
        try:
            req = urllib.request.Request(images[0], headers=UA)
            raw = urllib.request.urlopen(req, timeout=30).read()
            im = Image.open(io.BytesIO(raw)).convert("RGBA")
            cut = remove(im, session=session)
            bbox = cut.getbbox()
            if not bbox or (bbox[2] - bbox[0]) * (bbox[3] - bbox[1]) < MIN_SUBJECT_RATIO * im.width * im.height:
                skip += 1
                log({"sku": sku, "status": "skip-qc"})
                continue
            pad = round(max(bbox[2] - bbox[0], bbox[3] - bbox[1]) * 0.04)
            cut = cut.crop((max(0, bbox[0] - pad), max(0, bbox[1] - pad),
                            min(cut.width, bbox[2] + pad), min(cut.height, bbox[3] + pad)))
            cut.thumbnail((700, 700), Image.LANCZOS)
            buf = io.BytesIO()
            cut.save(buf, "PNG", optimize=True)
            buf.seek(0)

            up = cloudinary.uploader.upload(
                buf,
                folder="neoserv/products/3d",
                public_id=slug(sku),
                overwrite=True,
                resource_type="image",
                format="png",
                timeout=60,
            )
            url = up["secure_url"]
            new_images = [url] + [u for u in images if "/products/3d/" not in u]
            try:
                cur.execute(
                    'UPDATE products SET images = %s, thumbnail = %s, "updatedAt" = NOW() WHERE id = %s',
                    (new_images, url, pid),
                )
            except psycopg.OperationalError:
                # connexion perdue (coupure réseau) : on se reconnecte et on rejoue
                conn = db_connect()
                cur = conn.cursor()
                cur.execute(
                    'UPDATE products SET images = %s, thumbnail = %s, "updatedAt" = NOW() WHERE id = %s',
                    (new_images, url, pid),
                )
            done += 1
            log({"sku": sku, "status": "ok", "url": url})
        except KeyboardInterrupt:
            raise
        except Exception as e:  # produit suivant quoi qu'il arrive
            fail += 1
            log({"sku": sku, "status": "error", "err": str(e)[:150]})

        if (i + 1) % 50 == 0:
            rate = (i + 1) / (time.time() - t0)
            eta_h = (len(rows) - i - 1) / rate / 3600 if rate else 0
            print(f"{i+1}/{len(rows)} · ok={done} skip={skip} err={fail} · ETA {eta_h:.1f}h", flush=True)

    print(f"TERMINÉ · ok={done} skip-qc={skip} erreurs={fail} sur {len(rows)}", flush=True)
    conn.close()


if __name__ == "__main__":
    main()
