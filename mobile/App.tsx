import React, { useState, useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, AppStateStatus } from 'react-native';

// Import screens
import LoginScreen from './screens/LoginScreen';
import DashboardScreen from './screens/DashboardScreen';
import OrdersScreen from './screens/OrdersScreen';
import OrderDetailScreen from './screens/OrderDetailScreen';
import ScannerScreen from './screens/ScannerScreen';
import CustomerVisitScreen from './screens/CustomerVisitScreen';
import CustomersScreen from './screens/CustomersScreen';
import GPSTrackingScreen from './screens/GPSTrackingScreen';
import DocumentsScreen from './screens/DocumentsScreen';
import ProductsScreen from './screens/ProductsScreen';
import ProductDetailScreen from './screens/ProductDetailScreen';
import ProductSelectionScreen from './screens/ProductSelectionScreen';
import CustomerSelectionScreen from './screens/CustomerSelectionScreen';
import QuotesScreen from './screens/QuotesScreen';
import InvoicesScreen from './screens/InvoicesScreen';
import DeliveryNotesScreen from './screens/DeliveryNotesScreen';
import CreditNotesScreen from './screens/CreditNotesScreen';
import QuoteDetailScreen from './screens/QuoteDetailScreen';
import InvoiceDetailScreen from './screens/InvoiceDetailScreen';
import DeliveryNoteDetailScreen from './screens/DeliveryNoteDetailScreen';
import CreateQuoteScreen from './screens/CreateQuoteScreen';
import CreateInvoiceScreen from './screens/CreateInvoiceScreen';
import CreateCustomerScreen from './screens/CreateCustomerScreen';
import CustomerDetailScreen from './screens/CustomerDetailScreen';
import PaymentScreen from './screens/PaymentScreen';
import TripHistoryScreen from './screens/TripHistoryScreen';
// Customer screens
import ShopHomeScreen from './screens/ShopHomeScreen';
import MyInvoicesScreen from './screens/MyInvoicesScreen';
import ShopProductDetailScreen from './screens/ShopProductDetailScreen';
import ShopCategoryScreen from './screens/ShopCategoryScreen';
import ShopAllProductsScreen from './screens/ShopAllProductsScreen';
import ShopAllCategoriesScreen from './screens/ShopAllCategoriesScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Bottom Tab Navigator for Commercial users
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: any;

          if (route.name === 'DashboardTab') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'CustomersTab') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'OrdersTab') {
            iconName = focused ? 'cart' : 'cart-outline';
          } else if (route.name === 'TrackingTab') {
            iconName = focused ? 'navigate' : 'navigate-outline';
          } else if (route.name === 'DocumentsTab') {
            iconName = focused ? 'document-text' : 'document-text-outline';
          } else if (route.name === 'ShopTab') {
            iconName = focused ? 'storefront' : 'storefront-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
        headerStyle: {
          backgroundColor: '#007AFF',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen
        name="DashboardTab"
        component={DashboardScreen}
        options={{
          title: 'Accueil',
          headerTitle: 'NEOSERV Mobile',
        }}
      />
      <Tab.Screen
        name="CustomersTab"
        component={CustomersScreen}
        options={{
          title: 'Clients',
          headerTitle: 'Mes Clients',
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="OrdersTab"
        component={OrdersScreen}
        options={{
          title: 'Commandes',
          headerTitle: 'Mes Commandes',
        }}
      />
      <Tab.Screen
        name="TrackingTab"
        component={GPSTrackingScreen}
        options={{
          title: 'Trajet',
          headerTitle: 'Mon Trajet',
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="DocumentsTab"
        component={DocumentsScreen}
        options={{
          title: 'Documents',
          headerTitle: 'Documents commerciaux',
        }}
      />
      <Tab.Screen
        name="ShopTab"
        component={ShopHomeScreen}
        options={{
          title: 'Boutique',
          headerTitle: 'Boutique NeoServ',
          headerShown: false,
        }}
      />
    </Tab.Navigator>
  );
}

// Bottom Tab Navigator for Customer users (Lambda users)
function CustomerTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: any;

          if (route.name === 'ShopTab') {
            iconName = focused ? 'storefront' : 'storefront-outline';
          } else if (route.name === 'MyInvoicesTab') {
            iconName = focused ? 'receipt' : 'receipt-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#34C759',
        tabBarInactiveTintColor: 'gray',
        headerStyle: {
          backgroundColor: '#34C759',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen
        name="ShopTab"
        component={ShopHomeScreen}
        options={{
          title: 'Boutique',
          headerTitle: 'Boutique NeoServ',
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="MyInvoicesTab"
        component={MyInvoicesScreen}
        options={{
          title: 'Mes Factures',
          headerTitle: 'Mes Factures',
          headerShown: false,
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigationRef = useRef<any>(null);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const role = await AsyncStorage.getItem('userRole');
      const newAuthState = !!token;

      // Si l'utilisateur était authentifié mais le token n'existe plus
      if (isAuthenticated && !newAuthState) {
        console.log('Token expiré détecté - redirection vers login');
        setIsAuthenticated(false);
        setUserRole(null);

        // Rediriger vers l'écran de connexion si possible
        if (navigationRef.current) {
          navigationRef.current.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });
        }
      } else {
        setIsAuthenticated(newAuthState);
        setUserRole(role);
      }
    } catch (error) {
      console.error('Error checking auth:', error);
    } finally {
      setLoading(false);
    }
  };

  // Vérifier le token quand l'app revient au premier plan
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        console.log('App est revenue au premier plan - vérification du token');
        checkAuth();
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [isAuthenticated]);

  // Vérification périodique du token toutes les 30 secondes quand l'app est active
  useEffect(() => {
    const interval = setInterval(() => {
      if (appState.current === 'active') {
        checkAuth();
      }
    }, 30000); // 30 secondes

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  if (loading) {
    return null; // You can add a loading screen here
  }

  // Déterminer quel Tab Navigator utiliser selon le rôle
  const TabNavigator = userRole === 'CUSTOMER' ? CustomerTabs : MainTabs;

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        initialRouteName={isAuthenticated ? 'Main' : 'Login'}
        screenOptions={{
          headerStyle: {
            backgroundColor: '#007AFF',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Main"
          component={TabNavigator}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="OrderDetail"
          component={OrderDetailScreen}
          options={{ title: 'Détail commande' }}
        />
        <Stack.Screen
          name="Scanner"
          component={ScannerScreen}
          options={{ title: 'Scanner QR Code' }}
        />
        <Stack.Screen
          name="CustomerVisit"
          component={CustomerVisitScreen}
          options={{ title: 'Visite client' }}
        />
        <Stack.Screen
          name="Products"
          component={ProductsScreen}
          options={{ title: 'Produits' }}
        />
        <Stack.Screen
          name="ProductDetail"
          component={ProductDetailScreen}
          options={{ title: 'Détail produit' }}
        />
        <Stack.Screen
          name="ProductSelection"
          component={ProductSelectionScreen}
          options={{ title: 'Sélection de produits' }}
        />
        <Stack.Screen
          name="CustomerSelection"
          component={CustomerSelectionScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Quotes"
          component={QuotesScreen}
          options={{ title: 'Devis' }}
        />
        <Stack.Screen
          name="Invoices"
          component={InvoicesScreen}
          options={{ title: 'Factures' }}
        />
        <Stack.Screen
          name="DeliveryNotes"
          component={DeliveryNotesScreen}
          options={{ title: 'Bons de livraison' }}
        />
        <Stack.Screen
          name="CreditNotes"
          component={CreditNotesScreen}
          options={{ title: 'Avoirs' }}
        />
        <Stack.Screen
          name="QuoteDetail"
          component={QuoteDetailScreen}
          options={{ title: 'Détail devis' }}
        />
        <Stack.Screen
          name="InvoiceDetail"
          component={InvoiceDetailScreen}
          options={{ title: 'Détail facture' }}
        />
        <Stack.Screen
          name="DeliveryNoteDetail"
          component={DeliveryNoteDetailScreen}
          options={{ title: 'Détail bon de livraison' }}
        />
        <Stack.Screen
          name="CreateQuote"
          component={CreateQuoteScreen}
          options={{ title: 'Créer un devis', headerShown: false }}
        />
        <Stack.Screen
          name="CreateInvoice"
          component={CreateInvoiceScreen}
          options={{ title: 'Créer une facture', headerShown: false }}
        />
        <Stack.Screen
          name="CreateCustomer"
          component={CreateCustomerScreen}
          options={{ title: 'Nouveau client', headerShown: false }}
        />
        <Stack.Screen
          name="CustomerDetail"
          component={CustomerDetailScreen}
          options={{ title: 'Détail client', headerShown: false }}
        />
        <Stack.Screen
          name="Payment"
          component={PaymentScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="TripHistory"
          component={TripHistoryScreen}
          options={{ title: 'Historique des trajets', headerShown: false }}
        />
        <Stack.Screen
          name="ShopProductDetail"
          component={ShopProductDetailScreen}
          options={{ title: 'Détail produit' }}
        />
        <Stack.Screen
          name="ShopCategory"
          component={ShopCategoryScreen}
          options={{ title: 'Catégorie' }}
        />
        <Stack.Screen
          name="ShopAllProducts"
          component={ShopAllProductsScreen}
          options={{ title: 'Tous les produits', headerShown: false }}
        />
        <Stack.Screen
          name="ShopAllCategories"
          component={ShopAllCategoriesScreen}
          options={{ title: 'Toutes les catégories', headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
