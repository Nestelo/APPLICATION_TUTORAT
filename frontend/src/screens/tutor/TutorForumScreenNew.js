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
  createQuestion,
  getNotificationsForum,
  marquerToutesNotificationsLues,
  getQuestionsSuivies,
  getStatistiquesForum,
  getBadgesForum
} from '../../api/forumService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const TutorForumScreenNew = ({ navigation }) => {
  const [questions, setQuestions] = useState([]);
  const [questionsSuivies, setQuestionsSuivies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('a_repondre');
  const [showNewQuestionModal, setShowNewQuestionModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showBadgesModal, setShowBadgesModal] = useState(false);
  const [newQuestion, setNewQuestion] = useState({
    titre: '',
    contenu: '',
    matiere: '',
    tags: '',
    priorite: 'moyenne'
  });
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [stats, setStats] = useState({});
  const [badges, setBadges] = useState({});

  const filters = [
    { id: 'a_repondre', label: 'À répondre', icon: 'chatbubble-outline' },
    { id: 'mes_reponses', label: 'Mes réponses', icon: 'checkmark-done-outline' },
    { id: 'suivies', label: 'Suivies', icon: 'heart-outline' },
    { id: 'resolues', label: 'Résolues', icon: 'checkmark-circle-outline' },
    { id: 'toutes', label: 'Toutes', icon: 'list-outline' }
  ];

  const priorities = [
    { id: 'haute', label: 'Haute', color: '#dc3545' },
    { id: 'moyenne', label: 'Moyenne', color: '#ffc107' },
    { id: 'basse', label: 'Basse', color: '#28a745' }
  ];

  useEffect(() => {
    loadQuestions();
    loadNotifications();
    loadStats();
    loadBadges();
  }, []);

  useEffect(() => {
    if (selectedFilter === 'suivies') {
      loadQuestionsSuivies();
    } else {
      loadQuestions();
    }
  }, [selectedFilter]);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const response = await getQuestions({ search: searchQuery });
      if (response.success) {
        let filteredQuestions = response.data;
        
        // Appliquer les filtres spécifiques tuteur
        if (selectedFilter === 'a_repondre') {
          // Questions sans réponse de la part du tuteur
          const userId = await AsyncStorage.getItem('userId');
          filteredQuestions = filteredQuestions.filter(q => 
            !q.reponses || !q.reponses.some(r => r.auteur === parseInt(userId))
          );
        } else if (selectedFilter === 'mes_reponses') {
          const userId = await AsyncStorage.getItem('userId');
          filteredQuestions = filteredQuestions.filter(q => 
            q.reponses && q.reponses.some(r => r.auteur === parseInt(userId))
          );
        } else if (selectedFilter === 'resolues') {
          filteredQuestions = filteredQuestions.filter(q => q.est_resolue);
        }
        
        setQuestions(filteredQuestions);
      }
    } catch (error) {
      console.error('Erreur chargement questions:', error);
      Alert.alert('Erreur', 'Impossible de charger les questions');
    } finally {
      setLoading(false);
    }
  };

  const loadQuestionsSuivies = async () => {
    try {
      const questions = await getQuestionsSuivies();
      setQuestionsSuivies(questions);
    } catch (error) {
      console.error('Erreur questions suivies:', error);
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

  const loadBadges = async () => {
    try {
      const badgesData = await getBadgesForum();
      setBadges(badgesData);
    } catch (error) {
      console.error('Erreur badges:', error);
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

  const handleCreateQuestion = async () => {
    if (!newQuestion.titre.trim() || !newQuestion.contenu.trim()) {
      Alert.alert('Erreur', 'Le titre et le contenu sont obligatoires');
      return;
    }

    try {
      await createQuestion(newQuestion);
      setShowNewQuestionModal(false);
      setNewQuestion({
        titre: '',
        contenu: '',
        matiere: '',
        tags: '',
        priorite: 'moyenne'
      });
      await loadQuestions();
      Alert.alert('Succès', 'Question publiée avec succès');
    } catch (error) {
      console.error('Erreur création question:', error);
      Alert.alert('Erreur', 'Impossible de publier la question');
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
    const priorityObj = priorities.find(p => p.id === priority);
    return priorityObj ? priorityObj.color : '#666';
  };

  const renderQuestionItem = ({ item }) => {
    const userId = AsyncStorage.getItem('userId');
    const hasResponded = item.reponses && item.reponses.some(r => r.auteur === parseInt(userId));
    
    return (
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
            </View>
          </View>
          <View style={styles.questionStatus}>
            {item.est_resolue && (
              <Badge text="Résolue" color="#28a745" />
            )}
            {hasResponded && (
              <Badge text="Répondu" color="#007AFF" />
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

          {selectedFilter === 'a_repondre' && !hasResponded && (
            <TouchableOpacity
              style={[styles.actionButton, styles.respondButton]}
              onPress={() => navigation.navigate('QuestionDetail', { 
                questionId: item.id, 
                autoFocus: true 
              })}
            >
              <Ionicons name="chatbubble-outline" size={16} color="#fff" />
              <Text style={[styles.actionText, styles.respondText]}>Répondre</Text>
            </TouchableOpacity>
          )}
        </View>
      </Card>
    );
  };

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

  const renderBadgeItem = ({ item }) => {
    const badge = badges[item];
    if (!badge) return null;
    
    return (
      <View style={styles.badgeItem}>
        <View style={[
          styles.badgeIcon,
          { backgroundColor: badge.obtenu ? '#28a745' : '#e9ecef' }
        ]}>
          <Ionicons 
            name={badge.icone} 
            size={24} 
            color={badge.obtenu ? '#fff' : '#6c757d'} 
          />
        </View>
        <View style={styles.badgeInfo}>
          <Text style={styles.badgeName}>{badge.nom}</Text>
          <Text style={styles.badgeDescription}>{badge.description}</Text>
          <View style={styles.badgeProgress}>
            <View style={styles.progressBar}>
              <View style={[
                styles.progressFill,
                { width: `${(badge.progression / (badge.nom.includes('5') ? 5 : badge.nom.includes('10') ? 10 : badge.nom.includes('20') ? 20 : 3)) * 100}%` }
              ]} />
            </View>
            <Text style={styles.progressText}>
              {badge.progression}/{badge.nom.includes('5') ? 5 : badge.nom.includes('10') ? 10 : badge.nom.includes('20') ? 20 : 3}
            </Text>
          </View>
        </View>
      </View>
    );
  };

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
      <Header title="Forum">
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
        {/* Actions rapides tuteur */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => setShowNewQuestionModal(true)}
          >
            <Ionicons name="help-circle-outline" size={24} color="#007AFF" />
            <Text style={styles.quickActionText}>Poser une question</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => setShowBadgesModal(true)}
          >
            <Ionicons name="trophy-outline" size={24} color="#ffc107" />
            <Text style={styles.quickActionText}>Mes badges</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => navigation.navigate('MesReponses')}
          >
            <Ionicons name="checkmark-done-outline" size={24} color="#28a745" />
            <Text style={styles.quickActionText}>Mes réponses</Text>
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
            <Text style={styles.statNumber}>{stats.reponses_donnees || 0}</Text>
            <Text style={styles.statLabel}>Réponses</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.solutions_apportees || 0}</Text>
            <Text style={styles.statLabel}>Solutions</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.notifications_non_lues || 0}</Text>
            <Text style={styles.statLabel}>Notifications</Text>
          </View>
        </View>

        {/* Liste des questions */}
        {(selectedFilter === 'suivies' ? questionsSuivies : questions).length === 0 ? (
          <EmptyState
            icon="chatbubble-ellipses-outline"
            title="Aucune question"
            message={selectedFilter === 'a_repondre' ? 'Aucune question à répondre pour le moment' : 'Aucune question trouvée'}
          />
        ) : (
          <FlatList
            data={selectedFilter === 'suivies' ? questionsSuivies : questions}
            renderItem={renderQuestionItem}
            keyExtractor={(item) => item.id.toString()}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
            }
            contentContainerStyle={styles.listContainer}
          />
        )}

        {/* Bouton flottant pour nouvelle question */}
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setShowNewQuestionModal(true)}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Modal nouvelle question */}
      <Modal
        visible={showNewQuestionModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowNewQuestionModal(false)}>
              <Ionicons name="close-outline" size={24} color="#666" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Nouvelle question</Text>
            <TouchableOpacity onPress={handleCreateQuestion}>
              <Ionicons name="checkmark-outline" size={24} color="#007AFF" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <TextInput
              style={styles.input}
              placeholder="Titre de la question *"
              value={newQuestion.titre}
              onChangeText={(text) => setNewQuestion({...newQuestion, titre: text})}
            />
            
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Contenu de la question *"
              value={newQuestion.contenu}
              onChangeText={(text) => setNewQuestion({...newQuestion, contenu: text})}
              multiline
              numberOfLines={6}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Matière"
              value={newQuestion.matiere}
              onChangeText={(text) => setNewQuestion({...newQuestion, matiere: text})}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Tags (séparés par des virgules)"
              value={newQuestion.tags}
              onChangeText={(text) => setNewQuestion({...newQuestion, tags: text})}
            />
            
            <Text style={styles.label}>Priorité</Text>
            <View style={styles.priorityContainer}>
              {priorities.map((priority) => (
                <TouchableOpacity
                  key={priority.id}
                  style={[
                    styles.priorityOption,
                    newQuestion.priorite === priority.id && styles.prioritySelected,
                    { borderColor: priority.color }
                  ]}
                  onPress={() => setNewQuestion({...newQuestion, priorite: priority.id})}
                >
                  <Text style={[
                    styles.priorityText,
                    newQuestion.priorite === priority.id && { color: priority.color }
                  ]}>
                    {priority.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      </Modal>

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
            <Text style={styles.modalTitle}>Mes statistiques</Text>
            <View />
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Ionicons name="help-circle-outline" size={32} color="#007AFF" />
                <Text style={styles.statCardNumber}>{stats.questions_posees || 0}</Text>
                <Text style={styles.statCardLabel}>Questions posées</Text>
              </View>
              
              <View style={styles.statCard}>
                <Ionicons name="chatbubble-outline" size={32} color="#28a745" />
                <Text style={styles.statCardNumber}>{stats.reponses_donnees || 0}</Text>
                <Text style={styles.statCardLabel}>Réponses données</Text>
              </View>
              
              <View style={styles.statCard}>
                <Ionicons name="checkmark-circle-outline" size={32} color="#ffc107" />
                <Text style={styles.statCardNumber}>{stats.solutions_apportees || 0}</Text>
                <Text style={styles.statCardLabel}>Solutions apportées</Text>
              </View>
              
              <View style={styles.statCard}>
                <Ionicons name="thumbs-up-outline" size={32} color="#dc3545" />
                <Text style={styles.statCardNumber}>{stats.votes_donnees || 0}</Text>
                <Text style={styles.statCardLabel}>Votes donnés</Text>
              </View>
              
              <View style={styles.statCard}>
                <Ionicons name="heart-outline" size={32} color="#e91e63" />
                <Text style={styles.statCardNumber}>{stats.abonnements_actifs || 0}</Text>
                <Text style={styles.statCardLabel}>Abonnements actifs</Text>
              </View>
              
              <View style={styles.statCard}>
                <Ionicons name="mic-outline" size={32} color="#9c27b0" />
                <Text style={styles.statCardNumber}>{stats.messages_vocaux_envoyes || 0}</Text>
                <Text style={styles.statCardLabel}>Messages vocaux</Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Modal badges */}
      <Modal
        visible={showBadgesModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowBadgesModal(false)}>
              <Ionicons name="close-outline" size={24} color="#666" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Mes badges</Text>
            <View />
          </View>

          <FlatList
            data={Object.keys(badges)}
            renderItem={renderBadgeItem}
            keyExtractor={(item) => item}
            contentContainerStyle={styles.badgesList}
          />
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
  respondButton: {
    backgroundColor: '#007AFF',
  },
  respondText: {
    color: '#fff',
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
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
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  priorityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  priorityOption: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  prioritySelected: {
    backgroundColor: '#f8f9fa',
  },
  priorityText: {
    fontSize: 14,
    fontWeight: '600',
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
  badgesList: {
    padding: 16,
  },
  badgeItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  badgeIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  badgeInfo: {
    flex: 1,
  },
  badgeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  badgeDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  badgeProgress: {
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: '#e9ecef',
    borderRadius: 3,
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#28a745',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
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

export default TutorForumScreenNew;
