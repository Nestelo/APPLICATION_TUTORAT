import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Dimensions, RefreshControl } from 'react-native';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import Header from '../../components/ui/Header';
import Card from '../../components/ui/Card';
import { API_BASE_URL } from '../../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';

const { width: screenWidth } = Dimensions.get('window');

const StatisticsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadStatistics = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      
      // Charger les statistiques détaillées
      const statsResponse = await fetch(`${API_BASE_URL}/api/tutorat/seances/statistiques/etudiant/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      // Charger toutes les séances
      const sessionsResponse = await fetch(`${API_BASE_URL}/api/tutorat/seances/etudiant/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        console.log('Statistiques détaillées:', statsData);
        setStatistics(statsData);
      }
      
      if (sessionsResponse.ok) {
        const sessionsData = await sessionsResponse.json();
        console.log('Sessions détaillées:', sessionsData);
        setSessions(sessionsData);
      }
      
    } catch (error) {
      console.error('Erreur chargement statistiques:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadStatistics();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadStatistics();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Chargement des statistiques...</Text>
      </View>
    );
  }

  // Préparer les données pour les graphiques
  const matieresData = statistics?.matieres_suivies?.map((matiere, index) => ({
    name: matiere.nom_affichage || matiere.nom,
    sessions: matiere.nb_seances,
    color: ['#3498db', '#e74c3c', '#f39c12', '#2ecc71'][index % 4]
  })) || [];

  const evolutionData = [
    { month: 'Jan', sessions: 0 },
    { month: 'Fév', sessions: 0 },
    { month: 'Mar', sessions: statistics?.seances_derniers_30_jours || 0 },
    { month: 'Avr', sessions: statistics?.nombre_seances_suivies || 0 }
  ];

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Header title="Mes Statistiques" showBack={true} navigation={navigation} />
      
      {/* Cartes de statistiques principales */}
      <View style={styles.statsGrid}>
        <Card style={styles.statCard}>
          <View style={styles.statContent}>
            <Ionicons name="calendar" size={32} color="#3498db" />
            <Text style={styles.statNumber}>{statistics?.nombre_seances_suivies || 0}</Text>
            <Text style={styles.statLabel}>Séances suivies</Text>
          </View>
        </Card>
        
        <Card style={styles.statCard}>
          <View style={styles.statContent}>
            <Ionicons name="time" size={32} color="#e74c3c" />
            <Text style={styles.statNumber}>{Math.round((statistics?.temps_etude || 0) / 60)}h</Text>
            <Text style={styles.statLabel}>Temps d'étude</Text>
          </View>
        </Card>
        
        <Card style={styles.statCard}>
          <View style={styles.statContent}>
            <Ionicons name="star" size={32} color="#f39c12" />
            <Text style={styles.statNumber}>{statistics?.note_moyenne_tuteurs || 0}</Text>
            <Text style={styles.statLabel}>Note moyenne</Text>
          </View>
        </Card>
        
        <Card style={styles.statCard}>
          <View style={styles.statContent}>
            <Ionicons name="book" size={32} color="#2ecc71" />
            <Text style={styles.statNumber}>{statistics?.matieres_suivies?.length || 0}</Text>
            <Text style={styles.statLabel}>Matières suivies</Text>
          </View>
        </Card>
      </View>

      {/* Évolution des séances */}
      <Card style={styles.chartCard}>
        <Text style={styles.chartTitle}>Évolution des séances</Text>
        <LineChart
          data={{
            labels: evolutionData.map(d => d.month),
            datasets: [{
              data: evolutionData.map(d => d.sessions),
              color: (opacity = 1) => `rgba(52, 152, 219, ${opacity})`,
              strokeWidth: 2
            }]
          }}
          width={screenWidth - 40}
          height={220}
          chartConfig={{
            backgroundColor: '#ffffff',
            backgroundGradientFrom: '#ffffff',
            backgroundGradientTo: '#ffffff',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            style: {
              borderRadius: 16
            }
          }}
          bezier
          style={styles.chart}
        />
      </Card>

      {/* Répartition par matière */}
      {matieresData.length > 0 && (
        <Card style={styles.chartCard}>
          <Text style={styles.chartTitle}>Répartition par matière</Text>
          <PieChart
            data={matieresData}
            width={screenWidth - 40}
            height={220}
            chartConfig={{
              color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            }}
            accessor="sessions"
            backgroundColor="transparent"
            paddingLeft="15"
            center={[10, 10]}
            absolute
          />
          <View style={styles.legendContainer}>
            {matieresData.map((item, index) => (
              <View key={index} style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: item.color }]} />
                <Text style={styles.legendText}>{item.name}</Text>
              </View>
            ))}
          </View>
        </Card>
      )}

      {/* Sessions récentes */}
      <Card style={styles.sessionsCard}>
        <Text style={styles.sessionsTitle}>Sessions récentes</Text>
        {sessions.slice(0, 5).map((session, index) => (
          <View key={session.id} style={styles.sessionItem}>
            <View style={styles.sessionInfo}>
              <Text style={styles.sessionSubject}>{session.sujet}</Text>
              <Text style={styles.sessionTutor}>
                avec {session.tuteur?.prenom} {session.tuteur?.nom}
              </Text>
              <Text style={styles.sessionDate}>
                {new Date(session.date_heure_debut).toLocaleDateString('fr-FR')}
              </Text>
            </View>
            <View style={styles.sessionStatus}>
              <Text style={[
                styles.statusText,
                { color: session.statut === 'terminee' ? '#2ecc71' : '#f39c12' }
              ]}>
                {session.statut === 'terminee' ? 'Terminée' : 'Planifiée'}
              </Text>
            </View>
          </View>
        ))}
      </Card>

      {/* Informations supplémentaires */}
      <Card style={styles.infoCard}>
        <Text style={styles.infoTitle}>Informations complémentaires</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Évaluations données:</Text>
          <Text style={styles.infoValue}>{statistics?.evaluations_donnees || 0}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Séances à venir:</Text>
          <Text style={styles.infoValue}>{statistics?.seances_avenir || 0}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Séances 30 derniers jours:</Text>
          <Text style={styles.infoValue}>{statistics?.seances_derniers_30_jours || 0}</Text>
        </View>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    marginTop: 10,
  },
  statCard: {
    width: '48%',
    marginBottom: 10,
  },
  statContent: {
    alignItems: 'center',
    padding: 15,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginVertical: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  chartCard: {
    margin: 10,
    padding: 15,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
    textAlign: 'center',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 10,
    marginVertical: 5,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 5,
  },
  legendText: {
    fontSize: 12,
    color: '#2c3e50',
  },
  sessionsCard: {
    margin: 10,
    padding: 15,
  },
  sessionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
  },
  sessionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  sessionInfo: {
    flex: 1,
  },
  sessionSubject: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  sessionTutor: {
    fontSize: 14,
    color: '#7f8c8d',
    marginVertical: 2,
  },
  sessionDate: {
    fontSize: 12,
    color: '#95a5a6',
  },
  sessionStatus: {
    alignItems: 'flex-end',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  infoCard: {
    margin: 10,
    padding: 15,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  infoLabel: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
});

export default StatisticsScreen;
