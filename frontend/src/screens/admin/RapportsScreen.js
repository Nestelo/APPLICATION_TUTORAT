import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView, ActivityIndicator, Linking, Platform, TouchableOpacity } from 'react-native';
import Header from '../../components/ui/Header';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../../config/api';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import { Ionicons } from '@expo/vector-icons';

const RapportsScreen = ({ navigation }) => {
  const [type, setType] = useState('utilisateurs');
  const [periode, setPeriode] = useState('mois');
  const [generating, setGenerating] = useState(false);
  const [rapportData, setRapportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mediaLibraryPermission, setMediaLibraryPermission] = useState(null);

  // Demander les permissions au chargement
  React.useEffect(() => {
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      setMediaLibraryPermission(status === 'granted');
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    setGenerating(true);
    try {
      const token = await AsyncStorage.getItem('accessToken');
      console.log('Token récupéré:', token ? 'Oui' : 'Non');
      
      if (!token) {
        Alert.alert('Erreur', 'Vous devez être connecté');
        return;
      }

      const endpoint = `${API_BASE_URL}/api/auth/rapports/${type}/?period=${periode}`;
      console.log('Endpoint appelé:', endpoint);
      
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Status response:', response.status);
      console.log('Response OK:', response.ok);

      if (response.ok) {
        const data = await response.json();
        console.log('Données reçues:', data);
        setRapportData(data);
        Alert.alert('Succès', `Rapport ${type} (${periode}) généré avec succès.`);
      } else {
        const errorText = await response.text();
        console.error('Erreur response:', errorText);
        
        let errorMessage = 'Échec de la génération du rapport';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          errorMessage = `Erreur ${response.status}: ${response.statusText}`;
        }
        
        Alert.alert('Erreur', errorMessage);
      }
    } catch (error) {
      console.error('Erreur rapport:', error);
      Alert.alert('Erreur', `Problème de connexion: ${error.message}`);
    } finally {
      setLoading(false);
      setGenerating(false);
    }
  };

  const handleExportFormat = async (format) => {
    if (!rapportData) {
      Alert.alert('Info', 'Générez d\'abord un rapport avant de l\'exporter');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('accessToken');
      const endpoint = `${API_BASE_URL}/api/auth/rapports/export/${type}/?period=${periode}&format=${format}`;
      
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        
        // Convert blob to base64
        const reader = new FileReader();
        reader.onload = async () => {
          const base64Data = reader.result.split(',')[1];
          
          const formatNames = {
            word: 'Word',
            pdf: 'PDF'
          };
          
          const extensions = {
            word: 'docx',
            pdf: 'pdf'
          };
          
          const fileName = `rapport_${type}_${periode}.${extensions[format]}`;
          
          // Créer le dossier de destination pour les rapports
          const directory = FileSystem.documentDirectory + 'rapports/';
          const dirInfo = await FileSystem.getInfoAsync(directory);
          if (!dirInfo.exists) {
            await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
          }
          
          const fileUri = directory + fileName;
          
          // Save file to document directory
          await FileSystem.writeAsStringAsync(fileUri, base64Data, {
            encoding: FileSystem.EncodingType.Base64,
          });
          
          // Télécharger automatiquement dans le gestionnaire de fichiers Android
          await handleDownloadFile(fileUri, fileName, format);
        };
        
        reader.readAsDataURL(blob);
      } else {
        const errorData = await response.json();
        Alert.alert('Erreur', errorData.error || `Échec de l'export ${format.toUpperCase()}`);
      }
    } catch (error) {
      console.error('Erreur export:', error);
      Alert.alert('Erreur', `Problème lors de l'export ${format.toUpperCase()}`);
    }
  };

  const handleOpenFile = async (fileUri) => {
    try {
      // Vérifier si le fichier existe
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (fileInfo.exists) {
        // Ouvrir le fichier avec le gestionnaire de fichiers natif
        await FileSystem.openDocumentAsync(fileUri, {
          type: FileSystem.openType.open,
        });
      } else {
        Alert.alert('Erreur', 'Le fichier n\'existe pas');
      }
    } catch (error) {
      console.error('Erreur ouverture fichier:', error);
      Alert.alert('Erreur', 'Impossible d\'ouvrir le fichier');
    }
  };

  const handleDownloadFile = async (fileUri, fileName, format) => {
    try {
      console.log('Téléchargement du fichier:', fileName);
      
      // Vérifier si le fichier existe
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (fileInfo.exists) {
        
        // Pour Android, essayer de sauvegarder dans le dossier Downloads
        if (Platform.OS === 'android') {
          try {
            // Créer une copie dans le dossier Downloads accessible
            const downloadsDir = FileSystem.documentDirectory + 'Downloads/';
            const downloadsDirInfo = await FileSystem.getInfoAsync(downloadsDir);
            if (!downloadsDirInfo.exists) {
              await FileSystem.makeDirectoryAsync(downloadsDir, { intermediates: true });
            }
            
            const downloadUri = downloadsDir + fileName;
            await FileSystem.copyAsync({
              from: fileUri,
              to: downloadUri
            });
            
            // Pour les fichiers PDF et Word, essayer de les rendre accessibles via MediaLibrary
            if (mediaLibraryPermission && (format === 'pdf' || format === 'word')) {
              try {
                const asset = await MediaLibrary.createAssetAsync(downloadUri);
                console.log('Fichier ajouté à la galerie:', asset);
              } catch (galleryError) {
                console.log('Impossible d\'ajouter à la galerie:', galleryError);
              }
            }
            
            Alert.alert(
              '✅ Rapport généré avec succès!',
              `Le fichier "${fileName}" a été téléchargé:\n\n📁 Dossier: Downloads\n📱 Format: ${format.toUpperCase()}\n\nVous pouvez le retrouver dans votre gestionnaire de fichiers.`,
              [
                {
                  text: '📂 Ouvrir le fichier',
                  onPress: () => handleOpenFile(downloadUri)
                },
                {
                  text: '📱 Partager',
                  onPress: () => handleShareFile(downloadUri, fileName, format)
                },
                {
                  text: '✅ OK',
                  style: 'default'
                }
              ]
            );
            
          } catch (androidError) {
            console.error('Erreur Android:', androidError);
            // Fallback: message simple avec emplacement du fichier
            Alert.alert(
              '✅ Rapport généré!',
              `Fichier "${fileName}" créé dans:\n${fileUri}\n\nVous pouvez l\'ouvrir depuis votre gestionnaire de fichiers.`,
              [
                {
                  text: '📂 Ouvrir',
                  onPress: () => handleOpenFile(fileUri)
                },
                {
                  text: '✅ OK'
                }
              ]
            );
          }
        } else {
          // Pour iOS et autres plateformes
          Alert.alert(
            '✅ Rapport généré!',
            `Le fichier "${fileName}" a été créé.\n\nFormat: ${format.toUpperCase()}\nEmplacement: Documents`,
            [
              {
                text: '📂 Ouvrir',
                onPress: () => handleOpenFile(fileUri)
              },
              {
                text: '📱 Partager',
                onPress: () => handleShareFile(fileUri, fileName, format)
              },
              {
                text: '✅ OK'
              }
            ]
          );
        }
      } else {
        Alert.alert('Erreur', 'Le fichier n\'existe pas');
      }
    } catch (error) {
      console.error('Erreur téléchargement fichier:', error);
      Alert.alert('Erreur', 'Impossible de télécharger le fichier dans le téléphone');
    }
  };

  const handleShareFile = async (fileUri, fileName, format) => {
    try {
      // Vérifier si le partage est disponible
      const isSharingAvailable = await Sharing.isAvailableAsync();
      
      if (isSharingAvailable) {
        await Sharing.shareAsync(fileUri, {
          title: `Rapport ${format.toUpperCase()}`,
          dialogTitle: `Partager le rapport ${format.toUpperCase()}`,
          mimeType: getMimeType(format),
        });
      } else {
        Alert.alert(
          'Partage non disponible',
          `Le partage n'est pas disponible sur cet appareil.\n\nLe fichier "${fileName}" est sauvegardé dans vos documents.\n\nVous pouvez le partager manuellement depuis votre gestionnaire de fichiers.`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Erreur partage fichier:', error);
      Alert.alert(
        'Erreur de partage',
        `Impossible de partager le fichier "${fileName}".\n\nLe fichier est sauvegardé dans vos documents.`,
        [{ text: 'OK' }]
      );
    }
  };

  const getMimeType = (format) => {
    const mimeTypes = {
      word: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      pdf: 'application/pdf'
    };
    return mimeTypes[format] || 'application/octet-stream';
  };

  const handleExport = async () => {
    handleExportFormat('csv');
  };

  const renderRapportContent = () => {
    if (!rapportData) return null;

    switch (type) {
      case 'utilisateurs':
        return renderUtilisateursRapport();
      case 'tutorat':
        return renderTutoratRapport();
      case 'ressources':
        return renderRessourcesRapport();
      case 'forum':
        return renderForumRapport();
      default:
        return null;
    }
  };

  const renderUtilisateursRapport = () => (
    <View style={styles.rapportContainer}>
      <Text style={styles.rapportTitle}>📊 Rapport Utilisateurs</Text>
      
      <View style={styles.statRow}>
        <Text style={styles.statLabel}>Total utilisateurs:</Text>
        <Text style={styles.statValue}>{rapportData.total_users}</Text>
      </View>
      
      <View style={styles.statRow}>
        <Text style={styles.statLabel}>Taux de croissance:</Text>
        <Text style={styles.statValue}>{rapportData.growth_rate}%</Text>
      </View>
      
      <View style={styles.statRow}>
        <Text style={styles.statLabel}>Taux d'activité:</Text>
        <Text style={styles.statValue}>{rapportData.activity_rate}%</Text>
      </View>

      <Text style={styles.subTitle}>Répartition par rôle:</Text>
      {rapportData.users_by_role?.map((item, index) => (
        <View key={index} style={styles.statRow}>
          <Text style={styles.statLabel}>{item.role}:</Text>
          <Text style={styles.statValue}>{item.count}</Text>
        </View>
      ))}
    </View>
  );

  const renderTutoratRapport = () => (
    <View style={styles.rapportContainer}>
      <Text style={styles.rapportTitle}>📚 Rapport Tutorat</Text>
      
      <View style={styles.statRow}>
        <Text style={styles.statLabel}>Total séances:</Text>
        <Text style={styles.statValue}>{rapportData.total_seances}</Text>
      </View>
      
      <View style={styles.statRow}>
        <Text style={styles.statLabel}>Taux de completion:</Text>
        <Text style={styles.statValue}>{rapportData.completion_rate}%</Text>
      </View>
      
      <View style={styles.statRow}>
        <Text style={styles.statLabel}>Satisfaction moyenne:</Text>
        <Text style={styles.statValue}>{rapportData.average_satisfaction}/5</Text>
      </View>

      <Text style={styles.subTitle}>Matières populaires:</Text>
      {rapportData.matieres_populaires?.slice(0, 5).map((item, index) => (
        <View key={index} style={styles.statRow}>
          <Text style={styles.statLabel}>{item.matiere}:</Text>
          <Text style={styles.statValue}>{item.count} séances</Text>
        </View>
      ))}
    </View>
  );

  const renderRessourcesRapport = () => (
    <View style={styles.rapportContainer}>
      <Text style={styles.rapportTitle}>📁 Rapport Ressources</Text>
      
      <View style={styles.statRow}>
        <Text style={styles.statLabel}>Total ressources:</Text>
        <Text style={styles.statValue}>{rapportData.total_ressources}</Text>
      </View>
      
      <View style={styles.statRow}>
        <Text style={styles.statLabel}>Ressources publiées:</Text>
        <Text style={styles.statValue}>{rapportData.published_ressources}</Text>
      </View>
      
      <View style={styles.statRow}>
        <Text style={styles.statLabel}>Total téléchargements:</Text>
        <Text style={styles.statValue}>{rapportData.total_downloads}</Text>
      </View>

      <Text style={styles.subTitle}>Plus téléchargées:</Text>
      {rapportData.most_downloaded?.slice(0, 5).map((item, index) => (
        <View key={index} style={styles.statRow}>
          <Text style={styles.statLabel} numberOfLines={1}>{item.titre}:</Text>
          <Text style={styles.statValue}>{item.nb_telechargements}</Text>
        </View>
      ))}
    </View>
  );

  const renderForumRapport = () => (
    <View style={styles.rapportContainer}>
      <Text style={styles.rapportTitle}>💬 Rapport Forum</Text>
      
      <View style={styles.statRow}>
        <Text style={styles.statLabel}>Total questions:</Text>
        <Text style={styles.statValue}>{rapportData.total_questions}</Text>
      </View>
      
      <View style={styles.statRow}>
        <Text style={styles.statLabel}>Questions résolues:</Text>
        <Text style={styles.statValue}>{rapportData.resolved_questions}</Text>
      </View>
      
      <View style={styles.statRow}>
        <Text style={styles.statLabel}>Taux de résolution:</Text>
        <Text style={styles.statValue}>{rapportData.resolution_rate}%</Text>
      </View>

      <Text style={styles.subTitle}>Plus vues:</Text>
      {rapportData.most_viewed?.slice(0, 5).map((item, index) => (
        <View key={index} style={styles.statRow}>
          <Text style={styles.statLabel} numberOfLines={1}>{item.titre}:</Text>
          <Text style={styles.statValue}>{item.nb_vues} vues</Text>
        </View>
      ))}
    </View>
  );

  return (
    <>
      <Header 
        title="Rapports" 
        showBack 
        onBackPress={() => navigation.goBack()}
        rightButton={{
          icon: 'download-outline',
          onPress: () => navigation.navigate('Downloads'),
          color: '#007AFF'
        }}
      />
      <ScrollView style={styles.container}>
        <Card>
          <Text style={styles.label}>Type de rapport</Text>
          <Picker selectedValue={type} onValueChange={setType} style={styles.picker}>
            <Picker.Item label="Utilisateurs" value="utilisateurs" />
            <Picker.Item label="Tutorat (séances)" value="tutorat" />
            <Picker.Item label="Ressources" value="ressources" />
            <Picker.Item label="Forum" value="forum" />
          </Picker>
          <Text style={styles.label}>Période</Text>
          <Picker selectedValue={periode} onValueChange={setPeriode} style={styles.picker}>
            <Picker.Item label="Ce mois" value="mois" />
            <Picker.Item label="Ce trimestre" value="trimestre" />
            <Picker.Item label="Cette année" value="annee" />
            <Picker.Item label="Tout" value="all" />
          </Picker>
          
          <View style={styles.buttonContainer}>
            <Button 
              title="Générer le rapport" 
              onPress={handleGenerate} 
              loading={generating} 
              style={styles.button} 
            />
          </View>

          {rapportData && (
            <>
              <Text style={styles.exportLabel}>📥 Exporter le rapport</Text>
              <View style={styles.exportButtonContainer}>
                <TouchableOpacity 
                  style={[styles.exportButton, styles.pdfButton]}
                  onPress={() => handleExportFormat('pdf')}
                >
                  <Ionicons name="document-text" size={20} color="#fff" />
                  <Text style={styles.exportButtonText}>PDF</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.exportButton, styles.wordButton]}
                  onPress={() => handleExportFormat('word')}
                >
                  <Ionicons name="document" size={20} color="#fff" />
                  <Text style={styles.exportButtonText}>Word</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.exportDescription}>
                Le rapport sera généré et téléchargé directement dans votre gestionnaire de fichiers Android.
              </Text>
            </>
          )}
        </Card>

        {loading && (
          <Card style={styles.loadingCard}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Génération du rapport en cours...</Text>
          </Card>
        )}

        {rapportData && !loading && (
          <Card>
            {renderRapportContent()}
          </Card>
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
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
    marginTop: 12,
  },
  picker: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  buttonContainer: {
    marginTop: 20,
    gap: 10,
  },
  button: {
    marginTop: 10,
  },
  exportLabel: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    marginTop: 20,
    textAlign: 'center',
    color: '#333',
  },
  exportDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  exportButtonContainer: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  exportButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pdfButton: {
    backgroundColor: '#dc3545',
  },
  wordButton: {
    backgroundColor: '#007bff',
  },
  exportButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  loadingCard: {
    alignItems: 'center',
    padding: 20,
    marginTop: 10,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  rapportContainer: {
    padding: 16,
  },
  rapportTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: '#333',
  },
  subTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    color: '#555',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  });

export default RapportsScreen;