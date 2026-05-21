import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/ui/Header';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import TextInputField from '../../components/ui/TextInputField';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import InteractiveCalendar from '../../components/calendar/InteractiveCalendar';
import { useAuth } from '../../context/AuthContext';

const TutorOffersScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [offers, setOffers] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);
  const [disponibilites, setDisponibilites] = useState([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [viewMode, setViewMode] = useState('cards'); // 'cards', 'list', 'calendar'
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDates, setSelectedDates] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    actives: 0,
    brouillons: 0,
    en_attente: 0
  });
  
  const [formData, setFormData] = useState({
    titre: '',
    description: '',
    matiere: '',
    niveau: '',
    type: 'individuel',
    tarif: '',
    gratuit: false,
    duree_session: 60,
    nombre_places: 1,
    en_ligne: true,
    presentiel: false,
    lieu: '',
    lien_visio: '',
    mode_planning: 'manuel',
    repetition_config: {
      type: 'aucune',
      jours: [],
      heure_debut: '09:00'
    },
    statut_workflow: 'brouillon',
    est_active: true
  });

  const matieres = [
    'Mathématiques', 'Physique', 'Chimie', 'Biologie',
    'Informatique', 'Français', 'Anglais', 'Histoire',
    'Géographie', 'Économie', 'Droit', 'Marketing'
  ];

  const niveaux = [
    'L1', 'L2', 'L3', 'M1', 'M2'
  ];

  const frequences = [
    { id: 'quotidien', label: 'Chaque jour' },
    { id: 'hebdomadaire', label: 'Chaque semaine' },
    { id: 'mensuel', label: 'Chaque mois' }
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
      
      const response = await fetch(`${API_BASE_URL}/api/tutorat/offres/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        const offersArray = data.results || data || [];
        setOffers(offersArray);
        console.log(' Offres chargées:', offersArray);
      }
    } catch (error) {
      console.error('Erreur chargement offres:', error);
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

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadOffers(), loadDisponibilites()]);
    setRefreshing(false);
  };

  const resetForm = () => {
    setFormData({
      matiere: '',
      niveau: '',
      description: '',
      nombre_places: 5,
      prix: 15.0,
      date: new Date(),
      heure: new Date(),
      est_recurrent: false,
      frequence_repetition: 'hebdomadaire',
      est_active: true
    });
    setEditingOffer(null);
    setShowAddForm(false);
  };

  const handleEdit = (offer) => {
    setEditingOffer(offer);
    setFormData({
      matiere: offer.matiere || '',
      niveau: offer.niveau || '',
      description: offer.description || '',
      nombre_places: offer.nombre_places || 5,
      prix: offer.prix || 15.0,
      date: new Date(offer.date_heure),
      heure: new Date(offer.date_heure),
      est_recurrent: offer.est_recurrent || false,
      frequence_repetition: offer.frequence_repetition || 'hebdomadaire',
      est_active: offer.est_active !== false
    });
    setShowAddForm(true);
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.matiere.trim()) {
      Alert.alert('Erreur', 'Veuillez sélectionner une matière');
      return;
    }

    if (!formData.niveau) {
      Alert.alert('Erreur', 'Veuillez sélectionner un niveau');
      return;
    }

    if (!formData.description.trim()) {
      Alert.alert('Erreur', 'Veuillez ajouter une description');
      return;
    }

    if (formData.nombre_places < 1 || formData.nombre_places > 50) {
      Alert.alert('Erreur', 'Le nombre de places doit être entre 1 et 50');
      return;
    }

    if (formData.prix < 0 || formData.prix > 500) {
      Alert.alert('Erreur', 'Le prix doit être entre 0 et 500€');
      return;
    }

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('accessToken');
      
      // Utiliser un ID fixe temporairement pour éviter les erreurs JWT
      const userId = 1;
      
      const offerData = {
        tuteur: userId, // Champ obligatoire
        matiere: formData.matiere.trim(),
        niveau: formData.niveau,
        description: formData.description.trim(),
        nombre_places: parseInt(formData.nombre_places),
        prix: parseFloat(formData.prix),
        date_heure: new Date(
          formData.date.getFullYear(),
          formData.date.getMonth(),
          formData.date.getDate(),
          formData.heure.getHours(),
          formData.heure.getMinutes()
        ).toISOString(),
        est_recurrent: formData.est_recurrent,
        frequence_repetition: formData.est_recurrent ? formData.frequence_repetition : null,
        est_active: formData.est_active
      };

      const url = editingOffer 
        ? `${API_BASE_URL}/api/tutorat/offres/${editingOffer.id}/`
        : `${API_BASE_URL}/api/tutorat/offres/`;
      
      const method = editingOffer ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(offerData)
      });

      if (response.ok) {
        Alert.alert(
          'Succès',
          editingOffer ? 'Offre modifiée avec succès' : 'Offre créée avec succès',
          [
            { text: 'OK', onPress: () => {
              resetForm();
              loadOffers();
            }}
          ]
        );
      } else {
        const error = await response.json();
        Alert.alert('Erreur', error.message || 'Impossible de créer/modifier l\'offre');
      }
    } catch (error) {
      console.error('Erreur offre:', error);
      Alert.alert('Erreur', 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (offer) => {
    Alert.alert(
      'Supprimer l\'offre',
      `Voulez-vous vraiment supprimer cette offre de ${offer.matiere} ?`,
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
                Alert.alert('Erreur', 'Impossible de supprimer l\'offre');
              }
            } catch (error) {
              console.error('Erreur suppression offre:', error);
              Alert.alert('Erreur', 'Une erreur est survenue');
            }
          },
        },
      ]
    );
  };

  const handleViewInscriptions = (offer) => {
    navigation.navigate('OfferInscriptions', { offerId: offer.id });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (places, placesReservees) => {
    const pourcentage = (placesReservees / places) * 100;
    if (pourcentage === 100) return '#dc3545';  // Complet
    if (pourcentage >= 75) return '#ffc107';   // Presque complet
    return '#28a745';                           // Disponible
  };

  const getStatusText = (places, placesReservees) => {
    const pourcentage = (placesReservees / places) * 100;
    if (pourcentage === 100) return 'Complet';
    if (pourcentage >= 75) return 'Presque complet';
    return `${places - placesReservees} places disponibles`;
  };

  if (loading && offers.length === 0) {
    return (
      <>
        <Header title="Mes offres" showBack onBackPress={() => navigation.goBack()} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Chargement de vos offres...</Text>
        </View>
      </>
    );
  }

  return (
    <>
      <Header title="Mes offres" showBack onBackPress={() => navigation.goBack()} />
      <ScrollView 
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Card style={styles.addCard}>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => setShowAddForm(!showAddForm)}
          >
            <Ionicons name="add-circle-outline" size={24} color="#007AFF" />
            <Text style={styles.addButtonText}>
              {showAddForm ? 'Annuler' : 'Nouvelle offre'}
            </Text>
          </TouchableOpacity>
        </Card>

        {showAddForm && (
          <Card style={styles.formCard}>
            <Text style={styles.sectionTitle}>
              {editingOffer ? 'Modifier l\'offre' : 'Nouvelle offre de tutorat'}
            </Text>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Matière *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagsScroll}>
                {matieres.map((matiere, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.tag,
                      formData.matiere === matiere && styles.tagSelected
                    ]}
                    onPress={() => setFormData(prev => ({ ...prev, matiere }))}
                  >
                    <Text style={[
                      styles.tagText,
                      formData.matiere === matiere && styles.tagTextSelected
                    ]}>{matiere}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Niveau *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagsScroll}>
                {niveaux.map((niveau, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.tag,
                      formData.niveau === niveau && styles.tagSelected
                    ]}
                    onPress={() => setFormData(prev => ({ ...prev, niveau }))}
                  >
                    <Text style={[
                      styles.tagText,
                      formData.niveau === niveau && styles.tagTextSelected
                    ]}>{niveau}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Description *</Text>
              <TextInputField
                value={formData.description}
                onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
                placeholder="Décrivez votre offre de tutorat..."
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.label}>Nombre de places *</Text>
                <TextInputField
                  value={formData.nombre_places.toString()}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, nombre_places: parseInt(text) || 1 }))}
                  placeholder="5"
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.label}>Prix (€/h) *</Text>
                <TextInputField
                  value={formData.prix.toString()}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, prix: parseFloat(text) || 0 }))}
                  placeholder="15.00"
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.label}>Date *</Text>
                <TouchableOpacity 
                  style={styles.dateButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Ionicons name="calendar-outline" size={20} color="#007AFF" />
                  <Text style={styles.dateButtonText}>
                    {formData.date.toLocaleDateString('fr-FR')}
                  </Text>
                </TouchableOpacity>
              </View>
              
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.label}>Heure *</Text>
                <TouchableOpacity 
                  style={styles.dateButton}
                  onPress={() => setShowTimePicker(true)}
                >
                  <Ionicons name="time-outline" size={20} color="#007AFF" />
                  <Text style={styles.dateButtonText}>
                    {formData.heure.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Récurrence automatique</Text>
              <TouchableOpacity 
                style={styles.recurrenceButton}
                onPress={() => setFormData(prev => ({ ...prev, est_recurrent: !prev.est_recurrent }))}
              >
                <Ionicons 
                  name={formData.est_recurrent ? "repeat" : "repeat-outline"} 
                  size={20} 
                  color={formData.est_recurrent ? "#007AFF" : "#666"} 
                />
                <Text style={styles.recurrenceText}>
                  {formData.est_recurrent ? 'Offre récurrente' : 'Offre ponctuelle'}
                </Text>
              </TouchableOpacity>
              
              {formData.est_recurrent && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagsScroll}>
                  {frequences.map((freq, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.tag,
                        formData.frequence_repetition === freq.id && styles.tagSelected
                      ]}
                      onPress={() => setFormData(prev => ({ ...prev, frequence_repetition: freq.id }))}
                    >
                      <Text style={[
                        styles.tagText,
                        formData.frequence_repetition === freq.id && styles.tagTextSelected
                      ]}>{freq.label}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>

            <View style={styles.formGroup}>
              <TouchableOpacity 
                style={styles.activeButton}
                onPress={() => setFormData(prev => ({ ...prev, est_active: !prev.est_active }))}
              >
                <Ionicons 
                  name={formData.est_active ? "checkmark-circle" : "checkmark-circle-outline"} 
                  size={20} 
                  color={formData.est_active ? "#28a745" : "#666"} 
                />
                <Text style={styles.activeText}>
                  {formData.est_active ? 'Offre active' : 'Offre inactive'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.buttonContainer}>
              <Button 
                title={editingOffer ? "Modifier" : "Créer"} 
                onPress={handleSubmit}
                loading={loading}
                style={styles.submitButton}
              />
              {editingOffer && (
                <Button 
                  title="Annuler" 
                  onPress={resetForm}
                  type="secondary"
                  style={styles.cancelButton}
                />
              )}
            </View>
          </Card>
        )}

        {offers.length === 0 && !showAddForm ? (
          <Card style={styles.emptyCard}>
            <View style={styles.emptyContainer}>
              <Ionicons name="school-outline" size={60} color="#ccc" />
              <Text style={styles.emptyTitle}>Aucune offre</Text>
              <Text style={styles.emptyText}>
                Créez votre première offre de tutorat pour commencer !
              </Text>
            </View>
          </Card>
        ) : (
          (offers || []).map(offer => {
            const placesDisponibles = offer.nombre_places - (offer.places_reservees || 0);
            return (
              <Card key={offer.id} style={styles.offerCard}>
                <View style={styles.offerHeader}>
                  <View style={styles.offerInfo}>
                    <Text style={styles.offerTitle}>{offer.matiere}</Text>
                    <Text style={styles.offerLevel}>{offer.niveau}</Text>
                    <Text style={styles.offerDate}>{formatDate(offer.date_heure)}</Text>
                    {offer.est_recurrent && (
                      <Text style={styles.offerRecurrent}>
                        {frequences.find(f => f.id === offer.frequence_repetition)?.label || 'Récurrent'}
                      </Text>
                    )}
                  </View>
                  <View style={styles.offerStatus}>
                    <Text style={[
                      styles.statusText,
                      { color: getStatusColor(offer.nombre_places, offer.places_reservees || 0) }
                    ]}>
                      {getStatusText(offer.nombre_places, offer.places_reservees || 0)}
                    </Text>
                    <View style={[
                      styles.statusIndicator,
                      { backgroundColor: getStatusColor(offer.nombre_places, offer.places_reservees || 0) }
                    ]} />
                  </View>
                </View>
                
                <Text style={styles.offerDescription} numberOfLines={3}>
                  {offer.description}
                </Text>
                
                <View style={styles.offerDetails}>
                  <Text style={styles.detailText}>
                    <Ionicons name="people-outline" size={14} color="#666" />
                    {' '}{offer.places_reservees || 0}/{offer.nombre_places} inscrits
                  </Text>
                  <Text style={styles.detailText}>
                    <Ionicons name="cash-outline" size={14} color="#666" />
                    {' '}{offer.prix}€/h
                  </Text>
                </View>
                
                <View style={styles.offerActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.viewButton]}
                    onPress={() => handleViewInscriptions(offer)}
                  >
                    <Ionicons name="people-outline" size={16} color="#007AFF" />
                    <Text style={styles.actionText}>Voir les inscrits</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.actionButton, styles.editButton]}
                    onPress={() => handleEdit(offer)}
                  >
                    <Ionicons name="create-outline" size={16} color="#007AFF" />
                    <Text style={styles.actionText}>Modifier</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => handleDelete(offer)}
                  >
                    <Ionicons name="trash-outline" size={16} color="#dc3545" />
                    <Text style={styles.actionText}>Supprimer</Text>
                  </TouchableOpacity>
                </View>
              </Card>
            );
          })
        )}

        {/* DateTimePickers */}
        {showDatePicker && (
          <DateTimePicker
            value={formData.date}
            mode="date"
            display="default"
            minimumDate={new Date()}
            onChange={(event, selectedDate) => {
              setShowDatePicker(false);
              if (selectedDate) {
                setFormData(prev => ({ ...prev, date: selectedDate }));
              }
            }}
          />
        )}

        {showTimePicker && (
          <DateTimePicker
            value={formData.heure}
            mode="time"
            display="default"
            onChange={(event, selectedDate) => {
              setShowTimePicker(false);
              if (selectedDate) {
                setFormData(prev => ({ ...prev, heure: selectedDate }));
              }
            }}
          />
        )}
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  addCard: {
    marginBottom: 16,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#f8f9ff',
    borderRadius: 8,
  },
  addButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
    marginLeft: 8,
  },
  formCard: {
    marginBottom: 16,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  tagsScroll: {
    flexDirection: 'row',
    marginHorizontal: -4,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    marginHorizontal: 4,
  },
  tagSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  tagText: {
    fontSize: 12,
    color: '#666',
  },
  tagTextSelected: {
    color: '#fff',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
  },
  recurrenceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
  },
  recurrenceText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
  },
  activeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
  },
  activeText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  submitButton: {
    flex: 1,
  },
  cancelButton: {
    flex: 1,
  },
  emptyCard: {
    alignItems: 'center',
    padding: 40,
  },
  emptyContainer: {
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
  offerCard: {
    marginBottom: 16,
  },
  offerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  offerInfo: {
    flex: 1,
  },
  offerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  offerLevel: {
    fontSize: 14,
    color: '#007AFF',
    marginBottom: 2,
  },
  offerDate: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  offerRecurrent: {
    fontSize: 12,
    color: '#28a745',
    fontStyle: 'italic',
  },
  offerStatus: {
    alignItems: 'flex-end',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    marginRight: 8,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  offerDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  offerDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 8,
    marginBottom: 12,
  },
  detailText: {
    fontSize: 12,
    color: '#666',
  },
  offerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    flex: 1,
    marginHorizontal: 4,
    justifyContent: 'center',
  },
  viewButton: {
    backgroundColor: '#e3f2fd',
  },
  editButton: {
    backgroundColor: '#e3f2fd',
  },
  deleteButton: {
    backgroundColor: '#ffebee',
  },
  actionText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
});

export default TutorOffersScreen;
