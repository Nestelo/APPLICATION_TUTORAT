import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, ActivityIndicator, RefreshControl, TextInput } from 'react-native';
import Header from '../../components/ui/Header';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { API_BASE_URL } from '../../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const TutorAdminCommunicationScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [communications, setCommunications] = useState([]);
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('toutes');
  const [formData, setFormData] = useState({
    sujet: '',
    message: '',
    type: 'demande',
    priorite: 'normale'
  });

  const [filters] = useState([
    { id: 'toutes', label: 'Toutes', icon: 'list-outline' },
    { id: 'envoyees', label: 'Envoyées', icon: 'send-outline' },
    { id: 'recues', label: 'Reçues', icon: 'inbox-outline' },
    { id: 'annonces', label: 'Annonces', icon: 'megaphone-outline' }
  ]);

  const [types] = useState([
    { id: 'demande', label: 'Demande', icon: 'help-circle-outline' },
    { id: 'probleme', label: 'Problème', icon: 'warning-outline' },
    { id: 'validation', label: 'Validation ressource', icon: 'checkmark-circle-outline' },
    { id: 'suggestion', label: 'Suggestion', icon: 'bulb-outline' }
  ]);

  const [priorites] = useState([
    { id: 'basse', label: 'Basse', color: '#28a745' },
    { id: 'normale', label: 'Normale', color: '#ffc107' },
    { id: 'haute', label: 'Haute', color: '#dc3545' },
    { id: 'urgente', label: 'Urgente', color: '#6f42c1' }
  ]);

  useEffect(() => {
    loadCommunications();
  }, []);

  const loadCommunications = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}/api/tutor/communications/?filter=${selectedFilter}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setCommunications(data);
      }
    } catch (error) {
      console.error('Erreur chargement communications:', error);
      Alert.alert('Erreur', 'Impossible de charger vos communications');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCommunications();
    setRefreshing(false);
  };

  const handleSubmit = async () => {
    if (!formData.sujet.trim() || !formData.message.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('accessToken');
      
      const response = await fetch(`${API_BASE_URL}/api/tutor/communications/send/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        Alert.alert('Succès', 'Votre message a été envoyé à l\'administration', [
          { text: 'OK', onPress: () => {
            setShowComposeModal(false);
            resetForm();
            loadCommunications();
          }}
        ]);
      } else {
        const error = await response.json();
        Alert.alert('Erreur', error.message || 'Impossible d\'envoyer le message');
      }
    } catch (error) {
      console.error('Erreur envoi communication:', error);
      Alert.alert('Erreur', 'Impossible d\'envoyer le message');
    }
  };

  const resetForm = () => {
    setFormData({
      sujet: '',
      message: '',
      type: 'demande',
      priorite: 'normale'
    });
  };

  const getTypeIcon = (type) => {
    const typeInfo = types.find(t => t.id === type);
    return typeInfo ? typeInfo.icon : 'mail-outline';
  };

  const getTypeLabel = (type) => {
    const typeInfo = types.find(t => t.id === type);
    return typeInfo ? typeInfo.label : 'Message';
  };

  const getPrioriteColor = (priorite) => {
    const prioriteInfo = priorites.find(p => p.id === priorite);
    return prioriteInfo ? prioriteInfo.color : '#666';
  };

  const renderCommunicationItem = (communication) => (
    <Card key={communication.id} style={styles.communicationCard}>
      <View style={styles.communicationHeader}>
        <View style={styles.communicationInfo}>
          <View style={[styles.typeIcon, { backgroundColor: getPrioriteColor(communication.priorite) }]}>
            <Ionicons name={getTypeIcon(communication.type)} size={16} color="#fff" />
          </View>
          <View style={styles.communicationDetails}>
            <Text style={styles.communicationTitle}>{communication.sujet}</Text>
            <Text style={styles.communicationMeta}>
              {getTypeLabel(communication.type)} • {new Date(communication.date_envoi).toLocaleDateString('fr-FR')}
            </Text>
          </View>
        </View>
        <View style={styles.communicationStatus}>
          {communication.statut === 'en_attente' && (
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>En attente</Text>
            </View>
          )}
          {communication.statut === 'repondu' && (
            <View style={[styles.statusBadge, styles.statusRepondu]}>
              <Text style={styles.statusText}>Répondu</Text>
            </View>
          )}
        </View>
      </View>
      
      <Text style={styles.communicationMessage} numberOfLines={3}>
        {communication.message}
      </Text>
      
      {communication.reponse_admin && (
        <View style={styles.adminResponseContainer}>
          <View style={styles.adminResponseHeader}>
            <Ionicons name="shield-checkmark-outline" size={16} color="#28a745" />
            <Text style={styles.adminResponseTitle}>Réponse de l'admin</Text>
          </View>
          <Text style={styles.adminResponseContent}>
            {communication.reponse_admin}
          </Text>
          <Text style={styles.adminResponseDate}>
            Répondu le {new Date(communication.date_reponse).toLocaleDateString('fr-FR')}
          </Text>
        </View>
      )}
      
      <View style={styles.communicationActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.viewButton]}
          onPress={() => navigation.navigate('CommunicationDetail', { communicationId: communication.id })}
        >
          <Ionicons name="open-outline" size={16} color="#666" />
          <Text style={styles.actionText}>Voir détails</Text>
        </TouchableOpacity>
        
        {communication.statut === 'en_attente' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.cancelButton]}
            onPress={() => {
              Alert.alert(
                'Annuler la demande',
                'Voulez-vous vraiment annuler cette demande ?',
                [
                  { text: 'Non', style: 'cancel' },
                  {
                    text: 'Oui',
                    style: 'destructive',
                    onPress: async () => {
                      try {
                        const token = await AsyncStorage.getItem('accessToken');
                        const response = await fetch(`${API_BASE_URL}/api/tutor/communications/${communication.id}/cancel/`, {
                          method: 'POST',
                          headers: { 'Authorization': `Bearer ${token}` }
                        });

                        if (response.ok) {
                          Alert.alert('Succès', 'Demande annulée avec succès');
                          loadCommunications();
                        } else {
                          Alert.alert('Erreur', 'Impossible d\'annuler la demande');
                        }
                      } catch (error) {
                        console.error('Erreur annulation demande:', error);
                        Alert.alert('Erreur', 'Impossible d\'annuler la demande');
                      }
                    }
                  }
                ]
              );
            }}
          >
            <Ionicons name="close-circle-outline" size={16} color="#dc3545" />
            <Text style={[styles.actionText, styles.cancelText]}>Annuler</Text>
          </TouchableOpacity>
        )}
      </View>
    </Card>
  );

  const renderComposeModal = () => (
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Contacter l'administration</Text>
          <TouchableOpacity onPress={() => setShowComposeModal(false)}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.modalBody}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Type de demande *</Text>
            <View style={styles.typesContainer}>
              {types.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.typeButton,
                    formData.type === type.id && styles.typeSelected
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, type: type.id }))}
                >
                  <Ionicons name={type.icon} size={20} color={formData.type === type.id ? '#fff' : '#666'} />
                  <Text style={[
                    styles.typeButtonText,
                    formData.type === type.id && styles.typeButtonTextSelected
                  ]}>{type.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Priorité *</Text>
            <View style={styles.prioritesContainer}>
              {priorites.map((priorite) => (
                <TouchableOpacity
                  key={priorite.id}
                  style={[
                    styles.prioriteButton,
                    formData.priorite === priorite.id && styles.prioriteSelected
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, priorite: priorite.id }))}
                >
                  <View style={[
                    styles.prioriteDot,
                    { backgroundColor: priorite.color }
                  ]} />
                  <Text style={[
                    styles.prioriteText,
                    formData.priorite === priorite.id && styles.prioriteTextSelected
                  ]}>{priorite.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Sujet *</Text>
            <TextInput
              style={styles.input}
              value={formData.sujet}
              onChangeText={(text) => setFormData(prev => ({ ...prev, sujet: text }))}
              placeholder="Sujet de votre demande"
            />
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Message *</Text>
            <TextInput
              style={styles.textArea}
              multiline
              numberOfLines={6}
              value={formData.message}
              onChangeText={(text) => setFormData(prev => ({ ...prev, message: text }))}
              placeholder="Décrivez votre demande en détail..."
            />
          </View>
        </ScrollView>
        
        <View style={styles.modalFooter}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => {
              setShowComposeModal(false);
              resetForm();
            }}
          >
            <Text style={styles.cancelButtonText}>Annuler</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>Envoyer</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <>
        <Header title="Communication Admin" showBack onBackPress={() => navigation.goBack()} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Chargement des communications...</Text>
        </View>
      </>
    );
  }

  return (
    <>
      <Header 
        title="Communication Admin" 
        showBack 
        onBackPress={() => navigation.goBack()}
        rightButton={{
          icon: 'add-outline',
          onPress: () => setShowComposeModal(true),
          color: '#007AFF'
        }}
      />
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
        
        {communications.length === 0 ? (
          <Card style={styles.emptyCard}>
            <View style={styles.emptyContainer}>
              <Ionicons name="mail-unread-outline" size={60} color="#ccc" />
              <Text style={styles.emptyTitle}>Aucune communication</Text>
              <Text style={styles.emptyText}>
                Communiquez avec l'administration pour toute demande ou problème
              </Text>
              <Button
                title="Envoyer un message"
                onPress={() => setShowComposeModal(true)}
                style={styles.emptyButton}
              />
            </View>
          </Card>
        ) : (
          communications.map(renderCommunicationItem)
        )}
      </ScrollView>
      
      {showComposeModal && renderComposeModal()}
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
  communicationCard: {
    marginBottom: 16,
  },
  communicationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  communicationInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  communicationDetails: {
    flex: 1,
  },
  communicationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  communicationMeta: {
    fontSize: 12,
    color: '#666',
  },
  communicationStatus: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    backgroundColor: '#ffc107',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusRepondu: {
    backgroundColor: '#28a745',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#fff',
  },
  communicationMessage: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  adminResponseContainer: {
    backgroundColor: '#e8f5e8',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  adminResponseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  adminResponseTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#28a745',
  },
  adminResponseContent: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 8,
  },
  adminResponseDate: {
    fontSize: 12,
    color: '#666',
  },
  communicationActions: {
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
  cancelButton: {
    backgroundColor: '#ffebee',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  cancelText: {
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
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#007AFF',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  modalBody: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  typesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  typeSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  typeButtonText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 6,
  },
  typeButtonTextSelected: {
    color: '#fff',
  },
  prioritesContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  prioriteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  prioriteSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  prioriteDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  prioriteText: {
    fontSize: 14,
    color: '#666',
  },
  prioriteTextSelected: {
    color: '#fff',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 120,
    backgroundColor: '#fff',
    textAlignVertical: 'top',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
  },
  submitButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#007AFF',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
  },
});

export default TutorAdminCommunicationScreen;
