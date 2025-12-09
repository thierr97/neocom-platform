# Spécifications nouvelle mise en page PDF

Basé sur le document de référence fourni (facture INFINI).

## 📐 Structure globale

### 1. EN-TÊTE (haut de page)
**Position**: Y = 50

#### Gauche (X = 50):
- **Logo NEOSERV** (grand, bold)
- **"GUADELOUPE"** en dessous (petit)

#### Droite (X = 400):
- **Type de document + Numéro**: "Facture FA2512-0118" ou "Devis DE2512-001"
  - Font: Bold, 14pt
- **Date facturation**: "Date facturation : 05/12/2025"
  - Font: Regular, 10pt
- **Date échéance**: "Date échéance : 05/12/2025" (factures uniquement)
  - Font: Regular, 10pt
- **Code client**: "Code client : CL2510-00381"
  - Font: Regular, 10pt

---

### 2. INFORMATIONS ÉMETTEUR ET CLIENT (Y = 140)

#### GAUCHE - Émetteur (X = 50, Width = 230)
**Fond gris clair (#F0F0F0)**
```
Émetteur
──────────────────────────
SAS LES 4 AS /L'INFINI
Route de Montauban
97139 Abymes
Guadeloupe

Tél.: 0690 973710
```

#### DROITE - Client (X = 320, Width = 230)
**Encadré avec bordure noire**
```
Adressé à
──────────────────────────
TEAM CHR
IMP CABES
97139 ABYMES
```

---

### 3. TITRE DE SECTION (Y = 270)
```
LOCATION DU 05/12/2025
```
ou pour les devis:
```
DEVIS VALABLE JUSQU'AU 05/01/2026
```

---

### 4. TABLEAU DES ARTICLES (Y = 300)

**Colonnes** (avec alignement):
| Désignation | TVA | P.U. HT | Qté | Unité | Montants exprimés en Euros | Total HT |
|-------------|-----|---------|-----|-------|----------------------------|----------|

**Largeurs des colonnes**:
- Désignation: 240px
- TVA: 40px (centré)
- P.U. HT: 60px (droite)
- Qté: 30px (centré)
- Unité: 30px (centré)
- [Espace "Montants exprimés en Euros"] (texte en haut à droite du tableau)
- Total HT: 70px (droite)

**Lignes de produits**:
- Background alterné: blanc / gris très clair
- Bordures horizontales fines
- Padding: 8px vertical, 5px horizontal

**Exemple de ligne**:
```
LOCATION D'UN ESPACE | 8,5% | 4 608,30 | 1 | u. | | 4 608,30
```

---

### 5. BAS DE PAGE - PARTIE GAUCHE (Y = après tableau + 20)

#### Conditions de règlement (X = 50)
```
Conditions de règlement: À réception
```

#### Règlement par virement sur le compte bancaire suivant:
```
Code banque | Code guichet | Numéro de compte | Clé
  10107     |    00476     |  00134086952    |  94
```

#### BIC-IBAN (encadré)
```
Code BIC: FRBR 1019 7004 7600 1340 8695 294
Code IBAN: FR26 1010 7004 7600 1340 8695 294
```

#### Mentions légales (petit texte)
```
Nom du propriétaire du compte: LES 4 AS
N° d'identification au registre du commerce: SIRET 901381062000015
NAF-APE: 93.293 - Numéro TVA: FR60901381060

Société par actions simplifiée (SAS) - Capital de 10 000 €
```

---

### 6. BAS DE PAGE - PARTIE DROITE (totaux)

**Position**: Colonne droite alignée à droite (X = 400)

```
Total HT                        4 608,30
Total TVA 8,5% (85)               391,71
Total TTC                       5 000,01
───────────────────────────────────────
Payé                            1 000,00
Reste à payer                   4 000,01
```

**Style**:
- Lignes avec texte à gauche, montant à droite
- Séparateur entre Total TTC et Payé
- "Reste à payer" en **bold**

---

### 7. TABLEAU DES VIREMENTS DÉJÀ EFFECTUÉS (si applicable)

**Position**: En dessous des totaux

```
Virements déjà effectués
───────────────────────────────────────
Référence    Montant      Type     Note
virement
05/12/25     1 000,00     Espèce
```

---

## 🎨 Palette de couleurs

- **Fond émetteur**: #F0F0F0 (gris clair)
- **Bordures**: #000000 (noir)
- **Texte principal**: #000000 (noir)
- **Texte secondaire**: #666666 (gris foncé)
- **Lignes de séparation**: #CCCCCC (gris moyen)

---

## 📝 Polices

- **Titres (Facture, Devis)**: Helvetica-Bold, 14pt
- **Sous-titres (Émetteur, Adressé à)**: Helvetica-Bold, 11pt
- **Texte normal**: Helvetica, 9pt
- **Mentions légales**: Helvetica, 7pt
- **Totaux**: Helvetica-Bold, 10pt

---

## 📊 Dimensions du document

- **Format**: A4 (595 x 842 points)
- **Marges**: 50pt de chaque côté
- **Zone de contenu**: 495pt de largeur

---

## ✅ Éléments importants

1. **TVA Guadeloupe**: 8,5% (pas 20% comme en métropole)
2. **Mentions "Montants exprimés en Euros"** dans l'en-tête du tableau
3. **Conditions de règlement** toujours affichées
4. **RIB complet** avec code banque, code guichet, numéro de compte, clé
5. **BIC-IBAN** avec le préfixe FR26
6. **Mentions légales** complètes en bas

---

## 🔄 Différences Devis vs Facture

### Devis:
- Titre: "Devis DE-XXXX-XXX"
- Pas de date d'échéance
- Ajouter: "Valable jusqu'au: JJ/MM/AAAA"
- Pas de section "Payé" / "Reste à payer"
- Pas de "Virements déjà effectués"

### Facture:
- Titre: "Facture FA-XXXX-XXX"
- Date d'échéance obligatoire
- Section paiements si facture payée partiellement/totalement
- Tableau des virements si paiements effectués
