import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import Header from '../../components/ui/Header';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { API_BASE_URL } from '../../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const CommunicationScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [messages, setMessages] = useState([]);
  const [showCompose, setShowCompose] = useState(false);
  const [userType, setUserType] = useState('');
  const [users, setUsers] = useState([]);
  
  const [formData, setFormData] = useState({
    destinataire: '',
    sujet: '',
    message: '',
    type: 'message'
  });

  useEffect(() => {
    loadMessages();
    loadUsers();
    loadUserType();
  }, []);

  const loadUserType = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}/api/auth/user/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUserType(data.role || 'student');
      }
    } catch (error) {
      console.error('Erreur chargement type utilisateur:', error);
    }
  };

  const loadMessages = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}/api/communication/messages/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(Array.isArray(data) ? data : []);
      } else {
        setMessages([]);
      }
    } catch (error) {
      console.error('Erreur chargement messages:', error);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}/api/auth/users/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Erreur chargement utilisateurs:', error);
      setUsers([]);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadMessages(), loadUsers()]);
    setRefreshing(false);
  };

  const handleSendMessage = async () => {
    if (!formData.destinataire || !formData.sujet || !formData.message) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('accessToken');
      
      const messageData = {
        destinataire_id: formData.destinataire,
        sujet: formData.sujet,
        message: formData.message,
        type: formData.type
      };

      const response = await fetch(`${API_BASE_URL}/api/communication/messages/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(messageData)
      });

      if (response.ok) {
        Alert.alert('Succès', 'Message envoyé avec succès');
        setFormData({ destinataire: '', sujet: '', message: '', type: 'message' });
        setShowCompose(false);
        loadMessages();
      } else {
        Alert.alert('Erreur', 'Impossible d\'envoyer le message');
      }
    } catch (error) {
      console.error('Erreur envoi message:', error);
      Alert.alert('Erreur', 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFilteredUsers = () => {
    if (userType === 'tutor') return users.filter(u => u.role === 'student' || u.role === 'admin');
    if (userType === 'student') return users.filter(u => u.role === 'tutor' || u.role === 'admin');
    if (userType === 'admin') return users;
    return [];
  };

  if (loading && messages.length === 0) {
    return (
      <>
        <Header title="Communication" showBack onBackPress={() => navigation.goBack()} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Chargement des messages...</Text>
        </View>
      </>
    );
  }

  return (
    <>
      <Header title="Communication" showBack onBackPress={() => navigation.goBack()} />
      <ScrollView 
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Card style={styles.composeCard}>
          <TouchableOpacity 
            style={styles.composeButton}
            onPress={() => setShowCompose(!showCompose)}
          >
            <Ionicons name="create-outline" size={24} color="#007AFF" />
            <Text style={styles.composeButtonText}>
              {showCompose ? 'Annuler' : 'Nouveau message'}
            </Text>
          </TouchableOpacity>
        </Card>

        {showCompose && (
          <Card style={styles.formCard}>
            <Text style={styles.sectionTitle}>Nouveau message</Text>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Destinataire *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.usersScroll}>
                {getFilteredUsers().map((user, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.userTag,
                      formData.destinataire === user.id.toString() && styles.userTagSelected
                    ]}
                    onPress={() => setFormData(prev => ({ ...prev, destinataire: user.id.toString() }))}
                  >
                    <Text style={[
                      styles.userTagText,
                      formData.destinataire === user.id.toString() && styles.userTagTextSelected
                    ]}>
                      {user.prenom} {user.nom} ({user.role})
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Sujet *</Text>
              <Text style={styles.input}
                value={formData.sujet}
                onChangeText={(text) => setFormData(prev => ({ ...prev, sujet: text }))}
                placeholder="Sujet du message..."
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Message *</Text>
              <Text style={styles.input} multiline numberOfLines={4}
                value={formData.message}
                onChangeText={(text) => setFormData(prev => ({ ...prev, message: text }))}
                placeholder="Votre message..."
              />
            </View>

            <Button 
              title="Envoyer" 
              onPress={handleSendMessage}
              loading={loading}
              style={styles.sendButton}
            />
          </Card>
        )}

        {messages.length === 0 ? (
          <Card style={styles.emptyCard}>
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubble-outline" size={60} color="#ccc" />
              <Text style={styles.emptyTitle}>Aucun message</Text>
              <Text style={styles.emptyText}>
                Commencez une conversation avec d'autres utilisateurs !
              </Text>
            </View>
          </Card>
        ) : (
          messages.map(message => (
            <Card key={message.id} style={styles.messageCard}>
              <View style={styles.messageHeader}>
                <View style={styles.messageInfo}>
                  <Text style={styles.messageSubject}>{message.sujet}</Text>
                  <Text style={styles.messageMeta}>
                    De: {message.expediteur?.prenom} {message.expediteur?.nom} → 
                    À: {message.destinataire?.prenom} {message.destinataire?.nom}
                  </Text>
                  <Text style={styles.messageDate}>{formatDate(message.date_envoi)}</Text>
                </View>
                <View style={[message.est_lue ? styles.readBadge : styles.unreadBadge]}>
                  <Text style={styles.badgeText}>
                    {message.est_lue ? 'Lu' : 'Non lu'}
                  </Text>
                </View>
              </View>
              
              <Text style={styles.messageContent} numberOfLines={3}>
                {message.message}
              </Text>
              
              <TouchableOpacity style={styles.replyButton}>
                <Ionicons name="arrow-undo-outline" size={16} color="#007AFF" />
                <Text style={styles.replyText}>Répondre</Text>
              </TouchableOpacity>
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
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  composeCard: {
    marginBottom: 16,
  },
  composeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#f8f9ff',
    borderRadius: 8,
  },
  composeButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
    marginLeft: 8,
  },
  formCard: {
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
  usersScroll: {
    flexDirection: 'row',
    marginHorizontal: -4,
  },
  userTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    marginHorizontal: 4,
  },
  userTagSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  userTagText: {
    fontSize: 12,
    color: '#666',
  },
  userTagTextSelected: {
    color: '#fff',
  },
  sendButton: {
    marginTop: 8,
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
  },
  messageCard: {
    marginBottom: 16,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  messageInfo: {
    flex: 1,
  },
  messageSubject: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  messageMeta: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  messageDate: {
    fontSize: 11,
    color: '#999',
  },
  readBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#28a745',
    alignItems: 'center',
  },
  unreadBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#ffc107',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '500',
  },
  messageContent: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  replyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#e3f2fd',
  },
  replyText: {
    fontSize: 12,
    color: '#007AFF',
    marginLeft: 4,
  },
});

export default CommunicationScreen;
