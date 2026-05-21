import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import VoiceRecorder from '../../components/ui/VoiceRecorder';
import VoicePlayer from '../../components/ui/VoicePlayer';
import { envoyerMessageVocal } from '../../api/messagerieService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const VoiceMessageScreen = ({ route, navigation }) => {
  const { sessionId, tutorName, tutorId } = route.params || {};
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    loadCurrentUser();
    loadMessages();
  }, [sessionId]);

  const loadCurrentUser = async () => {
    try {
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) {
        setCurrentUser(JSON.parse(userStr));
      }
    } catch (error) {
      console.error('Erreur chargement utilisateur:', error);
    }
  };

  const loadMessages = async () => {
    if (!sessionId) return;

    try {
      const token = await AsyncStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}/messagerie/messages/session/${sessionId}/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data.results || data);
      } else {
        console.error('Erreur chargement messages:', response.status);
      }
    } catch (error) {
      console.error('Erreur chargement messages:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadMessages();
  };

  const handleRecordingComplete = async (audioData) => {
    if (!currentUser || !sessionId) return;

    try {
      console.log('Envoi du message vocal...', {
        conversationId: sessionId,
        hasAudio: !!audioData.uri
      });

      // Préparer le fichier audio pour l'upload
      if (audioData.uri) {
        const uriParts = audioData.uri.split('.');
        const fileType = uriParts[uriParts.length - 1] || '3gp';
        const fileName = `voice_${Date.now()}.${fileType}`;
        
        const audioFile = {
          uri: audioData.uri,
          name: fileName,
          type: `audio/${fileType}`,
        };

        const result = await envoyerMessageVocal(sessionId, audioFile, 'Message vocal');
        console.log('Message vocal envoyé avec succès:', result);
        Alert.alert('Succès', 'Message vocal envoyé avec succès');
        loadMessages(); // Recharger les messages
      }
    } catch (error) {
      console.error('Erreur envoi message vocal:', error);
      Alert.alert('Erreur', 'Impossible d\'envoyer le message vocal');
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Aujourd'hui";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Hier';
    } else {
      return date.toLocaleDateString('fr-FR', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      });
    }
  };

  const groupMessagesByDate = (messages) => {
    const groups = {};
    messages.forEach(message => {
      const date = new Date(message.date_creation).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });
    return groups;
  };

  const renderMessage = (message) => {
    const isOwnMessage = message.expediteur === currentUser?.id;
    const isVoiceMessage = message.type_message === 'audio' || message.fichier;

    return (
      <View key={message.id} style={[
        styles.messageContainer,
        isOwnMessage ? styles.ownMessage : styles.otherMessage
      ]}>
        <View style={styles.messageHeader}>
          <Text style={styles.senderName}>
            {isOwnMessage ? 'Vous' : (message.expediteur_details?.prenom || 'Tuteur')}
          </Text>
          <Text style={styles.messageTime}>
            {formatTime(message.date_creation)}
          </Text>
        </View>
        
        {isVoiceMessage && message.fichier && (
          <View style={styles.voiceContainer}>
            <Ionicons name="mic" size={20} color="#007AFF" />
            <Text style={styles.voiceLabel}>Message vocal</Text>
            <VoicePlayer 
              audioUri={message.fichier}
              style={styles.voicePlayer}
            />
          </View>
        )}
        
        {message.contenu && (
          <Text style={styles.messageText}>{message.contenu}</Text>
        )}
      </View>
    );
  };

  const renderMessageGroup = (date, messages) => (
    <View key={date} style={styles.messageGroup}>
      <Text style={styles.dateHeader}>{formatDate(date)}</Text>
      {messages.map(renderMessage)}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Chargement des messages...</Text>
      </View>
    );
  }

  const messageGroups = groupMessagesByDate(messages);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          Messages vocaux - {tutorName || 'Tuteur'}
        </Text>
      </View>

      <ScrollView 
        style={styles.messagesContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {Object.keys(messageGroups).map(date => 
          renderMessageGroup(date, messageGroups[date])
        )}
        
        {messages.length === 0 && (
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubble-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>
              Aucun message vocal dans cette conversation
            </Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.recordingContainer}>
        <VoiceRecorder 
          onRecordingComplete={handleRecordingComplete}
          maxDuration={300}
        />
      </View>
    </View>
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
  header: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    paddingTop: 50,
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
    padding: 10,
  },
  messageGroup: {
    marginBottom: 20,
  },
  dateHeader: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
    backgroundColor: '#e0e0e0',
    padding: 5,
    borderRadius: 15,
    alignSelf: 'center',
  },
  messageContainer: {
    marginVertical: 5,
    maxWidth: '80%',
    borderRadius: 15,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  ownMessage: {
    backgroundColor: '#007AFF',
    alignSelf: 'flex-end',
    marginLeft: '20%',
  },
  otherMessage: {
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
    marginRight: '20%',
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  senderName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  messageTime: {
    fontSize: 11,
    color: '#666',
  },
  voiceContainer: {
    alignItems: 'center',
    padding: 10,
  },
  voiceLabel: {
    fontSize: 14,
    color: '#007AFF',
    marginVertical: 5,
    fontWeight: '500',
  },
  voicePlayer: {
    marginTop: 5,
  },
  messageText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 10,
  },
  recordingContainer: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    padding: 15,
  },
});

export default VoiceMessageScreen;
