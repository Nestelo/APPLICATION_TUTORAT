import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/ui/Header';
import Button from '../../components/ui/Button';
import { getConversation, repondreEmail, envoyerEmailDirect } from '../../api/emailService';
import { formatDistanceToNow, format } from 'date-fns';
import { fr } from 'date-fns/locale';

const MessageDetailScreen = ({ navigation, route }) => {
  const { messageId } = route.params;
  const [conversation, setConversation] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyContent, setReplyContent] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadConversation();
  }, []);

  const loadConversation = async () => {
    setLoading(true);
    try {
      const result = await getConversation(messageId);
      if (result.success || Array.isArray(result.results)) {
        const data = result.success ? result.data : result.results || result;
        setConversation(Array.isArray(data) ? data : []);
      } else {
        Alert.alert('Erreur', 'Impossible de charger la conversation');
      }
    } catch (error) {
      console.error('Erreur chargement conversation:', error);
      Alert.alert('Erreur', 'Impossible de charger la conversation');
    } finally {
      setLoading(false);
    }
  };

  const handleSendReply = async () => {
    if (!replyContent.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un message');
      return;
    }

    setSending(true);
    try {
      const result = await repondreEmail(messageId, replyContent);
      if (result.success) {
        // Si la réponse a créé un nouveau message, l'envoyer par email
        if (result.data?.id) {
          try {
            await envoyerEmailDirect(result.data.id);
          } catch (emailError) {
            console.warn('Réponse créée mais envoi email échoué:', emailError);
          }
        }
        
        Alert.alert('Succès', 'Réponse envoyée avec succès');
        setReplyContent('');
        loadConversation();
      } else {
        Alert.alert('Erreur', 'Impossible d\'envoyer la réponse');
      }
    } catch (error) {
      console.error('Erreur envoi réponse:', error);
      Alert.alert('Erreur', 'Impossible d\'envoyer la réponse');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <>
        <Header title="Conversation" showBack onBackPress={() => navigation.goBack()} />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#3498db" />
        </View>
      </>
    );
  }

  const firstMessage = conversation[0];
  const sender = firstMessage?.expediteur || firstMessage?.sender;
  const senderName = sender ? `${sender.prenom} ${sender.nom}` : 'Utilisateur';

  return (
    <>
      <Header 
        title={senderName} 
        showBack 
        onBackPress={() => navigation.goBack()}
      />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
        keyboardVerticalOffset={90}
      >
        <ScrollView style={styles.messageList}>
          {conversation.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Aucun message dans cette conversation</Text>
            </View>
          ) : (
            conversation.map((message, index) => {
              const isOwn = message.est_expediteur || false;
              const dateStr = message.date_creation
                ? format(new Date(message.date_creation), 'dd MMM yyyy HH:mm', { locale: fr })
                : 'Date inconnue';

              return (
                <View 
                  key={index}
                  style={[
                    styles.messageBubble,
                    isOwn ? styles.ownMessage : styles.otherMessage
                  ]}
                >
                  <View style={isOwn ? styles.ownMessageBox : styles.otherMessageBox}>
                    {!isOwn && (
                      <Text style={styles.senderName}>
                        {sender?.prenom} {sender?.nom}
                      </Text>
                    )}
                    {message.sujet && (
                      <Text style={styles.messageSubject}>{message.sujet}</Text>
                    )}
                    <Text style={styles.messageContent}>{message.contenu}</Text>
                    <Text style={styles.messageDate}>{dateStr}</Text>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>

        <View style={styles.replySection}>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.replyInput}
              placeholder="Écrire une réponse..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
              value={replyContent}
              onChangeText={setReplyContent}
              editable={!sending}
            />
            <TouchableOpacity 
              style={[styles.sendButton, sending && styles.sendButtonDisabled]}
              onPress={handleSendReply}
              disabled={sending}
            >
              <Ionicons 
                name="send" 
                size={20} 
                color={sending ? '#ccc' : '#3498db'} 
              />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageList: {
    flex: 1,
    padding: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  messageBubble: {
    marginBottom: 12,
    flexDirection: 'row',
  },
  ownMessage: {
    justifyContent: 'flex-end',
  },
  otherMessage: {
    justifyContent: 'flex-start',
  },
  ownMessageBox: {
    backgroundColor: '#3498db',
    padding: 12,
    borderRadius: 12,
    maxWidth: '80%',
    marginRight: 0,
  },
  otherMessageBox: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    maxWidth: '80%',
    marginLeft: 0,
    borderWidth: 1,
    borderColor: '#eee',
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  messageSubject: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  messageContent: {
    fontSize: 15,
    color: '#333',
    lineHeight: 20,
  },
  messageDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 6,
  },
  replySection: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    padding: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  replyInput: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});

export default MessageDetailScreen;
