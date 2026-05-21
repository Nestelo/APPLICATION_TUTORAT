import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  FlatList,
  Dimensions,
  SafeAreaView,
  Image,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { API_BASE_URL } from '../../config/api';
import { vueRessource, telechargerRessource } from '../../api/ressourceService';
import { useAuth } from '../../context/AuthContext';

const { width } = Dimensions.get('window');

const GlobalResourcesScreen = ({ navigation }) => {
  const { user } = useAuth();
  
  // États principaux
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('all');
  
  // Données
  const [globalResources, setGlobalResources] = useState([]);
  const [receivedResources, setReceivedResources] = useState([]);
  const [students, setStudents] = useState([]);
  const [statistics, setStatistics] = useState({
    consulted: 0,
    downloaded: 0,
    favorites: 0
  });
  
  // Modales
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedResource, setSelectedResource] = useState(null);
  const [shareComment, setShareComment] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [userRating, setUserRating] = useState(0);

  // Permissions
  const [mediaLibraryPermission, setMediaLibraryPermission] = useState(null);

  // Initialisation
  useEffect(() => {
    requestPermissions();
    loadData();
    loadLocalStatistics();
  }, []);

  useEffect(() => {
    if (refreshing) {
      loadData();
    }
  }, [refreshing]);

  // Demander les permissions
  const requestPermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      setMediaLibraryPermission(status === 'granted');
    }
  };

  // Charger les données
  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadGlobalResources(),
        loadReceivedResources(),
        loadStudents(),
        loadStatistics()
      ]);
    } catch (error) {
      console.error('Erreur chargement données:', error);
      Alert.alert('Erreur', 'Impossible de charger les ressources');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Charger les ressources globales
  const loadGlobalResources = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}/api/ressources/ressources/?statut=publie`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setGlobalResources(data.results || data);
      } else {
        console.error('Erreur API ressources globales:', response.status);
        setGlobalResources([]);
      }
    } catch (error) {
      console.error('Erreur ressources globales:', error);
      setGlobalResources([]);
    }
  };

  // Charger les ressources reçues
  const loadReceivedResources = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}/api/ressources/partages/recus/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setReceivedResources(data.results || data);
      } else {
        console.error('Erreur ressources reçues:', response.status);
        setReceivedResources([]);
      }
    } catch (error) {
      console.error('Erreur ressources reçues:', error);
      setReceivedResources([]);
    }
  };

  // Charger les étudiants
  const loadStudents = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}/api/ressources/etudiants/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStudents(data.results || data);
      } else {
        console.error('Erreur étudiants:', response.status);
        setStudents([]);
      }
    } catch (error) {
      console.error('Erreur étudiants:', error);
      setStudents([]);
    }
  };

  // Charger les statistiques
  const loadStatistics = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}/api/ressources/statistiques/etudiant/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStatistics({
          consulted: data.ressources_consultees || 0,
          downloaded: data.ressources_telechargees || 0,
          favorites: data.favoris_count || 0
        });
      }
    } catch (error) {
      console.log('Erreur statistiques (non bloquante):', error);
      // Ne pas afficher d'alerte, utiliser les stats locales
    }
  };

  // Charger les statistiques locales
  const loadLocalStatistics = async () => {
    try {
      const stats = await AsyncStorage.getItem('globalResourcesStats');
      if (stats) {
        const parsedStats = JSON.parse(stats);
        setStatistics(prev => ({
          ...prev,
          ...parsedStats
        }));
      }
    } catch (error) {
      console.error('Erreur stats locales:', error);
    }
  };

  // Sauvegarder les statistiques locales
  const saveLocalStatistics = async (stats) => {
    try {
      await AsyncStorage.setItem('globalResourcesStats', JSON.stringify(stats));
      setStatistics(stats);
    } catch (error) {
      console.error('Erreur sauvegarde stats:', error);
    }
  };

  // Obtenir les ressources filtrées
  const getCurrentResources = () => {
    if (activeTab === 'all') {
      let resources = [...globalResources];
      
      // Filtrer par recherche
      if (searchQuery) {
        resources = resources.filter(resource => 
          resource.titre?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          resource.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          resource.matiere?.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      
      // Filtrer par type
      if (selectedType !== 'all') {
        resources = resources.filter(resource => resource.type_fichier === selectedType);
      }
      
      // Filtrer par niveau
      if (selectedLevel !== 'all') {
        resources = resources.filter(resource => resource.niveau === selectedLevel);
      }
      
      return resources;
    } else {
      return receivedResources;
    }
  };

  // Télécharger une ressource
  const downloadResource = async (resource) => {
    try {
      if (!resource.fichier) {
        Alert.alert('Erreur', 'Aucun fichier disponible pour cette ressource');
        return;
      }

      // Enregistrer le téléchargement
      await telechargerRessource(resource.id, resource.titre, user?.id);

      // Créer le dossier de destination
      const directory = FileSystem.documentDirectory + 'global_resources/';
      const dirInfo = await FileSystem.getInfoAsync(directory);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
      }

      // Nettoyer le nom du fichier
      const fileName = resource.titre
        .replace(/[^a-z0-9]/gi, '_')
        .toLowerCase() + '.' + getFileExtension(resource.fichier);
      
      const fileUri = directory + fileName;

      // Télécharger le fichier
      const downloadResult = await FileSystem.downloadAsync(resource.fichier, fileUri);

      if (downloadResult.status === 200) {
        // Double sauvegarde pour images/vidéos
        if (isImageOrVideo(resource.fichier) && mediaLibraryPermission) {
          try {
            const asset = await MediaLibrary.createAssetAsync(downloadResult.uri);
            const album = await MediaLibrary.getAlbumAsync('TutorApp');
            if (!album) {
              await MediaLibrary.createAlbumAsync('TutorApp', asset, false);
            } else {
              await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
            }
          } catch (galleryError) {
            console.error('Erreur galerie:', galleryError);
          }
        }

        // Mettre à jour les statistiques
        const newStats = { ...statistics, downloaded: statistics.downloaded + 1 };
        saveLocalStatistics(newStats);

        Alert.alert(
          'Succès',
          `Ressource "${resource.titre}" téléchargée avec succès!`,
          [
            { text: 'OK', style: 'default' },
            { 
              text: 'Partager', 
              onPress: () => Sharing.shareAsync(downloadResult.uri, {
                dialogTitle: `Partager ${resource.titre}`
              })
            }
          ]
        );
      } else {
        throw new Error('Échec du téléchargement');
      }
    } catch (error) {
      console.error('Erreur téléchargement:', error);
      Alert.alert('Erreur', 'Impossible de télécharger la ressource');
    }
  };

  // Gérer les favoris
  const toggleFavorite = async (resource) => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}/api/ressources/ressources/${resource.id}/favori/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const isFav = !resource.est_favori;
        const newStats = { 
          ...statistics, 
          favorites: isFav ? statistics.favorites + 1 : statistics.favorites - 1 
        };
        saveLocalStatistics(newStats);
        
        // Mettre à jour la ressource dans la liste
        const updatedResources = globalResources.map(r => 
          r.id === resource.id ? { ...r, est_favori: isFav } : r
        );
        setGlobalResources(updatedResources);
        
        Alert.alert('Succès', isFav ? 'Ajouté aux favoris' : 'Retiré des favoris');
      }
    } catch (error) {
      console.error('Erreur favoris:', error);
      Alert.alert('Erreur', 'Impossible de gérer les favoris');
    }
  };

  // Noter une ressource
  const rateResource = async (resource, rating) => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}/api/ressources/ressources/${resource.id}/noter/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ note: rating })
      });
      
      if (response.ok) {
        Alert.alert('Succès', 'Votre note a été enregistrée');
        // Mettre à jour la ressource localement
        const updatedResources = globalResources.map(r => 
          r.id === resource.id ? { ...r, note_utilisateur: rating } : r
        );
        setGlobalResources(updatedResources);
      }
    } catch (error) {
      console.error('Erreur notation:', error);
      Alert.alert('Erreur', 'Impossible de noter la ressource');
    }
  };

  // Partager une ressource
  const shareResource = async () => {
    if (!selectedStudent) {
      Alert.alert('Erreur', 'Veuillez sélectionner un étudiant');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}/api/ressources/partager/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ressource: selectedResource.id,
          destinataire: selectedStudent.id,
          commentaire: shareComment
        })
      });
      
      if (response.ok) {
        Alert.alert('Succès', 'Ressource partagée avec succès!');
        setShowShareModal(false);
        setShareComment('');
        setSelectedStudent(null);
        setSelectedResource(null);
      } else {
        Alert.alert('Erreur', 'Impossible de partager la ressource');
      }
    } catch (error) {
      console.error('Erreur partage:', error);
      Alert.alert('Erreur', 'Impossible de partager la ressource');
    }
  };

  // Afficher les détails d'une ressource
  const showResourceDetails = async (resource) => {
    setSelectedResource(resource);
    setUserRating(resource.note_utilisateur || 0);
    setShowDetailModal(true);
  };

  // Fonctions utilitaires
  const getFileExtension = (url) => {
    return url.split('.').pop().split('?')[0];
  };

  const isImageOrVideo = (url) => {
    const ext = getFileExtension(url).toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'mp4', 'avi', 'mov'].includes(ext);
  };

  const getResourceIcon = (type) => {
    switch (type) {
      case 'pdf': return 'document-text';
      case 'mp4':
      case 'avi':
      case 'mov': return 'videocam';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif': return 'image';
      case 'mp3': return 'musical-note';
      default: return 'document';
    }
  };

  // Rendu des cartes de ressources globales
  const renderResourceCard = ({ item }) => (
    <TouchableOpacity 
      style={styles.resourceCard}
      onPress={() => showResourceDetails(item)}
    >
      <View style={styles.resourceHeader}>
        <View style={styles.resourceIcon}>
          <Ionicons 
            name={getResourceIcon(item.type_fichier)} 
            size={24} 
            color="#007AFF" 
          />
        </View>
        <View style={styles.resourceInfo}>
          <Text style={styles.resourceTitle} numberOfLines={2}>
            {item.titre}
          </Text>
          <Text style={styles.resourceMeta}>
            {item.matiere || 'Non spécifiée'} • {item.type_fichier?.toUpperCase()}
          </Text>
          <Text style={styles.resourceAuthor}>
            Par {item.auteur_details?.prenom} {item.auteur_details?.nom}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={() => toggleFavorite(item)}
        >
          <Ionicons 
            name={item.est_favori ? 'heart' : 'heart-outline'} 
            size={20} 
            color={item.est_favori ? '#FF3B30' : '#8E8E93'} 
          />
        </TouchableOpacity>
      </View>
      
      <View style={styles.resourceStats}>
        <View style={styles.statItem}>
          <Ionicons name="eye" size={14} color="#8E8E93" />
          <Text style={styles.statText}>{item.nb_vues || 0}</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="download" size={14} color="#8E8E93" />
          <Text style={styles.statText}>{item.nb_telechargements || 0}</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="star" size={14} color="#FFD700" />
          <Text style={styles.statText}>{item.moyenne_notes?.toFixed(1) || '0.0'}</Text>
        </View>
      </View>
      
      <View style={styles.resourceActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => downloadResource(item)}
        >
          <Ionicons name="download-outline" size={18} color="#007AFF" />
          <Text style={styles.actionText}>Télécharger</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => {
            setSelectedResource(item);
            setShowShareModal(true);
          }}
        >
          <Ionicons name="share-outline" size={18} color="#34C759" />
          <Text style={styles.actionText}>Partager</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  // Rendu des cartes de ressources reçues
  const renderReceivedCard = ({ item }) => (
    <View style={styles.resourceCard}>
      <View style={styles.resourceHeader}>
        <View style={styles.resourceIcon}>
          <Ionicons 
            name={getResourceIcon(item.ressource_details?.type_fichier)} 
            size={24} 
            color="#007AFF" 
          />
        </View>
        <View style={styles.resourceInfo}>
          <Text style={styles.resourceTitle} numberOfLines={2}>
            {item.ressource_details?.titre}
          </Text>
          <Text style={styles.resourceMeta}>
            De {item.expediteur_details?.prenom} {item.expediteur_details?.nom}
          </Text>
          <Text style={styles.resourceDate}>
            {new Date(item.date_partage).toLocaleDateString('fr-FR')}
          </Text>
        </View>
        <View style={[
          styles.statusBadge,
          item.est_lue ? styles.statusRead : styles.statusUnread
        ]}>
          <Text style={styles.statusText}>
            {item.est_lue ? 'Lu' : 'Non lu'}
          </Text>
        </View>
      </View>
      
      {item.commentaire && (
        <Text style={styles.resourceComment}>Message: {item.commentaire}</Text>
      )}
      
      <View style={styles.resourceActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => downloadResource(item.ressource_details)}
        >
          <Ionicons name="download-outline" size={18} color="#007AFF" />
          <Text style={styles.actionText}>Télécharger</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const displayedResources = getCurrentResources();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>📚 Ressources Globales</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Onglets */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[
            styles.tab,
            activeTab === 'all' && styles.activeTab
          ]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'all' && styles.activeTabText
          ]}>
            Bibliothèque
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[
            styles.tab,
            activeTab === 'received' && styles.activeTab
          ]}
          onPress={() => setActiveTab('received')}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'received' && styles.activeTabText
          ]}>
            Reçues
          </Text>
          {receivedResources.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{receivedResources.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Carte de statistiques */}
      <View style={styles.statsCard}>
        <Text style={styles.statsTitle}>📊 Mes statistiques</Text>
        <View style={styles.statsRow}>
          <View style={styles.statColumn}>
            <Text style={styles.statNumber}>{statistics.consulted}</Text>
            <Text style={styles.statLabel}>Consultées</Text>
          </View>
          <View style={styles.statColumn}>
            <Text style={styles.statNumber}>{statistics.downloaded}</Text>
            <Text style={styles.statLabel}>Téléchargées</Text>
          </View>
          <View style={styles.statColumn}>
            <Text style={styles.statNumber}>{statistics.favorites}</Text>
            <Text style={styles.statLabel}>Favoris</Text>
          </View>
        </View>
      </View>

      {/* Recherche (uniquement pour l'onglet Bibliothèque) */}
      {activeTab === 'all' && (
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#8E8E93" />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher une ressource..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      )}

      {/* Filtres (uniquement pour l'onglet Bibliothèque) */}
      {activeTab === 'all' && (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.filtersContainer}
        >
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Type:</Text>
            {['all', 'pdf', 'mp4', 'jpg', 'docx'].map(type => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.filterChip,
                  selectedType === type && styles.activeFilterChip
                ]}
                onPress={() => setSelectedType(type)}
              >
                <Text style={[
                  styles.filterChipText,
                  selectedType === type && styles.activeFilterChipText
                ]}>
                  {type === 'all' ? 'Tous' : type.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Niveau:</Text>
            {['all', 'L1', 'L2', 'L3', 'Master'].map(level => (
              <TouchableOpacity
                key={level}
                style={[
                  styles.filterChip,
                  selectedLevel === level && styles.activeFilterChip
                ]}
                onPress={() => setSelectedLevel(level)}
              >
                <Text style={[
                  styles.filterChipText,
                  selectedLevel === level && styles.activeFilterChipText
                ]}>
                  {level === 'all' ? 'Tous' : level}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}

      {/* Liste des ressources */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      ) : (
        <FlatList
          data={displayedResources}
          renderItem={activeTab === 'all' ? renderResourceCard : renderReceivedCard}
          keyExtractor={(item, index) => item?.id?.toString() || index.toString()}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => setRefreshing(true)}
              colors={['#007AFF']}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="folder-open" size={60} color="#ccc" />
              <Text style={styles.emptyText}>
                {activeTab === 'all' 
                  ? 'Aucune ressource disponible' 
                  : 'Aucune ressource reçue'}
              </Text>
            </View>
          }
        />
      )}

      {/* Modal de détails */}
      <Modal
        visible={showDetailModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDetailModal(false)}
      >
        {selectedResource && (
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                <Ionicons name="close" size={24} color="#007AFF" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Détails de la ressource</Text>
              <View style={styles.modalSpacer} />
            </View>

            <ScrollView style={styles.modalContent}>
              <Text style={styles.detailTitle}>{selectedResource.titre}</Text>
              
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Informations</Text>
                <Text style={styles.detailText}>Matière: {selectedResource.matiere || 'Non spécifiée'}</Text>
                <Text style={styles.detailText}>Type: {selectedResource.type_fichier?.toUpperCase()}</Text>
                <Text style={styles.detailText}>Niveau: {selectedResource.niveau || 'Non spécifié'}</Text>
                <Text style={styles.detailText}>Auteur: {selectedResource.auteur_details?.prenom} {selectedResource.auteur_details?.nom}</Text>
                <Text style={styles.detailText}>Date: {new Date(selectedResource.date_publication).toLocaleDateString('fr-FR')}</Text>
              </View>

              {selectedResource.description && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Description</Text>
                  <Text style={styles.detailText}>{selectedResource.description}</Text>
                </View>
              )}

              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Statistiques</Text>
                <Text style={styles.detailText}>Vues: {selectedResource.nb_vues || 0}</Text>
                <Text style={styles.detailText}>Téléchargements: {selectedResource.nb_telechargements || 0}</Text>
                <Text style={styles.detailText}>Note moyenne: {selectedResource.moyenne_notes?.toFixed(1) || '0.0'}/5</Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Noter cette ressource</Text>
                <View style={styles.ratingContainer}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <TouchableOpacity
                      key={star}
                      onPress={() => {
                        setUserRating(star);
                        rateResource(selectedResource, star);
                      }}
                    >
                      <Ionicons
                        name={star <= userRating ? 'star' : 'star-outline'}
                        size={30}
                        color={star <= userRating ? '#FFD700' : '#E0E0E0'}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.modalActionButton}
                onPress={() => downloadResource(selectedResource)}
              >
                <Ionicons name="download-outline" size={20} color="#fff" />
                <Text style={styles.modalActionText}>Télécharger</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalActionButton, styles.favoriteActionButton]}
                onPress={() => toggleFavorite(selectedResource)}
              >
                <Ionicons 
                  name={selectedResource.est_favori ? 'heart' : 'heart-outline'} 
                  size={20} 
                  color="#fff" 
                />
                <Text style={styles.modalActionText}>
                  {selectedResource.est_favori ? 'Retirer' : 'Ajouter'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Modal>

      {/* Modal de partage */}
      <Modal
        visible={showShareModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowShareModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowShareModal(false)}>
              <Ionicons name="close" size={24} color="#007AFF" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Partager la ressource</Text>
            <TouchableOpacity onPress={shareResource}>
              <Text style={styles.sendButton}>Envoyer</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.shareResourceInfo}>
              <Text style={styles.shareResourceTitle}>
                {selectedResource?.titre}
              </Text>
            </View>

            <View style={styles.commentSection}>
              <Text style={styles.commentLabel}>Message personnel (optionnel)</Text>
              <TextInput
                style={styles.commentInput}
                placeholder="Ajoutez un message..."
                value={shareComment}
                onChangeText={setShareComment}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.studentsSection}>
              <Text style={styles.studentsLabel}>Sélectionner un étudiant</Text>
              <FlatList
                data={students}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.studentItem,
                      selectedStudent?.id === item.id && styles.selectedStudentItem
                    ]}
                    onPress={() => setSelectedStudent(item)}
                  >
                    <View style={styles.studentAvatar}>
                      <Ionicons name="person" size={20} color="#007AFF" />
                    </View>
                    <View style={styles.studentInfo}>
                      <Text style={styles.studentName}>
                        {item.prenom} {item.nom}
                      </Text>
                      <Text style={styles.studentEmail}>{item.email}</Text>
                    </View>
                    <Ionicons
                      name={selectedStudent?.id === item.id ? 'checkmark-circle' : 'ellipse-outline'}
                      size={20}
                      color={selectedStudent?.id === item.id ? '#34C759' : '#8E8E93'}
                    />
                  </TouchableOpacity>
                )}
                keyExtractor={(item, index) => item?.id?.toString() || index.toString()}
                ListEmptyComponent={
                  <Text style={styles.noStudentsText}>Aucun étudiant disponible</Text>
                }
              />
            </View>
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 16,
    color: '#8E8E93',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#007AFF',
  },
  badge: {
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  statsCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statColumn: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#000',
  },
  filtersContainer: {
    paddingHorizontal: 16,
    marginBottom: 12,
    flexDirection: 'row',
  },
  filterGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
    marginRight: 8,
  },
  filterChip: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  activeFilterChip: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  filterChipText: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  activeFilterChipText: {
    color: '#fff',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  resourceCard: {
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
  resourceHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  resourceIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#F0F8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  resourceInfo: {
    flex: 1,
  },
  resourceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  resourceMeta: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 2,
  },
  resourceAuthor: {
    fontSize: 12,
    color: '#8E8E93',
  },
  resourceDate: {
    fontSize: 12,
    color: '#8E8E93',
  },
  favoriteButton: {
    padding: 4,
  },
  resourceStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    marginBottom: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 12,
    color: '#8E8E93',
    marginLeft: 4,
  },
  resourceActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F8F8F8',
  },
  actionText: {
    fontSize: 14,
    color: '#007AFF',
    marginLeft: 4,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusRead: {
    backgroundColor: '#E8F5E8',
  },
  statusUnread: {
    backgroundColor: '#FFF3CD',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '500',
  },
  resourceComment: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#8E8E93',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 12,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  modalSpacer: {
    width: 40,
  },
  sendButton: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  detailTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginBottom: 20,
  },
  detailSection: {
    marginBottom: 20,
  },
  detailSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  modalActions: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    gap: 12,
  },
  modalActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#007AFF',
  },
  favoriteActionButton: {
    backgroundColor: '#FF3B30',
  },
  modalActionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  shareResourceInfo: {
    backgroundColor: '#F8F8F8',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  shareResourceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  commentSection: {
    marginBottom: 20,
  },
  commentLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  commentInput: {
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  studentsSection: {
    flex: 1,
  },
  studentsLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  studentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#F8F8F8',
  },
  selectedStudentItem: {
    backgroundColor: '#E8F5E8',
    borderWidth: 1,
    borderColor: '#34C759',
  },
  studentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  studentEmail: {
    fontSize: 14,
    color: '#8E8E93',
  },
  noStudentsText: {
    textAlign: 'center',
    color: '#8E8E93',
    fontSize: 16,
    marginTop: 20,
  },
});

export default GlobalResourcesScreen;