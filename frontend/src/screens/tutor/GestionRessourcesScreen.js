import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import Header from '../../components/ui/Header';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { getRessources } from '../../api/ressourceService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const GestionRessourcesScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [resources, setResources] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState('toutes');

  const [filters] = useState([
    { id: 'toutes', label: 'Toutes', icon: 'list-outline' },
    { id: 'en_attente', label: 'En attente', icon: 'time-outline' },
    { id: 'publie', label: 'Validées', icon: 'checkmark-circle-outline' },
    { id: 'rejete', label: 'Rejetées', icon: 'close-circle-outline' }
  ]);

  useEffect(() => {
    loadResources();
  }, [selectedFilter]);

  const loadResources = async () => {
    try {
      setLoading(true);
      
      let params = {};
      if (selectedFilter !== 'toutes') {
        params.statut = selectedFilter;
      }
      
      const data = await getRessources(params);
      setResources(data);
    } catch (error) {
      console.error('Erreur chargement ressources:', error);
      Alert.alert('Erreur', 'Impossible de charger vos ressources');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadResources();
    setRefreshing(false);
  };

  const handleEdit = (resource) => {
    navigation.navigate('EditRessource', { resourceId: resource.id });
  };

  const handleDelete = (resource) => {
    Alert.alert(
      'Supprimer la ressource',
      `Voulez-vous vraiment supprimer "${resource.titre}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('accessToken');
              const response = await fetch(`${API_BASE_URL}/api/ressources/ressources/${resource.id}/`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
              });

              if (response.ok) {
                Alert.alert('Succès', 'Ressource supprimée avec succès');
                loadResources();
              } else {
                Alert.alert('Erreur', 'Impossible de supprimer la ressource');
              }
            } catch (error) {
              console.error('Erreur suppression ressource:', error);
              Alert.alert('Erreur', 'Une erreur est survenue');
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status) => {
    const colors = {
      en_attente: '#ffc107',
      publie: '#28a745',
      rejete: '#dc3545'
    };
    return colors[status] || '#666';
  };

  const getStatusText = (status) => {
    const texts = {
      en_attente: 'En attente',
      publie: 'Validée',
      rejete: 'Rejetée'
    };
    return texts[status] || 'Inconnue';
  };

  const getTypeIcon = (type) => {
    const icons = {
      cours: 'book-outline',
      pdf: 'document-text-outline',
      video: 'videocam-outline',
      exercice: 'create-outline',
      corrige: 'checkmark-done-outline'
    };
    return icons[type] || 'document-outline';
  };

  const getTypeColor = (type) => {
    const colors = {
      cours: '#007AFF',
      pdf: '#dc3545',
      video: '#28a745',
      exercice: '#ffc107',
      corrige: '#6f42c1'
    };
    return colors[type] || '#666';
  };

  const filteredResources = Array.isArray(resources) ? resources.filter(resource => 
    resource.titre?.toLowerCase().includes('') ||
    resource.description?.toLowerCase().includes('') ||
    resource.matiere?.toLowerCase().includes('')
  ) : [];

  const renderResourceItem = (resource) => (
    <Card key={resource.id} style={styles.resourceCard}>
      <View style={styles.resourceHeader}>
        <View style={styles.resourceInfo}>
          <View style={[styles.typeIcon, { backgroundColor: getTypeColor(resource.type_fichier || resource.type) }]}>
            <Ionicons name={getTypeIcon(resource.type_fichier || resource.type)} size={20} color="#fff" />
          </View>
          <View style={styles.resourceDetails}>
            <Text style={styles.resourceTitle}>{resource.titre}</Text>
            <Text style={styles.resourceMeta}>
              {resource.type_fichier || resource.type} • {resource.matiere} • {resource.niveau}
            </Text>
            <Text style={styles.resourceTutor}>
              Par {resource.auteur_details?.prenom} {resource.auteur_details?.nom} • {new Date(resource.date_creation).toLocaleDateString('fr-FR')}
            </Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(resource.statut) }]}>
          <Text style={styles.statusText}>{getStatusText(resource.statut)}</Text>
        </View>
      </View>
      
      <Text style={styles.resourceDescription} numberOfLines={3}>
        {resource.description}
      </Text>
      
      <View style={styles.resourceStats}>
        <View style={styles.statItem}>
          <Ionicons name="download-outline" size={16} color="#666" />
          <Text style={styles.statText}>{resource.nb_telechargements || 0}</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="eye-outline" size={16} color="#666" />
          <Text style={styles.statText}>{resource.nb_vues || 0}</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="star" size={16} color="#ffc107" />
          <Text style={styles.statText}>{resource.note_moyenne?.toFixed(1) || 'N/A'}</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="time-outline" size={16} color="#666" />
          <Text style={styles.statText}>
            {new Date(resource.date_creation).toLocaleDateString('fr-FR')}
          </Text>
        </View>
      </View>
      
      <View style={styles.resourceActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.viewButton]}
          onPress={() => navigation.navigate('RessourceDetail', { resourceId: resource.id })}
        >
          <Ionicons name="open-outline" size={16} color="#666" />
          <Text style={styles.actionText}>Voir</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => handleEdit(resource)}
        >
          <Ionicons name="create-outline" size={16} color="#007AFF" />
          <Text style={[styles.actionText, styles.editText]}>Modifier</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDelete(resource)}
        >
          <Ionicons name="trash-outline" size={16} color="#dc3545" />
          <Text style={[styles.actionText, styles.deleteText]}>Supprimer</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );

  if (loading) {
    return (
      <>
        <Header title="Mes ressources" showBack onBackPress={() => navigation.goBack()} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Chargement de vos ressources...</Text>
        </View>
      </>
    );
  }

  return (
    <>
      <Header title="Mes ressources" showBack onBackPress={() => navigation.goBack()} />
      <ScrollView 
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
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
                ]}>{filter.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        
        {filteredResources.length === 0 ? (
          <Card style={styles.emptyCard}>
            <View style={styles.emptyContainer}>
              <Ionicons name="folder-open-outline" size={60} color="#ccc" />
              <Text style={styles.emptyTitle}>Aucune ressource</Text>
              <Text style={styles.emptyText}>
                {selectedFilter === 'toutes' 
                  ? 'Commencez par ajouter votre première ressource !'
                  : `Aucune ressource ${selectedFilter === 'en_attente' ? 'en attente' : selectedFilter === 'publie' ? 'validée' : 'rejetée'}`
                }
              </Text>
              <Button 
                title="Ajouter une ressource" 
                onPress={() => navigation.navigate('AjoutRessource')}
                style={styles.addButton}
              />
            </View>
          </Card>
        ) : (
          filteredResources.map(renderResourceItem)
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
  filterContainer: {
    marginBottom: 16,
  },
  filterScroll: {
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
  resourceTutor: {
    fontSize: 11,
    color: '#999',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '500',
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
  resourceActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    flex: 1,
    marginHorizontal: 4,
    justifyContent: 'center',
  },
  viewButton: {
    backgroundColor: '#f0f0f0',
  },
  editButton: {
    backgroundColor: '#e3f2fd',
  },
  deleteButton: {
    backgroundColor: '#ffebee',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  editText: {
    color: '#007AFF',
  },
  deleteText: {
    color: '#dc3545',
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
    marginBottom: 20,
  },
  addButton: {
    marginTop: 8,
  },
});

export default GestionRessourcesScreen;
