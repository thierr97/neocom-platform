# Module Sourcing & Dropshipping IA — Guide complet

Ce module transforme NEOSERV en plateforme hybride : stock local **+** dropshipping
automatisé (AliExpress, CJ Dropshipping, Temu, Shein) avec prise d'information et
intégration des produits par IA.

## Ce que fait le module

1. **Import 1 clic** : une URL produit (ou un id AliExpress/CJ) → l'IA extrait les
   données, rédige une fiche française vendeuse + SEO, choisit la catégorie, calcule
   le prix de vente → produit créé en **brouillon masqué**.
2. **File de validation** : l'admin approuve (les images passent sur Cloudinary,
   le produit est publié) ou rejette.
3. **Règles de prix** : marges par plateforme/catégorie, arrondi psychologique (x,90),
   marge minimale surveillée.
4. **Synchronisation** : stock et coût fournisseur rafraîchis automatiquement
   (rupture → produit masqué ; hausse de coût → prix recalculé).
5. **Auto-fulfillment** : commande client payée → commande fournisseur créée
   (API AliExpress/CJ), tracking récupéré automatiquement. Temu/Shein → tâche
   "commande manuelle" listée au back-office.
6. **Assistant client IA** ("Néo") : chatbot boutique 7j/7 — recherche produit,
   suivi de commande (n° + e-mail vérifiés), FAQ livraison/retours, escalade humaine.
7. **Assainissement catalogue** : réécriture + re-catégorisation IA des ~7 500
   fiches existantes, par lots, avec dry-run.

## Mise en route (3 étapes)

### 1. Migration base de données
```bash
cd backend
npx prisma migrate deploy   # applique 20260716000000_add_sourcing_dropshipping_module
npx prisma generate
```
La migration est idempotente (IF NOT EXISTS) — sans risque pour les données existantes.

### 2. Variables d'environnement (Render/Railway → Environment)
Minimum pour démarrer :
```
ANTHROPIC_API_KEY=sk-ant-...        # console.anthropic.com → API Keys
```
Pour tester SANS aucune clé fournisseur :
```
SOURCING_MOCK=1                     # données fournisseur simulées
```
Quand les comptes fournisseurs sont prêts (voir §Obtenir les accès) :
```
ALIEXPRESS_APP_KEY=... ALIEXPRESS_APP_SECRET=... ALIEXPRESS_ACCESS_TOKEN=...
CJ_EMAIL=... CJ_API_KEY=...
```
Activation des automatismes (recommandé après une semaine de tests) :
```
DROPSHIP_SYNC_ENABLED=1             # synchro stock/prix toutes les 6 h
DROPSHIP_FULFILL_ENABLED=1          # détection des commandes payées
DROPSHIP_AUTO_PLACE=1               # ⚠ passe de VRAIES commandes fournisseurs
```

### 3. Widget chatbot sur la boutique
Dans le layout du frontend boutique, ajouter :
```html
<script src="https://VOTRE-BACKEND.onrender.com/api/chatbot/widget.js" defer></script>
```
C'est tout — bulle 💬 en bas à droite, aucune dépendance.

## API back-office (`/api/sourcing`, admin, JWT requis)

| Méthode | Route | Rôle |
|---|---|---|
| GET | `/connectors` | état des connecteurs (clés présentes, auto-commande) |
| POST | `/import` | `{url}` ou `{platform, externalId}` ou `{rawText}` → job IA |
| POST | `/import/bulk` | `{urls: [...]}` (max 100) |
| GET | `/jobs?status=DRAFT` | file d'attente (QUEUED/ANALYZING/DRAFT/APPROVED/REJECTED/FAILED) |
| GET | `/jobs/:id` | détail (proposition IA + produit brouillon) |
| POST | `/jobs/:id/approve` | `{publishNow: true, price?, name?, categoryId?}` → publication |
| POST | `/jobs/:id/reject` | `{reason?}` → supprime le brouillon |
| GET | `/sources` | produits liés à un fournisseur (+ erreurs de synchro) |
| PATCH | `/sources/:id` | `{syncEnabled, costPrice, variantKey}` |
| GET/POST/PUT/DELETE | `/pricing-rules` | règles de marge |
| GET | `/sync/status` · POST `/sync/run` | synchro stock/prix |
| GET | `/supplier-orders?status=MANUAL_REQUIRED` | commandes fournisseurs |
| PATCH | `/supplier-orders/:id` | saisie manuelle n°/tracking (Temu/Shein) |
| POST | `/fulfillment/run` | force un passage auto-fulfillment |
| POST | `/cleanup/start` | `{dryRun: true, maxProducts: 100}` — assainissement IA |
| GET | `/cleanup/status` · POST `/cleanup/stop` | suivi/pause |

API publique chatbot (`/api/chatbot`, rate-limité 20 msg/5 min) :
`POST /message {sessionId, message, email?}` · `POST /feedback {sessionId, rating}` · `GET /widget.js`

## Test rapide (avec SOURCING_MOCK=1)

```bash
TOKEN=$(curl -s -X POST $API/api/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"admin@...","password":"..."}' | jq -r .accessToken)

# Import 1 clic
curl -s -X POST $API/api/sourcing/import -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"url":"https://fr.aliexpress.com/item/1005001234567890.html"}'

# File de validation
curl -s "$API/api/sourcing/jobs?status=DRAFT" -H "Authorization: Bearer $TOKEN"

# Approbation + publication
curl -s -X POST $API/api/sourcing/jobs/JOB_ID/approve -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' -d '{"publishNow":true}'

# Chatbot (public)
curl -s -X POST $API/api/chatbot/message -H 'Content-Type: application/json' \
  -d '{"sessionId":"test-session-123","message":"Avez-vous des bougies ?"}'
```

## Obtenir les accès fournisseurs (seule étape qui vous demande une action)

- **Anthropic (IA)** : https://console.anthropic.com → API Keys. Budget indicatif :
  quelques centimes par produit importé ; assainissement complet du catalogue ≈ 150-500 €.
- **AliExpress** : https://open.aliexpress.com → créer un compte développeur →
  "Create App" (catégorie Dropshipping) → récupérer AppKey/AppSecret → suivre le flux
  d'autorisation OAuth de la console pour obtenir l'ACCESS_TOKEN. Validation
  généralement sous quelques jours.
- **CJ Dropshipping** : compte sur cjdropshipping.com → My CJ → Authorization → API →
  générer la clé. Immédiat et gratuit. Approvisionner le solde CJ pour l'auto-commande.
- **Temu / Shein** : pas d'API publique — le module fonctionne par extraction d'URL
  et commandes manuelles assistées. ⚠ Ne pas réutiliser les photos Shein telles
  quelles (droit d'auteur) : le module n'importe leurs images qu'après votre
  validation explicite dans la file.

## Sécurité & conformité

- Toutes les routes sourcing sont réservées au rôle ADMIN (JWT).
- `DROPSHIP_AUTO_PLACE=0` par défaut : aucune commande fournisseur réelle n'est
  passée sans activation explicite.
- Le chatbot ne répond qu'à partir du catalogue et des politiques NeoServ, exige
  n° de commande + e-mail pour le suivi, ne traite jamais de données bancaires.
- En dropshipping, NEOSERV reste le vendeur responsable (conformité produits,
  rétractation 14 j, garantie légale 2 ans) : mettre à jour les CGV.

## Architecture des fichiers

```
backend/src/
├── services/
│   ├── connectors/
│   │   ├── types.ts                    # interface commune SupplierConnector
│   │   ├── aliexpress.connector.ts     # API officielle (TOP, HMAC-SHA256)
│   │   ├── cj.connector.ts             # API officielle v2 (token 12 h)
│   │   ├── url.connector.ts            # Temu/Shein/autres (extraction page)
│   │   └── index.ts                    # registre + détection plateforme
│   ├── sourcing.service.ts             # pipeline import : acquisition→IA→prix→brouillon
│   ├── dropship-pricing.service.ts     # moteur de règles de prix
│   ├── dropship-sync.service.ts        # cron synchro stock/prix
│   ├── supplier-order.service.ts       # cron auto-fulfillment + tracking
│   ├── chatbot.service.ts              # assistant client (RAG catalogue+commandes)
│   └── catalog-cleanup.service.ts      # assainissement IA du catalogue existant
├── controllers/ sourcing.controller.ts · chatbot.controller.ts (+ widget.js embarqué)
├── routes/      sourcing.routes.ts     · chatbot.routes.ts
└── prisma/migrations/20260716000000_add_sourcing_dropshipping_module/
```
