import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, TextInput } from 'react-native';
import Header from '../../components/ui/Header';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { Picker } from '@react-native-picker/picker';
import { createRessource } from '../../api/ressourceService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';

const AjoutRessourceScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    titre: '',
    description: '',
    type: 'cours',
    matiere: '',
    niveau: '',
    fichier: null,
    lien_video: ''
  });

  const [typesRessources] = useState([
    { id: 'cours', label: 'Cours', icon: 'book-outline' },
    { id: 'pdf', label: 'PDF', icon: 'document-text-outline' },
    { id: 'video', label: 'Vidéo', icon: 'videocam-outline' },
    { id: 'exercice', label: 'Exercice', icon: 'create-outline' },
    { id: 'corrige', label: 'Corrigé', icon: 'checkmark-done-outline' }
  ]);

  // Champ manuel pour les matières - plus besoin de matières prédéfinies

  const [niveaux] = useState([
    'L1', 'L2', 'L3', 'M1', 'M2'
  ]);

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf', 
          'application/msword', 
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'video/*',
          'audio/*'
        ],
        copyToCacheDirectory: true,
      });

      if (!result.canceled) {
        setFormData(prev => ({ ...prev, fichier: result.assets[0] }));
      }
    } catch (error) {
      console.error('Erreur sélection document:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner un document');
    }
  };

  const toggleType = (type) => {
    setFormData(prev => ({ ...prev, type }));
    pickDocument();
  };

  const toggleNiveau = (niveau) => {
    setFormData(prev => ({ ...prev, niveau }));
  };

  const handleSubmit = async () => {
    if (!formData.titre || !formData.description || !formData.matiere || !formData.niveau) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    // Pour les vidéos, on accepte soit un fichier soit un lien
    if (formData.type === 'video' && !formData.fichier && !formData.lien_video) {
      Alert.alert('Erreur', 'Veuillez sélectionner un fichier vidéo OU ajouter un lien URL');
      return;
    }

    // Pour les autres types, on exige un fichier
    if (formData.type !== 'video' && !formData.fichier) {
      Alert.alert('Erreur', 'Veuillez sélectionner un fichier');
      return;
    }

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('accessToken');
      // Utiliser un ID fixe temporairement pour éviter les erreurs JWT
      const userId = 20; // ID de l'utilisateur existant (Bienvenue Motar)
      
      // Raccourcir le nom de fichier si nécessaire (max 100 caractères)
      const getSafeFileName = (file) => {
        if (!file) return null;
        const name = file.name;
        if (name.length <= 100) return name;
        
        // Garder l'extension et raccourcir le nom
        const lastDot = name.lastIndexOf('.');
        const extension = lastDot > -1 ? name.substring(lastDot) : '';
        const baseName = lastDot > -1 ? name.substring(0, lastDot) : name;
        const maxBaseLength = 100 - extension.length;
        
        return baseName.substring(0, maxBaseLength) + extension;
      };
      
      const formDataToSend = new FormData();
      formDataToSend.append('titre', formData.titre);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('type_fichier', formData.type);
      formDataToSend.append('matiere', formData.matiere);
      formDataToSend.append('niveau', formData.niveau);
      formDataToSend.append('auteur', userId); // ID numérique de l'utilisateur
      
      // Log pour débogage
      console.log('Données envoyées:', {
        titre: formData.titre,
        description: formData.description,
        type_fichier: formData.type,
        matiere: formData.matiere,
        niveau: formData.niveau,
        auteur: userId, // ID numérique de l'utilisateur récupéré
        hasFile: !!formData.fichier,
        hasVideoLink: !!formData.lien_video
      });
      
      if (formData.fichier) {
        const safeFileName = getSafeFileName(formData.fichier);
        console.log('Fichier original:', formData.fichier.name);
        console.log('Fichier raccourci:', safeFileName);
        console.log('Détails:', {
          uri: formData.fichier.uri,
          name: safeFileName,
          mimeType: formData.fichier.mimeType || 'application/octet-stream'
        });
        formDataToSend.append('fichier', {
          uri: formData.fichier.uri,
          type: formData.fichier.mimeType || 'application/octet-stream',
          name: safeFileName
        });
      }
      
      if (formData.lien_video) {
        console.log('Lien vidéo:', formData.lien_video);
        formDataToSend.append('lien_video', formData.lien_video);
      }

      const response = await createRessource(formDataToSend);

      Alert.alert(
        'Succès',
        'Ressource publiée avec succès ! Elle est en attente de validation par l\'administration.',
        [
          { 
            text: 'OK', 
            onPress: () => navigation.goBack()
          }
        ]
      );
    } catch (error) {
      console.error('Erreur publication ressource:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors de la publication');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      titre: '',
      description: '',
      type: 'cours',
      matiere: '',
      niveau: '',
      fichier: null,
      lien_video: ''
    });
    setCustomMatiere('');
  };

  const removeFile = () => {
    setFormData(prev => ({ ...prev, fichier: null }));
  };

  if (loading) {
    return (
      <>
        <Header title="Publier une ressource" showBack onBackPress={() => navigation.goBack()} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Publication en cours...</Text>
        </View>
      </>
    );
  }

  return (
    <>
      <Header title="Publier une ressource" showBack onBackPress={() => navigation.goBack()} />
      <ScrollView style={styles.container}>
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>📝 Informations générales</Text>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Titre *</Text>
            <TextInput
              style={styles.input}
              value={formData.titre}
              onChangeText={(text) => setFormData(prev => ({ ...prev, titre: text }))}
              placeholder="Titre de la ressource"
              multiline
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Description *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.description}
              onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
              placeholder="Description détaillée de la ressource"
              multiline
              numberOfLines={4}
            />
          </View>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>🏷️ Catégorisation</Text>
          
          <View style={styles.formRow}>
            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={styles.label}>Type *</Text>
              <View style={styles.pickerContainer}>
                <Text style={styles.pickerText}>{typesRessources.find(t => t.id === formData.type)?.label || 'Sélectionner'}</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagsScroll}>
                {typesRessources.map((type, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.tag,
                      formData.type === type.id && styles.tagSelected
                    ]}
                    onPress={() => toggleType(type.id)}
                  >
                    <Ionicons name={type.icon} size={16} color={formData.type === type.id ? '#fff' : '#666'} />
                    <Text style={[
                      styles.tagText,
                      formData.type === type.id && styles.tagTextSelected
                    ]}>{type.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
          
          <View style={styles.formRow}>
            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={styles.label}>Matière *</Text>
              <TextInput
                style={styles.input}
                value={formData.matiere}
                onChangeText={(text) => setFormData(prev => ({ ...prev, matiere: text }))}
                placeholder="Entrez le nom de la matière..."
              />
            </View>
            
            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={styles.label}>Niveau *</Text>
              <View style={styles.pickerContainer}>
                <Text style={styles.pickerText}>{formData.niveau || 'Sélectionner'}</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagsScroll}>
                {niveaux.map((niveau, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.tag,
                      formData.niveau === niveau && styles.tagSelected
                    ]}
                    onPress={() => toggleNiveau(niveau)}
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
        </Card>

        {formData.type !== 'video' && (
          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>📁 Fichier</Text>
            
            {formData.fichier ? (
              <View style={styles.fileInfo}>
                <Ionicons name="document-text-outline" size={24} color="#007AFF" />
                <View style={styles.fileInfoText}>
                  <Text style={styles.fileName}>{formData.fichier.name}</Text>
                  <Text style={styles.fileSize}>{(formData.fichier.size / 1024 / 1024).toFixed(2)} MB</Text>
                </View>
                <TouchableOpacity style={styles.removeFileButton} onPress={removeFile}>
                  <Ionicons name="close-circle" size={20} color="#dc3545" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.filePicker} onPress={pickDocument}>
                <Ionicons name="add-circle-outline" size={24} color="#007AFF" />
                <Text style={styles.filePickerText}>Sélectionner un fichier</Text>
              </TouchableOpacity>
            )}
          </Card>
        )}

        {formData.type === 'video' && (
          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>🎥 Vidéo (2 options)</Text>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Option 1 : Fichier vidéo</Text>
              {formData.fichier ? (
                <View style={styles.fileInfo}>
                  <Ionicons name="videocam-outline" size={24} color="#28a745" />
                  <View style={styles.fileInfoText}>
                    <Text style={styles.fileName}>{formData.fichier.name}</Text>
                    <Text style={styles.fileSize}>{(formData.fichier.size / 1024 / 1024).toFixed(2)} MB</Text>
                  </View>
                  <TouchableOpacity style={styles.removeFileButton} onPress={removeFile}>
                    <Ionicons name="close-circle" size={20} color="#dc3545" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={styles.filePicker} onPress={pickDocument}>
                  <Ionicons name="videocam-outline" size={24} color="#28a745" />
                  <Text style={styles.filePickerText}>Sélectionner un fichier vidéo</Text>
                </TouchableOpacity>
              )}
            </View>
            
            <View style={styles.divider}>
              <Text style={styles.dividerText}>OU</Text>
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Option 2 : Lien URL</Text>
              <TextInput
                style={styles.input}
                value={formData.lien_video}
                onChangeText={(text) => setFormData(prev => ({ ...prev, lien_video: text }))}
                placeholder="https://youtube.com/watch?v=..."
                keyboardType="url"
              />
            </View>
          </Card>
        )}

        <View style={styles.buttonContainer}>
          <Button 
            title="Publier la ressource" 
            onPress={handleSubmit}
            loading={loading}
            style={styles.submitButton}
          />
          <Button 
            title="Réinitialiser" 
            onPress={resetForm}
            type="secondary"
            style={styles.resetButton}
          />
        </View>
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
  card: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  label: {
    fontSize: 16,
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
    height: 100,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  pickerText: {
    fontSize: 16,
    color: '#333',
  },
  tagsScroll: {
    flexDirection: 'row',
    marginHorizontal: -4,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    marginHorizontal: 4,
    gap: 4,
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
    flex: 1,
  },
  filePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 20,
    backgroundColor: '#f8f9ff',
  },
  filePickerText: {
    fontSize: 16,
    color: '#007AFF',
    marginLeft: 8,
    fontWeight: '500',
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    padding: 12,
    backgroundColor: '#e8f5e8',
    borderRadius: 6,
  },
  fileInfoText: {
    flex: 1,
    marginLeft: 12,
  },
  fileName: {
    fontSize: 14,
    color: '#28a745',
    fontWeight: '500',
  },
  fileSize: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  removeFileButton: {
    marginLeft: 8,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
    paddingHorizontal: 16,
    backgroundColor: '#f5f5f5',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 40,
  },
  submitButton: {
    flex: 1,
    marginRight: 8,
  },
  resetButton: {
    flex: 1,
    marginLeft: 8,
  },
});

export default AjoutRessourceScreen;
