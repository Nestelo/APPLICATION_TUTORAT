import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import Header from '../../components/ui/Header';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import TextInputField from '../../components/ui/TextInputField';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import VoiceRecorder from '../../components/ui/VoiceRecorder';
import VoicePlayer from '../../components/ui/VoicePlayer';
import { getConversations, getMessages, envoyerMessage, envoyerMessageVocal, startConversation } from '../../api/messagerieService';
import { useAuth } from '../../context/AuthContext';
import { formatTime } from '../../utils/helpers';

const MessagerieScreen = ({ navigation, route }) => {
  const { user } = useAuth();
  const { autreId } = route.params || {};
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (autreId) {
      // Démarrer ou ouvrir une conversation avec un autre utilisateur
      handleStartConversation();
    } else {
      loadConversations();
    }
  }, []);

  useEffect(() => {
    if (currentConversation) {
      loadMessages(currentConversation.id);
    }
  }, [currentConversation]);

  const loadConversations = async () => {
    try {
      const data = await getConversations();
      setConversations(data);
      if (data.length > 0 && !currentConversation) {
        setCurrentConversation(data[0]);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (convId) => {
    try {
      const data = await getMessages(convId);
      setMessages(data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleStartConversation = async () => {
    try {
      const conv = await startConversation(autreId);
      setCurrentConversation(conv);
      setConversations([conv, ...conversations]);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de démarrer la conversation');
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !currentConversation) return;
    setSending(true);
    try {
      const msg = await envoyerMessage(currentConversation.id, newMessage);
      setMessages([...messages, msg]);
      setNewMessage('');
    } catch (error) {
      Alert.alert('Erreur', 'Message non envoyé');
    } finally {
      setSending(false);
    }
  };

  const handleVoiceMessage = async (audioData) => {
    if (!currentConversation) return;
    
    try {
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

        const msg = await envoyerMessageVocal(currentConversation.id, audioFile, 'Message vocal');
        setMessages([...messages, msg]);
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'envoyer le message vocal');
    }
  };

  const renderConversation = ({ item }) => (
    <Card
      onPress={() => setCurrentConversation(item)}
      style={[styles.convCard, currentConversation?.id === item.id && styles.selectedConv]}
    >
      <Text>{item.participants_details?.filter(p => p.id !== user.id).map(p => `${p.prenom} ${p.nom}`).join(', ')}</Text>
      <Text style={styles.lastMsg}>{item.derniers_messages?.[0]?.contenu?.substring(0, 30)}...</Text>
    </Card>
  );

  const renderMessage = ({ item }) => {
    const isVoiceMessage = item.type_message === 'audio' || item.fichier;
    
    return (
      <View style={[styles.messageRow, item.expediteur === user.id ? styles.myMessage : styles.otherMessage]}>
        <Card style={styles.messageBubble}>
          {isVoiceMessage && item.fichier && (
            <View style={styles.voiceContainer}>
              <VoicePlayer audioUri={item.fichier} />
            </View>
          )}
          {item.contenu && <Text>{item.contenu}</Text>}
          <Text style={styles.messageTime}>{formatTime(item.date_envoi)}</Text>
        </Card>
      </View>
    );
  };

  if (loading) return <LoadingSpinner />;

  return (
    <>
      <Header title="Messagerie" showBack onBackPress={() => navigation.goBack()} />
      <View style={styles.container}>
        <View style={styles.conversationsList}>
          <FlatList
            horizontal
            data={conversations}
            renderItem={renderConversation}
            keyExtractor={(item) => item.id.toString()}
            showsHorizontalScrollIndicator={false}
          />
        </View>
        {currentConversation ? (
          <>
            <FlatList
              data={messages}
              renderItem={renderMessage}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={styles.messagesList}
              inverted={false}
            />
            <View style={styles.inputContainer}>
              <TextInputField
                value={newMessage}
                onChangeText={setNewMessage}
                placeholder="Votre message..."
                style={styles.messageInput}
              />
              <Button title="Envoyer" onPress={handleSend} loading={sending} style={styles.sendButton} />
            </View>
            <View style={styles.voiceContainer}>
              <VoiceRecorder 
                onRecordingComplete={handleVoiceMessage}
                maxDuration={300}
              />
            </View>
          </>
        ) : (
          <EmptyState icon="chatbubbles-outline" message="Aucune conversation" />
        )}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  conversationsList: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  convCard: {
    marginHorizontal: 4,
    padding: 8,
    minWidth: 120,
  },
  selectedConv: {
    backgroundColor: '#e6f2ff',
  },
  lastMsg: {
    fontSize: 12,
    color: '#999',
  },
  messagesList: {
    padding: 8,
  },
  messageRow: {
    marginVertical: 4,
  },
  myMessage: {
    alignItems: 'flex-end',
  },
  otherMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 8,
  },
  messageTime: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    alignItems: 'center',
  },
  messageInput: {
    flex: 1,
    marginRight: 8,
  },
  sendButton: {
    width: 80,
  },
  voiceContainer: {
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
});

export default MessagerieScreen;