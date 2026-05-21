import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  RefreshControl,
  TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../api/axiosConfig';

const ValidationRessourcesGroupeScreen = ({ navigation }) => {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredResources, setFilteredResources] = useState([]);

  useEffect(() => {
    fetchResources();
  }, []);

  useEffect(() => {
    // Filtrer les ressources en fonction de la recherche
    if (searchQuery.trim() === '') {
      setFilteredResources(resources);
    } else {
      const filtered = resources.filter(resource =>
        (resource.titre && resource.titre.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (resource.description && resource.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (resource.matiere && resource.matiere.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (resource.createur_nom && resource.createur_nom.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (resource.auteur_details?.prenom && resource.auteur_details.prenom.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (resource.auteur_details?.nom && resource.auteur_details.nom.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredResources(filtered);
    }
  }, [searchQuery, resources]);

  const fetchResources = async () => {
    try {
      const response = await api.get('/ressources/admin/groupes/ressources/en-attente/');
      setResources(response.data.results || []);
      setFilteredResources(response.data.results || []);
    } catch (error) {
      console.error('Erreur lors de la récupération des ressources:', error);
      Alert.alert('Erreur', 'Impossible de charger les ressources en attente');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchResources();
  };

  const handleValidate = async (resourceId, resourceTitle) => {
    Alert.alert(
      'Validation',
      `Voulez-vous valider la ressource "${resourceTitle}" ?`,
      [
        {
          text: 'Annuler',
          style: 'cancel'
        },
        {
          text: 'Valider',
          onPress: async () => {
            try {
              await api.post(`/ressources/admin/groupes/ressources/${resourceId}/valider/`);
              Alert.alert('Succès', 'Ressource validée avec succès');
              fetchResources();
            } catch (error) {
              console.error('Erreur lors de la validation:', error);
              Alert.alert('Erreur', 'Impossible de valider cette ressource');
            }
          }
        }
      ]
    );
  };

  const handleReject = async (resourceId, resourceTitle) => {
    Alert.alert(
      'Rejet',
      `Voulez-vous rejeter la ressource "${resourceTitle}" ?\n\nLa ressource sera supprimée définitivement.`,
      [
        {
          text: 'Annuler',
          style: 'cancel'
        },
        {
          text: 'Rejeter',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.post(`/ressources/admin/groupes/ressources/${resourceId}/rejeter/`);
              Alert.alert('Succès', 'Ressource rejetée et supprimée');
              fetchResources();
            } catch (error) {
              console.error('Erreur lors du rejet:', error);
              Alert.alert('Erreur', 'Impossible de rejeter cette ressource');
            }
          }
        }
      ]
    );
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'cours': return 'book';
      case 'exercice': return 'create';
      case 'video': return 'videocam';
      case 'document': return 'document';
      case 'quiz': return 'help-circle';
      case 'lien': return 'link';
      default: return 'attach';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderResource = (resource) => (
    <View key={resource.id} style={styles.resourceCard}>
      <View style={styles.resourceHeader}>
        <View style={styles.resourceInfo}>
          <View style={styles.resourceTitleRow}>
            <Ionicons name={getTypeIcon(resource.type)} size={20} color="#007AFF" />
            <Text style={styles.resourceTitle} numberOfLines={2}>
              {resource.titre}
            </Text>
          </View>
          <Text style={styles.resourceMeta}>
            Par {resource.createur_nom} · {formatDate(resource.date_creation)}
          </Text>
        </View>
      </View>

      <Text style={styles.resourceDescription} numberOfLines={3}>
        {resource.description}
      </Text>

      <View style={styles.resourceDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Matière:</Text>
          <Text style={styles.detailValue}>{resource.matiere}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Niveau:</Text>
          <Text style={styles.detailValue}>{resource.niveau || 'Non spécifié'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Type:</Text>
          <Text style={styles.detailValue}>{resource.type}</Text>
        </View>
        {resource.groupes_partages && resource.groupes_partages.length > 0 && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Groupes:</Text>
            <Text style={styles.detailValue}>
              {resource.groupes_partages.map(g => g.nom).join(', ')}
            </Text>
          </View>
        )}
      </View>

      {resource.tags && (
        <View style={styles.tagsContainer}>
          {resource.tags.split(',').map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>{tag.trim()}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.rejectButton]}
          onPress={() => handleReject(resource.id, resource.titre)}
        >
          <Ionicons name="close-circle" size={20} color="#fff" />
          <Text style={styles.actionButtonText}>Rejeter</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.validateButton]}
          onPress={() => handleValidate(resource.id, resource.titre)}
        >
          <Ionicons name="checkmark-circle" size={20} color="#fff" />
          <Text style={styles.actionButtonText}>Valider</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Chargement des ressources...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Validation des ressources</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher une ressource..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{filteredResources.length}</Text>
          <Text style={styles.statLabel}>En attente</Text>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredResources.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="checkmark-circle" size={60} color="#34C759" />
            <Text style={styles.emptyTitle}>Aucune ressource en attente</Text>
            <Text style={styles.emptyText}>
              {searchQuery.trim() !== '' 
                ? 'Aucune ressource ne correspond à votre recherche'
                : 'Toutes les ressources ont été traitées'
              }
            </Text>
          </View>
        ) : (
          filteredResources.map(renderResource)
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  backButton: {
    padding: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 20,
    paddingHorizontal: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 20,
  },
  statItem: {
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  resourceCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resourceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  resourceInfo: {
    flex: 1,
  },
  resourceTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  resourceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginLeft: 8,
    flex: 1,
  },
  resourceMeta: {
    fontSize: 12,
    color: '#666',
    marginLeft: 28,
  },
  resourceDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  resourceDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 12,
    color: '#666',
    width: 80,
  },
  detailValue: {
    fontSize: 12,
    color: '#2c3e50',
    flex: 1,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  tag: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 11,
    color: '#1976d2',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 100,
  },
  rejectButton: {
    backgroundColor: '#FF3B30',
  },
  validateButton: {
    backgroundColor: '#34C759',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2c3e50',
    marginTop: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
    paddingHorizontal: 40,
  },
});

export default ValidationRessourcesGroupeScreen;
