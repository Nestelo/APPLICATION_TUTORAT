import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
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
import { getUsers } from '../../api/adminService';
import { useAuth } from '../../context/AuthContext';

const AdminDashboardScreen = ({ navigation }) => {
  const { logout } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, search]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const result = await getUsers();
      if (result.success) {
        setUsers(result.data);
      } else {
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
    if (!search) {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(user =>
        user.nom.toLowerCase().includes(search.toLowerCase()) ||
        user.prenom.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  };

  const toggleUserStatus = async (userId) => {
    try {
      const user = users.find(u => u.id === userId);
      const newStatus = !user.actif;
      
      Alert.alert(
        'Confirmation',
        `Voulez-vous ${newStatus ? 'activer' : 'désactiver'} cet utilisateur ?`,
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'OK',
            onPress: () => {
              // Simuler la mise à jour
              setUsers(prev => {
                const prevArray = Array.isArray(prev) ? prev : [];
                return prevArray.map(u => 
                  u.id === userId ? { ...u, actif: newStatus } : u
                );
              });
            }
          }
        ]
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
            onPress: () => {
              // Simuler la suppression
              setUsers(prev => prev.filter(u => u.id !== userId));
            }
          }
        ]
      );
    } catch (error) {
      console.error('Erreur suppression:', error);
    }
  };

  const sendEmail = (email) => {
    Alert.alert('Email', `Envoyer un email à: ${email}`);
  };

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Voulez-vous vraiment vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'OK',
          onPress: () => {
            logout();
            navigation.navigate('Login');
          }
        }
      ]
    );
  };

  const renderUserItem = ({ item }) => (
    <Card style={styles.userCard}>
      <View style={styles.userInfo}>
        <View style={styles.userHeader}>
          <Text style={styles.userName}>{item.prenom} {item.nom}</Text>
          <View style={[styles.statusBadge, { backgroundColor: item.actif ? '#27ae60' : '#e74c3c' }]}>
            <Text style={styles.statusText}>{item.actif ? 'Actif' : 'Inactif'}</Text>
          </View>
        </View>
        
        <Text style={styles.userEmail}>{item.email}</Text>
        <Text style={styles.userRole}>Rôle: {item.role}</Text>
        <Text style={styles.userDate}>Inscription: {item.date_inscription}</Text>
      </View>
      
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.emailButton]}
          onPress={() => sendEmail(item.email)}
        >
          <Ionicons name="mail" size={20} color="#3498db" />
          <Text style={styles.actionButtonText}>Email</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => Alert.alert('Modifier', `Modifier l'utilisateur: ${item.prenom} ${item.nom}`)}
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
      <Header 
        title="Administration" 
        showBack={false}
        rightComponent={
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Ionicons name="log-out" size={24} color="#e74c3c" />
          </TouchableOpacity>
        }
      />
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
          <Text style={styles.statsText}>Total: {filteredUsers.length} utilisateurs</Text>
          <Text style={styles.statsText}>
            Actifs: {filteredUsers.filter(u => u.actif).length} | 
            Inactifs: {filteredUsers.filter(u => !u.actif).length}
          </Text>
        </View>

        <FlatList
          data={filteredUsers}
          renderItem={renderUserItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          onRefresh={loadUsers}
          refreshing={loading}
        />
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  logoutButton: {
    padding: 8,
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

export default AdminDashboardScreen;
