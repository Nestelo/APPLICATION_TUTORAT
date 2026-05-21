import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, 
  ActivityIndicator, RefreshControl, TextInput, Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/ui/Header';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import VoiceRecorder from '../../components/ui/VoiceRecorder';
import VoicePlayer from '../../components/ui/VoicePlayer';
import { API_BASE_URL } from '../../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getMessagesVocauxReponse, envoyerMessageVocal } from '../../api/forumService';

const TutorQuestionDetailScreen = ({ navigation, route }) => {
  const { questionId } = route.params;
  const [loading, setLoading] = useState(true);
  const [question, setQuestion] = useState(null);
  const [answerText, setAnswerText] = useState('');
  const [sendingAnswer, setSendingAnswer] = useState(false);
  const [voiceMessages, setVoiceMessages] = useState([]);
  const [loadingVoices, setLoadingVoices] = useState(false);
  const [audioFile, setAudioFile] = useState(null);
  const [recordingVoice, setRecordingVoice] = useState(false);

  useEffect(() => {
    loadQuestionDetail();
  }, [questionId]);

  const loadQuestionDetail = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}/api/forum/questions/${questionId}/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setQuestion(data);
        
        // Charger les messages vocaux pour cette question
        if (data.reponses && data.reponses.length > 0) {
          await loadVoiceMessages(data.reponses);
        }
      } else {
        throw new Error('Erreur lors du chargement');
      }
    } catch (error) {
      console.error('Erreur chargement détail:', error);
      Alert.alert('Erreur', 'Impossible de charger les détails de la question');
    } finally {
      setLoading(false);
    }
  };

  const loadVoiceMessages = async (reponses) => {
    try {
      if (!reponses || reponses.length === 0) {
        setVoiceMessages([]);
        return;
      }

      setLoadingVoices(true);
      const allVoiceMessages = [];

      for (const reponse of reponses) {
        const result = await getMessagesVocauxReponse(reponse.id);
        if (result.success && result.data.results) {
          allVoiceMessages.push(...result.data.results);
        }
      }

      setVoiceMessages(allVoiceMessages);
      console.log('Messages vocaux chargés:', allVoiceMessages);
    } catch (error) {
      console.error('Erreur chargement messages vocaux:', error);
      setVoiceMessages([]);
    } finally {
      setLoadingVoices(false);
    }
  };

  const handleAnswer = async () => {
    if (!answerText.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer une réponse');
      return;
    }

    try {
      setSendingAnswer(true);
      const token = await AsyncStorage.getItem('accessToken');
      
      const response = await fetch(`${API_BASE_URL}/api/forum/reponses/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          question: question.id,
          contenu: answerText
        })
      });

      if (response.ok) {
        Alert.alert('Succès', 'Votre réponse a été envoyée');
        setAnswerText('');
        loadQuestionDetail();
      } else {
        throw new Error('Erreur lors de l\'envoi');
      }
    } catch (error) {
      console.error('Erreur envoi réponse:', error);
      Alert.alert('Erreur', 'Impossible d\'envoyer votre réponse');
    } finally {
      setSendingAnswer(false);
    }
  };

  const handleVoiceRecordingComplete = async (audioData) => {
    try {
      setRecordingVoice(false);
      setAudioFile(audioData);
      console.log('Enregistrement vocal tuteur terminé:', audioData);
      
      // D'abord créer une réponse texte si nécessaire
      let reponseId = null;
      const token = await AsyncStorage.getItem('accessToken');
      
      // Créer une réponse texte par défaut pour le message vocal
      const createResponse = await fetch(`${API_BASE_URL}/api/forum/reponses/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          question: question.id,
          contenu: 'Réponse vocale du tuteur'
        })
      });
      
      if (!createResponse.ok) {
        throw new Error('Impossible de créer la réponse pour le message vocal');
      }
      
      const reponseData = await createResponse.json();
      reponseId = reponseData.id;
      
      // Préparer les données pour le service
      const voiceData = {
        reponse: reponseId,
        fichier_audio: audioData.uri,
        duree: `00:${Math.floor(audioData.duration / 60).toString().padStart(2, '0')}:${(audioData.duration % 60).toString().padStart(2, '0')}`
      };
      
      console.log('Envoi du message vocal tuteur:', voiceData);
      
      // Utiliser le service pour envoyer le message vocal
      const result = await envoyerMessageVocal(voiceData);
      
      if (result.success) {
        console.log('Message vocal tuteur envoyé avec succès:', result.data);
        Alert.alert('Succès', 'Message vocal envoyé avec succès');
        
        // Recharger la question pour voir le message vocal
        loadQuestionDetail();
        setAudioFile(null);
      } else {
        throw new Error(result.error || 'Erreur lors de l\'envoi du message vocal');
      }
    } catch (error) {
      console.error('Erreur envoi message vocal tuteur:', error);
      Alert.alert('Erreur', 'Impossible d\'envoyer le message vocal');
    }
  };

  const renderResponse = ({ item }) => {
    const responseVoiceMessages = voiceMessages.filter(vm => vm.reponse === item.id);
    
    return (
      <View style={styles.responseItem}>
        <View style={styles.responseHeader}>
          <View style={styles.responseAuthor}>
            <Text style={styles.responseName}>
              {item.auteur_details?.prenom} {item.auteur_details?.nom}
            </Text>
            {item.auteur_details?.role === 'tuteur' && (
              <View style={styles.tutorBadge}>
                <Text style={styles.tutorText}>Tuteur</Text>
              </View>
            )}
            {item.auteur_details?.role === 'etudiant' && (
              <View style={styles.studentBadge}>
                <Text style={styles.studentText}>Étudiant</Text>
              </View>
            )}
          </View>
          <View style={styles.responseMeta}>
            {item.est_solution && (
              <View style={styles.solutionBadge}>
                <Ionicons name="checkmark-circle" size={12} color="#fff" />
                <Text style={styles.solutionText}>Solution</Text>
              </View>
            )}
            <Text style={styles.responseDate}>
              {new Date(item.date).toLocaleDateString()}
            </Text>
          </View>
        </View>
        
        <Text style={styles.responseContent}>{item.contenu}</Text>
        
        {/* Afficher les messages vocaux pour cette réponse */}
        {responseVoiceMessages.map(vm => (
          <View key={vm.id} style={styles.voiceMessageContainer}>
            <View style={styles.voiceHeader}>
              <Ionicons name="mic" size={16} color="#007AFF" />
              <Text style={styles.voiceLabel}>
                Message vocal de {vm.auteur_details?.prenom} {vm.auteur_details?.nom}
              </Text>
              <Text style={styles.voiceDuration}>{vm.duree}</Text>
            </View>
            <VoicePlayer 
              audioUri={vm.fichier_audio}
              style={styles.voicePlayer}
            />
          </View>
        ))}
        
        <View style={styles.responseActions}>
          <View style={styles.voteContainer}>
            <TouchableOpacity
              style={[styles.voteButton, styles.upvote]}
              onPress={() => handleVote(item.id, 1)}
            >
              <Ionicons name="thumbs-up" size={16} color="#fff" />
              <Text style={styles.voteCount}>{item.nb_votes_positifs || 0}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.voteButton, styles.downvote]}
              onPress={() => handleVote(item.id, -1)}
            >
              <Ionicons name="thumbs-down" size={16} color="#fff" />
              <Text style={styles.voteCount}>{item.nb_votes_negatifs || 0}</Text>
            </TouchableOpacity>
          </View>
          
          {question?.auteur === item.auteur && !item.est_solution && (
            <TouchableOpacity
              style={styles.markSolutionButton}
              onPress={() => handleMarkAsSolution(item.id)}
            >
              <Ionicons name="checkmark-circle" size={16} color="#fff" />
              <Text style={styles.markSolutionText}>Marquer comme solution</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const handleVote = async (responseId, voteType) => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}/api/forum/votes/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reponse: responseId,
          valeur: voteType
        })
      });

      if (response.ok) {
        loadQuestionDetail();
      }
    } catch (error) {
      console.error('Erreur vote:', error);
    }
  };

  const handleMarkAsSolution = async (responseId) => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}/api/forum/reponses/${responseId}/marquer_solution/`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        Alert.alert('Succès', 'Réponse marquée comme solution');
        loadQuestionDetail();
      }
    } catch (error) {
      console.error('Erreur marquage solution:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <>
      <Header title="Détail Question" showBack onBackPress={() => navigation.goBack()} />
      <View style={styles.container}>
        <ScrollView style={styles.content} refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadQuestionDetail} />
        }>
          {/* Détails de la question */}
          <Card style={styles.questionCard}>
            <View style={styles.questionHeader}>
              <Text style={styles.questionTitle}>{question?.titre}</Text>
              <View style={styles.questionMeta}>
                {question?.est_resolue && (
                  <View style={styles.resolvedBadge}>
                    <Ionicons name="checkmark-circle" size={16} color="#fff" />
                    <Text style={styles.resolvedText}>Résolue</Text>
                  </View>
                )}
                <Text style={styles.questionDate}>
                  {new Date(question?.date_publication).toLocaleDateString()}
                </Text>
              </View>
            </View>
            <Text style={styles.questionContent}>{question?.contenu}</Text>
            <View style={styles.questionTags}>
              <Text style={styles.questionMatiere}>{question?.matiere}</Text>
              <Text style={styles.questionTags}>{question?.tags}</Text>
            </View>
          </Card>

          {/* Réponses */}
          <View style={styles.responsesSection}>
            <Text style={styles.responsesTitle}>
              Réponses ({question?.reponses?.length || 0})
            </Text>
            
            {loadingVoices && (
              <ActivityIndicator size="small" color="#007AFF" style={styles.loadingVoices} />
            )}
            
            <View style={styles.responsesList}>
              {question?.reponses?.map((response) => (
                <View key={response.id}>
                  {renderResponse({ item: response })}
                </View>
              ))}
            </View>
          </View>

          {/* Formulaire de réponse */}
          <Card style={styles.answerCard}>
            <Text style={styles.answerTitle}>Votre réponse:</Text>
            <TextInput
              style={styles.answerInput}
              multiline
              value={answerText}
              onChangeText={setAnswerText}
              placeholder="Tapez votre réponse ici..."
              textAlignVertical="top"
            />
            
            {/* Section d'enregistrement vocal pour les tuteurs */}
            <View style={styles.voiceSection}>
              <Text style={styles.voiceSectionTitle}>🎤 Réponse vocale (optionnel):</Text>
              <VoiceRecorder 
                onRecordingComplete={handleVoiceRecordingComplete}
                onRecordingStart={() => setRecordingVoice(true)}
                onRecordingStop={() => setRecordingVoice(false)}
                maxDuration={300}
              />
              {audioFile && (
                <View style={styles.audioFileInfo}>
                  <Text style={styles.audioFileText}>
                    📁 Audio enregistré: {Math.floor(audioFile.duration)}s
                  </Text>
                  <TouchableOpacity
                    style={styles.clearAudioButton}
                    onPress={() => setAudioFile(null)}
                  >
                    <Ionicons name="close-circle" size={16} color="#dc3545" />
                    <Text style={styles.clearAudioText}>Supprimer</Text>
                  </TouchableOpacity>
                </View>
              )}
              {recordingVoice && (
                <View style={styles.recordingIndicator}>
                  <ActivityIndicator size="small" color="#dc3545" />
                  <Text style={styles.recordingText}>Enregistrement en cours...</Text>
                </View>
              )}
            </View>
            
            <TouchableOpacity
              style={[styles.sendButton, sendingAnswer && styles.sendButtonDisabled]}
              onPress={handleAnswer}
              disabled={sendingAnswer}
            >
              {sendingAnswer ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.sendButtonText}>Envoyer la réponse</Text>
              )}
            </TouchableOpacity>
          </Card>
        </ScrollView>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  questionCard: {
    marginBottom: 16,
    padding: 16,
  },
  questionHeader: {
    marginBottom: 12,
  },
  questionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  questionMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resolvedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#28a745',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  resolvedText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  questionDate: {
    fontSize: 12,
    color: '#666',
  },
  questionContent: {
    fontSize: 16,
    color: '#555',
    lineHeight: 24,
    marginBottom: 12,
  },
  questionTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  questionMatiere: {
    backgroundColor: '#007AFF',
    color: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    fontSize: 12,
    fontWeight: '500',
  },
  questionTags: {
    backgroundColor: '#e9ecef',
    color: '#495057',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    fontSize: 12,
  },
  responsesSection: {
    marginTop: 16,
  },
  responsesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  loadingVoices: {
    marginVertical: 8,
  },
  responsesList: {
    gap: 12,
  },
  responseItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  responseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  responseAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  responseName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginRight: 8,
  },
  tutorBadge: {
    backgroundColor: '#007bff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  tutorText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  studentBadge: {
    backgroundColor: '#28a745',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  studentText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  responseMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  solutionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#28a745',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginRight: 8,
  },
  solutionText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 4,
  },
  responseDate: {
    fontSize: 12,
    color: '#666',
  },
  responseContent: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
    marginBottom: 12,
  },
  voiceMessageContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  voiceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  voiceLabel: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
    flex: 1,
  },
  voiceDuration: {
    fontSize: 11,
    color: '#666',
    backgroundColor: '#e9ecef',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  voicePlayer: {
    marginTop: 8,
  },
  responseActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  voteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  voteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  upvote: {
    backgroundColor: '#28a745',
  },
  downvote: {
    backgroundColor: '#dc3545',
  },
  voteCount: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  markSolutionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffc107',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  markSolutionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  answerCard: {
    marginTop: 16,
    padding: 16,
  },
  answerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  answerInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 100,
    marginBottom: 12,
  },
  voiceSection: {
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#ffc107',
  },
  voiceSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#856404',
    marginBottom: 8,
  },
  audioFileInfo: {
    backgroundColor: '#d1ecf1',
    borderRadius: 6,
    padding: 8,
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  audioFileText: {
    fontSize: 12,
    color: '#0c5460',
    flex: 1,
  },
  clearAudioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8d7da',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  clearAudioText: {
    fontSize: 11,
    color: '#721c24',
    marginLeft: 4,
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8d7da',
    borderRadius: 6,
    padding: 8,
    marginTop: 8,
  },
  recordingText: {
    fontSize: 12,
    color: '#721c24',
    marginLeft: 8,
    fontWeight: '500',
  },
  sendButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default TutorQuestionDetailScreen;
