import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  Linking,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/ui/Header';
import Card from '../../components/ui/Card';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import { getUsers, deleteUser, updateUser, updateUserStatus } from '../../api/userService';
import { envoyerEmail } from '../../api/emailService';

const GestionUtilisateursScreen = ({ navigation }) => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all'); // all, etudiant, tuteur, enseignant, admin
  const [statusFilter, setStatusFilter] = useState('all'); // all, actif, inactif

  // États pour le formulaire d'email
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailContent, setEmailContent] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [search, roleFilter, statusFilter, users]);

  const loadUsers = async () => {
    try {
      const data = await getUsers();
      setUsers(data);
      setFilteredUsers(data);
    } catch (error) {
      console.error(error);
      Alert.alert('Erreur', 'Impossible de charger les utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  const loadEmailHistory = async () => {
    try {
      const emails = await getMesEmails();
      setSentEmails(emails.results || emails);
      
      // Créer des notifications pour les emails récents
      const recentEmails = (emails.results || emails).filter(email => 
        email.statut === 'recu' || email.statut === 'repondu'
      );
      setEmailNotifications(recentEmails);
    } catch (error) {
      console.log('Erreur chargement emails:', error);
    }
  };

  const filterUsers = () => {
    const source = Array.isArray(users) ? users : [];
    let filtered = source;

    // Recherche par nom ou email
    if (search) {
      const lowerSearch = search.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.nom?.toLowerCase().includes(lowerSearch) ||
          u.prenom?.toLowerCase().includes(lowerSearch) ||
          u.email?.toLowerCase().includes(lowerSearch),
      );
    }

    // Filtre par rôle
    if (roleFilter !== 'all') {
      filtered = filtered.filter((u) => u.role === roleFilter);
    }

    // Filtre par statut
    if (statusFilter !== 'all') {
      filtered = filtered.filter(
        (u) => (statusFilter === 'actif' ? u.is_active : !u.is_active),
      );
    }

    setFilteredUsers(filtered);
  };

  const handleToggleActif = async (user) => {
    try {
      // Empêcher la désactivation de l'admin principal uniquement
      if (user.email === 'ndjerabeernest@gmail.com' && user.is_active) {
        Alert.alert('Erreur', 'Impossible de désactiver l\'administrateur principal');
        return;
      }
      
      // Utiliser la fonction correcte pour mettre à jour le statut
      const result = await updateUserStatus(user.id, !user.is_active);
      if (result.success) {
        loadUsers();
        
        // Si on active un tuteur, envoyer un email de notification
        if (!user.is_active && user.role === 'tuteur') {
          await sendActivationEmail(user);
        }
      } else {
        Alert.alert('Erreur', result.error || 'Impossible de modifier le statut');
      }
    } catch (error) {
      console.error('Erreur handleToggleActif:', error);
      Alert.alert('Erreur', 'Impossible de modifier le statut');
    }
  };

  const sendActivationEmail = async (user) => {
    try {
      const subject = '🎉 Votre compte tuteur a été activé !';
      const content = `Bonjour ${user.prenom} ${user.nom},\n\n` +
        `Nous avons le plaisir de vous informer que votre compte tuteur a été activé par l'administrateur.\n\n` +
        `Vous pouvez maintenant vous connecter à votre compte et commencer à :\n` +
        `- Créer des offres de tutorat\n` +
        `- Partager vos ressources pédagogiques\n` +
        `- Encadrer les étudiants\n\n` +
        `Connectez-vous dès maintenant avec votre email : ${user.email}\n\n` +
        `Cordialement,\n` +
        `L'équipe de l'INSTA`;
      
      await envoyerEmail(user.email, subject, content);
      console.log('Email d\'activation envoyé à:', user.email);
    } catch (error) {
      console.error('Erreur envoi email activation:', error);
      // Ne pas afficher d'alerte pour ne pas perturber l'admin
    }
  };

  const handleDelete = (id) => {
    // Trouver l'utilisateur pour vérifier s'il s'agit de l'admin principal
    const userToDelete = users.find(u => u.id === id);
    if (userToDelete?.email === 'ndjerabeernest@gmail.com') {
      Alert.alert('Erreur', 'Impossible de supprimer l\'administrateur principal');
      return;
    }
    
    Alert.alert('Confirmation', 'Voulez-vous vraiment supprimer cet utilisateur ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteUser(id);
            setUsers(users.filter((u) => u.id !== id));
          } catch (error) {
            Alert.alert('Erreur', 'Impossible de supprimer');
          }
        },
      },
    ]);
  };

  const handleSendEmail = (user) => {
    // Ouvre le formulaire d'email dans l'application
    setSelectedUser(user);
    setEmailSubject(`Message depuis la plateforme de tutorat`);
    setEmailContent(`Bonjour ${user.prenom},\n\n`);
    setShowEmailModal(true);
  };

  const handleSendEmailForm = async () => {
    if (!selectedUser || !emailSubject.trim() || !emailContent.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    setSendingEmail(true);
    
    try {
      // Envoi direct via le backend - PAS D'OUVERTURE DE BOITE EMAIL
      const result = await envoyerEmail(selectedUser.id, emailSubject, emailContent);
      
      // Affiche un message de succès
      Alert.alert(
        '✅ Email envoyé!',
        `Message envoyé directement à ${selectedUser.prenom} ${selectedUser.nom}`,
        [
          {
            text: 'OK',
            onPress: () => {
              setShowEmailModal(false);
              setEmailSubject('');
              setEmailContent('');
              setSelectedUser(null);
            },
          }
        ]
      );
    } catch (error) {
      console.error('Erreur envoi email:', error);
      Alert.alert('Erreur', 'Impossible d\'envoyer l\'email. Veuillez réessayer.');
    } finally {
      setSendingEmail(false);
    }
  };

  const renderItem = ({ item }) => {
    // Debug: afficher les données reçues
    console.log(`Utilisateur: ${item.email}, rôle: ${item.role}, is_active: ${item.is_active}, est_actif: ${item.est_actif}`);
    
    return (
      <Card style={styles.userCard}>
        <View style={styles.userHeader}>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>
              {item.prenom} {item.nom}
            </Text>
            <Text style={styles.userEmail}>{item.email}</Text>
          </View>
          <View style={styles.statusBadge}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: item.is_active ? '#28a745' : '#dc3545' },
              ]}
            />
            <Text style={styles.statusText}>{item.is_active ? 'Actif' : 'Inactif'}</Text>
          </View>
        </View>
        
        <View style={styles.actions}>
          <TouchableOpacity 
            style={styles.actionIcon} 
            onPress={() => handleSendEmail(item)}
          >
            <Ionicons 
              name="mail-outline" 
              size={20} 
              color="#007bff" 
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionIcon} onPress={() => handleToggleActif(item)}>
            <Ionicons
              name={item.is_active ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color="#28a745"
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionIcon}
            onPress={() => navigation.navigate('UtilisateurDetail', { userId: item.id })}
          >
            <Ionicons name="create-outline" size={20} color="#ffc107" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionIcon} onPress={() => handleDelete(item.id)}>
            <Ionicons name="trash-outline" size={20} color="#dc3545" />
          </TouchableOpacity>
        </View>
      </Card>
    );
  };

  if (loading) return <LoadingSpinner />;

  return (
    <>
      <Header 
        title="Gestion des utilisateurs" 
        showBack 
        onBackPress={() => navigation.goBack()} 
      />
      <View style={styles.container}>
        <View style={styles.searchSection}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#999" />
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher par nom ou email..."
              value={search}
              onChangeText={setSearch}
            />
          </View>
          <View style={styles.filters}>
            <TouchableOpacity
              style={[styles.filterChip, roleFilter === 'all' && styles.activeChip]}
              onPress={() => setRoleFilter('all')}
            >
              <Text style={[styles.filterText, roleFilter === 'all' && styles.activeText]}>
                Tous
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterChip, roleFilter === 'etudiant' && styles.activeChip]}
              onPress={() => setRoleFilter('etudiant')}
            >
              <Text style={[styles.filterText, roleFilter === 'etudiant' && styles.activeText]}>
                Étudiants
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterChip, roleFilter === 'tuteur' && styles.activeChip]}
              onPress={() => setRoleFilter('tuteur')}
            >
              <Text style={[styles.filterText, roleFilter === 'tuteur' && styles.activeText]}>
                Tuteurs
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterChip, roleFilter === 'enseignant' && styles.activeChip]}
              onPress={() => setRoleFilter('enseignant')}
            >
              <Text
                style={[styles.filterText, roleFilter === 'enseignant' && styles.activeText]}
              >
                Enseignants
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterChip, roleFilter === 'admin' && styles.activeChip]}
              onPress={() => setRoleFilter('admin')}
            >
              <Text style={[styles.filterText, roleFilter === 'admin' && styles.activeText]}>
                Admin
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.statusFilters}>
            <TouchableOpacity
              style={[styles.statusChip, statusFilter === 'all' && styles.activeStatusChip]}
              onPress={() => setStatusFilter('all')}
            >
              <Text
                style={[styles.statusTextBtn, statusFilter === 'all' && styles.activeStatusText]}
              >
                Tous
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.statusChip, statusFilter === 'actif' && styles.activeStatusChip]}
              onPress={() => setStatusFilter('actif')}
            >
              <Text
                style={[styles.statusTextBtn, statusFilter === 'actif' && styles.activeStatusText]}
              >
                Actifs
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.statusChip, statusFilter === 'inactif' && styles.activeStatusChip]}
              onPress={() => setStatusFilter('inactif')}
            >
              <Text
                style={[
                  styles.statusTextBtn,
                  statusFilter === 'inactif' && styles.activeStatusText,
                ]}
              >
                Inactifs
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {filteredUsers.length === 0 ? (
          <EmptyState icon="people-outline" message="Aucun utilisateur trouvé" />
        ) : (
          <FlatList
            data={filteredUsers}
            renderItem={renderItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.list}
          />
        )}
      </View>

      {/* Modal du formulaire d'email */}
      <Modal
        visible={showEmailModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowEmailModal(false)}
      >
        <View style={styles.modalContainer}>
          <Header 
            title="Envoyer un email"
            showBack
            onBackPress={() => setShowEmailModal(false)}
          />
          
          <View style={styles.modalContent}>
            {selectedUser && (
              <Card style={styles.userInfoCard}>
                <Text style={styles.userInfoText}>
                  Destinataire : {selectedUser.prenom} {selectedUser.nom} ({selectedUser.email})
                </Text>
              </Card>
            )}

            <View style={styles.formGroup}>
              <Text style={styles.label}>Sujet</Text>
              <TextInput
                style={styles.input}
                value={emailSubject}
                onChangeText={setEmailSubject}
                placeholder="Sujet du message..."
                multiline
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Message</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={emailContent}
                onChangeText={setEmailContent}
                placeholder="Votre message..."
                multiline
                numberOfLines={8}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => setShowEmailModal(false)}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.button, styles.sendButton]}
                onPress={handleSendEmailForm}
                disabled={sendingEmail}
              >
                <Text style={styles.sendButtonText}>
                  {sendingEmail ? 'Envoi...' : 'Envoyer'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchSection: {
    padding: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    marginLeft: 8,
    fontSize: 16,
  },
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
    marginBottom: 8,
  },
  activeChip: {
    backgroundColor: '#007bff',
  },
  filterText: {
    fontSize: 14,
    color: '#333',
  },
  activeText: {
    color: '#fff',
  },
  statusFilters: {
    flexDirection: 'row',
  },
  statusChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  activeStatusChip: {
    backgroundColor: '#28a745',
  },
  statusTextBtn: {
    fontSize: 14,
    color: '#333',
  },
  activeStatusText: {
    color: '#fff',
  },
  notificationsSection: {
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginTop: 12,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  notificationsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  notificationItem: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  notificationSubject: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  notificationStatus: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  notificationStatusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  notificationRecipient: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  notificationDate: {
    fontSize: 11,
    color: '#888',
  },
  list: {
    padding: 12,
  },
  userCard: {
    marginVertical: 4,
    padding: 12,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginVertical: 2,
  },
  userMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  userRole: {
    fontSize: 12,
    textTransform: 'capitalize',
    marginRight: 8,
  },
  userDate: {
    fontSize: 12,
    color: '#999',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#666',
  },
  emailIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  emailIndicatorText: {
    fontSize: 11,
    color: '#4CAF50',
    marginLeft: 4,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 8,
  },
  actionIcon: {
    marginLeft: 16,
    padding: 4,
  },
  // Styles pour le modal d'email
  modalContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  userInfoCard: {
    padding: 16,
    marginBottom: 16,
    backgroundColor: '#e3f2fd',
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  userInfoText: {
    fontSize: 14,
    color: '#1565C0',
    fontWeight: '500',
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
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 12,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  sendButton: {
    backgroundColor: '#007bff',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default GestionUtilisateursScreen;
