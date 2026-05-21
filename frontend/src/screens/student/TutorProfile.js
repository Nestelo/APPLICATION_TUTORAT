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
  Image,
  Modal,
  Linking,
} from 'react-native';
import Header from '../../components/ui/Header';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { API_BASE_URL } from '../../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';

const TutorProfile = ({ route, navigation }) => {
  const { tutorId } = route.params;
  const { user } = useAuth();
  
  const [tutor, setTutor] = useState(null);
  const [evaluations, setEvaluations] = useState([]);
  const [seances, setSeances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingEvaluations, setLoadingEvaluations] = useState(false);
  
  useEffect(() => {
    loadTutorProfile();
    loadTutorEvaluations();
    loadTutorSeances();
  }, [tutorId]);
  
  // Charger le profil du tuteur
  const loadTutorProfile = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}/api/tutorat/tuteurs/${tutorId}/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setTutor(data);
        console.log('Profil tuteur:', data);
      } else {
        Alert.alert('Erreur', 'Impossible de charger le profil du tuteur');
      }
    } catch (error) {
      console.error('Erreur chargement profil tuteur:', error);
      Alert.alert('Erreur', 'Impossible de charger le profil du tuteur');
    } finally {
      setLoading(false);
    }
  };
  
  // Charger les évaluations du tuteur
  const loadTutorEvaluations = async () => {
    try {
      setLoadingEvaluations(true);
      const token = await AsyncStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}/api/tutorat/tuteurs/${tutorId}/evaluations/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setEvaluations(data);
        console.log('Évaluations tuteur:', data);
      }
    } catch (error) {
      console.error('Erreur chargement évaluations:', error);
    } finally {
      setLoadingEvaluations(false);
    }
  };
  
  // Charger les séances du tuteur
  const loadTutorSeances = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}/api/tutorat/tuteurs/${tutorId}/seances/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSeances(data);
        console.log('Séances tuteur:', data);
      }
    } catch (error) {
      console.error('Erreur chargement séances:', error);
    }
  };
  
  // Contacter le tuteur
  const contactTutor = () => {
    navigation.navigate('StudentMessages', { 
      tuteurId: tutor.id, 
      tuteurName: `${tutor.prenom} ${tutor.nom}` 
    });
  };
  
  // Réserver une séance
  const bookSession = () => {
    navigation.navigate('BookingSession', { 
      tutorId: tutor.id, 
      tutor: tutor 
    });
  };
  
  // Évaluer le tuteur
  const evaluateTutor = () => {
    navigation.navigate('EvaluateTutor', { 
      tutorId: tutor.id, 
      tutor: tutor 
    });
  };
  
  // Afficher le calendrier
  const showCalendar = () => {
    navigation.navigate('TutorCalendar', { 
      tutorId: tutor.id, 
      tutor: tutor 
    });
  };
  
  if (loading) {
    return (
      <>
        <Header title="Profil du tuteur" showBack={true} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Chargement du profil...</Text>
        </View>
      </>
    );
  }
  
  if (!tutor) {
    return (
      <>
        <Header title="Profil du tuteur" showBack={true} />
        <View style={styles.errorContainer}>
          <Ionicons name="person-off-outline" size={40} color="#999" />
          <Text style={styles.errorText}>Profil non trouvé</Text>
        </View>
      </>
    );
  }
  
  return (
    <>
      <Header title="Profil du tuteur" showBack={true} />
      <ScrollView style={styles.container}>
        {/* En-tête du profil */}
        <Card style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.profilePhotoContainer}>
              {tutor.photo ? (
                <Image source={{ uri: tutor.photo.startsWith('http') ? tutor.photo : `${API_BASE_URL}${tutor.photo}` }} style={styles.profilePhoto} />
              ) : (
                <View style={styles.profilePhotoPlaceholder}>
                  <Ionicons name="person" size={40} color="#999" />
                </View>
              )}
            </View>
            
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{tutor.prenom} {tutor.nom}</Text>
              <Text style={styles.profileTitle}>{tutor.titre || 'Tuteur'}</Text>
              
              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={20} color="#ffc107" />
                <Text style={styles.ratingText}>{tutor.note_moyenne?.toFixed(1) || 'N/A'}/5</Text>
                <Text style={styles.evaluationsText}>({tutor.nombre_evaluations || 0} évaluations)</Text>
              </View>
              
              <Text style={styles.profilePrice}>
                {tutor.tarif ? `${tutor.tarif} FCFA/heure` : 'Gratuit'}
              </Text>
            </View>
            
            <View style={styles.profileActions}>
              <TouchableOpacity style={styles.actionButton} onPress={contactTutor}>
                <Ionicons name="mail" size={20} color="#007AFF" />
                <Text style={styles.actionText}>Contacter</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.actionButton} onPress={bookSession}>
                <Ionicons name="calendar" size={20} color="#007AFF" />
                <Text style={styles.actionText}>Réserver</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Card>
        
        {/* Biographie */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Biographie</Text>
          <Text style={styles.biographyText}>
            {tutor.biographie || 'Aucune biographie disponible'}
          </Text>
        </Card>
        
        {/* Matières enseignées */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Matières enseignées</Text>
          <View style={styles.subjectsList}>
            {tutor.matieres_enseignees?.map((matiere, index) => (
              <View key={index} style={styles.subjectItem}>
                <Text style={styles.subjectText}>{matiere}</Text>
              </View>
            )) || <Text style={styles.noSubjectText}>Aucune matière spécifiée</Text>}
          </View>
        </Card>
        
        {/* Niveaux d'enseignement */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Niveaux d'enseignement</Text>
          <View style={styles.levelsList}>
            {tutor.niveaux_enseignement?.map((niveau, index) => (
              <View key={index} style={styles.levelItem}>
                <Text style={styles.levelText}>{niveau}</Text>
              </View>
            )) || <Text style={styles.noLevelText}>Aucun niveau spécifié</Text>}
          </View>
        </Card>
        
        {/* Disponibilités */}
        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Disponibilités</Text>
            <TouchableOpacity style={styles.viewCalendarButton} onPress={showCalendar}>
              <Text style={styles.viewCalendarText}>Voir calendrier</Text>
              <Ionicons name="calendar" size={16} color="#007AFF" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.disponibilitiesList}>
            {tutor.disponibilites?.map((dispo, index) => (
              <View key={index} style={styles.disponibilityItem}>
                <Text style={styles.disponibilityDay}>{dispo.jour}:</Text>
                <Text style={styles.disponibilityHours}>{dispo.heures}</Text>
              </View>
            )) || <Text style={styles.noDisponibilityText}>Aucune disponibilité spécifiée</Text>}
          </View>
        </Card>
        
        {/* Badges et certifications */}
        {tutor.badges && tutor.badges.length > 0 && (
          <Card style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Badges et certifications</Text>
            <View style={styles.badgesList}>
              {tutor.badges.map((badge, index) => (
                <View key={index} style={[styles.badgeItem, { backgroundColor: badge.couleur || '#007AFF' }]}>
                  <Ionicons name={badge.icone || 'trophy'} size={20} color="#fff" />
                  <Text style={styles.badgeText}>{badge.nom}</Text>
                </View>
              ))}
            </View>
          </Card>
        )}
        
        {/* Statistiques */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Statistiques</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{tutor.nombre_seances || 0}</Text>
              <Text style={styles.statLabel}>Séances réalisées</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{tutor.nombre_etudiants || 0}</Text>
              <Text style={styles.statLabel}>Étudiants accompagnés</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{tutor.taux_reussite?.toFixed(1) || 'N/A'}%</Text>
              <Text style={styles.statLabel}>Taux de réussite</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{tutor.experience_ans || 0}</Text>
              <Text style={styles.statLabel}>Années d'expérience</Text>
            </View>
          </View>
        </Card>
        
        {/* Évaluations récentes */}
        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Évaluations récentes</Text>
            <TouchableOpacity style={styles.viewAllButton} onPress={loadTutorEvaluations}>
              <Text style={styles.viewAllText}>Voir tout</Text>
            </TouchableOpacity>
          </View>
          
          {loadingEvaluations ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#007AFF" />
              <Text style={styles.loadingText}>Chargement des évaluations...</Text>
            </View>
          ) : evaluations.length === 0 ? (
            <Text style={styles.noEvaluationsText}>Aucune évaluation pour le moment</Text>
          ) : (
            evaluations.slice(0, 3).map((evaluation, index) => (
              <View key={index} style={styles.evaluationItem}>
                <View style={styles.evaluationHeader}>
                  <Text style={styles.evaluationAuthor}>{evaluation.eleve_nom}</Text>
                  <View style={styles.evaluationRating}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Ionicons 
                        key={star}
                        name={star <= evaluation.note ? "star" : "star-outline"} 
                        size={16} 
                        color={star <= evaluation.note ? "#ffc107" : "#ddd"} 
                      />
                    ))}
                  </View>
                </View>
                <Text style={styles.evaluationComment}>{evaluation.commentaire}</Text>
                <Text style={styles.evaluationDate}>
                  {new Date(evaluation.date_evaluation).toLocaleDateString('fr-FR')}
                </Text>
              </View>
            ))
          )}
          
          {evaluations.length > 3 && (
            <TouchableOpacity style={styles.seeMoreButton} onPress={loadTutorEvaluations}>
              <Text style={styles.seeMoreText}>Voir plus d'évaluations</Text>
            </TouchableOpacity>
          )}
        </Card>
        
        {/* Séances à venir */}
        {seances.length > 0 && (
          <Card style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Séances à venir</Text>
              <TouchableOpacity style={styles.viewAllButton}>
                <Text style={styles.viewAllText}>Voir tout</Text>
              </TouchableOpacity>
            </View>
            
            {seances.slice(0, 3).map((seance, index) => (
              <View key={index} style={styles.sessionItem}>
                <View style={styles.sessionHeader}>
                  <Text style={styles.sessionSubject}>{seance.matiere}</Text>
                  <Text style={styles.sessionPrice}>{seance.tarif} FCFA</Text>
                </View>
                <Text style={styles.sessionDateTime}>
                  {new Date(seance.date_heure_debut).toLocaleString('fr-FR')}
                </Text>
                <Text style={styles.sessionLocation}>{seance.lieu}</Text>
              </View>
            ))}
          </Card>
        )}
        
        {/* Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.primaryActionButton} onPress={contactTutor}>
            <Ionicons name="mail" size={20} color="#fff" />
            <Text style={styles.primaryActionText}>Envoyer un message</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.secondaryActionButton} onPress={bookSession}>
            <Ionicons name="calendar" size={20} color="#007AFF" />
            <Text style={styles.secondaryActionText}>Réserver une séance</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.tertiaryActionButton} onPress={evaluateTutor}>
            <Ionicons name="star" size={20} color="#007AFF" />
            <Text style={styles.tertiaryActionText}>Évaluer</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  
  // États de chargement
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
  },
  
  // Carte de profil
  profileCard: {
    margin: 16,
    padding: 20,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  profilePhotoContainer: {
    marginRight: 16,
  },
  profilePhoto: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  profilePhotoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  profileTitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 4,
  },
  evaluationsText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  profilePrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#28a745',
  },
  profileActions: {
    flexDirection: 'row',
    marginTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
  },
  actionText: {
    fontSize: 14,
    color: '#007AFF',
    marginLeft: 4,
  },
  
  // Sections
  sectionCard: {
    margin: 16,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewCalendarButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewCalendarText: {
    fontSize: 14,
    color: '#007AFF',
    marginRight: 4,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 14,
    color: '#007AFF',
  },
  
  // Biographie
  biographyText: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  
  // Matières
  subjectsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  subjectItem: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  subjectText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  noSubjectText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  
  // Niveaux
  levelsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  levelItem: {
    backgroundColor: '#f0f8ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  levelText: {
    fontSize: 14,
    color: '#0066cc',
    fontWeight: '500',
  },
  noLevelText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  
  // Disponibilités
  disponibilitesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  disponibilityItem: {
    flexDirection: 'row',
    marginRight: 16,
    marginBottom: 8,
  },
  disponibilityDay: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginRight: 4,
  },
  disponibilityHours: {
    fontSize: 14,
    color: '#666',
  },
  noDisponibilityText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  
  // Badges
  badgesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  badgeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  badgeText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 4,
  },
  
  // Statistiques
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  statItem: {
    width: '50%',
    alignItems: 'center',
    marginBottom: 20,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  
  // Évaluations
  evaluationItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  evaluationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  evaluationAuthor: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  evaluationRating: {
    flexDirection: 'row',
  },
  evaluationComment: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  evaluationDate: {
    fontSize: 12,
    color: '#999',
  },
  noEvaluationsText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  seeMoreButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  seeMoreText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  
  // Séances
  sessionItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sessionSubject: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  sessionPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#28a745',
  },
  sessionDateTime: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  sessionLocation: {
    fontSize: 14,
    color: '#666',
  },
  
  // Actions
  actionsContainer: {
    margin: 16,
    gap: 12,
  },
  primaryActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 8,
  },
  primaryActionText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  secondaryActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  secondaryActionText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  tertiaryActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  tertiaryActionText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default TutorProfile;
