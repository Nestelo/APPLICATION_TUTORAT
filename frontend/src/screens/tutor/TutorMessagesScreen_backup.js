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
      
      // Ajouter les fichiers
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

  const handleAddParticipant = (userId) => {
    if (!newConversationData.participants.includes(userId)) {
      setNewConversationData({
        ...newConversationData,
        participants: [...newConversationData.participants, userId]
      });
    }
  };

  const handleRemoveParticipant = (userId) => {
    setNewConversationData({
      ...newConversationData,
      participants: newConversationData.participants.filter(id => id !== userId)
    });
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

      {item.est_archivee && (
        <View style={styles.archivedBadge}>
          <Ionicons name="archive-outline" size={12} color="#666" />
          <Text style={styles.archivedText}>Archivée</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderUser = ({ item }) => (
    <TouchableOpacity
      style={styles.userItem}
      onPress={() => handleAddParticipant(item.id)}
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

      {/* Barre de recherche */}
      {searchText !== null && (
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher une conversation..."
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>
      )}

      {/* Filtres */}
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
            {/* Messages existants */}
            {selectedConversation?.dernier_message && (
              <View style={styles.existingMessage}>
                <Text style={styles.existingMessageText}>
                  {selectedConversation.dernier_message.contenu}
                </Text>
                <Text style={styles.existingMessageTime}>
                  {new Date(selectedConversation.dernier_message.date_envoi).toLocaleString()}
                </Text>
              </View>
            )}

            {/* Zone de saisie */}
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

            {/* Fichiers joints */}
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
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                multiline
                value={newConversationData.description}
                onChangeText={(text) => setNewConversationData({...newConversationData, description: text})}
                placeholder="Description optionnelle"
                textAlignVertical="top"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Type de conversation</Text>
              <View style={styles.typeOptions}>
                {['individuelle', 'groupe_etudiants', 'groupe_tuteurs', 'support_admin'].map(type => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.typeOption,
                      newConversationData.type_conversation === type && styles.selectedType
                    ]}
                    onPress={() => setNewConversationData({...newConversationData, type_conversation: type})}
                  >
                    <Text style={[
                      styles.typeText,
                      newConversationData.type_conversation === type && styles.selectedTypeText
                    ]}>
                      {type.replace('_', ' ').toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
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

  const onRefresh = async () => {
    setRefreshing(true);
    await loadConversations();
    setRefreshing(false);
  };

  const handleCompose = (conversation = null) => {
    setSelectedConversation(conversation);
    setShowComposeModal(true);
    setMessageText('');
  };

  const sendMessage = async () => {
    if (!messageText.trim()) {
      Alert.alert('Erreur', 'Veuillez rédiger un message');
      return;
    }

    try {
      setSendingMessage(true);
      const token = await AsyncStorage.getItem('accessToken');
      
      const url = selectedConversation 
        ? `${API_BASE_URL}/api/tutor/messages/conversation/${selectedConversation.id}/reply/`
        : `${API_BASE_URL}/api/tutor/messages/new/`;

      const body = selectedConversation
        ? {
            contenu: messageText.trim(),
            conversation_id: selectedConversation.id
          }
        : {
            contenu: messageText.trim(),
            destinataire_type: 'etudiant',
            destinataire_id: selectedConversation?.autre_participant?.id
          };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        Alert.alert('Succès', 'Message envoyé avec succès', [
          { text: 'OK', onPress: () => {
            setShowComposeModal(false);
            setSelectedConversation(null);
            setMessageText('');
            loadConversations();
          }}
        ]);
      } else {
        const error = await response.json();
        Alert.alert('Erreur', error.message || 'Impossible d\'envoyer le message');
      }
    } catch (error) {
      console.error('Erreur envoi message:', error);
      Alert.alert('Erreur', 'Impossible d\'envoyer le message');
    } finally {
      setSendingMessage(false);
    }
  };

  const markAsRead = async (conversationId) => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      await fetch(`${API_BASE_URL}/api/tutor/messages/conversation/${conversationId}/read/`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (error) {
      console.error('Erreur marquer comme lu:', error);
    }
  };

  const deleteConversation = (conversation) => {
    Alert.alert(
      'Supprimer la conversation',
      `Voulez-vous vraiment supprimer la conversation avec ${conversation.autre_participant_nom} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('accessToken');
              const response = await fetch(`${API_BASE_URL}/api/tutor/messages/conversation/${conversation.id}/delete/`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
              });

              if (response.ok) {
                Alert.alert('Succès', 'Conversation supprimée avec succès');
                loadConversations();
              } else {
                Alert.alert('Erreur', 'Impossible de supprimer la conversation');
              }
            } catch (error) {
              console.error('Erreur suppression conversation:', error);
              Alert.alert('Erreur', 'Impossible de supprimer la conversation');
            }
          }
        }
      ]
    );
  };

  const filteredConversations = Array.isArray(conversations) ? conversations.filter(conv => 
    conv.autre_participant_nom?.toLowerCase().includes(searchText.toLowerCase()) ||
    conv.dernier_message?.toLowerCase().includes(searchText.toLowerCase())
  ) : [];

  const renderConversationItem = (conversation) => (
    <Card key={conversation.id} style={styles.conversationCard}>
      <TouchableOpacity
        style={styles.conversationContent}
        onPress={() => {
          markAsRead(conversation.id);
          navigation.navigate('ConversationDetail', { conversationId: conversation.id });
        }}
      >
        <View style={styles.conversationHeader}>
          <View style={styles.participantInfo}>
            <View style={styles.avatar}>
              <Ionicons 
                name="person-circle" 
                size={40} 
                color={conversation.non_lu ? "#007AFF" : "#ccc"} 
              />
            </View>
            <View style={styles.participantDetails}>
              <Text style={styles.participantName}>
                {conversation.autre_participant_nom}
              </Text>
              <Text style={styles.participantRole}>
                {conversation.autre_participant_role === 'etudiant' ? 'Étudiant' : 'Admin'}
              </Text>
            </View>
          </View>
          <View style={styles.conversationMeta}>
            <Text style={styles.lastMessageTime}>
              {new Date(conversation.dernier_message_date).toLocaleDateString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Text>
            {conversation.non_lu && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>
                  {conversation.nb_non_lus || 1}
                </Text>
              </View>
            )}
          </View>
        </View>
        
        <Text style={styles.lastMessage} numberOfLines={2}>
          {conversation.dernier_message}
        </Text>
        
        <View style={styles.conversationActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleCompose(conversation)}
          >
            <Ionicons name="create-outline" size={16} color="#007AFF" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => deleteConversation(conversation)}
          >
            <Ionicons name="trash-outline" size={16} color="#dc3545" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Card>
  );

  const renderComposeModal = () => (
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>
            {selectedConversation ? 'Répondre' : 'Nouveau message'}
          </Text>
          <TouchableOpacity onPress={() => setShowComposeModal(false)}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.modalBody}>
          {selectedConversation && (
            <View style={styles.replyInfo}>
              <Text style={styles.replyLabel}>À:</Text>
              <Text style={styles.replyTo}>{selectedConversation.autre_participant_nom}</Text>
              <Text style={styles.replyRole}>
                {selectedConversation.autre_participant_role === 'etudiant' ? 'Étudiant' : 'Admin'}
              </Text>
            </View>
          )}
          
          {!selectedConversation && (
            <View style={styles.recipientSection}>
              <Text style={styles.recipientLabel}>Destinataire:</Text>
              <Text style={styles.recipientInput}>Étudiant</Text>
            </View>
          )}
          
          <View style={styles.messageSection}>
            <Text style={styles.messageLabel}>Message:</Text>
            <TextInput
              style={styles.messageInput}
              multiline
              numberOfLines={6}
              value={messageText}
              onChangeText={setMessageText}
              placeholder="Rédigez votre message ici..."
            />
          </View>
        </View>
        
        <View style={styles.modalFooter}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => setShowComposeModal(false)}
          >
            <Text style={styles.cancelButtonText}>Annuler</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.submitButton, sendingMessage && styles.submitButtonDisabled]}
            onPress={sendMessage}
            disabled={sendingMessage}
          >
            <Text style={styles.submitButtonText}>
              {sendingMessage ? 'Envoi...' : 'Envoyer'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <>
        <Header title="Messagerie" showBack onBackPress={() => navigation.goBack()} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Chargement des messages...</Text>
        </View>
      </>
    );
  }

  return (
    <>
      <Header title="Messagerie" showBack onBackPress={() => navigation.goBack()} />
      <ScrollView style={styles.container}>
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color="#666" />
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher une conversation..."
              value={searchText}
              onChangeText={setSearchText}
            />
          </View>
        </View>

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
        
        {filteredConversations.length === 0 ? (
          <Card style={styles.emptyCard}>
            <View style={styles.emptyContainer}>
              <Ionicons name="mail-outline" size={60} color="#ccc" />
              <Text style={styles.emptyTitle}>Aucune conversation</Text>
              <Text style={styles.emptyText}>
                {searchText ? 'Aucune conversation ne correspond à votre recherche' : 'Commencez une conversation avec vos étudiants'}
              </Text>
              <Button
                title="Nouveau message"
                onPress={() => handleCompose()}
                style={styles.emptyButton}
              />
            </View>
          </Card>
        ) : (
          (filteredConversations || []).map(renderConversationItem)
        )}
      </ScrollView>
      
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => handleCompose()}
      >
        <Ionicons name="add" size={24} color="#fff" />
      </TouchableOpacity>
      
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
  searchContainer: {
    marginBottom: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 8,
    color: '#333',
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
  conversationCard: {
    marginBottom: 12,
  },
  conversationContent: {
    padding: 16,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  participantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  participantDetails: {
    marginLeft: 12,
    flex: 1,
  },
  participantName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  participantRole: {
    fontSize: 12,
    color: '#666',
  },
  conversationMeta: {
    alignItems: 'flex-end',
  },
  lastMessageTime: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  unreadBadge: {
    backgroundColor: '#dc3545',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  conversationActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
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
  floatingButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
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
  replyInfo: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  replyLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  replyTo: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  replyRole: {
    fontSize: 12,
    color: '#666',
  },
  recipientSection: {
    marginBottom: 20,
  },
  recipientLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  recipientInput: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  messageSection: {
    marginBottom: 20,
  },
  messageLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  messageInput: {
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
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
  },
});

export default TutorMessagesScreen;
