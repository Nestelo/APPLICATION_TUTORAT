import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, 
  ActivityIndicator, RefreshControl, TextInput, FlatList, Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/ui/Header';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import { API_BASE_URL } from '../../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../context/AuthContext';
import VoicePlayer from '../../components/ui/VoicePlayer';
import VoiceRecorder from '../../components/ui/VoiceRecorder';
import { getMessagesVocauxReponse, envoyerMessageVocal } from '../../api/forumService';
import { VoiceRecordingHelper } from '../../utils/VoiceRecordingHelper';

const StudentForumScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState('toutes');
  const [showAskModal, setShowAskModal] = useState(false);
  const [questionTitle, setQuestionTitle] = useState('');
  const [questionContent, setQuestionContent] = useState('');
  const [selectedMatiere, setSelectedMatiere] = useState('');
  const [sendingQuestion, setSendingQuestion] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [showQuestionDetail, setShowQuestionDetail] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [answerText, setAnswerText] = useState('');
  const [sendingAnswer, setSendingAnswer] = useState(false);
  const [voiceMessages, setVoiceMessages] = useState([]);
  const [loadingVoices, setLoadingVoices] = useState(false);
  const [audioFile, setAudioFile] = useState(null);
  const [recordingVoice, setRecordingVoice] = useState(false);

  const [matieres] = useState([
    'Mathématiques', 'Physique', 'Chimie', 'Biologie', 
    'Informatique', 'Français', 'Anglais', 'Histoire', 'Géographie'
  ]);

  const [filters] = useState([
    { id: 'toutes', label: 'Toutes', icon: 'list-outline' },
    { id: 'mes_questions', label: 'Mes questions', icon: 'person-outline' },
    { id: 'resolues', label: 'Résolues', icon: 'checkmark-circle-outline' },
    { id: 'non_resolues', label: 'Non résolues', icon: 'help-circle-outline' },
    { id: 'avec_reponses', label: 'Avec réponses', icon: 'chatbubble-outline' }
  ]);

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('accessToken');
      
      let url = `${API_BASE_URL}/api/forum/questions/`;
      if (selectedFilter !== 'toutes') {
        url += `?filter=${selectedFilter}`;
      }
      
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setQuestions(data);
      } else {
        throw new Error('Erreur lors du chargement');
      }
    } catch (error) {
      console.error('Erreur chargement questions:', error);
      Alert.alert('Erreur', 'Impossible de charger les questions');
    } finally {
      setLoading(false);
    }
  };

  const handleAskQuestion = async () => {
    if (!questionTitle.trim() || !questionContent.trim() || !selectedMatiere) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    try {
      setSendingQuestion(true);
      const token = await AsyncStorage.getItem('accessToken');
      
      const response = await fetch(`${API_BASE_URL}/api/forum/questions/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          titre: questionTitle,
          contenu: questionContent,
          matiere: selectedMatiere,
          tags: selectedMatiere.toLowerCase()
        })
      });

      if (response.ok) {
        Alert.alert('Succès', 'Votre question a été publiée');
        setShowAskModal(false);
        setQuestionTitle('');
        setQuestionContent('');
        setSelectedMatiere('');
        loadQuestions();
      } else {
        throw new Error('Erreur lors de la publication');
      }
    } catch (error) {
      console.error('Erreur publication question:', error);
      Alert.alert('Erreur', 'Impossible de publier votre question');
    } finally {
      setSendingQuestion(false);
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
          question: selectedQuestion.id,
          contenu: answerText
        })
      });

      if (response.ok) {
        Alert.alert('Succès', 'Votre réponse a été envoyée');
        setAnswerText('');
        loadQuestions();
        loadQuestionDetail(selectedQuestion.id);
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
      console.log('Enregistrement vocal étudiant terminé:', audioData);
      
      // Si c'est un fichier simulé (mock), créer un vrai fichier temporaire
      if (audioData.uri && audioData.uri.includes('mock_audio_file.mp3')) {
        console.log('Fichier simulé détecté, création d\'un vrai fichier temporaire');
        const realAudioFile = await VoiceRecordingHelper.createMockAudioFile();
        if (realAudioFile) {
          setAudioFile(realAudioFile);
          console.log('Fichier audio réel créé:', realAudioFile);
          // Envoyer automatiquement le message vocal avec le vrai fichier
          await sendVoiceMessage(realAudioFile);
        } else {
          Alert.alert('Erreur', 'Impossible de créer le fichier audio');
        }
        return;
      }
      
      // Valider le fichier audio
      const validation = await VoiceRecordingHelper.validateAudioFile(audioData);
      if (!validation.valid) {
        console.log('Fichier audio invalide, création d\'un fichier de test');
        const mockAudio = await VoiceRecordingHelper.createMockAudioFile();
        if (mockAudio) {
          setAudioFile(mockAudio);
          Alert.alert('Info', 'Fichier audio de test créé. Enregistrement réel requis pour l\'envoi.');
        }
        return;
      }
      
      // Si c'est un fichier simulé (test), ne pas envoyer automatiquement
      if (audioData.uri && (audioData.uri.includes('mock_') || audioData.uri.includes('test_'))) {
        console.log('Fichier audio simulé détecté, envoi différé');
        Alert.alert('Info', 'Fichier audio de test détecté. Utilisez un vrai enregistrement vocal.');
        return;
      }
      
      // Envoyer le message vocal
      await sendVoiceMessage(audioData);
      
    } catch (error) {
      console.error('Erreur enregistrement vocal:', error);
      Alert.alert('Erreur', 'Impossible d\'enregistrer le message vocal');
    }
  };

  const sendVoiceMessage = async (audioData) => {
    try {
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
          question: selectedQuestion.id,
          contenu: 'Réponse vocale de l\'étudiant'
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
        duree: VoiceRecordingHelper.formatDuration(audioData.duration)
      };
      
      console.log('Envoi du message vocal étudiant:', voiceData);
      
      // Utiliser le service pour envoyer le message vocal
      const result = await envoyerMessageVocal(voiceData);
      
      if (result.success) {
        console.log('Message vocal étudiant envoyé avec succès:', result.data);
        Alert.alert('Succès', 'Message vocal envoyé avec succès');
        
        // Recharger la question pour voir le message vocal
        loadQuestions();
        loadQuestionDetail(selectedQuestion.id);
        setAudioFile(null);
      } else {
        throw new Error(result.error || 'Erreur lors de l\'envoi du message vocal');
      }
    } catch (error) {
      console.error('Erreur envoi message vocal étudiant:', error);
      Alert.alert('Erreur', 'Impossible d\'envoyer le message vocal');
    }
  };

  const handleVote = async (responseId, voteType) => {
    try {
      console.log('=== DÉBUT DU VOTE ===');
      console.log('Response ID:', responseId, 'Vote Type:', voteType);
      
      const token = await AsyncStorage.getItem('accessToken');
      const userStr = await AsyncStorage.getItem('user');
      
      console.log('Token trouvé:', !!token);
      console.log('UserStr trouvé:', !!userStr);
      console.log('UserStr contenu:', userStr);
      
      if (!userStr) {
        console.error('❌ userStr est null ou vide');
        Alert.alert('Erreur', 'Utilisateur non connecté - userStr manquant');
        return;
      }
      
      let user;
      try {
        user = JSON.parse(userStr);
        console.log('✅ User parsé avec succès:', user);
      } catch (parseError) {
        console.error('❌ Erreur parsing JSON userStr:', parseError);
        Alert.alert('Erreur', 'Erreur de données utilisateur');
        return;
      }
      
      if (!user) {
        console.error('❌ User est null après parsing');
        Alert.alert('Erreur', 'Utilisateur non connecté - user null');
        return;
      }
      
      if (!user.id) {
        console.error('❌ User.id est manquant:', user);
        Alert.alert('Erreur', 'Utilisateur non connecté - ID manquant');
        return;
      }

      console.log('✅ Données utilisateur valides:', { id: user.id, nom: user.nom, prenom: user.prenom });
      
      const voteData = { 
        reponse: responseId, 
        valeur: voteType,
        votant: user.id
      };
      
      console.log('📤 Données envoyées pour voter:', voteData);

      const response = await fetch(`${API_BASE_URL}/api/forum/votes/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(voteData)
      });

      console.log('📡 Réponse API vote:', response.status, response.statusText);

      if (response.ok) {
        console.log('✅ Vote enregistré avec succès');
        loadQuestions();
        if (selectedQuestion) {
          loadQuestionDetail(selectedQuestion.id);
        }
      } else {
        const errorData = await response.json();
        console.error('❌ Erreur API vote:', errorData);
        Alert.alert('Erreur', errorData.detail || 'Impossible de voter');
      }
    } catch (error) {
      console.error('❌ Erreur vote générale:', error);
      Alert.alert('Erreur', 'Impossible de voter');
    }
  };

  const handleMarkAsSolution = async (responseId) => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const userStr = await AsyncStorage.getItem('user');
      
      if (!userStr) {
        Alert.alert('Erreur', 'Utilisateur non connecté');
        return;
      }
      
      const user = JSON.parse(userStr);
      
      if (!user || !user.id) {
        Alert.alert('Erreur', 'Utilisateur non connecté');
        return;
      }

      console.log('Tentative de marquer comme solution (étudiant):', responseId, 'par utilisateur:', user.id);

      const response = await fetch(
        `${API_BASE_URL}/api/forum/reponses/${responseId}/marquer_solution/`,
        {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            votant: user.id // Utiliser l'ID utilisateur depuis AsyncStorage
          })
        }
      );

      if (response.ok) {
        const result = await response.json();
        console.log('Solution marquée avec succès:', result);
        Alert.alert('Succès', 'Solution marquée avec succès');
        loadQuestions();
        if (selectedQuestion) {
          loadQuestionDetail(selectedQuestion.id);
        }
      } else {
        const errorData = await response.json();
        console.error('Erreur API marquer solution:', errorData);
        
        if (response.status === 403) {
          Alert.alert('Erreur', 'Seul l\'auteur de la question peut marquer une réponse comme solution');
        } else {
          Alert.alert('Erreur', errorData.detail || 'Impossible de marquer comme solution');
        }
      }
    } catch (error) {
      console.error('Erreur marquage solution:', error);
      Alert.alert('Erreur', 'Impossible de marquer comme solution');
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

  const loadQuestionDetail = async (questionId) => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}/api/forum/questions/${questionId}/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedQuestion(data);
        
        // Charger les messages vocaux pour cette question
        if (data.reponses && data.reponses.length > 0) {
          await loadVoiceMessages(data.reponses);
        }
      }
    } catch (error) {
      console.error('Erreur chargement détail:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadQuestions();
    setRefreshing(false);
  };

  const renderQuestion = ({ item }) => (
    <TouchableOpacity
      style={styles.questionCard}
      onPress={() => {
        setSelectedQuestion(item);
        setShowQuestionDetail(true);
        loadQuestionDetail(item.id);
      }}
    >
      <View style={styles.questionHeader}>
        <View style={styles.questionInfo}>
          <Text style={styles.questionTitle}>{item?.titre || 'Sans titre'}</Text>
          <View style={styles.questionMeta}>
            <Text style={styles.matiere}>{item?.matiere || 'Non spécifiée'}</Text>
            {item.est_resolue && (
              <View style={styles.resolvedBadge}>
                <Ionicons name="checkmark-circle" size={16} color="#fff" />
                <Text style={styles.resolvedText}>Résolue</Text>
              </View>
            )}
          </View>
        </View>
        <View style={styles.questionStats}>
          <Text style={styles.statText}>{item.reponse_count} réponses</Text>
          <Text style={styles.statText}>{item.nb_vues} vues</Text>
        </View>
      </View>

      <Text style={styles.questionContent} numberOfLines={3}>
        {item.contenu}
      </Text>

      <View style={styles.authorInfo}>
        <Ionicons name="person-outline" size={14} color="#666" />
        <Text style={styles.authorText}>
          {item.auteur_details?.prenom} {item.auteur_details?.nom}
        </Text>
        <Text style={styles.dateText}>
          {new Date(item.date_publication).toLocaleDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderResponse = ({ item }) => (
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
      {voiceMessages
        .filter(vm => vm.reponse === item.id)
        .map(vm => (
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
        ))
      }
      
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
        
        {selectedQuestion?.auteur === item.auteur && !item.est_solution && (
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

  return (
    <View style={styles.container}>
      <Header
        title="Forum Académique"
        showBack
        navigation={navigation}
        rightActions={[
          {
            icon: 'help-circle-outline',
            onPress: () => setShowAskModal(true)
          },
          {
            icon: 'search-outline',
            onPress: () => setSearchText('')
          }
        ]}
      />

      {/* Barre de recherche */}
      {searchText !== null && (
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher une question..."
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>
      )}

      {/* Filtres */}
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
              <Ionicons 
                name={filter.icon} 
                size={16} 
                color={selectedFilter === filter.id ? '#fff' : '#666'} 
              />
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
          data={questions.filter(q => 
            q.titre.toLowerCase().includes(searchText.toLowerCase()) ||
            q.contenu.toLowerCase().includes(searchText.toLowerCase()) ||
            q.matiere.toLowerCase().includes(searchText.toLowerCase())
          )}
          renderItem={renderQuestion}
          keyExtractor={(item) => item.id.toString()}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <EmptyState
              icon="help-circle-outline"
              message="Aucune question trouvée"
              submessage="Soyez le premier à poser une question"
            />
          }
          contentContainerStyle={styles.listContainer}
        />
      )}

      {/* Modal poser question */}
      <Modal
        visible={showAskModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAskModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Poser une question</Text>
            <TouchableOpacity onPress={() => setShowAskModal(false)}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Titre *</Text>
              <TextInput
                style={styles.input}
                value={questionTitle}
                onChangeText={setQuestionTitle}
                placeholder="Titre de votre question"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Matière *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {matieres.map((matiere) => (
                  <TouchableOpacity
                    key={matiere}
                    style={[
                      styles.matiereChip,
                      selectedMatiere === matiere && styles.selectedMatiere
                    ]}
                    onPress={() => setSelectedMatiere(matiere)}
                  >
                    <Text style={[
                      styles.matiereText,
                      selectedMatiere === matiere && styles.selectedMatiereText
                    ]}>
                      {matiere}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Question *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                multiline
                value={questionContent}
                onChangeText={setQuestionContent}
                placeholder="Décrivez votre question en détail..."
                textAlignVertical="top"
              />
            </View>
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setShowAskModal(false)}
            >
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.sendButton]}
              onPress={handleAskQuestion}
              disabled={sendingQuestion}
            >
              {sendingQuestion ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.sendButtonText}>Poser la question</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal détail question */}
      <Modal
        visible={showQuestionDetail}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowQuestionDetail(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {selectedQuestion?.titre}
            </Text>
            <TouchableOpacity onPress={() => setShowQuestionDetail(false)}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {selectedQuestion && (
              <>
                <View style={styles.questionDetail}>
                  <View style={styles.questionDetailMeta}>
                    <Text style={styles.matiere}>{selectedQuestion.matiere}</Text>
                    <Text style={styles.date}>
                      {new Date(selectedQuestion.date_publication).toLocaleDateString()}
                    </Text>
                  </View>
                  <Text style={styles.questionDetailContent}>
                    {selectedQuestion.contenu}
                  </Text>
                  <View style={styles.authorDetail}>
                    <Ionicons name="person-outline" size={16} color="#666" />
                    <Text style={styles.authorText}>
                      {selectedQuestion.auteur_details?.prenom} {selectedQuestion.auteur_details?.nom}
                    </Text>
                  </View>
                </View>

                <View style={styles.responsesContainer}>
                  <Text style={styles.responsesTitle}>
                    Réponses ({selectedQuestion.reponses?.length || 0})
                  </Text>
                  
                  <FlatList
                    data={selectedQuestion.reponses || []}
                    renderItem={renderResponse}
                    keyExtractor={(item) => item.id.toString()}
                    style={styles.responsesList}
                  />
                </View>

                <View style={styles.answerContainer}>
                  <Text style={styles.answerTitle}>Votre réponse:</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    multiline
                    value={answerText}
                    onChangeText={setAnswerText}
                    placeholder="Tapez votre réponse ici..."
                    textAlignVertical="top"
                  />
                  
                  {/* Section d'enregistrement vocal pour les étudiants */}
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
                    style={[styles.modalButton, styles.sendButton]}
                    onPress={handleAnswer}
                    disabled={sendingAnswer}
                  >
                    {sendingAnswer ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.sendButtonText}>Envoyer la réponse</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </ScrollView>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#333',
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
  questionStats: {
    alignItems: 'flex-end',
  },
  statText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  questionContent: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
    marginBottom: 12,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
    flex: 1,
  },
  dateText: {
    fontSize: 12,
    color: '#999',
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
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  matiereChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectedMatiere: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
  },
  matiereText: {
    fontSize: 14,
    color: '#666',
  },
  selectedMatiereText: {
    color: '#fff',
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
  questionDetail: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  questionDetailMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  questionDetailContent: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    marginBottom: 12,
  },
  authorDetail: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  responsesContainer: {
    marginBottom: 16,
  },
  responsesTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  responsesList: {
    maxHeight: 300,
  },
  responseItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
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
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 2,
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
    minWidth: 40,
    justifyContent: 'center',
  },
  upvote: {
    backgroundColor: '#28a745',
  },
  downvote: {
    backgroundColor: '#dc3545',
  },
  voteCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 4,
  },
  markSolutionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007bff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  markSolutionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 4,
  },
  answerContainer: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
  },
  answerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  voiceSection: {
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
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
});

export default StudentForumScreen;
