import React, { useState } from 'react';
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
} from 'react-native';
import Header from '../../components/ui/Header';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { API_BASE_URL } from '../../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';

const EvaluateTutor = ({ route, navigation }) => {
  const { tutorId, tutor } = route.params;
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [evaluation, setEvaluation] = useState({
    note: 0,
    commentaire: '',
    points_forts: '',
    points_amelioration: '',
    recommanderait: false,
    seance_id: null
  });
  const [seances, setSeances] = useState([]);
  const [showSeanceSelector, setShowSeanceSelector] = useState(false);
  
  // Évaluer le tuteur
  const submitEvaluation = async () => {
    // Validation
    if (evaluation.note === 0) {
      Alert.alert('Erreur', 'Veuillez sélectionner une note');
      return;
    }
    
    if (!evaluation.commentaire.trim()) {
      Alert.alert('Erreur', 'Veuillez laisser un commentaire');
      return;
    }
    
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('accessToken');
      
      const evaluationData = {
        tuteur: tutorId,
        etudiant: user.id,
        note: evaluation.note,
        commentaire: evaluation.commentaire,
        points_forts: evaluation.points_forts,
        points_amelioration: evaluation.points_amelioration,
        recommanderait: evaluation.recommanderait,
        seance: evaluation.seance_id
      };
      
      const response = await fetch(`${API_BASE_URL}/api/tutorat/evaluations/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(evaluationData),
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Évaluation soumise:', data);
        setShowSuccess(true);
        
        // Mettre à jour la note moyenne du tuteur
        await updateTutorRating();
      } else {
        const errorData = await response.json();
        Alert.alert('Erreur', errorData.message || 'Impossible de soumettre l\'évaluation');
      }
    } catch (error) {
      console.error('Erreur évaluation:', error);
      Alert.alert('Erreur', 'Impossible de soumettre l\'évaluation');
    } finally {
      setLoading(false);
    }
  };
  
  // Mettre à jour la note moyenne du tuteur
  const updateTutorRating = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      await fetch(`${API_BASE_URL}/api/tutorat/tuteurs/${tutorId}/update-rating/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.error('Erreur mise à jour note:', error);
    }
  };
  
  // Charger les séances de l'étudiant avec ce tuteur
  const loadSeances = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}/api/tutorat/seances/etudiant-tuteur/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tuteur_id: tutorId,
          etudiant_id: user.id
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setSeances(data.filter(s => s.statut === 'terminee'));
        console.log('Séances terminées:', data);
      }
    } catch (error) {
      console.error('Erreur chargement séances:', error);
    }
  };
  
  // Sélectionner une étoile
  const selectStar = (rating) => {
    setEvaluation({...evaluation, note: rating});
  };
  
  // Sélectionner une séance
  const selectSeance = (seance) => {
    setEvaluation({...evaluation, seance_id: seance.id});
    setShowSeanceSelector(false);
  };
  
  // Rendu des étoiles
  const renderStars = () => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => selectStar(star)}
          >
            <Ionicons 
              name={star <= evaluation.note ? "star" : "star-outline"} 
              size={40} 
              color={star <= evaluation.note ? "#ffc107" : "#ddd"} 
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };
  
  if (showSuccess) {
    return (
      <Modal visible={showSuccess} transparent>
        <View style={styles.successModal}>
          <View style={styles.successContent}>
            <Ionicons name="checkmark-circle" size={60} color="#28a745" />
            <Text style={styles.successTitle}>Évaluation envoyée!</Text>
            <Text style={styles.successMessage}>
              Merci d'avoir évalué {tutor.prenom} {tutor.nom}
            </Text>
            <Text style={styles.successSubMessage}>
              Votre avis aide à améliorer la qualité du tutorat
            </Text>
            
            <View style={styles.successActions}>
              <TouchableOpacity 
                style={styles.successButton}
                onPress={() => navigation.navigate('TutorProfile', { tutorId: tutorId })}
              >
                <Text style={styles.successButtonText}>Voir le profil</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.successButton, styles.successSecondaryButton]}
                onPress={() => navigation.navigate('FindTutor')}
              >
                <Text style={styles.successSecondaryButtonText}>Trouver un autre tuteur</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  }
  
  return (
    <>
      <Header title="Évaluer le tuteur" showBack={true} />
      
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
        
        {/* Sélection de la séance */}
        <Card style={styles.seanceCard}>
          <View style={styles.seanceHeader}>
            <Text style={styles.seanceTitle}>Séance évaluée</Text>
            <TouchableOpacity 
              style={styles.selectSeanceButton}
              onPress={() => {
                loadSeances();
                setShowSeanceSelector(true);
              }}
            >
              <Text style={styles.selectSeanceText}>
                {evaluation.seance_id ? 'Changer' : 'Sélectionner'}
              </Text>
            </TouchableOpacity>
          </View>
          
          {evaluation.seance_id ? (
            <View style={styles.selectedSeance}>
              <Ionicons name="checkmark-circle" size={20} color="#28a745" />
              <Text style={styles.selectedSeanceText}>Séance sélectionnée</Text>
            </View>
          ) : (
            <Text style={styles.noSeanceText}>Sélectionnez la séance à évaluer</Text>
          )}
        </Card>
        
        {/* Formulaire d'évaluation */}
        <Card style={styles.formCard}>
          <Text style={styles.formTitle}>Votre évaluation</Text>
          
          {/* Note */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Note globale *</Text>
            {renderStars()}
            <Text style={styles.noteText}>
              {evaluation.note > 0 ? `${evaluation.note}/5` : 'Sélectionnez une note'}
            </Text>
          </View>
          
          {/* Commentaire */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Commentaire détaillé *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Décrivez votre expérience avec ce tuteur..."
              value={evaluation.commentaire}
              onChangeText={(text) => setEvaluation({...evaluation, commentaire: text})}
              multiline
              numberOfLines={4}
            />
          </View>
          
          {/* Points forts */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Points forts</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Qu'est-ce que vous avez particulièrement apprécié ?"
              value={evaluation.points_forts}
              onChangeText={(text) => setEvaluation({...evaluation, points_forts: text})}
              multiline
              numberOfLines={3}
            />
          </View>
          
          {/* Points d'amélioration */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Points d'amélioration</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Qu'est-ce qui pourrait être amélioré ?"
              value={evaluation.points_amelioration}
              onChangeText={(text) => setEvaluation({...evaluation, points_amelioration: text})}
              multiline
              numberOfLines={3}
            />
          </View>
          
          {/* Recommandation */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Recommanderiez-vous ce tuteur ?</Text>
            <View style={styles.recommendationContainer}>
              <TouchableOpacity
                style={[styles.recommendationOption, !evaluation.recommanderait && styles.recommendationOptionActive]}
                onPress={() => setEvaluation({...evaluation, recommanderait: true})}
              >
                <Ionicons 
                  name={evaluation.recommanderait ? "checkmark-circle" : "ellipse-outline"} 
                  size={20} 
                  color={evaluation.recommanderait ? "#28a745" : "#666"} 
                />
                <Text style={styles.recommendationText}>Oui, je le recommande</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.recommendationOption, evaluation.recommanderait && styles.recommendationOptionActive]}
                onPress={() => setEvaluation({...evaluation, recommanderait: false})}
              >
                <Ionicons 
                  name={!evaluation.recommanderait ? "checkmark-circle" : "ellipse-outline"} 
                  size={20} 
                  color={!evaluation.recommanderait ? "#28a745" : "#666"} 
                />
                <Text style={styles.recommendationText}>Non</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Card>
        
        {/* Guide d'évaluation */}
        <Card style={styles.guideCard}>
          <Text style={styles.guideTitle}>Guide d'évaluation</Text>
          
          <View style={styles.ratingGuide}>
            <View style={styles.ratingItem}>
              <Text style={styles.ratingNumber}>5</Text>
              <Text style={styles.ratingDescription}>Excellent - Dépasse les attentes</Text>
            </View>
            
            <View style={styles.ratingItem}>
              <Text style={styles.ratingNumber}>4</Text>
              <Text style={styles.ratingDescription}>Très bon - Atteint les attentes</Text>
            </View>
            
            <View style={styles.ratingItem}>
              <Text style={styles.ratingNumber}>3</Text>
              <Text style={styles.ratingDescription}>Bon - Correspond aux attentes</Text>
            </View>
            
            <View style={styles.ratingItem}>
              <Text style={styles.ratingNumber}>2</Text>
              <Text style={styles.ratingDescription}>Moyen - En dessous des attentes</Text>
            </View>
            
            <View style={styles.ratingItem}>
              <Text style={styles.ratingNumber}>1</Text>
              <Text style={styles.ratingDescription}>Insuffisant - Bien en dessous des attentes</Text>
            </View>
          </View>
          
          <View style={styles.tipsContainer}>
            <Text style={styles.tipsTitle}>Conseils pour une bonne évaluation:</Text>
            <Text style={styles.tipText}>• Soyez objectif et factuel dans vos commentaires</Text>
            <Text style={styles.tipText}>• Mentionnez des exemples concrets</Text>
            <Text style={styles.tipText}>• Concentrez-vous sur l'enseignement et la pédagogie</Text>
            <Text style={styles.tipText}>• Évitez les commentaires personnels</Text>
          </View>
        </Card>
        
        {/* Bouton de soumission */}
        <View style={styles.actionContainer}>
          <TouchableOpacity 
            style={[styles.actionButton, loading && styles.actionButtonDisabled]}
            onPress={submitEvaluation}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="send" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>Envoyer l'évaluation</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
      
      {/* Modal de sélection de séance */}
      <Modal visible={showSeanceSelector} transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sélectionner une séance</Text>
              <TouchableOpacity onPress={() => setShowSeanceSelector(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.seanceList}>
              {seances.map((seance) => (
                <TouchableOpacity
                  key={seance.id}
                  style={styles.seanceOption}
                  onPress={() => selectSeance(seance)}
                >
                  <View style={styles.seanceOptionInfo}>
                    <Text style={styles.seanceOptionSubject}>{seance.matiere}</Text>
                    <Text style={styles.seanceOptionDate}>
                      {new Date(seance.date_heure_debut).toLocaleDateString('fr-FR')}
                    </Text>
                    <Text style={styles.seanceOptionTime}>
                      {new Date(seance.date_heure_debut).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#666" />
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            {seances.length === 0 && (
              <View style={styles.noSeances}>
                <Ionicons name="calendar-outline" size={40} color="#ccc" />
                <Text style={styles.noSeancesText}>Aucune séance terminée à évaluer</Text>
              </View>
            )}
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
  
  // Carte de séance
  seanceCard: {
    margin: 16,
    padding: 16,
  },
  seanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  seanceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  selectSeanceButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  selectSeanceText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
  selectedSeance: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d4edda',
    padding: 8,
    borderRadius: 6,
  },
  selectedSeanceText: {
    fontSize: 14,
    color: '#155724',
    fontWeight: '500',
    marginLeft: 8,
  },
  noSeanceText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
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
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 12,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 8,
  },
  noteText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
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
  recommendationContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  recommendationOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  recommendationOptionActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  recommendationText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
  },
  
  // Guide d'évaluation
  guideCard: {
    margin: 16,
    padding: 20,
  },
  guideTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  ratingGuide: {
    marginBottom: 20,
  },
  ratingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
    width: 20,
  },
  ratingDescription: {
    fontSize: 14,
    color: '#666',
    marginLeft: 12,
    flex: 1,
  },
  tipsContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  tipText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
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
  
  // Modal de sélection de séance
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    maxHeight: '80%',
    margin: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  seanceList: {
    maxHeight: 400,
  },
  seanceOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  seanceOptionInfo: {
    flex: 1,
  },
  seanceOptionSubject: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  seanceOptionDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  seanceOptionTime: {
    fontSize: 14,
    color: '#666',
  },
  noSeances: {
    alignItems: 'center',
    padding: 40,
  },
  noSeancesText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
  },
});

export default EvaluateTutor;
