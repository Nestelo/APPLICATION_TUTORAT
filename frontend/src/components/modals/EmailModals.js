import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/ui/Header';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { 
  envoyerEmail, 
  envoyerEmailDirect, 
  marquerEmailRecu, 
  marquerEmailLu, 
  repondreEmail, 
  getConversation,
  supprimerMessageAdmin,
  getMesEmails 
} from '../../api/emailService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const EmailModal = ({ visible, user, onClose, onEmailSent }) => {
  const [sujet, setSujet] = useState('');
  const [contenu, setContenu] = useState('');
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [emailId, setEmailId] = useState(null);
  const [statutEnvoi, setStatutEnvoi] = useState(null);

  useEffect(() => {
    if (visible) {
      setSujet('');
      setContenu('');
      setEmailId(null);
      setStatutEnvoi(null);
    }
  }, [visible]);

  const handleEnvoyer = async () => {
    if (!sujet.trim() || !contenu.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir le sujet et le contenu');
      return;
    }

    setEnvoiEnCours(true);
    try {
      // Créer l'email
      const emailData = await envoyerEmail(user.id, sujet, contenu);
      setEmailId(emailData.id);
      
      // Envoyer l'email
      const envoiData = await envoyerEmailDirect(emailData.id);
      
      if (envoiData.success) {
        setStatutEnvoi('envoye');
        
        // Simuler la réception après 2 secondes (pour démo)
        setTimeout(async () => {
          try {
            await marquerEmailRecu(emailData.id);
            setStatutEnvoi('recu');
            
            // Simuler la lecture après 3 secondes (pour démo)
            setTimeout(async () => {
              try {
                await marquerEmailLu(emailData.id);
                setStatutEnvoi('lu');
              } catch (error) {
                console.log('Erreur marquer lu:', error);
              }
            }, 3000);
          } catch (error) {
            console.log('Erreur marquer reçu:', error);
          }
        }, 2000);
        
        onEmailSent && onEmailSent({
          ...emailData,
          destinataire_info: user,
          sujet,
          contenu,
          statut: 'envoye'
        });
      } else {
        Alert.alert('Erreur', envoiData.error || 'Échec de l\'envoi');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'envoyer l\'email');
      console.error('Erreur email:', error);
    } finally {
      setEnvoiEnCours(false);
    }
  };

  const getStatutColor = (statut) => {
    switch (statut) {
      case 'envoye': return '#FFA500';
      case 'recu': return '#4CAF50';
      case 'lu': return '#2196F3';
      case 'repondu': return '#9C27B0';
      default: return '#9E9E9E';
    }
  };

  const getStatutText = (statut) => {
    switch (statut) {
      case 'envoye': return '📤 Envoyé';
      case 'recu': return '📥 Reçu';
      case 'lu': return '👁️ Lu';
      case 'repondu': return '💬 Répondu';
      default: return '⏳ En attente';
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <Header 
          title={`Email à ${user?.prenom} ${user?.nom}`}
          showBack
          onBackPress={onClose}
        />
        
        <ScrollView style={styles.content}>
          <Card style={styles.formCard}>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user?.prenom} {user?.nom}</Text>
              <Text style={styles.userEmail}>{user?.email}</Text>
              <Text style={styles.userRole}>{user?.role}</Text>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Sujet:</Text>
              <TextInput
                style={styles.input}
                value={sujet}
                onChangeText={setSujet}
                placeholder="Sujet de l'email..."
                editable={!envoiEnCours}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Message:</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={contenu}
                onChangeText={setContenu}
                placeholder="Contenu de votre message..."
                multiline
                numberOfLines={8}
                textAlignVertical="top"
                editable={!envoiEnCours}
              />
            </View>

            {emailId && (
              <View style={styles.statutSection}>
                <Text style={styles.statutTitle}>Suivi de l'email:</Text>
                <View style={[styles.statutBadge, { backgroundColor: getStatutColor(statutEnvoi) }]}>
                  <Text style={styles.statutText}>{getStatutText(statutEnvoi)}</Text>
                </View>
                <Text style={styles.emailId}>ID: {emailId}</Text>
              </View>
            )}

            <Button
              title={envoiEnCours ? 'Envoi en cours...' : 'Envoyer l\'email'}
              onPress={handleEnvoyer}
              loading={envoiEnCours}
              style={styles.sendButton}
              disabled={!sujet.trim() || !contenu.trim() || envoiEnCours}
            />
          </Card>
        </ScrollView>
      </View>
    </Modal>
  );
};

const ConversationModal = ({ visible, emailId, onClose }) => {
  const [conversation, setConversation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [reponse, setReponse] = useState('');
  const [envoiReponse, setEnvoiReponse] = useState(false);

  useEffect(() => {
    if (visible && emailId) {
      loadConversation();
    }
  }, [visible, emailId]);

  const loadConversation = async () => {
    setLoading(true);
    try {
      const data = await getConversation(emailId);
      setConversation(data);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de charger la conversation');
    } finally {
      setLoading(false);
    }
  };

  const handleRepondre = async () => {
    if (!reponse.trim()) {
      Alert.alert('Erreur', 'Veuillez écrire une réponse');
      return;
    }

    setEnvoiReponse(true);
    try {
      const data = await repondreEmail(emailId, reponse);
      Alert.alert('Succès', 'Réponse envoyée avec succès');
      setReponse('');
      loadConversation(); // Recharger la conversation
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'envoyer la réponse');
    } finally {
      setEnvoiReponse(false);
    }
  };

  if (loading) {
    return (
      <Modal visible={visible} animationType="slide">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Chargement de la conversation...</Text>
        </View>
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <Header 
          title="Conversation"
          showBack
          onBackPress={onClose}
        />
        
        <ScrollView style={styles.content}>
          {conversation && (
            <>
              {/* Email original */}
              <Card style={styles.emailCard}>
                <View style={styles.emailHeader}>
                  <Text style={styles.emailSubject}>{conversation.email.sujet}</Text>
                  <Text style={styles.emailDate}>
                    {new Date(conversation.email.date_envoi).toLocaleString('fr-FR')}
                  </Text>
                </View>
                <View style={styles.emailMeta}>
                  <Text style={styles.emailFrom}>
                    De: {conversation.email.expediteur_info.prenom} {conversation.email.expediteur_info.nom}
                  </Text>
                  <Text style={styles.emailTo}>
                    À: {conversation.email.destinataire_info.prenom} {conversation.email.destinataire_info.nom}
                  </Text>
                </View>
                <Text style={styles.emailContent}>{conversation.email.contenu}</Text>
              </Card>

              {/* Réponses */}
              {conversation.reponses.map((rep, index) => (
                <Card key={rep.id} style={styles.reponseCard}>
                  <View style={styles.reponseHeader}>
                    <Text style={styles.reponseAuthor}>
                      {rep.auteur_info.prenom} {rep.auteur_info.nom}
                    </Text>
                    <Text style={styles.reponseDate}>
                      {new Date(rep.date_envoi).toLocaleString('fr-FR')}
                    </Text>
                  </View>
                  <Text style={styles.reponseContent}>{rep.contenu}</Text>
                </Card>
              ))}

              {/* Formulaire de réponse */}
              <Card style={styles.reponseForm}>
                <Text style={styles.reponseFormTitle}>Répondre:</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={reponse}
                  onChangeText={setReponse}
                  placeholder="Votre réponse..."
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
                <Button
                  title={envoiReponse ? 'Envoi en cours...' : 'Envoyer la réponse'}
                  onPress={handleRepondre}
                  loading={envoiReponse}
                  style={styles.reponseButton}
                  disabled={!reponse.trim() || envoiReponse}
                />
              </Card>
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

// Composant pour afficher l'historique des emails envoyés
const EmailHistoryModal = ({ visible, emails, onClose, onEmailDeleted }) => {
  const handleSupprimerEmail = (email) => {
    Alert.alert(
      '🗑️ Supprimer le message',
      `Voulez-vous vraiment supprimer le message "${email.sujet}" envoyé à ${email.destinataire_info.prenom} ${email.destinataire_info.nom} ?`,
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await supprimerMessageAdmin(email.id);
              Alert.alert(
                '✅ Message supprimé',
                'Le message a été supprimé avec succès',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      if (onEmailDeleted) {
                        onEmailDeleted(email.id);
                      }
                    },
                  },
                ]
              );
            } catch (error) {
              Alert.alert(
                '❌ Erreur',
                'Impossible de supprimer ce message',
                [{ text: 'OK' }]
              );
            }
          },
        },
      ]
    );
  };

  const renderEmailItem = ({ item }) => (
    <View style={styles.emailItemContainer}>
      <TouchableOpacity 
        style={styles.emailItem}
        onPress={() => {
          // Ouvrir la conversation
          onClose();
          // Naviguer vers la conversation
        }}
      >
        <View style={styles.emailItemHeader}>
          <Text style={styles.emailItemSubject}>{item.sujet}</Text>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.statut) }]} />
        </View>
        <Text style={styles.emailItemRecipient}>
          À: {item.destinataire_info.prenom} {item.destinataire_info.nom}
        </Text>
        <Text style={styles.emailItemDate}>
          {new Date(item.date_envoi).toLocaleDateString('fr-FR')}
        </Text>
        {item.nb_reponses > 0 && (
          <Text style={styles.emailItemReplies}>
            {item.nb_reponses} répons{item.nb_reponses > 1 ? 'es' : 'e'}
          </Text>
        )}
      </TouchableOpacity>
      
      {/* Bouton de suppression - seulement pour les messages envoyés par admin */}
      {item.expediteur_info?.role === 'admin' && (
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={() => handleSupprimerEmail(item)}
        >
          <Ionicons name="trash-outline" size={20} color="#FF3B30" />
        </TouchableOpacity>
      )}
    </View>
  );

  const getStatusColor = (statut) => {
    switch (statut) {
      case 'envoye': return '#FFA500';
      case 'recu': return '#4CAF50';
      case 'lu': return '#2196F3';
      case 'repondu': return '#9C27B0';
      default: return '#9E9E9E';
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <Header 
          title="Historique des emails"
          showBack
          onBackPress={onClose}
        />
        
        <View style={styles.content}>
          {emails.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyText}>Aucun email envoyé</Text>
            </Card>
          ) : (
            <FlatList
              data={emails}
              renderItem={renderEmailItem}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={styles.emailList}
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

export { EmailModal, ConversationModal, EmailHistoryModal };

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  formCard: {
    padding: 20,
  },
  userInfo: {
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  userRole: {
    fontSize: 12,
    color: '#007AFF',
    marginTop: 4,
    textTransform: 'capitalize',
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
  textArea: {
    height: 120,
  },
  statutSection: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  statutTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  statutBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  statutText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  emailId: {
    fontSize: 11,
    color: '#888',
    fontFamily: 'monospace',
  },
  sendButton: {
    marginTop: 20,
  },
  emailCard: {
    padding: 16,
    marginBottom: 16,
  },
  emailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  emailSubject: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  emailDate: {
    fontSize: 12,
    color: '#888',
  },
  emailMeta: {
    marginBottom: 12,
  },
  emailFrom: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  emailTo: {
    fontSize: 14,
    color: '#666',
  },
  emailContent: {
    fontSize: 15,
    lineHeight: 22,
    color: '#333',
  },
  reponseCard: {
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#f8f9fa',
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  reponseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reponseAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  reponseDate: {
    fontSize: 12,
    color: '#888',
  },
  reponseContent: {
    fontSize: 14,
    lineHeight: 20,
    color: '#333',
  },
  reponseForm: {
    padding: 16,
  },
  reponseFormTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  reponseButton: {
    marginTop: 12,
  },
  emailItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  emailItem: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  emailItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  emailItemSubject: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  emailItemRecipient: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  emailItemDate: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  emailItemReplies: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  emailItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  emailItem: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  deleteButton: {
    marginLeft: 8,
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emailList: {
    paddingBottom: 16,
  },
  emptyCard: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});
