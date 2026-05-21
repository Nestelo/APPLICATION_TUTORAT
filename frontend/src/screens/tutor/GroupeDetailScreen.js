import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, FlatList, TextInput, Image } from 'react-native';
import Header from '../../components/ui/Header';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { Ionicons } from '@expo/vector-icons';
import { getGroupe, updateGroupe, deleteGroupe, getMembresGroupe, ajouterMembreGroupe, supprimerMembreGroupe, getInscriptionsGroupe, accepterInscription, refuserInscription, createGroupe, envoyerMessageGroupe, getMessagesGroupe } from '../../api/tutorService';
import { getRessourcesGroupe } from '../../api/ressourceService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const GroupeDetailScreen = ({ navigation, route }) => {
  const { groupeId } = route.params || {};
  const [groupe, setGroupe] = useState(null);
  const [membres, setMembres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [activeTab, setActiveTab] = useState('membres'); // 'membres', 'chat', 'ressources'
  const [ressources, setRessources] = useState([]);
  const [loadingRessources, setLoadingRessources] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  
  // États pour les inscriptions en attente
  const [inscriptionsEnAttente, setInscriptionsEnAttente] = useState([]);
  const [showInscriptions, setShowInscriptions] = useState(false);
  const [loadingInscriptions, setLoadingInscriptions] = useState(false);

  useEffect(() => {
    loadGroupe();
    loadMembres();
    loadInscriptionsEnAttente();
    loadMessages();
  }, [groupeId]);

  useEffect(() => {
    if (activeTab === 'ressources') {
      loadRessources();
    }
  }, [activeTab, groupeId]);

  const loadGroupe = async () => {
    try {
      const response = await getGroupe(groupeId);
      if (response.success) {
        setGroupe(response.data);
      }
    } catch (error) {
      console.error('Erreur chargement groupe:', error);
    }
  };

  const loadRessources = async () => {
    try {
      setLoadingRessources(true);
      const data = await getRessourcesGroupe(groupeId);
      setRessources(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erreur chargement ressources:', error);
      
      // Gérer les erreurs d'authentification
      if (error.response?.status === 401) {
        console.log('Erreur 401 - Problème d\'authentification');
        // Optionnel: rediriger vers l'écran de connexion
        // navigation.navigate('Login');
      } else if (error.response?.status === 403) {
        console.log('Erreur 403 - Permissions insuffisantes');
      } else if (error.response?.status === 404) {
        console.log('Erreur 404 - Groupe non trouvé');
      } else {
        console.log('Erreur serveur ou réseau:', error.message);
      }
      
      setRessources([]);
    } finally {
      setLoadingRessources(false);
    }
  };

  const loadMembres = async () => {
    try {
      const response = await getMembresGroupe(groupeId);
      console.log('📥 Réponse membres:', response);
      if (response.success) {
        console.log('👥 Données membres reçues:', response.data);
        const membresEnrichis = await enrichirMembresAvecDetails(response.data.membres || response.data || []);
        setMembres(membresEnrichis);
      } else {
        console.error('❌ Erreur réponse membres:', response.error);
        // Vérifier si c'est une erreur de permission
        if (response.error && response.error.includes('pas le créateur')) {
          Alert.alert(
            'Accès non autorisé',
            "Vous n'êtes pas le créateur de ce groupe. Vous êtes redirigé vers vos groupes.",
            [
              {
                text: 'OK',
                onPress: () => navigation.navigate('Tutorat')
              }
            ]
          );
        } else if (response.error && response.error.includes('pas membre')) {
          Alert.alert(
            'Accès refusé',
            "Vous n'êtes pas membre de ce groupe. Vous êtes redirigé vers vos groupes.",
            [
              {
                text: 'OK',
                onPress: () => navigation.navigate('Tutorat')
              }
            ]
          );
        }
      }
    } catch (error) {
      console.error('❌ Erreur chargement membres:', error);
      // Vérifier si c'est une erreur 403
      if (error.response?.status === 403) {
        Alert.alert(
          'Accès non autorisé',
          "Vous n'avez pas la permission de voir ce groupe. Vous êtes redirigé vers vos groupes.",
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('Tutorat')
            }
          ]
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const enrichirMembresAvecDetails = async (membres) => {
    try {
      // Obtenir toutes les inscriptions pour avoir les détails complets
      const response = await getInscriptionsGroupe();
      if (response.success) {
        let inscriptions = [];
        if (Array.isArray(response.data)) {
          inscriptions = response.data;
        } else if (response.data && Array.isArray(response.data.results)) {
          inscriptions = response.data.results;
        }
        
        // Filtrer les inscriptions acceptées pour ce groupe
        const inscriptionsAcceptees = inscriptions.filter(
          insc => insc.statut === 'accepte' && insc.groupe_details?.id == groupeId
        );
        
        console.log('🔍 Inscriptions acceptées pour enrichissement:', inscriptionsAcceptees);
        
        // Enrichir chaque membre avec ses détails
        const membresEnrichis = membres.map(membre => {
          const inscriptionCorrespondante = inscriptionsAcceptees.find(
            insc => insc.etudiant_details?.id === membre.id
          );
          
          if (inscriptionCorrespondante && inscriptionCorrespondante.etudiant_details) {
            return {
              ...membre,
              ...inscriptionCorrespondante.etudiant_details,
              // Garder les informations originales si elles existent
              date_inscription: membre.date_inscription || inscriptionCorrespondante.date_inscription
            };
          }
          
          return membre;
        });
        
        console.log('✨ Membres enrichis:', membresEnrichis);
        return membresEnrichis;
      }
    } catch (error) {
      console.error('❌ Erreur enrichissement membres:', error);
      return membres; // Retourner les membres originaux en cas d'erreur
    }
  };

  const handleAddMember = async () => {
    if (!newMemberEmail.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un email valide');
      return;
    }

    try {
      const response = await ajouterMembreGroupe(groupeId, { email: newMemberEmail.trim() });
      if (response.success) {
        Alert.alert('Succès', 'Membre ajouté avec succès');
        setNewMemberEmail('');
        setShowAddMember(false);
        loadMembres();
      } else {
        Alert.alert('Erreur', response.error || 'Impossible d\'ajouter le membre');
      }
    } catch (error) {
      console.error('Erreur ajout membre:', error);
      Alert.alert('Erreur', 'Impossible d\'ajouter le membre');
    }
  };

  const handleRemoveMember = (membreId) => {
    Alert.alert(
      'Supprimer le membre',
      'Voulez-vous vraiment supprimer ce membre du groupe ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Supprimer', 
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await supprimerMembreGroupe(groupeId, membreId);
              if (response.success) {
                Alert.alert('Succès', 'Membre supprimé avec succès');
                loadMembres();
              } else {
                Alert.alert('Erreur', response.error || 'Impossible de supprimer le membre');
              }
            } catch (error) {
              console.error('Erreur suppression membre:', error);
              Alert.alert('Erreur', 'Impossible de supprimer le membre');
            }
          }
        }
      ]
    );
  };

  const loadInscriptionsEnAttente = async () => {
    try {
      setLoadingInscriptions(true);
      const response = await getInscriptionsGroupe();
      console.log('Réponse API inscriptions:', response);
      
      if (response.success) {
        // Vérifier que response.data est un tableau
        let inscriptions = [];
        if (Array.isArray(response.data)) {
          inscriptions = response.data;
        } else if (response.data && Array.isArray(response.data.results)) {
          inscriptions = response.data.results;
        } else if (response.data && Array.isArray(response.data.inscriptions)) {
          inscriptions = response.data.inscriptions;
        } else {
          console.log('Structure inattendue de response.data:', response.data);
          inscriptions = [];
        }
        
        console.log('Inscriptions brutes:', inscriptions);
        
        // Filtrer uniquement les inscriptions en attente pour ce groupe
        const inscriptionsFiltrees = inscriptions.filter(
          insc => insc.statut === 'en_attente' && insc.groupe_details?.id == groupeId
        );
        
        console.log('Inscriptions filtrées pour ce groupe:', inscriptionsFiltrees);
        setInscriptionsEnAttente(inscriptionsFiltrees);
      } else {
        console.error('Erreur API inscriptions:', response.error);
        setInscriptionsEnAttente([]);
      }
    } catch (error) {
      console.error('Erreur chargement inscriptions en attente:', error);
      setInscriptionsEnAttente([]);
    } finally {
      setLoadingInscriptions(false);
    }
  };

  const handleAccepterInscription = async (inscriptionId) => {
    try {
      const capaciteMax = groupe?.capacite_max || 10;
      
      // Vérifier si le groupe est plein avant d'accepter
      if (membres.length >= capaciteMax) {
        Alert.alert(
          'Groupe complet',
          `Ce groupe a atteint sa capacité maximale de ${capaciteMax} membres. Un groupe suite va être créé automatiquement.`,
          [
            {
              text: 'OK',
              onPress: async () => {
                await creerGroupeSuite();
              }
            }
          ]
        );
        return;
      }

      const response = await accepterInscription(inscriptionId);
      if (response.success) {
        Alert.alert('Succès', 'Inscription acceptée avec succès');
        loadInscriptionsEnAttente(); // Recharger les inscriptions en attente
        loadMembres(); // Recharger les membres pour mettre à jour le compteur
        
        // Vérifier si le groupe est maintenant plein après l'ajout
        if (membres.length + 1 >= capaciteMax) {
          Alert.alert(
            'Groupe complet',
            `Ce groupe a maintenant atteint sa capacité maximale de ${capaciteMax} membres. Les prochaines inscriptions seront dirigées vers un groupe suite.`
          );
        }
      } else {
        Alert.alert('Erreur', response.error || 'Impossible d\'accepter l\'inscription');
      }
    } catch (error) {
      console.error('Erreur acceptation inscription:', error);
      Alert.alert('Erreur', 'Impossible d\'accepter l\'inscription');
    }
  };

  const handleRefuserInscription = async (inscriptionId) => {
    try {
      const response = await refuserInscription(inscriptionId);
      if (response.success) {
        Alert.alert('Succès', 'Inscription refusée');
        loadInscriptionsEnAttente(); // Recharger les inscriptions en attente
      } else {
        Alert.alert('Erreur', response.error || 'Impossible de refuser l\'inscription');
      }
    } catch (error) {
      console.error('Erreur refus inscription:', error);
      Alert.alert('Erreur', 'Impossible de refuser l\'inscription');
    }
  };

  const creerGroupeSuite = async () => {
    try {
      Alert.alert('Création en cours', 'Création du groupe suite en cours...');
      
      // Préparer les données du groupe suite
      const groupeSuiteData = {
        nom: `${groupe?.nom} - Suite`,
        description: `${groupe?.description}\n\n(Groupe suite créé automatiquement car le groupe original est complet)`,
        matiere: groupe?.matiere,
        niveau: groupe?.niveau,
        capacite_max: groupe?.capacite_max || 10, // Utiliser la même capacité que le groupe original
        prive: groupe?.prive || false,
        auto_inscription: groupe?.auto_inscription || true
      };

      // Créer le groupe suite
      const response = await createGroupe(groupeSuiteData);
      
      if (response.success) {
        const nouveauGroupeId = response.data.id;
        
        // Transférer les membres du groupe original vers le groupe suite
        await transfererMembresVersGroupeSuite(nouveauGroupeId);
        
        Alert.alert(
          'Succès',
          'Le groupe suite a été créé avec succès et les membres ont été transférés.',
          [
            {
              text: 'Voir le groupe suite',
              onPress: () => {
                navigation.replace('GroupeDetail', { groupeId: nouveauGroupeId });
              }
            },
            {
              text: 'OK',
              style: 'cancel'
            }
          ]
        );
      } else {
        Alert.alert('Erreur', response.error || 'Impossible de créer le groupe suite');
      }
    } catch (error) {
      console.error('Erreur création groupe suite:', error);
      Alert.alert('Erreur', 'Impossible de créer le groupe suite');
    }
  };

  const transfererMembresVersGroupeSuite = async (nouveauGroupeId) => {
    try {
      // Récupérer tous les membres actuels du groupe
      const membresActuels = membres.filter(membre => membre.role !== 'tuteur'); // Exclure le tuteur
      
      // Ajouter chaque membre au nouveau groupe suite
      for (const membre of membresActuels) {
        await ajouterMembreGroupe(nouveauGroupeId, { email: membre.email });
      }
      
      console.log('Membres transférés avec succès vers le groupe suite');
    } catch (error) {
      console.error('Erreur transfert membres:', error);
      // Ne pas afficher d'alerte ici car c'est une opération secondaire
    }
  };

  const handleDeleteGroup = () => {
    Alert.alert(
      'Supprimer le groupe',
      'Voulez-vous vraiment supprimer ce groupe ? Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Supprimer', 
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await deleteGroupe(groupeId);
              if (response.success) {
                Alert.alert('Succès', 'Groupe supprimé avec succès', [
                  { text: 'OK', onPress: () => navigation.goBack() }
                ]);
              } else {
                Alert.alert('Erreur', response.error || 'Impossible de supprimer le groupe');
              }
            } catch (error) {
              console.error('Erreur suppression groupe:', error);
              Alert.alert('Erreur', 'Impossible de supprimer le groupe');
            }
          }
        }
      ]
    );
  };

  const loadMessages = async () => {
    try {
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
        // Utiliser le message retourné par le backend
        const messageEnvoye = response.data;
        
        // Ajouter le message à la liste localement avec les bonnes données
        setMessages(prevMessages => [...prevMessages, messageEnvoye]);
        setNewMessage('');
        
        console.log('Message envoyé avec succès:', messageEnvoye);
        
        // Recharger les messages pour s'assurer d'avoir les données à jour
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

  const renderResourceItem = ({ item }) => {
  const getResourceIcon = (type) => {
    switch (type) {
      case 'cours': return 'book';
      case 'pdf': return 'document';
      case 'video': return 'videocam';
      case 'exercice': return 'create';
      case 'corrige': return 'checkmark-circle';
      case 'lien': return 'link';
      default: return 'document';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'cours': return '#007AFF';
      case 'pdf': return '#FF3B30';
      case 'video': return '#34C759';
      case 'exercice': return '#FF9500';
      case 'corrige': return '#5856D6';
      case 'lien': return '#8E8E93';
      default: return '#8E8E93';
    }
  };

  return (
    <View style={styles.resourceItem}>
      <View style={styles.resourceIcon}>
        <Ionicons 
          name={getResourceIcon(item.type)} 
          size={24} 
          color={getTypeColor(item.type)} 
        />
      </View>
      
      <View style={styles.resourceInfo}>
        <Text style={styles.resourceTitle}>{item.titre}</Text>
        <Text style={styles.resourceDescription} numberOfLines={2}>
          {item.description || 'Aucune description'}
        </Text>
        <View style={styles.resourceMeta}>
          <Text style={styles.resourceType}>{item.type_display || item.type}</Text>
          <Text style={styles.resourceDate}>
            {item.date_creation ? new Date(item.date_creation).toLocaleDateString() : 'Date inconnue'}
          </Text>
        </View>
        {item.validee_par_admin && (
          <View style={styles.validatedBadge}>
            <Ionicons name="checkmark-circle" size={12} color="#34C759" />
            <Text style={styles.validatedText}>Validée</Text>
          </View>
        )}
      </View>
      
      <View style={styles.resourceActions}>
        {item.fichier && (
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="download" size={20} color="#007AFF" />
          </TouchableOpacity>
        )}
        {item.lien_externe && (
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="open" size={20} color="#007AFF" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const renderMemberItem = ({ item }) => {
    console.log('?? Rendu membre:', item);
    return (
      <View style={styles.memberItem}>
        {/* Photo du membre */}
        <View style={styles.memberPhotoContainer}>
          {item.photo ? (
            <Image 
              source={{ 
                uri: item.photo.startsWith('http') 
                  ? item.photo 
                  : `http://192.168.43.210:8000${item.photo}` 
              }} 
              style={styles.memberPhoto}
            />
          ) : (
            <View style={styles.memberDefaultPhoto}>
              <Ionicons name="person" size={24} color="#999" />
            </View>
          )}
        </View>
        
        <View style={styles.memberInfo}>
          <Text style={styles.memberName}>
            {item.prenom && item.nom ? `${item.prenom} ${item.nom}` : (item.nom || item.email)}
          </Text>
          <Text style={styles.memberEmail}>{item.email}</Text>
          <Text style={styles.memberRole}>{item.role === 'tuteur' ? 'Tuteur' : 'Étudiant'}</Text>
          
          {/* Informations académiques */}
          {(item.filiere || item.annee) && (
            <Text style={styles.memberAcademicInfo}>
              {item.filiere && `Filière: ${item.filiere}`}
              {item.filiere && item.annee && ' | '}
              {item.annee && `Niveau: ${item.annee}`}
            </Text>
          )}
          
          {/* Biographie */}
          {item.biographie && (
            <Text style={styles.memberBio} numberOfLines={3}>
              {item.biographie}
            </Text>
          )}
          
          {item.date_inscription && (
            <Text style={styles.memberDate}>
              Inscrit le: {new Date(item.date_inscription).toLocaleDateString('fr-FR')}
            </Text>
          )}
        </View>
        
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => handleRemoveMember(item.id)}
        >
          <Ionicons name="trash-outline" size={20} color="#dc3545" />
        </TouchableOpacity>
      </View>
    );
  };

  const renderMessageItem = ({ item }) => {
    // Utiliser le nom complet de l'auteur si disponible, sinon utiliser 'Moi' pour les messages envoyés
    const auteurNom = item.auteur_details ? 
      `${item.auteur_details.prenom} ${item.auteur_details.nom}` : 
      (item.auteur === 'Moi' ? 'Moi' : item.auteur);
    
    // Formater la date correctement
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Chargement...</Text>
      </View>
    );
  }

  return (
    <>
      <Header 
        title={groupe?.nom || "Détails du groupe"} 
        showBack 
        onBackPress={() => navigation.goBack()} 
      />
      <FlatList
        style={styles.container}
        data={[
          { type: 'info' },
          { type: 'inscriptions' },
          { type: 'tabs' },
          { type: 'content' }
        ]}
        renderItem={({ item }) => {
          if (item.type === 'info') {
            return (
              <Card style={styles.infoCard}>
                <Text style={styles.groupName}>{groupe?.nom}</Text>
                <Text style={styles.groupDescription}>{groupe?.description}</Text>
                <View style={styles.groupStats}>
                  <Text style={styles.statItem}>📚 {groupe?.matiere}</Text>
                  <Text style={styles.statItem}>📊 {groupe?.niveau}</Text>
                  <Text style={styles.statItem}>👥 {membres.length}/{groupe?.capacite_max || 10} membres</Text>
                </View>
                <View style={styles.groupActions}>
                  <Button
                    title={`Inscriptions (${inscriptionsEnAttente.length})`}
                    onPress={() => setShowInscriptions(!showInscriptions)}
                    variant="primary"
                    size="small"
                  />
                  <Button
                    title="✏️ Modifier"
                    onPress={() => navigation.navigate('CreerGroupe', { groupeId })}
                    variant="outline"
                    size="small"
                  />
                  <Button
                    title="🗑️ Supprimer"
                    onPress={handleDeleteGroup}
                    variant="danger"
                    size="small"
                  />
                </View>
              </Card>
            );
          }
          
          if (item.type === 'inscriptions') {
            if (!showInscriptions || inscriptionsEnAttente.length === 0) {
              return null;
            }
            
            return (
              <Card style={styles.inscriptionsCard}>
                <View style={styles.inscriptionsHeader}>
                  <Text style={styles.inscriptionsTitle}>
                    Étudiants en attente ({inscriptionsEnAttente.length})
                  </Text>
                  <TouchableOpacity onPress={() => setShowInscriptions(false)}>
                    <Ionicons name="close" size={24} color="#666" />
                  </TouchableOpacity>
                </View>
                
                {loadingInscriptions ? (
                  <Text style={styles.loadingText}>Chargement...</Text>
                ) : (
                  <View style={styles.inscriptionsList}>
                    {inscriptionsEnAttente.map((inscription) => (
                      <View key={inscription.id} style={styles.inscriptionItem}>
                        <View style={styles.inscriptionStudentInfo}>
                          {inscription.etudiant_details?.photo ? (
                            <Image 
                              source={{ uri: inscription.etudiant_details.photo }} 
                              style={styles.studentPhoto}
                            />
                          ) : (
                            <View style={styles.defaultPhoto}>
                              <Ionicons name="person" size={24} color="#999" />
                            </View>
                          )}
                          
                          <View style={styles.studentDetails}>
                            <Text style={styles.studentName}>
                              {inscription.etudiant_details?.prenom} {inscription.etudiant_details?.nom}
                            </Text>
                            <Text style={styles.studentEmail}>
                              {inscription.etudiant_details?.email}
                            </Text>
                            
                            {/* Informations académiques */}
                            {(inscription.etudiant_details?.filiere || inscription.etudiant_details?.annee) && (
                              <Text style={styles.studentAcademicInfo}>
                                {inscription.etudiant_details?.filiere && `Filière: ${inscription.etudiant_details.filiere}`}
                                {inscription.etudiant_details?.filiere && inscription.etudiant_details?.annee && ' | '}
                                {inscription.etudiant_details?.annee && `Niveau: ${inscription.etudiant_details.annee}`}
                              </Text>
                            )}
                            
                            {/* Biographie */}
                            {inscription.etudiant_details?.biographie && (
                              <Text style={styles.studentBio} numberOfLines={2}>
                                {inscription.etudiant_details.biographie}
                              </Text>
                            )}
                            
                            {/* Téléphone */}
                            {inscription.etudiant_details?.telephone && (
                              <Text style={styles.studentPhone}>? {inscription.etudiant_details.telephone}</Text>
                            )}
                            
                            <Text style={styles.inscriptionDate}>
                              Inscrit le: {new Date(inscription.date_inscription).toLocaleDateString('fr-FR')}
                            </Text>
                          </View>
                        </View>
                        
                        <View style={styles.inscriptionActions}>
                          <TouchableOpacity
                            style={[styles.actionButton, styles.acceptButton]}
                            onPress={() => handleAccepterInscription(inscription.id)}
                          >
                            <Ionicons name="checkmark" size={16} color="#fff" />
                            <Text style={styles.actionText}>Accepter</Text>
                          </TouchableOpacity>
                          
                          <TouchableOpacity
                            style={[styles.actionButton, styles.refuseButton]}
                            onPress={() => handleRefuserInscription(inscription.id)}
                          >
                            <Ionicons name="close" size={16} color="#fff" />
                            <Text style={styles.actionText}>Refuser</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </Card>
            );
          }
          
          if (item.type === 'tabs') {
            return (
              <View style={styles.tabContainer}>
                <TouchableOpacity
                  style={[styles.tab, activeTab === 'membres' && styles.activeTab]}
                  onPress={() => setActiveTab('membres')}
                >
                  <Text style={[styles.tabText, activeTab === 'membres' && styles.activeTabText]}>
                    👥 Membres
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tab, activeTab === 'chat' && styles.activeTab]}
                  onPress={() => setActiveTab('chat')}
                >
                  <Text style={[styles.tabText, activeTab === 'chat' && styles.activeTabText]}>
                    💬 Chat
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tab, activeTab === 'ressources' && styles.activeTab]}
                  onPress={() => setActiveTab('ressources')}
                >
                  <Text style={[styles.tabText, activeTab === 'ressources' && styles.activeTabText]}>
                    📚 Ressources
                  </Text>
                </TouchableOpacity>
              </View>
            );
          }
          
          if (item.type === 'content') {
            return (
              <>
                {activeTab === 'membres' && (
                  <Card style={styles.contentCard}>
                    <View style={styles.memberHeader}>
                      <Text style={styles.memberTitle}>Membres du groupe ({membres.length}/{groupe?.capacite_max || 10})</Text>
                      <Button
                        title="➕ Ajouter"
                        onPress={() => setShowAddMember(true)}
                        size="small"
                      />
                    </View>
                    
                    {showAddMember && (
                      <View style={styles.addMemberForm}>
                        <TextInput
                          style={styles.memberInput}
                          placeholder="Email de l'étudiant"
                          value={newMemberEmail}
                          onChangeText={setNewMemberEmail}
                          keyboardType="email-address"
                          autoCapitalize="none"
                        />
                        <View style={styles.addMemberButtons}>
                          <Button
                            title="Ajouter"
                            onPress={handleAddMember}
                            size="small"
                          />
                          <Button
                            title="Annuler"
                            onPress={() => {
                              setShowAddMember(false);
                              setNewMemberEmail('');
                            }}
                            variant="outline"
                            size="small"
                          />
                        </View>
                      </View>
                    )}

                    {membres.length === 0 ? (
                      <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>Aucun membre dans ce groupe</Text>
                        <Text style={styles.emptySubtext}>Ajoutez des membres pour commencer</Text>
                      </View>
                    ) : (
                      <FlatList
                        data={membres}
                        renderItem={renderMemberItem}
                        keyExtractor={(item) => item.id.toString()}
                        style={styles.membersList}
                        nestedScrollEnabled={true}
                        ListEmptyComponent={
                          <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>Aucun membre trouvé</Text>
                          </View>
                        }
                      />
                    )}
                  </Card>
                )}

                {activeTab === 'chat' && (
                  <Card style={styles.contentCard}>
                    <View style={styles.chatContainer}>
                      <FlatList
                        data={messages}
                        renderItem={renderMessageItem}
                        keyExtractor={(item) => item.id.toString()}
                        style={styles.messagesList}
                        nestedScrollEnabled={true}
                      />
                      <View style={styles.messageInputContainer}>
                        <TextInput
                          style={styles.messageInput}
                          placeholder="Tapez votre message..."
                          value={newMessage}
                          onChangeText={setNewMessage}
                          multiline
                          maxLength={500}
                        />
                        <Button
                          title="Envoyer"
                          onPress={handleSendMessage}
                          size="small"
                        />
                      </View>
                    </View>
                  </Card>
                )}

                {activeTab === 'ressources' && (
                  <Card style={styles.contentCard}>
                    <View style={styles.resourceHeader}>
                      <Text style={styles.sectionTitle}>Ressources du groupe</Text>
                      <Button
                        title="+ Publier Ressource"
                        onPress={() => navigation.navigate('CreateRessourceGroupe', { groupeId })}
                        size="small"
                        style={styles.publishButton}
                      />
                    </View>
                    
                    {loadingRessources ? (
                      <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>Chargement des ressources...</Text>
                      </View>
                    ) : ressources.length === 0 ? (
                      <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>Aucune ressource partagée</Text>
                        <Text style={styles.emptySubtext}>Publiez la première ressource pour ce groupe</Text>
                      </View>
                    ) : (
                      <FlatList
                        data={ressources}
                        renderItem={renderResourceItem}
                        keyExtractor={(item) => item.id.toString()}
                        style={styles.resourcesList}
                        nestedScrollEnabled={true}
                        showsVerticalScrollIndicator={false}
                      />
                    )}
                  </Card>
                )}
              </>
            );
          }
          
          return null;
        }}
        keyExtractor={(item, index) => index.toString()}
        showsVerticalScrollIndicator={false}
      />
    </>
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
  infoCard: {
    margin: 12,
    padding: 16,
  },
  groupName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  groupDescription: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
  },
  groupStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  statItem: {
    fontSize: 14,
    color: '#007AFF',
    marginRight: 12,
    marginBottom: 4,
  },
  groupActions: {
    flexDirection: 'row',
    gap: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  contentCard: {
    margin: 12,
    minHeight: 300,
  },
  memberHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  memberTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  addMemberForm: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  emailInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  addMemberButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  memberPhotoContainer: {
    marginRight: 12,
  },
  memberPhoto: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f0f0',
  },
  memberDefaultPhoto: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e9ecef',
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  resourceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  publishButton: {
    minWidth: 120,
  },
  resourceItem: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    alignItems: 'center',
  },
  resourceIcon: {
    marginRight: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resourceInfo: {
    flex: 1,
  },
  resourceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  resourceDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  resourceMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resourceType: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  resourceDate: {
    fontSize: 12,
    color: '#999',
  },
  validatedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  validatedText: {
    fontSize: 10,
    color: '#34C759',
    marginLeft: 4,
    fontWeight: '500',
  },
  resourceActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f8ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resourcesList: {
    flex: 1,
  },
  memberEmail: {
    fontSize: 14,
    color: '#666',
  },
  memberRole: {
    fontSize: 12,
    color: '#007AFF',
    marginTop: 2,
  },
  memberDate: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
    fontStyle: 'italic',
  },
  memberAcademicInfo: {
    fontSize: 12,
    color: '#555',
    marginTop: 4,
    fontStyle: 'italic',
  },
  memberBio: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    lineHeight: 16,
    backgroundColor: '#f8f9fa',
    padding: 8,
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  memberPhone: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  removeButton: {
    padding: 8,
  },
  membersList: {
    flex: 1,
  },
  chatContainer: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
    marginBottom: 12,
  },
  messageItem: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  messageAuthor: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  messageTime: {
    fontSize: 12,
    color: '#666',
  },
  messageContent: {
    fontSize: 14,
    color: '#333',
  },
  messageInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  messageInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginRight: 8,
    maxHeight: 80,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
  },
  loadingText: {
    textAlign: 'center',
    color: '#666',
    padding: 20,
  },
  inscriptionsCard: {
    margin: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inscriptionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  inscriptionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  inscriptionsList: {
    padding: 16,
  },
  inscriptionItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  inscriptionStudentInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  studentPhoto: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
  },
  defaultPhoto: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#e9ecef',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  studentDetails: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  studentEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  studentAcademicInfo: {
    fontSize: 12,
    color: '#555',
    marginTop: 4,
    fontStyle: 'italic',
  },
  studentBio: {
    fontSize: 12,
    color: '#666',
    marginTop: 6,
    marginBottom: 6,
    lineHeight: 16,
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  studentPhone: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    marginBottom: 4,
  },
  inscriptionDate: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
    fontStyle: 'italic',
  },
  inscriptionActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 100,
    justifyContent: 'center',
  },
  acceptButton: {
    backgroundColor: '#28a745',
  },
  refuseButton: {
    backgroundColor: '#dc3545',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
    marginLeft: 6,
  },
  emptySubtext: {
    textAlign: 'center',
    color: '#999',
    fontSize: 14,
    fontStyle: 'italic',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
});

export default GroupeDetailScreen;
