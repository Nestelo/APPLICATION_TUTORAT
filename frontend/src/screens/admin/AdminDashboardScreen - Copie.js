import React, { useEffect, useState, useCallback } from 'react';
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
  ScrollView,
  Dimensions,
  RefreshControl,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/ui/Header';
import Card from '../../components/ui/Card';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import Button from '../../components/ui/Button';
import { getUsers, updateUserStatus, deleteUser } from '../../api/userService';
import { envoyerEmail, envoyerEmailDirect } from '../../api/emailService';
import { getStatsAdmin } from '../../api/adminService';
import {
  getAdminDashboardStats, getModerationQueue, approveQuestion,
  rejectQuestion, approveResponse, rejectResponse, getAdminActivityLogs,
  exportAdminData
} from '../../api/adminPanelService';
import { useAuth } from '../../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../../config/api';
import * as ImagePicker from 'expo-image-picker';

const { width } = Dimensions.get('window');

const AdminDashboardScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshing, setRefreshing] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [updatingImage, setUpdatingImage] = useState(false);
  
  // Stats dashboard
  const [dashboardStats, setDashboardStats] = useState(null);
  const [moderationQueue, setModerationQueue] = useState(null);
  const [activityLogs, setActivityLogs] = useState([]);
  
  // Modals
  const [showUserModal, setShowUserModal] = useState(false);
  const [showModerationModal, setShowModerationModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // États pour le formulaire d'email
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailContent, setEmailContent] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);

  // États pour les statistiques
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStudents: 0,
    totalTutors: 0,
    totalTeachers: 0,
    totalAdmins: 0,
    totalOffers: 0,
    totalSessions: 0,
    totalResources: 0,
    totalQuestions: 0,
    userGrowth: '+0%',
    sessionGrowth: '+0%',
    // Stats détaillées actifs/inactifs
    tuteursActifs: 0,
    tuteursInactifs: 0,
    etudiantsActifs: 0,
    etudiantsInactifs: 0,
    monthlyStats: {
      users: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      sessions: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      questions: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    },
    topTutors: [],
    topSubjects: [],
  });

  useEffect(() => {
    loadData();
    loadProfileImage();
  }, []);

  // Recharger l'image quand l'écran reçoit le focus (après retour de EditProfil)
  useFocusEffect(
    useCallback(() => {
      loadProfileImage();
    }, [user?.id])
  );

  useEffect(() => {
    filterUsers();
  }, [search, roleFilter, statusFilter, users]);

  // Charger l'image de profil existante
  const loadProfileImage = async () => {
    try {
      console.log('Chargement image profil pour admin:', user?.id);
      
      if (user?.photo) {
        const imageUrl = getImageUrl(user.photo);
        console.log('URL image profil admin:', imageUrl);
        setProfileImage(imageUrl);
      } else {
        console.log('Aucune photo de profil trouvée pour admin');
        setProfileImage(null);
      }
    } catch (error) {
      console.error('Erreur chargement image profil admin:', error);
      setProfileImage(null);
    }
  };

  // Générer une URL avec anti-cache
  const getImageUrl = (photoPath) => {
    if (!photoPath) return null;
    
    // Vérifier si l'URL est déjà complète (commence par http)
    if (photoPath.startsWith('http')) {
      // URL déjà complète, ajouter juste le timestamp
      const timestamp = Date.now();
      return `${photoPath}?t=${timestamp}`;
    } else {
      // URL relative, ajouter le base URL
      const timestamp = Date.now();
      return `${API_BASE_URL}${photoPath}?t=${timestamp}`;
    }
  };

  // Demander la permission pour accéder à la galerie
  const requestPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission requise', 'Vous devez autoriser l\'accès à la galerie pour modifier votre photo de profil.');
      return false;
    }
    return true;
  };

  // Sélectionner une image depuis la galerie
  const selectImage = async () => {
    const hasPermission = await requestPermission();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        await uploadProfileImage(result.assets[0]);
      }
    } catch (error) {
      console.error('Erreur sélection image admin:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner cette image');
    }
  };

  // Uploader la nouvelle image de profil
  const uploadProfileImage = async (imageAsset) => {
    try {
      setUpdatingImage(true);

      // Créer le FormData pour l'upload
      const formData = new FormData();
      formData.append('photo', {
        uri: imageAsset.uri,
        type: imageAsset.mimeType || 'image/jpeg',
        name: `profile_${user.id}.jpg`,
      });

      console.log('FormData créé pour admin:', formData);

      // Envoyer l'image au backend
      const token = await AsyncStorage.getItem('accessToken');
      const profileUrl = `${API_BASE_URL}/api/auth/profile/`;
      
      const response = await fetch(profileUrl, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      console.log('Response status upload admin:', response.status);

      if (response.ok) {
        const updatedUser = await response.json();
        console.log('Profil admin mis à jour:', updatedUser);
        
        // Mettre à jour immédiatement l'image affichée
        if (updatedUser.photo) {
          const newImageUrl = getImageUrl(updatedUser.photo);
          console.log('Nouvelle URL image admin:', newImageUrl);
          setProfileImage(newImageUrl);
        }
        
        Alert.alert('Succès', 'Photo de profil mise à jour avec succès!');
      } else {
        const errorText = await response.text();
        console.log('Erreur réponse upload admin:', errorText);
        throw new Error(`Erreur ${response.status}: ${errorText}`);
      }
    } catch (error) {
      console.error('Erreur upload image admin:', error);
      Alert.alert('Erreur', `Impossible de mettre à jour votre photo de profil: ${error.message}`);
    } finally {
      setUpdatingImage(false);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Charger les utilisateurs
      const usersResult = await getUsers();
      console.log('Données utilisateurs reçues:', usersResult);
      if (usersResult.success) {
        setUsers(usersResult.data);
        setFilteredUsers(usersResult.data);
      } else {
        console.error('Erreur chargement utilisateurs:', usersResult.error);
      }

      // Charger les statistiques admin
      const statsResult = await getStatsAdmin();
      console.log('Données stats reçues:', statsResult);
      
      if (statsResult) {
        // Gérer les deux structures possibles de réponse API
        const utilisateursData = statsResult.stats?.utilisateurs || statsResult.utilisateurs || {};
        const offresData = statsResult.stats?.offres || statsResult.offres || {};
        const seancesData = statsResult.stats?.seances || statsResult.seances || {};
        const evaluationsData = statsResult.stats?.evaluations || statsResult.evaluations || {};
        const topTutorsData = statsResult.stats?.top_tuteurs || statsResult.top_tuteurs || [];
        
        // Transformer les données de l'API pour le frontend
        const apiStats = {
          totalUsers: utilisateursData.total || 0,
          totalStudents: utilisateursData.etudiants || 0,
          totalTutors: utilisateursData.tuteurs || 0,
          totalTeachers: 0, // Pas dans les données reçues
          totalAdmins: utilisateursData.admins || 0,
          userGrowth: '+12%', // Valeur par défaut
          // Stats détaillées actifs/inactifs - utiliser les vraies données du backend
          tuteursActifs: utilisateursData.tuteurs_actifs || 0,
          tuteursInactifs: utilisateursData.tuteurs_inactifs || 0,
          etudiantsActifs: utilisateursData.etudiants_actifs || 0,
          etudiantsInactifs: utilisateursData.etudiants_inactifs || 0,
          // Utiliser les vraies données des offres, séances et évaluations
          totalOffers: offresData.total || 0,
          totalSessions: seancesData.total || 0,
          totalResources: 0, // Pas dans les données reçues
          totalQuestions: 0, // Pas dans les données reçues
          sessionGrowth: '+8%', // Valeur par défaut
          monthlyStats: {
            users: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            sessions: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          },
          // Ajouter les top tuteurs
          topTutors: topTutorsData
        };
        
        console.log('Stats transformées:', apiStats);
        setStats(apiStats);
      }
    } catch (error) {
      console.error('Erreur chargement données:', error);
      Alert.alert('Erreur', 'Impossible de charger les données');
    } finally {
      setLoading(false);
    }
  };

  const loadDashboardData = async () => {
    try {
      const [statsData, moderationData, logsData] = await Promise.all([
        getAdminDashboardStats(),
        getModerationQueue(),
        getAdminActivityLogs()
      ]);
      
      setDashboardStats(statsData);
      setModerationQueue(moderationData);
      setActivityLogs(logsData);
    } catch (error) {
      console.error('Erreur chargement dashboard:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadUsers(), loadDashboardData()]);
    setRefreshing(false);
  };

  const handleApproveQuestion = async (questionId) => {
    try {
      await approveQuestion(questionId);
      Alert.alert('Succès', 'Question approuvée');
      loadDashboardData();
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'approuver la question');
    }
  };

  const handleRejectQuestion = async (questionId) => {
    Alert.alert(
      'Confirmation',
      'Voulez-vous rejeter cette question ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Rejeter',
          style: 'destructive',
          onPress: async () => {
            try {
              await rejectQuestion(questionId, 'Rejet par l\'administrateur');
              Alert.alert('Succès', 'Question rejetée');
              loadDashboardData();
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de rejeter la question');
            }
          }
        }
      ]
    );
  };

  const handleExportData = async (type) => {
    try {
      const data = await exportAdminData(type);
      // Logique pour télécharger le fichier (à implémenter)
      Alert.alert('Succès', `Données ${type} exportées avec succès`);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'exporter les données');
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

    // Filtre par statut (gérer les deux champs possibles)
    if (statusFilter !== 'all') {
      filtered = filtered.filter((u) => {
        const isActive = u.est_actif !== false && u.is_active !== false;
        return statusFilter === 'actif' ? isActive : !isActive;
      });
    }

    setFilteredUsers(filtered);
  };

  const handleToggleActif = async (user) => {
    try {
      const newStatus = !user.is_active;
      await updateUserStatus(user.id, newStatus);
      // Recharger les utilisateurs ET les statistiques pour mise à jour automatique
      loadData(); // Charge les utilisateurs ET les stats
      Alert.alert('Succès', `L'utilisateur est maintenant ${newStatus ? 'actif' : 'inactif'}`);
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
      // Étape 1: Créer le message dans la base de données
      const messageResult = await envoyerEmail(selectedUser.id, emailSubject, emailContent);
      
      // Étape 2: Envoyer l'email réel via le backend
      if (messageResult.id) {
        const sendResult = await envoyerEmailDirect(messageResult.id);
        
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
      } else {
        throw new Error('ID du message non reçu');
      }
    } catch (error) {
      console.error('Erreur envoi email:', error);
      Alert.alert('Erreur', 'Impossible d\'envoyer l\'email. Veuillez réessayer.');
    } finally {
      setSendingEmail(false);
    }
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

  const StatCard = ({ title, value, evolution, icon, color = '#3498db', onPress }) => (
    <TouchableOpacity onPress={onPress} disabled={!onPress}>
      <Card style={[styles.statCard, { borderLeftColor: color }]}>
        <View style={styles.statHeader}>
          <Text style={styles.statIcon}>{icon}</Text>
          <Text style={styles.statTitle}>{title}</Text>
        </View>
        <Text style={styles.statValue}>{value}</Text>
        {evolution && (
          <Text style={styles.statEvolution}>{evolution}</Text>
        )}
      </Card>
    </TouchableOpacity>
  );

  const renderItem = ({ item }) => {
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
            style={[styles.actionIcon, styles.emailButton]} 
            onPress={() => handleSendEmail(item)}
          >
            <Ionicons 
              name="mail" 
              size={20} 
              color="#007bff" 
            />
            <Text style={styles.actionButtonText}>Email</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionIcon} onPress={() => handleToggleActif(item)}>
            <Ionicons
              name={item.is_active ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color="#28a745"
            />
            <Text style={styles.actionButtonText}>Actif</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionIcon}
            onPress={() => navigation.navigate('UtilisateurDetail', { userId: item.id })}
          >
            <Ionicons name="create-outline" size={20} color="#ffc107" />
            <Text style={styles.actionButtonText}>Modifier</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionIcon} onPress={() => handleDelete(item.id)}>
            <Ionicons name="trash-outline" size={20} color="#dc3545" />
            <Text style={styles.actionButtonText}>Supprimer</Text>
          </TouchableOpacity>
        </View>
      </Card>
    );
  };

  if (loading) return <LoadingSpinner />;

  return (
    <>
      <Header 
        title="Tableau de bord admin" 
        showBack={false}
        rightComponent={
          <View style={styles.headerButtons}>
            <TouchableOpacity 
              onPress={() => navigation.navigate('Messages')} 
              style={styles.messagesButton}
            >
              <Ionicons name="mail" size={24} color="#3498db" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
              <Ionicons name="log-out" size={24} color="#e74c3c" />
            </TouchableOpacity>
          </View>
        }
      />
      <ScrollView style={styles.container}>
        {/* Section Bienvenue avec profil */}
        <Card style={styles.welcomeCard}>
          <View style={styles.profileSection}>
            <View style={styles.profileImageContainer}>
              {profileImage ? (
                <Image source={{ uri: profileImage }} style={styles.profileImage} />
              ) : (
                <View style={[styles.profileImage, styles.profilePlaceholder]}>
                  <Ionicons name="person" size={40} color="#999" />
                </View>
              )}
              <TouchableOpacity style={styles.editIcon} onPress={selectImage}>
                <Ionicons name="camera" size={16} color="#fff" />
              </TouchableOpacity>
              {updatingImage && (
                <View style={styles.uploadingOverlay}>
                  <ActivityIndicator size="small" color="#fff" />
                </View>
              )}
            </View>
            
            <View style={styles.welcomeInfo}>
              <Text style={styles.welcome}>Bonjour {user?.prenom} !</Text>
              <Text style={styles.subtitle}>Panneau d'administration de la plateforme</Text>
              <View style={styles.adminInfo}>
                <Text style={styles.adminRole}>👑 Administrateur</Text>
                <Text style={styles.adminLevel}>🔐 Accès complet</Text>
                <Text style={styles.adminStatus}>🟢 En ligne</Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Statistiques principales avec listes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 VOS DONNÉES RÉELLES</Text>
          <View style={styles.statsGrid}>
            <StatCard
              title="Utilisateurs"
              value={stats.totalUsers}
              evolution={stats.userGrowth}
              icon="👥"
              color="#3498db"
              onPress={() => navigation.navigate('UsersList', { role: 'all' })}
            />
            <StatCard
              title="Étudiants"
              value={stats.totalStudents}
              icon="🎓"
              color="#27ae60"
              onPress={() => navigation.navigate('UsersList', { role: 'etudiant' })}
            />
            <StatCard
              title="Tuteurs"
              value={stats.totalTutors}
              icon="👨‍🏫"
              color="#e67e22"
              onPress={() => navigation.navigate('UsersList', { role: 'tuteur' })}
            />
            <StatCard
              title="Admins"
              value={stats.totalAdmins}
              icon="👑"
              color="#9b59b6"
              onPress={() => navigation.navigate('UsersList', { role: 'admin' })}
            />
          </View>
          
          {/* Listes d'utilisateurs par catégorie */}
          <View style={styles.userListsContainer}>
            {/* Liste des étudiants */}
            <Card style={styles.userListCard}>
              <Text style={styles.userListTitle}>🎓 Étudiants récents</Text>
              {filteredUsers.filter(u => u.role === 'etudiant').slice(0, 3).map(student => (
                <View key={student.id} style={styles.userListItem}>
                  <TouchableOpacity 
                    style={styles.userAvatar}
                    onPress={() => navigation.navigate('UtilisateurDetail', { userId: student.id })}
                  >
                    <Ionicons name="person" size={20} color="#27ae60" />
                  </TouchableOpacity>
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{student.prenom} {student.nom}</Text>
                    <Text style={styles.userEmail}>{student.email}</Text>
                  </View>
                  <View style={styles.userActions}>
                    <TouchableOpacity 
                      style={styles.actionButton}
                      onPress={() => handleSendEmail(student)}
                    >
                      <Ionicons name="mail" size={16} color="#3498db" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.actionButton}
                      onPress={() => navigation.navigate('EditProfil', { userId: student.id })}
                    >
                      <Ionicons name="create" size={16} color="#f39c12" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.actionButton}
                      onPress={() => handleToggleActif(student)}
                    >
                      <Ionicons 
                        name={student.is_active !== false ? "checkmark-circle" : "close-circle"} 
                        size={16} 
                        color={student.is_active !== false ? "#27ae60" : "#e74c3c"} 
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
              {filteredUsers.filter(u => u.role === 'etudiant').length === 0 && (
                <Text style={styles.noUsersText}>Aucun étudiant trouvé</Text>
              )}
            </Card>

            {/* Liste des tuteurs */}
            <Card style={styles.userListCard}>
              <Text style={styles.userListTitle}>👨‍🏫 Tuteurs récents</Text>
              {filteredUsers.filter(u => u.role === 'tuteur' || u.role === 'enseignant').slice(0, 3).map(tutor => (
                <View key={tutor.id} style={styles.userListItem}>
                  <TouchableOpacity 
                    style={styles.userAvatar}
                    onPress={() => navigation.navigate('UtilisateurDetail', { userId: tutor.id })}
                  >
                    <Ionicons name="person" size={20} color="#e67e22" />
                  </TouchableOpacity>
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{tutor.prenom} {tutor.nom}</Text>
                    <Text style={styles.userEmail}>{tutor.email}</Text>
                  </View>
                  <View style={styles.userActions}>
                    <TouchableOpacity 
                      style={styles.actionButton}
                      onPress={() => handleSendEmail(tutor)}
                    >
                      <Ionicons name="mail" size={16} color="#3498db" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.actionButton}
                      onPress={() => navigation.navigate('EditProfilScreen', { userId: tutor.id })}
                    >
                      <Ionicons name="create" size={16} color="#f39c12" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.actionButton}
                      onPress={() => handleToggleActif(tutor)}
                    >
                      <Ionicons 
                        name={tutor.is_active !== false ? "checkmark-circle" : "close-circle"} 
                        size={16} 
                        color={tutor.is_active !== false ? "#27ae60" : "#e74c3c"} 
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
              {filteredUsers.filter(u => u.role === 'tuteur' || u.role === 'enseignant').length === 0 && (
                <Text style={styles.noUsersText}>Aucun tuteur trouvé</Text>
              )}
            </Card>

            {/* Liste des admins */}
            <Card style={styles.userListCard}>
              <Text style={styles.userListTitle}>👑 Administrateurs</Text>
              {filteredUsers.filter(u => u.role === 'admin').slice(0, 3).map(admin => (
                <View key={admin.id} style={styles.userListItem}>
                  <TouchableOpacity 
                    style={styles.userAvatar}
                    onPress={() => navigation.navigate('UtilisateurDetail', { userId: admin.id })}
                  >
                    <Ionicons name="person" size={20} color="#9b59b6" />
                  </TouchableOpacity>
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{admin.prenom} {admin.nom}</Text>
                    <Text style={styles.userEmail}>{admin.email}</Text>
                  </View>
                  <View style={styles.userActions}>
                    <TouchableOpacity 
                      style={styles.actionButton}
                      onPress={() => handleSendEmail(admin)}
                    >
                      <Ionicons name="mail" size={16} color="#3498db" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.actionButton}
                      onPress={() => navigation.navigate('EditProfilScreen', { userId: admin.id })}
                    >
                      <Ionicons name="create" size={16} color="#f39c12" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.actionButton}
                      onPress={() => handleToggleActif(admin)}
                    >
                      <Ionicons 
                        name={admin.is_active !== false ? "checkmark-circle" : "close-circle"} 
                        size={16} 
                        color={admin.is_active !== false ? "#27ae60" : "#e74c3c"} 
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
              {filteredUsers.filter(u => u.role === 'admin').length === 0 && (
                <Text style={styles.noUsersText}>Aucun admin trouvé</Text>
              )}
            </Card>
          </View>
        </View>

        {/* Statistiques détaillées */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📈 DÉTAILS PAR STATUT</Text>
          <View style={styles.detailStatsGrid}>
            <View style={styles.detailStatCard}>
              <Text style={styles.detailStatTitle}>📚 Étudiants</Text>
              <View style={styles.detailStatRow}>
                <View style={styles.detailStatItem}>
                  <Text style={styles.detailStatValue}>{stats.totalStudents}</Text>
                  <Text style={styles.detailStatLabel}>Total</Text>
                </View>
                <View style={styles.detailStatItem}>
                  <Text style={[styles.detailStatValue, { color: '#27ae60' }]}>{stats.etudiantsActifs}</Text>
                  <Text style={styles.detailStatLabel}>Actif</Text>
                </View>
                <View style={styles.detailStatItem}>
                  <Text style={[styles.detailStatValue, { color: '#e74c3c' }]}>{stats.etudiantsInactifs}</Text>
                  <Text style={styles.detailStatLabel}>Inactif</Text>
                </View>
              </View>
            </View>
            
            <View style={styles.detailStatCard}>
              <Text style={styles.detailStatTitle}>👨‍🏫 Tuteurs/Enseignants</Text>
              <View style={styles.detailStatRow}>
                <View style={styles.detailStatItem}>
                  <Text style={styles.detailStatValue}>{stats.totalTutors}</Text>
                  <Text style={styles.detailStatLabel}>Total</Text>
                </View>
                <View style={styles.detailStatItem}>
                  <Text style={[styles.detailStatValue, { color: '#27ae60' }]}>{stats.tuteursActifs}</Text>
                  <Text style={styles.detailStatLabel}>Actif</Text>
                </View>
                <View style={styles.detailStatItem}>
                  <Text style={[styles.detailStatValue, { color: '#e74c3c' }]}>{stats.tuteursInactifs}</Text>
                  <Text style={styles.detailStatLabel}>Inactif</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Vue d'ensemble */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Vue d'ensemble</Text>
          <View style={styles.statsGrid}>
            <TouchableOpacity 
              style={[styles.card, { backgroundColor: '#fff', borderRadius: 12, padding: 10, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3, flex: 0.8, margin: 5, borderLeftWidth: 4, borderLeftColor: '#27ae60', minHeight: 90, maxWidth: 180 }]}
              onPress={() => navigation.navigate('GestionTutorat')}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 4 }}>
                <View style={[styles.iconContainer, { backgroundColor: '#3498db20', marginRight: 4, width: 28, height: 28, borderRadius: 14 }]}>
                  <Ionicons name="document-text" size={14} color="#3498db" />
                </View>
                <View style={[styles.iconContainer, { backgroundColor: '#27ae6020', width: 28, height: 28, borderRadius: 14 }]}>
                  <Ionicons name="calendar" size={14} color="#27ae60" />
                </View>
              </View>
              <Text style={[styles.value, { fontSize: 18, marginBottom: 2 }]}>{stats.totalOffers > 0 ? stats.totalOffers : ''}</Text>
              <Text style={[styles.label, { fontSize: 11 }]}>Offres et Séances</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.card, { backgroundColor: '#fff', borderRadius: 12, padding: 10, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3, flex: 0.8, margin: 5, borderLeftWidth: 4, borderLeftColor: '#e67e22', minHeight: 90, maxWidth: 180 }]}
              onPress={() => navigation.navigate('GestionRessources')}
            >
              <View style={[styles.iconContainer, { backgroundColor: '#e67e2220', width: 28, height: 28, borderRadius: 14, marginBottom: 4 }]}>
                <Ionicons name="folder" size={14} color="#e67e22" />
              </View>
              <Text style={[styles.value, { fontSize: 18, marginBottom: 2 }]}>{stats.totalResources > 0 ? stats.totalResources : ''}</Text>
              <Text style={[styles.label, { fontSize: 11 }]}>Ressources Total</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.statsGrid}>
            <StatCard
              title="Ressources de groupe"
              value=""
              evolution=""
              icon="📁"
              color="#e74c3c"
              onPress={() => navigation.navigate('ValidationRessourcesGroupe')}
            />
            <StatCard
              title="Forum"
              value=""
              evolution=""
              icon=" 💬 "
              color="#9b59b6"
              onPress={() => navigation.navigate('Moderation')}
            />
          </View>
        </View>

        {/* Top tuteurs */}
        {stats.topTutors && stats.topTutors.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🏆 Top Tuteurs</Text>
            <Card style={styles.topTutorsCard}>
              {stats.topTutors.map((tutor, index) => (
                <View key={tutor.id} style={styles.tutorItem}>
                  <View style={styles.tutorRank}>
                    <Text style={styles.rankNumber}>#{index + 1}</Text>
                  </View>
                  <View style={styles.tutorInfo}>
                    <Text style={styles.tutorName}>{tutor.nom}</Text>
                    <Text style={styles.tutorStats}>
                      ⭐ {tutor.note || 'N/A'}/5 • {tutor.nombre_evaluations || 0} évaluations
                    </Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.viewTutorButton}
                    onPress={() => navigation.navigate('UtilisateurDetail', { userId: tutor.id })}
                  >
                    <Ionicons name="eye" size={20} color="#007bff" />
                  </TouchableOpacity>
                </View>
              ))}
            </Card>
          </View>
        )}

        {/* Actions rapides */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚡ Actions rapides</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => navigation.navigate('CreateUser')}
            >
              <Ionicons name="add-circle-outline" size={24} color="#007bff" />
              <Text style={styles.quickActionText}>Ajouter utilisateur</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => navigation.navigate('Rapports')}
            >
              <Ionicons name="bar-chart-outline" size={24} color="#28a745" />
              <Text style={styles.quickActionText}>Rapports</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => navigation.navigate('Settings')}
            >
              <Ionicons name="settings-outline" size={24} color="#ffc107" />
              <Text style={styles.quickActionText}>Paramètres</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => navigation.navigate('AdminForum')}
            >
              <Ionicons name="chatbubble-ellipses-outline" size={24} color="#9c27b0" />
              <Text style={styles.quickActionText}>Forum</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => navigation.navigate('Debug')}
            >
              <Ionicons name="bug-outline" size={24} color="#dc3545" />
              <Text style={styles.quickActionText}>Diagnostic</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Liste des utilisateurs */}
        <View style={styles.section}>
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
              scrollEnabled={false}
            />
          )}
        </View>
      </ScrollView>

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
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  messagesButton: {
    padding: 8,
  },
  logoutButton: {
    padding: 8,
  },
  welcomeCard: {
    margin: 16,
    padding: 20,
    backgroundColor: '#fff',
  },
  welcome: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  profileImageContainer: {
    position: 'relative',
    marginRight: 16,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f0f0',
  },
  profilePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderWidth: 2,
    borderColor: '#e9ecef',
  },
  editIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#e74c3c',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeInfo: {
    flex: 1,
  },
  adminInfo: {
    marginTop: 8,
  },
  adminRole: {
    fontSize: 14,
    color: '#e74c3c',
    fontWeight: '600',
    marginBottom: 4,
  },
  adminLevel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  adminStatus: {
    fontSize: 14,
    color: '#27ae60',
    fontWeight: '500',
  },
  section: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 12,
    marginBottom: 6,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  statCard: {
    width: (width - 36) / 2,
    marginBottom: 8,
    padding: 10,
    backgroundColor: '#fff',
    borderLeftWidth: 4,
    borderLeftColor: '#3498db',
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  statTitle: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 3,
  },
  statEvolution: {
    fontSize: 10,
    color: '#27ae60',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#fff',
  },
  quickActionButton: {
    alignItems: 'center',
    padding: 6,
  },
  quickActionText: {
    fontSize: 9,
    color: '#666',
    marginTop: 2,
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
    alignItems: 'center',
  },
  emailButton: {
    backgroundColor: '#e3f2fd',
    borderRadius: 4,
  },
  actionButtonText: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
    fontWeight: '500',
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
  // Styles pour les listes d'utilisateurs
  userListsContainer: {
    gap: 16,
    marginTop: 16,
  },
  userListCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userListTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  userListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 12,
    color: '#666',
  },
  userActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noUsersText: {
    textAlign: 'center',
    color: '#999',
    fontStyle: 'italic',
    paddingVertical: 20,
  },
  // Styles pour les statistiques détaillées
  detailStatsGrid: {
    flexDirection: 'column',
    gap: 16,
  },
  detailStatCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  detailStatTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  detailStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  detailStatValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  detailStatLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  // Styles pour les top tuteurs
  topTutorsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tutorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tutorRank: {
    width: 40,
    alignItems: 'center',
  },
  rankNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f39c12',
  },
  tutorInfo: {
    flex: 1,
    marginLeft: 16,
  },
  tutorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  tutorStats: {
    fontSize: 14,
    color: '#666',
  },
  viewTutorButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
  },
  // Styles pour la carte personnalisée Offres et Séances
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  value: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  label: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default AdminDashboardScreen;
