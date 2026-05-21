import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/ui/Header';
import Card from '../../components/ui/Card';
import EmptyState from '../../components/ui/EmptyState';
import { getMesEmails, marquerEmailLu } from '../../api/emailService';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

const MessagesScreen = ({ navigation }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    setLoading(true);
    try {
      const result = await getMesEmails();
      if (result.success || Array.isArray(result.results)) {
        const data = result.success ? result.data : result.results || [];
        setMessages(Array.isArray(data) ? data : []);
      } else {
        Alert.alert('Erreur', 'Impossible de charger les messages');
      }
    } catch (error) {
      console.error('Erreur chargement messages:', error);
      Alert.alert('Erreur', 'Impossible de charger les messages');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMessages();
    setRefreshing(false);
  };

  const handleMarkAsRead = async (messageId) => {
    try {
      await marquerEmailLu(messageId);
      // Recharger la liste
      loadMessages();
    } catch (error) {
      console.error('Erreur marquage message:', error);
    }
  };

  const handleOpenMessage = (message) => {
    navigation.navigate('MessageDetail', { messageId: message.id });
    if (!message.est_lue) {
      handleMarkAsRead(message.id);
    }
  };

  const renderMessageItem = ({ item }) => {
    const dateStr = item.date_creation 
      ? formatDistanceToNow(new Date(item.date_creation), { locale: fr })
      : 'Date inconnue';

    return (
      <TouchableOpacity 
        onPress={() => handleOpenMessage(item)}
        activeOpacity={0.7}
      >
        <Card style={[styles.messageCard, !item.est_lue && styles.unreadCard]}>
          <View style={styles.messageHeader}>
            <View style={styles.senderInfo}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {item.expediteur?.prenom?.[0]}
                  {item.expediteur?.nom?.[0]}
                </Text>
              </View>
              <View style={styles.senderDetails}>
                <Text style={[styles.senderName, !item.est_lue && styles.unreadText]}>
                  {item.expediteur?.prenom} {item.expediteur?.nom}
                </Text>
                <Text style={styles.senderEmail}>
                  {item.expediteur?.email}
                </Text>
              </View>
            </View>
            {!item.est_lue && <View style={styles.unreadDot} />}
          </View>
          
          <Text style={[styles.subject, !item.est_lue && styles.unreadText]} numberOfLines={1}>
            {item.sujet}
          </Text>
          
          <Text style={styles.preview} numberOfLines={2}>
            {item.contenu}
          </Text>

          <Text style={styles.date}>{dateStr}</Text>
        </Card>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <>
        <Header title="Messages" showBack={false} />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#3498db" />
        </View>
      </>
    );
  }

  return (
    <>
      <Header title="Messages" showBack={false} />
      <View style={styles.container}>
        {messages.length === 0 ? (
          <EmptyState
            icon="mail"
            title="Aucun message"
            description="Vous n'avez pas encore de messages"
          />
        ) : (
          <FlatList
            data={messages}
            renderItem={renderMessageItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.list}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
              />
            }
          />
        )}
      </View>
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
  list: {
    padding: 16,
  },
  messageCard: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#fff',
  },
  unreadCard: {
    backgroundColor: '#f0f8ff',
    borderLeftWidth: 4,
    borderLeftColor: '#3498db',
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  senderInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  senderDetails: {
    flex: 1,
  },
  senderName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  senderEmail: {
    fontSize: 12,
    color: '#999',
  },
  unreadDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#3498db',
    marginLeft: 8,
  },
  subject: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
    marginBottom: 6,
  },
  unreadText: {
    fontWeight: 'bold',
  },
  preview: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
    lineHeight: 18,
  },
  date: {
    fontSize: 12,
    color: '#999',
  },
});

export default MessagesScreen;
