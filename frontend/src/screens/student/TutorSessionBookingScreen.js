import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  ActivityIndicator,
  Modal,
  Platform,
  Image,
  FlatList,
  RefreshControl,
  Dimensions,
} from 'react-native';
import Header from '../../components/ui/Header';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { API_BASE_URL } from '../../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  getTutorDisponibilities,
  bookSession,
  cancelSession,
  confirmParticipation,
  getMySessions,
  getSessionDetails,
} from '../../api/sessionService';

const { width } = Dimensions.get('window');

const TutorSessionBookingScreen = ({ route, navigation }) => {
  const { tutorId, tutor, offre } = route.params || {};
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [tutorData, setTutorData] = useState(tutor || null);
  const [disponibilities, setDisponibilities] = useState([]);
  const [selectedDisponibility, setSelectedDisponibility] = useState(null);
  const [selectedOffre, setSelectedOffre] = useState(offre || null);
  const [sessionDetails, setSessionDetails] = useState({
    sujet: '',
    description: '',
    duree: 60,
    type: 'individuel',
    niveau: '',
    matiere: '',
  });
  const [mySessions, setMySessions] = useState([]);
  const [showMySessions, setShowMySessions] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [conflictDetails, setConflictDetails] = useState([]);
  const [createdSession, setCreatedSession] = useState(null);
  const [filters, setFilters] = useState({
    date: null,
    matiere: '',
    niveau: '',
    type: 'all',
  });

  useEffect(() => {
    if (tutorId) {
      loadTutorData();
      loadDisponibilities();
    }
    loadMySessions();
  }, [tutorId]);

  const loadTutorData = async () => {
    try {
      setLoading(true);
      if (!tutorData) {
        const token = await AsyncStorage.getItem('accessToken');
        const response = await fetch(`${API_BASE_URL}/api/tutorat/tuteurs/${tutorId}/profile/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          setTutorData(data);
        }
      }
    } catch (error) {
      console.error('Erreur chargement données tuteur:', error);
      Alert.alert('Erreur', 'Impossible de charger les informations du tuteur');
    } finally {
      setLoading(false);
    }
  };

  const loadDisponibilities = async () => {
    try {
      setLoading(true);
      const result = await getTutorDisponibilities(tutorId);
      
      if (result.success) {
        setDisponibilities(result.data.disponibilites || []);
        
        if (!tutorData && result.data.tuteur) {
          setTutorData(result.data.tuteur);
        }
      } else {
        Alert.alert('Erreur', result.error || 'Impossible de charger les disponibilités');
      }
    } catch (error) {
      console.error('Erreur chargement disponibilités:', error);
      Alert.alert('Erreur', 'Impossible de charger les disponibilités');
    } finally {
      setLoading(false);
    }
  };

  const loadMySessions = async () => {
    try {
      const result = await getMySessions();
      if (result.success) {
        setMySessions(result.data.seances_avenir || []);
      }
    } catch (error) {
      console.error('Erreur chargement mes séances:', error);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      loadTutorData(),
      loadDisponibilities(),
      loadMySessions(),
    ]);
    setRefreshing(false);
  }, [tutorId]);

  const checkConflicts = (selectedDateTime) => {
    const conflicts = mySessions.filter(session => {
      const sessionStart = new Date(session.date_heure_debut);
      const sessionEnd = new Date(session.date_heure_fin);
      const selectedStart = new Date(selectedDateTime);
      const selectedEnd = new Date(selectedStart.getTime() + sessionDetails.duree * 60000);
      
      return (
        (selectedStart >= sessionStart && selectedStart < sessionEnd) ||
        (selectedEnd > sessionStart && selectedEnd <= sessionEnd) ||
        (selectedStart <= sessionStart && selectedEnd >= sessionEnd)
      );
    });
    
    return conflicts;
  };

  const selectDisponibility = (disponibility) => {
    const conflicts = checkConflicts(disponibility.heure_debut);
    
    if (conflicts.length > 0) {
      setConflictDetails(conflicts);
      setShowConflictModal(true);
    } else {
      setSelectedDisponibility(disponibility);
      setCurrentStep(2);
    }
  };

  const continueToDetails = () => {
    if (!selectedDisponibility) {
      Alert.alert('Erreur', 'Veuillez sélectionner un créneau horaire');
      return;
    }
    setCurrentStep(2);
  };

  const handleBookSession = async () => {
    if (!selectedDisponibility || !selectedOffre) {
      Alert.alert('Erreur', 'Veuillez sélectionner un créneau et une offre');
      return;
    }

    try {
      setLoading(true);
      
      const sessionData = {
        offre_id: selectedOffre.id,
        date_heure_debut: selectedDisponibility.heure_debut,
        duree: sessionDetails.duree,
        sujet: sessionDetails.sujet || `Séance ${selectedOffre.matiere}`,
        description: sessionDetails.description,
      };

      const result = await bookSession(sessionData);
      
      if (result.success) {
        setCreatedSession(result.data.seance);
        setShowSuccessModal(true);
        
        await loadMySessions();
      } else {
        Alert.alert('Erreur', result.error || 'Impossible de réserver la séance');
      }
    } catch (error) {
      console.error('Erreur réservation séance:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors de la réservation');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredDisponibilities = disponibilities.filter(dispo => {
    if (filters.date) {
      const dispoDate = new Date(dispo.date).toDateString();
      const filterDate = new Date(filters.date).toDateString();
      if (dispoDate !== filterDate) return false;
    }
    
    if (filters.matiere && selectedOffre && selectedOffre.matiere) {
      if (!selectedOffre.matiere.toLowerCase().includes(filters.matiere.toLowerCase())) {
        return false;
      }
    }
    
    return true;
  });

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>1. Choisissez un créneau disponible</Text>
      
      <View style={styles.filtersContainer}>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowDatePicker(true)}
        >
          <Ionicons name="calendar" size={20} color="#6366f1" />
          <Text style={styles.filterText}>
            {filters.date ? formatDate(filters.date) : 'Filtrer par date'}
          </Text>
        </TouchableOpacity>
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={filters.date || new Date()}
          mode="date"
          display="default"
          minimumDate={new Date()}
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) {
              setFilters({ ...filters, date: selectedDate });
            }
          }}
        />
      )}

      {loading ? (
        <ActivityIndicator size="large" color="#6366f1" style={styles.loader} />
      ) : (
        <FlatList
          data={filteredDisponibilities}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.disponibilityCard,
                selectedDisponibility?.id === item.id && styles.selectedCard
              ]}
              onPress={() => selectDisponibility(item)}
            >
              <View style={styles.disponibilityHeader}>
                <Text style={styles.disponibilityDate}>
                  {formatDate(item.date)}
                </Text>
                <Text style={styles.disponibilityDay}>
                  {item.jour_display}
                </Text>
              </View>
              
              <View style={styles.disponibilityTime}>
                <Ionicons name="time" size={16} color="#6366f1" />
                <Text style={styles.timeText}>
                  {formatTime(item.heure_debut)} - {formatTime(item.heure_fin)}
                </Text>
              </View>
              
              <View style={styles.disponibilityStatus}>
                <View style={[styles.statusDot, { backgroundColor: '#10b981' }]} />
                <Text style={styles.statusText}>Disponible</Text>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={48} color="#9ca3af" />
              <Text style={styles.emptyText}>
                Aucun créneau disponible pour les filtres sélectionnés
              </Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {selectedDisponibility && (
        <View style={styles.footerContainer}>
          <Button
            title="Continuer vers les détails"
            onPress={continueToDetails}
            style={styles.continueButton}
          />
        </View>
      )}
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>2. Détails de la séance</Text>
      
      <Card style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <Text style={styles.summaryTitle}>Créneau sélectionné</Text>
          <TouchableOpacity
            style={styles.changeButton}
            onPress={() => setCurrentStep(1)}
          >
            <Text style={styles.changeButtonText}>Modifier</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.summaryContent}>
          <Text style={styles.summaryItem}>
            📅 {formatDate(selectedDisponibility.date)}
          </Text>
          <Text style={styles.summaryItem}>
            ⏰ {formatTime(selectedDisponibility.heure_debut)} - {formatTime(selectedDisponibility.heure_fin)}
          </Text>
        </View>
      </Card>

      <View style={styles.detailsForm}>
        <Text style={styles.formLabel}>Sujet de la séance</Text>
        <TextInput
          style={styles.textInput}
          value={sessionDetails.sujet}
          onChangeText={(text) => setSessionDetails({ ...sessionDetails, sujet: text })}
          placeholder="Ex: Révision algèbre linéaire"
          multiline
        />

        <Text style={styles.formLabel}>Description</Text>
        <TextInput
          style={[styles.textInput, styles.textArea]}
          value={sessionDetails.description}
          onChangeText={(text) => setSessionDetails({ ...sessionDetails, description: text })}
          placeholder="Décrivez ce que vous souhaitez travailler pendant cette séance..."
          multiline
          numberOfLines={4}
        />

        <View style={styles.durationContainer}>
          <Text style={styles.formLabel}>Durée (minutes)</Text>
          <View style={styles.durationButtons}>
            {[30, 60, 90, 120].map((duration) => (
              <TouchableOpacity
                key={duration}
                style={[
                  styles.durationButton,
                  sessionDetails.duree === duration && styles.selectedDuration
                ]}
                onPress={() => setSessionDetails({ ...sessionDetails, duree: duration })}
              >
                <Text style={[
                  styles.durationButtonText,
                  sessionDetails.duree === duration && styles.selectedDurationText
                ]}>
                  {duration} min
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.footerContainer}>
        <Button
          title="Réserver la séance"
          onPress={handleBookSession}
          loading={loading}
          style={styles.bookButton}
        />
      </View>
    </View>
  );

  const renderSuccessModal = () => (
    <Modal
      visible={showSuccessModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowSuccessModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.successHeader}>
            <Ionicons name="checkmark-circle" size={48} color="#10b981" />
            <Text style={styles.successTitle}>Séance réservée avec succès!</Text>
          </View>
          
          {createdSession && (
            <View style={styles.sessionSummary}>
              <Text style={styles.sessionItem}>
                📅 {formatDate(createdSession.date_heure_debut)}
              </Text>
              <Text style={styles.sessionItem}>
                ⏰ {formatTime(createdSession.date_heure_debut)}
              </Text>
              <Text style={styles.sessionItem}>
                👨‍🏫 {tutorData?.prenom} {tutorData?.nom}
              </Text>
              {createdSession.lien_visio && (
                <Text style={styles.sessionItem}>
                  🔗 {createdSession.en_ligne ? 'En ligne' : createdSession.lieu}
                </Text>
              )}
            </View>
          )}
          
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                setShowSuccessModal(false);
                navigation.navigate('MySessions');
              }}
            >
              <Text style={styles.modalButtonText}>Voir mes séances</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonSecondary]}
              onPress={() => {
                setShowSuccessModal(false);
                navigation.goBack();
              }}
            >
              <Text style={[styles.modalButtonText, styles.modalButtonTextSecondary]}>
                Retour
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderConflictModal = () => (
    <Modal
      visible={showConflictModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowConflictModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.conflictHeader}>
            <Ionicons name="warning" size={48} color="#f59e0b" />
            <Text style={styles.conflictTitle}>Conflit d'horaire détecté</Text>
          </View>
          
          <Text style={styles.conflictText}>
            Vous avez déjà une séance programmée à ce créneau:
          </Text>
          
          <View style={styles.conflictList}>
            {conflictDetails.map((session, index) => (
              <View key={index} style={styles.conflictItem}>
                <Text style={styles.conflictItemText}>
                  📅 {formatDate(session.date_heure_debut)}
                </Text>
                <Text style={styles.conflictItemText}>
                  ⏰ {formatTime(session.date_heure_debut)} - {formatTime(session.date_heure_fin)}
                </Text>
                <Text style={styles.conflictItemText}>
                  📚 {session.sujet}
                </Text>
              </View>
            ))}
          </View>
          
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setShowConflictModal(false)}
            >
              <Text style={styles.modalButtonText}>Choisir un autre créneau</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <>
      <Header 
        title="Réserver une séance" 
        showBack={true}
        rightComponent={
          <TouchableOpacity
            style={styles.mySessionsButton}
            onPress={() => setShowMySessions(!showMySessions)}
          >
            <Ionicons name="calendar-outline" size={24} color="#6366f1" />
            <Text style={styles.mySessionsCount}>
              {mySessions.length}
            </Text>
          </TouchableOpacity>
        }
      />
      
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {tutorData && (
          <Card style={styles.tutorCard}>
            <View style={styles.tutorHeader}>
              {tutorData.photo ? (
                <Image
                  source={{ uri: `${API_BASE_URL}${tutorData.photo}` }}
                  style={styles.tutorPhoto}
                />
              ) : (
                <View style={styles.tutorPhotoPlaceholder}>
                  <Ionicons name="person" size={32} color="#9ca3af" />
                </View>
              )}
              
              <View style={styles.tutorInfo}>
                <Text style={styles.tutorName}>
                  {tutorData.prenom} {tutorData.nom}
                </Text>
                <Text style={styles.tutorSubjects}>
                  {Array.isArray(tutorData.matieres_enseignees) 
                    ? tutorData.matieres_enseignees.join(', ')
                    : tutorData.matieres_enseignees
                  }
                </Text>
                <View style={styles.tutorRating}>
                  <Ionicons name="star" size={16} color="#f59e0b" />
                  <Text style={styles.ratingText}>
                    {tutorData.note_moyenne?.toFixed(1) || 'N/A'}
                  </Text>
                </View>
              </View>
            </View>
          </Card>
        )}

        <View style={styles.progressContainer}>
          <View style={styles.progressSteps}>
            <View style={[
              styles.progressStep,
              currentStep >= 1 && styles.activeStep
            ]}>
              <Text style={[
                styles.progressStepText,
                currentStep >= 1 && styles.activeStepText
              ]}>
                1
              </Text>
            </View>
            <View style={[
              styles.progressLine,
              currentStep >= 2 && styles.activeProgressLine
            ]} />
            <View style={[
              styles.progressStep,
              currentStep >= 2 && styles.activeStep
            ]}>
              <Text style={[
                styles.progressStepText,
                currentStep >= 2 && styles.activeStepText
              ]}>
                2
              </Text>
            </View>
          </View>
          <View style={styles.progressLabels}>
            <Text style={styles.progressLabel}>Créneau</Text>
            <Text style={styles.progressLabel}>Détails</Text>
          </View>
        </View>

        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}

        {showMySessions && (
          <Card style={styles.mySessionsCard}>
            <View style={styles.mySessionsHeader}>
              <Text style={styles.mySessionsTitle}>Mes séances à venir</Text>
              <TouchableOpacity
                onPress={() => setShowMySessions(false)}
              >
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            
            {mySessions.length === 0 ? (
              <Text style={styles.noSessionsText}>Aucune séance programmée</Text>
            ) : (
              mySessions.map((session, index) => (
                <View key={session.id} style={styles.sessionCard}>
                  <Text style={styles.sessionSubject}>{session.sujet}</Text>
                  <Text style={styles.sessionDateTime}>
                    {formatDate(session.date_heure_debut)} à {formatTime(session.date_heure_debut)}
                  </Text>
                  <View style={[styles.sessionStatus, { 
                    backgroundColor: session.statut === 'confirmee' ? '#10b981' : '#f59e0b' 
                  }]}>
                    <Text style={styles.sessionStatusText}>
                      {session.statut === 'confirmee' ? 'Confirmée' : 'Planifiée'}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </Card>
        )}
      </ScrollView>

      {renderSuccessModal()}
      {renderConflictModal()}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  progressContainer: {
    backgroundColor: '#ffffff',
    padding: 20,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  progressSteps: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  progressStep: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeStep: {
    backgroundColor: '#6366f1',
  },
  progressStepText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  activeStepText: {
    color: '#ffffff',
  },
  progressLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 8,
  },
  activeProgressLine: {
    backgroundColor: '#6366f1',
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  progressLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  tutorCard: {
    margin: 16,
    padding: 16,
  },
  tutorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tutorPhoto: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  tutorPhotoPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tutorInfo: {
    flex: 1,
    marginLeft: 12,
  },
  tutorName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  tutorSubjects: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  tutorRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  ratingText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 4,
  },
  stepContainer: {
    padding: 16,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  filtersContainer: {
    marginBottom: 16,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  filterText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
  },
  disponibilityCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedCard: {
    borderColor: '#6366f1',
    backgroundColor: '#f0f9ff',
  },
  disponibilityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  disponibilityDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  disponibilityDay: {
    fontSize: 14,
    color: '#6b7280',
  },
  disponibilityTime: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  timeText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 4,
  },
  disponibilityStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#6b7280',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 12,
  },
  loader: {
    marginTop: 40,
  },
  footerContainer: {
    paddingTop: 20,
    paddingBottom: 40,
  },
  continueButton: {
    backgroundColor: '#6366f1',
  },
  bookButton: {
    backgroundColor: '#10b981',
  },
  summaryCard: {
    marginBottom: 20,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  changeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f3f4f6',
    borderRadius: 6,
  },
  changeButtonText: {
    fontSize: 12,
    color: '#6366f1',
    fontWeight: '500',
  },
  summaryContent: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
  },
  summaryItem: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
  },
  detailsForm: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
    marginBottom: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  durationContainer: {
    marginBottom: 16,
  },
  durationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  durationButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  selectedDuration: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  durationButtonText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  selectedDurationText: {
    color: '#ffffff',
  },
  mySessionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  mySessionsCount: {
    fontSize: 12,
    color: '#6366f1',
    fontWeight: '600',
    marginLeft: 4,
  },
  mySessionsCard: {
    margin: 16,
    padding: 16,
  },
  mySessionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  mySessionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  noSessionsText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    padding: 20,
  },
  sessionCard: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  sessionSubject: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  sessionDateTime: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  sessionStatus: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sessionStatusText: {
    fontSize: 10,
    color: '#ffffff',
    fontWeight: '500',
  },
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
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  successHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    marginTop: 12,
  },
  sessionSummary: {
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  sessionItem: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
  },
  conflictHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  conflictTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    marginTop: 12,
  },
  conflictText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  conflictList: {
    backgroundColor: '#fef3c7',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  conflictItem: {
    marginBottom: 8,
  },
  conflictItemText: {
    fontSize: 12,
    color: '#92400e',
  },
  modalActions: {
    gap: 12,
  },
  modalButton: {
    backgroundColor: '#6366f1',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonSecondary: {
    backgroundColor: '#f3f4f6',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
  },
  modalButtonTextSecondary: {
    color: '#6b7280',
  },
});

export default TutorSessionBookingScreen;
