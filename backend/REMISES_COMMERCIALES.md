# Système de Remises Commerciales

## Vue d'ensemble

Les commerciaux peuvent maintenant appliquer des remises personnalisées aux clients qu'ils créent ou gèrent. Ce système permet un suivi complet des remises avec validation, historique et traçabilité.

## Nouveaux Champs Client

### Champs de remise disponibles

| Champ | Type | Description |
|-------|------|-------------|
| `discountRate` | Float | Taux de remise (ex: 10 pour 10% ou 50 pour 50€) |
| `discountType` | String | Type de remise: "PERCENTAGE" ou "FIXED" |
| `discountReason` | String | Raison de la remise (optionnel) |
| `discountValidFrom` | DateTime | Date de début de validité (optionnel) |
| `discountValidTo` | DateTime | Date de fin de validité (optionnel) |
| `discountAppliedBy` | String | ID du commercial (rempli automatiquement) |

## API - Création de Client avec Remise

### Endpoint
```
POST /api/customers
Authorization: Bearer {token}
```

### Exemple de requête

```json
{
  "firstName": "Jean",
  "lastName": "Dupont",
  "email": "jean.dupont@example.com",
  "phone": "+33612345678",
  "companyName": "Entreprise ABC",
  "discountRate": 10,
  "discountType": "PERCENTAGE",
  "discountReason": "Client fidèle - volume d'achat élevé",
  "discountValidFrom": "2025-01-01T00:00:00.000Z",
  "discountValidTo": "2025-12-31T23:59:59.999Z"
}
```

### Exemple de remise fixe

```json
{
  "firstName": "Marie",
  "lastName": "Martin",
  "email": "marie.martin@example.com",
  "phone": "+33687654321",
  "companyName": "Société XYZ",
  "discountRate": 50,
  "discountType": "FIXED",
  "discountReason": "Promotion nouveau client"
}
```

## API - Modification de Remise

### Endpoint
```
PATCH /api/customers/:id
Authorization: Bearer {token}
```

### Ajouter/Modifier une remise

```json
{
  "discountRate": 15,
  "discountType": "PERCENTAGE",
  "discountReason": "Augmentation de la remise pour fidélisation"
}
```

### Supprimer une remise

```json
{
  "discountRate": 0,
  "discountReason": null,
  "discountValidFrom": null,
  "discountValidTo": null
}
```

## Règles de Validation

### Taux de remise
- ✅ Pour `PERCENTAGE`: doit être entre 0 et 100
- ✅ Pour `FIXED`: doit être supérieur ou égal à 0
- ❌ Ne peut pas être négatif

### Dates de validité
- ✅ `discountValidFrom` doit être antérieure à `discountValidTo`
- ❌ Erreur si les dates sont inversées

### Traçabilité
- Le champ `discountAppliedBy` est automatiquement rempli avec l'ID de l'utilisateur connecté
- Impossible de modifier ce champ manuellement

## Logging des Activités

Toutes les actions sur les remises sont enregistrées dans les activités:

### Lors de la création d'un client avec remise

```
Type: CUSTOMER_CREATED
Description: "Nouveau client créé: Entreprise ABC"

Type: CUSTOMER_UPDATED
Description: "Remise de 10% appliquée - Raison: Client fidèle"
```

### Lors de la modification d'une remise

```
Type: CUSTOMER_UPDATED
Description: "Remise modifiée: 15% - Raison: Augmentation fidélisation"
```

### Lors de la suppression d'une remise

```
Type: CUSTOMER_UPDATED
Description: "Remise supprimée"
```

## Permissions

- **COMMERCIAL**: Peut appliquer des remises uniquement aux clients qu'il gère
- **ADMIN**: Peut appliquer des remises à tous les clients

## Exemples d'utilisation

### 1. Client VIP avec remise de 20%

```bash
curl -X POST https://neocom-backend.onrender.com/api/customers \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Pierre",
    "lastName": "Durand",
    "email": "pierre@vip.com",
    "phone": "+33600000000",
    "companyName": "VIP Corp",
    "discountRate": 20,
    "discountType": "PERCENTAGE",
    "discountReason": "Client VIP - contrat annuel"
  }'
```

### 2. Promotion temporaire de 100€

```bash
curl -X POST https://neocom-backend.onrender.com/api/customers \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Sophie",
    "lastName": "Bernard",
    "email": "sophie@promo.com",
    "phone": "+33611111111",
    "companyName": "Promo SARL",
    "discountRate": 100,
    "discountType": "FIXED",
    "discountReason": "Promotion lancement",
    "discountValidFrom": "2025-01-01T00:00:00.000Z",
    "discountValidTo": "2025-01-31T23:59:59.999Z"
  }'
```

### 3. Modifier une remise existante

```bash
curl -X PATCH https://neocom-backend.onrender.com/api/customers/CUSTOMER_ID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "discountRate": 25,
    "discountReason": "Remise augmentée suite à gros volume"
  }'
```

## Tests Unitaires Recommandés

```javascript
// Test 1: Création avec remise valide
test('devrait créer un client avec remise de 10%', async () => {
  const response = await request(app)
    .post('/api/customers')
    .set('Authorization', `Bearer ${token}`)
    .send({
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      discountRate: 10,
      discountType: 'PERCENTAGE'
    });

  expect(response.status).toBe(201);
  expect(response.body.customer.discountRate).toBe(10);
  expect(response.body.customer.discountAppliedBy).toBe(userId);
});

// Test 2: Validation du taux de remise
test('devrait rejeter une remise > 100%', async () => {
  const response = await request(app)
    .post('/api/customers')
    .set('Authorization', `Bearer ${token}`)
    .send({
      firstName: 'Test',
      lastName: 'User',
      email: 'test2@example.com',
      discountRate: 150,
      discountType: 'PERCENTAGE'
    });

  expect(response.status).toBe(400);
  expect(response.body.message).toContain('entre 0 et 100');
});

// Test 3: Validation des dates
test('devrait rejeter des dates invalides', async () => {
  const response = await request(app)
    .post('/api/customers')
    .set('Authorization', `Bearer ${token}`)
    .send({
      firstName: 'Test',
      lastName: 'User',
      email: 'test3@example.com',
      discountRate: 10,
      discountType: 'PERCENTAGE',
      discountValidFrom: '2025-12-31',
      discountValidTo: '2025-01-01'
    });

  expect(response.status).toBe(400);
  expect(response.body.message).toContain('antérieure');
});
```

## Prochaines Étapes

1. ✅ Backend: Système de remises implémenté
2. 🔄 Frontend: Interface UI pour gérer les remises
3. 📱 Mobile: Affichage des remises dans l'app mobile
4. 📊 Statistiques: Dashboard des remises appliquées
5. 🔔 Notifications: Alertes pour remises expirées

## Support

Pour toute question ou problème, contactez l'équipe technique.
