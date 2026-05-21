import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  FlatList,
  Image,
  Modal,
  Dimensions,
} from 'react-native';
import Header from '../../components/ui/Header';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { API_BASE_URL } from '../../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';

const { width } = Dimensions.get('window');

const FindTutorScreen = ({ navigation }) => {
  const { user } = useAuth();
  
  // États pour les filtres
  const [filters, setFilters] = useState({
    matiere: '',
    niveau: '',
    disponibilite: '',
    noteMinimum: 0,
    tarifMax: '',
    typeSeance: '',
    searchQuery: ''
  });
  
  // États pour les données
  const [tuteurs, setTuteurs] = useState([]);
  const [tuteursRecommandes, setTuteursRecommandes] = useState([]);
  const [meilleursTuteurs, setMeilleursTuteurs] = useState([]);
  const [tuteursDisponibles, setTuteursDisponibles] = useState([]);
  const [matieres, setMatieres] = useState([]);
  const [niveaux, setNiveaux] = useState([]);
  
  // États UI
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showCompare, setShowCompare] = useState(false);
  const [selectedTuteurs, setSelectedTuteurs] = useState([]);
  const [showTuteurDetail, setShowTuteurDetail] = useState(false);
  const [selectedTuteur, setSelectedTuteur] = useState(null);
  const [tuteurEvaluations, setTuteurEvaluations] = useState([]);
  
  useEffect(() => {
    loadInitialData();
    loadTuteursRecommandes();
    loadMeilleursTuteurs();
    loadTuteursDisponibles();
  }, []);
  
  // Charger les données initiales
  const loadInitialData = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      
      // Charger les matières disponibles
      const matieresResponse = await fetch(`${API_BASE_URL}/api/matieres/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (matieresResponse.ok) {
        const matieresData = await matieresResponse.json();
        setMatieres(matieresData);
      }
      
      // Charger les niveaux d'enseignement
      const niveauxResponse = await fetch(`${API_BASE_URL}/api/niveaux-enseignement/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (niveauxResponse.ok) {
        const niveauxData = await niveauxResponse.json();
        setNiveaux(niveauxData);
      }
      
      // Charger les tuteurs avec filtres initiaux
      await searchTuteurs();
      
    } catch (error) {
      console.error('Erreur chargement données initiales:', error);
      Alert.alert('Erreur', 'Impossible de charger les données initiales');
    }
  };
  
  // Charger les matières depuis l'API avec diagnostic
  const loadMatieres = async () => {
    try {
      console.log('Tentative de chargement des matières...');
      const token = await AsyncStorage.getItem('accessToken');
      console.log('Token trouvé:', token ? 'OUI' : 'NON');
      
      const url = `${API_BASE_URL}/api/accounts/matieres/`;
      console.log('URL appelée:', url);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      console.log('Status response:', response.status);
      console.log('Headers response:', response.headers);
      
      if (response.ok) {
        const text = await response.text();
        console.log('Response text (first 200 chars):', text.substring(0, 200));
        
        try {
          const data = JSON.parse(text);
          console.log('Matières chargées:', data.length, 'éléments');
          setMatieres(data);
        } catch (parseError) {
          console.error('Erreur parsing JSON:', parseError);
          console.error('Response brute:', text);
          setMatieres([]);
        }
      } else {
        console.error('Erreur HTTP:', response.status);
        const errorText = await response.text();
        console.error('Error response:', errorText);
        setMatieres([]);
      }
    } catch (error) {
      console.error('Erreur générale chargement matières:', error);
      setMatieres([]);
    }
  };

  // Charger les niveaux depuis l'API avec diagnostic
  const loadNiveaux = async () => {
    try {
      console.log('Tentative de chargement des niveaux...');
      const token = await AsyncStorage.getItem('accessToken');
      console.log('Token trouvé:', token ? 'OUI' : 'NON');
      
      const url = `${API_BASE_URL}/api/accounts/niveaux-enseignement/`;
      console.log('URL appelée:', url);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      console.log('Status response niveaux:', response.status);
      
      if (response.ok) {
        const text = await response.text();
        console.log('Response text niveaux (first 200 chars):', text.substring(0, 200));
        
        try {
          const data = JSON.parse(text);
          console.log('Niveaux chargés:', data.length, 'éléments');
          setNiveaux(data);
        } catch (parseError) {
          console.error('Erreur parsing JSON niveaux:', parseError);
          console.error('Response brute niveaux:', text);
          setNiveaux([]);
        }
      } else {
        console.error('Erreur HTTP niveaux:', response.status);
        const errorText = await response.text();
        console.error('Error response niveaux:', errorText);
        setNiveaux([]);
      }
    } catch (error) {
      console.error('Erreur générale chargement niveaux:', error);
      setNiveaux([]);
    }
  };
  
  // Charger les tuteurs recommandés
  const loadTuteursRecommandes = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}/api/tutorat/tuteurs/recommandes/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setTuteursRecommandes(data);
        console.log('Tuteurs recommandés:', data);
      }
    } catch (error) {
      console.error('Erreur chargement tuteurs recommandés:', error);
    }
  };
  
  // Charger les meilleurs tuteurs
  const loadMeilleursTuteurs = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}/api/tutorat/tuteurs/classement/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setMeilleursTuteurs(data);
        console.log('Meilleurs tuteurs:', data);
      }
    } catch (error) {
      console.error('Erreur chargement meilleurs tuteurs:', error);
    }
  };
  
  // Charger les tuteurs disponibles maintenant
  const loadTuteursDisponibles = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}/api/tutorat/tuteurs/disponibles-maintenant/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setTuteursDisponibles(data);
        console.log('Tuteurs disponibles maintenant:', data);
      }
    } catch (error) {
      console.error('Erreur chargement tuteurs disponibles:', error);
    }
  };
  
  // Rechercher les tuteurs avec filtres
  const searchTuteurs = async () => {
    try {
      console.log('Début recherche tuteurs...');
      const token = await AsyncStorage.getItem('accessToken');
      console.log('Token recherche:', token ? 'OUI' : 'NON');
      
      // Construire les paramètres de recherche
      const params = new URLSearchParams();
      if (filters.matiere) params.append('matiere', filters.matiere);
      if (filters.niveau) params.append('niveau', filters.niveau);
      if (filters.disponibilite) params.append('disponibilite', filters.disponibilite);
      if (filters.noteMinimum > 0) params.append('note_minimum', filters.noteMinimum);
      if (filters.tarifMax) params.append('tarif_max', filters.tarifMax);
      if (filters.typeSeance) params.append('type_seance', filters.typeSeance);
      if (filters.searchQuery) params.append('search', filters.searchQuery);
      
      const url = `${API_BASE_URL}/api/tutorat/tuteurs/recherche/?${params.toString()}`;
      console.log('URL recherche tuteurs:', url);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      console.log('Status recherche tuteurs:', response.status);
      console.log('Headers recherche:', response.headers);
      
      if (response.ok) {
        const text = await response.text();
        console.log('Response recherche (first 1000 chars):', text.substring(0, 1000));
        
        try {
          const data = JSON.parse(text);
          console.log('Tuteurs trouvés:', data.length);
          setTuteurs(data);
        } catch (parseError) {
          console.error('Erreur parsing JSON recherche:', parseError);
          console.error('Response brute recherche:', text.substring(0, 1000));
          setTuteurs([]);
        }
      } else {
        console.error('Erreur HTTP recherche:', response.status);
        const errorText = await response.text();
        console.error('Error response recherche:', errorText);
        setTuteurs([]);
      }
    } catch (error) {
      console.error('Erreur recherche tuteurs:', error);
      setTuteurs([]);
      setLoading(false);
    }
  };
  
  // Rafraîchir la recherche
  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      searchTuteurs(),
      loadTuteursRecommandes(),
      loadMeilleursTuteurs(),
      loadTuteursDisponibles()
    ]);
    setRefreshing(false);
  };
  
  // Afficher les détails d'un tuteur
  const showTutorDetails = async (tuteur) => {
    try {
      setSelectedTuteur(tuteur);
      setShowTuteurDetail(true);
      
      // Charger les évaluations récentes du tuteur
      const token = await AsyncStorage.getItem('accessToken');
      const evalResponse = await fetch(`${API_BASE_URL}/api/tutorat/tuteurs/${tuteur.id}/evaluations-recentes/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (evalResponse.ok) {
        const evalData = await evalResponse.json();
        setTuteurEvaluations(evalData);
        console.log('Évaluations récentes:', evalData);
      }
    } catch (error) {
      console.error('Erreur chargement détails tuteur:', error);
    }
  };
  
  // Contacter un tuteur
  const contactTutor = (tuteur) => {
    navigation.navigate('StudentMessages', { tuteurId: tuteur.id, tuteurName: `${tuteur.prenom} ${tuteur.nom}` });
  };
  
  // Réserver une séance
  const bookSession = (tuteur) => {
    navigation.navigate('BookingSession', { tutorId: tuteur.id, tutor: tuteur });
  };
  
  // Ajouter à la comparaison
  const addToCompare = (tuteur) => {
    if (selectedTuteurs.length >= 3) {
      Alert.alert('Limite atteinte', 'Vous pouvez comparer au maximum 3 tuteurs');
      return;
    }
    
    if (selectedTuteurs.find(t => t.id === tuteur.id)) {
      setSelectedTuteurs(selectedTuteurs.filter(t => t.id !== tuteur.id));
    } else {
      setSelectedTuteurs([...selectedTuteurs, tuteur]);
    }
  };
  
  // Voir le profil complet
  const viewProfile = (tuteur) => {
    navigation.navigate('TutorProfile', { tutorId: tuteur.id });
  };
  
  // Rendu des filtres
  const renderFilters = () => (
    <Modal visible={showFilters} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.filterModal}>
          <View style={styles.filterHeader}>
            <Text style={styles.filterTitle}>Filtres de recherche</Text>
            <TouchableOpacity onPress={() => setShowFilters(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.filterContent}>
            {/* Recherche textuelle */}
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Recherche</Text>
              <TextInput
                style={styles.filterInput}
                placeholder="Nom, matière, niveau, description..."
                value={filters.searchQuery}
                onChangeText={(text) => setFilters({...filters, searchQuery: text})}
                onSubmitEditing={searchTuteurs}
              />
            </View>
            
            {/* Tarif maximum */}
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Tarif maximum (FCFA/h)</Text>
              <TextInput
                style={styles.filterInput}
                placeholder="Ex: 10000"
                value={filters.tarifMax}
                onChangeText={(text) => setFilters({...filters, tarifMax: text})}
                keyboardType="numeric"
                onSubmitEditing={searchTuteurs}
              />
            </View>
            
            {/* Option gratuit */}
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Type de tarif</Text>
              <TouchableOpacity 
                style={styles.freeOption}
                onPress={() => {
                  const isFree = filters.tarifMax === '0';
                  setFilters({...filters, tarifMax: isFree ? '' : '0'});
                }}
              >
                <Ionicons 
                  name={filters.tarifMax === '0' ? "checkbox" : "square-outline"} 
                  size={20} 
                  color={filters.tarifMax === '0' ? "#007AFF" : "#666"} 
                />
                <Text style={styles.freeOptionText}>🎓 Uniquement les tuteurs qui proposent des cours gratuits</Text>
              </TouchableOpacity>
              
              <Text style={styles.freeDescription}>
                Cochez cette case pour trouver uniquement les tuteurs qui donnent des cours gratuits
              </Text>
            </View>
            
            {/* Message informatif */}
            <View style={styles.filterGroup}>
              <Text style={styles.filterInfo}>
                💡 Astuce : Utilisez la recherche par mot-clé et l'option "cours gratuits" pour trouver des tuteurs bénévoles !
              </Text>
            </View>
          </ScrollView>
          
          <View style={styles.filterActions}>
            <TouchableOpacity 
              style={styles.resetButton}
              onPress={() => {
                setFilters({
                  searchQuery: '',
                  tarifMax: ''
                });
                searchTuteurs();
              }}
            >
              <Text style={styles.resetButtonText}>Effacer</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.applyButton}
              onPress={() => {
                setShowFilters(false);
                searchTuteurs();
              }}
            >
              <Text style={styles.applyButtonText}>Appliquer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
  
  // Rendu de la carte tuteur
  const renderTutorCard = (tuteur, isRecommanded = false, isTop = false, isAvailable = false) => (
    <Card style={[
      styles.tutorCard,
      isRecommanded && styles.recommendedCard,
      isTop && styles.topCard,
      isAvailable && styles.availableCard
    ]}>
      <View style={styles.tutorDetails}>
        <View style={styles.tutorNameRow}>
          <Text style={styles.tutorName}>{tuteur.prenom} {tuteur.nom}</Text>
          {isRecommanded && <View style={styles.recommendedBadge}><Text style={styles.recommendedText}># Recommandé</Text></View>}
          {isTop && <View style={styles.topBadge}><Text style={styles.topText}> Top</Text></View>}
          {isAvailable && <View style={styles.availableBadge}><Text style={styles.availableText}> Disponible</Text></View>}
        </View>
        
        <Text style={styles.tutorSubjects} numberOfLines={2}>
          {(() => {
            if (tuteur.matieres_enseignees) {
              try {
                // Parser les matières depuis le format JSON ou texte
                let matieres = [];
                if (typeof tuteur.matieres_enseignees === 'string') {
                  if (tuteur.matieres_enseignees.startsWith('[')) {
                    matieres = JSON.parse(tuteur.matieres_enseignees);
                  } else {
                    matieres = tuteur.matieres_enseignees.split(',').map(m => m.trim());
                  }
                } else if (Array.isArray(tuteur.matieres_enseignees)) {
                  matieres = tuteur.matieres_enseignees;
                }
                return matieres.slice(0, 3).join(', ') + (matieres.length > 3 ? '...' : '');
              } catch (e) {
                return 'Matières non spécifiées';
              }
            }
            return 'Matières non spécifiées';
          })()}
        </Text>
        <Text style={styles.tutorBio} numberOfLines={2}>{tuteur.biographie || 'Pas de description'}</Text>
      </View>
      
      <View style={styles.tutorStats}>
        <View style={styles.statItem}>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={16} color="#ffc107" />
            <Text style={styles.ratingText}>{tuteur.note_moyenne?.toFixed(1) || 'N/A'}/5</Text>
          </View>
          <Text style={styles.evaluationsText}>({tuteur.nombre_evaluations || 0} évaluations)</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.sessionsText}>{tuteur.nombre_seances || 0} séances</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.priceText}>
            {tuteur.tarif ? `${tuteur.tarif} FCFA/h` : 'Gratuit'}
          </Text>
        </View>
      </View>
      
      {/* Badges */}
      {tuteur.badges && tuteur.badges.length > 0 && (
        <View style={styles.badgesContainer}>
          {tuteur.badges.slice(0, 3).map((badge, index) => (
            <View key={index} style={[styles.badge, { backgroundColor: badge.couleur || '#007AFF' }]}>
              <Text style={styles.badgeText}>{badge.nom}</Text>
            </View>
          ))}
        </View>
      )}
      
      {/* Disponibilités */}
      {tuteur.disponibilites && tuteur.disponibilites.length > 0 && (
        <View style={styles.disponibilitiesContainer}>
          <Text style={styles.disponibilitiesTitle}>Disponibilités:</Text>
          <View style={styles.disponibilitiesList}>
            {tuteur.disponibilites.slice(0, 4).map((dispo, index) => (
              <Text key={index} style={styles.disponibilityItem}>
                {dispo.jour}: {dispo.heures}
              </Text>
            ))}
          </View>
        </View>
      )}
      
      <View style={styles.tutorActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => showTutorDetails(tuteur)}
        >
          <Text style={styles.actionButtonText}>Voir profil</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.primaryButton]}
          onPress={() => contactTutor(tuteur)}
        >
          <Text style={styles.primaryButtonText}>Contacter</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.secondaryButton]}
          onPress={() => bookSession(tuteur)}
        >
          <Text style={styles.secondaryButtonText}>Réserver</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.compareButton}
          onPress={() => addToCompare(tuteur)}
        >
          <Ionicons 
            name={selectedTuteurs.find(t => t.id === tuteur.id) ? "checkbox" : "square-outline"} 
            size={20} 
            color={selectedTuteurs.find(t => t.id === tuteur.id) ? "#007AFF" : "#666"} 
          />
        </TouchableOpacity>
      </View>
    </Card>
  );
  
  // Rendu du modal de comparaison
  const renderCompareModal = () => (
    <Modal visible={showCompare} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.compareModal}>
          <View style={styles.compareHeader}>
            <Text style={styles.compareTitle}>Comparer les tuteurs</Text>
            <TouchableOpacity onPress={() => setShowCompare(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.compareContent}>
            {selectedTuteurs.map((tuteur) => (
              <View key={tuteur.id} style={styles.compareTutorCard}>
                <View style={styles.compareTutorHeader}>
                  <View style={styles.compareTutorPhotoContainer}>
                    {tuteur.photo ? (
                      <Image source={{ uri: tuteur.photo.startsWith('http') ? tuteur.photo : `${API_BASE_URL}${tuteur.photo}` }} style={styles.compareTutorPhoto} />
                    ) : (
                      <View style={styles.compareTutorPhotoPlaceholder}>
                        <Ionicons name="person" size={20} color="#999" />
                      </View>
                    )}
                  </View>
                  <Text style={styles.compareTutorName}>{tuteur.prenom} {tuteur.nom}</Text>
                </View>
                
                <View style={styles.compareStats}>
                  <View style={styles.compareStatItem}>
                    <Text style={styles.compareStatLabel}>Note</Text>
                    <Text style={styles.compareStatValue}>{tuteur.note_moyenne?.toFixed(1) || 'N/A'}/5</Text>
                  </View>
                  
                  <View style={styles.compareStatItem}>
                    <Text style={styles.compareStatLabel}>Séances</Text>
                    <Text style={styles.compareStatValue}>{tuteur.nombre_seances || 0}</Text>
                  </View>
                  
                  <View style={styles.compareStatItem}>
                    <Text style={styles.compareStatLabel}>Tarif</Text>
                    <Text style={styles.compareStatValue}>{tuteur.tarif ? `${tuteur.tarif} FCFA/h` : 'Gratuit'}</Text>
                  </View>
                  
                  <View style={styles.compareStatItem}>
                    <Text style={styles.compareStatLabel}>Matières</Text>
                    <Text style={styles.compareStatValue} numberOfLines={2}>
                      {(() => {
                        if (tuteur.matieres_enseignees) {
                          try {
                            // Parser les matières depuis le format JSON ou texte
                            let matieres = [];
                            if (typeof tuteur.matieres_enseignees === 'string') {
                              if (tuteur.matieres_enseignees.startsWith('[')) {
                                matieres = JSON.parse(tuteur.matieres_enseignees);
                              } else {
                                matieres = tuteur.matieres_enseignees.split(',').map(m => m.trim());
                              }
                            } else if (Array.isArray(tuteur.matieres_enseignees)) {
                              matieres = tuteur.matieres_enseignees;
                            }
                            return matieres.slice(0, 3).join(', ') + (matieres.length > 3 ? '...' : '');
                          } catch (e) {
                            return 'Matières';
                          }
                        }
                        return 'Aucune';
                      })()}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>
          
          <View style={styles.compareActions}>
            <TouchableOpacity 
              style={styles.compareActionButton}
              onPress={() => {
                setShowCompare(false);
                setSelectedTuteurs([]);
              }}
            >
              <Text style={styles.compareActionText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
  
  // Rendu du modal de détails du tuteur
  const renderTutorDetailModal = () => (
    <Modal visible={showTuteurDetail} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.detailModal}>
          <View style={styles.detailHeader}>
            <Text style={styles.detailTitle}>Profil du tuteur</Text>
            <TouchableOpacity onPress={() => setShowTuteurDetail(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          
          {selectedTuteur && (
            <ScrollView style={styles.detailContent}>
              <View style={styles.detailTutorHeader}>
                <View style={styles.detailTutorPhotoContainer}>
                  {selectedTuteur.photo ? (
                    <Image source={{ uri: selectedTuteur.photo.startsWith('http') ? selectedTuteur.photo : `${API_BASE_URL}${selectedTuteur.photo}` }} style={styles.detailTutorPhoto} />
                  ) : (
                    <View style={styles.detailTutorPhotoPlaceholder}>
                      <Ionicons name="person" size={40} color="#999" />
                    </View>
                  )}
                </View>
                
                <View style={styles.detailTutorInfo}>
                  <Text style={styles.detailTutorName}>{selectedTuteur.prenom} {selectedTuteur.nom}</Text>
                  <Text style={styles.detailTutorSubjects}>
                  {Array.isArray(selectedTuteur.matieres_enseignees) 
                    ? selectedTuteur.matieres_enseignees.join(', ')
                    : selectedTuteur.matieres_enseignees || ''
                  }
                </Text>
                  
                  <View style={styles.detailRating}>
                    <Ionicons name="star" size={20} color="#ffc107" />
                    <Text style={styles.detailRatingText}>{selectedTuteur.note_moyenne?.toFixed(1) || 'N/A'}/5</Text>
                    <Text style={styles.detailEvaluations}>({selectedTuteur.nombre_evaluations || 0} évaluations)</Text>
                  </View>
                  
                  <Text style={styles.detailPrice}>
                    {selectedTuteur.tarif ? `${selectedTuteur.tarif} FCFA/heure` : 'Gratuit'}
                  </Text>
                </View>
              </View>
              
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Biographie</Text>
                <Text style={styles.detailBio}>{selectedTuteur.biographie || 'Pas de description disponible'}</Text>
              </View>
              
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Matières enseignées</Text>
                <View style={styles.detailSubjectsList}>
                  {selectedTuteur.matieres_enseignees?.map((matiere, index) => (
                    <View key={index} style={styles.detailSubjectItem}>
                      <Text style={styles.detailSubjectText}>{matiere}</Text>
                    </View>
                  ))}
                </View>
              </View>
              
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Disponibilités</Text>
                <View style={styles.detailDisponibilities}>
                  {selectedTuteur.disponibilites?.map((dispo, index) => (
                    <View key={index} style={styles.detailDisponibilityItem}>
                      <Text style={styles.detailDisponibilityDay}>{dispo.jour}:</Text>
                      <Text style={styles.detailDisponibilityHours}>{dispo.heures}</Text>
                    </View>
                  ))}
                </View>
              </View>
              
              {/* Badges */}
              {selectedTuteur.badges && selectedTuteur.badges.length > 0 && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Badges et certifications</Text>
                  <View style={styles.detailBadges}>
                    {selectedTuteur.badges.map((badge, index) => (
                      <View key={index} style={[styles.detailBadge, { backgroundColor: badge.couleur || '#007AFF' }]}>
                        <Ionicons name={badge.icone || 'trophy'} size={20} color="#fff" />
                        <Text style={styles.detailBadgeText}>{badge.nom}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
              
              {/* Évaluations récentes */}
              {tuteurEvaluations.length > 0 && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Évaluations récentes</Text>
                  {tuteurEvaluations.map((evaluation, index) => (
                    <View key={index} style={styles.evaluationItem}>
                      <View style={styles.evaluationHeader}>
                        <Text style={styles.evaluationAuthor}>{evaluation.eleve_nom}</Text>
                        <View style={styles.evaluationRating}>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Ionicons 
                              key={star}
                              name={star <= evaluation.note ? "star" : "star-outline"} 
                              size={16} 
                              color={star <= evaluation.note ? "#ffc107" : "#ddd"} 
                            />
                          ))}
                        </View>
                      </View>
                      <Text style={styles.evaluationComment}>{evaluation.commentaire}</Text>
                      <Text style={styles.evaluationDate}>
                        {new Date(evaluation.date_evaluation).toLocaleDateString('fr-FR')}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>
          )}
          
          <View style={styles.detailActions}>
            <TouchableOpacity 
              style={styles.detailActionButton}
              onPress={() => {
                setShowTuteurDetail(false);
                contactTutor(selectedTuteur);
              }}
            >
              <Text style={styles.detailActionText}>Contacter</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.detailActionButton, styles.detailPrimaryButton]}
              onPress={() => {
                setShowTuteurDetail(false);
                bookSession(selectedTuteur);
              }}
            >
              <Text style={styles.detailPrimaryText}>Réserver une séance</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
  
  return (
    <>
      <Header title="Recherche de tuteurs" showBack={true} />
      
      <ScrollView 
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        nestedScrollEnabled={true}
      >
        {/* Barre de recherche et filtres */}
        <Card style={styles.searchCard}>
          <View style={styles.searchBar}>
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher un tuteur..."
              value={filters.searchQuery}
              onChangeText={(text) => setFilters({...filters, searchQuery: text})}
              onSubmitEditing={searchTuteurs}
            />
            <TouchableOpacity style={styles.searchButton} onPress={searchTuteurs}>
              <Ionicons name="search" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.filterBar}>
            <TouchableOpacity 
              style={styles.filterButton}
              onPress={() => setShowFilters(true)}
            >
              <Ionicons name="filter" size={20} color="#007AFF" />
              <Text style={styles.filterButtonText}>Filtres</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.filterButton,
                selectedTuteurs.length > 0 && styles.filterButtonActive
              ]}
              onPress={() => setShowCompare(true)}
              disabled={selectedTuteurs.length === 0}
            >
              <Ionicons name="git-compare" size={20} color={selectedTuteurs.length > 0 ? "#fff" : "#007AFF"} />
              <Text style={[
                styles.filterButtonText,
                selectedTuteurs.length > 0 && styles.filterButtonTextActive
              ]}>Comparer ({selectedTuteurs.length})</Text>
            </TouchableOpacity>
          </View>
        </Card>
        
        {/* Tuteurs recommandés */}
        {tuteursRecommandes.length > 0 && (
          <Card style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>⭐ Recommandations pour vous</Text>
            <FlatList
              data={tuteursRecommandes}
              renderItem={({ item }) => renderTutorCard(item, true, false, false)}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
              showsHorizontalScrollIndicator={false}
              horizontal
            />
          </Card>
        )}
        
        {/* Tuteurs disponibles maintenant */}
        {tuteursDisponibles.length > 0 && (
          <Card style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>🟢 Disponibles maintenant</Text>
            <FlatList
              data={tuteursDisponibles}
              renderItem={({ item }) => renderTutorCard(item, false, false, true)}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
              showsHorizontalScrollIndicator={false}
              horizontal
            />
          </Card>
        )}
        
        {/* Meilleurs tuteurs */}
        {meilleursTuteurs.length > 0 && (
          <Card style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>🏆 Meilleurs tuteurs</Text>
            <FlatList
              data={meilleursTuteurs}
              renderItem={({ item }) => renderTutorCard(item, false, true, false)}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
              showsHorizontalScrollIndicator={false}
              horizontal
            />
          </Card>
        )}
        
        {/* Résultats de recherche */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>
            {loading ? 'Recherche en cours...' : `Résultats (${tuteurs.length})`}
          </Text>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.loadingText}>Recherche de tuteurs...</Text>
            </View>
          ) : tuteurs.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="search" size={40} color="#ccc" />
              <Text style={styles.emptyText}>Aucun tuteur trouvé</Text>
              <Text style={styles.emptySubtext}>Essayez de modifier vos filtres de recherche</Text>
            </View>
          ) : (
            <FlatList
              data={tuteurs}
              renderItem={({ item }) => renderTutorCard(item)}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          )}
        </Card>
      </ScrollView>
      
      {renderFilters()}
      {renderCompareModal()}
      {renderTutorDetailModal()}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  
  // Carte de recherche
  searchCard: {
    margin: 16,
    padding: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    height: 45,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingHorizontal: 16,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchButton: {
    backgroundColor: '#007AFF',
    width: 45,
    height: 45,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  filterButtonText: {
    color: '#007AFF',
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  
  // Modal de filtres
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  filterModal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  filterContent: {
    padding: 20,
  },
  filterGroup: {
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  filterInfo: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 15,
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e6f3ff',
  },
  freeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  freeOptionText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  freeDescription: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginLeft: 32,
    marginTop: 4,
  },
  filterInput: {
    height: 45,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  pickerContainer: {
    marginBottom: 8,
  },
  picker: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 45,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  pickerText: {
    fontSize: 16,
    color: '#333',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  typeButtonText: {
    fontSize: 14,
    color: '#333',
  },
  filterActions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  resetButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#666',
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  applyButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  
  // Carte tuteur
  sectionCard: {
    margin: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  tutorCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recommendedCard: {
    borderColor: '#ffc107',
    borderWidth: 2,
  },
  topCard: {
    borderColor: '#28a745',
    borderWidth: 2,
  },
  availableCard: {
    borderColor: '#007AFF',
    borderWidth: 2,
  },
  tutorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  tutorInfo: {
    flex: 1,
    flexDirection: 'row',
  },
  tutorPhotoContainer: {
    marginRight: 12,
  },
  tutorPhoto: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  tutorPhotoPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  tutorDetails: {
    flex: 1,
  },
  tutorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  tutorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 8,
  },
  recommendedBadge: {
    backgroundColor: '#ffc107',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 4,
  },
  recommendedText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: 'bold',
  },
  topBadge: {
    backgroundColor: '#28a745',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 4,
  },
  topText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: 'bold',
  },
  availableBadge: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  availableText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: 'bold',
  },
  tutorSubjects: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  tutorBio: {
    fontSize: 12,
    color: '#999',
    lineHeight: 16,
  },
  compareButton: {
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tutorStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 4,
  },
  evaluationsText: {
    fontSize: 12,
    color: '#666',
  },
  sessionsText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  priceText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#28a745',
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 6,
  },
  badgeText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: 'bold',
  },
  disponibilitesContainer: {
    marginBottom: 12,
  },
  disponibilitesTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 6,
  },
  disponibilitesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  disponibilityItem: {
    fontSize: 12,
    color: '#666',
    marginRight: 12,
    marginBottom: 4,
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tutorActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#007AFF',
    marginHorizontal: 4,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  primaryButtonText: {
    color: '#fff',
  },
  secondaryButton: {
    backgroundColor: '#28a745',
    borderColor: '#28a745',
  },
  secondaryButtonText: {
    color: '#fff',
  },
  
  // Modal de comparaison
  compareModal: {
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 12,
    maxHeight: '80%',
  },
  compareHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  compareTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  compareContent: {
    padding: 20,
  },
  compareTutorCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  compareTutorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  compareTutorPhotoContainer: {
    marginRight: 12,
  },
  compareTutorPhoto: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  compareTutorPhotoPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  compareTutorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  compareStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  compareStatItem: {
    alignItems: 'center',
  },
  compareStatLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  compareStatValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  compareActions: {
    padding: 20,
  },
  compareActionButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  compareActionText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  
  // Modal de détails
  detailModal: {
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 12,
    maxHeight: '90%',
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  detailContent: {
    padding: 20,
  },
  detailTutorHeader: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  detailTutorPhotoContainer: {
    marginRight: 16,
  },
  detailTutorPhoto: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  detailTutorPhotoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  detailTutorInfo: {
    flex: 1,
  },
  detailTutorName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  detailTutorSubjects: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  detailRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailRatingText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 4,
  },
  detailEvaluations: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  detailPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#28a745',
  },
  detailSection: {
    marginBottom: 20,
  },
  detailSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  detailBio: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  detailSubjectsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  detailSubjectItem: {
    backgroundColor: '#f0f8ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 6,
    marginBottom: 6,
  },
  detailSubjectText: {
    fontSize: 12,
    color: '#007AFF',
  },
  detailDisponibilities: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  detailDisponibilityItem: {
    flexDirection: 'row',
    marginRight: 12,
    marginBottom: 6,
  },
  detailDisponibilityDay: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
    marginRight: 4,
  },
  detailDisponibilityHours: {
    fontSize: 12,
    color: '#666',
  },
  detailBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  detailBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 6,
  },
  detailBadgeText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 4,
  },
  evaluationItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  evaluationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  evaluationAuthor: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  evaluationRating: {
    flexDirection: 'row',
  },
  evaluationComment: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },
  evaluationDate: {
    fontSize: 12,
    color: '#999',
  },
  detailActions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  detailActionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
    alignItems: 'center',
  },
  detailActionText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  detailPrimaryButton: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  detailPrimaryText: {
    color: '#fff',
  },
  
  // États de chargement
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#ccc',
  },
});

export default FindTutorScreen;
