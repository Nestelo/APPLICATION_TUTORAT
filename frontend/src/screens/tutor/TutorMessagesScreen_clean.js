import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, 
  ActivityIndicator, RefreshControl, TextInput, FlatList, Modal,
  Image, Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Header from '../../components/ui/Header';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import { API_BASE_URL } from '../../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const TutorMessagesScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState('toutes');
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [showNewConversationModal, setShowNewConversationModal] = useState(false);
  const [newConversationData, setNewConversationData] = useState({
    titre: '',
    description: '',
    type_conversation: 'individuelle',
    participants: [],
    tags: ''
  });
  const [availableUsers, setAvailableUsers] = useState([]);

  const [filters] = useState([
    { id: 'toutes', label: 'Toutes', icon: 'list-outline' },
    { id: 'non_lues', label: 'Non lues', icon: 'mail-unread-outline' },
    { id: 'etudiants', label: 'Étudiants', icon: 'people-outline' },
    { id: 'admin', label: 'Admin', icon: 'shield-outline' },
    { id: 'groupes', label: 'Groupes', icon: 'people-circle-outline' }
  ]);

  useEffect(() => {
    loadConversations();
    loadAvailableUsers();
  }, []);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('accessToken');
      
      let url = `${API_BASE_URL}/api/messagerie/conversations/mes_conversations/`;
      if (selectedFilter !== 'toutes') {
        url += `?filter=${selectedFilter}`;
      }
      
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setConversations(data);
      } else {
        throw new Error('Erreur lors du chargement');
      }
    } catch (error) {
      console.error('Erreur chargement conversations:', error);
      Alert.alert('Erreur', 'Impossible de charger vos messages');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableUsers = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}/api/accounts/users/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setAvailableUsers(data.results || data);
      }
    } catch (error) {
      console.error('Erreur chargement utilisateurs:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() && selectedFiles.length === 0) {
      Alert.alert('Erreur', 'Veuillez entrer un message ou ajouter un fichier');
      return;
    }

    try {
      setSendingMessage(true);
      const token = await AsyncStorage.getItem('accessToken');
      
      const formData = new FormData();
      formData.append('contenu', messageText);
      formData.append('conversation_id', selectedConversation.id);
      formData.append('type_message', 'texte');
      
      selectedFiles.forEach((file, index) => {
        formData.append(`fichiers`, {
          uri: file.uri,
          type: file.type,
          name: file.name
        });
      });

      const response = await fetch(`${API_BASE_URL}/api/messagerie/messages/envoyer_message/`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (response.ok) {
        Alert.alert('Succès', 'Message envoyé');
        setMessageText('');
        setSelectedFiles([]);
        loadConversations();
      } else {
        throw new Error('Erreur lors de l\'envoi');
      }
    } catch (error) {
      console.error('Erreur envoi message:', error);
      Alert.alert('Erreur', 'Impossible d\'envoyer votre message');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleCreateConversation = async () => {
    if (!newConversationData.titre.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un titre');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('accessToken');
      
      const response = await fetch(`${API_BASE_URL}/api/messagerie/conversations/creer_conversation/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newConversationData)
      });

      if (response.ok) {
        Alert.alert('Succès', 'Conversation créée');
        setShowNewConversationModal(false);
        setNewConversationData({
          titre: '',
          description: '',
          type_conversation: 'individuelle',
          participants: [],
          tags: ''
        });
        loadConversations();
      } else {
        throw new Error('Erreur lors de la création');
      }
    } catch (error) {
      console.error('Erreur création conversation:', error);
      Alert.alert('Erreur', 'Impossible de créer la conversation');
    }
  };

  const handleMarkAsRead = async (conversationId) => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      await fetch(`${API_BASE_URL}/api/messagerie/conversations/${conversationId}/marquer_lue/`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      loadConversations();
    } catch (error) {
      console.error('Erreur marquage lu:', error);
    }
  };

  const handleFilePick = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsMultipleSelection: true,
        quality: 0.8
      });

      if (!result.canceled) {
        const files = result.assets || [result];
        setSelectedFiles([...selectedFiles, ...files]);
      }
    } catch (error) {
      console.error('Erreur sélection fichier:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner les fichiers');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadConversations();
    setRefreshing(false);
  };

  const getFilterIcon = (filterId) => {
    const filter = filters.find(f => f.id === filterId);
    return filter ? filter.icon : 'list-outline';
  };

  const renderConversation = ({ item }) => (
    <TouchableOpacity
      style={styles.conversationCard}
      onPress={() => {
        setSelectedConversation(item);
        setShowComposeModal(true);
        handleMarkAsRead(item.id);
      }}
    >
      <View style={styles.conversationHeader}>
        <View style={styles.conversationInfo}>
          <Text style={styles.conversationTitle}>{item.titre}</Text>
          <View style={styles.conversationMeta}>
            <Ionicons 
              name={getFilterIcon(item.type_conversation)} 
              size={14} 
              color="#666" 
            />
            <Text style={styles.conversationType}>
              {item.type_conversation}
            </Text>
            {item.nb_messages_non_lus > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadCount}>{item.nb_messages_non_lus}</Text>
              </View>
            )}
          </View>
        </View>
        <View style={styles.conversationTime}>
          <Text style={styles.timeText}>
            {item.dernier_message ? 
              new Date(item.dernier_message).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 
              'Aucun message'
            }
          </Text>
        </View>
      </View>

      {item.participants && item.participants.length > 0 && (
        <View style={styles.participantsList}>
          {item.participants.slice(0, 3).map((participant, index) => (
            <View key={participant.id} style={styles.participantAvatar}>
              <Text style={styles.participantInitial}>
                {participant.nom ? participant.nom[0] : participant.email[0].toUpperCase()}
              </Text>
            </View>
          ))}
          {item.participants.length > 3 && (
            <Text style={styles.moreParticipants}>
              +{item.participants.length - 3}
            </Text>
          )}
        </View>
      )}

      {item.dernier_message && (
        <View style={styles.lastMessage}>
          <Text style={styles.lastMessageText} numberOfLines={2}>
            {item.dernier_message.contenu}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderUser = ({ item }) => (
    <TouchableOpacity
      style={styles.userItem}
      onPress={() => {
        if (!newConversationData.participants.includes(item.id)) {
          setNewConversationData({
            ...newConversationData,
            participants: [...newConversationData.participants, item.id]
          });
        }
      }}
    >
      <View style={styles.userAvatar}>
        <Text style={styles.userInitial}>
          {item.nom ? item.nom[0] : item.email[0].toUpperCase()}
        </Text>
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>
          {item.prenom} {item.nom}
        </Text>
        <Text style={styles.userRole}>{item.role}</Text>
      </View>
      {newConversationData.participants.includes(item.id) && (
        <Ionicons name="checkmark-circle" size={20} color="#28a745" />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Header
        title="Messagerie"
        showBack
        navigation={navigation}
        rightActions={[
          {
            icon: 'create-outline',
            onPress: () => setShowNewConversationModal(true)
          },
          {
            icon: 'search-outline',
            onPress: () => setSearchText('')
          }
        ]}
      />

      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter.id}
              style={[
                styles.filterChip,
                selectedFilter === filter.id && styles.activeFilter
              ]}
              onPress={() => {
                setSelectedFilter(filter.id);
              }}
            >
              <Ionicons 
                name={filter.icon} 
                size={16} 
                color={selectedFilter === filter.id ? '#fff' : '#666'} 
              />
              <Text style={[
                styles.filterText,
                selectedFilter === filter.id && styles.activeFilterText
              ]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <FlatList
          data={conversations.filter(conv => 
            conv.titre.toLowerCase().includes(searchText.toLowerCase()) ||
            conv.participants?.some(p => 
              p.nom?.toLowerCase().includes(searchText.toLowerCase()) ||
              p.email?.toLowerCase().includes(searchText.toLowerCase())
            )
          )}
          renderItem={renderConversation}
          keyExtractor={(item) => item.id.toString()}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <EmptyState
              icon="mail-outline"
              message="Aucune conversation trouvée"
              submessage="Commencez une nouvelle conversation"
            />
          }
          contentContainerStyle={styles.listContainer}
        />
      )}

      {/* Modal de composition */}
      <Modal
        visible={showComposeModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowComposeModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {selectedConversation?.titre || 'Nouvelle conversation'}
            </Text>
            <TouchableOpacity onPress={() => setShowComposeModal(false)}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.messageContainer}>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.messageInput}
                multiline
                placeholder="Tapez votre message..."
                value={messageText}
                onChangeText={setMessageText}
                textAlignVertical="top"
              />
              
              <View style={styles.inputActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={handleFilePick}
                >
                  <Ionicons name="attach-outline" size={20} color="#007bff" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.sendButton]}
                  onPress={handleSendMessage}
                  disabled={sendingMessage}
                >
                  {sendingMessage ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Ionicons name="send-outline" size={20} color="#fff" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {selectedFiles.length > 0 && (
              <View style={styles.filesContainer}>
                <Text style={styles.filesTitle}>Fichiers joints:</Text>
                {selectedFiles.map((file, index) => (
                  <View key={index} style={styles.fileItem}>
                    <Ionicons name="document-text" size={16} color="#666" />
                    <Text style={styles.fileName}>{file.name}</Text>
                    <TouchableOpacity
                      onPress={() => setSelectedFiles(selectedFiles.filter((_, i) => i !== index))}
                    >
                      <Ionicons name="close-circle" size={16} color="#e74c3c" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Modal nouvelle conversation */}
      <Modal
        visible={showNewConversationModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowNewConversationModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Nouvelle conversation</Text>
            <TouchableOpacity onPress={() => setShowNewConversationModal(false)}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Titre *</Text>
              <TextInput
                style={styles.input}
                value={newConversationData.titre}
                onChangeText={(text) => setNewConversationData({...newConversationData, titre: text})}
                placeholder="Titre de la conversation"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Participants</Text>
              <FlatList
                data={availableUsers}
                renderItem={renderUser}
                keyExtractor={(item) => item.id.toString()}
                style={styles.usersList}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Tags</Text>
              <TextInput
                style={styles.input}
                value={newConversationData.tags}
                onChangeText={(text) => setNewConversationData({...newConversationData, tags: text})}
                placeholder="Tags séparés par des virgules"
              />
            </View>
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setShowNewConversationModal(false)}
            >
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.createButton]}
              onPress={handleCreateConversation}
            >
              <Text style={styles.createButtonText}>Créer</Text>
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
    backgroundColor: '#f5f5f5',
  },
  filterContainer: {
    backgroundColor: '#fff',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  activeFilter: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
  },
  filterText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#666',
  },
  activeFilterText: {
    color: '#fff',
  },
  listContainer: {
    padding: 16,
  },
  conversationCard: {
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
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  conversationInfo: {
    flex: 1,
    marginRight: 12,
  },
  conversationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  conversationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  conversationType: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  unreadBadge: {
    backgroundColor: '#e74c3c',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  unreadCount: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  conversationTime: {
    alignItems: 'flex-end',
  },
  timeText: {
    fontSize: 12,
    color: '#666',
  },
  participantsList: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  participantAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#007bff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: -8,
    borderWidth: 2,
    borderColor: '#fff',
  },
  participantInitial: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  moreParticipants: {
    fontSize: 10,
    color: '#666',
    marginLeft: 4,
  },
  lastMessage: {
    backgroundColor: '#f8f9fa',
    padding: 8,
    borderRadius: 6,
  },
  lastMessageText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 18,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  messageContainer: {
    flex: 1,
  },
  inputContainer: {
    flexDirection: 'column',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
  },
  messageInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  inputActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  actionButton: {
    padding: 8,
    borderRadius: 6,
  },
  sendButton: {
    backgroundColor: '#007bff',
  },
  filesContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  filesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#fff',
    borderRadius: 6,
    marginBottom: 6,
  },
  fileName: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
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
  usersList: {
    maxHeight: 200,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007bff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userInitial: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  userRole: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  modalActions: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  createButton: {
    backgroundColor: '#007bff',
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default TutorMessagesScreen;
