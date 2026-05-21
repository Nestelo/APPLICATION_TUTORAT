import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  TextInput,
  FlatList,
  Modal,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/ui/Header';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import Badge from '../../components/ui/Badge';
import {
  getQuestions,
  getAdminQuestions,
  getNotificationsForum,
  marquerToutesNotificationsLues,
  getStatistiquesForum,
  deleteQuestion,
  deleteReponse,
  suspendUser,
  unsuspenUser
} from '../../api/forumService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const AdminForumScreenNew = ({ navigation }) => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('toutes');
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showModerationModal, setShowModerationModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [stats, setStats] = useState({});
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [moderationAction, setModerationAction] = useState('');
  const [moderationReason, setModerationReason] = useState('');

  const filters = [
    { id: 'toutes', label: 'Toutes', icon: 'list-outline' },
    { id: 'signalees', label: 'Signalées', icon: 'flag-outline' },
    { id: 'en_attente', label: 'En attente', icon: 'time-outline' },
    { id: 'resolues', label: 'Résolues', icon: 'checkmark-circle-outline' },
    { id: 'non_resolues', label: 'Non résolues', icon: 'help-circle-outline' }
  ];

  useEffect(() => {
    loadQuestions();
    loadNotifications();
    loadStats();
  }, []);

  useEffect(() => {
    loadQuestions();
  }, [selectedFilter]);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      console.log('Tentative de chargement des questions...');
      
      // Solution temporaire : utiliser des données factices pour le forum admin
      // En attendant de résoudre le problème d'API
      const mockQuestions = [
        {
          id: 1,
          titre: "Comment résoudre un problème de mathématiques complexes ?",
          contenu: "J'ai besoin d'aide pour comprendre les concepts avancés...",
          auteur: { id: 1, nom: "Dupont", prenom: "Jean", role: "etudiant" },
          date_publication: "2026-04-08T10:30:00Z",
          nb_vues: 45,
          nb_reponses: 3,
          est_resolue: false,
          tags: ["mathématiques", "algèbre"],
          signalements: [],
          priorite: "normale"
        },
        {
          id: 2,
          titre: "Méthode d'apprentissage en programmation",
          contenu: "Quelle est la meilleure approche pour apprendre Python ?",
          auteur: { id: 2, nom: "Martin", prenom: "Sophie", role: "etudiant" },
          date_publication: "2026-04-07T15:20:00Z",
          nb_vues: 32,
          nb_reponses: 5,
          est_resolue: true,
          tags: ["programmation", "python"],
          signalements: [],
          priorite: "normale"
        },
        {
          id: 3,
          titre: "Problème avec les équations différentielles",
          contenu: "Je bloque sur un exercice spécifique...",
          auteur: { id: 3, nom: "Bernard", prenom: "Lucas", role: "etudiant" },
          date_publication: "2026-04-06T09:15:00Z",
          nb_vues: 28,
          nb_reponses: 2,
          est_resolue: false,
          tags: ["physique", "mathématiques"],
          signalements: [{ id: 1, motif: "Contenu inapproprié", auteur: "Admin" }],
          priorite: "haute"
        }
      ];
      
      let filteredQuestions = mockQuestions;
      console.log('Questions factices chargées:', filteredQuestions.length);
      
      // Appliquer les filtres spécifiques admin
      if (selectedFilter === 'signalees') {
        filteredQuestions = filteredQuestions.filter(q => q.signalements && q.signalements.length > 0);
      } else if (selectedFilter === 'en_attente') {
        filteredQuestions = filteredQuestions.filter(q => q.priorite === 'haute' && !q.est_resolue);
      } else if (selectedFilter === 'resolues') {
        filteredQuestions = filteredQuestions.filter(q => q.est_resolue);
      } else if (selectedFilter === 'non_resolues') {
        filteredQuestions = filteredQuestions.filter(q => !q.est_resolue);
      }
      
      // Appliquer la recherche
      if (searchQuery) {
        filteredQuestions = filteredQuestions.filter(q => 
          q.titre.toLowerCase().includes(searchQuery.toLowerCase()) ||
          q.contenu.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      
      setQuestions(filteredQuestions);
      console.log('Questions filtrées:', filteredQuestions.length);
      
    } catch (error) {
      console.error('Erreur chargement questions:', error);
      Alert.alert('Erreur', 'Impossible de charger les questions');
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
      console.error('Erreur notifications:', error);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await getStatistiquesForum();
      setStats(statsData);
    } catch (error) {
      console.error('Erreur stats:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadQuestions();
    await loadNotifications();
    await loadStats();
    setRefreshing(false);
  };

  const handleSearch = () => {
    loadQuestions();
  };

  const handleDeleteQuestion = async (questionId) => {
    Alert.alert(
      'Supprimer la question',
      'Êtes-vous sûr de vouloir supprimer cette question ? Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteQuestion(questionId);
              await loadQuestions();
              Alert.alert('Succès', 'Question supprimée avec succès');
            } catch (error) {
              console.error('Erreur suppression:', error);
              Alert.alert('Erreur', 'Impossible de supprimer la question');
            }
          }
        }
      ]
    );
  };

  const handleDeleteResponse = async (responseId) => {
    Alert.alert(
      'Supprimer la réponse',
      'Êtes-vous sûr de vouloir supprimer cette réponse ? Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteReponse(responseId);
              await loadQuestions();
              Alert.alert('Succès', 'Réponse supprimée avec succès');
            } catch (error) {
              console.error('Erreur suppression:', error);
              Alert.alert('Erreur', 'Impossible de supprimer la réponse');
            }
          }
        }
      ]
    );
  };

  const handleSuspendUser = async (userId, reason) => {
    try {
      await suspendUser(userId, reason);
      await loadQuestions();
      Alert.alert('Succès', 'Utilisateur suspendu avec succès');
    } catch (error) {
      console.error('Erreur suspension:', error);
      Alert.alert('Erreur', 'Impossible de suspendre l\'utilisateur');
    }
  };

  const handleUnsuspendUser = async (userId) => {
    try {
      await unsuspenUser(userId);
      await loadQuestions();
      Alert.alert('Succès', 'Utilisateur réactivé avec succès');
    } catch (error) {
      console.error('Erreur réactivation:', error);
      Alert.alert('Erreur', 'Impossible de réactiver l\'utilisateur');
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    try {
      await marquerToutesNotificationsLues();
      await loadNotifications();
      Alert.alert('Succès', 'Toutes les notifications marquées comme lues');
    } catch (error) {
      console.error('Erreur notifications:', error);
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

  const openModerationModal = (question, action) => {
    setSelectedQuestion(question);
    setModerationAction(action);
    setModerationReason('');
    setShowModerationModal(true);
  };

  const renderQuestionItem = ({ item }) => (
    <Card style={styles.questionCard}>
      <View style={styles.questionHeader}>
        <View style={styles.questionInfo}>
          <View style={[styles.priorityIndicator, { backgroundColor: getPriorityColor(item.priorite) }]} />
          <View style={styles.questionDetails}>
            <Text style={styles.questionTitle}>{item.titre}</Text>
            <Text style={styles.questionMeta}>
              {item.matiere} · {item.auteur_details?.prenom} {item.auteur_details?.nom}
            </Text>
            <Text style={styles.questionDate}>
              {new Date(item.date_publication).toLocaleDateString('fr-FR')}
            </Text>
            {item.auteur_details?.is_suspended && (
              <Badge text="Suspendu" color="#dc3545" size="small" />
            )}
          </View>
        </View>
        <View style={styles.questionStatus}>
          {item.est_resolue && (
            <Badge text="Résolue" color="#28a745" />
          )}
          {item.signalements && item.signalements.length > 0 && (
            <Badge text={`${item.signalements.length} signalements`} color="#dc3545" />
          )}
          <Text style={styles.responsesCount}>{item.nb_reponses || 0} réponses</Text>
        </View>
      </View>

      <Text style={styles.questionContent} numberOfLines={3}>
        {item.contenu}
      </Text>

      {item.tags && (
        <View style={styles.tagsContainer}>
          {item.tags.split(',').map((tag, index) => (
            <Badge key={index} text={tag.trim()} color="#007AFF" size="small" />
          ))}
        </View>
      )}

      <View style={styles.questionActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('QuestionDetail', { questionId: item.id })}
        >
          <Ionicons name="open-outline" size={16} color="#007AFF" />
          <Text style={styles.actionText}>Voir</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.moderateButton]}
          onPress={() => openModerationModal(item, 'moderate')}
        >
          <Ionicons name="shield-outline" size={16} color="#ffc107" />
          <Text style={styles.actionText}>Modérer</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteQuestion(item.id)}
        >
          <Ionicons name="trash-outline" size={16} color="#dc3545" />
          <Text style={styles.actionText}>Supprimer</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );

  const renderNotificationItem = ({ item }) => (
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
        <Text style={styles.notificationMessage}>{item.message}</Text>
        <Text style={styles.notificationTime}>
          {new Date(item.date_creation).toLocaleDateString('fr-FR')}
        </Text>
      </View>
      {!item.est_lue && <View style={styles.notificationDot} />}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <>
        <Header title="Administration Forum" />
        <LoadingSpinner />
      </>
    );
  }

  return (
    <>
      <Header title="Administration Forum">
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.statsButton}
            onPress={() => setShowStatsModal(true)}
          >
            <Ionicons name="stats-chart-outline" size={24} color="#fff" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.notificationButton}
            onPress={() => setShowNotifications(true)}
          >
            <Ionicons name="notifications-outline" size={24} color="#fff" />
            {notifications.filter(n => !n.est_lue).length > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {notifications.filter(n => !n.est_lue).length}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </Header>

      <View style={styles.container}>
        {/* Actions rapides admin */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => setShowModerationModal({ action: 'bulk_moderate' })}
          >
            <Ionicons name="shield-outline" size={24} color="#ffc107" />
            <Text style={styles.quickActionText}>Modération</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => navigation.navigate('UserManagement')}
          >
            <Ionicons name="people-outline" size={24} color="#dc3545" />
            <Text style={styles.quickActionText}>Utilisateurs</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => navigation.navigate('Reports')}
          >
            <Ionicons name="flag-outline" size={24} color="#e91e63" />
            <Text style={styles.quickActionText}>Signalements</Text>
          </TouchableOpacity>
        </View>

        {/* Barre de recherche et filtres */}
        <View style={styles.searchSection}>
          <View style={styles.searchContainer}>
            <Ionicons name="search-outline" size={20} color="#666" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher une question..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
            />
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersContainer}>
            {filters.map((filter) => (
              <TouchableOpacity
                key={filter.id}
                style={[
                  styles.filterButton,
                  selectedFilter === filter.id && styles.filterSelected
                ]}
                onPress={() => setSelectedFilter(filter.id)}
              >
                <Ionicons 
                  name={filter.icon} 
                  size={16} 
                  color={selectedFilter === filter.id ? '#fff' : '#666'} 
                />
                <Text style={[
                  styles.filterText,
                  selectedFilter === filter.id && styles.filterTextSelected
                ]}>
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Statistiques rapides */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{questions.length}</Text>
            <Text style={styles.statLabel}>Questions</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.notifications_non_lues || 0}</Text>
            <Text style={styles.statLabel}>Notifications</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {questions.filter(q => q.signalements && q.signalements.length > 0).length}
            </Text>
            <Text style={styles.statLabel}>Signalées</Text>
          </View>
        </View>

        {/* Liste des questions */}
        {questions.length === 0 ? (
          <EmptyState
            icon="chatbubble-ellipses-outline"
            title="Aucune question"
            message="Aucune question trouvée pour ce filtre"
          />
        ) : (
          <FlatList
            data={questions}
            renderItem={renderQuestionItem}
            keyExtractor={(item) => item.id.toString()}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
            }
            contentContainerStyle={styles.listContainer}
          />
        )}
      </View>

      {/* Modal statistiques */}
      <Modal
        visible={showStatsModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowStatsModal(false)}>
              <Ionicons name="close-outline" size={24} color="#666" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Statistiques du forum</Text>
            <View />
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Ionicons name="help-circle-outline" size={32} color="#007AFF" />
                <Text style={styles.statCardNumber}>{questions.length}</Text>
                <Text style={styles.statCardLabel}>Questions totales</Text>
              </View>
              
              <View style={styles.statCard}>
                <Ionicons name="chatbubble-outline" size={32} color="#28a745" />
                <Text style={styles.statCardNumber}>
                  {questions.reduce((sum, q) => sum + (q.nb_reponses || 0), 0)}
                </Text>
                <Text style={styles.statCardLabel}>Réponses totales</Text>
              </View>
              
              <View style={styles.statCard}>
                <Ionicons name="checkmark-circle-outline" size={32} color="#ffc107" />
                <Text style={styles.statCardNumber}>
                  {questions.filter(q => q.est_resolue).length}
                </Text>
                <Text style={styles.statCardLabel}>Questions résolues</Text>
              </View>
              
              <View style={styles.statCard}>
                <Ionicons name="flag-outline" size={32} color="#dc3545" />
                <Text style={styles.statCardNumber}>
                  {questions.filter(q => q.signalements && q.signalements.length > 0).length}
                </Text>
                <Text style={styles.statCardLabel}>Questions signalées</Text>
              </View>
              
              <View style={styles.statCard}>
                <Ionicons name="people-outline" size={32} color="#e91e63" />
                <Text style={styles.statCardNumber}>
                  {questions.filter(q => q.auteur_details?.is_suspended).length}
                </Text>
                <Text style={styles.statCardLabel}>Utilisateurs suspendus</Text>
              </View>
              
              <View style={styles.statCard}>
                <Ionicons name="notifications-outline" size={32} color="#9c27b0" />
                <Text style={styles.statCardNumber}>{stats.notifications_non_lues || 0}</Text>
                <Text style={styles.statCardLabel}>Notifications non lues</Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Modal modération */}
      <Modal
        visible={showModerationModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowModerationModal(false)}>
              <Ionicons name="close-outline" size={24} color="#666" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Modération</Text>
            <View />
          </View>

          <ScrollView style={styles.modalContent}>
            {selectedQuestion && (
              <View>
                <Text style={styles.moderationTitle}>
                  {selectedQuestion.titre}
                </Text>
                <Text style={styles.moderationMeta}>
                  Par {selectedQuestion.auteur_details?.prenom} {selectedQuestion.auteur_details?.nom}
                </Text>
                
                <View style={styles.moderationActions}>
                  <TouchableOpacity
                    style={[styles.moderationActionButton, { backgroundColor: '#ffc107' }]}
                    onPress={() => handleSuspendUser(selectedQuestion.auteur, 'Contenu inapproprié')}
                  >
                    <Ionicons name="person-remove-outline" size={20} color="#fff" />
                    <Text style={styles.moderationActionText}>Suspendre l'auteur</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.moderationActionButton, { backgroundColor: '#dc3545' }]}
                    onPress={() => handleDeleteQuestion(selectedQuestion.id)}
                  >
                    <Ionicons name="trash-outline" size={20} color="#fff" />
                    <Text style={styles.moderationActionText}>Supprimer la question</Text>
                  </TouchableOpacity>
                </View>
                
                <TextInput
                  style={styles.reasonInput}
                  placeholder="Raison de la modération..."
                  value={moderationReason}
                  onChangeText={setModerationReason}
                  multiline
                  numberOfLines={3}
                />
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Modal notifications */}
      <Modal
        visible={showNotifications}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowNotifications(false)}>
              <Ionicons name="close-outline" size={24} color="#666" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Notifications</Text>
            <TouchableOpacity onPress={handleMarkAllNotificationsRead}>
              <Ionicons name="checkmark-done-outline" size={24} color="#007AFF" />
            </TouchableOpacity>
          </View>

          {notifications.length === 0 ? (
            <EmptyState
              icon="notifications-off-outline"
              title="Aucune notification"
              message="Vous n'avez aucune notification pour le moment"
            />
          ) : (
            <FlatList
              data={notifications}
              renderItem={renderNotificationItem}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={styles.notificationsList}
            />
          )}
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsButton: {
    padding: 8,
    marginRight: 8,
  },
  notificationButton: {
    position: 'relative',
    padding: 8,
  },
  notificationBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#dc3545',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  quickActions: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    justifyContent: 'space-around',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  quickAction: {
    alignItems: 'center',
    padding: 12,
  },
  quickActionText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  searchSection: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  filtersContainer: {
    flexDirection: 'row',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 8,
  },
  filterSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  filterText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
  },
  filterTextSelected: {
    color: '#fff',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    justifyContent: 'space-around',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  listContainer: {
    padding: 16,
  },
  questionCard: {
    marginBottom: 16,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  questionInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  priorityIndicator: {
    width: 4,
    height: 60,
    borderRadius: 2,
    marginRight: 12,
  },
  questionDetails: {
    flex: 1,
  },
  questionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  questionMeta: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  questionDate: {
    fontSize: 12,
    color: '#999',
  },
  questionStatus: {
    alignItems: 'flex-end',
  },
  responsesCount: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  questionContent: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  questionActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#f8f9fa',
  },
  actionText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
  },
  moderateButton: {
    backgroundColor: '#fff3cd',
  },
  deleteButton: {
    backgroundColor: '#f8d7da',
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  statCardNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginVertical: 8,
  },
  statCardLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  moderationTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  moderationMeta: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  moderationActions: {
    marginBottom: 16,
  },
  moderationActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  moderationActionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
  reasonInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  notificationsList: {
    padding: 16,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: '#666',
  },
  notificationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#dc3545',
    marginLeft: 8,
  },
});

export default AdminForumScreenNew;
