import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/ui/Header';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import CustomInput from '../../components/ui/Input';
import SendMessageModal from '../../components/messaging/SendMessageModal';
import { getUsers, updateUserStatus, deleteUser } from '../../api/adminService';

const UsersListScreen = ({ navigation, route }) => {
  const initialRole = route?.params?.role || 'all';
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [roleFilter, setRoleFilter] = useState(initialRole); // all, etudiant, tuteur, enseignant, admin
  const [statusFilter, setStatusFilter] = useState('all'); // all, actif, inactif
  const [messageModalVisible, setMessageModalVisible] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState(null);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (route?.params?.role) {
      setRoleFilter(route.params.role);
    }
  }, [route?.params?.role]);

  useEffect(() => {
    filterUsers();
  }, [users, search, roleFilter, statusFilter]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const result = await getUsers();
      if (result.success) {
        setUsers(Array.isArray(result.data) ? result.data : []);
        // Don't set filteredUsers here, let filterUsers handle it
      } else {
        console.error('Erreur getUsers:', result.error);
        Alert.alert('Erreur', 'Impossible de charger les utilisateurs');
      }
    } catch (error) {
      console.error('Erreur chargement utilisateurs:', error);
      Alert.alert('Erreur', 'Impossible de charger les utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    const source = Array.isArray(users) ? users : [];
    let filtered = source;

    // Recherche par nom ou email
    if (search) {
      const lowerSearch = search.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          user.nom?.toLowerCase().includes(lowerSearch) ||
          user.prenom?.toLowerCase().includes(lowerSearch) ||
          user.email?.toLowerCase().includes(lowerSearch),
      );
    }

    // Filtre par rôle
    if (roleFilter && roleFilter !== 'all') {
      filtered = filtered.filter((user) => user.role === roleFilter);
    }

    // Filtre par statut
    if (statusFilter && statusFilter !== 'all') {
      filtered = filtered.filter((user) => {
        const isActive = user.is_active ?? user.est_actif ?? user.actif;
        return statusFilter === 'actif' ? isActive : !isActive;
      });
    }

    // Grouper par rôle
    const grouped = filtered.reduce((acc, user) => {
      const role = user.role || 'utilisateur';
      if (!acc[role]) {
        acc[role] = [];
      }
      acc[role].push(user);
      return acc;
    }, {});

    // Créer les sections
    const sections = Object.keys(grouped).map(role => ({
      title: getRoleDisplayName(role),
      data: grouped[role],
      role: role
    }));

    setFilteredUsers(sections);
  };

  const getRoleDisplayName = (role) => {
    const roleNames = {
      etudiant: 'Étudiants',
      tuteur: 'Tuteurs',
      enseignant: 'Enseignants',
      admin: 'Administrateurs',
      utilisateur: 'Utilisateurs généraux'
    };
    return roleNames[role] || role;
  };

  const toggleUserStatus = async (userId) => {
    try {
      const user = users.find((u) => u.id === userId);
      const currentStatus = user?.is_active ?? user?.est_actif ?? user?.actif;
      const newStatus = !currentStatus;

      Alert.alert(
        'Confirmation',
        `Voulez-vous ${newStatus ? 'activer' : 'désactiver'} cet utilisateur ?`,
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'OK',
            onPress: async () => {
              const result = await updateUserStatus(userId, newStatus);
              if (result.success) {
                setUsers((prev) => {
                  const prevArray = Array.isArray(prev) ? prev : [];
                  return prevArray.map((u) =>
                    u.id === userId ? { ...u, is_active: newStatus, est_actif: newStatus, actif: newStatus } : u,
                  );
                });
              } else {
                Alert.alert('Erreur', 'Impossible de modifier le statut');
              }
            },
          },
        ],
      );
    } catch (error) {
      console.error('Erreur modification statut:', error);
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      Alert.alert(
        'Confirmation',
        'Voulez-vous vraiment supprimer cet utilisateur ? Cette action est irréversible.',
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Supprimer',
            style: 'destructive',
            onPress: async () => {
              const result = await deleteUser(userId);
              if (result.success) {
                setUsers(prev => prev.filter(u => u.id !== userId));
              } else {
                Alert.alert('Erreur', 'Impossible de supprimer l\'utilisateur');
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Erreur suppression:', error);
    }
  };

  const sendEmail = (user) => {
    setSelectedRecipient(user);
    setMessageModalVisible(true);
  };

  const renderSectionHeader = ({ section: { title, data } }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionCount}>({data.length})</Text>
    </View>
  );

  const renderUserItem = ({ item }) => (
    <Card style={styles.userCard}>
      <View style={styles.userInfo}>
        <View style={styles.userHeader}>
          <Text style={styles.userName}>{item.prenom} {item.nom}</Text>
      {(() => {
        const isActive = item.is_active ?? item.est_actif ?? item.actif;
        return (
          <View style={[styles.statusBadge, { backgroundColor: isActive ? '#27ae60' : '#e74c3c' }]}> 
            <Text style={styles.statusText}>{isActive ? 'Actif' : 'Inactif'}</Text>
          </View>
        );
      })()}
        </View>
        
        <Text style={styles.userEmail}>{item.email}</Text>
        <Text style={styles.userRole}>Rôle: {item.role}</Text>
        <Text style={styles.userDate}>
          Inscription: {item.date_inscription ? 
            (() => {
              try {
                const date = new Date(item.date_inscription);
                if (isNaN(date.getTime())) {
                  return 'Date invalide';
                }
                return date.toLocaleDateString('fr-FR', { 
                  day: 'numeric', 
                  month: 'short', 
                  year: 'numeric' 
                });
              } catch (error) {
                return 'Date invalide';
              }
            })() : 
            'Date non disponible'
          }
        </Text>
      </View>
      
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.emailButton]}
          onPress={() => sendEmail(item)}
        >
          <Ionicons name="mail" size={20} color="#3498db" />
          <Text style={styles.actionButtonText}>Email</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => navigation.navigate('UtilisateurDetail', { userId: item.id })}
        >
          <Ionicons name="create" size={20} color="#f39c12" />
          <Text style={styles.actionButtonText}>Modifier</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, item.actif ? styles.disableButton : styles.enableButton]}
          onPress={() => toggleUserStatus(item.id)}
        >
          <Ionicons name={item.actif ? 'pause-circle' : 'play-circle'} size={20} color={item.actif ? '#e67e22' : '#27ae60'} />
          <Text style={styles.actionButtonText}>{item.actif ? 'Désactiver' : 'Activer'}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteUser(item.id)}
        >
          <Ionicons name="trash" size={20} color="#e74c3c" />
          <Text style={styles.actionButtonText}>Supprimer</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );

  if (loading) return <LoadingSpinner />;

  return (
    <>
      <Header title="Gestion des utilisateurs" showBack={false} />
      <View style={styles.container}>
        <View style={styles.searchContainer}>
          <CustomInput
            placeholder="Rechercher un utilisateur..."
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
          />
        </View>
        
        <View style={styles.statsContainer}>
          <Text style={styles.statsText}>Total: {filteredUsers.reduce((sum, section) => sum + section.data.length, 0)} utilisateurs</Text>
          <Text style={styles.statsText}>
            Actifs: {filteredUsers.reduce((sum, section) => sum + section.data.filter(u => u.actif).length, 0)} | 
            Inactifs: {filteredUsers.reduce((sum, section) => sum + section.data.filter(u => !u.actif).length, 0)}
          </Text>
        </View>

        <SectionList
          sections={filteredUsers}
          renderItem={renderUserItem}
          renderSectionHeader={renderSectionHeader}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          onRefresh={loadUsers}
          refreshing={loading}
          stickySectionHeadersEnabled={false}
        />
      </View>

      <SendMessageModal
        visible={messageModalVisible}
        onClose={() => setMessageModalVisible(false)}
        recipient={selectedRecipient}
        onSendSuccess={loadUsers}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchInput: {
    marginBottom: 0,
  },
  statsContainer: {
    padding: 16,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  statsText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  sectionHeader: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    marginTop: 8,
    marginBottom: 4,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  sectionCount: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  list: {
    padding: 16,
  },
  userCard: {
    marginBottom: 12,
    padding: 16,
  },
  userInfo: {
    marginBottom: 12,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  userEmail: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  userRole: {
    fontSize: 14,
    color: '#888',
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  userDate: {
    fontSize: 12,
    color: '#999',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    paddingVertical: 8,
    marginHorizontal: 2,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
  },
  actionButtonText: {
    fontSize: 11,
    marginTop: 4,
    textAlign: 'center',
  },
  emailButton: {
    backgroundColor: '#e3f2fd',
  },
  editButton: {
    backgroundColor: '#fff3e0',
  },
  enableButton: {
    backgroundColor: '#e8f5e8',
  },
  disableButton: {
    backgroundColor: '#fff3e0',
  },
  deleteButton: {
    backgroundColor: '#ffebee',
  },
});

export default UsersListScreen;
