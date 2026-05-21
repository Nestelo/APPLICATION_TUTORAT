import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, FlatList, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/ui/Header';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { getGroupe, getMessagesGroupe, envoyerMessageGroupe } from '../../api/tutorService';

const GroupeDetailScreen = ({ navigation, route }) => {
  const { groupeId } = route.params;
  const [groupe, setGroupe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false);

  useEffect(() => {
    loadGroupe();
    loadMessages();
  }, []);

  const loadGroupe = async () => {
    try {
      const data = await getGroupe(groupeId);
      setGroupe(data);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de charger le groupe');
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    try {
      setLoadingMessages(true);
      const response = await getMessagesGroupe(groupeId);
      if (response.success) {
        setMessages(response.data.results || response.data || []);
      } else {
        console.error('Erreur chargement messages:', response.error);
        setMessages([]);
      }
    } catch (error) {
      console.error('Erreur chargement messages:', error);
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      const messageData = {
        contenu: newMessage.trim(),
        groupe: groupeId
      };

      const response = await envoyerMessageGroupe(groupeId, messageData);
      
      if (response.success) {
        const messageEnvoye = response.data;
        setMessages(prevMessages => [...prevMessages, messageEnvoye]);
        setNewMessage('');
        
        console.log('Message envoyé avec succès:', messageEnvoye);
        
        setTimeout(() => {
          loadMessages();
        }, 500);
        
      } else {
        console.error('Erreur envoi message:', response.error);
        Alert.alert('Erreur', response.error || 'Impossible d\'envoyer le message');
      }
    } catch (error) {
      console.error('Erreur envoi message:', error);
      Alert.alert('Erreur', 'Impossible d\'envoyer le message');
    }
  };

  const renderMessageItem = ({ item }) => {
    const auteurNom = item.auteur_details ? 
      `${item.auteur_details.prenom} ${item.auteur_details.nom}` : 
      (item.auteur === 'Moi' ? 'Moi' : item.auteur);
    
    let dateAffichee = '';
    try {
      const date = new Date(item.date_envoi || item.date);
      if (!isNaN(date.getTime())) {
        dateAffichee = date.toLocaleDateString('fr-FR', {
          day: 'numeric',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit'
        });
      } else {
        dateAffichee = 'Date invalide';
      }
    } catch (error) {
      console.error('Erreur formatage date:', error);
      dateAffichee = 'Date invalide';
    }

    return (
      <View style={styles.messageItem}>
        <View style={styles.messageHeader}>
          <Text style={styles.messageAuthor}>{auteurNom}</Text>
          <Text style={styles.messageTime}>{dateAffichee}</Text>
        </View>
        <Text style={styles.messageContent}>{item.contenu}</Text>
      </View>
    );
  };

  if (loading) return <LoadingSpinner />;

  return (
    <>
      <Header title="Détail du groupe" showBack onBackPress={() => navigation.goBack()} />
      <FlatList
        style={styles.container}
        data={[
          { type: 'header', groupe },
          { type: 'chat', messages, loadingMessages },
          { type: 'button', title: 'Ressources du groupe', onPress: () => navigation.navigate('GroupeRessources', { groupeId, groupeNom: groupe?.nom }) },
          { type: 'button', title: 'Voir le planning du groupe', onPress: () => navigation.navigate('PlanningStudent', { groupeId }) },
        ]}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => {
          if (item.type === 'header') {
            return (
              <Card>
                <Text style={styles.nom}>{item.groupe?.nom}</Text>
                <Text style={styles.description}>{item.groupe?.description}</Text>
                <Text>Capacité : {item.groupe?.capacite_max}</Text>
                <Text>Créé par {item.groupe?.createur_details?.prenom} {item.groupe?.createur_details?.nom}</Text>
              </Card>
            );
          }
          if (item.type === 'chat') {
            return (
              <Card style={styles.chatCard}>
                <Text style={styles.chatTitle}>Chat du groupe</Text>
                
                {item.loadingMessages ? (
                  <Text style={styles.loadingText}>Chargement des messages...</Text>
                ) : (
                  <View style={styles.chatContainer}>
                    <FlatList
                      data={item.messages}
                      renderItem={renderMessageItem}
                      keyExtractor={(msg) => msg.id.toString()}
                      style={styles.messagesList}
                      nestedScrollEnabled={false}
                    />
                    
                    <View style={styles.inputContainer}>
                      <TextInput
                        style={styles.messageInput}
                        value={newMessage}
                        onChangeText={setNewMessage}
                        placeholder="Tapez votre message..."
                        multiline
                        maxLength={500}
                      />
                      <TouchableOpacity
                        style={styles.sendButton}
                        onPress={handleSendMessage}
                        disabled={!newMessage.trim()}
                      >
                        <Ionicons 
                          name="send" 
                          size={20} 
                          color={newMessage.trim() ? "#007AFF" : "#ccc"} 
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </Card>
            );
          }
          if (item.type === 'button') {
            return (
              <Button
                title={item.title}
                variant={item.variant}
                onPress={item.onPress}
                style={styles.button}
              />
            );
          }
          return null;
        }}
        ListFooterComponent={<View style={{ height: 20 }} />}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 12,
    backgroundColor: '#f5f5f5',
  },
  nom: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    marginBottom: 12,
  },
  button: {
    marginVertical: 8,
  },
  chatCard: {
    marginVertical: 12,
    padding: 16,
  },
  chatTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  loadingText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
  },
  chatContainer: {
    flex: 1,
    minHeight: 300,
  },
  messagesList: {
    flex: 1,
    marginBottom: 12,
    backgroundColor: '#fafafa',
    borderRadius: 8,
    padding: 8,
  },
  messageItem: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    marginVertical: 4,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  messageAuthor: {
    fontWeight: 'bold',
    color: '#333',
    fontSize: 14,
  },
  messageTime: {
    fontSize: 12,
    color: '#666',
  },
  messageContent: {
    color: '#333',
    fontSize: 14,
    lineHeight: 18,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 12,
  },
  messageInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    maxHeight: 80,
    fontSize: 14,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default GroupeDetailScreen;