import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import * as WebBrowser from 'expo-web-browser';
import Header from '../../components/ui/Header';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { getRessourcesGroupe, telechargerRessourceGroupe, noterRessource, toggleFavori } from '../../api/ressourceService';

const { width } = Dimensions.get('window');

const GroupeRessourcesScreen = ({ navigation, route }) => {
  const { groupeId, groupeNom } = route.params;
  
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [resources, setResources] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState('toutes');
  const [downloading, setDownloading] = useState({});
  const [rating, setRating] = useState({});

  const filters = [
    { id: 'toutes', label: 'Toutes', icon: 'list-outline' },
    { id: 'cours', label: 'Cours', icon: 'book-outline' },
    { id: 'exercice', label: 'Exercices', icon: 'create-outline' },
    { id: 'video', label: 'Vidéos', icon: 'videocam-outline' },
    { id: 'pdf', label: 'PDF', icon: 'document-text-outline' },
    { id: 'corrige', label: 'Corrigés', icon: 'checkmark-done-outline' },
    { id: 'lien', label: 'Liens', icon: 'link-outline' },
  ];

  useEffect(() => {
    loadResources();
  }, [selectedFilter]);

  const loadResources = async () => {
    try {
      setLoading(true);
      console.log(`Chargement ressources pour le groupe ${groupeId}...`);
      
      let params = {};
      if (selectedFilter !== 'toutes') {
        params.type = selectedFilter;
      }
      
      const data = await getRessourcesGroupe(groupeId, params);
      console.log(`Ressources reçues: ${Array.isArray(data) ? data.length : 0} ressources`);
      setResources(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erreur chargement ressources:', error);
      Alert.alert('Erreur', 'Impossible de charger les ressources du groupe');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadResources();
    setRefreshing(false);
  };

  // ==================== FONCTION TÉLÉCHARGEMENT AMÉLIORÉE (sauvegarde automatique) ====================
  const handleDownload = async (resource) => {
    try {
      if (!resource || !resource.id) {
        console.error('Ressource invalide:', resource);
        Alert.alert('Erreur', 'Ressource invalide');
        return;
      }

      setDownloading(prev => ({ ...prev, [resource.id]: true }));
      
      // Incrémenter le compteur de téléchargements
      await telechargerRessourceGroupe(resource.id, resource.titre);
      
      if (resource.type === 'lien' && resource.lien) {
        // Pour les liens, ouvrir dans le navigateur
        Alert.alert(
          'Lien externe',
          'Cette ressource est accessible via un lien externe. Voulez-vous l\'ouvrir ?',
          [
            { text: 'Annuler', style: 'cancel' },
            { 
              text: 'Ouvrir', 
              onPress: () => WebBrowser.openBrowserAsync(resource.lien)
            }
          ]
        );
      } else if (resource.fichier) {
        // Nettoyer le nom du fichier
        const fileExtension = resource.fichier.split('.').pop().toLowerCase();
        const fileName = `${resource.titre.replace(/[^a-zA-Z0-9]/g, '_')}.${fileExtension}`;
        
        // Télécharger dans le cache d'abord
        const cacheUri = FileSystem.cacheDirectory + fileName;
        const downloadResult = await FileSystem.downloadAsync(resource.fichier, cacheUri);
        
        if (downloadResult.status === 200) {
          // Déterminer le type de fichier et sauvegarder au bon endroit
          const mediaTypes = ['jpg', 'jpeg', 'png', 'gif', 'mp4', 'mov', 'avi', 'mp3', 'wav'];
          
          if (mediaTypes.includes(fileExtension)) {
            // Pour les médias (images, vidéos, audio), sauvegarder dans la galerie
            const { status } = await MediaLibrary.requestPermissionsAsync();
            if (status === 'granted') {
              const asset = await MediaLibrary.createAssetAsync(cacheUri);
              Alert.alert('Succès', `Fichier "${resource.titre}" sauvegardé dans la galerie !`);
            } else {
              throw new Error('Permission galerie refusée');
            }
          } else {
            // Pour les documents (PDF, DOC, etc.), sauvegarder dans Documents
            const documentsDir = FileSystem.documentDirectory + 'TutoratApp/';
            const dirInfo = await FileSystem.getInfoAsync(documentsDir);
            
            if (!dirInfo.exists) {
              await FileSystem.makeDirectoryAsync(documentsDir, { intermediates: true });
            }
            
            const finalUri = documentsDir + fileName;
            await FileSystem.moveAsync({
              from: cacheUri,
              to: finalUri
            });
            
            Alert.alert(
              'Succès',
              `Fichier "${resource.titre}" téléchargé dans Documents/TutoratApp !`,
              [
                { text: 'OK' },
                { 
                  text: 'Ouvrir', 
                  onPress: () => Sharing.shareAsync(finalUri, {
                    mimeType: fileExtension === 'pdf' ? 'application/pdf' : 'application/octet-stream',
                    dialogTitle: `Ouvrir ${resource.titre}`
                  })
                }
              ]
            );
          }
          
          // Rafraîchir la liste pour mettre à jour les compteurs
          await loadResources();
        } else {
          throw new Error(`Échec du téléchargement (status: ${downloadResult.status})`);
        }
      } else {
        Alert.alert('Erreur', 'Aucun fichier disponible pour cette ressource');
      }
    } catch (error) {
      console.error('Erreur téléchargement:', error);
      Alert.alert('Erreur', 'Impossible de télécharger la ressource');
    } finally {
      setDownloading(prev => ({ ...prev, [resource.id]: false }));
    }
  };
  // ========================================================================

  const handleRate = async (resource, note) => {
    try {
      await noterRessource(resource.id, note);
      setRating(prev => ({ ...prev, [resource.id]: note }));
      setResources(prev => {
        const prevArray = Array.isArray(prev) ? prev : [];
        return prevArray.map(r => 
          r.id === resource.id 
            ? { ...r, note_moyenne: note, user_note: note }
            : r
        );
      });
      Alert.alert('Merci !', 'Votre note a été enregistrée');
    } catch (error) {
      console.error('Erreur notation:', error);
      Alert.alert('Erreur', 'Impossible de noter la ressource');
    }
  };

  const handleToggleFavori = async (resource) => {
    try {
      await toggleFavori(resource.id);
      setResources(prev => {
        const prevArray = Array.isArray(prev) ? prev : [];
        return prevArray.map(r => 
          r.id === resource.id 
            ? { ...r, est_favori: !r.est_favori }
            : r
        );
      });
      Alert.alert('Succès', resource.est_favori ? 'Retiré des favoris' : 'Ajouté aux favoris');
    } catch (error) {
      console.error('Erreur favori:', error);
      Alert.alert('Erreur', 'Impossible de modifier les favoris');
    }
  };

  const getTypeIcon = (type) => {
    const icons = {
      cours: 'book-outline',
      pdf: 'document-text-outline',
      video: 'videocam-outline',
      exercice: 'create-outline',
      corrige: 'checkmark-done-outline',
      lien: 'link-outline'
    };
    return icons[type] || 'document-outline';
  };

  const getTypeColor = (type) => {
    const colors = {
      cours: '#007AFF',
      pdf: '#dc3545',
      video: '#28a745',
      exercice: '#ffc107',
      corrige: '#6f42c1',
      lien: '#17a2b8'
    };
    return colors[type] || '#666';
  };

  const renderStars = (resource) => {
    const userRating = rating[resource.id] || resource.user_note;
    const avgRating = resource.note_moyenne || 0;
    
    return (
      <View style={styles.ratingContainer}>
        <Text style={styles.ratingText}>
          {avgRating > 0 ? avgRating.toFixed(1) : 'N/A'}
        </Text>
        <View style={styles.starsContainer}>
          {[1, 2, 3, 4, 5].map(star => (
            <TouchableOpacity
              key={star}
              onPress={() => handleRate(resource, star)}
              style={styles.starButton}
            >
              <Ionicons
                name={star <= (userRating || 0) ? 'star' : 'star-outline'}
                size={16}
                color={star <= (userRating || 0) ? '#ffc107' : '#ddd'}
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderResourceItem = (resource) => {
    if (!resource || !resource.id) return null;

    return (
      <Card key={resource.id} style={styles.resourceCard}>
        <View style={styles.resourceHeader}>
          <View style={styles.resourceInfo}>
            <View style={[styles.typeIcon, { backgroundColor: getTypeColor(resource.type || resource.type_fichier) }]}>
              <Ionicons name={getTypeIcon(resource.type || resource.type_fichier)} size={20} color="#fff" />
            </View>
            <View style={styles.resourceDetails}>
              <Text style={styles.resourceTitle}>{resource.titre || 'Titre non disponible'}</Text>
              <Text style={styles.resourceMeta}>
                {resource.type || resource.type_fichier} - {resource.matiere || 'Matière non spécifiée'}
              </Text>
              <Text style={styles.resourceAuthor}>
                Par {resource.auteur_details?.prenom || 'Auteur'} {resource.auteur_details?.nom || ''}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.favoriButton}
            onPress={() => handleToggleFavori(resource)}
          >
            <Ionicons
              name={resource.est_favori ? 'heart' : 'heart-outline'}
              size={20}
              color={resource.est_favori ? '#dc3545' : '#666'}
            />
          </TouchableOpacity>
        </View>
      
        <Text style={styles.resourceDescription} numberOfLines={3}>
          {resource.description}
        </Text>
      
        <View style={styles.resourceStats}>
          <View style={styles.statItem}>
            <Ionicons name="eye-outline" size={16} color="#666" />
            <Text style={styles.statText}>{resource.nb_vues || 0}</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="download-outline" size={16} color="#666" />
            <Text style={styles.statText}>{resource.nb_telechargements || 0}</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="time-outline" size={16} color="#666" />
            <Text style={styles.statText}>
              {resource.date_creation ? 
                new Date(resource.date_creation).toLocaleDateString('fr-FR') : 
                'Date non disponible'
              }
            </Text>
          </View>
        </View>
      
        {renderStars(resource)}
      
        <View style={styles.resourceActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.downloadButton]}
            onPress={() => handleDownload(resource)}
            disabled={downloading[resource.id]}
          >
            {downloading[resource.id] ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="download-outline" size={16} color="#fff" />
                <Text style={styles.actionButtonText}>Télécharger</Text>
              </>
            )}
          </TouchableOpacity>
        
          <TouchableOpacity
            style={[styles.actionButton, styles.viewButton]}
            onPress={() => navigation.navigate('GroupeRessourceDetail', { 
              resourceId: resource.id,
              groupeId: groupeId
            })}
          >
            <Ionicons name="open-outline" size={16} color="#666" />
            <Text style={[styles.actionButtonText, styles.viewButtonText]}>Voir</Text>
          </TouchableOpacity>
        </View>
      </Card>
    );
  };

  if (loading) {
    return (
      <>
        <Header title={`Ressources - ${groupeNom}`} showBack onBackPress={() => navigation.goBack()} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Chargement des ressources...</Text>
        </View>
      </>
    );
  }

  return (
    <>
      <Header title={`Ressources - ${groupeNom}`} showBack onBackPress={() => navigation.goBack()} />
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Filtres */}
        <View style={styles.filtersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {filters.map(filter => (
              <TouchableOpacity
                key={filter.id}
                style={[
                  styles.filterButton,
                  selectedFilter === filter.id && styles.filterButtonSelected
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

        {/* Liste des ressources */}
        {resources.length === 0 ? (
          <Card style={styles.emptyCard}>
            <View style={styles.emptyContainer}>
              <Ionicons name="folder-open-outline" size={60} color="#ccc" />
              <Text style={styles.emptyTitle}>Aucune ressource</Text>
              <Text style={styles.emptyText}>
                {selectedFilter === 'toutes'
                  ? 'Ce groupe n\'a aucune ressource pour le moment.'
                  : `Aucune ressource de type ${selectedFilter} dans ce groupe.`
                }
              </Text>
            </View>
          </Card>
        ) : (
          <View style={styles.resourcesList}>
            {resources.filter(resource => resource && resource.id).map(renderResourceItem)}
          </View>
        )}
      </ScrollView>
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
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  filtersContainer: {
    padding: 16,
    paddingBottom: 8,
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
  filterButtonSelected: {
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
  resourcesList: {
    padding: 16,
    paddingTop: 8,
  },
  resourceCard: {
    marginBottom: 16,
  },
  resourceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  resourceInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  resourceDetails: {
    flex: 1,
  },
  resourceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  resourceMeta: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  resourceAuthor: {
    fontSize: 11,
    color: '#999',
  },
  favoriButton: {
    padding: 8,
  },
  resourceDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  resourceStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: '#666',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginRight: 8,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  starButton: {
    padding: 2,
  },
  resourceActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  downloadButton: {
    backgroundColor: '#007AFF',
  },
  viewButton: {
    backgroundColor: '#f0f0f0',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
  },
  viewButtonText: {
    color: '#666',
  },
  emptyCard: {
    alignItems: 'center',
    padding: 40,
    margin: 16,
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
});

export default GroupeRessourcesScreen;