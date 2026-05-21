import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import Header from '../../components/ui/Header';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { API_BASE_URL } from '../../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';

const StudentSessionsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [availableSessions, setAvailableSessions] = useState([]);

  const loadSessions = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      
      // Utiliser l'URL existante qui fonctionne déjà
      console.log('Chargement des séances disponibles...');
      const response = await fetch(`${API_BASE_URL}/api/tutorat/seances/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      console.log('Réponse status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Données reçues:', data);
        
        // Extraire les séances depuis la réponse
        const sessionsData = Array.isArray(data.results) ? data.results : (data.data || []);
        console.log('Sessions brutes:', sessionsData);
        
        // Filtrer pour ne montrer que les séances où l'étudiant peut s'inscrire
        const availableSessions = sessionsData.filter(session => {
          // Vérifier si l'étudiant est déjà inscrit
          const estDejaInscrit = session.etudiants_details && session.etudiants_details.length > 0 && 
            session.etudiants_details.some(e => e.id === user.id);
          
          // Vérifier si la séance est à venir
          const estAVenir = new Date(session.date_heure_debut) > new Date();
          
          // Limiter à 10 étudiants maximum (utiliser le nombre réel d'étudiants)
          const nombreEtudiants = session.etudiants_details ? session.etudiants_details.length : 0;
          const placesDisponibles = nombreEtudiants < 10;
          
          console.log(`Séance ${session.sujet}: déjàInscrit=${estDejaInscrit}, aVenir=${estAVenir}, places=${placesDisponibles}, nombreEtudiants=${nombreEtudiants}`);
          
          return !estDejaInscrit && estAVenir && placesDisponibles;
        });
        
        console.log('Sessions filtrées:', availableSessions);
        setAvailableSessions(availableSessions);
      } else {
        console.error('Erreur chargement séances:', response.status);
        const errorText = await response.text();
        console.error('Erreur texte:', errorText);
        setAvailableSessions([]);
      }
    } catch (error) {
      console.error('Erreur:', error);
      Alert.alert('Erreur', 'Impossible de charger les séances disponibles');
      setAvailableSessions([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleInscription = async (sessionId) => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      
      const response = await fetch(`${API_BASE_URL}/api/tutorat/seances/inscrire-seance-existante/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          seance_id: sessionId
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        Alert.alert(
          'Succès',
          data.message,
          [{ text: 'OK' }]
        );
        loadSessions(); // Recharger la liste
      } else {
        Alert.alert('Erreur', data.error || 'Impossible de s\'inscrire à cette séance');
      }
    } catch (error) {
      console.error('Erreur inscription:', error);
      Alert.alert('Erreur', 'Impossible de s\'inscrire à cette séance');
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadSessions();
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Chargement des séances...</Text>
      </View>
    );
  }

  return (
    <>
      <Header title="Séances disponibles" />
      <ScrollView 
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {availableSessions.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Ionicons name="calendar-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>Aucune séance disponible</Text>
            <Text style={styles.emptySubtext}>Revenez plus tard pour voir les nouvelles séances</Text>
          </Card>
        ) : (
          availableSessions.map((session) => (
            <Card key={session.id} style={styles.sessionCard}>
              <View style={styles.sessionHeader}>
                <View style={styles.sessionInfo}>
                  <Text style={styles.sessionTitle}>{session.sujet}</Text>
                  <Text style={styles.sessionTuteur}>
                    Par {session.tuteur_details ? 
                      `${session.tuteur_details.prenom} ${session.tuteur_details.nom}` : 
                      'Tuteur inconnu'
                    }
                  </Text>
                </View>
                <View style={styles.sessionMeta}>
                  <Text style={styles.sessionDate}>
                    {formatDate(session.date_heure_debut)}
                  </Text>
                  <Text style={styles.sessionDuration}>
                    {session.duree} min
                  </Text>
                </View>
              </View>
              
              <View style={styles.sessionDetails}>
                <Text style={styles.sessionDescription}>
                  {session.description || 'Aucune description'}
                </Text>
                
                <View style={styles.participantsInfo}>
                  <Text style={styles.participantsText}>
                    👥 {session.nombre_etudiants || 0} participant{session.nombre_etudiants > 1 ? 's' : ''}
                  </Text>
                  {session.etudiants_details && session.etudiants_details.length > 0 && (
                    <Text style={styles.participantsList}>
                      Déjà inscrits: {session.etudiants_details.map(e => `${e.prenom} ${e.nom}`).join(', ')}
                    </Text>
                  )}
                  <Text style={styles.inscriptionStatus}>
                    {session.etudiants && session.etudiants.some(e => e.id === user.id) ? 
                      '🔒 Vous êtes déjà inscrit' : 
                      session.nombre_etudiants >= 10 ? 
                        '🔒 Complet' : 
                        '✅ Places disponibles'
                    }
                  </Text>
                </View>
                
                <View style={styles.sessionLocation}>
                  {session.lieu ? (
                    <Text style={styles.locationText}>📍 {session.lieu}</Text>
                  ) : (
                    <Text style={styles.locationText}>💻 En ligne</Text>
                  )}
                </View>
              </View>
              
              <View style={styles.sessionActions}>
                <Button
                  title="S'inscrire"
                  onPress={() => handleInscription(session.id)}
                  variant="primary"
                  style={styles.inscriptionButton}
                />
              </View>
            </Card>
          ))
        )}
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  emptyCard: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#fff',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  sessionCard: {
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  sessionTuteur: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  sessionMeta: {
    alignItems: 'flex-end',
  },
  sessionDate: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  sessionDuration: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  sessionDetails: {
    marginBottom: 16,
  },
  sessionDescription: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
    marginBottom: 12,
  },
  participantsInfo: {
    marginBottom: 12,
  },
  participantsText: {
    fontSize: 14,
    color: '#3498db',
    fontWeight: '500',
    marginBottom: 4,
  },
  participantsList: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  inscriptionStatus: {
    fontSize: 12,
    color: '#27ae60',
    fontWeight: '500',
    marginTop: 4,
  },
  sessionLocation: {
    marginBottom: 16,
  },
  locationText: {
    fontSize: 14,
    color: '#e67e22',
  },
  sessionActions: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 16,
  },
  inscriptionButton: {
    backgroundColor: '#27ae60',
  },
});

export default StudentSessionsScreen;
