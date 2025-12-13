import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
import QuotesScreen from './screens/QuotesScreen';
import InvoicesScreen from './screens/InvoicesScreen';
import DeliveryNotesScreen from './screens/DeliveryNotesScreen';
import CreditNotesScreen from './screens/CreditNotesScreen';
import QuoteDetailScreen from './screens/QuoteDetailScreen';
import InvoiceDetailScreen from './screens/InvoiceDetailScreen';
import DeliveryNoteDetailScreen from './screens/DeliveryNoteDetailScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Bottom Tab Navigator
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
          title: 'Tracking',
          headerTitle: 'GPS Tracking',
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
    </Tab.Navigator>
  );
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      setIsAuthenticated(!!token);
    } catch (error) {
      console.error('Error checking auth:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return null; // You can add a loading screen here
  }

  return (
    <NavigationContainer>
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
          component={MainTabs}
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
      </Stack.Navigator>
    </NavigationContainer>
  );
}
