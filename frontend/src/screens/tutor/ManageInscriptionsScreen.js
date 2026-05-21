import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import Header from '../../components/ui/Header';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { API_BASE_URL } from '../../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';

const ManageInscriptionsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [pendingInscriptions, setPendingInscriptions] = useState([]);

  const loadSessions = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      
      // Charger les séances du tuteur avec les inscriptions en attente
      const response = await fetch(`${API_BASE_URL}/api/tutorat/mes-seances/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        const allSessions = [...(data.seances_avenir || []), ...(data.seances_passees || [])];
        
        // Filtrer les séances qui ont des inscriptions en attente
        const sessionsWithPending = allSessions.filter(session => {
          return session.etudiants && session.etudiants.length > 0;
        });
        
        setSessions(sessionsWithPending);
      } else {
        console.error('Erreur chargement séances:', response.status);
      }
    } catch (error) {
      console.error('Erreur:', error);
      Alert.alert('Erreur', 'Impossible de charger les séances');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleInscriptionAction = async (sessionId, etudiantId, action) => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      
      const response = await fetch(`${API_BASE_URL}/api/tutorat/seances/gerer-inscription/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          seance_id: sessionId,
          etudiant_id: etudiantId,
          action: action // 'accepter' ou 'refuser'
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
        Alert.alert('Erreur', data.error || 'Impossible de traiter l\'inscription');
      }
    } catch (error) {
      console.error('Erreur gestion inscription:', error);
      Alert.alert('Erreur', 'Impossible de traiter l\'inscription');
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
        <Text style={styles.loadingText}>Chargement des inscriptions...</Text>
      </View>
    );
  }

  return (
    <>
      <Header title="Gérer les inscriptions" />
      <ScrollView 
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {sessions.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Ionicons name="people-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>Aucune inscription à gérer</Text>
            <Text style={styles.emptySubtext}>Les étudiants s'inscriront à vos séances</Text>
          </Card>
        ) : (
          sessions.map((session) => (
            <Card key={session.id} style={styles.sessionCard}>
              <View style={styles.sessionHeader}>
                <View style={styles.sessionInfo}>
                  <Text style={styles.sessionTitle}>{session.sujet}</Text>
                  <Text style={styles.sessionDateTime}>
                    {formatDate(session.date_heure_debut)}
                  </Text>
                </View>
                <View style={styles.sessionStatus}>
                  <Text style={styles.statusText}>{session.statut_display}</Text>
                </View>
              </View>
              
              <View style={styles.sessionDetails}>
                <Text style={styles.sessionDescription}>
                  {session.description || 'Aucune description'}
                </Text>
                
                {session.lieu ? (
                  <Text style={styles.locationText}>📍 {session.lieu}</Text>
                ) : (
                  <Text style={styles.locationText}>💻 En ligne</Text>
                )}
              </View>
              
              {/* Liste des étudiants inscrits */}
              {session.etudiants && session.etudiants.length > 0 && (
                <View style={styles.inscriptionsSection}>
                  <Text style={styles.inscriptionsTitle}>
                    📋 Inscriptions en attente ({session.etudiants.length})
                  </Text>
                  {session.etudiants.map((etudiant) => (
                    <View key={etudiant.id} style={styles.etudiantCard}>
                      {/* Informations de l'étudiant - Layout horizontal */}
                      <View style={styles.etudiantHeader}>
                        <View style={styles.etudiantAvatar}>
                          <Text style={styles.avatarText}>
                            {etudiant.prenom.charAt(0)}{etudiant.nom.charAt(0)}
                          </Text>
                        </View>
                        <View style={styles.etudiantDetails}>
                          <Text style={styles.etudiantName}>
                            {etudiant.prenom} {etudiant.nom}
                          </Text>
                          <View style={styles.etudiantMeta}>
                            <Text style={styles.etudiantEmail}>📧 {etudiant.email}</Text>
                            <Text style={styles.etudiantDate}>📅 {new Date().toLocaleDateString('fr-FR')}</Text>
                          </View>
                        </View>
                      </View>
                      
                      {/* Actions */}
                      <View style={styles.etudiantActions}>
                        <TouchableOpacity
                          style={[styles.actionButton, styles.acceptButton]}
                          onPress={() => handleInscriptionAction(session.id, etudiant.id, 'accepter')}
                        >
                          <Ionicons name="checkmark" size={16} color="#fff" />
                          <Text style={styles.actionButtonText}>Accepter</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.actionButton, styles.refuseButton]}
                          onPress={() => handleInscriptionAction(session.id, etudiant.id, 'refuser')}
                        >
                          <Ionicons name="close" size={16} color="#fff" />
                          <Text style={styles.actionButtonText}>Refuser</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              )}
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
  sessionDateTime: {
    fontSize: 14,
    color: '#666',
  },
  sessionStatus: {
    alignItems: 'flex-end',
  },
  statusText: {
    fontSize: 12,
    color: '#27ae60',
    backgroundColor: '#e8f8f5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontWeight: '500',
  },
  sessionDetails: {
    marginBottom: 16,
  },
  sessionDescription: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
    marginBottom: 8,
  },
  locationText: {
    fontSize: 14,
    color: '#e67e22',
    marginBottom: 16,
  },
  inscriptionsSection: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 16,
  },
  inscriptionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 12,
  },
  etudiantCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  etudiantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  etudiantAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  etudiantDetails: {
    flex: 1,
  },
  etudiantName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  etudiantMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  etudiantEmail: {
    fontSize: 12,
    color: '#666',
    flex: 1,
    marginRight: 8,
  },
  etudiantDate: {
    fontSize: 11,
    color: '#7f8c8d',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  etudiantActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 80,
    justifyContent: 'center',
  },
  acceptButton: {
    backgroundColor: '#27ae60',
  },
  refuseButton: {
    backgroundColor: '#e74c3c',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
});

export default ManageInscriptionsScreen;
