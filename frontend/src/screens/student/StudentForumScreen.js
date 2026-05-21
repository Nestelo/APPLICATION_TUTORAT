import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  FlatList,
  RefreshControl,
  Modal,
  Dimensions,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Header from '../../components/ui/Header';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { 
  getQuestions, 
  getNotificationsForum, 
  createQuestion,
  abonnerQuestion,
  desabonnerQuestion,
  getMessagesVocauxReponse,
  envoyerMessageVocal
} from '../../api/forumService';
import { API_BASE_URL } from '../../config/api'; // ← IMPORT MANQUANT AJOUTÉ

const { width } = Dimensions.get('window');

const StudentForumScreen = ({ navigation }) => {
  const [questions, setQuestions] = useState([]);
  const [questionsSuivies, setQuestionsSuivies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('toutes');
  const [showNewQuestionModal, setShowNewQuestionModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showVocalModal, setShowVocalModal] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [newQuestion, setNewQuestion] = useState({
    titre: '',
    contenu: '',
    matiere: '',
    priorite: 'moyenne',
    tags: ''
  });
  const [vocalMessages, setVocalMessages] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [sound, setSound] = useState(null);
  const [recording, setRecording] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isSendingVocal, setIsSendingVocal] = useState(false);
  const [audioFile, setAudioFile] = useState(null);
  const [showSubmitButton, setShowSubmitButton] = useState(false);
  const recordingInterval = useRef(null);

  const filters = [
    { id: 'toutes', label: 'Toutes', icon: 'list-outline' },
    { id: 'mes_questions', label: 'Mes questions', icon: 'person-outline' },
    { id: 'resolues', label: 'Résolues', icon: 'checkmark-circle-outline' },
    { id: 'non_resolues', label: 'Non résolues', icon: 'help-circle-outline' }
  ];

  const priorities = [
    { id: 'haute', label: 'Haute', color: '#dc3545' },
    { id: 'moyenne', label: 'Moyenne', color: '#ffc107' },
    { id: 'basse', label: 'Basse', color: '#28a745' }
  ];

  const [stats, setStats] = useState({
    questions_posees: 0,
    reponses_donnees: 0,
    solutions_apportees: 0
  });
  const [votes, setVotes] = useState({});
  const [solutions, setSolutions] = useState({});

  const updateStats = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) return;
      const response = await getQuestions({ auteur: parseInt(userId) });
      if (response.success) {
        const userQuestions = response.data?.results || response.data || [];
        const questionsPosees = userQuestions.length;
        const reponsesRecues = userQuestions.reduce((total, q) => total + (q.nb_reponses || 0), 0);
        const solutionsApportees = userQuestions.filter(q => q.est_resolue).length;
        setStats({
          questions_posees: questionsPosees,
          reponses_donnees: reponsesRecues,
          solutions_apportees: solutionsApportees
        });
      }
    } catch (error) {
      console.error('Erreur mise à jour statistiques:', error);
    }
  };

  useEffect(() => {
    Audio.requestPermissionsAsync();
    Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });
  }, []);

  useEffect(() => {
    return () => {
      if (recordingInterval.current) clearInterval(recordingInterval.current);
      if (sound) sound.unloadAsync();
      if (recording) recording.stopAndUnloadAsync();
    };
  }, [sound, recording]);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const response = await getQuestions({ search: searchQuery });
      if (response.success) {
        let filteredQuestions = response.data || [];
        if (filteredQuestions && typeof filteredQuestions === 'object' && 'results' in filteredQuestions) {
          filteredQuestions = filteredQuestions.results || [];
        }
        if (!Array.isArray(filteredQuestions)) filteredQuestions = [];
        if (filteredQuestions.length > 0) {
          filteredQuestions = filteredQuestions.filter(q => q !== null && q !== undefined);
          if (selectedFilter === 'mes_questions') {
            const userId = await AsyncStorage.getItem('userId');
            filteredQuestions = filteredQuestions.filter(q => q.auteur === parseInt(userId));
          } else if (selectedFilter === 'resolues') {
            filteredQuestions = filteredQuestions.filter(q => q.est_resolue);
          } else if (selectedFilter === 'non_resolues') {
            filteredQuestions = filteredQuestions.filter(q => !q.est_resolue);
          }
        }
        setQuestions(filteredQuestions);
      } else {
        setQuestions([]);
      }
    } catch (error) {
      console.error('Erreur chargement questions:', error);
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  const loadNotifications = async () => {
    try {
      const response = await getNotificationsForum();
      if (response.success) {
        setNotifications(response.data.results || []);
      }
    } catch (error) {
      console.error('Erreur chargement notifications:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadQuestions();
    await loadNotifications();
    setRefreshing(false);
  };

  const handleCreateQuestion = async () => {
    if (!newQuestion.titre.trim() || !newQuestion.contenu.trim()) {
      Alert.alert('Erreur', 'Le titre et le contenu sont obligatoires');
      return;
    }
    try {
      const response = await createQuestion(newQuestion);
      if (response && (response.success || response.data || response.id)) {
        Alert.alert('Succès', 'Question créée avec succès');
        setNewQuestion({ titre: '', contenu: '', matiere: '', priorite: 'moyenne', tags: '' });
        setShowNewQuestionModal(false);
        await loadQuestions();
        await loadNotifications();
        await updateStats();
      } else {
        Alert.alert('Erreur', response?.error || 'Impossible de créer la question');
      }
    } catch (error) {
      console.error('Erreur création question:', error);
      Alert.alert('Erreur', 'Impossible de créer la question');
    }
  };

  const getPriorityColor = (priority) => {
    const priorityObj = priorities.find(p => p.id === priority);
    return priorityObj ? priorityObj.color : '#666';
  };

  const handleOpenVocalModal = async (question) => {
    if (!question) return;
    setSelectedQuestion(question);
    setShowVocalModal(true);
    const allVocals = [];
    for (const response of question.reponses || []) {
      try {
        const vocalsResult = await getMessagesVocauxReponse(response.id);
        if (vocalsResult && vocalsResult.success && vocalsResult.data && Array.isArray(vocalsResult.data.results)) {
          allVocals.push(...vocalsResult.data.results.map(vocal => ({ ...vocal, response_id: response.id })));
        }
      } catch (error) {
        console.error('Erreur chargement messages vocaux:', error);
      }
    }
    setVocalMessages(allVocals);
  };

  const startRecording = async () => {
    try {
      if (recording) await recording.stopAndUnloadAsync();
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission refusée', 'Autorisez l\'accès au microphone');
        return;
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(newRecording);
      setIsRecording(true);
      setRecordingTime(0);
      recordingInterval.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Erreur démarrage enregistrement:', err);
      Alert.alert('Erreur', 'Impossible de démarrer l\'enregistrement');
    }
  };

  const stopRecording = async () => {
    try {
      setIsRecording(false);
      if (recordingInterval.current) clearInterval(recordingInterval.current);
      if (recording) {
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        if (uri) {
          setAudioFile(uri);
          setShowSubmitButton(true);
          Alert.alert('Succès', 'Enregistrement terminé');
        }
        setRecording(null);
      }
    } catch (err) {
      console.error('Erreur arrêt enregistrement:', err);
      Alert.alert('Erreur', 'Impossible d\'arrêter l\'enregistrement');
    }
  };

  const playSound = async (audioUrl) => {
    try {
      if (sound) await sound.unloadAsync();
      const { sound: newSound } = await Audio.Sound.createAsync({ uri: audioUrl }, { shouldPlay: true });
      setSound(newSound);
      setIsPlaying(true);
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) setIsPlaying(false);
      });
    } catch (error) {
      console.error('Erreur lecture son:', error);
      Alert.alert('Erreur', 'Impossible de lire le message vocal');
    }
  };

  const stopSound = async () => {
    try {
      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
        setSound(null);
        setIsPlaying(false);
      }
    } catch (error) {
      console.error('Erreur arrêt lecture:', error);
    }
  };

  const sendVocalMessage = async () => {
    if (!audioFile || !selectedQuestion) {
      Alert.alert('Erreur', 'Aucun message vocal à envoyer');
      return;
    }
    try {
      setIsSendingVocal(true);
      const formData = new FormData();
      const fileUri = audioFile;
      const fileType = fileUri.endsWith('.m4a') ? 'audio/m4a' : 'audio/3gp';
      const fileName = fileUri.split('/').pop() || `message_vocal_${Date.now()}.m4a`;
      formData.append('fichier_audio', { uri: fileUri, type: fileType, name: fileName });
      formData.append('duree', formatTime(recordingTime));
      const responseId = selectedQuestion.reponses?.[0]?.id;
      if (!responseId) {
        Alert.alert('Erreur', 'Aucune réponse trouvée pour cette question');
        return;
      }
      formData.append('reponse', responseId.toString());
      const response = await envoyerMessageVocal(formData);
      if (response.success) {
        Alert.alert('Succès', 'Message vocal envoyé');
        setAudioFile(null);
        setShowSubmitButton(false);
        setRecordingTime(0);
        await handleOpenVocalModal(selectedQuestion);
      } else {
        Alert.alert('Erreur', response.error || 'Envoi impossible');
      }
    } catch (error) {
      console.error('Erreur envoi vocal:', error);
      Alert.alert('Erreur', 'Impossible d\'envoyer le message vocal');
    } finally {
      setIsSendingVocal(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleVote = async (responseId, voteType) => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const userId = await AsyncStorage.getItem('userId');
      if (!token || !userId) {
        Alert.alert('Erreur', 'Vous devez être connecté');
        return;
      }
      const response = await fetch(`${API_BASE_URL}/api/forum/reponses/${responseId}/voter/`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ vote_type: voteType, utilisateur: parseInt(userId) })
      });
      if (response.ok) {
        setVotes(prev => ({ ...prev, [responseId]: voteType }));
        Alert.alert('Succès', voteType === 'up' ? 'Vote +1' : 'Vote -1');
        await loadQuestions();
      } else {
        Alert.alert('Erreur', 'Impossible de voter');
      }
    } catch (error) {
      console.error('Erreur vote:', error);
      Alert.alert('Erreur', 'Impossible de voter');
    }
  };

  const handleMarkAsSolution = async (responseId, questionId) => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        Alert.alert('Erreur', 'Vous devez être connecté');
        return;
      }
      const response = await fetch(`${API_BASE_URL}/api/forum/questions/${questionId}/marquer-solution/`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ reponse_id: responseId })
      });
      if (response.ok) {
        setSolutions(prev => ({ ...prev, [responseId]: true }));
        Alert.alert('Succès', 'Réponse marquée comme solution');
        await loadQuestions();
      } else {
        Alert.alert('Erreur', 'Impossible de marquer comme solution');
      }
    } catch (error) {
      console.error('Erreur marquer solution:', error);
      Alert.alert('Erreur', 'Impossible de marquer comme solution');
    }
  };

  const renderQuestionItem = ({ item }) => {
    if (!item) return null;
    return (
      <Card style={styles.questionCard}>
        <View style={styles.questionHeader}>
          <View style={styles.questionInfo}>
            <View style={[styles.priorityIndicator, { backgroundColor: getPriorityColor(item.priorite) }]} />
            <View style={styles.questionDetails}>
              <Text style={styles.questionTitle}>{item.titre || 'Question sans titre'}</Text>
              <Text style={styles.questionMeta}>
                {item.matiere || 'Non spécifiée'} - {item.auteur_details?.prenom || 'Anonyme'} {item.auteur_details?.nom || ''}
              </Text>
              <Text style={styles.questionDate}>
                {item.date_publication ? new Date(item.date_publication).toLocaleDateString('fr-FR') : 'Date inconnue'}
              </Text>
            </View>
          </View>
          <View style={styles.questionStatus}>
            {item.est_resolue && <Badge text="Résolue" color="#28a745" />}
            {item.nb_messages_vocaux > 0 && (
              <View style={styles.vocalIndicator}>
                <Ionicons name="mic-outline" size={12} color="#fff" />
                <Text style={styles.vocalIndicatorText}>{item.nb_messages_vocaux}</Text>
              </View>
            )}
            <Text style={styles.responsesCount}>{item.nb_reponses || 0} réponses</Text>
          </View>
        </View>

        <Text style={styles.questionContent} numberOfLines={3}>
          {item.contenu || 'Aucun contenu'}
        </Text>

        {/* Affichage des réponses textuelles */}
        {item.reponses && item.reponses.length > 0 && (
          <View style={styles.responsesContainer}>
            <Text style={styles.responsesTitle}>Réponses ({item.reponses.length})</Text>
            {item.reponses.slice(0, 3).map((response) => (
              <View key={response.id} style={styles.responseItem}>
                <View style={styles.responseHeader}>
                  <View style={styles.responseAuthor}>
                    <Text style={styles.authorName}>
                      {response.auteur_details?.prenom} {response.auteur_details?.nom}
                    </Text>
                    <Text style={styles.authorRole}>
                      {response.auteur_details?.role === 'tuteur' ? 'Tuteur' : 'Étudiant'}
                    </Text>
                    <Text style={styles.responseDate}>
                      {new Date(response.date_creation || response.date).toLocaleDateString('fr-FR')}
                    </Text>
                  </View>
                  {response.est_solution && (
                    <View style={styles.solutionBadge}>
                      <Text style={styles.solutionText}>Solution</Text>
                    </View>
                  )}
                </View>
                {response.contenu && response.contenu.trim() !== '' && (
                  <Text style={styles.responseContent}>{response.contenu}</Text>
                )}
                <View style={styles.responseActions}>
                  <TouchableOpacity
                    style={[styles.voteButton, votes[response.id] === 'up' && styles.voteButtonActive]}
                    onPress={() => handleVote(response.id, 'up')}
                  >
                    <Ionicons name={votes[response.id] === 'up' ? "thumbs-up" : "thumbs-up-outline"} size={16} color={votes[response.id] === 'up' ? "#fff" : "#007AFF"} />
                    <Text style={[styles.voteText, votes[response.id] === 'up' && styles.voteTextActive]}>+1</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.voteButton, votes[response.id] === 'down' && styles.voteButtonActiveDown]}
                    onPress={() => handleVote(response.id, 'down')}
                  >
                    <Ionicons name={votes[response.id] === 'down' ? "thumbs-down" : "thumbs-down-outline"} size={16} color={votes[response.id] === 'down' ? "#fff" : "#e74c3c"} />
                    <Text style={[styles.voteText, votes[response.id] === 'down' && styles.voteTextActiveDown]}>-1</Text>
                  </TouchableOpacity>
                  {!solutions[response.id] && !response.est_solution && (
                    <TouchableOpacity style={styles.solutionButton} onPress={() => handleMarkAsSolution(response.id, item.id)}>
                      <Ionicons name="checkmark-circle-outline" size={16} color="#28a745" />
                      <Text style={styles.solutionButtonText}>Solution</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={styles.hideButton}>
                    <Ionicons name="eye-off-outline" size={16} color="#666" />
                    <Text style={styles.hideText}>Masquer</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            {item.reponses.length > 2 && (
              <TouchableOpacity style={styles.seeAllButton} onPress={() => navigation.navigate('QuestionDetail', { questionId: item.id })}>
                <Text style={styles.seeAllText}>Voir toutes les réponses ({item.reponses.length - 3} restantes)</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <View style={styles.questionActions}>
          <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('QuestionDetail', { questionId: item.id })}>
            <Ionicons name="open-outline" size={16} color="#007AFF" />
            <Text style={styles.actionText}>Voir</Text>
          </TouchableOpacity>
          {item.nb_messages_vocaux > 0 && (
            <TouchableOpacity style={[styles.actionButton, styles.vocalActionButton]} onPress={() => handleOpenVocalModal(item)}>
              <Ionicons name="musical-notes" size={16} color="#e74c3c" />
              <Text style={styles.actionText}>Audio</Text>
            </TouchableOpacity>
          )}
        </View>
      </Card>
    );
  };

  const renderNotificationItem = ({ item }) => {
    if (!item) return null;
    return (
      <TouchableOpacity style={styles.notificationItem}>
        <View style={styles.notificationIcon}>
          <Ionicons 
            name={
              item.type_notification === 'nouvelle_reponse' ? 'chatbubble-outline' :
              item.type_notification === 'solution' ? 'checkmark-circle-outline' :
              item.type_notification === 'vocal' ? 'mic-outline' : 'notifications-outline'
            } 
            size={20} 
            color="#007AFF" 
          />
        </View>
        <View style={styles.notificationContent}>
          <Text style={styles.notificationMessage}>{item.message || 'Notification sans message'}</Text>
          <Text style={styles.notificationTime}>
            {item.date_creation ? new Date(item.date_creation).toLocaleDateString('fr-FR') : 'Date inconnue'}
          </Text>
        </View>
        {!item.est_lue && <View style={styles.notificationDot} />}
      </TouchableOpacity>
    );
  };

  useEffect(() => {
    loadQuestions();
    loadNotifications();
    updateStats();
  }, []);

  useEffect(() => { if (searchQuery) loadQuestions(); }, [searchQuery]);
  useEffect(() => { if (selectedFilter) loadQuestions(); }, [selectedFilter]);

  useEffect(() => {
    const interval = setInterval(() => { loadQuestions(); }, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => { loadQuestions(); });
    return unsubscribe;
  }, [navigation]);

  if (loading) {
    return (
      <>
        <Header title="Forum" />
        <LoadingSpinner />
      </>
    );
  }

  return (
    <>
      <Header title="Forum" />
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>Forum des questions</Text>
          <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh} disabled={refreshing}>
            <Ionicons name={refreshing ? "refresh" : "refresh-outline"} size={20} color="#007AFF" />
            <Text style={styles.refreshText}>{refreshing ? 'Actualisation...' : 'Actualiser'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.filtersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {filters.map((filter) => (
              <TouchableOpacity
                key={filter.id}
                style={[styles.filterButton, selectedFilter === filter.id && styles.filterButtonSelected]}
                onPress={() => setSelectedFilter(filter.id)}
              >
                <Ionicons name={filter.icon} size={16} color={selectedFilter === filter.id ? '#fff' : '#666'} />
                <Text style={[styles.filterText, selectedFilter === filter.id && styles.filterTextSelected]}>{filter.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color="#666" style={styles.searchIcon} />
          <TextInput style={styles.searchInput} placeholder="Rechercher une question..." value={searchQuery} onChangeText={setSearchQuery} />
        </View>

        {questions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubble-ellipses-outline" size={40} color="#ccc" />
            <Text style={styles.emptyText}>Aucune question trouvée</Text>
          </View>
        ) : (
          <FlatList
            data={questions}
            renderItem={renderQuestionItem}
            keyExtractor={(item) => item?.id?.toString() || Math.random().toString()}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
            contentContainerStyle={styles.listContainer}
            style={styles.list}
          />
        )}

        <TouchableOpacity style={styles.fab} onPress={() => setShowNewQuestionModal(true)}>
          <Ionicons name="add-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Modal nouvelle question */}
      <Modal visible={showNewQuestionModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowNewQuestionModal(false)}><Ionicons name="close-outline" size={24} color="#666" /></TouchableOpacity>
            <Text style={styles.modalTitle}>Nouvelle question</Text>
            <TouchableOpacity onPress={handleCreateQuestion} disabled={!newQuestion.titre.trim() || !newQuestion.contenu.trim()} style={[styles.createButton, (!newQuestion.titre.trim() || !newQuestion.contenu.trim()) && styles.createButtonDisabled]}>
              <Ionicons name="checkmark-outline" size={24} color={(!newQuestion.titre.trim() || !newQuestion.contenu.trim()) ? '#ccc' : '#007AFF'} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            <TextInput style={styles.input} placeholder="Titre de la question *" value={newQuestion.titre} onChangeText={(text) => setNewQuestion({...newQuestion, titre: text})} />
            <TextInput style={[styles.input, styles.textArea]} placeholder="Contenu de la question *" value={newQuestion.contenu} onChangeText={(text) => setNewQuestion({...newQuestion, contenu: text})} multiline numberOfLines={4} />
            <TextInput style={styles.input} placeholder="Matière" value={newQuestion.matiere} onChangeText={(text) => setNewQuestion({...newQuestion, matiere: text})} />
            <TextInput style={styles.input} placeholder="Tags (séparés par des virgules)" value={newQuestion.tags} onChangeText={(text) => setNewQuestion({...newQuestion, tags: text})} />
            <Text style={styles.label}>Priorité</Text>
            <View style={styles.priorityContainer}>
              {priorities.map((priority) => (
                <TouchableOpacity key={priority.id} style={[styles.priorityOption, newQuestion.priorite === priority.id && styles.priorityOptionSelected]} onPress={() => setNewQuestion({...newQuestion, priorite: priority.id})}>
                  <Text style={[styles.priorityText, newQuestion.priorite === priority.id && { color: priority.color }]}>{priority.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Modal notifications */}
      <Modal visible={showNotifications} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowNotifications(false)}><Ionicons name="close-outline" size={24} color="#666" /></TouchableOpacity>
            <Text style={styles.modalTitle}>Notifications</Text>
          </View>
          <ScrollView style={styles.modalContent}>
            {notifications.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="notifications-off-outline" size={40} color="#ccc" />
                <Text style={styles.emptyText}>Vous n'avez aucune notification</Text>
              </View>
            ) : (
              notifications.map((notification) => renderNotificationItem({ item: notification }))
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Modal messages vocaux */}
      <Modal visible={showVocalModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowVocalModal(false)}><Ionicons name="close-outline" size={24} color="#666" /></TouchableOpacity>
            <Text style={styles.modalTitle}>Messages Vocaux</Text>
          </View>
          <ScrollView style={styles.modalContent}>
            {selectedQuestion && (
              <>
                <Text style={styles.questionTitle}>{selectedQuestion.titre}</Text>
                <Text style={styles.questionAuthor}>Par {selectedQuestion.auteur_details?.prenom || 'Anonyme'} {selectedQuestion.auteur_details?.nom || ''}</Text>
              </>
            )}
            <View style={styles.recordingSection}>
              <Text style={styles.sectionTitle}>Envoyer un message vocal</Text>
              <View style={styles.recordingControls}>
                <TouchableOpacity style={[styles.recordButton, isRecording && styles.recordButtonActive]} onPress={isRecording ? stopRecording : startRecording}>
                  <Ionicons name={isRecording ? "stop-outline" : "mic-outline"} size={24} color="#fff" />
                </TouchableOpacity>
                <View style={styles.recordingInfo}>
                  <Text style={styles.recordingTime}>{isRecording ? formatTime(recordingTime) : '00:00'}</Text>
                  <Text style={styles.recordingStatus}>{isRecording ? 'Enregistrement...' : audioFile ? 'Enregistrement terminé' : 'Appuyez pour enregistrer'}</Text>
                </View>
              </View>
              {showSubmitButton && (
                <TouchableOpacity style={styles.sendButton} onPress={sendVocalMessage} disabled={isSendingVocal}>
                  <Ionicons name="send-outline" size={16} color="#fff" />
                  <Text style={styles.sendButtonText}>{isSendingVocal ? 'Envoi...' : 'Envoyer'}</Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.vocalMessagesSection}>
              <Text style={styles.sectionTitle}>Messages vocaux des tuteurs</Text>
              {vocalMessages.length === 0 ? (
                <Text style={styles.noVocalsText}>Aucun message vocal</Text>
              ) : (
                vocalMessages.map((vocal) => (
                  <View key={vocal.id} style={styles.vocalMessageItem}>
                    <View style={styles.vocalMessageHeader}>
                      <Ionicons name="mic-outline" size={20} color="#007AFF" />
                      <Text style={styles.vocalAuthor}>{vocal.auteur_details?.prenom || ''} {vocal.auteur_details?.nom || ''}</Text>
                      <Text style={styles.vocalDate}>{vocal.date_envoi ? new Date(vocal.date_envoi).toLocaleDateString('fr-FR') : 'Date inconnue'}</Text>
                    </View>
                    <Text style={styles.vocalContent}>{vocal.contenu || 'Message vocal'}</Text>
                    <View style={styles.vocalActions}>
                      <TouchableOpacity style={styles.playButton} onPress={() => playSound(vocal.fichier_audio)}>
                        <Ionicons name="play-outline" size={16} color="#007AFF" />
                        <Text style={styles.playButtonText}>Écouter</Text>
                      </TouchableOpacity>
                      {isPlaying && (
                        <TouchableOpacity style={styles.stopButton} onPress={stopSound}>
                          <Ionicons name="stop-outline" size={16} color="#e74c3c" />
                          <Text style={styles.stopButtonText}>Arrêter</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                ))
              )}
            </View>
          </ScrollView>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  headerContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 10, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e9ecef' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  refreshButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0f8ff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#007AFF' },
  refreshText: { fontSize: 12, color: '#007AFF', marginLeft: 5, fontWeight: '500' },
  filtersContainer: { backgroundColor: '#fff', padding: 15, borderBottomWidth: 1, borderBottomColor: '#e9ecef' },
  filterButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 8, marginRight: 10, backgroundColor: '#f8f9fa', borderRadius: 20, borderWidth: 1, borderColor: '#e9ecef' },
  filterButtonSelected: { backgroundColor: '#007AFF' },
  filterText: { marginLeft: 5, fontSize: 14, color: '#666' },
  filterTextSelected: { color: '#fff' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderBottomWidth: 1, borderBottomColor: '#e9ecef' },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, height: 40, borderWidth: 1, borderColor: '#e9ecef', borderRadius: 20, paddingHorizontal: 15 },
  list: { flex: 1 },
  listContainer: { padding: 15 },
  questionCard: { backgroundColor: '#fff', marginBottom: 15, borderRadius: 10, padding: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  questionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  questionInfo: { flex: 1, flexDirection: 'row', alignItems: 'flex-start' },
  priorityIndicator: { width: 4, height: 4, borderRadius: 2, marginRight: 10 },
  questionDetails: { flex: 1 },
  questionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 5 },
  questionMeta: { fontSize: 12, color: '#666', marginBottom: 5 },
  questionDate: { fontSize: 11, color: '#999' },
  questionStatus: { alignItems: 'flex-end' },
  vocalIndicator: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#e74c3c', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10, marginLeft: 5 },
  vocalIndicatorText: { color: '#fff', fontSize: 10, marginLeft: 3 },
  responsesCount: { fontSize: 12, color: '#666', marginTop: 5 },
  questionContent: { fontSize: 14, color: '#666', lineHeight: 20, marginVertical: 10 },
  responsesContainer: { marginTop: 15, borderTopWidth: 1, borderTopColor: '#e9ecef', paddingTop: 15 },
  responsesTitle: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 10 },
  responseItem: { backgroundColor: '#f8f9fa', padding: 12, marginBottom: 10, borderRadius: 8, borderWidth: 1, borderColor: '#e9ecef' },
  responseHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  responseAuthor: { flex: 1 },
  authorName: { fontSize: 14, fontWeight: '600', color: '#333' },
  authorRole: { fontSize: 12, color: '#666', fontStyle: 'italic', marginTop: 2 },
  responseDate: { fontSize: 11, color: '#999', marginTop: 2 },
  solutionBadge: { backgroundColor: '#28a745', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  solutionText: { color: '#fff', fontSize: 10, fontWeight: '600' },
  responseContent: { fontSize: 14, color: '#333', lineHeight: 20, marginBottom: 10 },
  responseActions: { flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center', gap: 15 },
  voteButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 4, backgroundColor: '#f0f0f0' },
  voteText: { fontSize: 12, marginLeft: 4, color: '#333' },
  voteButtonActive: { backgroundColor: '#007AFF' },
  voteTextActive: { color: '#fff' },
  voteButtonActiveDown: { backgroundColor: '#e74c3c' },
  voteTextActiveDown: { color: '#fff' },
  solutionButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 4, backgroundColor: '#f0f8f0', borderWidth: 1, borderColor: '#28a745' },
  solutionButtonText: { fontSize: 12, marginLeft: 4, color: '#28a745', fontWeight: '500' },
  hideButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 4, backgroundColor: '#f0f0f0' },
  hideText: { fontSize: 12, marginLeft: 4, color: '#666' },
  seeAllButton: { alignItems: 'center', paddingVertical: 8, marginTop: 5 },
  seeAllText: { color: '#007AFF', fontSize: 14, fontWeight: '500' },
  questionActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 },
  actionButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, marginLeft: 5, backgroundColor: '#f8f9fa', borderRadius: 15, borderWidth: 1, borderColor: '#e9ecef' },
  vocalActionButton: { borderColor: '#e74c3c' },
  actionText: { fontSize: 12, color: '#666', marginLeft: 3 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 50 },
  emptyText: { fontSize: 16, color: '#666', textAlign: 'center', marginTop: 10 },
  fab: { position: 'absolute', bottom: 30, right: 30, width: 56, height: 56, borderRadius: 28, backgroundColor: '#007AFF', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5 },
  modalContainer: { flex: 1, backgroundColor: '#fff' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#e9ecef' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  modalContent: { flex: 1, padding: 20 },
  input: { borderWidth: 1, borderColor: '#e9ecef', borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 15 },
  textArea: { height: 100, textAlignVertical: 'top' },
  label: { fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  priorityContainer: { flexDirection: 'row', marginBottom: 15 },
  priorityOption: { paddingHorizontal: 15, paddingVertical: 8, marginRight: 10, borderRadius: 8, borderWidth: 1, borderColor: '#e9ecef' },
  priorityOptionSelected: { backgroundColor: '#007AFF' },
  priorityText: { fontSize: 14, color: '#666' },
  notificationItem: { flexDirection: 'row', padding: 15, borderBottomWidth: 1, borderBottomColor: '#e9ecef' },
  notificationIcon: { marginRight: 15 },
  notificationContent: { flex: 1 },
  notificationMessage: { fontSize: 14, color: '#333', marginBottom: 5 },
  notificationTime: { fontSize: 12, color: '#666' },
  notificationDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#e74c3c' },
  questionTitleModal: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  questionAuthor: { fontSize: 14, color: '#666', marginBottom: 20 },
  recordingSection: { backgroundColor: '#f8f9fa', padding: 20, borderRadius: 10, marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  recordingControls: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  recordButton: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#e74c3c', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  recordButtonActive: { backgroundColor: '#c0392b' },
  recordingInfo: { flex: 1 },
  recordingTime: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  recordingStatus: { fontSize: 12, color: '#666', marginTop: 5 },
  sendButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#28a745', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 20, alignSelf: 'flex-start' },
  sendButtonText: { color: '#fff', fontSize: 14, marginLeft: 5 },
  vocalMessagesSection: { marginTop: 20 },
  noVocalsText: { fontSize: 14, color: '#666', textAlign: 'center', fontStyle: 'italic' },
  vocalMessageItem: { backgroundColor: '#f8f9fa', padding: 15, marginBottom: 10, borderRadius: 8, borderWidth: 1, borderColor: '#e9ecef' },
  vocalMessageHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  vocalAuthor: { fontSize: 14, fontWeight: 'bold', color: '#007AFF', marginLeft: 10 },
  vocalDate: { fontSize: 12, color: '#666', marginLeft: 10 },
  vocalContent: { fontSize: 14, color: '#333', marginBottom: 10 },
  vocalActions: { flexDirection: 'row', justifyContent: 'flex-end' },
  playButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#007AFF', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 15, marginRight: 10 },
  playButtonText: { color: '#fff', fontSize: 12, marginLeft: 5 },
  stopButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#e74c3c', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 15 },
  stopButtonText: { color: '#fff', fontSize: 12, marginLeft: 5 },
  createButton: { padding: 5, borderRadius: 15, backgroundColor: 'transparent' },
  createButtonDisabled: { opacity: 0.5 },
});

export default StudentForumScreen;