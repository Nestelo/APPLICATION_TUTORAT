import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, ActivityIndicator } from 'react-native';
import Header from '../../components/ui/Header';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { Ionicons } from '@expo/vector-icons';

const DownloadsScreen = ({ navigation }) => {
  const [downloadedFiles, setDownloadedFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDownloadedFiles();
  }, []);

  const loadDownloadedFiles = async () => {
    try {
      const files = await AsyncStorage.getItem('downloadedFiles') || '[]';
      const filesArray = JSON.parse(files);
      setDownloadedFiles(filesArray.reverse()); // Plus récents en premier
    } catch (error) {
      console.error('Erreur chargement fichiers:', error);
      Alert.alert('Erreur', 'Impossible de charger les fichiers téléchargés');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenFile = async (fileUri, fileName) => {
    try {
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (fileInfo.exists) {
        await FileSystem.openDocumentAsync(fileUri, {
          type: FileSystem.openType.open,
        });
      } else {
        Alert.alert('Erreur', 'Le fichier n\'existe plus');
        // Supprimer le fichier de la liste s'il n'existe plus
        await removeFileFromList(fileName);
      }
    } catch (error) {
      console.error('Erreur ouverture fichier:', error);
      Alert.alert('Erreur', 'Impossible d\'ouvrir le fichier');
    }
  };

  const handleDeleteFile = async (fileName) => {
    Alert.alert(
      'Supprimer le fichier',
      `Voulez-vous vraiment supprimer "${fileName}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              // Trouver le fichier dans la liste
              const file = downloadedFiles.find(f => f.fileName === fileName);
              if (file) {
                // Supprimer le fichier physique
                await FileSystem.deleteAsync(file.fileUri);
                // Supprimer de la liste
                await removeFileFromList(fileName);
                Alert.alert('Succès', 'Fichier supprimé avec succès');
              }
            } catch (error) {
              console.error('Erreur suppression fichier:', error);
              Alert.alert('Erreur', 'Impossible de supprimer le fichier');
            }
          }
        }
      ]
    );
  };

  const removeFileFromList = async (fileName) => {
    try {
      const files = await AsyncStorage.getItem('downloadedFiles') || '[]';
      const filesArray = JSON.parse(files);
      const updatedFiles = filesArray.filter(f => f.fileName !== fileName);
      await AsyncStorage.setItem('downloadedFiles', JSON.stringify(updatedFiles));
      setDownloadedFiles(updatedFiles);
    } catch (error) {
      console.error('Erreur suppression liste:', error);
    }
  };

  const handleClearAll = () => {
    if (downloadedFiles.length === 0) {
      Alert.alert('Info', 'Aucun fichier à supprimer');
      return;
    }

    Alert.alert(
      'Tout supprimer',
      'Voulez-vous vraiment supprimer tous les fichiers téléchargés ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Tout supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              // Supprimer tous les fichiers physiques
              for (const file of downloadedFiles) {
                try {
                  await FileSystem.deleteAsync(file.fileUri);
                } catch (error) {
                  console.log(`Fichier déjà supprimé: ${file.fileName}`);
                }
              }
              // Vider la liste
              await AsyncStorage.setItem('downloadedFiles', '[]');
              setDownloadedFiles([]);
              Alert.alert('Succès', 'Tous les fichiers ont été supprimés');
            } catch (error) {
              console.error('Erreur suppression totale:', error);
              Alert.alert('Erreur', 'Impossible de supprimer tous les fichiers');
            }
          }
        }
      ]
    );
  };

  const getFormatIcon = (format) => {
    const icons = {
      csv: 'document-text-outline',
      excel: 'grid-outline',
      word: 'document-outline',
      pdf: 'document-text-outline',
      powerpoint: 'easel-outline'
    };
    return icons[format] || 'document-outline';
  };

  const getFormatColor = (format) => {
    const colors = {
      csv: '#28a745',
      excel: '#17a2b8',
      word: '#007bff',
      pdf: '#dc3545',
      powerpoint: '#ff6b35'
    };
    return colors[format] || '#666';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <>
        <Header title="Téléchargements" showBack onBackPress={() => navigation.goBack()} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Chargement des fichiers...</Text>
        </View>
      </>
    );
  }

  return (
    <>
      <Header title="Téléchargements" showBack onBackPress={() => navigation.goBack()} />
      <ScrollView style={styles.container}>
        {downloadedFiles.length > 0 && (
          <Card style={styles.headerCard}>
            <View style={styles.headerInfo}>
              <Text style={styles.headerTitle}>📁 {downloadedFiles.length} fichier(s)</Text>
              <Button 
                title="Tout supprimer" 
                onPress={handleClearAll}
                style={styles.clearButton}
                textStyle={styles.clearButtonText}
              />
            </View>
          </Card>
        )}

        {downloadedFiles.length === 0 ? (
          <Card style={styles.emptyCard}>
            <View style={styles.emptyContainer}>
              <Ionicons name="folder-open-outline" size={60} color="#ccc" />
              <Text style={styles.emptyTitle}>Aucun fichier téléchargé</Text>
              <Text style={styles.emptyText}>
                Exportez des rapports depuis l'écran des rapports pour les voir ici
              </Text>
              <Button 
                title="Aller aux rapports" 
                onPress={() => navigation.navigate('Rapports')}
                style={styles.goToButton}
              />
            </View>
          </Card>
        ) : (
          downloadedFiles.map((file, index) => (
            <Card key={index} style={styles.fileCard}>
              <View style={styles.fileHeader}>
                <View style={styles.fileInfo}>
                  <Ionicons 
                    name={getFormatIcon(file.format)} 
                    size={24} 
                    color={getFormatColor(file.format)} 
                  />
                  <View style={styles.fileDetails}>
                    <Text style={styles.fileName}>{file.fileName}</Text>
                    <Text style={styles.fileMeta}>
                      {file.type.charAt(0).toUpperCase() + file.type.slice(1)} • {file.period}
                    </Text>
                    <Text style={styles.fileDate}>{formatDate(file.downloadDate)}</Text>
                  </View>
                </View>
              </View>
              <View style={styles.fileActions}>
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => handleOpenFile(file.fileUri, file.fileName)}
                >
                  <Ionicons name="open-outline" size={20} color="#007AFF" />
                  <Text style={styles.actionText}>Ouvrir</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => handleDeleteFile(file.fileName)}
                >
                  <Ionicons name="trash-outline" size={20} color="#dc3545" />
                  <Text style={[styles.actionText, styles.deleteText]}>Supprimer</Text>
                </TouchableOpacity>
              </View>
            </Card>
          ))
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
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  headerCard: {
    marginBottom: 16,
  },
  headerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  clearButton: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  clearButtonText: {
    color: '#fff',
    fontSize: 12,
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
    marginBottom: 24,
    lineHeight: 20,
  },
  goToButton: {
    backgroundColor: '#007AFF',
  },
  fileCard: {
    marginBottom: 12,
  },
  fileHeader: {
    marginBottom: 12,
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fileDetails: {
    marginLeft: 12,
    flex: 1,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  fileMeta: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  fileDate: {
    fontSize: 12,
    color: '#999',
  },
  fileActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    backgroundColor: '#f8f9fa',
    flex: 1,
    marginHorizontal: 4,
    justifyContent: 'center',
  },
  deleteButton: {
    backgroundColor: '#fff5f5',
  },
  actionText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
  },
  deleteText: {
    color: '#dc3545',
  },
});

export default DownloadsScreen;
