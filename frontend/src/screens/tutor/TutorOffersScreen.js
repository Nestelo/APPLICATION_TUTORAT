import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/ui/Header';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import CustomInput from '../../components/ui/Input';
import { getOffres, deleteOffre, duplicateOffre, publishOffre, validateOffre, suspendOffre } from '../../api/offreService';
import { getDisponibilites } from '../../api/tutorService';
import { getNotifications } from '../../api/notificationService';
import { useAuth } from '../../context/AuthContext';
import { formatDate, formatTime } from '../../utils/helpers';
import { INSTA_DEPARTEMENTS, INSTA_NIVEAUX, getAllMatieres } from '../../config/instaConfig';

const TutorOffersScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [offers, setOffers] = useState([]);
  const [disponibilites, setDisponibilites] = useState([]);
  const [viewMode, setViewMode] = useState('cards'); // 'cards', 'list', 'calendar'
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDates, setSelectedDates] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    matiere: '',
    niveau: '',
    statut: '',
    type: ''
  });
  const [stats, setStats] = useState({
    total: 0,
    actives: 0,
    brouillons: 0,
    en_attente: 0,
    total_inscriptions: 0
  });

  // Configuration des matières et niveaux de l'INSTA
  const matieres = getAllMatieres();
  const niveaux = INSTA_NIVEAUX;

  const statuts = [
    { id: 'publie', label: 'Publié' },
    { id: 'brouillon', label: 'Brouillon' },
    { id: 'en_attente_validation', label: 'En attente' },
    { id: 'suspendu', label: 'Suspendu' }
  ];

  const types = [
    { id: 'individuel', label: 'Individuel' },
    { id: 'groupe', label: 'Groupe' }
  ];

  useEffect(() => {
    loadOffers();
    loadDisponibilites();
  }, []);

  useEffect(() => {
    calculateStats();
  }, [offers]);

  const loadOffers = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('accessToken');
      
      let url = `${API_BASE_URL}/api/tutorat/offres/`;
      
      // Ajouter les filtres
      const queryParams = new URLSearchParams();
      if (filters.matiere) queryParams.append('matiere', filters.matiere);
      if (filters.niveau) queryParams.append('niveau', filters.niveau);
      if (filters.statut) queryParams.append('statut_workflow', filters.statut);
      if (filters.type) queryParams.append('type', filters.type);
      if (searchQuery) queryParams.append('search', searchQuery);
      
      if (queryParams.toString()) {
        url += `?${queryParams.toString()}`;
      }
      
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        const offersArray = data.results || data || [];
        setOffers(offersArray);
        console.log('📊 Offres chargées:', offersArray);
      }
    } catch (error) {
      console.error('❌ Erreur chargement offres:', error);
      Alert.alert('Erreur', 'Impossible de charger les offres');
    } finally {
      setLoading(false);
    }
  };

  const loadDisponibilites = async () => {
    try {
      const result = await getDisponibilites(user?.id);
      if (result.success) {
        const dispos = result.data?.results || result.data || [];
        setDisponibilites(dispos);
        console.log('📅 Disponibilités chargées:', dispos);
      }
    } catch (error) {
      console.error('❌ Erreur chargement disponibilités:', error);
    }
  };

  const calculateStats = () => {
    const total = offers.length;
    const actives = offers.filter(o => o.est_active && o.statut_workflow === 'publie').length;
    const brouillons = offers.filter(o => o.statut_workflow === 'brouillon').length;
    const en_attente = offers.filter(o => o.statut_workflow === 'en_attente_validation').length;
    const total_inscriptions = offers.reduce((sum, offer) => sum + (offer.nombre_inscrits || 0), 0);

    setStats({ total, actives, brouillons, en_attente, total_inscriptions });
  };

  const handleCreateSmartOffer = () => {
    navigation.navigate('SmartOfferCreation');
  };

  const handleDuplicateOffer = async (offer) => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      
      const response = await fetch(`${API_BASE_URL}/api/tutorat/offres/${offer.id}/dupliquer_offre/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        Alert.alert('Succès', 'Offre dupliquée avec succès');
        loadOffers();
      } else {
        Alert.alert('Erreur', 'Erreur lors de la duplication');
      }
    } catch (error) {
      console.error('❌ Erreur duplication offre:', error);
      Alert.alert('Erreur', 'Une erreur est survenue');
    }
  };

  const handlePublishOffer = async (offer) => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      
      const response = await fetch(`${API_BASE_URL}/api/tutorat/offres/${offer.id}/publier_offre/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        Alert.alert('Succès', 'Offre publiée avec succès');
        loadOffers();
      } else {
        Alert.alert('Erreur', 'Erreur lors de la publication');
      }
    } catch (error) {
      console.error('❌ Erreur publication offre:', error);
      Alert.alert('Erreur', 'Une erreur est survenue');
    }
  };

  const handleDeleteOffer = async (offer) => {
    Alert.alert(
      'Confirmation',
      'Êtes-vous sûr de vouloir supprimer cette offre ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('accessToken');
              
              const response = await fetch(`${API_BASE_URL}/api/tutorat/offres/${offer.id}/`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
              });

              if (response.ok) {
                Alert.alert('Succès', 'Offre supprimée avec succès');
                loadOffers();
              } else {
                Alert.alert('Erreur', 'Erreur lors de la suppression');
              }
            } catch (error) {
              console.error('❌ Erreur suppression offre:', error);
              Alert.alert('Erreur', 'Une erreur est survenue');
            }
          }
        }
      ]
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadOffers(), loadDisponibilites()]);
    setRefreshing(false);
  };

  const handleCalendarDateSelect = (date) => {
    setSelectedDates(prev => {
      const exists = prev.some(d => d.toDateString() === date.toDateString());
      if (exists) {
        return prev.filter(d => d.toDateString() !== date.toDateString());
      } else {
        return [...prev, date];
      }
    });
  };

  const handleCalendarDateDeselect = (date) => {
    setSelectedDates(prev => prev.filter(d => d.toDateString() !== date.toDateString()));
  };

  const applyFilters = () => {
    loadOffers();
    setShowFilters(false);
  };

  const resetFilters = () => {
    setFilters({
      matiere: '',
      niveau: '',
      statut: '',
      type: ''
    });
    setSearchQuery('');
    loadOffers();
    setShowFilters(false);
  };

  const filteredOffers = offers.filter(offer => {
    if (searchQuery && !offer.titre.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !offer.description.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  const renderStats = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statCard}>
        <Text style={styles.statNumber}>{stats.total}</Text>
        <Text style={styles.statLabel}>Total</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={styles.statNumber}>{stats.actives}</Text>
        <Text style={styles.statLabel}>Actives</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={styles.statNumber}>{stats.brouillons}</Text>
        <Text style={styles.statLabel}>Brouillons</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={styles.statNumber}>{stats.en_attente}</Text>
        <Text style={styles.statLabel}>En attente</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={styles.statNumber}>{stats.total_inscriptions}</Text>
        <Text style={styles.statLabel}>Inscriptions</Text>
      </View>
    </View>
  );

  const renderViewModeSelector = () => (
    <View style={styles.viewModeSelector}>
      <TouchableOpacity
        style={[styles.viewModeButton, viewMode === 'cards' && styles.viewModeButtonActive]}
        onPress={() => setViewMode('cards')}
      >
        <Ionicons name="grid" size={20} color={viewMode === 'cards' ? '#fff' : '#007AFF'} />
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.viewModeButton, viewMode === 'list' && styles.viewModeButtonActive]}
        onPress={() => setViewMode('list')}
      >
        <Ionicons name="list" size={20} color={viewMode === 'list' ? '#fff' : '#007AFF'} />
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.viewModeButton, viewMode === 'calendar' && styles.viewModeButtonActive]}
        onPress={() => setShowCalendar(true)}
      >
        <Ionicons name="calendar" size={20} color={viewMode === 'calendar' ? '#fff' : '#007AFF'} />
      </TouchableOpacity>
    </View>
  );

  const renderSearchAndFilters = () => (
    <View style={styles.searchFilterContainer}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
        <CustomInput
          style={styles.searchInput}
          placeholder="Rechercher une offre..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={loadOffers}
        />
      </View>
      
      <TouchableOpacity
        style={styles.filterButton}
        onPress={() => setShowFilters(true)}
      >
        <Ionicons name="filter" size={20} color="#fff" />
      </TouchableOpacity>
    </View>
  );

  const renderOfferCard = (offer) => (
    <Card key={offer.id} style={styles.offerCard}>
      <View style={styles.offerHeader}>
        <View style={styles.offerTitleContainer}>
          <Text style={styles.offerTitle}>{offer.titre}</Text>
          <View style={styles.offerStatus}>
            <Text style={[
              styles.statusText,
              { 
                backgroundColor: getStatusColor(offer.statut_workflow),
                color: '#fff'
              }
            ]}>
              {getStatusText(offer.statut_workflow)}
            </Text>
          </View>
        </View>
        <View style={styles.offerActions}>
          <TouchableOpacity onPress={() => handleDuplicateOffer(offer)}>
            <Ionicons name="copy" size={20} color="#007AFF" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDeleteOffer(offer)}>
            <Ionicons name="trash" size={20} color="#dc3545" />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.offerDescription} numberOfLines={2}>
        {offer.description || 'Aucune description'}
      </Text>
      
      <View style={styles.offerDetails}>
        <Text style={styles.offerDetail}>📚 {matieres.find(m => m.value === offer.matiere)?.label}</Text>
        <Text style={styles.offerDetail}>🎓 {niveaux.find(n => n.value === offer.niveau)?.label}</Text>
        <Text style={styles.offerDetail}>👥 {offer.type === 'individuel' ? 'Individuel' : 'Groupe'}</Text>
        <Text style={styles.offerDetail}>
          💰 {offer.gratuit ? 'Gratuit' : `${offer.tarif} FCFA/h`}
        </Text>
        <Text style={styles.offerDetail}>⏱️ {offer.duree_session || 60} min</Text>
      </View>

      <View style={styles.offerStats}>
        <View style={styles.offerStat}>
          <Text style={styles.offerStatNumber}>{offer.nombre_inscrits || 0}</Text>
          <Text style={styles.offerStatLabel}>Inscrits</Text>
        </View>
        <View style={styles.offerStat}>
          <Text style={styles.offerStatNumber}>{offer.places_disponibles || 0}</Text>
          <Text style={styles.offerStatLabel}>Places</Text>
        </View>
        <View style={styles.offerStat}>
          <Text style={styles.offerStatNumber}>{offer.vues || 0}</Text>
          <Text style={styles.offerStatLabel}>Vues</Text>
        </View>
      </View>

      <View style={styles.offerBottomActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('OfferInscriptions', { offerId: offer.id })}
        >
          <Text style={styles.actionButtonText}>Voir les inscriptions</Text>
        </TouchableOpacity>
        
        {offer.statut_workflow === 'brouillon' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.publishButton]}
            onPress={() => handlePublishOffer(offer)}
          >
            <Text style={styles.publishButtonText}>Publier</Text>
          </TouchableOpacity>
        )}
      </View>
    </Card>
  );

  const renderOfferList = () => (
    <ScrollView style={styles.listContainer}>
      {filteredOffers.map(offer => (
        <TouchableOpacity key={offer.id} style={styles.listItem}>
          <View style={styles.listItemContent}>
            <View style={styles.listItemHeader}>
              <Text style={styles.listItemTitle}>{offer.titre}</Text>
              <Text style={[
                styles.listItemStatus,
                { color: getStatusColor(offer.statut_workflow) }
              ]}>
                {getStatusText(offer.statut_workflow)}
              </Text>
            </View>
            <Text style={styles.listItemSubtitle}>
              {matieres.find(m => m.value === offer.matiere)?.label} • {niveaux.find(n => n.value === offer.niveau)?.label}
            </Text>
            <View style={styles.listItemDetails}>
              <Text style={styles.listItemDetail}>
                {offer.gratuit ? 'Gratuit' : `${offer.tarif} FCFA/h`}
              </Text>
              <Text style={styles.listItemDetail}>{offer.nombre_inscrits || 0} inscrits</Text>
              <Text style={styles.listItemDetail}>{offer.vues || 0} vues</Text>
            </View>
          </View>
          <View style={styles.listItemActions}>
            <TouchableOpacity onPress={() => handleDuplicateOffer(offer)}>
              <Ionicons name="copy" size={20} color="#007AFF" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('OfferInscriptions', { offerId: offer.id })}>
              <Ionicons name="people" size={20} color="#007AFF" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDeleteOffer(offer)}>
              <Ionicons name="trash" size={20} color="#dc3545" />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderFiltersModal = () => (
    <Modal
      visible={showFilters}
      animationType="slide"
      onRequestClose={() => setShowFilters(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowFilters(false)}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Filtres</Text>
          <TouchableOpacity onPress={resetFilters}>
            <Text style={styles.resetButton}>Réinitialiser</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Matière</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.filterOptions}>
                {matieres.slice(0, 8).map((matiere) => (
                  <TouchableOpacity
                    key={matiere.value}
                    style={[
                      styles.filterOption,
                      filters.matiere === matiere.value && styles.filterOptionSelected
                    ]}
                    onPress={() => setFilters(prev => ({ ...prev, matiere: prev.matiere === matiere.value ? '' : matiere.value }))}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      filters.matiere === matiere.value && styles.filterOptionTextSelected
                    ]}>
                      {matiere.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Niveau</Text>
            <View style={styles.filterOptions}>
              {niveaux.map((niveau) => (
                <TouchableOpacity
                  key={niveau.value}
                  style={[
                    styles.filterOption,
                    filters.niveau === niveau.value && styles.filterOptionSelected
                  ]}
                  onPress={() => setFilters(prev => ({ ...prev, niveau: prev.niveau === niveau.value ? '' : niveau.value }))}
                >
                  <Text style={[
                    styles.filterOptionText,
                    filters.niveau === niveau.value && styles.filterOptionTextSelected
                  ]}>
                    {niveau.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Statut</Text>
            <View style={styles.filterOptions}>
              {statuts.map((statut) => (
                <TouchableOpacity
                  key={statut.id}
                  style={[
                    styles.filterOption,
                    filters.statut === statut.id && styles.filterOptionSelected
                  ]}
                  onPress={() => setFilters(prev => ({ ...prev, statut: prev.statut === statut.id ? '' : statut.id }))}
                >
                  <Text style={[
                    styles.filterOptionText,
                    filters.statut === statut.id && styles.filterOptionTextSelected
                  ]}>
                    {statut.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Type</Text>
            <View style={styles.filterOptions}>
              {types.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.filterOption,
                    filters.type === type.id && styles.filterOptionSelected
                  ]}
                  onPress={() => setFilters(prev => ({ ...prev, type: prev.type === type.id ? '' : type.id }))}
                >
                  <Text style={[
                    styles.filterOptionText,
                    filters.type === type.id && styles.filterOptionTextSelected
                  ]}>
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>

        <View style={styles.modalActions}>
          <Button
            title="Appliquer les filtres"
            onPress={applyFilters}
            style={styles.applyButton}
          />
        </View>
      </View>
    </Modal>
  );

  const renderCalendarModal = () => (
    <Modal
      visible={showCalendar}
      animationType="slide"
      onRequestClose={() => setShowCalendar(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowCalendar(false)}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Vue calendrier</Text>
          <View style={{ width: 24 }} />
        </View>

        <InteractiveCalendar
          disponibilites={disponibilites}
          selectedDates={selectedDates}
          onDateSelect={handleCalendarDateSelect}
          onDateDeselect={handleCalendarDateDeselect}
          mode="view"
        />

        <View style={styles.calendarInfo}>
          <Text style={styles.calendarInfoText}>
            {selectedDates.length} date(s) sélectionnée(s)
          </Text>
          <Text style={styles.calendarSubtext}>
            Les offres actives sont affichées sur le calendrier
          </Text>
        </View>
      </View>
    </Modal>
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'publie': return '#28a745';
      case 'brouillon': return '#6c757d';
      case 'en_attente_validation': return '#ffc107';
      case 'suspendu': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'publie': return 'Publié';
      case 'brouillon': return 'Brouillon';
      case 'en_attente_validation': return 'En attente';
      case 'suspendu': return 'Suspendu';
      default: return status;
    }
  };

  if (loading) {
    return (
      <>
        <Header title="Mes offres" showBack={false} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Chargement des offres...</Text>
        </View>
      </>
    );
  }

  return (
    <>
      <Header title="Mes offres" showBack={false} />
      
      <ScrollView 
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Statistiques */}
        {renderStats()}

        {/* Barre de recherche et filtres */}
        {renderSearchAndFilters()}

        {/* Sélecteur de vue */}
        {renderViewModeSelector()}

        {/* Actions rapides */}
        <View style={styles.quickActions}>
          <Button
            title="🚀 Créer une offre intelligente"
            onPress={handleCreateSmartOffer}
            style={styles.quickActionButton}
          />
        </View>

        {/* Contenu principal */}
        {filteredOffers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text" size={64} color="#ccc" />
            <Text style={styles.emptyTitle}>
              {searchQuery || filters.matiere || filters.niveau || filters.statut || filters.type 
                ? 'Aucune offre trouvée' 
                : 'Aucune offre pour le moment'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery || filters.matiere || filters.niveau || filters.statut || filters.type
                ? 'Essayez de modifier vos filtres'
                : 'Créez votre première offre pour commencer'}
            </Text>
            {!searchQuery && !filters.matiere && !filters.niveau && !filters.statut && !filters.type && (
              <Button
                title="Créer une offre"
                onPress={handleCreateSmartOffer}
                style={styles.emptyButton}
              />
            )}
          </View>
        ) : (
          <>
            {viewMode === 'cards' && (
              <View style={styles.cardsContainer}>
                {filteredOffers.map(renderOfferCard)}
              </View>
            )}
            
            {viewMode === 'list' && renderOfferList()}
          </>
        )}
      </ScrollView>

      {/* Modals */}
      {renderFiltersModal()}
      {renderCalendarModal()}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  statCard: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  searchFilterContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 0,
    padding: 0,
  },
  filterButton: {
    marginLeft: 12,
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewModeSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  viewModeButton: {
    marginHorizontal: 8,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f0f8ff',
  },
  viewModeButtonActive: {
    backgroundColor: '#007AFF',
  },
  quickActions: {
    padding: 16,
    marginBottom: 8,
  },
  quickActionButton: {
    backgroundColor: '#28a745',
  },
  cardsContainer: {
    padding: 16,
  },
  offerCard: {
    marginBottom: 16,
    padding: 16,
  },
  offerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  offerTitleContainer: {
    flex: 1,
    marginRight: 12,
  },
  offerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  offerStatus: {
    alignSelf: 'flex-start',
  },
  statusText: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    fontSize: 12,
    fontWeight: 'bold',
  },
  offerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  offerDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  offerDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  offerDetail: {
    fontSize: 12,
    color: '#666',
    marginRight: 16,
    marginBottom: 4,
  },
  offerStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  offerStat: {
    alignItems: 'center',
  },
  offerStatNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  offerStatLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  offerBottomActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#f0f8ff',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#007AFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  publishButton: {
    backgroundColor: '#28a745',
  },
  publishButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  listContainer: {
    flex: 1,
    padding: 16,
  },
  listItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  listItemContent: {
    flex: 1,
  },
  listItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  listItemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  listItemStatus: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  listItemSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  listItemDetails: {
    flexDirection: 'row',
    gap: 16,
  },
  listItemDetail: {
    fontSize: 12,
    color: '#666',
  },
  listItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#007AFF',
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
    fontWeight: 'bold',
    color: '#333',
  },
  resetButton: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  filterOptionSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  filterOptionText: {
    fontSize: 14,
    color: '#333',
  },
  filterOptionTextSelected: {
    color: '#fff',
  },
  modalActions: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  applyButton: {
    backgroundColor: '#007AFF',
  },
  calendarInfo: {
    padding: 16,
    backgroundColor: '#f8f9fa',
  },
  calendarInfoText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  calendarSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

export default TutorOffersScreen;
