import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, ActivityIndicator, RefreshControl, TextInput } from 'react-native';
import Header from '../../components/ui/Header';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { getRessources, createRessource, updateRessource } from '../../api/ressourceService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

const API_BASE_URL = 'http://192.168.43.210:8000';

const TutorResourcesScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [resources, setResources] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingResource, setEditingResource] = useState(null);
  const [formData, setFormData] = useState({
    titre: '',
    description: '',
    type: 'cours',
    matiere: '',
    niveau: '',
    fichier: null,
    lien_video: ''
  });

  const [videoInputMode, setVideoInputMode] = useState('lien'); // 'lien' ou 'galerie'

  const [typesRessources] = useState([
    { id: 'cours', label: 'Cours', icon: 'book-outline' },
    { id: 'pdf', label: 'PDF', icon: 'document-text-outline' },
    { id: 'video', label: 'Vidéo', icon: 'videocam-outline' },
    { id: 'exercice', label: 'Exercice', icon: 'create-outline' },
    { id: 'corrige', label: 'Corrigé', icon: 'checkmark-done-outline' },
    { id: 'lien', label: 'Lien', icon: 'link-outline' }
  ]);

  const [niveaux] = useState([
    'L1', 'L2', 'L3', 'M1', 'M2', 'Doctorat'
  ]);

  useEffect(() => {
    loadResources();
  }, []);

  const loadResources = async () => {
    try {
      setLoading(true);
      const data = await getRessources();
      console.log('📚 Ressources chargées:', data);
      console.log('📊 Type des données:', typeof data);
      console.log('📊 Est un tableau?', Array.isArray(data));
      console.log('📊 Longueur:', data?.length);
      setResources(data.results || data || []); // Protection contre undefined
    } catch (error) {
      console.error('Erreur chargement ressources:', error);
      setResources([]); // Initialiser comme tableau vide en cas d'erreur
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

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled) {
        setFormData(prev => ({ ...prev, fichier: result.assets[0] }));
        setFormData(prev => ({ ...prev, type: 'pdf' })); 
      }
    } catch (error) {
      console.error('Erreur sélection document:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner un document');
    }
  };

  const pickVideo = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['videos'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled) {
        setFormData(prev => ({ 
          ...prev, 
          fichier: result.assets[0]
          // Ne pas mettre lien_video pour les fichiers locaux
        }));
        setFormData(prev => ({ ...prev, type: 'video' })); 
      }
    } catch (error) {
      console.error('Erreur sélection vidéo:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner une vidéo');
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled) {
        setFormData(prev => ({ 
          ...prev, 
          fichier: result.assets[0]
        }));
        setFormData(prev => ({ ...prev, type: 'image' })); // Corrigé: 'image' au lieu de setAutreType
      }
    } catch (error) {
      console.error('Erreur sélection image:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner une image');
    }
  };

  const resetForm = () => {
    setFormData({
      titre: '',
      description: '',
      matiere: '',
      niveau: '',
      type: 'cours',
      fichier: null,
      lien_video: ''
    });
    setVideoInputMode('lien');
    setEditingResource(null);
  };

  const handleSubmit = async () => {
    if (!formData.titre || !formData.description || !formData.matiere || !formData.niveau) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    if ((formData.type === 'cours' || formData.type === 'pdf' || formData.type === 'exercice' || formData.type === 'corrige' || formData.type === 'lien') && !formData.fichier) {
      Alert.alert('Erreur', 'Veuillez sélectionner un fichier');
      return;
    }

    if (formData.type === 'video' && !formData.lien_video && !formData.fichier) {
      Alert.alert('Erreur', 'Veuillez ajouter un lien vidéo ou sélectionner une vidéo depuis la galerie');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('accessToken');
      // Utiliser un ID fixe temporairement pour éviter les erreurs JWT
      const userId = 20; // ID de l'utilisateur existant (Bienvenue Motar)
      
      const formDataToSend = new FormData();
      
      formDataToSend.append('titre', formData.titre);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('type_fichier', formData.type);
      formDataToSend.append('matiere', formData.matiere);
      formDataToSend.append('niveau', formData.niveau);
      formDataToSend.append('auteur', userId);
      formDataToSend.append('tags', formData.tags || '');
      formDataToSend.append('lien_externe', formData.lien_video || '');
      
      // Log pour debug
      console.log('📤 Données envoyées:', {
        titre: formData.titre,
        description: formData.description,
        type_fichier: formData.type,
        matiere: formData.matiere,
        niveau: formData.niveau,
        auteur: userId,
        tags: formData.tags || '',
        lien_externe: formData.lien_video || '',
        fichier: formData.fichier ? 'OUI' : 'NON'
      });
      
      if (formData.fichier) {
        const fileData = {
          uri: formData.fichier.uri,
          type: formData.fichier.mimeType || 'application/octet-stream',
          name: formData.fichier.name || `file.${formData.type === 'video' ? 'mp4' : formData.type === 'image' ? 'jpg' : 'pdf'}`
        };
        formDataToSend.append('fichier', fileData);
        console.log('📁 Fichier ajouté:', fileData);
      }
      
      if (formData.lien_video) {
        formDataToSend.append('lien_video', formData.lien_video);
      }

      if (editingResource) {
        await updateRessource(editingResource.id, formDataToSend);
      } else {
        await createRessource(formDataToSend);
      }

      Alert.alert(
        'Succès',
        editingResource ? 'Ressource mise à jour avec succès' : 'Ressource publiée avec succès',
        [{ text: 'OK', onPress: () => {
          setShowAddModal(false);
          resetForm();
          loadResources();
        }}]
      );
    } catch (error) {
      console.error('Erreur publication ressource:', error);
      console.error('Détails erreur:', error.response?.data);
      console.error('Status erreur:', error.response?.status);
      Alert.alert('Erreur', `Échec de la publication: ${error.response?.data?.message || error.message}`);
    } finally {
      // Rien à faire
    }
  };

  const handleEdit = (resource) => {
    setEditingResource(resource);
    setFormData({
      titre: resource.titre,
      description: resource.description,
      type: resource.type,
      matiere: resource.matiere,
      niveau: resource.niveau,
      fichier: null,
      lien_video: resource.lien_video || ''
    });
    setShowAddModal(true);
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
              Alert.alert('Erreur', 'Impossible de supprimer la ressource');
            }
          }
        }
      ]
    );
  };

  const handleEditResource = (resource) => {
    setEditingResource(resource);
    setFormData({
      titre: resource.titre || '',
      description: resource.description || '',
      matiere: resource.matiere || '',
      niveau: resource.niveau || '',
      type: resource.type_fichier || 'cours',
      fichier: null,
      lien_video: resource.lien_externe || ''
    });
    setShowAddModal(true);
  };

  const getTypeIcon = (type) => {
    const typeInfo = typesRessources.find(t => t.id === type);
    return typeInfo ? typeInfo.icon : 'document-outline';
  };

  const getTypeLabel = (type) => {
    const typeInfo = typesRessources.find(t => t.id === type);
    return typeInfo ? typeInfo.label : 'Document';
  };

  const getTypeColor = (type) => {
    const colors = {
      cours: '#007AFF',
      pdf: '#dc3545',
      video: '#28a745',
      exercice: '#ffc107',
      corrige: '#6f42c1',
      autre: '#17a2b8'
    };
    return colors[type] || '#666';
  };

  const renderAddModal = () => (
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>
            {editingResource ? 'Modifier la ressource' : 'Publier une ressource'}
          </Text>
          <TouchableOpacity onPress={() => setShowAddModal(false)}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.modalBody}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Titre *</Text>
            <TextInput
              style={styles.input}
              value={formData.titre}
              onChangeText={(text) => setFormData(prev => ({ ...prev, titre: text }))}
              placeholder="Titre de la ressource"
            />
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Description *</Text>
            <TextInput
              style={styles.textArea}
              value={formData.description}
              onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
              placeholder="Décrivez votre ressource"
              multiline
              numberOfLines={4}
            />
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Type *</Text>
            <View style={styles.typesContainer}>
              {typesRessources.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.typeButton,
                    formData.type === type.id && styles.typeSelected
                  ]}
                  onPress={() => {
                    setFormData(prev => ({ ...prev, type: type.id }));
                    // Ouvrir le sélecteur de fichiers pour tous les types sauf vidéo
                    if (type.id !== 'video') {
                      pickDocument();
                    }
                  }}
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
          
          <View style={styles.formRow}>
            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={styles.label}>Matière *</Text>
              <TextInput
                style={styles.input}
                placeholder="Entrez la matière..."
                value={formData.matiere}
                onChangeText={(text) => setFormData(prev => ({ ...prev, matiere: text }))}
              />
            </View>
            
            <View style={[styles.formGroup, { flex: 1 }]}>
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
          </View>
          
          {formData.type === 'cours' && (
            <View style={styles.formGroup}>
              <Text style={styles.label}>Fichier du cours *</Text>
              <TouchableOpacity style={styles.filePicker} onPress={pickDocument}>
                <Ionicons name="document-attach" size={20} color="#007AFF" />
                <Text style={styles.filePickerText}>
                  {formData.fichier ? formData.fichier.name : 'Choisir un fichier'}
                </Text>
              </TouchableOpacity>
              {formData.fichier && (
                <View style={styles.fileInfo}>
                  <Text style={styles.fileInfoText}>
                    Fichier sélectionné : {formData.fichier.name}
                  </Text>
                  <TouchableOpacity
                    style={styles.removeFileButton}
                    onPress={() => setFormData(prev => ({ ...prev, fichier: null }))}
                  >
                    <Ionicons name="close-circle" size={16} color="#dc3545" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
          
          {formData.type === 'exercice' && (
            <View style={styles.formGroup}>
              <Text style={styles.label}>Fichier d'exercice *</Text>
              <TouchableOpacity style={styles.filePicker} onPress={pickDocument}>
                <Ionicons name="document-attach" size={20} color="#007AFF" />
                <Text style={styles.filePickerText}>
                  {formData.fichier ? formData.fichier.name : 'Choisir un fichier'}
                </Text>
              </TouchableOpacity>
              {formData.fichier && (
                <View style={styles.fileInfo}>
                  <Text style={styles.fileInfoText}>
                    Fichier sélectionné : {formData.fichier.name}
                  </Text>
                  <TouchableOpacity
                    style={styles.removeFileButton}
                    onPress={() => setFormData(prev => ({ ...prev, fichier: null }))}
                  >
                    <Ionicons name="close-circle" size={16} color="#dc3545" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
          
          {formData.type === 'corrige' && (
            <View style={styles.formGroup}>
              <Text style={styles.label}>Fichier corrigé *</Text>
              <TouchableOpacity style={styles.filePicker} onPress={pickDocument}>
                <Ionicons name="document-attach" size={20} color="#007AFF" />
                <Text style={styles.filePickerText}>
                  {formData.fichier ? formData.fichier.name : 'Choisir un fichier'}
                </Text>
              </TouchableOpacity>
              {formData.fichier && (
                <View style={styles.fileInfo}>
                  <Text style={styles.fileInfoText}>
                    Fichier sélectionné : {formData.fichier.name}
                  </Text>
                  <TouchableOpacity
                    style={styles.removeFileButton}
                    onPress={() => setFormData(prev => ({ ...prev, fichier: null }))}
                  >
                    <Ionicons name="close-circle" size={16} color="#dc3545" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
          
          {formData.type === 'autre' && (
            <View style={styles.formGroup}>
              <Text style={styles.label}>Type de document *</Text>
              <View style={styles.autreTypeSelector}>
                <TouchableOpacity
                  style={[
                    styles.autreTypeButton,
                    autreType === 'document' && styles.autreTypeButtonSelected
                  ]}
                  onPress={pickDocument}
                >
                  <Ionicons name="document-outline" size={20} color={autreType === 'document' ? '#fff' : '#007AFF'} />
                  <Text style={[
                    styles.autreTypeButtonText,
                    autreType === 'document' && styles.autreTypeButtonTextSelected
                  ]}>Document</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.autreTypeButton,
                    autreType === 'image' && styles.autreTypeButtonSelected
                  ]}
                  onPress={pickImage}
                >
                  <Ionicons name="image-outline" size={20} color={autreType === 'image' ? '#fff' : '#007AFF'} />
                  <Text style={[
                    styles.autreTypeButtonText,
                    autreType === 'image' && styles.autreTypeButtonTextSelected
                  ]}>Image</Text>
                </TouchableOpacity>
              </View>
              
              <Text style={styles.label}>Fichier sélectionné</Text>
              {formData.fichier && (
                <View style={styles.fileInfo}>
                  <Text style={styles.fileInfoText}>
                    {formData.fichier.name}
                  </Text>
                  <TouchableOpacity
                    style={styles.removeFileButton}
                    onPress={() => setFormData(prev => ({ ...prev, fichier: null }))}
                  >
                    <Ionicons name="close-circle" size={16} color="#dc3545" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
          
          {formData.type === 'video' && (
            <View style={styles.formGroup}>
              <Text style={styles.label}>Source vidéo *</Text>
              
              <View style={styles.videoModeSelector}>
                <TouchableOpacity
                  style={[
                    styles.videoModeButton,
                    videoInputMode === 'lien' && styles.videoModeButtonSelected
                  ]}
                  onPress={() => setVideoInputMode('lien')}
                >
                  <Ionicons 
                    name="link-outline" 
                    size={16} 
                    color={videoInputMode === 'lien' ? '#fff' : '#007AFF'} 
                  />
                  <Text style={[
                    styles.videoModeButtonText,
                    videoInputMode === 'lien' && styles.videoModeButtonTextSelected
                  ]}>Lien URL</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.videoModeButton,
                    videoInputMode === 'galerie' && styles.videoModeButtonSelected
                  ]}
                  onPress={() => setVideoInputMode('galerie')}
                >
                  <Ionicons 
                    name="images-outline" 
                    size={16} 
                    color={videoInputMode === 'galerie' ? '#fff' : '#007AFF'} 
                  />
                  <Text style={[
                    styles.videoModeButtonText,
                    videoInputMode === 'galerie' && styles.videoModeButtonTextSelected
                  ]}>Galerie</Text>
                </TouchableOpacity>
              </View>
              
              {videoInputMode === 'lien' ? (
                <TextInput
                  style={styles.input}
                  value={formData.lien_video}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, lien_video: text }))}
                  placeholder="https://youtube.com/..."
                />
              ) : (
                <TouchableOpacity style={styles.filePicker} onPress={pickVideo}>
                  <Ionicons name="videocam-outline" size={20} color="#007AFF" />
                  <Text style={styles.filePickerText}>
                    {formData.fichier ? formData.fichier.name : 'Choisir une vidéo'}
                  </Text>
                </TouchableOpacity>
              )}
              
              {videoInputMode === 'galerie' && formData.fichier && (
                <View style={styles.fileInfo}>
                  <Text style={styles.fileInfoText}>
                    Vidéo sélectionnée : {formData.fichier.name}
                  </Text>
                  <TouchableOpacity
                    style={styles.removeFileButton}
                    onPress={() => setFormData(prev => ({ ...prev, fichier: null, lien_video: '' }))}
                  >
                    <Ionicons name="close-circle" size={16} color="#dc3545" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </ScrollView>
        
        <View style={styles.modalFooter}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => {
              setShowAddModal(false);
              resetForm();
            }}
          >
            <Text style={styles.cancelButtonText}>Annuler</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}
          >
            <Text style={styles.submitButtonText}>
              {editingResource ? 'Mettre à jour' : 'Publier'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <>
        <Header title="Mes ressources" showBack onBackPress={() => navigation.goBack()} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Chargement des ressources...</Text>
        </View>
      </>
    );
  }

  return (
    <>
      <Header 
        title="Mes ressources" 
        showBack 
        onBackPress={() => navigation.goBack()}
        rightButton={{
          icon: 'add-outline',
          text: 'Ajouter',
          onPress: () => setShowAddModal(true),
          color: '#007AFF'
        }}
      />
      <ScrollView style={styles.container}>
        {resources.length === 0 ? (
          <Card style={styles.emptyCard}>
            <View style={styles.emptyContainer}>
              <Ionicons name="folder-open-outline" size={60} color="#ccc" />
              <Text style={styles.emptyTitle}>Aucune ressource</Text>
              <Text style={styles.emptyText}>
                Commencez à publier des ressources pédagogiques pour vos étudiants
              </Text>
              <Button
                title="Publier une ressource"
                onPress={() => setShowAddModal(true)}
                style={styles.emptyButton}
              />
            </View>
          </Card>
        ) : (
          (resources || []).map((resource, index) => {
            if (!resource || !resource.id) return null;
            
            return (
              <Card key={resource.id || index} style={styles.resourceCard}>
                <View style={styles.resourceHeader}>
                  <View style={styles.resourceInfo}>
                    <Text style={styles.resourceTitle}>{resource.titre || 'Sans titre'}</Text>
                    <Text style={styles.resourceDescription}>{resource.description}</Text>
                    <Text style={styles.resourceMeta}>{resource.matiere} • {resource.niveau}</Text>
                  </View>
                  <View style={styles.resourceActions}>
                    <TouchableOpacity 
                      style={styles.actionButton} 
                      onPress={() => handleEditResource(resource)}
                    >
                      <Ionicons name="create-outline" size={16} color="#007AFF" />
                      <Text style={[styles.actionText, styles.editText]}>Modifier</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.deleteButton]} 
                      onPress={() => handleDeleteResource(resource.id)}
                    >
                      <Ionicons name="trash-outline" size={16} color="#dc3545" />
                      <Text style={[styles.actionText, styles.deleteText]}>Supprimer</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                
                {resource.statut_validation === 'en_attente' && (
                  <View style={styles.validationBadge}>
                    <Text style={styles.validationText}>En attente de validation</Text>
                  </View>
                )}
                
                {resource.statut_validation === 'rejete' && (
                  <View style={[styles.validationBadge, styles.rejectedBadge]}>
                    <Text style={styles.validationText}>Rejeté</Text>
                  </View>
                )}
              </Card>
            );
          })
        )}
      </ScrollView>
      
      {showAddModal && renderAddModal()}
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
  resourceCard: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  resourceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  resourceInfo: {
    flex: 1,
    marginRight: 12,
  },
  resourceTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  resourceDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
    lineHeight: 20,
  },
  resourceMeta: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  resourceActions: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 6,
    minWidth: 100,
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
  resourceDate: {
    fontSize: 11,
    color: '#999',
  },
  resourceStats: {
    flexDirection: 'row',
    gap: 16,
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
  editButton: {
    backgroundColor: '#e3f2fd',
  },
  deleteButton: {
    backgroundColor: '#ffebee',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  editText: {
    color: '#007AFF',
  },
  deleteText: {
    color: '#dc3545',
  },
  validationBadge: {
    backgroundColor: '#ffc107',
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
    alignItems: 'center',
  },
  rejectedBadge: {
    backgroundColor: '#dc3545',
  },
  validationText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#fff',
  },
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  emptyButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
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
  formRow: {
    flexDirection: 'row',
    gap: 16,
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
    color: '#333',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    backgroundColor: '#fff',
    textAlignVertical: 'top',
    color: '#333',
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
  tagsScroll: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 8,
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
  customInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    marginTop: 8,
    color: '#333',
  },
  filePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
  },
  filePickerText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    padding: 8,
    backgroundColor: '#e8f5e8',
    borderRadius: 6,
  },
  fileInfoText: {
    flex: 1,
    fontSize: 14,
    color: '#28a745',
  },
  removeFileButton: {
    marginLeft: 8,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  cancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
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
  videoModeSelector: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  videoModeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 6,
    marginRight: 8,
    backgroundColor: '#fff',
  },
  videoModeButtonSelected: {
    backgroundColor: '#007AFF',
  },
  videoModeButtonText: {
    fontSize: 14,
    color: '#007AFF',
    marginLeft: 4,
  },
  videoModeButtonTextSelected: {
    color: '#fff',
  },
  autreTypeSelector: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  autreTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 8,
    backgroundColor: '#fff',
    marginHorizontal: 4,
  },
  autreTypeButtonSelected: {
    backgroundColor: '#007AFF',
  },
  autreTypeButtonText: {
    fontSize: 14,
    color: '#007AFF',
    marginLeft: 4,
  },
  autreTypeButtonTextSelected: {
    color: '#fff',
  },
  resourceActions: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    minWidth: 90,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  actionText: {
    fontSize: 11,
    fontWeight: '500',
    marginLeft: 6,
  },
  editText: {
    color: '#007AFF',
  },
  deleteText: {
    color: '#dc3545',
  },
});

export default TutorResourcesScreen;
