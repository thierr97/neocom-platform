# NEOSERV Mobile - Application Commerciale

Application mobile React Native (Expo) pour les commerciaux NEOSERV.

## Fonctionnalités

- Authentification commerciale
- Dashboard avec statistiques personnelles
- Scanner QR Code clients
- Suivi des commandes
- Visite clients avec check-in GPS
- Gestion des rendez-vous
- Mode hors-ligne avec synchronisation

## Installation

### Prérequis

- Node.js 18+ installé
- Expo CLI installé globalement: `npm install -g expo-cli`
- **Pour tester sur téléphone:** Application Expo Go installée
  - iOS: https://apps.apple.com/app/expo-go/id982107779
  - Android: https://play.google.com/store/apps/details?id=host.exp.exponent

### Installation des dépendances

```bash
cd /Users/thierrycyrillefrancillette/neoserv-platform/mobile

# Installer les dépendances
npm install

# OU si vous préférez yarn
yarn install
```

## Lancement de l'application

### 1. Sur téléphone/tablette (recommandé pour tester)

```bash
# Démarrer le serveur Expo
npm start

# OU
expo start
```

Un QR Code s'affichera dans le terminal et dans le navigateur.

**Sur iOS (iPhone/iPad):**
1. Ouvrir l'app **Expo Go**
2. Scanner le QR Code avec l'appareil photo
3. L'app se lance automatiquement

**Sur Android:**
1. Ouvrir l'app **Expo Go**
2. Appuyer sur "Scan QR Code"
3. Scanner le QR Code affiché
4. L'app se lance automatiquement

### 2. Sur émulateur

**iOS Simulator (Mac uniquement):**
```bash
npm run ios
```

**Android Emulator:**
```bash
npm run android
```

Assurez-vous qu'Android Studio est installé et qu'un émulateur Android est configuré.

### 3. Sur navigateur (pour développement)

```bash
npm run web
```

Ouvre l'app dans votre navigateur web (fonctionnalités GPS limitées).

## Configuration

### Backend URL

L'application se connecte au backend NEOSERV. Pour changer l'URL:

1. Créer un fichier `.env` à la racine de `mobile/`:

```env
API_URL=https://neocom-backend.onrender.com/api
```

2. Si le fichier n'existe pas, l'app utilise par défaut l'URL de production.

### Comptes de test

Utilisez les identifiants du dashboard:

- **Commercial:** `commercial@neoserv.com` / (mot de passe défini)
- **Admin:** `admin@neoserv.com` / `Admin123!`

## Structure du projet

```
mobile/
├── App.tsx                 # Point d'entrée avec navigation
├── app.json                # Configuration Expo
├── package.json            # Dépendances
├── screens/                # Écrans de l'application
│   ├── LoginScreen.tsx           # Connexion
│   ├── DashboardScreen.tsx       # Accueil commercial
│   ├── CustomerVisitScreen.tsx   # Check-in client
│   ├── ScannerScreen.tsx         # Scanner QR Code
│   ├── OrdersScreen.tsx          # Liste commandes
│   └── OrderDetailScreen.tsx     # Détail commande
├── src/
│   ├── services/           # Services API
│   ├── contexts/           # Contexts React (Auth, etc.)
│   ├── components/         # Composants réutilisables
│   ├── navigation/         # Configuration navigation
│   ├── types/              # Types TypeScript
│   └── utils/              # Utilitaires
└── assets/                 # Images, icônes, fonts
```

## Écrans disponibles

### ✅ LoginScreen
- Connexion avec email/mot de passe
- Stockage sécurisé du token (AsyncStorage)
- Redirection automatique si déjà connecté

### ✅ DashboardScreen
- Vue d'ensemble des stats du commercial
- KPIs: CA, commandes, clients visités
- Accès rapide aux actions (scanner, visites, commandes)

### ✅ ScannerScreen
- Scanner de QR Code client
- Recherche manuelle si le scan échoue
- Redirection vers la fiche client

### ✅ CustomerVisitScreen
- Check-in chez un client avec GPS
- Enregistrement de l'heure d'arrivée
- Notes de visite
- Photos (permission caméra)

### ✅ OrdersScreen
- Liste des commandes du commercial
- Filtres par statut (en cours, payées, etc.)
- Recherche par client ou numéro

### ✅ OrderDetailScreen
- Détails complets d'une commande
- Produits, montants, client
- Actions (télécharger facture, etc.)

## Permissions requises

L'application demande les permissions suivantes:

- **📷 Caméra:** Pour scanner les QR Codes et prendre des photos
- **📍 Localisation:** Pour le check-in GPS chez les clients
- **📁 Stockage:** Pour sauvegarder les photos (Android)

Ces permissions sont demandées au moment où la fonctionnalité est utilisée.

## Développement

### Hot Reload

Expo supporte le Hot Reload. Les modifications du code sont automatiquement reflétées dans l'app sans redémarrage.

- **Secouer le téléphone** (iOS/Android) pour ouvrir le menu développeur
- **Cmd+D** (iOS Simulator) ou **Cmd+M** (Android Emulator)

### Débug

#### Avec Chrome DevTools

```bash
# Démarrer avec débug activé
expo start --dev-client
```

Dans le menu Expo, activer "Debug Remote JS". Chrome DevTools s'ouvre.

#### Avec React Native Debugger

1. Installer: https://github.com/jhen0409/react-native-debugger
2. Lancer l'app
3. Dans le menu Expo, activer "Debug"

### Logs

```bash
# Voir les logs en temps réel
expo start
```

Les logs s'affichent dans le terminal où vous avez lancé `expo start`.

## Build pour production

### Android (APK)

```bash
# Build APK
expo build:android -t apk

# Build AAB (pour Google Play Store)
expo build:android -t app-bundle
```

### iOS (IPA)

```bash
# Nécessite un compte Apple Developer
expo build:ios
```

Le build se fait sur les serveurs d'Expo. Un lien de téléchargement est fourni une fois terminé.

### Configuration EAS Build (recommandé)

Expo Application Services (EAS) est la nouvelle méthode de build:

```bash
# Installer EAS CLI
npm install -g eas-cli

# Se connecter
eas login

# Configurer le projet
eas build:configure

# Lancer un build
eas build --platform android
eas build --platform ios
```

## Publication

### Publication sur Expo

```bash
# Publier une mise à jour Over-The-Air (OTA)
expo publish
```

Les utilisateurs ayant installé l'app via Expo Go recevront automatiquement la mise à jour.

### Publication sur les stores

**Google Play Store (Android):**
1. Créer un compte Google Play Developer ($25 unique)
2. Build AAB: `expo build:android -t app-bundle`
3. Télécharger sur Google Play Console
4. Remplir les informations (description, screenshots, etc.)
5. Soumettre pour révision

**Apple App Store (iOS):**
1. Créer un compte Apple Developer ($99/an)
2. Build IPA: `expo build:ios`
3. Télécharger sur App Store Connect
4. Remplir les informations (description, screenshots, etc.)
5. Soumettre pour révision (durée: 1-3 jours)

## Fonctionnalités à ajouter

### Écrans manquants (à développer)

#### 1. CustomersScreen - Liste des clients
```
- Liste de tous les clients du commercial
- Recherche par nom, email, téléphone
- Filtre par proximité GPS
- Navigation vers la fiche client
```

#### 2. QuoteCreateScreen - Création de devis
```
- Sélection client
- Ajout de produits (recherche + scan)
- Calcul automatique (HT, TVA, TTC)
- Remises et conditions
- Génération PDF
- Envoi par email
```

#### 3. GPSTrackingScreen - Suivi GPS actif
```
- Carte en temps réel avec position
- Trajet du jour
- Distance parcourue
- Visites enregistrées
- Activation/désactivation tracking
```

#### 4. StatsScreen - Statistiques détaillées
```
- CA mensuel/annuel
- Objectifs et progression
- Top clients
- Top produits vendus
- Graphiques
```

#### 5. CheckInScreen - Check-in simplifié
```
- Bouton rapide check-in
- Sélection client
- Position GPS automatique
- Notes rapides
```

#### 6. SettingsScreen - Paramètres
```
- Profil utilisateur
- Préférences GPS
- Notifications
- Déconnexion
```

### Services à créer

#### src/services/api.ts - Client API
```typescript
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'https://neocom-backend.onrender.com/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

#### src/services/gps.service.ts - Service GPS
```typescript
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';

const LOCATION_TASK_NAME = 'background-location-task';

// Demander permission
export async function requestLocationPermission() {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Permission refusée');
  }
  return true;
}

// Obtenir position actuelle
export async function getCurrentLocation() {
  const location = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.High,
  });
  return location.coords;
}

// Tracker en arrière-plan
export async function startLocationTracking() {
  await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
    accuracy: Location.Accuracy.High,
    timeInterval: 10000, // 10 secondes
    distanceInterval: 10, // 10 mètres
  });
}
```

#### src/services/socket.service.ts - WebSocket temps réel
```typescript
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function connectSocket(userId: string) {
  socket = io('https://neocom-backend.onrender.com', {
    auth: { userId },
  });

  socket.on('connect', () => {
    console.log('Socket connecté');
  });

  return socket;
}

export function sendPosition(coords: any) {
  if (socket) {
    socket.emit('position-update', coords);
  }
}
```

### Navigation complète

Ajouter la navigation bottom tabs dans `App.tsx`:

```typescript
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

const Tab = createBottomTabNavigator();

function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator>
        <Tab.Screen
          name="Dashboard"
          component={DashboardScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Clients"
          component={CustomersScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="people" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Commandes"
          component={OrdersScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="list" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Stats"
          component={StatsScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="stats-chart" size={size} color={color} />
            ),
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
```

## Dépendances principales

- **expo:** Framework React Native
- **react-navigation:** Navigation entre écrans
- **expo-location:** Géolocalisation
- **expo-camera:** Caméra et scanner QR
- **axios:** Requêtes HTTP
- **socket.io-client:** WebSocket temps réel
- **react-native-maps:** Cartes interactives
- **@react-native-async-storage/async-storage:** Stockage local

## Troubleshooting

### L'app ne démarre pas

```bash
# Nettoyer le cache
expo start -c

# Réinstaller node_modules
rm -rf node_modules
npm install
```

### Erreur "Metro bundler"

```bash
# Tuer tous les processus Metro
killall -9 node

# Redémarrer
expo start
```

### Permission GPS refusée

1. Aller dans les paramètres du téléphone
2. Applications → Expo Go
3. Permissions → Autoriser la localisation

### Scanner QR Code ne fonctionne pas

1. Vérifier que la permission caméra est accordée
2. Améliorer l'éclairage
3. Essayer la recherche manuelle

### Connexion backend échoue

1. Vérifier que le backend est en ligne: https://neocom-backend.onrender.com/health
2. Vérifier la connexion internet du téléphone
3. Vérifier l'URL dans le code

## Support

- Email: support@neoserv.fr
- Documentation Expo: https://docs.expo.dev/
- React Native: https://reactnative.dev/

## License

Propriétaire - NEOSERV © 2025
