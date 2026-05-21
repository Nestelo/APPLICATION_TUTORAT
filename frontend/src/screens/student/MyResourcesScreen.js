import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  FlatList,
  Dimensions,
  SafeAreaView,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { API_BASE_URL } from '../../config/api';

const { width } = Dimensions.get('window');

const MyResourcesScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('received');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [students, setStudents] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  
  const [receivedResources, setReceivedResources] = useState([]);
  const [sentResources, setSentResources] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadReceivedResources(),
        loadSentResources(),
        loadStudents()
      ]);
    } catch (error) {
      console.error('Erreur chargement données:', error);
      Alert.alert('Erreur', 'Impossible de charger vos ressources');
    } finally {
      setLoading(false);
    }
  };

  const loadReceivedResources = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}/api/ressources/partages/recus/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setReceivedResources(data);
      } else {
        console.warn('Erreur chargement ressources reçues:', response.status);
      }
    } catch (error) {
      console.error('Erreur loadReceivedResources:', error);
    }
  };

  const loadSentResources = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}/api/ressources/partages/envoyes/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSentResources(data);
      } else {
        console.warn('Erreur chargement ressources envoyées:', response.status);
      }
    } catch (error) {
      console.error('Erreur loadSentResources:', error);
    }
  };

  const loadStudents = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}/api/ressources/etudiants/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStudents(data);
      } else {
        console.warn('Erreur chargement étudiants:', response.status);
      }
    } catch (error) {
      console.error('Erreur loadStudents:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const selectFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['*/*'],
        multiple: false
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setSelectedFile(result.assets[0]);
      }
    } catch (error) {
      console.error('Erreur sélection fichier:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner ce fichier');
    }
  };

  const shareResource = async () => {
    if (!selectedFile) {
      Alert.alert('Erreur', 'Veuillez sélectionner un fichier');
      return;
    }

    if (!selectedStudent) {
      Alert.alert('Erreur', 'Veuillez sélectionner un étudiant destinataire');
      return;
    }

    try {
      setUploading(true);

      // D'abord créer la ressource globale
      const resourceFormData = new FormData();
      resourceFormData.append('titre', selectedFile.name);
      resourceFormData.append('type_fichier', getFileType(selectedFile.name));
      resourceFormData.append('fichier', {
        uri: selectedFile.uri,
        type: selectedFile.mimeType || 'application/octet-stream',
        name: selectedFile.name
      });
      resourceFormData.append('statut', 'en_attente');
      resourceFormData.append('description', '');

      const token = await AsyncStorage.getItem('accessToken');
      
      // Créer la ressource
      const resourceResponse = await fetch(`${API_BASE_URL}/api/ressources/ressources/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        },
        body: resourceFormData
      });

      if (!resourceResponse.ok) {
        const errorData = await resourceResponse.json();
        throw new Error(errorData.detail || 'Erreur lors de la création de la ressource');
      }

      const resourceData = await resourceResponse.json();
      
      // Ensuite créer le partage
      const shareData = {
        ressource: resourceData.id,
        destinataire: selectedStudent.id,
        commentaire: message.trim() || ''
      };

      const shareResponse = await fetch(`${API_BASE_URL}/api/ressources/partager/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(shareData)
      });

      if (shareResponse.ok) {
        Alert.alert('Succès', 'Ressource partagée avec succès!');
        setShowShareModal(false);
        setSelectedFile(null);
        setSelectedStudent(null);
        setMessage('');
        await loadSentResources();
      } else {
        const errorData = await shareResponse.json();
        throw new Error(errorData.error || 'Erreur lors du partage');
      }
    } catch (error) {
      console.error('Erreur partage ressource:', error);
      Alert.alert('Erreur', `Impossible de partager la ressource: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const downloadResource = async (resource) => {
    try {
      if (!resource.fichier) {
        Alert.alert('Erreur', 'Aucun fichier disponible pour cette ressource');
        return;
      }

      // Créer le dossier de destination
      const directory = FileSystem.documentDirectory + 'my_resources/received/';
      const dirInfo = await FileSystem.getInfoAsync(directory);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
      }

      // Nettoyer le nom du fichier
      const fileName = resource.titre
        .replace(/[^a-z0-9]/gi, '_')
        .toLowerCase() + '.' + getFileExtension(resource.fichier);
      
      const fileUri = directory + fileName;

      // Vérifier si le fichier existe déjà
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (fileInfo.exists) {
        Alert.alert(
          'Fichier existant',
          'Ce fichier existe déjà. Voulez-vous le remplacer ?',
          [
            { text: 'Annuler', style: 'cancel' },
            { 
              text: 'Remplacer', 
              onPress: async () => {
                await performDownload(resource.fichier, fileUri, fileName);
              }
            }
          ]
        );
      } else {
        await performDownload(resource.fichier, fileUri, fileName);
      }
    } catch (error) {
      console.error('Erreur téléchargement:', error);
      Alert.alert('Erreur', 'Impossible de télécharger le fichier');
    }
  };

  const performDownload = async (fileUrl, fileUri, fileName) => {
    try {
      // Télécharger le fichier
      const downloadResult = await FileSystem.downloadAsync(fileUrl, fileUri);

      if (downloadResult.status === 200) {
        Alert.alert(
          'Succès',
          `Fichier "${fileName}" téléchargé avec succès!`,
          [
            { text: 'OK', style: 'default' },
            { 
              text: 'Partager', 
              onPress: () => Sharing.shareAsync(downloadResult.uri, {
                dialogTitle: `Partager ${fileName}`
              })
            },
            { 
              text: 'Ouvrir', 
              onPress: () => Sharing.shareAsync(downloadResult.uri, {
                mimeType: 'application/octet-stream',
                dialogTitle: `Ouvrir ${fileName}`
              })
            }
          ]
        );
      } else {
        throw new Error('Échec du téléchargement');
      }
    } catch (error) {
      console.error('Erreur téléchargement:', error);
      Alert.alert('Erreur', 'Impossible de télécharger le fichier');
    }
  };

  const shareResourceExternally = async (resource) => {
    try {
      if (!resource.fichier) {
        Alert.alert('Erreur', 'Aucun fichier disponible pour cette ressource');
        return;
      }

      // Partager directement l'URL du fichier
      await Sharing.shareAsync(resource.fichier, {
        mimeType: 'application/octet-stream',
        dialogTitle: `Partager ${resource.titre}`
      });
    } catch (error) {
      console.error('Erreur partage:', error);
      Alert.alert('Erreur', 'Impossible de partager cette ressource');
    }
  };

  const getFileType = (fileName) => {
    const extension = getFileExtension(fileName).toLowerCase();
    const typeMap = {
      'pdf': 'pdf',
      'doc': 'document',
      'docx': 'document',
      'jpg': 'image',
      'jpeg': 'image',
      'png': 'image',
      'gif': 'image',
      'mp4': 'video',
      'avi': 'video',
      'mov': 'video',
      'mp3': 'audio',
      'wav': 'audio'
    };
    return typeMap[extension] || 'document';
  };

  const getFileExtension = (url) => {
    return url.split('.').pop().split('?')[0];
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'validee': return '#27ae60';
      case 'en_attente': return '#f39c12';
      case 'rejetee': return '#e74c3c';
      default: return '#666';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'validee': return 'Validée - Visible par tous';
      case 'en_attente': return 'En attente de validation';
      case 'rejetee': return 'Rejetée par l\'admin';
      default: return status;
    }
  };

  const viewResourceDetails = (item) => {
    const resource = item.ressource_details;
    const details = `
📄 ${resource.titre}

📋 Informations :
• Type : ${resource.type_display}
• Date de partage : ${item.date_partage}
• Statut : ${item.est_lue ? 'Lu' : 'Non lu'}

👤 Expéditeur :
• Nom : ${item.expediteur_details.prenom} ${item.expediteur_details.nom}
• Email : ${item.expediteur_details.email}
• Filière : ${item.expediteur_details.filiere || 'Non spécifiée'}
• Niveau : ${item.expediteur_details.annee || 'Non spécifié'}

💬 Message personnel :
${item.commentaire || 'Aucun message personnel'}

📎 Fichier :
${resource.fichier ? '✅ Disponible' : '❌ Non disponible'}

📝 Description :
${resource.description || 'Aucune description'}

🏷️ Tags :
${resource.tags || 'Aucun tag'}
    `.trim();

    Alert.alert(
      '📋 Détails de la ressource',
      details,
      [
        { text: 'Fermer', style: 'default' },
        resource.fichier ? { 
          text: 'Télécharger', 
          onPress: () => downloadResource(resource) 
        } : null,
        resource.fichier ? { 
          text: 'Partager', 
          onPress: () => shareResourceExternally(resource) 
        } : null
      ].filter(Boolean)
    );
  };

  const renderReceivedItem = ({ item, key }) => {
    const resource = item.ressource_details;
    return (
      <View key={key} style={styles.resourceItem}>
        <View style={styles.resourceHeader}>
          <View style={styles.resourceInfo}>
            <Text style={styles.resourceTitle}>{resource.titre}</Text>
            <Text style={styles.resourceMeta}>
              {resource.type_display} • {item.date_partage}
            </Text>
            <Text style={styles.resourceAuthor}>
              De {item.expediteur_details.prenom} {item.expediteur_details.nom}
            </Text>
          </View>
          <View style={styles.statusContainer}>
            <View style={[
              styles.statusBadge,
              item.est_lue ? styles.statusRead : styles.statusUnread
            ]}>
              <Text style={styles.statusText}>
                {item.est_lue ? 'Lu' : 'Non lu'}
              </Text>
            </View>
          </View>
        </View>
        
        <View style={styles.resourceActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => downloadResource(resource)}
          >
            <Ionicons name="download-outline" size={20} color="#007AFF" />
            <Text style={styles.actionText}>Télécharger</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => viewResourceDetails(item)}
          >
            <Ionicons name="eye-outline" size={20} color="#34C759" />
            <Text style={styles.actionText}>Voir</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderSentItem = ({ item, key }) => (
    <View key={key} style={styles.resourceCard}>
      <View style={styles.resourceHeader}>
        <View style={styles.resourceInfo}>
          <Text style={styles.resourceTitle}>{item.ressource_details?.titre || 'Titre non disponible'}</Text>
          <Text style={styles.resourceMeta}>
            À: {item.destinataire_details?.prenom || ''} {item.destinataire_details?.nom || 'Destinataire inconnu'}
          </Text>
          <Text style={styles.resourceDate}>
            {new Date(item.date_partage).toLocaleDateString('fr-FR')} à {new Date(item.date_partage).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
        <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(item.statut_validation) }]}>
          <Ionicons 
            name={
              item.statut_validation === 'validee' ? 'checkmark-circle' :
              item.statut_validation === 'en_attente' ? 'time' :
              'close-circle'
            } 
            size={12} 
            color="#fff" 
          />
        </View>
      </View>
      
      {item.commentaire && (
        <Text style={styles.resourceComment}>Message: {item.commentaire}</Text>
      )}
      
      <View style={styles.resourceType}>
        <Text style={styles.typeBadge}>{item.ressource_details?.type_fichier?.toUpperCase() || 'FILE'}</Text>
        <Text style={[styles.statusText, { color: getStatusColor(item.statut_validation) }]}>
          {getStatusText(item.statut_validation)}
        </Text>
      </View>
      
      <View style={styles.resourceActions}>
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={() => Alert.alert('Détails', `Titre: ${item.ressource_details?.titre || 'Titre non disponible'}\n${item.commentaire ? `Message: ${item.commentaire}\n` : ''}Statut: ${getStatusText(item.statut_validation)}`)}
        >
          <Ionicons name="eye-outline" size={20} color="#3498db" />
          <Text style={styles.actionText}>Voir détails</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStudentItem = ({ item, key }) => (
    <TouchableOpacity
      key={key}
      style={[
        styles.studentItem,
        selectedStudent?.id === item.id ? styles.selectedStudentItem : null
      ]}
      onPress={() => setSelectedStudent(item)}
    >
      <View style={styles.studentInfo}>
        {item.photo_url ? (
          <Image source={{ uri: item.photo_url }} style={styles.studentPhoto} />
        ) : (
          <View style={styles.studentPhotoPlaceholder}>
            <Ionicons name="person-outline" size={24} color="#ccc" />
          </View>
        )}
        <View style={styles.studentDetails}>
          <Text style={styles.studentName}>
            {item.prenom} {item.nom}
          </Text>
          <Text style={styles.studentInfo}>
            {item.filiere} • {item.annee}
          </Text>
        </View>
      </View>
      {selectedStudent?.id === item.id && (
        <Ionicons name="checkmark-circle" size={24} color="#007AFF" />
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Chargement des ressources...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Resources</Text>
        <TouchableOpacity onPress={() => setShowShareModal(true)}>
          <Ionicons name="add-circle-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Onglets */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'received' && styles.activeTab]}
          onPress={() => setActiveTab('received')}
        >
          <Text style={[styles.tabText, activeTab === 'received' && styles.activeTabText]}>
            Reçues {receivedResources.length > 0 && `(${receivedResources.length})`}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'sent' && styles.activeTab]}
          onPress={() => setActiveTab('sent')}
        >
          <Text style={[styles.tabText, activeTab === 'sent' && styles.activeTabText]}>
            Envoyées {sentResources.length > 0 && `(${sentResources.length})`}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Contenu */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {activeTab === 'received' ? (
          receivedResources.length === 0 ? (
            <View key="empty-received" style={styles.emptyContainer}>
              <Ionicons name="download-outline" size={60} color="#ccc" />
              <Text style={styles.emptyText}>Aucune ressource reçue</Text>
              <Text style={styles.emptySubtext}>
                Les ressources partagées avec vous apparaîtront ici
              </Text>
            </View>
          ) : (
            receivedResources.map((item) => renderReceivedItem({ item, key: item.id }))
          )
        ) : (
          sentResources.length === 0 ? (
            <View key="empty-sent" style={styles.emptyContainer}>
              <Ionicons name="send-outline" size={60} color="#ccc" />
              <Text style={styles.emptyText}>Aucune ressource envoyée</Text>
              <Text style={styles.emptySubtext}>
                Utilisez le bouton + pour partager un document
              </Text>
            </View>
          ) : (
            sentResources.map((item) => renderSentItem({ item, key: item.id }))
          )
        )}
      </ScrollView>

      {/* Modal de partage */}
      <Modal
        visible={showShareModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowShareModal(false)}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Partager une ressource</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Sélection du fichier */}
            <TouchableOpacity style={styles.fileSelector} onPress={selectFile}>
              <Ionicons name="document-outline" size={40} color="#007AFF" />
              <Text style={styles.fileSelectorText}>
                {selectedFile ? selectedFile.name : 'Sélectionner un fichier'}
              </Text>
            </TouchableOpacity>

            {/* Liste des étudiants */}
            <Text style={styles.sectionTitle}>Étudiant destinataire</Text>
            <View style={styles.studentsList}>
              {students.length === 0 ? (
                <Text key="empty-students" style={styles.emptyListText}>Aucun étudiant disponible</Text>
              ) : (
                students.map((item) => renderStudentItem({ item, key: item.id }))
              )}
            </View>

            {/* Message optionnel */}
            <Text style={styles.sectionTitle}>Message (optionnel)</Text>
            <TextInput
              style={styles.messageInput}
              placeholder="Ajoutez un message pour le destinataire..."
              value={message}
              onChangeText={setMessage}
              multiline
              maxLength={200}
            />
          </ScrollView>

          {/* Boutons d'action */}
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={() => setShowShareModal(false)}
            >
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.sendButton, (!selectedFile || !selectedStudent || uploading) && styles.disabledButton]}
              onPress={shareResource}
              disabled={!selectedFile || !selectedStudent || uploading}
            >
              {uploading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.sendButtonText}>Envoyer</Text>
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#4A90E2',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#4A90E2',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    color: '#4A90E2',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  resourceCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resourceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  resourceInfo: {
    flex: 1,
  },
  resourceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  resourceMeta: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  resourceDate: {
    fontSize: 12,
    color: '#999',
  },
  statusIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resourceDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  resourceComment: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  resourceType: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeBadge: {
    backgroundColor: '#e3f2fd',
    color: '#1976d2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    fontSize: 12,
    fontWeight: 'bold',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  resourceActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
  },
  actionText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  fileSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderWidth: 2,
    borderColor: '#4A90E2',
    borderStyle: 'dashed',
    borderRadius: 12,
    marginBottom: 20,
  },
  fileSelectorText: {
    marginLeft: 16,
    fontSize: 16,
    color: '#4A90E2',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  studentsList: {
    maxHeight: 2000,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 20,
  },
  studentItem: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedStudentItem: {
    borderColor: '#4A90E2',
    backgroundColor: '#e3f2fd',
  },
  studentName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  studentInfo: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  emptyListText: {
    textAlign: 'center',
    color: '#999',
    fontStyle: 'italic',
  },
  messageInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingVertical: 12,
  },
  cancelButtonText: {
    textAlign: 'center',
    color: '#666',
    fontWeight: 'bold',
  },
  sendButton: {
    flex: 1,
    backgroundColor: '#4A90E2',
    paddingVertical: 12,
  },
  sendButtonText: {
    textAlign: 'center',
    color: '#fff',
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
});

export default MyResourcesScreen;
