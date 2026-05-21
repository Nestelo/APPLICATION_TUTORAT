import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, 
  ActivityIndicator, RefreshControl, TextInput, FlatList, Modal,
  Image, Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/ui/Header';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import VoiceRecorder from '../../components/ui/VoiceRecorder';
import { API_BASE_URL } from '../../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getQuestions, envoyerMessageVocal } from '../../api/forumService';

const { width } = Dimensions.get('window');

const TutorForumScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState('toutes');
  const [showAnswerModal, setShowAnswerModal] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [answerText, setAnswerText] = useState('');
  const [sendingAnswer, setSendingAnswer] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [userStats, setUserStats] = useState(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [userBadges, setUserBadges] = useState([]);
  const [audioFile, setAudioFile] = useState(null);

  const [filters] = useState([
    { id: 'toutes', label: 'Toutes', icon: 'list-outline' },
    { id: 'mes_matieres', label: 'Mes matières', icon: 'book-outline' },
    { id: 'mes_reponses', label: 'Mes réponses', icon: 'chatbubble-outline' },
    { id: 'non_repondues', label: 'Non répondues', icon: 'help-circle-outline' },
    { id: 'resolues', label: 'Résolues', icon: 'checkmark-circle-outline' },
    { id: 'en_attente', label: 'En attente', icon: 'time-outline' }
  ]);

  useEffect(() => {
    loadQuestions();
    loadUserStats();
    loadUserBadges();
  }, []);

  // Recharger les questions quand le filtre change
  useEffect(() => {
    loadQuestions();
  }, [selectedFilter]);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const response = await getQuestions({ search: "" });
      if (response.success) {
        let filteredQuestions = response.data || [];
        
        // Gérer la réponse paginée de l'API
        if (filteredQuestions && typeof filteredQuestions === 'object' && 'results' in filteredQuestions) {
          filteredQuestions = filteredQuestions.results || [];
        }
        
        // Vérifier que filteredQuestions est bien un tableau avant de le filtrer
        if (!Array.isArray(filteredQuestions)) {
          console.warn('La réponse API n\'est pas un tableau:', filteredQuestions);
          filteredQuestions = [];
        }
        
        // Appliquer les filtres seulement si le tableau n'est pas vide
        if (filteredQuestions.length > 0 && selectedFilter !== 'toutes') {
          const userId = await AsyncStorage.getItem('userId');
          const userIdInt = parseInt(userId);
          
          switch (selectedFilter) {
            case 'mes_matieres':
              // Filtrer par les matières enseignées par le tuteur
              filteredQuestions = filteredQuestions.filter(q => {
                // TODO: Récupérer les matières du tuteur et filtrer
                return q.matiere && q.matiere !== '';
              });
              break;
              
            case 'mes_reponses':
              // Filtrer les questions où le tuteur a déjà répondu
              filteredQuestions = filteredQuestions.filter(q => {
                return q.reponses && q.reponses.some(r => r.auteur === userIdInt);
              });
              break;
              
            case 'non_repondues':
              // Filtrer les questions où le tuteur n'a pas encore répondu
              filteredQuestions = filteredQuestions.filter(q => {
                return !q.reponses || !q.reponses.some(r => r.auteur === userIdInt);
              });
              break;
              
            case 'resolues':
              // Filtrer les questions résolues
              filteredQuestions = filteredQuestions.filter(q => q.est_resolue);
              break;
              
            case 'en_attente':
              // Filtrer les questions en attente (non résolues et avec peu de réponses)
              filteredQuestions = filteredQuestions.filter(q => {
                return !q.est_resolue && (!q.reponses || q.reponses.length < 3);
              });
              break;
              
            default:
              break;
          }
        }
        
        console.log(`TutorForum - Questions reçues: ${filteredQuestions.length}`, filteredQuestions);
        setQuestions(filteredQuestions);
      } else {
        console.error('Erreur API getQuestions:', response.error);
        setQuestions([]);
      }
    } catch (error) {
      console.error('Erreur chargement questions:', error);
      Alert.alert('Erreur', 'Impossible de charger les questions');
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  const loadUserStats = async () => {
    try {
      // Endpoint non disponible - utiliser des valeurs par défaut
      console.log('TutorForum - Stats endpoint non disponible, utilisation des valeurs par défaut');
      setUserStats({
        questionsRepondues: 0,
        meilleureReponse: 0,
        aideApportee: 0
      });
    } catch (error) {
      console.error('Erreur stats:', error);
    }
  };

  const loadUserBadges = async () => {
    try {
      // Endpoint non disponible - utiliser des valeurs par défaut
      console.log('TutorForum - Badges endpoint non disponible, utilisation des valeurs par défaut');
      setUserBadges([]);
    } catch (error) {
      console.error('Erreur badges:', error);
    }
  };

  const loadLeaderboard = async () => {
    try {
      // Endpoint non disponible - utiliser des valeurs par défaut
      console.log('TutorForum - Leaderboard endpoint non disponible, utilisation des valeurs par défaut');
      setLeaderboard([]);
    } catch (error) {
      console.error('Erreur chargement classement:', error);
    }
  };

  const handleAnswer = async () => {
    if (!answerText.trim() && selectedFiles.length === 0 && !audioFile) {
      Alert.alert('Erreur', 'Veuillez entrer une réponse, ajouter un fichier ou enregistrer un message vocal');
      return;
    }

    try {
      setSendingAnswer(true);
      const token = await AsyncStorage.getItem('accessToken');
      
      const formData = new FormData();
      
      // Ajouter le contenu texte
      if (answerText.trim()) {
        formData.append('contenu', answerText);
      }
      
      // Ajouter l'ID de la question
      formData.append('question', selectedQuestion.id);
      
      // Ajouter les fichiers
      selectedFiles.forEach((file, index) => {
        formData.append(`fichiers`, {
          uri: file.uri,
          type: file.type,
          name: file.name
        });
      });

      // Ajouter le fichier audio si présent
      if (audioFile && audioFile.uri) {
        const uriParts = audioFile.uri.split('.');
        const fileType = uriParts[uriParts.length - 1] || '3gp';
        const fileName = `voice_answer_${Date.now()}.${fileType}`;
        
        formData.append('audio_file', {
          uri: audioFile.uri,
          name: fileName,
          type: `audio/${fileType}`,
        });
      }

      console.log('Envoi de la réponse avec:', {
        hasText: !!answerText.trim(),
        hasFiles: selectedFiles.length > 0,
        hasAudio: !!audioFile,
        questionId: selectedQuestion.id
      });

      const response = await fetch(
        `${API_BASE_URL}/api/forum/reponses/`,
        {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${token}`
            // Ne pas définir Content-Type pour FormData
          },
          body: formData
        }
      );

      if (response.ok) {
        const result = await response.json();
        console.log('Réponse envoyée avec succès:', result);
        Alert.alert('Succès', 'Votre réponse a été envoyée');
        setShowAnswerModal(false);
        setAnswerText('');
        setSelectedFiles([]);
        setAudioFile(null);
        loadQuestions();
      } else {
        const errorData = await response.json();
        console.error('Erreur API:', errorData);
        throw new Error(errorData.detail || errorData.message || 'Erreur lors de l\'envoi');
      }
    } catch (error) {
      console.error('Erreur envoi réponse:', error);
      Alert.alert('Erreur', error.message || 'Impossible d\'envoi votre réponse');
    } finally {
      setSendingAnswer(false);
    }
  };

  const handleVoiceRecordingComplete = async (audioData) => {
    try {
      setAudioFile(audioData);
      console.log('Enregistrement vocal terminé:', audioData);
      
      let reponseId = null;
      
      // Si on a déjà une réponse texte, utiliser sa première réponse
      if (selectedQuestion.reponses && selectedQuestion.reponses.length > 0) {
        reponseId = selectedQuestion.reponses[0].id;
      } else {
        // Créer une réponse texte par défaut
        const createResponse = await fetch(`${API_BASE_URL}/api/forum/reponses/`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${await AsyncStorage.getItem('accessToken')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            question: selectedQuestion.id,
            contenu: 'Réponse vocale du tuteur'
          })
        });
        
        if (!createResponse.ok) {
          throw new Error('Impossible de créer la réponse pour le message vocal');
        }
        
        const reponseData = await createResponse.json();
        reponseId = reponseData.id;
      }
      
      // Préparer les données pour le service
      const voiceData = {
        reponse: reponseId,
        fichier_audio: audioData.uri,
        duree: `00:${Math.floor(audioData.duration / 60).toString().padStart(2, '0')}:${(audioData.duration % 60).toString().padStart(2, '0')}`
      };
      
      console.log('Envoi du message vocal via service:', voiceData);
      
      // Utiliser le service pour envoyer le message vocal
      const result = await envoyerMessageVocal(voiceData);
      
      if (result.success) {
        console.log('Message vocal envoyé avec succès:', result.data);
        Alert.alert('Succès', 'Message vocal envoyé avec succès');
        
        // Recharger les questions pour voir le message vocal
        loadQuestions();
      } else {
        throw new Error(result.error || 'Erreur lors de l\'envoi du message vocal');
      }
    } catch (error) {
      console.error('Erreur envoi message vocal:', error);
      Alert.alert('Erreur', 'Impossible d\'envoyer le message vocal');
    }
  };

  const handleMarkAsSolution = async (responseId, questionId) => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const response = await fetch(
        `${API_BASE_URL}/api/forum/tutor-extended/marquer_solution_et_badge/${responseId}/`,
        {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (response.ok) {
        const data = await response.json();
        Alert.alert(
          'Succès',
          data.badge_attribue ? 
            'Solution marquée et badge "Solution Expert" obtenu !' : 
            'Solution marquée avec succès !'
        );
        loadQuestions();
        loadUserBadges();
      }
    } catch (error) {
      console.error('Erreur marquage solution:', error);
      Alert.alert('Erreur', 'Impossible de marquer comme solution');
    }
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
        loadQuestions();
      }
    } catch (error) {
      console.error('Erreur vote:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadQuestions();
    setRefreshing(false);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'haute': return '#e74c3c';
      case 'moyenne': return '#f39c12';
      case 'basse': return '#6c757d';
      default: return '#17a2b8';
    }
  };

  const renderQuestion = ({ item }) => (
    <Card style={styles.questionCard}>
      <View style={styles.questionHeader}>
        <View style={styles.questionInfo}>
          <Text style={styles.questionTitle}>{item.titre}</Text>
          <View style={styles.questionMeta}>
            <Text style={styles.matiere}>{item.matiere}</Text>
            {item.est_dans_specialite && (
              <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priorite) }]}>
                <Text style={styles.priorityText}>{item.priorite.toUpperCase()}</Text>
              </View>
            )}
          </View>
        </View>
        <View style={styles.questionStats}>
          <Text style={styles.statText}>{item.reponse_count} réponses</Text>
          {item.est_resolue && (
            <View style={styles.resolvedBadge}>
              <Ionicons name="checkmark-circle" size={16} color="#fff" />
              <Text style={styles.resolvedText}>Résolue</Text>
            </View>
          )}
        </View>
      </View>

      <Text style={styles.questionContent} numberOfLines={3}>
        {item.contenu}
      </Text>

      <View style={styles.questionActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => {
            setSelectedQuestion(item);
            setShowAnswerModal(true);
          }}
        >
          <Ionicons name="chatbubble-outline" size={20} color="#007bff" />
          <Text style={styles.actionText}>Répondre</Text>
        </TouchableOpacity>

        {item.reponses && item.reponses.length > 0 && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('TutorQuestionDetail', { questionId: item.id })}
          >
            <Ionicons name="eye-outline" size={20} color="#28a745" />
            <Text style={styles.actionText}>Voir détails</Text>
          </TouchableOpacity>
        )}
      </View>
    </Card>
  );

  return (
    <View style={styles.container}>
      <Header
        title="Forum Académique"
        showBack
        navigation={navigation}
        rightActions={[
          {
            icon: 'stats-chart-outline',
            onPress: () => setShowStatsModal(true)
          },
          {
            icon: 'trophy-outline',
            onPress: () => {
              loadLeaderboard();
              setShowLeaderboard(true);
            }
          }
        ]}
      />

      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter.id}
              style={[
                styles.filterChip,
                selectedFilter === filter.id && styles.activeFilter
              ]}
              onPress={() => {
                setSelectedFilter(filter.id);
              }}
            >
              <Ionicons name={filter.icon} size={16} color={selectedFilter === filter.id ? '#fff' : '#666'} />
              <Text style={[
                styles.filterText,
                selectedFilter === filter.id && styles.activeFilterText
              ]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <FlatList
          data={questions}
          renderItem={renderQuestion}
          keyExtractor={(item) => item.id.toString()}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <EmptyState
              icon="help-circle-outline"
              message="Aucune question trouvée"
              submessage="Essayez de modifier les filtres"
            />
          }
          contentContainerStyle={styles.listContainer}
        />
      )}

      {/* Modal de réponse */}
      <Modal
        visible={showAnswerModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAnswerModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              Répondre à: {selectedQuestion?.titre}
            </Text>
            <TouchableOpacity onPress={() => setShowAnswerModal(false)}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <TextInput
              style={styles.answerInput}
              multiline
              placeholder="Tapez votre réponse ici..."
              value={answerText}
              onChangeText={setAnswerText}
              textAlignVertical="top"
            />

            {/* Enregistrement vocal */}
            <View style={styles.voiceSection}>
              <Text style={styles.voiceSectionTitle}>Message vocal (optionnel):</Text>
              <VoiceRecorder 
                onRecordingComplete={handleVoiceRecordingComplete}
                maxDuration={180}
              />
              {audioFile && (
                <View style={styles.voiceIndicator}>
                  <Ionicons name="checkmark-circle" size={16} color="#27ae60" />
                  <Text style={styles.voiceIndicatorText}>
                    Message vocal enregistré ({audioFile.duration}s)
                  </Text>
                  <TouchableOpacity
                    style={styles.removeVoiceButton}
                    onPress={() => setAudioFile(null)}
                  >
                    <Ionicons name="close-circle" size={20} color="#e74c3c" />
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {selectedFiles.length > 0 && (
              <View style={styles.filesContainer}>
                <Text style={styles.filesTitle}>Fichiers joints:</Text>
                {selectedFiles.map((file, index) => (
                  <View key={index} style={styles.fileItem}>
                    <Ionicons name="document-text" size={16} color="#666" />
                    <Text style={styles.fileName}>{file.name}</Text>
                    <TouchableOpacity
                      onPress={() => setSelectedFiles(selectedFiles.filter((_, i) => i !== index))}
                    >
                      <Ionicons name="close-circle" size={16} color="#e74c3c" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setShowAnswerModal(false)}
            >
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.sendButton]}
              onPress={handleAnswer}
              disabled={sendingAnswer}
            >
              {sendingAnswer ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.sendButtonText}>Envoyer</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal des statistiques */}
      <Modal
        visible={showStatsModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowStatsModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Mes Statistiques</Text>
            <TouchableOpacity onPress={() => setShowStatsModal(false)}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {userStats ? (
            <ScrollView style={styles.modalContent}>
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{userStats.nb_reponses_forum || 0}</Text>
                  <Text style={styles.statLabel}>Réponses</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{userStats.nb_solutions || 0}</Text>
                  <Text style={styles.statLabel}>Solutions</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{userStats.nb_ressources || 0}</Text>
                  <Text style={styles.statLabel}>Ressources</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{userStats.nb_seances || 0}</Text>
                  <Text style={styles.statLabel}>Séances</Text>
                </View>
              </View>
            </ScrollView>
          ) : (
            <View style={styles.modalContent}>
              <Text style={styles.noStatsText}>Aucune statistique disponible</Text>
            </View>
          )}
        </View>
      </Modal>

      {/* Modal du classement */}
      <Modal
        visible={showLeaderboard}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowLeaderboard(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Classement des Tuteurs</Text>
            <TouchableOpacity onPress={() => setShowLeaderboard(false)}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <FlatList
            data={leaderboard}
            renderItem={({ item, index }) => (
              <View style={styles.leaderboardItem}>
                <View style={styles.rank}>
                  <Text style={styles.rankNumber}>#{item.position}</Text>
                </View>
                <View style={styles.leaderboardInfo}>
                  <Text style={styles.leaderboardName}>
                    {item.tuteur_details.prenom} {item.tuteur_details.nom}
                  </Text>
                  <Text style={styles.leaderboardRole}>
                    {item.tuteur_details.role}
                  </Text>
                </View>
                <View style={styles.leaderboardStats}>
                  <Text style={styles.leaderboardScore}>{item.score_total} pts</Text>
                  <Text style={styles.leaderboardStats}>{item.nb_reponses} réponses</Text>
                  <Text style={styles.leaderboardStats}>{item.nb_solutions} solutions</Text>
                </View>
              </View>
            )}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.leaderboardContainer}
          />
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  filterContainer: {
    backgroundColor: '#fff',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  activeFilter: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
  },
  filterText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#666',
  },
  activeFilterText: {
    color: '#fff',
  },
  listContainer: {
    padding: 16,
  },
  questionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  questionInfo: {
    flex: 1,
    marginRight: 12,
  },
  questionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  questionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  matiere: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#e9ecef',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  questionStats: {
    alignItems: 'flex-end',
  },
  statText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  resolvedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#28a745',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  resolvedText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
    marginLeft: 4,
  },
  questionContent: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
    marginBottom: 16,
  },
  questionActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  actionText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#666',
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
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  answerInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  filesContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  filesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#fff',
    borderRadius: 6,
    marginBottom: 6,
  },
  fileName: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
  },
  modalActions: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  sendButton: {
    backgroundColor: '#007bff',
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statItem: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#007bff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  noStatsText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    padding: 40,
  },
  leaderboardContainer: {
    padding: 16,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 8,
  },
  rank: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007bff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  leaderboardInfo: {
    flex: 1,
  },
  leaderboardName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  leaderboardRole: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  leaderboardStats: {
    alignItems: 'flex-end',
  },
  leaderboardScore: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007bff',
    marginBottom: 2,
  },
  leaderboardStats: {
    fontSize: 12,
    color: '#666',
  },
  voiceSection: {
    marginVertical: 15,
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  voiceSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 10,
  },
  voiceIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d4edda',
    padding: 10,
    borderRadius: 6,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#c3e6cb',
  },
  voiceIndicatorText: {
    flex: 1,
    fontSize: 14,
    color: '#155724',
    marginLeft: 8,
  },
  removeVoiceButton: {
    padding: 4,
  },
});

export default TutorForumScreen;
