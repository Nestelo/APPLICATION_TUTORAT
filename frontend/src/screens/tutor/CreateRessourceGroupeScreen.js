import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import Header from '../../components/ui/Header';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { getGroupes } from '../../api/tutorService';
import { createRessource } from '../../api/ressourceService';

const CreateRessourceGroupeScreen = ({ navigation, route }) => {
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Formulaire
  const [titre, setTitre] = useState('');
  const [description, setDescription] = useState('');
  const [matiere, setMatiere] = useState('');
  const [niveau, setNiveau] = useState('');
  const [typeRessource, setTypeRessource] = useState('');
  const [lienExterne, setLienExterne] = useState('');
  const [tags, setTags] = useState('');
  
  // Fichier
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  
  // Groupes
  const [groupes, setGroupes] = useState([]);
  const [selectedGroupes, setSelectedGroupes] = useState([]);
  const [loadingGroupes, setLoadingGroupes] = useState(true);

  const TYPES_RESSOURCES = [
    { id: 'cours', label: 'Cours', icon: 'book-outline', accept: ['pdf', 'doc', 'docx', 'ppt', 'pptx'] },
    { id: 'pdf', label: 'PDF', icon: 'document-text-outline', accept: ['pdf'] },
    { id: 'video', label: 'Vidéo', icon: 'videocam-outline', accept: ['mp4', 'mov', 'avi', 'mkv'] },
    { id: 'exercice', label: 'Exercice', icon: 'create-outline', accept: ['pdf', 'doc', 'docx'] },
    { id: 'corrige', label: 'Corrigé', icon: 'checkmark-done-outline', accept: ['pdf', 'doc', 'docx'] },
    { id: 'lien', label: 'Lien utile', icon: 'link-outline', accept: [] },
  ];

  const NIVEAUX = ['L1', 'L2', 'L3', 'M1', 'M2', 'Doctorat'];

  useEffect(() => {
    loadGroupes();
    
    // Si un groupeId est passé en paramètre, le pré-sélectionner
    if (route.params?.groupeId) {
      setSelectedGroupes([route.params.groupeId]);
    }
  }, []);

  const loadGroupes = async () => {
    try {
      setLoadingGroupes(true);
      const data = await getGroupes();
      setGroupes(data || []);
    } catch (error) {
      console.error('Erreur chargement groupes:', error);
      Alert.alert('Erreur', 'Impossible de charger vos groupes');
    } finally {
      setLoadingGroupes(false);
    }
  };

  const selectFile = async () => {
    if (typeRessource === 'lien') {
      return; // Pas de fichier pour les liens
    }

    try {
      let result;
      
      if (typeRessource === 'video') {
        // Pour les vidéos, utiliser ImagePicker avec mediaTypes
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Videos,
          allowsEditing: true,
          quality: 0.8,
        });
      } else {
        // Pour les documents, utiliser DocumentPicker
        result = await DocumentPicker.getDocumentAsync({
          type: TYPES_RESSOURCES.find(t => t.id === typeRessource)?.accept.map(ext => `${ext}/*`) || '*/*',
          copyToCacheDirectory: true,
        });
      }

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        
        // Vérifier la taille (500MB max)
        const maxSize = 500 * 1024 * 1024; // 500MB
        if (asset.size && asset.size > maxSize) {
          Alert.alert('Erreur', 'Le fichier est trop volumineux (max 500MB)');
          return;
        }

        setSelectedFile({
          uri: asset.uri,
          name: asset.name,
          type: asset.mimeType || 'application/octet-stream',
          size: asset.size || 0,
        });

        // Prévisualisation pour les images
        if (asset.mimeType?.startsWith('image/')) {
          setFilePreview({ uri: asset.uri });
        } else {
          setFilePreview(null);
        }
      }
    } catch (error) {
      console.error('Erreur sélection fichier:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner le fichier');
    }
  };

  const toggleGroupeSelection = (groupeId) => {
    setSelectedGroupes(prev => 
      prev.includes(groupeId) 
        ? prev.filter(id => id !== groupeId)
        : [...prev, groupeId]
    );
  };

  const validateForm = () => {
    if (!titre.trim()) {
      Alert.alert('Erreur', 'Le titre est obligatoire');
      return false;
    }
    
    if (!description.trim()) {
      Alert.alert('Erreur', 'La description est obligatoire');
      return false;
    }
    
    if (!matiere.trim()) {
      Alert.alert('Erreur', 'La matière est obligatoire');
      return false;
    }
    
    if (!niveau) {
      Alert.alert('Erreur', 'Le niveau est obligatoire');
      return false;
    }
    
    if (!typeRessource) {
      Alert.alert('Erreur', 'Le type de ressource est obligatoire');
      return false;
    }
    
    if (typeRessource === 'lien' && !lienExterne.trim()) {
      Alert.alert('Erreur', 'L\'URL est obligatoire pour les liens');
      return false;
    }
    
    if (typeRessource !== 'lien' && !selectedFile) {
      Alert.alert('Erreur', 'Veuillez sélectionner un fichier');
      return false;
    }
    
    if (selectedGroupes.length === 0) {
      Alert.alert('Erreur', 'Veuillez sélectionner au moins un groupe');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      setUploadProgress(0);

      // Créer FormData pour l'upload
      const formData = new FormData();
      formData.append('titre', titre.trim());
      formData.append('description', description.trim());
      formData.append('matiere', matiere.trim());
      formData.append('niveau', niveau);
      formData.append('type_fichier', typeRessource);
      formData.append('tags', tags);
      
      if (typeRessource === 'lien') {
        formData.append('lien_externe', lienExterne.trim());
      } else if (selectedFile) {
        formData.append('fichier', {
          uri: selectedFile.uri,
          type: selectedFile.type,
          name: selectedFile.name,
        });
      }

      // Ajouter les groupes
      selectedGroupes.forEach(groupeId => {
        formData.append('groupes_partages', groupeId);
      });

      const response = await createRessource(formData);
      
      Alert.alert(
        'Succès',
        'Ressource créée avec succès ! Elle sera visible après validation par l\'administration.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      );

    } catch (error) {
      console.error('Erreur création ressource:', error);
      Alert.alert('Erreur', 'Impossible de créer la ressource');
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const renderTypeSelector = () => (
    <Card style={styles.card}>
      <Text style={styles.cardTitle}>Type de ressource</Text>
      <View style={styles.typesContainer}>
        {TYPES_RESSOURCES.map(type => (
          <TouchableOpacity
            key={type.id}
            style={[
              styles.typeButton,
              typeRessource === type.id && styles.typeButtonSelected
            ]}
            onPress={() => {
              setTypeRessource(type.id);
              setSelectedFile(null);
              setFilePreview(null);
              setLienExterne('');
            }}
          >
            <Ionicons 
              name={type.icon} 
              size={24} 
              color={typeRessource === type.id ? '#fff' : '#666'} 
            />
            <Text style={[
              styles.typeButtonText,
              typeRessource === type.id && styles.typeButtonTextSelected
            ]}>
              {type.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </Card>
  );

  const renderFileSelection = () => {
    if (typeRessource === 'lien') {
      return (
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>URL de la ressource</Text>
          <TextInput
            style={styles.input}
            value={lienExterne}
            onChangeText={setLienExterne}
            placeholder="https://..."
            keyboardType="url"
            autoCapitalize="none"
          />
        </Card>
      );
    }

    if (!typeRessource) return null;

    return (
      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Fichier</Text>
        
        {selectedFile ? (
          <View style={styles.selectedFileContainer}>
            <View style={styles.fileInfo}>
              <Ionicons name="document-outline" size={24} color="#007AFF" />
              <View style={styles.fileDetails}>
                <Text style={styles.fileName}>{selectedFile.name}</Text>
                <Text style={styles.fileSize}>
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.removeFileButton}
              onPress={() => {
                setSelectedFile(null);
                setFilePreview(null);
              }}
            >
              <Ionicons name="close-circle" size={24} color="#dc3545" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.selectFileButton} onPress={selectFile}>
            <Ionicons name="add-circle-outline" size={32} color="#007AFF" />
            <Text style={styles.selectFileText}>
              Sélectionner un fichier ({TYPES_RESSOURCES.find(t => t.id === typeRessource)?.accept.join(', ') || '*'})
            </Text>
            <Text style={styles.maxSizeText}>Taille maximale: 500MB</Text>
          </TouchableOpacity>
        )}
      </Card>
    );
  };

  const renderGroupesSelection = () => (
    <Card style={styles.card}>
      <Text style={styles.cardTitle}>Partager avec les groupes</Text>
      {loadingGroupes ? (
        <ActivityIndicator size="small" color="#007AFF" />
      ) : (
        <View style={styles.groupesContainer}>
          {groupes.map(groupe => (
            <TouchableOpacity
              key={groupe.id}
              style={[
                styles.groupeButton,
                selectedGroupes.includes(groupe.id) && styles.groupeButtonSelected
              ]}
              onPress={() => toggleGroupeSelection(groupe.id)}
            >
              <Text style={[
                styles.groupeButtonText,
                selectedGroupes.includes(groupe.id) && styles.groupeButtonTextSelected
              ]}>
                {groupe.nom}
              </Text>
              <Text style={styles.groupeInfo}>
                {groupe.matiere} - {groupe.capacite_max} places
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </Card>
  );

  if (loading && uploadProgress > 0) {
    return (
      <View style={styles.loadingContainer}>
        <Header title="Création en cours..." showBack={false} />
        <View style={styles.progressContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.progressText}>Upload en cours...</Text>
          <Text style={styles.progressPercent}>{Math.round(uploadProgress)}%</Text>
        </View>
      </View>
    );
  }

  return (
    <>
      <Header title="Ajouter une ressource" showBack onBackPress={() => navigation.goBack()} />
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        
        {/* Informations de base */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Informations de base</Text>
          
          <TextInput
            style={styles.input}
            value={titre}
            onChangeText={setTitre}
            placeholder="Titre de la ressource *"
          />
          
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Description détaillée *"
            multiline
            numberOfLines={4}
          />
          
          <TextInput
            style={styles.input}
            value={matiere}
            onChangeText={setMatiere}
            placeholder="Matière *"
          />
          
          <View style={styles.niveauContainer}>
            <Text style={styles.label}>Niveau *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.niveauButtons}>
                {NIVEAUX.map(n => (
                  <TouchableOpacity
                    key={n}
                    style={[
                      styles.niveauButton,
                      niveau === n && styles.niveauButtonSelected
                    ]}
                    onPress={() => setNiveau(n)}
                  >
                    <Text style={[
                      styles.niveauButtonText,
                      niveau === n && styles.niveauButtonTextSelected
                    ]}>
                      {n}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
          
          <TextInput
            style={styles.input}
            value={tags}
            onChangeText={setTags}
            placeholder="Tags (séparés par des virgules)"
          />
        </Card>

        {/* Type de ressource */}
        {renderTypeSelector()}
        
        {/* Sélection du fichier */}
        {renderFileSelection()}
        
        {/* Sélection des groupes */}
        {renderGroupesSelection()}

        {/* Bouton de soumission */}
        <Button
          title="Créer la ressource"
          onPress={handleSubmit}
          loading={loading}
          disabled={loading || !typeRessource}
          style={styles.submitButton}
        />
        
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressContainer: {
    alignItems: 'center',
  },
  progressText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  progressPercent: {
    marginTop: 8,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  card: {
    marginBottom: 16,
    padding: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  niveauContainer: {
    marginBottom: 12,
  },
  niveauButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  niveauButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  niveauButtonSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  niveauButtonText: {
    fontSize: 14,
    color: '#666',
  },
  niveauButtonTextSelected: {
    color: '#fff',
  },
  typesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  typeButton: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
    minWidth: 80,
  },
  typeButtonSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  typeButtonText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  typeButtonTextSelected: {
    color: '#fff',
  },
  selectedFileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  fileDetails: {
    marginLeft: 12,
    flex: 1,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  fileSize: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  removeFileButton: {
    padding: 4,
  },
  selectFileButton: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
  },
  selectFileText: {
    fontSize: 16,
    color: '#007AFF',
    marginTop: 8,
    textAlign: 'center',
  },
  maxSizeText: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  groupesContainer: {
    gap: 8,
  },
  groupeButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  groupeButtonSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  groupeButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  groupeButtonTextSelected: {
    color: '#fff',
  },
  groupeInfo: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  submitButton: {
    marginTop: 24,
  },
});

export default CreateRessourceGroupeScreen;
