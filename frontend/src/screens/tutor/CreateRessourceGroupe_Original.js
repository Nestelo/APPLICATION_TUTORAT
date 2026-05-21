import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Picker
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { creerRessourceGroupe } from '../../api/tutorService';

const CreateRessourceGroupe = ({ route, navigation }) => {
  const { groupeId } = route.params;
  
  const [formData, setFormData] = useState({
    titre: '',
    description: '',
    type: 'cours',
    matiere: '',
    niveau: '',
    lien_externe: '',
    tags: '',
    contenu_texte: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showTypeModal, setShowTypeModal] = useState(false);
  
  const typeOptions = [
    { label: 'Cours', value: 'cours' },
    { label: 'Exercice', value: 'exercice' },
    { label: 'Vidéo', value: 'video' },
    { label: 'Document', value: 'document' },
    { label: 'Quiz', value: 'quiz' },
    { label: 'Lien utile', value: 'lien' }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const pickDocument = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        setSelectedFile(result.assets[0]);
      }
    } catch (error) {
      console.error('Erreur lors de la sélection du fichier:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner le fichier');
    }
  };

  const handleSubmit = async () => {
    if (!formData.titre.trim()) {
      Alert.alert('Erreur', 'Le titre est obligatoire');
      return;
    }

    if (!formData.matiere.trim()) {
      Alert.alert('Erreur', 'La matière est obligatoire');
      return;
    }

    setLoading(true);
    
    try {
      const resourceData = new FormData();
      resourceData.append('titre', formData.titre);
      resourceData.append('description', formData.description);
      resourceData.append('type', formData.type);
      resourceData.append('matiere', formData.matiere);
      resourceData.append('niveau', formData.niveau);
      resourceData.append('tags', formData.tags);
      resourceData.append('lien_externe', formData.lien_externe);
      
      // Ajouter le groupe aux groupes_partages (comme une liste)
      resourceData.append('groupes_partages', groupeId);
      
      if (selectedFile) {
        resourceData.append('fichier', {
          uri: selectedFile.uri,
          type: selectedFile.type || 'application/octet-stream',
          name: selectedFile.name || 'resource_file'
        });
      }

      await creerRessourceGroupe(resourceData);
      
      Alert.alert(
        'Succès',
        'Ressource créée avec succès ! En attente de validation par l\'administrateur.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      );
    } catch (error) {
      console.error('Erreur lors de la création de la ressource:', error);
      Alert.alert(
        'Erreur',
        error.response?.data?.message || 'Impossible de créer la ressource'
      );
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'cours': return '📚';
      case 'exercice': return '📝';
      case 'video': return '🎥';
      case 'document': return '📄';
      case 'quiz': return '❓';
      case 'lien': return '🔗';
      default: return '📎';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Créer une ressource</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Titre *</Text>
          <TextInput
            style={styles.input}
            value={formData.titre}
            onChangeText={(value) => handleInputChange('titre', value)}
            placeholder="Titre de la ressource"
            multiline
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.description}
            onChangeText={(value) => handleInputChange('description', value)}
            placeholder="Description détaillée de la ressource"
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Type de ressource</Text>
          <TouchableOpacity
            style={styles.typeSelector}
            onPress={() => setShowTypeModal(true)}
          >
            <Text style={styles.typeText}>
              {getTypeIcon(formData.type)} {typeOptions.find(opt => opt.value === formData.type)?.label}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Matière *</Text>
          <TextInput
            style={styles.input}
            value={formData.matiere}
            onChangeText={(value) => handleInputChange('matiere', value)}
            placeholder="Ex: Mathématiques, Physique, etc."
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Niveau</Text>
          <TextInput
            style={styles.input}
            value={formData.niveau}
            onChangeText={(value) => handleInputChange('niveau', value)}
            placeholder="Ex: L1, L2, L3, etc."
          />
        </View>

        {(formData.type === 'document' || formData.type === 'cours' || formData.type === 'exercice') && (
          <View style={styles.formGroup}>
            <Text style={styles.label}>Fichier</Text>
            <TouchableOpacity style={styles.fileButton} onPress={pickDocument}>
              <Ionicons name="cloud-upload" size={24} color="#007AFF" />
              <Text style={styles.fileButtonText}>
                {selectedFile ? selectedFile.name : 'Choisir un fichier'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {formData.type === 'lien' && (
          <View style={styles.formGroup}>
            <Text style={styles.label}>Lien externe</Text>
            <TextInput
              style={styles.input}
              value={formData.lien_externe}
              onChangeText={(value) => handleInputChange('lien_externe', value)}
              placeholder="https://exemple.com/ressource"
              keyboardType="url"
            />
          </View>
        )}

        <View style={styles.formGroup}>
          <Text style={styles.label}>Contenu textuel</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.contenu_texte}
            onChangeText={(value) => handleInputChange('contenu_texte', value)}
            placeholder="Contenu détaillé (optionnel)"
            multiline
            numberOfLines={6}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Tags</Text>
          <TextInput
            style={styles.input}
            value={formData.tags}
            onChangeText={(value) => handleInputChange('tags', value)}
            placeholder="algèbre, programmation, examen (séparés par des virgules)"
          />
        </View>

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.disabledButton]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.submitButtonText}>Créer la ressource</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={showTypeModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowTypeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Type de ressource</Text>
            {typeOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={styles.modalOption}
                onPress={() => {
                  handleInputChange('type', option.value);
                  setShowTypeModal(false);
                }}
              >
                <Text style={styles.modalOptionText}>
                  {getTypeIcon(option.value)} {option.label}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowTypeModal(false)}
            >
              <Text style={styles.modalCloseButtonText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  content: {
    flex: 1,
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2c3e50',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  typeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    backgroundColor: '#fff',
  },
  typeText: {
    fontSize: 16,
    color: '#2c3e50',
  },
  fileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#007AFF',
    borderRadius: 8,
    padding: 15,
    backgroundColor: '#f8f9ff',
  },
  fileButtonText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 18,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxWidth: 300,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalOption: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#2c3e50',
  },
  modalCloseButton: {
    marginTop: 10,
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    fontSize: 16,
    color: '#666',
  },
});

export default CreateRessourceGroupe;
