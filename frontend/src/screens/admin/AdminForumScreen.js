import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, 
  ActivityIndicator, RefreshControl, TextInput, FlatList, Modal,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/ui/Header';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import { API_BASE_URL } from '../../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const AdminForumScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState('toutes');
  const [showModerationModal, setShowModerationModal] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [moderationReason, setModerationReason] = useState('');
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [forumStats, setForumStats] = useState(null);
  const [searchText, setSearchText] = useState('');

  const [filters] = useState([
    { id: 'toutes', label: 'Toutes', icon: 'list-outline' },
    { id: 'signalees', label: 'Signalées', icon: 'warning-outline' },
    { id: 'doublons', label: 'Doublons', icon: 'copy-outline' },
    { id: 'non_resolues', label: 'Non résolues', icon: 'help-circle-outline' },
    { id: 'resolues', label: 'Résolues', icon: 'checkmark-circle-outline' },
    { id: 'sans_reponse', label: 'Sans réponse', icon: 'chatbubble-outline' }
  ]);

  useEffect(() => {
    loadQuestions();
    loadForumStats();
  }, []);

  const detectDoublons = (questions) => {
    const doublons = [];
    const seen = new Map();
    
    questions.forEach(question => {
      // Normaliser le titre pour la comparaison (minuscules, sans espaces)
      const normalizedTitle = question.titre.toLowerCase().trim().replace(/\s+/g, ' ');
      
      // Vérifier si un titre similaire existe déjà
      for (const [key, existingQuestions] of seen) {
        if (key === normalizedTitle || 
            (key.includes(normalizedTitle) || normalizedTitle.includes(key)) ||
            (key.length > 10 && normalizedTitle.includes(key.substring(0, 10))) ||
            (normalizedTitle.length > 10 && key.includes(normalizedTitle.substring(0, 10)))) {
          existingQuestions.push(question);
          return;
        }
      }
      
      seen.set(normalizedTitle, [question]);
    });
    
    // Filtrer pour ne garder que les groupes avec plus d'une question
    seen.forEach((questionGroup) => {
      if (questionGroup.length > 1) {
        doublons.push(...questionGroup);
      }
    });
    
    return doublons;
  };

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('accessToken');
      
      let url = `${API_BASE_URL}/api/forum/questions/`;
      
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        let questionsData = data.results || data;
        
        // Appliquer les filtres
        if (selectedFilter === 'doublons') {
          questionsData = detectDoublons(questionsData);
        } else if (selectedFilter !== 'toutes') {
          // Pour les autres filtres, essayer l'endpoint admin ou filtrer localement
          try {
            const adminResponse = await fetch(`${API_BASE_URL}/api/forum/admin/questions/?filter=${selectedFilter}`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            if (adminResponse.ok) {
              questionsData = await adminResponse.json();
            } else {
              // Filtrage local si l'endpoint admin n'existe pas
              questionsData = questionsData.filter(q => {
                switch (selectedFilter) {
                  case 'signalees':
                    return q.nb_signalements > 0;
                  case 'non_resolues':
                    return !q.est_resolue;
                  case 'resolues':
                    return q.est_resolue;
                  case 'sans_reponse':
                    return !q.reponses || q.reponses.length === 0;
                  default:
                    return true;
                }
              });
            }
          } catch (error) {
            console.log('Endpoint admin non disponible, filtrage local');
          }
        }
        
        setQuestions(questionsData);
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

  const loadForumStats = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      // Essayer l'endpoint admin statistiques, s'il n'existe pas utiliser les stats générales
      let response = await fetch(`${API_BASE_URL}/api/forum/admin/statistiques/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        // Si l'endpoint admin n'existe pas, utiliser l'endpoint stats général
        response = await fetch(`${API_BASE_URL}/api/stats/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
      }

      if (response.ok) {
        const data = await response.json();
        setForumStats(data);
      } else {
        console.log('Endpoint statistiques non disponible, stats mises à null');
        setForumStats(null);
      }
    } catch (error) {
      console.error('Erreur chargement statistiques:', error);
      setForumStats(null);
    }
  };

  const handleModerateQuestion = async (questionId, action) => {
    if (!moderationReason.trim() && action === 'reject') {
      Alert.alert('Erreur', 'Veuillez entrer une raison pour le rejet');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('accessToken');
      
      // Essayer avec l'endpoint de modération, sinon utiliser l'endpoint de suppression
      let response;
      if (action === 'delete') {
        response = await fetch(
          `${API_BASE_URL}/api/forum/questions/${questionId}/`,
          {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          }
        );
      } else {
        // Utiliser les endpoints de modération corrects selon la configuration Django
        if (action === 'approve') {
          // Pour l'approbation, utiliser l'endpoint de restauration
          response = await fetch(
            `${API_BASE_URL}/api/forum/admin/moderation/questions/${questionId}/restore/`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                raison: moderationReason || 'Question approuvée par l\'administrateur'
              })
            }
          );
        } else if (action === 'reject') {
          // Pour le rejet, utiliser l'endpoint de suppression
          response = await fetch(
            `${API_BASE_URL}/api/forum/admin/moderation/questions/${questionId}/delete/`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                raison: moderationReason || 'Question rejetée par l\'administrateur'
              })
            }
          );
        }
      }

      if (response.ok) {
        const actionText = action === 'approve' ? 'approuvée' : 
                          action === 'reject' ? 'rejetée' : 'supprimée';
        Alert.alert('Succès', `Question ${actionText}`);
        setShowModerationModal(false);
        setModerationReason('');
        loadQuestions();
        loadForumStats();
      } else {
        // Gérer les erreurs de parsing JSON
        let errorMessage = 'Erreur lors de la modération';
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            errorMessage = errorData.error || errorData.message || errorMessage;
          } else {
            // Si ce n'est pas du JSON, essayer de lire comme texte
            const errorText = await response.text();
            console.log('Réponse non-JSON:', errorText);
            errorMessage = `Erreur serveur: ${response.status}`;
          }
        } catch (parseError) {
          console.log('Erreur parsing:', parseError);
          errorMessage = `Erreur serveur: ${response.status}`;
        }
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Erreur modération:', error);
      Alert.alert('Erreur', error.message || 'Impossible de modérer cette question');
    }
  };

  const handleModerateResponse = async (responseId, action) => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      
      let response;
      if (action === 'approve') {
        // Pour l'approbation d'une réponse, utiliser l'endpoint de restauration
        response = await fetch(
          `${API_BASE_URL}/api/forum/admin/moderation/reponses/${responseId}/restore/`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              raison: moderationReason || 'Réponse approuvée par l\'administrateur'
            })
          }
        );
      } else if (action === 'reject') {
        // Pour le rejet d'une réponse, utiliser l'endpoint de suppression
        response = await fetch(
          `${API_BASE_URL}/api/forum/admin/moderation/reponses/${responseId}/delete/`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              raison: moderationReason || 'Réponse rejetée par l\'administrateur'
            })
          }
        );
      }

      if (response.ok) {
        Alert.alert('Succès', `Réponse ${action === 'approve' ? 'approuvée' : 'rejetée'}`);
        loadQuestions();
        loadForumStats();
      } else {
        // Gérer les erreurs de parsing JSON
        let errorMessage = 'Erreur lors de la modération';
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            errorMessage = errorData.error || errorData.message || errorMessage;
          } else {
            // Si ce n'est pas du JSON, essayer de lire comme texte
            const errorText = await response.text();
            console.log('Réponse non-JSON (réponse):', errorText);
            errorMessage = `Erreur serveur: ${response.status}`;
          }
        } catch (parseError) {
          console.log('Erreur parsing (réponse):', parseError);
          errorMessage = `Erreur serveur: ${response.status}`;
        }
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Erreur modération réponse:', error);
      Alert.alert('Erreur', error.message || 'Impossible de modérer cette réponse');
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    Alert.alert(
      'Confirmation',
      'Êtes-vous sûr de vouloir supprimer cette question ? Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('accessToken');
              
              // Utiliser l'endpoint standard de suppression des questions
              const response = await fetch(
                `${API_BASE_URL}/api/forum/questions/${questionId}/`,
                {
                  method: 'DELETE',
                  headers: { 'Authorization': `Bearer ${token}` }
                }
              );

              if (response.ok) {
                Alert.alert('Succès', 'Question supprimée avec succès');
                loadQuestions();
                loadForumStats();
              } else {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erreur lors de la suppression');
              }
            } catch (error) {
              console.error('Erreur suppression:', error);
              Alert.alert('Erreur', error.message || 'Impossible de supprimer cette question');
            }
          }
        }
      ]
    );
  };

  const handleDeleteResponse = async (responseId) => {
    Alert.alert(
      'Confirmation',
      'Êtes-vous sûr de vouloir supprimer cette réponse ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('accessToken');
              
              const response = await fetch(
                `${API_BASE_URL}/api/forum/admin/supprimer_reponse/${responseId}/`,
                {
                  method: 'DELETE',
                  headers: { 'Authorization': `Bearer ${token}` }
                }
              );

              if (response.ok) {
                Alert.alert('Succès', 'Réponse supprimée');
                loadQuestions();
                loadForumStats();
              } else {
                throw new Error('Erreur lors de la suppression');
              }
            } catch (error) {
              console.error('Erreur suppression:', error);
              Alert.alert('Erreur', 'Impossible de supprimer cette réponse');
            }
          }
        }
      ]
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadQuestions();
    await loadForumStats();
    setRefreshing(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approuve': return '#28a745';
      case 'rejete': return '#dc3545';
      case 'en_attente': return '#ffc107';
      case 'signale': return '#fd7e14';
      default: return '#6c757d';
    }
  };

  const renderQuestion = ({ item }) => {
    // Vérifier si c'est un doublon
    const isDoublon = selectedFilter === 'doublons';
    const similarQuestions = isDoublon ? questions.filter(q => 
      q.titre.toLowerCase().trim() === item.titre.toLowerCase().trim() ||
      q.titre.toLowerCase().includes(item.titre.toLowerCase().substring(0, 10)) ||
      item.titre.toLowerCase().includes(q.titre.toLowerCase().substring(0, 10))
    ) : [];

    return (
      <Card style={[styles.questionCard, isDoublon && styles.doublonCard]}>
        <View style={styles.questionHeader}>
          <View style={styles.questionInfo}>
            <Text style={styles.questionTitle}>{item.titre}</Text>
            <View style={styles.questionMeta}>
              <Text style={styles.matiere}>{item.matiere}</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.statut) }]}>
                <Text style={styles.statusText}>{item.statut}</Text>
              </View>
              {item.nb_signalements > 0 && (
                <View style={styles.reportedBadge}>
                  <Ionicons name="warning" size={14} color="#fff" />
                  <Text style={styles.reportedCount}>{item.nb_signalements}</Text>
                </View>
              )}
              {isDoublon && (
                <View style={styles.doublonBadge}>
                  <Ionicons name="copy-outline" size={14} color="#fff" />
                  <Text style={styles.doublonCount}>{similarQuestions.length}</Text>
                </View>
              )}
            </View>
          </View>
          <View style={styles.questionStats}>
            <Text style={styles.statText}>{item.reponse_count || (item.reponses?.length || 0)} réponses</Text>
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

      <View style={styles.authorInfo}>
        <Ionicons name="person-outline" size={14} color="#666" />
        <Text style={styles.authorText}>
          {item.auteur_details?.prenom} {item.auteur_details?.nom}
        </Text>
        <Text style={styles.dateText}>
          {new Date(item.date_publication).toLocaleDateString()}
        </Text>
      </View>

      <View style={styles.questionActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.approveButton]}
          onPress={() => handleModerateQuestion(item.id, 'approve')}
        >
          <Ionicons name="checkmark" size={16} color="#fff" />
          <Text style={styles.actionText}>Approuver</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.rejectButton]}
          onPress={() => {
            setSelectedQuestion(item);
            setShowModerationModal(true);
          }}
        >
          <Ionicons name="close" size={16} color="#fff" />
          <Text style={styles.actionText}>Rejeter</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteQuestion(item.id)}
        >
          <Ionicons name="trash" size={16} color="#fff" />
          <Text style={styles.actionText}>Supprimer</Text>
        </TouchableOpacity>
      </View>

      {/* Réponses */}
      {item.reponses && item.reponses.length > 0 && (
        <View style={styles.responsesContainer}>
          <Text style={styles.responsesTitle}>Réponses:</Text>
          {item.reponses.map((response) => (
            <View key={response.id} style={styles.responseItem}>
              <View style={styles.responseHeader}>
                <Text style={styles.responseAuthor}>
                  {response.auteur_details?.prenom} {response.auteur_details?.nom}
                </Text>
                <View style={styles.responseMeta}>
                  {response.est_solution && (
                    <View style={styles.solutionBadge}>
                      <Ionicons name="checkmark-circle" size={12} color="#fff" />
                      <Text style={styles.solutionText}>Solution</Text>
                    </View>
                  )}
                  <Text style={styles.responseDate}>
                    {new Date(response.date).toLocaleDateString()}
                  </Text>
                </View>
              </View>
              
              <Text style={styles.responseContent} numberOfLines={2}>
                {response.contenu}
              </Text>

              <View style={styles.responseActions}>
                <TouchableOpacity
                  style={[styles.responseActionButton, styles.approveButton]}
                  onPress={() => handleModerateResponse(response.id, 'approve')}
                >
                  <Ionicons name="checkmark" size={12} color="#fff" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.responseActionButton, styles.rejectButton]}
                  onPress={() => handleModerateResponse(response.id, 'reject')}
                >
                  <Ionicons name="close" size={12} color="#fff" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.responseActionButton, styles.deleteButton]}
                  onPress={() => handleDeleteResponse(response.id)}
                >
                  <Ionicons name="trash" size={12} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}
    </Card>
    );
  };

  return (
    <View style={styles.container}>
      <Header
        title="Modération Forum"
        showBack
        navigation={navigation}
        rightActions={[
          {
            icon: 'stats-chart-outline',
            onPress: () => setShowStatsModal(true)
          }
        ]}
      />

      {/* Barre de recherche */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color="#666" />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher une question..."
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

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
            q.auteur_details?.nom?.toLowerCase().includes(searchText.toLowerCase())
          )}
          renderItem={renderQuestion}
          keyExtractor={(item) => item.id.toString()}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <EmptyState
              icon="shield-checkmark-outline"
              message="Aucune question à modérer"
              submessage="Toutes les questions sont en ordre"
            />
          }
          contentContainerStyle={styles.listContainer}
        />
      )}

      {/* Modal de modération */}
      <Modal
        visible={showModerationModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowModerationModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              Modérer: {selectedQuestion?.titre}
            </Text>
            <TouchableOpacity onPress={() => setShowModerationModal(false)}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Raison de la modération</Text>
              <TextInput
                style={styles.textArea}
                multiline
                placeholder="Expliquez la raison de votre décision..."
                value={moderationReason}
                onChangeText={setModerationReason}
                textAlignVertical="top"
              />
            </View>

            {selectedQuestion && (
              <View style={styles.questionPreview}>
                <Text style={styles.previewTitle}>Question:</Text>
                <Text style={styles.previewContent}>{selectedQuestion.contenu}</Text>
              </View>
            )}
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setShowModerationModal(false)}
            >
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.rejectButton]}
              onPress={() => handleModerateQuestion(selectedQuestion?.id, 'reject')}
            >
              <Text style={styles.rejectButtonText}>Rejeter</Text>
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
            <Text style={styles.modalTitle}>Statistiques du Forum</Text>
            <TouchableOpacity onPress={() => setShowStatsModal(false)}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {forumStats ? (
            <ScrollView style={styles.modalContent}>
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{forumStats.total_questions}</Text>
                  <Text style={styles.statLabel}>Total Questions</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{forumStats.questions_en_attente}</Text>
                  <Text style={styles.statLabel}>En Attente</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{forumStats.questions_signalees}</Text>
                  <Text style={styles.statLabel}>Signalées</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{forumStats.total_reponses}</Text>
                  <Text style={styles.statLabel}>Total Réponses</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{forumStats.questions_resolues}</Text>
                  <Text style={styles.statLabel}>Résolues</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{forumStats.tuteurs_actifs}</Text>
                  <Text style={styles.statLabel}>Tuteurs Actifs</Text>
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
    flexWrap: 'wrap',
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
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  reportedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dc3545',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  reportedCount: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 2,
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
    marginBottom: 12,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
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
  questionActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 80,
    justifyContent: 'center',
  },
  approveButton: {
    backgroundColor: '#28a745',
  },
  rejectButton: {
    backgroundColor: '#dc3545',
  },
  deleteButton: {
    backgroundColor: '#6c757d',
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 4,
  },
  responsesContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  responsesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  responseItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  responseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  responseAuthor: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  responseMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  solutionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007bff',
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
    fontSize: 10,
    color: '#666',
  },
  responseContent: {
    fontSize: 12,
    color: '#555',
    lineHeight: 16,
    marginBottom: 8,
  },
  responseActions: {
    flexDirection: 'row',
    gap: 4,
  },
  responseActionButton: {
    padding: 6,
    borderRadius: 4,
    minWidth: 30,
    alignItems: 'center',
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
  textArea: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  questionPreview: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  previewContent: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
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
  rejectButton: {
    backgroundColor: '#dc3545',
  },
  rejectButtonText: {
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
  doublonCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#ff6b6b',
    backgroundColor: '#fff5f5',
  },
  doublonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff6b6b',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 8,
  },
  doublonCount: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 2,
  },
});

export default AdminForumScreen;
