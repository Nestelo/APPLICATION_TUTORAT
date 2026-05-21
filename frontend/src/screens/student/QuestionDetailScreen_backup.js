import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  Dimensions,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as DocumentPicker from 'expo-document-picker';
import Header from '../../components/ui/Header';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import VoiceRecorder from '../../components/ui/VoiceRecorder';
import {
  getQuestion,
  incrementerVue,
  createReponse,
  voterReponse,
  marquerSolution,
  envoyerMessageVocal,
  getMessagesVocauxReponse,
  abonnerQuestion,
  desabonnerQuestion
} from '../../api/forumService';

const { width } = Dimensions.get('window');

const QuestionDetailScreen = ({ route, navigation }) => {
  const { questionId } = route.params;
  const [question, setQuestion] = useState(null);
  const [reponses, setReponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newResponse, setNewResponse] = useState('');
  const [showVocalModal, setShowVocalModal] = useState(false);
  const [recording, setRecording] = useState(false);
  const [audioFile, setAudioFile] = useState(null);
  const [messagesVocaux, setMessagesVocaux] = useState({});
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [userVote, setUserVote] = useState({});
  const [sound, setSound] = useState();
  const [isPlaying, setIsPlaying] = useState({});

  useEffect(() => {
    loadQuestionDetail();
  }, [questionId]);

  const loadQuestionDetail = async () => {
    try {
      setLoading(true);
      console.log('=== CHARGEMENT DÉTAIL QUESTION ===');
      console.log('Question ID:', questionId);
      
      const questionData = await getQuestion(questionId);
      console.log('Données question reçues:', JSON.stringify(questionData, null, 2));
      
      setQuestion(questionData);
      setReponses(questionData.reponses || []);
      
      // Logger les détails des réponses
      console.log('=== DÉTAILS DES RÉPONSES ===');
      (questionData.reponses || []).forEach((reponse, index) => {
        console.log(`Réponse ${index + 1}:`);
        console.log(`  ID: ${reponse.id}`);
        console.log(`  Contenu: ${reponse.contenu}`);
        console.log(`  Auteur ID: ${reponse.auteur}`);
        console.log(`  Auteur Details:`, reponse.auteur_details);
        console.log(`  Auteur Prénom: ${reponse.auteur_details?.prenom}`);
        console.log(`  Auteur Nom: ${reponse.auteur_details?.nom}`);
        
        // Vérifier spécifiquement les réponses de Lote Lot
        if (reponse.auteur_details?.prenom === 'Lote' && reponse.auteur_details?.nom === 'Lot') {
          console.log(`  *** RÉPONSE DE LOTE LOT DÉTECTÉE ***`);
          console.log(`  *** Contenu complet: ${reponse.contenu} ***`);
        }
      });
      
      // Charger les messages vocaux pour chaque réponse
      const vocalData = {};
      for (const reponse of questionData.reponses || []) {
        try {
          const vocals = await getMessagesVocauxReponse(reponse.id);
          vocalData[reponse.id] = vocals;
        } catch (error) {
          vocalData[reponse.id] = [];
        }
      }
      setMessagesVocaux(vocalData);
      
      // Incrémenter le nombre de vues
      await incrementerVue(questionId);
    } catch (error) {
      console.error('Erreur chargement détail:', error);
      Alert.alert('Erreur', 'Impossible de charger la question');
    } finally {
      setLoading(false);
    }
  };

  const handleResponse = async () => {
    if (!newResponse.trim()) {
      Alert.alert('Erreur', 'Le contenu de la réponse est obligatoire');
      return;
    }

    try {
      const response = await createReponse({
        question: questionId,
        contenu: newResponse.trim()
      });
      
      setReponses([response, ...reponses]);
      setNewResponse('');
      Alert.alert('Succès', 'Réponse publiée avec succès');
    } catch (error) {
      console.error('Erreur réponse:', error);
      Alert.alert('Erreur', 'Impossible de publier la réponse');
    }
  };

  const handleVoiceRecordingComplete = async (audioData) => {
    try {
      setAudioFile(audioData);
      console.log('Enregistrement vocal terminé:', audioData);
      
      // Envoyer le message vocal au backend
      const response = await envoyerMessageVocal({
        question: questionId,
        fichier_audio: audioData.uri,
        duree: audioData.duration
      });
      
      Alert.alert('Succès', 'Message vocal envoyé avec succès');
    } catch (error) {
      console.error('Erreur envoi message vocal:', error);
      Alert.alert('Erreur', 'Impossible d\'envoyer le message vocal');
    }
  };

  const handleVote = async (responseId, voteValue) => {
    try {
      await voterReponse(responseId, voteValue);
      
      // Mettre à jour l'interface
      setReponses(reponses.map(r => {
        if (r.id === responseId) {
          const currentVote = userVote[responseId] || 0;
          const voteDiff = voteValue - currentVote;
          return {
            ...r,
            nb_votes: r.nb_votes + voteDiff
          };
        }
        return r;
      }));
      
      setUserVote({
        ...userVote,
        [responseId]: voteValue
      });
    } catch (error) {
      console.error('Erreur vote:', error);
      Alert.alert('Erreur', 'Impossible de voter');
    }
  };

  const handleMarkSolution = async (responseId) => {
    try {
      await marquerSolution(responseId);
      
      setReponses(reponses.map(r => ({
        ...r,
        est_solution: r.id === responseId
      })));
      
      setQuestion({
        ...question,
        est_resolue: true
      });
      
      Alert.alert('Succès', 'Solution marquée avec succès');
    } catch (error) {
      console.error('Erreur solution:', error);
      Alert.alert('Erreur', 'Impossible de marquer la solution');
    }
  };

  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission requise', 'Veuillez autoriser l\'accès au micro');
        return;
      }

      setRecording(true);
      // Implémentation de l'enregistrement audio
      // Ceci est une version simplifiée
      setTimeout(() => {
        setRecording(false);
        setAudioFile({ uri: 'mock_audio_file.mp3', name: 'message_vocal.mp3' });
      }, 3000);
    } catch (error) {
      console.error('Erreur enregistrement:', error);
      Alert.alert('Erreur', 'Impossible d\'enregistrer');
    }
  };

  const stopRecording = () => {
    setRecording(false);
  };

  const sendVocalMessage = async (responseId) => {
    if (!audioFile) {
      Alert.alert('Erreur', 'Veuillez enregistrer un message vocal');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('fichier_audio', {
        uri: audioFile.uri,
        type: 'audio/mpeg',
        name: audioFile.name
      });
      formData.append('duree', '00:01:30');

      await envoyerMessageVocal(responseId, formData);
      
      // Recharger les messages vocaux
      const vocals = await getMessagesVocauxReponse(responseId);
      setMessagesVocaux({
        ...messagesVocaux,
        [responseId]: vocals
      });
      
      setAudioFile(null);
      setShowVocalModal(false);
      Alert.alert('Succès', 'Message vocal envoyé');
    } catch (error) {
      console.error('Erreur envoi vocal:', error);
      Alert.alert('Erreur', 'Impossible d\'envoyer le message vocal');
    }
  };

  // Fonctions pour la lecture audio
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
      console.error('Erreur lecture audio:', error);
      Alert.alert('Erreur', 'Impossible de lire le message vocal');
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
      console.error('Erreur arrêt audio:', error);
    }
  };

  useEffect(() => {
    return sound
      ? () => {
          console.log('Unloading sound');
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  const handleSubscribe = async () => {
    try {
      await abonnerQuestion(questionId);
      setIsSubscribed(true);
      Alert.alert('Succès', 'Vous êtes maintenant abonné à cette question');
    } catch (error) {
      console.error('Erreur abonnement:', error);
      Alert.alert('Erreur', 'Impossible de s\'abonner');
    }
  };

  const handleUnsubscribe = async () => {
    try {
      await desabonnerQuestion(questionId);
      setIsSubscribed(false);
      Alert.alert('Succès', 'Vous n\'êtes plus abonné à cette question');
    } catch (error) {
      console.error('Erreur désabonnement:', error);
      Alert.alert('Erreur', 'Impossible de se désabonner');
    }
  };

  const getPriorityColor = (priority) => {
    const colors = {
      haute: '#dc3545',
      moyenne: '#ffc107',
      basse: '#28a745'
    };
    return colors[priority] || '#666';
  };

  const renderResponseItem = (response) => (
    <Card key={response.id} style={styles.responseCard}>
      <View style={styles.responseHeader}>
        <View style={styles.responseAuthor}>
          <Text style={styles.authorName}>
            {response.auteur_details?.prenom} {response.auteur_details?.nom}
          </Text>
          <Text style={styles.authorRole}>
            {response.auteur_details?.role === 'tuteur' ? 'Tuteur' : 'Étudiant'}
          </Text>
          <Text style={styles.responseDate}>
            {new Date(response.date).toLocaleDateString('fr-FR')}
          </Text>
        </View>
        {response.est_solution && (
          <Badge text="Solution" color="#28a745" />
        )}
      </View>

      <Text style={styles.responseContent}>{response.contenu}</Text>

      {/* Messages vocaux */}
      {messagesVocaux[response.id] && messagesVocaux[response.id].length > 0 && (
        <View style={styles.vocalMessagesContainer}>
          <Text style={styles.vocalMessagesTitle}>Messages vocaux</Text>
          {messagesVocaux[response.id].map((vocal) => (
            <View key={vocal.id} style={styles.vocalMessage}>
              <Ionicons name="mic-outline" size={16} color="#007AFF" />
              <Text style={styles.vocalMessageText}>
                {vocal.auteur_details?.prenom} • {vocal.duree}
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

      <View style={styles.responseActions}>
        <View style={styles.voteContainer}>
          <TouchableOpacity
            style={[
              styles.voteButton,
              userVote[response.id] === 1 && styles.voteActive
            ]}
            onPress={() => handleVote(response.id, 1)}
          >
            <Ionicons 
              name="thumbs-up-outline" 
              size={16} 
              color={userVote[response.id] === 1 ? '#28a745' : '#666'} 
            />
            <Text style={styles.voteText}>{response.nb_votes}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.voteButton,
              userVote[response.id] === -1 && styles.voteActive
            ]}
            onPress={() => handleVote(response.id, -1)}
          >
            <Ionicons 
              name="thumbs-down-outline" 
              size={16} 
              color={userVote[response.id] === -1 ? '#dc3545' : '#666'} 
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.vocalButton}
          onPress={() => setShowVocalModal({ responseId: response.id, author: response.auteur_details })}
        >
          <Ionicons name="mic-outline" size={16} color="#007AFF" />
          <Text style={styles.vocalButtonText}>Vocal</Text>
        </TouchableOpacity>

        {question.auteur === question.auteur_details?.id && !response.est_solution && !question.est_resolue && (
          <TouchableOpacity
            style={styles.solutionButton}
            onPress={() => handleMarkSolution(response.id)}
          >
            <Ionicons name="checkmark-circle-outline" size={16} color="#28a745" />
            <Text style={styles.solutionButtonText}>Solution</Text>
          </TouchableOpacity>
        )}
      </View>
    </Card>
  );

  if (loading) {
    return (
      <>
        <Header title="Détail de la question" />
        <LoadingSpinner />
      </>
    );
  }

  if (!question) {
    return (
      <>
        <Header title="Détail de la question" />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={60} color="#dc3545" />
          <Text style={styles.errorText}>Question non trouvée</Text>
        </View>
      </>
    );
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

      {loading ? (
        <LoadingSpinner />
      ) : question ? (
        <ScrollView style={styles.container}>
          {/* Question */}
          <Card style={styles.questionCard}>
            <View style={styles.questionHeader}>
              <View style={[styles.priorityIndicator, { backgroundColor: getPriorityColor(question.priorite) }]} />
              <View style={styles.questionInfo}>
                <Text style={styles.questionTitle}>{question.titre}</Text>
                <Text style={styles.questionMeta}>
                  {question.matiere} • {question.auteur_details?.prenom} {question.auteur_details?.nom}
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
              <Text style={styles.statText}>{reponses.length} réponses</Text>
            </View>
            {question.est_resolue && (
              <Badge text="Résolue" color="#28a745" />
            )}
          </View>
        </Card>

        {/* Réponses */}
        <Text style={styles.responsesTitle}>
          {reponses.length} {reponses.length === 1 ? 'réponse' : 'réponses'}
        </Text>

        {reponses.length === 0 ? (
          <Card style={styles.noResponsesCard}>
            <View style={styles.noResponsesContainer}>
              <Ionicons name="chatbubble-ellipses-outline" size={40} color="#ccc" />
              <Text style={styles.noResponsesText}>
                Aucune réponse pour le moment
              </Text>
              <Text style={styles.noResponsesSubtext}>
                Soyez le premier à répondre !
              </Text>
            </View>
          </Card>
        ) : (
          reponses.map(renderResponseItem)
        )}

        {/* Formulaire de réponse */}
        <Card style={styles.responseFormCard}>
          <Text style={styles.formTitle}>Votre réponse</Text>
          <TextInput
            style={styles.responseInput}
            placeholder="Écrivez votre réponse..."
            value={newResponse}
            onChangeText={setNewResponse}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
          
          {/* Section de réponse par écrit */}
          <View style={styles.responseSection}>
            <Text style={styles.sectionTitle}>📝 Réponse par écrit</Text>
            <TextInput
              style={styles.responseInput}
              placeholder="Écrivez votre réponse..."
              value={newResponse}
              onChangeText={setNewResponse}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Section de réponse par voix */}
          <View style={styles.responseSection}>
            <Text style={styles.sectionTitle}>🎤 Réponse par voix</Text>
            <VoiceRecorder 
              onRecordingComplete={handleVoiceRecordingComplete}
              maxDuration={180}
            />
          </View>
          
          <View style={styles.formActions}>
            <Button
              title="Publier la réponse"
              onPress={handleResponse}
              disabled={!newResponse.trim() && !audioFile}
              style={styles.submitButton}
            />
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
                <Button
                  title="Envoyer le message vocal"
                  onPress={() => sendVocalMessage(showVocalModal.responseId)}
                  disabled={!audioFile}
                  style={styles.sendButton}
                />
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
    marginBottom: 8,
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
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
    marginBottom: 12,
  },
  questionContent: {
    fontSize: 16,
    color: '#555',
    lineHeight: 24,
    marginBottom: 16,
  },
  questionStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  responsesTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    margin: 16,
    marginBottom: 8,
  },
  noResponsesCard: {
    margin: 16,
  },
  noResponsesContainer: {
    alignItems: 'center',
    padding: 32,
  },
  noResponsesText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
    marginBottom: 4,
  },
  noResponsesSubtext: {
    fontSize: 14,
    color: '#999',
  },
  responseCard: {
    marginHorizontal: 16,
    marginBottom: 12,
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
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  authorRole: {
    fontSize: 12,
    color: '#007AFF',
    marginBottom: 2,
  },
  responseDate: {
    fontSize: 12,
    color: '#999',
  },
  responseContent: {
    fontSize: 15,
    color: '#555',
    lineHeight: 22,
    marginBottom: 16,
  },
  vocalMessagesContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  vocalMessagesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  vocalMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 6,
    padding: 8,
    marginBottom: 6,
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
  responseActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  voteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  voteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#f8f9fa',
    marginRight: 8,
  },
  voteActive: {
    backgroundColor: '#e3f2fd',
  },
  voteText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  vocalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#e3f2fd',
    marginRight: 8,
  },
  vocalButtonText: {
    fontSize: 14,
    color: '#007AFF',
    marginLeft: 4,
  },
  solutionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#e8f5e8',
  },
  solutionButtonText: {
    fontSize: 14,
    color: '#28a745',
    marginLeft: 4,
  },
  responseFormCard: {
    margin: 16,
    padding: 16,
  },
  responseSection: {
    marginBottom: 20,
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  responseInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    height: 100,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  formActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  vocalRecordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#f8f9fa',
  },
  vocalRecordText: {
    fontSize: 14,
    color: '#007AFF',
    marginLeft: 6,
  },
  submitButton: {
    flex: 1,
    marginLeft: 12,
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
    fontWeight: '600',
    color: '#333',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  vocalRecordContainer: {
    alignItems: 'center',
    padding: 32,
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#dc3545',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  recording: {
    backgroundColor: '#dc3545',
  },
  recordText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  audioPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  audioName: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
  },
  sendButton: {
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 16,
    color: '#dc3545',
    marginTop: 12,
  },
});

export default QuestionDetailScreen;
