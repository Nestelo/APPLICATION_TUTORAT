import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import Header from '../../components/ui/Header';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { API_BASE_URL } from '../../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const AdminValidationRessourcesScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [resources, setResources] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState('en_attente');

  const [filters] = useState([
    { id: 'en_attente', label: 'En attente', icon: 'time-outline' },
    { id: 'validees', label: 'Validées', icon: 'checkmark-circle-outline' },
    { id: 'rejetees', label: 'Rejetées', icon: 'close-circle-outline' },
    { id: 'toutes', label: 'Toutes', icon: 'list-outline' }
  ]);

  useEffect(() => {
    loadResources();
  }, [selectedFilter]);

  const loadResources = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('accessToken');
      
      let url = `${API_BASE_URL}/api/ressources/ressources/`;
      
      // Le backend utilise "statut" : en_attente | publie | rejete
      if (selectedFilter !== 'toutes') {
        const filterMap = {
          'en_attente': 'en_attente',
          'validees': 'publie',
          'rejetees': 'rejete',
        };
        url += `?statut=${filterMap[selectedFilter]}`;
      }
      
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setResources(data);
      }
    } catch (error) {
      console.error('Erreur chargement ressources:', error);
      Alert.alert('Erreur', 'Impossible de charger les ressources');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadResources();
    setRefreshing(false);
  };

  const handleValidate = async (resource) => {
    Alert.alert(
      'Valider la ressource',
      `Voulez-vous vraiment valider "${resource.titre}" ?\n\nCette ressource sera visible par tous les étudiants.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Valider',
          style: 'default',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('accessToken');
              const response = await fetch(`${API_BASE_URL}/api/ressources/admin/ressources/${resource.id}/valider/`, {
                method: 'POST',
                headers: { 
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({}),
              });

              if (response.ok) {
                Alert.alert(
                  'Succès',
                  'Ressource validée avec succès !\n\nLe tuteur sera notifié automatiquement.',
                  [{ text: 'OK' }]
                );
                loadResources();
              } else {
                Alert.alert('Erreur', 'Impossible de valider la ressource');
              }
            } catch (error) {
              console.error('Erreur validation ressource:', error);
              Alert.alert('Erreur', 'Impossible de valider la ressource');
            }
          }
        }
      ]
    );
  };

  const handleReject = async (resource) => {
    Alert.prompt(
      'Rejeter la ressource',
      'Veuillez indiquer le motif du rejet :',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Rejeter',
          style: 'destructive',
          onPress: async (motif) => {
            if (!motif || motif.trim() === '') {
              Alert.alert('Erreur', 'Veuillez indiquer un motif de rejet');
              return;
            }

            try {
              const token = await AsyncStorage.getItem('accessToken');
              const response = await fetch(`${API_BASE_URL}/api/ressources/admin/ressources/${resource.id}/rejeter/`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({ motif })
              });

              if (response.ok) {
                Alert.alert(
                  'Succès',
                  'Ressource rejetée avec succès !\n\nLe tuteur sera notifié avec le motif du rejet.',
                  [{ text: 'OK' }]
                );
                loadResources();
              } else {
                Alert.alert('Erreur', 'Impossible de rejeter la ressource');
              }
            } catch (error) {
              console.error('Erreur rejet ressource:', error);
              Alert.alert('Erreur', 'Impossible de rejeter la ressource');
            }
          }
        }
      ],
      'plain-text',
      null,
      null
    );
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

  const getStatusColor = (status) => {
    const colors = {
      en_attente: '#ffc107',
      publie: '#28a745',
      rejete: '#dc3545',
    };
    return colors[status] || '#666';
  };

  const getStatusText = (status) => {
    const texts = {
      en_attente: 'En attente',
      publie: 'Publiée',
      rejete: 'Rejetée',
    };
    return texts[status] || 'Inconnue';
  };

  const renderResourceItem = (resource) => (
    <Card key={resource.id} style={styles.resourceCard}>
      <View style={styles.resourceHeader}>
        <View style={styles.resourceInfo}>
          <View style={[styles.typeIcon, { backgroundColor: getTypeColor(resource.type_fichier) }]}>
            <Ionicons name={getTypeIcon(resource.type_fichier)} size={20} color="#fff" />
          </View>
          <View style={styles.resourceDetails}>
            <Text style={styles.resourceTitle}>{resource.titre}</Text>
            <Text style={styles.resourceMeta}>
              {resource.type_fichier} • {resource.matiere} • {resource.niveau}
            </Text>
            <Text style={styles.resourceTutor}>
              Par {resource.auteur_details?.prenom} {resource.auteur_details?.nom} •{' '}
              {resource.date_publication ? new Date(resource.date_publication).toLocaleDateString('fr-FR') : ''}
            </Text>
          </View>
        </View>
        <View style={styles.resourceStatus}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(resource.statut) }]}>
            <Text style={styles.statusText}>{getStatusText(resource.statut)}</Text>
          </View>
        </View>
      </View>
      
      <Text style={styles.resourceDescription} numberOfLines={3}>
        {resource.description}
      </Text>
      
      <View style={styles.resourceActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.viewButton]}
          onPress={() => navigation.navigate('RessourceDetail', { resourceId: resource.id })}
        >
          <Ionicons name="open-outline" size={16} color="#666" />
          <Text style={styles.actionText}>Voir</Text>
        </TouchableOpacity>
        
        {resource.statut === 'en_attente' && (
          <>
            <TouchableOpacity
              style={[styles.actionButton, styles.validateButton]}
              onPress={() => handleValidate(resource)}
            >
              <Ionicons name="checkmark-circle-outline" size={16} color="#28a745" />
              <Text style={[styles.actionText, styles.validateText]}>Valider</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.rejectButton]}
              onPress={() => handleReject(resource)}
            >
              <Ionicons name="close-circle-outline" size={16} color="#dc3545" />
              <Text style={[styles.actionText, styles.rejectText]}>Rejeter</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
      
        {resource.statut === 'rejete' && resource.commentaire_rejet && (
        <View style={styles.rejectionInfo}>
          <Text style={styles.rejectionTitle}>Motif du rejet :</Text>
          <Text style={styles.rejectionText}>{resource.commentaire_rejet}</Text>
        </View>
      )}
    </Card>
  );

  if (loading) {
    return (
      <>
        <Header title="Validation des ressources" showBack onBackPress={() => navigation.goBack()} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Chargement des ressources...</Text>
        </View>
      </>
    );
  }

  return (
    <>
      <Header title="Validation des ressources" showBack onBackPress={() => navigation.goBack()} />
      <ScrollView style={styles.container}>
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
        
        {resources.length === 0 ? (
          <Card style={styles.emptyCard}>
            <View style={styles.emptyContainer}>
              <Ionicons name="folder-open-outline" size={60} color="#ccc" />
              <Text style={styles.emptyTitle}>Aucune ressource</Text>
              <Text style={styles.emptyText}>
                {selectedFilter === 'en_attente' 
                  ? 'Aucune ressource en attente de validation'
                  : 'Aucune ressource dans cette catégorie'
                }
              </Text>
            </View>
          </Card>
        ) : (
          resources.map(renderResourceItem)
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
  resourceStatus: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#fff',
  },
  resourceDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
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
  validateButton: {
    backgroundColor: '#e8f5e8',
  },
  rejectButton: {
    backgroundColor: '#ffebee',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  validateText: {
    color: '#28a745',
  },
  rejectText: {
    color: '#dc3545',
  },
  rejectionInfo: {
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  rejectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#dc3545',
    marginBottom: 4,
  },
  rejectionText: {
    fontSize: 14,
    color: '#666',
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
});

export default AdminValidationRessourcesScreen;
