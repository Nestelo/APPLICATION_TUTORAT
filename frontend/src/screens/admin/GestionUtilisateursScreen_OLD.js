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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/ui/Header';
import Card from '../../components/ui/Card';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import { getUsers, deleteUser, updateUser } from '../../api/userService';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const GestionUtilisateursScreen = ({ navigation }) => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all'); // all, etudiant, tuteur, enseignant, admin
  const [statusFilter, setStatusFilter] = useState('all'); // all, actif, inactif

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [search, roleFilter, statusFilter, users]);

  const loadUsers = async () => {
    try {
      const data = await getUsers();      // toujours un tableau (géré dans userService)
      setUsers(data);
      setFilteredUsers(data);
    } catch (error) {
      console.error(error);
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
      filtered = filtered.filter((u) =>
        statusFilter === 'actif' ? u.est_actif : !u.est_actif,
      );
    }

    setFilteredUsers(filtered);
  };

  const handleToggleActif = async (user) => {
    try {
      const updatedUser = { ...user, est_actif: !user.est_actif };
      await updateUser(user.id, updatedUser);
      loadUsers(); // recharger la liste
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de modifier le statut');
    }
  };

  const handleDelete = (id) => {
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

  const handleSendEmail = (email) => {
    const url = `mailto:${email}`;
    Linking.openURL(url).catch(() =>
      Alert.alert('Erreur', "Impossible d'ouvrir le client mail"),
    );
  };

  const renderItem = ({ item }) => (
    <Card style={styles.userCard}>
      <View style={styles.userHeader}>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>
            {item.prenom} {item.nom}
          </Text>
          <Text style={styles.userEmail}>{item.email}</Text>
          <View style={styles.userMeta}>
            <Text
              style={[styles.userRole, { color: item.role === 'admin' ? '#dc3545' : '#007bff' }]}
            >
              {item.role}
            </Text>
            <Text style={styles.userDate}>
              {format(new Date(item.date_inscription), 'dd MMM yyyy', { locale: fr })}
            </Text>
          </View>
        </View>
        <View style={styles.statusBadge}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: item.est_actif ? '#28a745' : '#dc3545' },
            ]}
          />
          <Text style={styles.statusText}>{item.est_actif ? 'Actif' : 'Inactif'}</Text>
        </View>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionIcon} onPress={() => handleSendEmail(item.email)}>
          <Ionicons name="mail-outline" size={20} color="#007bff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionIcon} onPress={() => handleToggleActif(item)}>
          <Ionicons
            name={item.est_actif ? 'eye-off-outline' : 'eye-outline'}
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

  if (loading) return <LoadingSpinner />;

  return (
    <>
      <Header title="Gestion des utilisateurs" showBack onBackPress={() => navigation.goBack()} />
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
});

export default GestionUtilisateursScreen;