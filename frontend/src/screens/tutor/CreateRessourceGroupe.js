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
import * as DocumentPicker from 'expo-document-picker';
import { creerRessourceGroupe } from '../../api/tutorService';

const CreateRessourceGroupe = ({ route, navigation }) => {
  const { groupeId } = route.params;
  
  // Utiliser le groupeID passé en paramètre sans redirection
  const groupeIdFinal = groupeId;
  
  const [formData, setFormData] = useState({
    titre: '',
    description: '',
    type: 'cours',
    matiere: '',
    niveau: '',
    lien_externe: '',
    tags: '',
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

  const pickVideoFromLibrary = async () => {
    try {
      console.log('🎥 Tentative de sélection vidéo depuis galerie...');
      
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log('📸 Status permission galerie:', status);
      
      if (status !== 'granted') {
        Alert.alert('Permission requise', 'Veuillez autoriser l\'accès à la galerie pour sélectionner une vidéo.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: false,
        quality: 1,
      });

      console.log('🎥 Résultat sélection vidéo galerie:', result);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        console.log('✅ Vidéo sélectionnée avec succès:', {
          uri: asset.uri,
          mimeType: asset.mimeType,
          fileName: asset.fileName,
          duration: asset.duration,
          width: asset.width,
          height: asset.height
        });
        
        // Vérifier que c'est bien une vidéo
        if (!asset.mimeType || !asset.mimeType.startsWith('video/')) {
          Alert.alert('Erreur', 'Le fichier sélectionné n\'est pas une vidéo valide.');
          return;
        }
        
        const file = {
          uri: asset.uri,
          type: asset.mimeType || 'video/mp4',
          name: asset.fileName || `video_${Date.now()}.mp4`
        };
        
        console.log('📁 Fichier vidéo préparé:', file);
        setSelectedFile(file);
      } else if (result.canceled) {
        console.log('❌ Sélection vidéo annulée par l\'utilisateur');
      } else {
        console.log('❌ Erreur lors de la sélection vidéo:', result);
        Alert.alert('Erreur', 'Impossible de sélectionner la vidéo. Veuillez réessayer.');
      }
    } catch (error) {
      console.error('Erreur lors de la sélection vidéo:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors de la sélection de la vidéo.');
    }
  };

  const recordVideo = async () => {
    try {
      console.log('🎥 Tentative d\'enregistrement vidéo...');
      
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      console.log('📸 Status permission caméra:', status);
      
      if (status !== 'granted') {
        Alert.alert('Permission requise', 'Veuillez autoriser l\'accès à la caméra pour enregistrer une vidéo.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: false,
        quality: 1,
        maxDuration: 300, // 5 minutes max
      });

      console.log('🎥 Résultat enregistrement vidéo:', result);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        console.log('✅ Vidéo enregistrée avec succès:', {
          uri: asset.uri,
          mimeType: asset.mimeType,
          fileName: asset.fileName,
          duration: asset.duration,
          width: asset.width,
          height: asset.height
        });
        
        const file = {
          uri: asset.uri,
          type: asset.mimeType || 'video/mp4',
          name: asset.fileName || `video_${Date.now()}.mp4`
        };
        
        console.log('📁 Fichier vidéo préparé:', file);
        setSelectedFile(file);
      } else if (result.canceled) {
        console.log('❌ Enregistrement vidéo annulé par l\'utilisateur');
      } else {
        console.log('❌ Erreur lors de l\'enregistrement vidéo:', result);
        Alert.alert('Erreur', 'Impossible d\'enregistrer la vidéo. Veuillez réessayer.');
      }
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement vidéo:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors de l\'enregistrement de la vidéo.');
    }
  };

  const pickDocument = async () => {
    try {
      // Vérifier le type de ressource pour choisir le bon sélecteur
      const videoTypes = ['video'];
      const isVideoType = videoTypes.includes(formData.type);
      
      if (isVideoType) {
        // Pour les vidéos : proposer options
        Alert.alert(
          'Sélectionner une vidéo',
          'Choisissez comment vous voulez ajouter une vidéo :',
          [
            {
              text: '📱 Depuis la galerie',
              onPress: () => pickVideoFromLibrary()
            },
            {
              text: '🎥 Enregistrer une vidéo',
              onPress: () => recordVideo()
            },
            {
              text: 'Annuler',
              style: 'cancel'
            }
          ]
        );
      } else {
        // Pour les documents (cours, exercices, PDF, etc.) : utiliser DocumentPicker
        const result = await DocumentPicker.getDocumentAsync({
          type: [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'text/plain',
            'image/*' // Pour les images aussi
          ],
          copyToCacheDirectory: true,
          multiple: false
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
          const asset = result.assets[0];
          console.log('Document sélectionné:', asset);
          
          const file = {
            uri: asset.uri,
            type: asset.mimeType || 'application/octet-stream',
            name: asset.name || `document_${Date.now()}.pdf`
          };
          
          console.log('Fichier document préparé:', file);
          setSelectedFile(file);
        }
      }
    } catch (error) {
      console.error('Erreur lors de la sélection du fichier:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner le fichier');
    }
  };

  const handleSubmit = async () => {
    // Validation des champs obligatoires
    if (!formData.titre.trim()) {
      Alert.alert('Erreur', 'Le titre est obligatoire');
      return;
    }

    if (!formData.description.trim()) {
      Alert.alert('Erreur', 'La description est obligatoire');
      return;
    }

    if (!formData.matiere.trim()) {
      Alert.alert('Erreur', 'La matière est obligatoire');
      return;
    }

    if (!formData.niveau.trim()) {
      Alert.alert('Erreur', 'Le niveau est obligatoire');
      return;
    }

    // Validation spécifique pour les liens
    if (formData.type === 'lien' && !formData.lien_externe.trim()) {
      Alert.alert('Erreur', 'L\'URL est obligatoire pour les liens');
      return;
    }

    // Validation spécifique pour les fichiers
    if (formData.type !== 'lien' && !selectedFile) {
      Alert.alert('Erreur', 'Un fichier est obligatoire pour ce type de ressource');
      return;
    }

    setLoading(true);
    
    try {
      const resourceData = new FormData();
      
      // Ajout des champs texte
      resourceData.append('titre', formData.titre.trim());
      resourceData.append('description', formData.description.trim());
      resourceData.append('type', formData.type);
      resourceData.append('matiere', formData.matiere.trim());
      resourceData.append('niveau', formData.niveau.trim());
      resourceData.append('tags', formData.tags.trim());
      resourceData.append('lien_externe', formData.lien_externe.trim());
      
      // Ajout du groupe (comme liste pour getlist)
      resourceData.append('groupes_partages', groupeIdFinal.toString());
      
      // Ajout du fichier si présent
      if (selectedFile) {
        console.log('Ajout du fichier au FormData:', selectedFile);
        
        // Pour React Native, créer un objet fichier correct
        // Utiliser directement l'objet retourné par DocumentPicker/ImagePicker
        const fileToUpload = {
          uri: selectedFile.uri,
          type: selectedFile.type || 'application/octet-stream',
          name: selectedFile.name || `resource_${Date.now()}.file`
        };
        
        console.log('Fichier à uploader:', fileToUpload);
        
        // Ajouter le fichier au FormData
        // Dans React Native, on peut passer l'objet fichier directement
        resourceData.append('fichier', {
          uri: fileToUpload.uri,
          type: fileToUpload.type,
          name: fileToUpload.name
        });
        
        console.log('Fichier ajouté au FormData');
      }

      console.log('Données envoyées:', {
        titre: formData.titre,
        description: formData.description,
        type: formData.type,
        matiere: formData.matiere,
        niveau: formData.niveau,
        groupeId: groupeIdFinal,
        hasFile: !!selectedFile
      });

      const result = await creerRessourceGroupe(resourceData);
      
      if (result.success) {
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
      } else {
        throw new Error(result.error || 'Erreur lors de la création');
      }
      
    } catch (error) {
      console.error('Erreur création ressource groupe:', error);
      
      let errorMessage = 'Impossible de créer la ressource';
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert(
        'Erreur',
        errorMessage
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
          <Text style={styles.label}>Description *</Text>
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
          <Text style={styles.label}>Niveau *</Text>
          <TextInput
            style={styles.input}
            value={formData.niveau}
            onChangeText={(value) => handleInputChange('niveau', value)}
            placeholder="Ex: L1, L2, L3, etc."
          />
        </View>

        {(formData.type === 'document' || formData.type === 'cours' || formData.type === 'exercice' || formData.type === 'video') && (
          <View style={styles.formGroup}>
            <Text style={styles.label}>Fichier</Text>
            <TouchableOpacity style={styles.fileButton} onPress={pickDocument}>
              <Ionicons name="cloud-upload" size={24} color="#007AFF" />
              <Text style={styles.fileButtonText}>
                {selectedFile ? selectedFile.name || 'Fichier sélectionné' : 'Choisir un fichier'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {formData.type === 'lien' && (
          <View style={styles.formGroup}>
            <Text style={styles.label}>Lien externe *</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    width: '80%',
    maxWidth: 300,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    textAlign: 'center',
    color: '#2c3e50',
  },
  modalOption: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#2c3e50',
  },
  modalCloseButton: {
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  modalCloseButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
});

export default CreateRessourceGroupe;
