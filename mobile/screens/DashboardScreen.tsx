import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API_URL = 'http://localhost:4000/api';

export default function DashboardScreen({ navigation }: any) {
  const [stats, setStats] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const userId = await AsyncStorage.getItem('userId');

      // Load user profile
      const userResponse = await axios.get(`${API_URL}/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (userResponse.data.success) {
        setUser(userResponse.data.data);
      }

      // Load stats (you can add a stats endpoint)
      setStats({
        orders: 24,
        customers: 156,
        todayVisits: 5,
      });
    } catch (error: any) {
      console.error('Error loading dashboard:', error);
      Alert.alert('Erreur', 'Impossible de charger les données');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboard();
  };

  const handleLogout = async () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.multiRemove(['userToken', 'userId', 'userRole']);
            navigation.replace('Login');
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Chargement...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* User Info */}
      <View style={styles.header}>
        <Text style={styles.welcome}>Bonjour,</Text>
        <Text style={styles.userName}>
          {user ? `${user.firstName} ${user.lastName}` : 'Utilisateur'}
        </Text>
        {user && (
          <Text style={styles.userRole}>{user.role}</Text>
        )}
      </View>

      {/* Stats Cards */}
      {stats && (
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: '#3b82f6' }]}>
            <Text style={styles.statValue}>{stats.orders}</Text>
            <Text style={styles.statLabel}>Commandes du mois</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: '#10b981' }]}>
            <Text style={styles.statValue}>{stats.customers}</Text>
            <Text style={styles.statLabel}>Clients actifs</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: '#f59e0b' }]}>
            <Text style={styles.statValue}>{stats.todayVisits}</Text>
            <Text style={styles.statLabel}>Visites aujourd'hui</Text>
          </View>
        </View>
      )}

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actions rapides</Text>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Orders')}
        >
          <Text style={styles.actionIcon}>📦</Text>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Mes commandes</Text>
            <Text style={styles.actionSubtitle}>Voir toutes les commandes</Text>
          </View>
          <Text style={styles.actionArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Scanner')}
        >
          <Text style={styles.actionIcon}>📷</Text>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Scanner code-barres</Text>
            <Text style={styles.actionSubtitle}>Scanner un produit</Text>
          </View>
          <Text style={styles.actionArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('CustomerVisit')}
        >
          <Text style={styles.actionIcon}>📍</Text>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Visite client</Text>
            <Text style={styles.actionSubtitle}>Enregistrer une visite</Text>
          </View>
          <Text style={styles.actionArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.logoutButton]}
          onPress={handleLogout}
        >
          <Text style={styles.actionIcon}>🚪</Text>
          <View style={styles.actionContent}>
            <Text style={[styles.actionTitle, styles.logoutText]}>
              Déconnexion
            </Text>
          </View>
          <Text style={styles.actionArrow}>›</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  header: {
    backgroundColor: '#2563eb',
    padding: 20,
    paddingTop: 10,
  },
  welcome: {
    fontSize: 16,
    color: '#e0e7ff',
  },
  userName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 5,
  },
  userRole: {
    fontSize: 14,
    color: '#e0e7ff',
    marginTop: 5,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    gap: 10,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    color: '#fff',
    marginTop: 5,
    textAlign: 'center',
  },
  section: {
    padding: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 15,
  },
  actionButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionIcon: {
    fontSize: 32,
    marginRight: 15,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  actionSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  actionArrow: {
    fontSize: 32,
    color: '#d1d5db',
  },
  logoutButton: {
    borderColor: '#ef4444',
    borderWidth: 1,
    backgroundColor: '#fef2f2',
  },
  logoutText: {
    color: '#ef4444',
  },
});
