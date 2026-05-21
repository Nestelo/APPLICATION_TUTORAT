import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import Header from '../../components/ui/Header';
import Card from '../../components/ui/Card';
import WeeklyActivityChart from '../../components/charts/WeeklyActivityChart';
import { getSeances } from '../../api/tutorService';
import { useAuth } from '../../context/AuthContext';

const ActivityScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [seances, setSeances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadSeances();
  }, []);

  const loadSeances = async () => {
    try {
      setLoading(true);
      const result = await getSeances();
      
      if (result.success) {
        console.log('📊 Séances pour activité:', result.data);
        setSeances(result.data || result || []);
      } else {
        console.error('❌ Erreur chargement séances:', result.error);
        setSeances([]);
      }
    } catch (error) {
      console.error('❌ Erreur loadSeances:', error);
      setSeances([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSeances();
    setRefreshing(false);
  };

  // Filtrer les séances des 7 derniers jours
  const getRecentSeances = () => {
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);
    
    return seances.filter(seance => {
      const seanceDate = new Date(seance.date_heure_debut);
      return seanceDate >= sevenDaysAgo;
    });
  };

  const recentSeances = getRecentSeances();

  if (loading) {
    return (
      <>
        <Header title="Mon activité" showBack onBackPress={() => navigation.goBack()} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Chargement de l'activité...</Text>
        </View>
      </>
    );
  }

  return (
    <>
      <Header title="Mon activité" showBack onBackPress={() => navigation.goBack()} />
      <ScrollView 
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Carte de statistiques générales */}
        <Card style={styles.statsCard}>
          <Text style={styles.statsTitle}>Statistiques générales</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{seances.length}</Text>
              <Text style={styles.statLabel}>Total séances</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{recentSeances.length}</Text>
              <Text style={styles.statLabel}>7 derniers jours</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {seances.length > 0 ? Math.round((recentSeances.length / seances.length) * 100) : 0}%
              </Text>
              <Text style={styles.statLabel}>Taux d'activité</Text>
            </View>
          </View>
        </Card>

        {/* Diagramme d'activité des 7 derniers jours */}
        <WeeklyActivityChart seances={recentSeances} />

        {/* Carte d'informations supplémentaires */}
        <Card style={styles.infoCard}>
          <Text style={styles.infoTitle}>À propos de cette vue</Text>
          <Text style={styles.infoText}>
            Ce graphique montre votre activité de tutorat sur les 7 derniers jours. 
            Chaque barre représente le nombre de séances effectuées par jour.
          </Text>
          <View style={styles.infoList}>
            <Text style={styles.infoItem}>• Les jours avec séances apparaissent en bleu</Text>
            <Text style={styles.infoItem}>• Les jours sans séance apparaissent en gris</Text>
            <Text style={styles.infoItem}>• La hauteur des barres indique le nombre de séances</Text>
            <Text style={styles.infoItem}>• Les détails montrent les séances récentes par jour</Text>
          </View>
        </Card>
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  statsCard: {
    margin: 16,
    padding: 16,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  infoCard: {
    margin: 16,
    padding: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  infoList: {
    paddingLeft: 8,
  },
  infoItem: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    marginBottom: 4,
  },
});

export default ActivityScreen;
