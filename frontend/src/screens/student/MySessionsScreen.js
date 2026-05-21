import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  RefreshControl,
  Linking,
  TextInput,
  Image,
  Dimensions,
} from 'react-native';
import Header from '../../components/ui/Header';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import {
  getMySessions,
  cancelSession,
  confirmParticipation,
  getSessionDetails,
} from '../../api/sessionService';
import { API_BASE_URL } from '../../config/api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const { width } = Dimensions.get('window');

const MySessionsScreen = ({ navigation }) => {
  const { user } = useAuth();
  
  // États
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming' | 'past'
  const [sessionDetails, setSessionDetails] = useState(null);

  useEffect(() => {
    loadSessions();
  }, []);

  // Charger les séances
  const loadSessions = async () => {
    try {
      setLoading(true);
      const result = await getMySessions();
      
      if (result.success) {
        setSessions(result.data);
      } else {
        Alert.alert('Erreur', result.error || 'Impossible de charger vos séances');
      }
    } catch (error) {
      console.error('Erreur chargement séances:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors du chargement de vos séances');
    } finally {
      setLoading(false);
    }
  };

  // Rafraîchir
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadSessions();
    setRefreshing(false);
  }, []);

  // Obtenir les détails d'une séance
  const loadSessionDetails = async (sessionId) => {
    try {
      const result = await getSessionDetails(sessionId);
      if (result.success) {
        setSessionDetails(result.data);
      }
    } catch (error) {
      console.error('Erreur détails séance:', error);
    }
  };

  // Afficher les détails d'une séance
  const showSessionDetails = async (session) => {
    setSelectedSession(session);
    await loadSessionDetails(session.id);
    setShowDetailModal(true);
  };

  // Confirmer la participation
  const handleConfirmParticipation = async () => {
    if (!selectedSession) return;
    
    try {
      const result = await confirmParticipation(selectedSession.id);
      
      if (result.success) {
        Alert.alert('Succès', 'Votre participation a été confirmée');
        setShowDetailModal(false);
        await loadSessions();
      } else {
        Alert.alert('Erreur', result.error || 'Impossible de confirmer la participation');
      }
    } catch (error) {
      console.error('Erreur confirmation participation:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors de la confirmation');
    }
  };

  // Annuler une séance
  const handleCancelSession = async () => {
    if (!selectedSession || !cancelReason.trim()) {
      Alert.alert('Erreur', 'Veuillez fournir une raison pour l\'annulation');
      return;
    }

    try {
      const result = await cancelSession(selectedSession.id, cancelReason);
      
      if (result.success) {
        Alert.alert('Succès', 'La séance a été annulée avec succès');
        setShowCancelModal(false);
        setShowDetailModal(false);
        setCancelReason('');
        await loadSessions();
      } else {
        Alert.alert('Erreur', result.error || 'Impossible d\'annuler la séance');
      }
    } catch (error) {
      console.error('Erreur annulation séance:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors de l\'annulation');
    }
  };

  // Rejoindre la séance (lien visio)
  const handleJoinSession = (session) => {
    if (session.lien_visio) {
      Linking.openURL(session.lien_visio).catch(() => {
        Alert.alert('Erreur', 'Impossible d\'ouvrir le lien de la séance');
      });
    } else {
      Alert.alert('Information', 'Aucun lien de réunion disponible pour cette séance');
    }
  };

  // Formater la date
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return format(date, 'EEEE d MMMM yyyy à HH:mm', { locale: fr });
    } catch (error) {
      return 'Date invalide';
    }
  };

  // Obtenir la couleur du statut
  const getStatusColor = (status) => {
    switch (status) {
      case 'planifiee': return '#f59e0b';
      case 'confirmee': return '#10b981';
      case 'en_cours': return '#3b82f6';
      case 'terminee': return '#6b7280';
      case 'annulee': return '#ef4444';
      default: return '#6b7280';
    }
  };

  // Obtenir le texte du statut
  const getStatusText = (status) => {
    switch (status) {
      case 'planifiee': return 'Planifiée';
      case 'confirmee': return 'Confirmée';
      case 'en_cours': return 'En cours';
      case 'terminee': return 'Terminée';
      case 'annulee': return 'Annulée';
      default: return status;
    }
  };

  // Séparer les séances
  const upcomingSessions = sessions.seances_avenir || [];
  const pastSessions = sessions.seances_passees || [];
  const currentSessions = activeTab === 'upcoming' ? upcomingSessions : pastSessions;

  // Rendu d'une séance
  const renderSession = (session) => (
    <TouchableOpacity
      key={session.id}
      style={styles.sessionCard}
      onPress={() => showSessionDetails(session)}
    >
      <View style={styles.sessionHeader}>
        <View style={styles.sessionInfo}>
          <Text style={styles.sessionSubject}>{session.sujet}</Text>
          <Text style={styles.sessionDateTime}>
            {formatDate(session.date_heure_debut)}
          </Text>
          {session.matiere && (
            <Text style={styles.sessionMatter}>📚 {session.matiere}</Text>
          )}
        </View>
        
        <View style={[
          styles.sessionStatus,
          { backgroundColor: getStatusColor(session.statut) }
        ]}>
          <Text style={styles.sessionStatusText}>
            {getStatusText(session.statut)}
          </Text>
        </View>
      </View>

      <View style={styles.sessionTutor}>
        {session.tuteur?.photo ? (
          <Image
            source={{ uri: `${API_BASE_URL}${session.tuteur.photo}` }}
            style={styles.tutorPhoto}
          />
        ) : (
          <View style={styles.tutorPhotoPlaceholder}>
            <Ionicons name="person" size={20} color="#9ca3af" />
          </View>
        )}
        
        <View style={styles.tutorInfo}>
          <Text style={styles.tutorName}>
            {session.tuteur?.prenom} {session.tuteur?.nom}
          </Text>
          <View style={styles.sessionType}>
            <Ionicons 
              name={session.en_ligne ? 'videocam' : 'location'} 
              size={14} 
              color="#6b7280" 
            />
            <Text style={styles.sessionTypeText}>
              {session.en_ligne ? 'En ligne' : 'Présentiel'}
            </Text>
          </View>
        </View>
      </View>

      {session.statut === 'confirmee' && (
        <TouchableOpacity
          style={styles.joinButton}
          onPress={() => handleJoinSession(session)}
        >
          <Ionicons name="videocam" size={16} color="#ffffff" />
          <Text style={styles.joinButtonText}>Rejoindre</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  // Modal détails
  const renderDetailModal = () => (
    <Modal
      visible={showDetailModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowDetailModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {selectedSession && (
            <>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Détails de la séance</Text>
                <TouchableOpacity
                  onPress={() => setShowDetailModal(false)}
                >
                  <Ionicons name="close" size={24} color="#6b7280" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody}>
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Sujet</Text>
                  <Text style={styles.detailValue}>{selectedSession.sujet}</Text>
                </View>

                {selectedSession.description && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Description</Text>
                    <Text style={styles.detailValue}>{selectedSession.description}</Text>
                  </View>
                )}

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Date et heure</Text>
                  <Text style={styles.detailValue}>
                    {formatDate(selectedSession.date_heure_debut)}
                  </Text>
                  <Text style={styles.detailValue}>
                    Durée: {selectedSession.duree} minutes
                  </Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Tuteur</Text>
                  <View style={styles.tutorDetail}>
                    {selectedSession.tuteur?.photo ? (
                      <Image
                        source={{ uri: `${API_BASE_URL}${selectedSession.tuteur.photo}` }}
                        style={styles.tutorDetailPhoto}
                      />
                    ) : (
                      <View style={styles.tutorDetailPhotoPlaceholder}>
                        <Ionicons name="person" size={20} color="#9ca3af" />
                      </View>
                    )}
                    <Text style={styles.tutorDetailName}>
                      {selectedSession.tuteur?.prenom} {selectedSession.tuteur?.nom}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Modalité</Text>
                  <Text style={styles.detailValue}>
                    {selectedSession.en_ligne ? 'En ligne' : 'Présentiel'}
                  </Text>
                  {selectedSession.en_ligne && selectedSession.lien_visio && (
                    <TouchableOpacity
                      style={styles.linkButton}
                      onPress={() => handleJoinSession(selectedSession)}
                    >
                      <Ionicons name="link" size={16} color="#6366f1" />
                      <Text style={styles.linkButtonText}>Lien de réunion</Text>
                    </TouchableOpacity>
                  )}
                  {!selectedSession.en_ligne && selectedSession.lieu && (
                    <Text style={styles.detailValue}>📍 {selectedSession.lieu}</Text>
                  )}
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Statut</Text>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(selectedSession.statut) }
                  ]}>
                    <Text style={styles.statusText}>
                      {getStatusText(selectedSession.statut)}
                    </Text>
                  </View>
                </View>

                {selectedSession.commentaire_annulation && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Raison de l'annulation</Text>
                    <Text style={styles.detailValue}>
                      {selectedSession.commentaire_annulation}
                    </Text>
                  </View>
                )}
              </ScrollView>

              {/* Actions */}
              <View style={styles.modalActions}>
                {selectedSession.statut === 'planifiee' && (
                  <Button
                    title="Confirmer ma participation"
                    onPress={handleConfirmParticipation}
                    style={styles.confirmButton}
                  />
                )}
                
                {['planifiee', 'confirmee'].includes(selectedSession.statut) && (
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setShowCancelModal(true)}
                  >
                    <Text style={styles.cancelButtonText}>Annuler la séance</Text>
                  </TouchableOpacity>
                )}
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );

  // Modal annulation
  const renderCancelModal = () => (
    <Modal
      visible={showCancelModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowCancelModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Annuler la séance</Text>
            <TouchableOpacity
              onPress={() => setShowCancelModal(false)}
            >
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <View style={styles.cancelContent}>
            <Text style={styles.cancelLabel}>
              Veuillez indiquer la raison de l'annulation:
            </Text>
            <TextInput
              style={styles.cancelInput}
              value={cancelReason}
              onChangeText={setCancelReason}
              placeholder="Ex: Empêchement imprévu, conflit d'horaire..."
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.cancelActions}>
            <TouchableOpacity
              style={styles.cancelCancelButton}
              onPress={() => setShowCancelModal(false)}
            >
              <Text style={styles.cancelCancelText}>Annuler</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.cancelConfirmButton}
              onPress={handleCancelSession}
            >
              <Text style={styles.cancelConfirmText}>Confirmer l'annulation</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <>
      <Header title="Mes séances" showBack={true} />
      
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Statistiques */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{upcomingSessions.length}</Text>
            <Text style={styles.statLabel}>Séances à venir</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{pastSessions.length}</Text>
            <Text style={styles.statLabel}>Séances passées</Text>
          </View>
        </View>

        {/* Onglets */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'upcoming' && styles.activeTab
            ]}
            onPress={() => setActiveTab('upcoming')}
          >
            <Text style={[
              styles.tabText,
              activeTab === 'upcoming' && styles.activeTabText
            ]}>
              À venir ({upcomingSessions.length})
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'past' && styles.activeTab
            ]}
            onPress={() => setActiveTab('past')}
          >
            <Text style={[
              styles.tabText,
              activeTab === 'past' && styles.activeTabText
            ]}>
              Passées ({pastSessions.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Liste des séances */}
        {loading ? (
          <ActivityIndicator size="large" color="#6366f1" style={styles.loader} />
        ) : currentSessions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons 
              name={activeTab === 'upcoming' ? 'calendar-outline' : 'checkmark-circle-outline'} 
              size={48} 
              color="#9ca3af" 
            />
            <Text style={styles.emptyText}>
              {activeTab === 'upcoming' 
                ? 'Aucune séance à venir' 
                : 'Aucune séance passée'
              }
            </Text>
            {activeTab === 'upcoming' && (
              <Button
                title="Réserver une séance"
                onPress={() => navigation.navigate('FindTutor')}
                style={styles.bookButton}
              />
            )}
          </View>
        ) : (
          <View style={styles.sessionsList}>
            {currentSessions.map(renderSession)}
          </View>
        )}
      </ScrollView>

      {/* Modals */}
      {renderDetailModal()}
      {renderCancelModal()}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },

  // Statistiques
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#6366f1',
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },

  // Onglets
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#6366f1',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  activeTabText: {
    color: '#ffffff',
  },

  // Session card
  sessionCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
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
    marginBottom: 12,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionSubject: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  sessionDateTime: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  sessionMatter: {
    fontSize: 12,
    color: '#6366f1',
  },
  sessionStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sessionStatusText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '500',
  },

  // Tuteur
  sessionTutor: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tutorPhoto: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  tutorPhotoPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tutorInfo: {
    marginLeft: 12,
    flex: 1,
  },
  tutorName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  sessionType: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  sessionTypeText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 4,
  },

  // Bouton rejoindre
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  joinButtonText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '500',
    marginLeft: 4,
  },

  // État vide
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  bookButton: {
    backgroundColor: '#6366f1',
  },

  // Loader
  loader: {
    marginTop: 40,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  modalBody: {
    flex: 1,
    padding: 20,
  },

  // Détails
  detailSection: {
    marginBottom: 20,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
    marginBottom: 8,
  },
  detailValue: {
    fontSize: 16,
    color: '#111827',
    marginBottom: 4,
  },
  tutorDetail: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tutorDetailPhoto: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  tutorDetailPhotoPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tutorDetailName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginLeft: 12,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  linkButtonText: {
    fontSize: 14,
    color: '#6366f1',
    marginLeft: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '500',
  },

  // Actions modal
  modalActions: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 12,
  },
  confirmButton: {
    backgroundColor: '#10b981',
  },

  // Annulation
  cancelButton: {
    backgroundColor: '#ef4444',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
  },

  // Modal annulation
  cancelContent: {
    padding: 20,
  },
  cancelLabel: {
    fontSize: 16,
    color: '#111827',
    marginBottom: 12,
  },
  cancelInput: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
    height: 100,
  },
  cancelActions: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 12,
  },
  cancelCancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
  },
  cancelCancelText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6b7280',
  },
  cancelConfirmButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#ef4444',
  },
  cancelConfirmText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
  },
});

export default MySessionsScreen;
