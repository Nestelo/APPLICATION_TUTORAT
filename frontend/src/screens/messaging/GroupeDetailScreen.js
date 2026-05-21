import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Alert,
  TextInput, ScrollView, Modal, RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/ui/Header';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';
import {
  getGroupeDetail, getMessagesGroupe, envoyerMessageGroupe,
  getFichiersGroupe, getExercicesGroupe, ajouterMembresGroupe,
  retirerMembreGroupe, getEtudiantsDisponibles
} from '../../api/messagingService';

const GroupeDetailScreen = ({ navigation, route }) => {
  const { groupeId } = route.params;
  const { user } = useAuth();
  const [groupe, setGroupe] = useState(null);
  const [messages, setMessages] = useState([]);
  const [fichiers, setFichiers] = useState([]);
  const [exercices, setExercices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('messages');
  const [newMessage, setNewMessage] = useState('');
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [etudiantsDisponibles, setEtudiantsDisponibles] = useState([]);
  const [selectedEtudiants, setSelectedEtudiants] = useState([]);

  useEffect(() => {
    loadGroupeData();
  }, []);

  const loadGroupeData = async () => {
    try {
      const groupeData = await getGroupeDetail(groupeId);
      setGroupe(groupeData);
      
      // Charger les données en parallèle
      const [messagesData, fichiersData, exercicesData] = await Promise.all([
        getMessagesGroupe(groupeId),
        getFichiersGroupe(groupeId),
        getExercicesGroupe(groupeId)
      ]);
      
      setMessages(messagesData);
      setFichiers(fichiersData);
      setExercices(exercicesData);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de charger les données du groupe');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadGroupeData();
    setRefreshing(false);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      const message = await envoyerMessageGroupe(groupeId, {
        contenu: newMessage,
        type_message: 'texte'
      });
      setMessages([...messages, message]);
      setNewMessage('');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'envoyer le message');
    }
  };

  const handleAddMembers = async () => {
    if (selectedEtudiants.length === 0) {
      Alert.alert('Erreur', 'Veuillez sélectionner au moins un étudiant');
      return;
    }

    try {
      await ajouterMembresGroupe(groupeId, selectedEtudiants);
      Alert.alert('Succès', `${selectedEtudiants.length} membre(s) ajouté(s)`);
      setShowAddMembers(false);
      setSelectedEtudiants([]);
      loadGroupeData();
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'ajouter les membres');
    }
  };

  const handleRemoveMember = async (etudiantId) => {
    Alert.alert(
      'Confirmation',
      'Êtes-vous sûr de vouloir retirer ce membre ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Retirer',
          style: 'destructive',
          onPress: async () => {
            try {
              await retirerMembreGroupe(groupeId, etudiantId);
              Alert.alert('Succès', 'Membre retiré');
              loadGroupeData();
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de retirer le membre');
            }
          }
        }
      ]
    );
  };

  const loadEtudiantsDisponibles = async () => {
    try {
      const data = await getEtudiantsDisponibles();
      setEtudiantsDisponibles(data);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de charger les étudiants disponibles');
    }
  };

  useEffect(() => {
    if (showAddMembers) {
      loadEtudiantsDisponibles();
    }
  }, [showAddMembers]);

  const renderMessage = ({ item }) => (
    <View style={[
      styles.messageContainer,
      item.auteur === user.id ? styles.myMessage : styles.otherMessage
    ]}>
      <View style={styles.messageHeader}>
        <Text style={styles.messageAuthor}>
          {item.auteur_details?.prenom} {item.auteur_details?.nom}
        </Text>
        <Text style={styles.messageTime}>
          {formatTime(item.date_envoi)}
        </Text>
      </View>
      <Text style={styles.messageContent}>{item.contenu}</Text>
    </View>
  );

  const renderFichier = ({ item }) => (
    <Card style={styles.fichierCard}>
      <View style={styles.fichierHeader}>
        <Ionicons name="document" size={24} color="#007bff" />
        <View style={styles.fichierInfo}>
          <Text style={styles.fichierTitle}>{item.titre}</Text>
          <Text style={styles.fichierDescription}>{item.description}</Text>
          <Text style={styles.fichierMeta}>
            {item.auteur_details?.prenom} • {formatDate(item.date_ajout)}
          </Text>
        </View>
      </View>
      <TouchableOpacity style={styles.downloadButton}>
        <Ionicons name="download" size={16} color="#007bff" />
        <Text style={styles.downloadText}>Télécharger</Text>
      </TouchableOpacity>
    </Card>
  );

  const renderExercice = ({ item }) => (
    <Card style={styles.exerciceCard}>
      <View style={styles.exerciceHeader}>
        <View style={styles.exerciceInfo}>
          <Text style={styles.exerciceTitle}>{item.titre}</Text>
          <View style={styles.exerciceMeta}>
            <View style={[
              styles.difficultyBadge,
              item.difficulte === 'facile' && styles.easyBadge,
              item.difficulte === 'moyen' && styles.mediumBadge,
              item.difficulte === 'difficile' && styles.hardBadge
            ]}>
              <Text style={styles.difficultyText}>{item.difficulte}</Text>
            </View>
            <Text style={styles.exerciceDate}>
              {formatDate(item.date_creation)}
            </Text>
          </View>
        </View>
      </View>
      <Text style={styles.exerciceContent} numberOfLines={3}>
        {item.enonce}
      </Text>
      <TouchableOpacity style={styles.exerciceButton}>
        <Ionicons name="eye" size={16} color="#28a745" />
        <Text style={styles.exerciceButtonText}>Voir l'exercice</Text>
      </TouchableOpacity>
    </Card>
  );

  const renderEtudiantSelection = ({ item }) => {
    const isSelected = selectedEtudiants.includes(item.id);
    return (
      <TouchableOpacity
        style={[styles.etudiantItem, isSelected && styles.selectedEtudiant]}
        onPress={() => {
          if (isSelected) {
            setSelectedEtudiants(selectedEtudiants.filter(id => id !== item.id));
          } else {
            setSelectedEtudiants([...selectedEtudiants, item.id]);
          }
        }}
      >
        <View style={styles.etudiantInfo}>
          <Text style={styles.etudiantName}>
            {item.prenom} {item.nom}
          </Text>
          <Text style={styles.etudiantDetails}>
            {item.filiere} • {item.annee}
          </Text>
        </View>
        <View style={[styles.checkbox, isSelected && styles.checked]}>
          {isSelected && <Ionicons name="checkmark" size={16} color="white" />}
        </View>
      </TouchableOpacity>
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) return <LoadingSpinner />;

  return (
    <>
      <Header title={groupe?.nom || 'Groupe'} showBack onBackPress={() => navigation.goBack()} />
      <View style={styles.container}>
        {/* Onglets */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'messages' && styles.activeTab]}
            onPress={() => setActiveTab('messages')}
          >
            <Ionicons name="chatbubble" size={20} color={activeTab === 'messages' ? '#007bff' : '#666'} />
            <Text style={[styles.tabText, activeTab === 'messages' && styles.activeTabText]}>
              Messages
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'fichiers' && styles.activeTab]}
            onPress={() => setActiveTab('fichiers')}
          >
            <Ionicons name="folder" size={20} color={activeTab === 'fichiers' ? '#007bff' : '#666'} />
            <Text style={[styles.tabText, activeTab === 'fichiers' && styles.activeTabText]}>
              Fichiers
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'exercices' && styles.activeTab]}
            onPress={() => setActiveTab('exercices')}
          >
            <Ionicons name="create" size={20} color={activeTab === 'exercices' ? '#007bff' : '#666'} />
            <Text style={[styles.tabText, activeTab === 'exercices' && styles.activeTabText]}>
              Exercices
            </Text>
          </TouchableOpacity>
        </View>

        {/* Contenu des onglets */}
        <ScrollView
          style={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {activeTab === 'messages' && (
            <View style={styles.messagesContainer}>
              <FlatList
                data={messages}
                renderItem={renderMessage}
                keyExtractor={(item) => item.id.toString()}
                style={styles.messagesList}
              />
              <View style={styles.messageInputContainer}>
                <TextInput
                  style={styles.messageInput}
                  placeholder="Écrivez votre message..."
                  value={newMessage}
                  onChangeText={setNewMessage}
                  multiline
                />
                <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
                  <Ionicons name="send" size={20} color="#007bff" />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {activeTab === 'fichiers' && (
            <View>
              {fichiers.length > 0 ? (
                <FlatList
                  data={fichiers}
                  renderItem={renderFichier}
                  keyExtractor={(item) => item.id.toString()}
                />
              ) : (
                <View style={styles.emptyContainer}>
                  <Ionicons name="folder-open" size={48} color="#ccc" />
                  <Text style={styles.emptyText}>Aucun fichier partagé</Text>
                </View>
              )}
            </View>
          )}

          {activeTab === 'exercices' && (
            <View>
              {exercices.length > 0 ? (
                <FlatList
                  data={exercices}
                  renderItem={renderExercice}
                  keyExtractor={(item) => item.id.toString()}
                />
              ) : (
                <View style={styles.emptyContainer}>
                  <Ionicons name="create-outline" size={48} color="#ccc" />
                  <Text style={styles.emptyText}>Aucun exercice publié</Text>
                </View>
              )}
            </View>
          )}
        </ScrollView>

        {/* Actions pour le tuteur */}
        {user.role === 'tuteur' && groupe?.tuteur === user.id && (
          <View style={styles.tutorActions}>
            <Button
              title="👥 Ajouter des membres"
              onPress={() => setShowAddMembers(true)}
              style={styles.actionButton}
            />
            <Button
              title="📁 Partager un fichier"
              onPress={() => Alert.alert('Info', 'Fonctionnalité bientôt disponible')}
              style={styles.actionButton}
            />
            <Button
              title="✏️ Créer un exercice"
              onPress={() => Alert.alert('Info', 'Fonctionnalité bientôt disponible')}
              style={styles.actionButton}
            />
          </View>
        )}

        {/* Modal pour ajouter des membres */}
        <Modal
          visible={showAddMembers}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <View style={styles.modalContainer}>
            <Header title="Ajouter des membres" showBack onBackPress={() => setShowAddMembers(false)} />
            <ScrollView style={styles.modalContent}>
              <FlatList
                data={etudiantsDisponibles}
                renderItem={renderEtudiantSelection}
                keyExtractor={(item) => item.id.toString()}
              />
            </ScrollView>
            <View style={styles.modalActions}>
              <Button
                title={`Ajouter (${selectedEtudiants.length})`}
                onPress={handleAddMembers}
                disabled={selectedEtudiants.length === 0}
              />
            </View>
          </View>
        </Modal>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#007bff',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  activeTabText: {
    color: '#007bff',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesList: {
    padding: 16,
  },
  messageContainer: {
    marginBottom: 12,
    maxWidth: '80%',
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#007bff',
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  messageAuthor: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  messageTime: {
    fontSize: 11,
    color: '#999',
  },
  messageContent: {
    fontSize: 14,
    color: '#333',
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  messageInputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  messageInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fichierCard: {
    margin: 16,
    padding: 16,
  },
  fichierHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  fichierInfo: {
    flex: 1,
    marginLeft: 12,
  },
  fichierTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  fichierDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  fichierMeta: {
    fontSize: 12,
    color: '#999',
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
  },
  downloadText: {
    fontSize: 14,
    color: '#007bff',
    marginLeft: 4,
  },
  exerciceCard: {
    margin: 16,
    padding: 16,
  },
  exerciceHeader: {
    marginBottom: 12,
  },
  exerciceInfo: {
    flex: 1,
  },
  exerciceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  exerciceMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  easyBadge: {
    backgroundColor: '#d4edda',
  },
  mediumBadge: {
    backgroundColor: '#fff3cd',
  },
  hardBadge: {
    backgroundColor: '#f8d7da',
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '600',
  },
  exerciceDate: {
    fontSize: 12,
    color: '#999',
  },
  exerciceContent: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  exerciceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#e8f5e8',
    borderRadius: 8,
  },
  exerciceButtonText: {
    fontSize: 14,
    color: '#28a745',
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 64,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
  tutorActions: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  actionButton: {
    marginBottom: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalContent: {
    flex: 1,
  },
  modalActions: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  etudiantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  selectedEtudiant: {
    backgroundColor: '#e3f2fd',
  },
  etudiantInfo: {
    flex: 1,
  },
  etudiantName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  etudiantDetails: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checked: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
  },
});

export default GroupeDetailScreen;
