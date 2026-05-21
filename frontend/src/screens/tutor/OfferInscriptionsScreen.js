import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import Header from '../../components/ui/Header';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { API_BASE_URL } from '../../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const OfferInscriptionsScreen = ({ navigation, route }) => {
  const { offerId } = route.params;
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [offer, setOffer] = useState(null);
  const [inscriptions, setInscriptions] = useState([]);

  useEffect(() => {
    loadOfferDetails();
    loadInscriptions();
  }, [offerId]);

  const loadOfferDetails = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}/api/tutorat/offres/${offerId}/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setOffer(data);
      }
    } catch (error) {
      console.error('Erreur chargement offre:', error);
    }
  };

  const loadInscriptions = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}/api/tutorat/inscriptions/?offre=${offerId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setInscriptions(Array.isArray(data) ? data : []);
      } else {
        setInscriptions([]);
      }
    } catch (error) {
      console.error('Erreur chargement inscriptions:', error);
      setInscriptions([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadOfferDetails(), loadInscriptions()]);
    setRefreshing(false);
  };

  const handleAcceptInscription = async (inscriptionId) => {
    Alert.alert(
      'Accepter l\'inscription',
      'Voulez-vous accepter cette inscription ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Accepter',
          style: 'default',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('accessToken');
              const response = await fetch(`${API_BASE_URL}/api/tutorat/inscriptions/${inscriptionId}/accepter/`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
              });

              if (response.ok) {
                Alert.alert('Succès', 'Inscription acceptée');
                loadInscriptions();
              } else {
                Alert.alert('Erreur', 'Impossible d\'accepter cette inscription');
              }
            } catch (error) {
              console.error('Erreur acceptation inscription:', error);
              Alert.alert('Erreur', 'Une erreur est survenue');
            }
          }
        }
      ]
    );
  };

  const handleRejectInscription = async (inscriptionId) => {
    Alert.alert(
      'Refuser l\'inscription',
      'Voulez-vous refuser cette inscription ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Refuser',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('accessToken');
              const response = await fetch(`${API_BASE_URL}/api/tutorat/inscriptions/${inscriptionId}/refuser/`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
              });

              if (response.ok) {
                Alert.alert('Succès', 'Inscription refusée');
                loadInscriptions();
              } else {
                Alert.alert('Erreur', 'Impossible de refuser cette inscription');
              }
            } catch (error) {
              console.error('Erreur refus inscription:', error);
              Alert.alert('Erreur', 'Une erreur est survenue');
            }
          }
        }
      ]
    );
  };

  const handleContactStudent = async (studentId) => {
    navigation.navigate('ConversationDetail', { otherUserId: studentId });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'acceptee': return '#28a745';
      case 'refusee': return '#dc3545';
      case 'en_attente': return '#ffc107';
      default: return '#666';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'acceptee': return 'Acceptée';
      case 'refusee': return 'Refusée';
      case 'en_attente': return 'En attente';
      default: return status;
    }
  };

  if (loading && !offer) {
    return (
      <>
        <Header title="Inscriptions" showBack onBackPress={() => navigation.goBack()} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Chargement des inscriptions...</Text>
        </View>
      </>
    );
  }

  return (
    <>
      <Header title="Inscriptions" showBack onBackPress={() => navigation.goBack()} />
      <ScrollView 
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {offer && (
          <Card style={styles.offerCard}>
            <View style={styles.offerHeader}>
              <View style={styles.offerInfo}>
                <Text style={styles.offerTitle}>{offer.matiere}</Text>
                <Text style={styles.offerLevel}>{offer.niveau}</Text>
                <Text style={styles.offerDate}>{formatDate(offer.date_heure)}</Text>
                {offer.est_recurrent && (
                  <Text style={styles.offerRecurrent}>Offre récurrente</Text>
                )}
              </View>
              <View style={styles.offerStatus}>
                <Text style={styles.offerPrice}>{offer.prix}€/h</Text>
                <Text style={styles.offerPlaces}>
                  {offer.places_reservees || 0}/{offer.nombre_places} places
                </Text>
              </View>
            </View>
            
            <Text style={styles.offerDescription}>{offer.description}</Text>
          </Card>
        )}

        {inscriptions.length === 0 ? (
          <Card style={styles.emptyCard}>
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={60} color="#ccc" />
              <Text style={styles.emptyTitle}>Aucune inscription</Text>
              <Text style={styles.emptyText}>
                Personne ne s'est encore inscrit à cette offre
              </Text>
            </View>
          </Card>
        ) : (
          inscriptions.map(inscription => (
            <Card key={inscription.id} style={styles.inscriptionCard}>
              <View style={styles.inscriptionHeader}>
                <View style={styles.studentInfo}>
                  <Text style={styles.studentName}>
                    {inscription.etudiant_details?.prenom} {inscription.etudiant_details?.nom}
                  </Text>
                  <Text style={styles.studentEmail}>
                    {inscription.etudiant_details?.email}
                  </Text>
                  <Text style={styles.inscriptionDate}>
                    Inscrit le {formatDate(inscription.date_inscription)}
                  </Text>
                </View>
                <View style={styles.inscriptionStatus}>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(inscription.statut) }
                  ]}>
                    <Text style={styles.statusText}>
                      {getStatusText(inscription.statut)}
                    </Text>
                  </View>
                </View>
              </View>
              
              {inscription.message && (
                <View style={styles.messageContainer}>
                  <Text style={styles.messageLabel}>Message de l'étudiant:</Text>
                  <Text style={styles.messageText}>{inscription.message}</Text>
                </View>
              )}
              
              <View style={styles.inscriptionActions}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.contactButton]}
                  onPress={() => handleContactStudent(inscription.etudiant)}
                >
                  <Ionicons name="chatbubble-outline" size={16} color="#007AFF" />
                  <Text style={styles.actionText}>Contacter</Text>
                </TouchableOpacity>
                
                {inscription.statut === 'en_attente' && (
                  <>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.acceptButton]}
                      onPress={() => handleAcceptInscription(inscription.id)}
                    >
                      <Ionicons name="checkmark-circle-outline" size={16} color="#28a745" />
                      <Text style={styles.actionText}>Accepter</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[styles.actionButton, styles.rejectButton]}
                      onPress={() => handleRejectInscription(inscription.id)}
                    >
                      <Ionicons name="close-circle-outline" size={16} color="#dc3545" />
                      <Text style={styles.actionText}>Refuser</Text>
                    </TouchableOpacity>
                  </>
                )}
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
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  offerCard: {
    marginBottom: 16,
  },
  offerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  offerInfo: {
    flex: 1,
  },
  offerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  offerLevel: {
    fontSize: 14,
    color: '#007AFF',
    marginBottom: 2,
  },
  offerDate: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  offerRecurrent: {
    fontSize: 12,
    color: '#28a745',
    fontStyle: 'italic',
  },
  offerStatus: {
    alignItems: 'flex-end',
  },
  offerPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#28a745',
    marginBottom: 4,
  },
  offerPlaces: {
    fontSize: 14,
    color: '#666',
  },
  offerDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  emptyCard: {
    alignItems: 'center',
    padding: 40,
  },
  emptyContainer: {
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
  inscriptionCard: {
    marginBottom: 16,
  },
  inscriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  studentEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  inscriptionDate: {
    fontSize: 12,
    color: '#999',
  },
  inscriptionStatus: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  messageContainer: {
    backgroundColor: '#f8f9ff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  messageLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#007AFF',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  inscriptionActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    flex: 1,
    marginHorizontal: 4,
    justifyContent: 'center',
  },
  contactButton: {
    backgroundColor: '#e3f2fd',
  },
  acceptButton: {
    backgroundColor: '#d4edda',
  },
  rejectButton: {
    backgroundColor: '#f8d7da',
  },
  actionText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
});

export default OfferInscriptionsScreen;
