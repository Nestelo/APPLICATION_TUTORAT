import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import Header from '../../components/ui/Header';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { 
  getRessourceGroupeDetail,
  telechargerRessourceGroupe,
  noterRessource,
  toggleFavori,
} from '../../api/ressourceService';
import { useAuth } from '../../context/AuthContext';

const GroupeRessourceDetailScreen = ({ navigation, route }) => {
  const { user } = useAuth(); // Ajouter l'accès au contexte d'authentification
  const { resourceId, groupeId } = route.params || {};
  const [ressource, setRessource] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [userNote, setUserNote] = useState(null);
  const [isFavori, setIsFavori] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      if (!resourceId || !groupeId) {
        Alert.alert('Erreur', 'ID de ressource ou de groupe manquant');
        return;
      }

      const data = await getRessourceGroupeDetail(groupeId, resourceId);
      setRessource(data);
      setIsFavori(Boolean(data?.est_favori));
      setUserNote(data?.user_note);
      
      // Enregistrer la consultation de la ressource de groupe
      await vueRessource(resourceId, data?.titre || 'Ressource de groupe sans titre', 'groupe', user?.id);
    } catch (error) {
      console.error('Erreur chargement ressource:', error);
      Alert.alert('Erreur', 'Impossible de charger les détails de la ressource');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!ressource) return;

    try {
      setDownloading(true);
      
      // Incrémenter le compteur de téléchargements
      await telechargerRessourceGroupe(ressource.id, ressource.titre, user?.id);
      
      if (ressource.type === 'lien' && ressource.lien) {
        // Pour les liens, ouvrir dans le navigateur
        Alert.alert(
          'Lien externe',
          'Cette ressource est accessible via un lien externe. Voulez-vous l\'ouvrir ?',
          [
            { text: 'Annuler', style: 'cancel' },
            { 
              text: 'Ouvrir', 
              onPress: () => {
                WebBrowser.openBrowserAsync(ressource.lien).catch(err => {
                  console.error('Erreur ouverture lien:', err);
                  Alert.alert('Erreur', 'Impossible d\'ouvrir le lien');
                });
              }
            }
          ]
        );
      } else if (ressource.fichier) {
        // Vérifier la taille du fichier (1.5GB max)
        const MAX_FILE_SIZE = 1.5 * 1024 * 1024 * 1024; // 1.5GB
        
        try {
          const fileInfo = await FileSystem.getInfoAsync(ressource.fichier);
          if (fileInfo.size && fileInfo.size > MAX_FILE_SIZE) {
            Alert.alert(
              'Fichier trop volumineux',
              'La taille du fichier dépasse la limite de 1.5GB. Veuillez contacter le support.',
              [{ text: 'OK' }]
            );
            return;
          }
        } catch (sizeError) {
          console.warn('Impossible de vérifier la taille du fichier:', sizeError);
        }
        
        // Télécharger le fichier
        const fileExtension = ressource.fichier.split('.').pop().toLowerCase();
        const fileName = `${ressource.titre?.replace(/[^a-zA-Z0-9]/g, '_') || 'fichier'}.${fileExtension}`;
        
        // Déterminer le répertoire de destination selon le type
        let destinationDir;
        let shareOptions = {};
        
        if (ressource.type === 'video') {
          // Pour les vidéos, utiliser la galerie
          destinationDir = FileSystem.cacheDirectory;
          shareOptions = {
            mimeType: `video/${fileExtension}`,
            UTI: `public.${fileExtension}`,
          };
        } else {
          // Pour les documents, utiliser le gestionnaire de fichiers
          destinationDir = FileSystem.documentDirectory + 'TutoratApp/';
          const dirInfo = await FileSystem.getInfoAsync(destinationDir);
          
          if (!dirInfo.exists) {
            await FileSystem.makeDirectoryAsync(destinationDir, { intermediates: true });
          }
          
          shareOptions = {
            mimeType: fileExtension === 'pdf' ? 'application/pdf' : 'application/octet-stream',
            UTI: fileExtension === 'pdf' ? 'public.pdf' : 'public.data',
          };
        }
        
        const downloadUri = `${destinationDir}${fileName}`;
        
        const downloadResumable = FileSystem.createDownloadResumable(
          ressource.fichier,
          downloadUri,
          {},
          (downloadProgress) => {
            const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
            console.log(`Téléchargement ${ressource.titre}: ${Math.round(progress * 100)}%`);
          }
        );
        
        const result = await downloadResumable.downloadAsync();
        
        if (result.status === 200) {
          console.log('Fichier téléchargé avec succès:', result.uri);
          
          if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(result.uri, {
              ...shareOptions,
              dialogTitle: `Enregistrer ${ressource.titre || 'fichier'}`,
            });
          } else {
            Alert.alert(
              'Succès', 
              `${ressource.type === 'video' ? 'Vidéo' : 'Fichier'} téléchargé avec succès!`
            );
          }
        } else {
          throw new Error(`Échec du téléchargement (status: ${result.status})`);
        }
      } else {
        Alert.alert('Erreur', 'Aucun fichier disponible pour cette ressource');
      }
      
    } catch (error) {
      console.error('Erreur téléchargement:', error);
      Alert.alert('Erreur', 'Impossible de télécharger la ressource');
    } finally {
      setDownloading(false);
    }
  };

  const handleRate = async (note) => {
    try {
      await noterRessource(ressource.id, note);
      setUserNote(note);
      Alert.alert('Merci !', 'Votre note a été enregistrée');
    } catch (error) {
      console.error('Erreur notation:', error);
      Alert.alert('Erreur', 'Impossible de noter la ressource');
    }
  };

  const handleToggleFavori = async () => {
    try {
      await toggleFavori(ressource.id);
      setIsFavori(!isFavori);
      Alert.alert(
        'Succès',
        !isFavori ? 'Ajouté aux favoris' : 'Retiré des favoris'
      );
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

  const renderStars = () => {
    return (
      <View style={styles.ratingContainer}>
        <Text style={styles.ratingText}>
          {userNote ? `Votre note: ${userNote}` : 'Pas encore noté'}
        </Text>
        <View style={styles.starsContainer}>
          {[1, 2, 3, 4, 5].map(star => (
            <TouchableOpacity
              key={star}
              onPress={() => handleRate(star)}
              style={styles.starButton}
            >
              <Ionicons
                name={star <= (userNote || 0) ? 'star' : 'star-outline'}
                size={20}
                color={star <= (userNote || 0) ? '#ffc107' : '#ddd'}
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <>
        <Header title="Détails de la ressource" showBack onBackPress={() => navigation.goBack()} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Chargement des détails...</Text>
        </View>
      </>
    );
  }

  if (!ressource) {
    return (
      <>
        <Header title="Ressource introuvable" showBack onBackPress={() => navigation.goBack()} />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={60} color="#dc3545" />
          <Text style={styles.errorText}>Cette ressource n'existe pas ou a été supprimée.</Text>
          <Button 
            title="Retour" 
            onPress={() => navigation.goBack()} 
            variant="secondary"
          />
        </View>
      </>
    );
  }

  return (
    <>
      <Header 
        title={ressource.titre || 'Détails de la ressource'} 
        showBack 
        onBackPress={() => navigation.goBack()} 
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <Card style={styles.mainCard}>
          {/* En-tête */}
          <View style={styles.header}>
            <View style={styles.typeIcon}>
              <Ionicons 
                name={getTypeIcon(ressource.type)} 
                size={24} 
                color="#fff" 
              />
            </View>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>{ressource.titre || 'Titre non disponible'}</Text>
              <Text style={styles.type}>{ressource.type?.toUpperCase()}</Text>
            </View>
            <TouchableOpacity
              style={styles.favoriButton}
              onPress={handleToggleFavori}
            >
              <Ionicons
                name={isFavori ? 'heart' : 'heart-outline'}
                size={24}
                color={isFavori ? '#dc3545' : '#666'}
              />
            </TouchableOpacity>
          </View>

          {/* Description */}
          {ressource.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.description}>{ressource.description}</Text>
            </View>
          )}

          {/* Informations */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informations</Text>
            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Ionicons name="person-outline" size={16} color="#666" />
                <Text style={styles.infoText}>
                  Par {ressource.auteur_details?.prenom || 'Auteur'} {ressource.auteur_details?.nom || ''}
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Ionicons name="calendar-outline" size={16} color="#666" />
                <Text style={styles.infoText}>
                  {ressource.date_creation ? 
                    new Date(ressource.date_creation).toLocaleDateString('fr-FR') : 
                    'Date non disponible'
                  }
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Ionicons name="eye-outline" size={16} color="#666" />
                <Text style={styles.infoText}>{ressource.nb_vues || 0} vues</Text>
              </View>
              <View style={styles.infoItem}>
                <Ionicons name="download-outline" size={16} color="#666" />
                <Text style={styles.infoText}>{ressource.nb_telechargements || 0} téléchargements</Text>
              </View>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={[styles.actionButton, styles.downloadButton]}
              onPress={handleDownload}
              disabled={downloading}
            >
              {downloading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="download-outline" size={20} color="#fff" />
                  <Text style={styles.actionButtonText}>
                    {ressource.type === 'lien' ? 'Ouvrir le lien' : 'Télécharger'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Notation */}
          {renderStars()}
        </Card>
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  contentContainer: {
    padding: 16,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    marginBottom: 24,
  },
  mainCard: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  typeIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  type: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  favoriButton: {
    padding: 8,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: '#555',
  },
  infoGrid: {
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
  },
  actionsContainer: {
    marginTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
  },
  downloadButton: {
    backgroundColor: '#007AFF',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  ratingText: {
    fontSize: 14,
    color: '#666',
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  starButton: {
    padding: 4,
  },
});

export default GroupeRessourceDetailScreen;
