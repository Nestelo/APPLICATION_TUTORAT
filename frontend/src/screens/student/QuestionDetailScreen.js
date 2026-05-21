import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Header from '../components/Header';
import LoadingSpinner from '../components/LoadingSpinner';
import VoiceRecorder from '../components/VoiceRecorder';
import { getQuestion, getReponses } from '../src/api/forumService';

const QuestionDetailScreen = ({ route, navigation }) => {
  const { questionId } = route.params;
  const [question, setQuestion] = useState(null);
  const [reponses, setReponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newResponse, setNewResponse] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [showVocalModal, setShowVocalModal] = useState(false);
  const [audioFile, setAudioFile] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState({});
  const [messagesVocaux, setMessagesVocaux] = useState({});
  const [isSendingVocal, setIsSendingVocal] = useState(false);

  const loadQuestionDetail = async () => {
    try {
      setLoading(true);
      console.log('=== CHARGEMENT DETAIL QUESTION ===');
      console.log('Question ID:', questionId);
      
      const questionData = await getQuestion(questionId);
      console.log('Données question reçues:', JSON.stringify(questionData, null, 2));
      
      setQuestion(questionData);
      setReponses(questionData.reponses || []);
      
      // Logger les détails des réponses
      console.log('=== DETAILS DES REPONSES ===');
      (questionData.reponses || []).forEach((reponse, index) => {
        console.log(`Reponse ${index + 1}:`);
        console.log(`  ID: ${reponse.id}`);
        console.log(`  Contenu: ${reponse.contenu}`);
        console.log(`  Auteur ID: ${reponse.auteur}`);
        console.log(`  Auteur Details:`, reponse.auteur_details);
        console.log(`  Auteur Prenom: ${reponse.auteur_details?.prenom}`);
        console.log(`  Auteur Nom: ${reponse.auteur_details?.nom}`);
        
        // Vérifier spécifiquement les réponses de Lote Lot
        if (reponse.auteur_details?.prenom === 'Lote' && reponse.auteur_details?.nom === 'Lot') {
          console.log(`  *** REPONSE DE LOTE LOT DETECTEE ***`);
          console.log(`  *** Contenu complet: ${reponse.contenu} ***`);
        }
        
        // Charger les messages vocaux pour chaque réponse
        loadVocalMessages(reponse.id);
      });
      
      setLoading(false);
    } catch (error) {
      console.error('Erreur loadQuestionDetail:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuestionDetail();
  }, [questionId]);

  useEffect(() => {
    return sound
      ? () => {
          console.log('Unloading sound');
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  const renderResponseItem = (response) => {
    console.log('=== RENDU D\'UNE REPONSE ===');
    console.log('Response ID:', response.id);
    console.log('Response contenu:', response.contenu);
    console.log('Response auteur_details:', response.auteur_details);
    
    // Vérifier si la réponse a du contenu textuel
    const hasTextContent = response.contenu && response.contenu.trim() !== '';
    const hasVocalMessages = messagesVocaux[response.id] && messagesVocaux[response.id].length > 0;
    
    console.log('Has text content:', hasTextContent);
    console.log('Has vocal messages:', hasVocalMessages);
    
    return (
      <Card key={response.id} style={styles.responseCard}>
        <View style={styles.responseHeader}>
          <View style={styles.responseAuthor}>
            <Text style={styles.authorName}>
              {response.auteur_details?.prenom} {response.auteur_details?.nom}
            </Text>
            <Text style={styles.authorRole}>
              {response.auteur_details?.role === 'tuteur' ? 'Tuteur' : 'Etudiant'}
            </Text>
            <Text style={styles.responseDate}>
              {new Date(response.date).toLocaleDateString('fr-FR')}
            </Text>
          </View>
          {response.est_solution && (
            <Badge text="Solution" color="#28a745" />
          )}
        </View>

        {/* Afficher TOUJOURS le contenu textuel si présent */}
        {hasTextContent && (
          <Text style={styles.responseContent}>{response.contenu}</Text>
        )}
        
        {/* Messages vocaux - affiché en PLUS du contenu textuel */}
        {hasVocalMessages && (
          <View style={styles.vocalMessagesContainer}>
            <Text style={styles.vocalMessagesTitle}>Messages vocaux</Text>
            {messagesVocaux[response.id].map((vocal) => (
              <View key={vocal.id} style={styles.vocalMessage}>
                <Ionicons name="mic-outline" size={16} color="#007AFF" />
                <Text style={styles.vocalMessageText}>
                  {vocal.auteur_details?.prenom} - {vocal.duree}
                </Text>
                <TouchableOpacity
                  style={styles.playButton}
                  onPress={() => {
                    if (isPlaying[vocal.id]) {
                      stopSound(vocal.id);
                    } else {
                      playSound(vocal);
                    }
                  }}
                >
                  <Ionicons 
                    name={isPlaying[vocal.id] ? "pause-circle-outline" : "play-circle-outline"} 
                    size={20} 
                    color="#007AFF" 
                  />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </Card>
    );
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'haute':
        return '#ff4444';
      case 'moyenne':
        return '#ff9800';
      case 'basse':
        return '#4caf50';
      default:
        return '#666';
    }
  };

  const handleSubscribe = () => {
    setIsSubscribed(true);
  };

  const handleUnsubscribe = () => {
    setIsSubscribed(false);
  };

  const handleResponse = () => {
    if (!newResponse.trim()) {
      Alert.alert('Erreur', 'Veuillez écrire une réponse');
      return;
    }
    // Logique pour envoyer la réponse
    setNewResponse('');
  };

  const playSound = async (vocal) => {
    try {
      if (sound) {
        await sound.unloadAsync();
      }

      console.log('Lecture du message vocal:', vocal.fichier_audio);
      
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: vocal.fichier_audio },
        { shouldPlay: true }
      );
      
      setSound(newSound);
      setIsPlaying({
        ...isPlaying,
        [vocal.id]: true
      });

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsPlaying({
            ...isPlaying,
            [vocal.id]: false
          });
        }
      });
    } catch (error) {
      console.error('Erreur lecture message vocal:', error);
    }
  };

  const stopSound = async (vocalId) => {
    try {
      if (sound) {
        await sound.stopAsync();
        setIsPlaying({
          ...isPlaying,
          [vocalId]: false
        });
      }
    } catch (error) {
      console.error('Erreur arrêt message vocal:', error);
    }
  };

  const startRecording = async () => {
    try {
      setIsRecording(true);
      // Logique pour démarrer l'enregistrement
    } catch (error) {
      console.error('Erreur démarrage enregistrement:', error);
    }
  };

  const stopRecording = async () => {
    try {
      setIsRecording(false);
      // Logique pour arrêter l'enregistrement
    } catch (error) {
      console.error('Erreur arrêt enregistrement:', error);
    }
  };

  const handleVoiceRecordingComplete = (audioUri) => {
    setAudioFile(audioUri);
  };

  const sendVocalMessage = async (responseId) => {
    try {
      if (!audioFile) {
        Alert.alert('Erreur', 'Aucun message vocal à envoyer');
        return;
      }
      
      // Protection contre les envois multiples
      if (isSendingVocal) {
        console.log('Envoi vocal déjà en cours, annulation...');
        return;
      }
      
      setIsSendingVocal(true);
      
      console.log('Envoi du message vocal tuteur:', {
        duree: '00:00:09',
        fichier_audio: audioFile,
        reponse: responseId
      });
      
      // Créer FormData pour l'envoi
      const formData = new FormData();
      formData.append('reponse', responseId);
      formData.append('fichier_audio', {
        uri: audioFile,
        type: 'audio/3gp',
        name: `message_vocal_${Date.now()}.3gp`,
      });
      formData.append('duree', '00:00:09');
      
      console.log('=== ENVOI MESSAGE VOCAL API ===');
      console.log('Données reçues:', {
        duree: '00:00:09',
        fichier_audio: audioFile,
        reponse: responseId
      });
      
      // Envoyer à l'API
      const response = await fetch('http://192.168.43.210:8000/api/forum/messages-vocaux/', {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${await AsyncStorage.getItem('token')}`,
        },
        body: formData,
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Message vocal tuteur envoyé avec succès:', data);
        
        // Recharger les messages vocaux pour cette réponse
        loadVocalMessages(responseId);
        
        // Réinitialiser l'état
        setAudioFile(null);
        setShowVocalModal(false);
        setIsSendingVocal(false);
        
        Alert.alert('Succès', 'Message vocal envoyé avec succès');
      } else {
        console.error('Erreur envoi message vocal:', response.status);
        Alert.alert('Erreur', 'Impossible d\'envoyer le message vocal');
        setIsSendingVocal(false);
      }
    } catch (error) {
      console.error('Erreur envoi message vocal:', error);
      Alert.alert('Erreur', 'Impossible d\'envoyer le message vocal');
      setIsSendingVocal(false);
    }
  };

  const loadVocalMessages = async (responseId) => {
    try {
      console.log(`Chargement des messages vocaux pour la réponse ${responseId}`);
      const response = await fetch(`http://192.168.43.210:8000/api/forum/messages-vocaux/?reponse=${responseId}`, {
        headers: {
          'Authorization': `Bearer ${await AsyncStorage.getItem('token')}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Messages vocaux chargés:', data);
        setMessagesVocaux(prev => ({
          ...prev,
          [responseId]: data
        }));
      }
    } catch (error) {
      console.error('Erreur chargement messages vocaux:', error);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <>
      <Header title="Détail de la question">
        <TouchableOpacity
          style={styles.subscribeButton}
          onPress={isSubscribed ? handleUnsubscribe : handleSubscribe}
        >
          <Ionicons 
            name={isSubscribed ? "heart-dislike-outline" : "heart-outline"} 
            size={24} 
            color="#fff" 
          />
        </TouchableOpacity>
      </Header>

      {question ? (
        <ScrollView style={styles.container}>
          {/* Question */}
          <Card style={styles.questionCard}>
            <View style={styles.questionHeader}>
              <View style={[styles.priorityIndicator, { backgroundColor: getPriorityColor(question.priorite) }]} />
              <View style={styles.questionInfo}>
                <Text style={styles.questionTitle}>{question.titre}</Text>
                <Text style={styles.questionMeta}>
                  {question.matiere} - {question.auteur_details?.prenom} {question.auteur_details?.nom}
                </Text>
                <Text style={styles.questionDate}>
                  {new Date(question.date_publication).toLocaleDateString('fr-FR')}
                </Text>
              </View>
            </View>
          </Card>

          {question.tags && (
            <View style={styles.tagsContainer}>
              {question.tags.split(',').map((tag, index) => (
                <Badge key={index} text={tag.trim()} color="#007AFF" size="small" />
              ))}
            </View>
          )}

          <Text style={styles.questionContent}>{question.contenu}</Text>

          <View style={styles.questionStats}>
            <View style={styles.statItem}>
              <Ionicons name="eye-outline" size={16} color="#666" />
              <Text style={styles.statText}>{question.nb_vues} vues</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="chatbubble-outline" size={16} color="#666" />
              <Text style={styles.statText}>{question.nb_reponses} reponses</Text>
            </View>
          </View>

          {/* Réponses */}
          <View style={styles.responsesContainer}>
            <Text style={styles.responsesTitle}>Réponses ({reponses.length})</Text>
            {reponses.map(renderResponseItem)}
          </View>

          {/* Formulaire de réponse */}
          <Card style={styles.responseFormCard}>
            <Text style={styles.formTitle}>Répondre à la question</Text>
            
            <TextInput
              style={styles.responseInput}
              placeholder="Ecrivez votre reponse..."
              value={newResponse}
              onChangeText={setNewResponse}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            
            <View style={styles.formActions}>
              <TouchableOpacity
                style={styles.vocalButton}
                onPress={() => setShowVocalModal(true)}
              >
                <Ionicons name="mic-outline" size={20} color="#007AFF" />
                <Text style={styles.vocalButtonText}>Message vocal</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.submitButton, !newResponse.trim() && styles.submitButtonDisabled]}
                onPress={handleResponse}
                disabled={!newResponse.trim()}
              >
                <Text style={styles.submitButtonText}>Envoyer</Text>
              </TouchableOpacity>
            </View>
          </Card>
        </ScrollView>
      ) : (
        <View style={styles.container}>
          <Text style={styles.errorText}>Question non trouvée</Text>
        </View>
      )}

      {/* Modal message vocal */}
      <Modal
        visible={showVocalModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowVocalModal(false)}>
              <Ionicons name="close-outline" size={24} color="#666" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Message vocal</Text>
            <View />
          </View>

          <View style={styles.modalContent}>
            <View style={styles.vocalRecordContainer}>
              <TouchableOpacity
                style={styles.recordButton}
                onPress={isRecording ? stopRecording : startRecording}
              >
                <Ionicons 
                  name={isRecording ? "stop-circle" : "mic-circle"} 
                  size={60} 
                  color={isRecording ? "#ff4444" : "#007AFF"} 
                />
              </TouchableOpacity>
              <Text style={styles.recordText}>
                {isRecording ? "Appuyez pour arrêter" : "Appuyez pour enregistrer"}
              </Text>
            </View>

            {audioFile && (
              <View style={styles.audioPreview}>
                <Text style={styles.audioPreviewText}>Message vocal enregistré</Text>
                <TouchableOpacity
                  style={styles.sendVocalButton}
                  onPress={() => sendVocalMessage(showVocalModal.responseId)}
                >
                  <Text style={styles.sendVocalButtonText}>Envoyer</Text>
                </TouchableOpacity>
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
  subscribeButton: {
    padding: 8,
  },
  questionCard: {
    margin: 16,
    padding: 16,
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  priorityIndicator: {
    width: 4,
    height: 60,
    borderRadius: 2,
    marginRight: 12,
  },
  questionInfo: {
    flex: 1,
  },
  questionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  questionMeta: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  questionDate: {
    fontSize: 12,
    color: '#999',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  questionContent: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  questionStats: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  statText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  responsesContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  responsesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  responseCard: {
    marginBottom: 12,
    padding: 16,
  },
  responseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  responseAuthor: {
    flex: 1,
  },
  authorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  authorRole: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  responseDate: {
    fontSize: 12,
    color: '#999',
  },
  responseContent: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    marginBottom: 12,
  },
  vocalMessagesContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  vocalMessagesTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 8,
  },
  vocalMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  vocalMessageText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  playButton: {
    padding: 4,
  },
  responseFormCard: {
    margin: 16,
    padding: 16,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  responseInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    marginBottom: 16,
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  vocalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  vocalButtonText: {
    fontSize: 14,
    color: '#007AFF',
    marginLeft: 4,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  vocalRecordContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  recordButton: {
    padding: 20,
  },
  recordText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
  audioPreview: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  audioPreviewText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 16,
  },
  sendVocalButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  sendVocalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 50,
  },
});

export default QuestionDetailScreen;
