import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import Header from '../../components/ui/Header';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { API_BASE_URL } from '../../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import DateTimePicker from '@react-native-community/datetimepicker';

const BookingSession = ({ route, navigation }) => {
  const { tutorId, tutor } = route.params;
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [bookingDetails, setBookingDetails] = useState({
    matiere: '',
    date: '',
    heure: '',
    duree: 1,
    lieu: '',
    type: 'individuel',
    description: '',
    tarif: tutor.tarif || 0
  });
  const [disponibilites, setDisponibilites] = useState([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  
  useEffect(() => {
    loadTutorDisponibilites();
  }, [tutorId]);
  
  // Charger les disponibilités du tuteur
  const loadTutorDisponibilites = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}/api/tutorat/tuteurs/${tutorId}/disponibilites/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setDisponibilites(data);
        console.log('Disponibilités tuteur:', data);
      }
    } catch (error) {
      console.error('Erreur chargement disponibilités:', error);
    }
  };
  
  // Réserver la séance
  const bookSession = async () => {
    // Validation
    if (!bookingDetails.matiere || bookingDetails.matiere.trim() === '') {
      Alert.alert('Erreur', 'Veuillez saisir une matière');
      return;
    }
    
    if (!bookingDetails.date) {
      Alert.alert('Erreur', 'Veuillez sélectionner une date');
      return;
    }
    
    if (!bookingDetails.heure) {
      Alert.alert('Erreur', 'Veuillez sélectionner une heure');
      return;
    }
    
    if (!bookingDetails.lieu) {
      Alert.alert('Erreur', 'Veuillez spécifier le lieu');
      return;
    }
    
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('accessToken');
      
      const bookingData = {
        tuteur: tutorId,
        sujet: bookingDetails.matiere,
        date_heure_debut: `${bookingDetails.date}T${bookingDetails.heure}:00`,
        date_heure_fin: `${bookingDetails.date}T${parseInt(bookingDetails.heure) + Math.floor(bookingDetails.duree)}:00`,
        duree: bookingDetails.duree * 60, // Convertir en minutes
        lieu: bookingDetails.lieu,
        description: bookingDetails.description,
        en_ligne: bookingDetails.lieu === '' || bookingDetails.lieu.toLowerCase().includes('en ligne'),
        statut: 'planifiee'
        // etudiants sera ajouté automatiquement par perform_create
      };
      
      const response = await fetch(`${API_BASE_URL}/api/tutorat/seances/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData),
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Séance réservée:', data);
        setShowSuccess(true);
        
        // Envoyer une notification au tuteur
        await sendNotificationToTutor(data.id);
      } else {
        const errorData = await response.json();
        Alert.alert('Erreur', errorData.message || 'Impossible de réserver la séance');
      }
    } catch (error) {
      console.error('Erreur réservation:', error);
      Alert.alert('Erreur', 'Impossible de réserver la séance');
    } finally {
      setLoading(false);
    }
  };
  
  // Envoyer une notification au tuteur
  const sendNotificationToTutor = async (seanceId) => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      
      const notificationData = {
        destinataire: tutorId,
        titre: 'Nouvelle demande de séance',
        message: `${user.prenom} ${user.nom} souhaite réserver une séance de ${bookingDetails.matiere}`,
        type: 'demande_seance',
        seance_id: seanceId,
        priorite: 'normale'
      };
      
      await fetch(`${API_BASE_URL}/api/notifications/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notificationData),
      });
    } catch (error) {
      console.error('Erreur envoi notification:', error);
    }
  };
  
  // Sélectionner une date
  const selectDate = (date) => {
    setBookingDetails({...bookingDetails, date: date.toISOString().split('T')[0]});
    setShowDatePicker(false);
  };
  
  // Sélectionner une heure
  const selectTime = (hour) => {
    setBookingDetails({...bookingDetails, heure: hour});
    setShowTimePicker(false);
  };
  
  // Calculer le prix total
  const calculateTotalPrice = () => {
    return bookingDetails.tarif * bookingDetails.duree;
  };
  
  if (showSuccess) {
    return (
      <Modal visible={showSuccess} transparent>
        <View style={styles.successModal}>
          <View style={styles.successContent}>
            <Ionicons name="checkmark-circle" size={60} color="#28a745" />
            <Text style={styles.successTitle}>Séance réservée avec succès!</Text>
            <Text style={styles.successMessage}>
              Votre demande a été envoyée à {tutor.prenom} {tutor.nom}
            </Text>
            <Text style={styles.successSubMessage}>
              Vous recevrez une confirmation dès que le tuteur acceptera la séance
            </Text>
            
            <View style={styles.successActions}>
              <TouchableOpacity 
                style={styles.successButton}
                onPress={() => navigation.navigate('StudentMessages', { tuteurId })}
              >
                <Text style={styles.successButtonText}>Contacter le tuteur</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.successButton, styles.successSecondaryButton]}
                onPress={() => navigation.navigate('StudentDashboard')}
              >
                <Text style={styles.successSecondaryButtonText}>Retour au tableau de bord</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  }
  
  return (
    <>
      <Header title="Réserver une séance" showBack={true} />
      
      <ScrollView style={styles.container}>
        {/* Informations du tuteur */}
        <Card style={styles.tutorCard}>
          <View style={styles.tutorInfo}>
            <View style={styles.tutorPhotoContainer}>
              {tutor.photo ? (
                <Image source={{ uri: tutor.photo.startsWith('http') ? tutor.photo : `${API_BASE_URL}${tutor.photo}` }} style={styles.tutorPhoto} />
              ) : (
                <View style={styles.tutorPhotoPlaceholder}>
                  <Ionicons name="person" size={30} color="#999" />
                </View>
              )}
            </View>
            
            <View style={styles.tutorDetails}>
              <Text style={styles.tutorName}>{tutor.prenom} {tutor.nom}</Text>
              <Text style={styles.tutorSubjects}>
                {Array.isArray(tutor.matieres_enseignees) 
                  ? tutor.matieres_enseignees.join(', ')
                  : tutor.matieres_enseignees || ''
                }
              </Text>
              <Text style={styles.tutorPrice}>{tutor.tarif} FCFA/heure</Text>
            </View>
          </View>
        </Card>
        
        {/* Formulaire de réservation */}
        <Card style={styles.formCard}>
          <Text style={styles.formTitle}>Détails de la séance</Text>
          
          {/* Matière */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Matière *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Mathématiques, Physique, Chimie..."
              value={bookingDetails.matiere}
              onChangeText={(text) => setBookingDetails({...bookingDetails, matiere: text})}
            />
          </View>
          
          {/* Date et heure */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Date et heure *</Text>
            <View style={styles.dateTimeContainer}>
              <TouchableOpacity 
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Ionicons name="calendar" size={20} color="#007AFF" />
                <Text style={styles.dateButtonText}>
                  {bookingDetails.date || 'Sélectionner une date'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.timeButton}
                onPress={() => setShowTimePicker(true)}
              >
                <Ionicons name="time" size={20} color="#007AFF" />
                <Text style={styles.timeButtonText}>
                  {bookingDetails.heure || 'Sélectionner une heure'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Durée */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Durée (heures)</Text>
            <View style={styles.durationContainer}>
              <TouchableOpacity 
                style={styles.durationButton}
                onPress={() => setBookingDetails({...bookingDetails, duree: Math.max(1, bookingDetails.duree - 1)})}
              >
                <Ionicons name="remove" size={20} color="#007AFF" />
              </TouchableOpacity>
              
              <Text style={styles.durationText}>{bookingDetails.duree}h</Text>
              
              <TouchableOpacity 
                style={styles.durationButton}
                onPress={() => setBookingDetails({...bookingDetails, duree: bookingDetails.duree + 1})}
              >
                <Ionicons name="add" size={20} color="#007AFF" />
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Lieu */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Lieu *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Bibliothèque universitaire, En ligne..."
              value={bookingDetails.lieu}
              onChangeText={(text) => setBookingDetails({...bookingDetails, lieu: text})}
            />
          </View>
          
          {/* Type de séance */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Type de séance</Text>
            <View style={styles.typeContainer}>
              <TouchableOpacity
                style={[styles.typeOption, bookingDetails.type === 'individuel' && styles.typeOptionActive]}
                onPress={() => setBookingDetails({...bookingDetails, type: 'individuel'})}
              >
                <Text style={styles.typeOptionText}>Individuel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.typeOption, bookingDetails.type === 'groupe' && styles.typeOptionActive]}
                onPress={() => setBookingDetails({...bookingDetails, type: 'groupe'})}
              >
                <Text style={styles.typeOptionText}>Groupe</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Description */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Description (optionnel)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Décrivez vos besoins spécifiques..."
              value={bookingDetails.description}
              onChangeText={(text) => setBookingDetails({...bookingDetails, description: text})}
              multiline
              numberOfLines={4}
            />
          </View>
          
          {/* Récapitulatif du prix */}
          <View style={styles.priceSummary}>
            <Text style={styles.priceLabel}>Tarif horaire: {bookingDetails.tarif} FCFA</Text>
            <Text style={styles.priceLabel}>Durée: {bookingDetails.duree}h</Text>
            <Text style={styles.totalPrice}>Total: {calculateTotalPrice()} FCFA</Text>
          </View>
        </Card>
        
        {/* Disponibilités du tuteur */}
        {disponibilites.length > 0 && (
          <Card style={styles.disponibilityCard}>
            <Text style={styles.disponibilityTitle}>Disponibilités du tuteur</Text>
            <View style={styles.disponibilityList}>
              {disponibilites.map((dispo, index) => (
                <View key={index} style={styles.disponibilityItem}>
                  <Text style={styles.disponibilityDay}>{dispo.jour}</Text>
                  <Text style={styles.disponibilityHours}>{dispo.heures}</Text>
                </View>
              ))}
            </View>
          </Card>
        )}
        
        {/* Bouton de réservation */}
        <View style={styles.actionContainer}>
          <TouchableOpacity 
            style={[styles.actionButton, loading && styles.actionButtonDisabled]}
            onPress={bookSession}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="calendar" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>Réserver la séance</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
      
      {/* Modal de sélection de date */}
      <Modal visible={showDatePicker} transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Sélectionner une date</Text>
            <DateTimePicker
              value={bookingDetails.date ? new Date(bookingDetails.date) : new Date()}
              mode="date"
              display="default"
              minimumDate={new Date()}
              onChange={(event, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) {
                  selectDate(selectedDate);
                }
              }}
            />
            <TouchableOpacity 
              style={styles.modalButton}
              onPress={() => setShowDatePicker(false)}
            >
              <Text style={styles.modalButtonText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      
      {/* Modal de sélection d'heure */}
      <Modal visible={showTimePicker} transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Sélectionner une heure</Text>
            <View style={styles.timeGrid}>
              {Array.from({length: 14}, (_, i) => i + 8).map((hour) => (
                <TouchableOpacity
                  key={hour}
                  style={styles.timeOption}
                  onPress={() => selectTime(hour)}
                >
                  <Text style={styles.timeOptionText}>{hour}:00</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity 
              style={styles.modalButton}
              onPress={() => setShowTimePicker(false)}
            >
              <Text style={styles.modalButtonText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  
  // Carte tuteur
  tutorCard: {
    margin: 16,
    padding: 16,
  },
  tutorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tutorPhotoContainer: {
    marginRight: 12,
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
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  tutorDetails: {
    flex: 1,
  },
  tutorName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  tutorSubjects: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  tutorPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#28a745',
  },
  
  // Formulaire
  formCard: {
    margin: 16,
    padding: 20,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  dateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
  },
  timeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  timeButtonText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  durationText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginHorizontal: 20,
  },
  input: {
    height: 50,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  typeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  typeOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  typeOptionActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  typeOptionText: {
    fontSize: 16,
    color: '#333',
  },
  priceSummary: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    marginTop: 20,
  },
  priceLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  totalPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#28a745',
    marginTop: 8,
  },
  
  // Disponibilités
  disponibilityCard: {
    margin: 16,
    padding: 20,
  },
  disponibilityTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  disponibilityList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  disponibilityItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginRight: 8,
    marginBottom: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  disponibilityDay: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  disponibilityHours: {
    fontSize: 12,
    color: '#666',
  },
  
  // Actions
  actionContainer: {
    margin: 16,
    marginTop: 20,
  },
  actionButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
  },
  actionButtonDisabled: {
    backgroundColor: '#ccc',
  },
  actionButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  
  // Modal succès
  successModal: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    margin: 20,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#28a745',
    marginTop: 16,
    marginBottom: 12,
  },
  successMessage: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  successSubMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  successActions: {
    gap: 12,
  },
  successButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 200,
    alignItems: 'center',
  },
  successButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
  successSecondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  successSecondaryButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  
  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    margin: 20,
    minWidth: 300,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  modalButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  timeOption: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    minWidth: 60,
    alignItems: 'center',
  },
  timeOptionText: {
    fontSize: 14,
    color: '#333',
  },
});

export default BookingSession;
