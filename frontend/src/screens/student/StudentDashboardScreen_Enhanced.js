import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, ActivityIndicator, RefreshControl, TextInput, Image, Dimensions } from 'react-native';
import Header from '../../components/ui/Header';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { API_BASE_URL } from '../../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import * as ImagePicker from 'expo-image-picker';

const { width } = Dimensions.get('window');

const StudentDashboardScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [updatingImage, setUpdatingImage] = useState(false);
  
  // États pour le tableau de bord complet
  const [dashboardData, setDashboardData] = useState({
    progression: {
      objectifSemestre: 75,
      progressionSemestre: 60,
      progressionGlobale: 85,
      tempsEtude: 42,
      tempsEtudeObjectif: 60,
      seancesReussies: 8,
      seancesTotales: 10
    },
    statistiques: {
      total_seances: 12,
      evolutionSeances: '+3 ce mois',
      total_ressources: 28,
      evolutionRessources: '+5 cette semaine',
      total_questions: 8,
      evolutionQuestions: '+2 cette semaine',
      total_evaluations: 12,
      evolutionEvaluations: '+4 ce mois',
      pointsFidelite: 450,
      niveauFidelite: 'Bronze',
      streakActif: 15,
      streakNiveau: 'Conséquent'
    },
    seances_a_venir: [],
    recommandations: {
      tuteurRecommande: null,
      ressourceSuggeree: null,
      groupeSuggere: null
    },
    forumActivite: {
      questionRecente: null,
      reponsesRecues: 0,
      badgeObtenu: null,
      questionsRepondues: 15,
      moyenneReponses: 4.7
    },
    ressourcesRecentes: [],
    notifications: []
  });

  useEffect(() => {
    loadDashboardData();
    loadProfileImage();
  }, [user]); // Ajouter user comme dépendance pour recharger quand il change

  // Charger l'image de profil existante
  const loadProfileImage = async () => {
    try {
      console.log('Chargement image profil pour étudiant:', user?.id);
      
      if (user?.photo || user?.photo_url) {
        const imageUrl = user?.photo_url || getImageUrl(user.photo);
        console.log('URL image profil étudiant:', imageUrl);
        setProfileImage(imageUrl);
      } else {
        console.log('Aucune photo de profil trouvée pour étudiant');
        setProfileImage(null);
      }
    } catch (error) {
      console.error('Erreur chargement image profil étudiant:', error);
      setProfileImage(null);
    }
  };

  // Générer une URL avec anti-cache
  const getImageUrl = (photoPath) => {
    if (!photoPath) return null;
    
    if (photoPath.startsWith('http')) {
      const timestamp = Date.now();
      return `${photoPath}?t=${timestamp}`;
    } else {
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
      console.error('Erreur sélection image étudiant:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner cette image');
    }
  };

  // Uploader la nouvelle image de profil
  const uploadProfileImage = async (imageAsset) => {
    try {
      setUpdatingImage(true);

      const formData = new FormData();
      formData.append('photo', {
        uri: imageAsset.uri,
        type: imageAsset.mimeType || 'image/jpeg',
        name: `profile_${user.id}.jpg`,
      });

      console.log('FormData créé pour étudiant:', formData);

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

      console.log('Response status upload étudiant:', response.status);

      if (response.ok) {
        const updatedUser = await response.json();
        console.log('Profil étudiant mis à jour:', updatedUser);
        
        if (updatedUser.photo) {
          const newImageUrl = getImageUrl(updatedUser.photo);
          console.log('Nouvelle URL image étudiant:', newImageUrl);
          setProfileImage(newImageUrl);
        }
        
        Alert.alert('Succès', 'Photo de profil mise à jour avec succès!');
      } else {
        const errorText = await response.text();
        console.log('Erreur réponse upload étudiant:', errorText);
        throw new Error(`Erreur ${response.status}: ${errorText}`);
      }
    } catch (error) {
      console.error('Erreur upload image étudiant:', error);
      Alert.alert('Erreur', `Impossible de mettre à jour votre photo de profil: ${error.message}`);
    } finally {
      setUpdatingImage(false);
    }
  };

  // Charger les données du tableau de bord
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('accessToken');
      
      // Charger les statistiques de base
      const response = await fetch(`${API_BASE_URL}/api/tutorat/student/dashboard/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        
        // Mettre à jour les données du tableau de bord
        setDashboardData(prev => ({
          ...prev,
          statistiques: {
            ...prev.statistiques,
            total_seances: data.nb_seances || 0,
            seances_terminees: data.nb_seances || 0
          },
          seances_a_venir: data.prochaines_seances || [],
          ressources_recentes: data.ressources_recentes || [],
          notifications: data.notifications_recents || []
        }));
      }

      // Charger les séances à venir
      await loadSeancesAVenir();
      
      // Charger les recommandations
      await loadRecommandations();
      
      // Charger l'activité forum
      await loadForumActivite();
      
    } catch (error) {
      console.error('Erreur chargement dashboard:', error);
      Alert.alert('Erreur', 'Impossible de charger vos informations');
    } finally {
      setLoading(false);
    }
  };

  // Charger les séances à venir
  const loadSeancesAVenir = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}/api/tutorat/seances/etudiant/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const seances = await response.json();
        setDashboardData(prev => ({
          ...prev,
          seances_a_venir: seances.filter(s => s.statut === 'planifiee').slice(0, 3)
        }));
      }
    } catch (error) {
      console.error('Erreur chargement séances:', error);
    }
  };

  // Charger les recommandations
  const loadRecommandations = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      
      // Tuteur recommandé
      const tuteurResponse = await fetch(`${API_BASE_URL}/api/tutorat/tuteurs/recommandes/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      // Ressource suggérée
      const ressourceResponse = await fetch(`${API_BASE_URL}/api/ressources/suggerees/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (tuteurResponse.ok) {
        const tuteurs = await tuteurResponse.json();
        setDashboardData(prev => ({
          ...prev,
          recommandations: {
            ...prev.recommandations,
            tuteurRecommande: tuteurs[0] || null
          }
        }));
      }
      
      if (ressourceResponse.ok) {
        const ressources = await ressourceResponse.json();
        setDashboardData(prev => ({
          ...prev,
          recommandations: {
            ...prev.recommandations,
            ressourceSuggeree: ressources[0] || null
          }
        }));
      }
    } catch (error) {
      console.error('Erreur chargement recommandations:', error);
    }
  };

  // Charger l'activité forum
  const loadForumActivite = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}/api/forum/mes-questions/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const questions = await response.json();
        setDashboardData(prev => ({
          ...prev,
          forumActivite: {
            ...prev.forumActivite,
            questionRecente: questions[0] || null,
            reponsesRecues: questions.reduce((total, q) => total + (q.nb_reponses || 0), 0)
          }
        }));
      }
    } catch (error) {
      console.error('Erreur chargement activité forum:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  // Fonctions de navigation
  const handleProfilePress = () => {
    navigation.navigate('EditProfil');
  };

  const handleProgressionDetail = () => {
    Alert.alert('Progression', 'Détail de votre progression académique');
  };

  const handleObjectifs = () => {
    Alert.alert('Objectifs', 'Définir vos objectifs d\'apprentissage');
  };

  const handleRejoindreSeance = (seanceId) => {
    navigation.navigate('PlanningStudent', { seanceId });
  };

  const handleVoirToutesSeances = () => {
    navigation.navigate('PlanningStudent');
  };

  const handleReserverSeance = () => {
    navigation.navigate('RechercheTuteurs');
  };

  const handleContacterTuteur = (tuteurId) => {
    navigation.navigate('StudentMessages', { tuteurId });
  };

  const handleVoirRessource = (ressourceId) => {
    navigation.navigate('RessourceDetail', { ressourceId });
  };

  const handleVoirBibliotheque = () => {
    navigation.navigate('RessourceList');
  };

  const handleVoirForum = () => {
    navigation.navigate('ForumList');
  };

  const handleVoirBadges = () => {
    Alert.alert('Badges', 'Vos badges et accomplissements');
  };

  const handleVoirNotifications = () => {
    navigation.navigate('Notifications');
  };

  const handleSettings = () => {
    Alert.alert('Paramètres', 'Configuration des notifications et préférences');
  };

  // Actions rapides
  const handleChercherTuteur = () => navigation.navigate('RechercheTuteurs');
  const handleReserverSeanceRapide = () => navigation.navigate('RechercheTuteurs');
  const handleConsulterRessources = () => navigation.navigate('RessourceList');
  const handlePoserQuestion = () => navigation.navigate('PoserQuestion');
  const handleRejoindreGroupe = () => navigation.navigate('GroupesList');
  const handleContacterMonTuteur = () => navigation.navigate('StudentMessages');
  const handleDefinirObjectifs = () => Alert.alert('Objectifs', 'Définir vos objectifs');
  const handleVoirStatistiques = () => Alert.alert('Statistiques', 'Vos statistiques détaillées');

  if (loading) {
    return (
      <>
        <Header title="Tableau de bord" showBack={false} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Chargement de votre tableau de bord...</Text>
        </View>
      </>
    );
  }

  return (
    <>
      <Header title="Tableau de bord" showBack={false} />
      <ScrollView 
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
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
              <Text style={styles.subtitle}>Voici votre progression et apprentissage</Text>
              <View style={styles.studentInfo}>
                <Text style={styles.studentRole}>🎓 Étudiant</Text>
                <Text style={styles.studentMajor}>📚 {user?.filiere || 'Filière non spécifiée'}</Text>
                <Text style={styles.studentLevel}>📖 {user?.annee || 'Niveau non spécifié'}</Text>
              </View>
            </View>
            
            <TouchableOpacity style={styles.profileButton} onPress={handleProfilePress}>
              <Ionicons name="settings" size={20} color="#007AFF" />
            </TouchableOpacity>
          </View>
        </Card>

        {/* Carte de progression académique */}
        <Card style={styles.progressionCard}>
          <Text style={styles.sectionTitle}>📊 MA PROGRESSION ACADÉMIQUE</Text>
          
          <View style={styles.progressItem}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>🎯 Objectif semestre</Text>
              <Text style={styles.progressValue}>{dashboardData.progression.progressionSemestre}%</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${dashboardData.progression.progressionSemestre}%`, backgroundColor: '#3498db' }]} />
            </View>
            <Text style={styles.progressTarget}>Cible: {dashboardData.progression.objectifSemestre}%</Text>
          </View>

          <View style={styles.progressItem}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>📈 Progression globale</Text>
              <Text style={styles.progressValue}>{dashboardData.progression.progressionGlobale}%</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${dashboardData.progression.progressionGlobale}%`, backgroundColor: '#27ae60' }]} />
            </View>
          </View>

          <View style={styles.progressItem}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>⏱️ Temps d'étude</Text>
              <Text style={styles.progressValue}>{dashboardData.progression.tempsEtude}h / {dashboardData.progression.tempsEtudeObjectif}h</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${(dashboardData.progression.tempsEtude / dashboardData.progression.tempsEtudeObjectif) * 100}%`, backgroundColor: '#f39c12' }]} />
            </View>
          </View>

          <View style={styles.progressItem}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>🏆 Réussite</Text>
              <Text style={styles.progressValue}>{dashboardData.progression.seancesReussies} séances terminées sur {dashboardData.progression.seancesTotales}</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${(dashboardData.progression.seancesReussies / dashboardData.progression.seancesTotales) * 100}%`, backgroundColor: '#e74c3c' }]} />
            </View>
          </View>

          <View style={styles.progressActions}>
            <TouchableOpacity style={styles.progressButton} onPress={handleProgressionDetail}>
              <Text style={styles.progressButtonText}>📈 Voir détail</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.progressButton} onPress={handleObjectifs}>
              <Text style={styles.progressButtonText}>🎯 Définir objectifs</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Statistiques d'activité */}
        <Card style={styles.statsCard}>
          <Text style={styles.sectionTitle}>📊 MES STATISTIQUES D'ACTIVITÉ</Text>
          
          <View style={styles.statsGrid}>
            <TouchableOpacity style={styles.statItem}>
              <Text style={styles.statNumber}>{dashboardData.statistiques.total_seances}</Text>
              <Text style={styles.statLabel}>📚 Séances suivies</Text>
              <Text style={styles.statEvolution}>{dashboardData.statistiques.evolutionSeances}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.statItem}>
              <Text style={styles.statNumber}>{dashboardData.statistiques.total_ressources}</Text>
              <Text style={styles.statLabel}>🎯 Ressources consultées</Text>
              <Text style={styles.statEvolution}>{dashboardData.statistiques.evolutionRessources}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.statsGrid}>
            <TouchableOpacity style={styles.statItem}>
              <Text style={styles.statNumber}>{dashboardData.statistiques.total_questions}</Text>
              <Text style={styles.statLabel}>💬 Questions posées</Text>
              <Text style={styles.statEvolution}>{dashboardData.statistiques.evolutionQuestions}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.statItem}>
              <Text style={styles.statNumber}>{dashboardData.statistiques.total_evaluations}</Text>
              <Text style={styles.statLabel}>⭐ Évaluations données</Text>
              <Text style={styles.statEvolution}>{dashboardData.statistiques.evolutionEvaluations}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.statsGrid}>
            <TouchableOpacity style={styles.statItem}>
              <Text style={styles.statNumber}>{dashboardData.statistiques.pointsFidelite}</Text>
              <Text style={styles.statLabel}>🏆 Points fidélité</Text>
              <Text style={styles.statEvolution}>🥉 {dashboardData.statistiques.niveauFidelite}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.statItem}>
              <Text style={styles.statNumber}>{dashboardData.statistiques.streakActif}</Text>
              <Text style={styles.statLabel}>🔥 Streak actif</Text>
              <Text style={styles.statEvolution}>🌟 {dashboardData.statistiques.streakNiveau}</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Séances à venir */}
        <Card style={styles.seancesCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>📅 MES PROCHAINES SÉANCES</Text>
            <TouchableOpacity onPress={handleVoirToutesSeances}>
              <Text style={styles.seeAllText}>Voir tout</Text>
            </TouchableOpacity>
          </View>
          
          {dashboardData.seances_a_venir.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={40} color="#ccc" />
              <Text style={styles.emptyText}>Aucune séance à venir</Text>
              <TouchableOpacity style={styles.reserveButton} onPress={handleReserverSeance}>
                <Text style={styles.reserveButtonText}>➕ Réserver une séance</Text>
              </TouchableOpacity>
            </View>
          ) : (
            dashboardData.seances_a_venir.map((seance, index) => (
              <TouchableOpacity key={seance.id} style={styles.seanceItem} onPress={() => handleRejoindreSeance(seance.id)}>
                <View style={styles.seanceHeader}>
                  <Text style={styles.seanceSubject}>{seance.matiere || 'Matière'}</Text>
                  <TouchableOpacity style={styles.seanceAction}>
                    <Ionicons name="create" size={16} color="#007AFF" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.seanceTutor}>👨‍🏫 {seance.tuteur_nom || 'Tuteur'}</Text>
                <Text style={styles.seanceDateTime}>📅 {seance.date_heure_debut ? new Date(seance.date_heure_debut).toLocaleDateString('fr-FR') : 'Date'} • 🕐 {seance.date_heure_debut ? new Date(seance.date_heure_debut).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : 'Heure'}</Text>
                <Text style={styles.seanceLocation}>📍 {seance.lieu || 'Lieu à confirmer'} • 💰 {seance.tarif || '0'} FCFA</Text>
              </TouchableOpacity>
            ))
          )}
          
          <View style={styles.seanceActions}>
            <TouchableOpacity style={styles.seanceActionButton} onPress={handleVoirToutesSeances}>
              <Text style={styles.seanceActionText}>📅 Voir tout</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.seanceActionButton} onPress={handleReserverSeance}>
              <Text style={styles.seanceActionText}>➕ Réserver</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Recommandations personnalisées */}
        <Card style={styles.recommendationsCard}>
          <Text style={styles.sectionTitle}>🎯 RECOMMANDATIONS POUR VOUS</Text>
          
          {dashboardData.recommandations.tuteurRecommande && (
            <TouchableOpacity style={styles.recommendationItem}>
              <Text style={styles.recommendationTitle}>👨‍🏫 Tuteur recommandé</Text>
              <Text style={styles.recommendationName}>{dashboardData.recommandations.tuteurRecommande.nom}</Text>
              <Text style={styles.recommendationDescription}>
                Spécialiste en {dashboardData.recommandations.tuteurRecommande.specialite || 'Mathématiques'}
              </Text>
              <Text style={styles.recommendationStats}>
                ⭐ {dashboardData.recommandations.tuteurRecommande.note || '4.8'}/5 • {dashboardData.recommandations.tuteurRecommande.nb_seances || '127'} séances
              </Text>
              <Text style={styles.recommendationMatch}>🎯 Parfait pour votre profil</Text>
              <TouchableOpacity style={styles.recommendationButton} onPress={() => handleContacterTuteur(dashboardData.recommandations.tuteurRecommande.id)}>
                <Text style={styles.recommendationButtonText}>📞 Contacter</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          )}

          {dashboardData.recommandations.ressourceSuggeree && (
            <TouchableOpacity style={styles.recommendationItem} onPress={() => handleVoirRessource(dashboardData.recommandations.ressourceSuggeree.id)}>
              <Text style={styles.recommendationTitle}>📚 Ressource suggérée</Text>
              <Text style={styles.recommendationName}>"{dashboardData.recommandations.ressourceSuggeree.titre}"</Text>
              <Text style={styles.recommendationDescription}>
                {dashboardData.recommandations.ressourceSuggeree.type || 'PDF'} complet
              </Text>
              <Text style={styles.recommendationStats}>
                📈 95% utile pour votre niveau • 👁️ {dashboardData.recommandations.ressourceSuggeree.vues || '2.3k'} vues
              </Text>
              <TouchableOpacity style={styles.recommendationButton}>
                <Text style={styles.recommendationButtonText}>📖 Consulter</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          )}
          
          <View style={styles.recommendationActions}>
            <TouchableOpacity style={styles.recommendationActionButton}>
              <Text style={styles.recommendationActionText}>🔄 Voir plus</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.recommendationActionButton}>
              <Text style={styles.recommendationActionText}>⚙️ Paramètres</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Activité forum */}
        <Card style={styles.forumCard}>
          <Text style={styles.sectionTitle}>💬 ACTIVITÉ FORUM</Text>
          
          {dashboardData.forumActivite.questionRecente && (
            <TouchableOpacity style={styles.forumItem}>
              <Text style={styles.forumQuestionTitle}>❓ Votre question : "{dashboardData.forumActivite.questionRecente.titre}"</Text>
              <Text style={styles.forumStats}>💬 {dashboardData.forumActivite.reponsesRecues} nouvelles réponses • ⏰ Il y a 2h</Text>
              <Text style={styles.forumSolution}>🏆 Meilleure réponse sélectionnée</Text>
              <TouchableOpacity style={styles.forumButton} onPress={handleVoirForum}>
                <Text style={styles.forumButtonText}>💬 Voir</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          )}
          
          <View style={styles.forumStats}>
            <Text style={styles.forumStatItem}>🔔 Réponses à vos questions</Text>
            <Text style={styles.forumStatItem}>🏆 Badge obtenu : "Helper du mois"</Text>
            <Text style={styles.forumStatItem}>📈 {dashboardData.forumActivite.questionsRepondues} questions répondues • ⭐ {dashboardData.forumActivite.moyenneReponses} moyenne</Text>
          </View>
          
          <View style={styles.forumActions}>
            <TouchableOpacity style={styles.forumActionButton} onPress={handleVoirForum}>
              <Text style={styles.forumActionText}>💬 Forum</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.forumActionButton} onPress={handleVoirBadges}>
              <Text style={styles.forumActionText}>🏆 Badges</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Ressources récentes */}
        <Card style={styles.resourcesCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>📚 RESSOURCES RÉCENTES</Text>
            <TouchableOpacity onPress={handleVoirBibliotheque}>
              <Text style={styles.seeAllText}>Voir tout</Text>
            </TouchableOpacity>
          </View>
          
          {dashboardData.ressourcesRecentes.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="folder-open-outline" size={40} color="#ccc" />
              <Text style={styles.emptyText}>Aucune ressource récente</Text>
            </View>
          ) : (
            dashboardData.ressourcesRecentes.slice(0, 2).map((ressource) => (
              <TouchableOpacity key={ressource.id} style={styles.resourceItem} onPress={() => handleVoirRessource(ressource.id)}>
                <Text style={styles.resourceTitle}>📄 "{ressource.titre}"</Text>
                <Text style={styles.resourceMeta}>👨‍🏫 {ressource.auteur} • 📅 {new Date(ressource.date_publication).toLocaleDateString('fr-FR')} • ⭐ {ressource.note || '4.9'}/5</Text>
                <Text style={styles.resourceStats}>📊 Consulté {ressource.nb_vues || '156'} fois • 💾 {ressource.nb_telechargements || '23'} téléchargements</Text>
              </TouchableOpacity>
            ))
          )}
          
          <Text style={styles.favoritesText}>📂 Vos favoris : 12 ressources</Text>
          <Text style={styles.lastViewedText}>📈 Dernière consultation : "Exercices Chimie"</Text>
          
          <View style={styles.resourceActions}>
            <TouchableOpacity style={styles.resourceActionButton} onPress={handleVoirBibliotheque}>
              <Text style={styles.resourceActionText}>📚 Bibliothèque</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.resourceActionButton}>
              <Text style={styles.resourceActionText}>⭐ Favoris</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Actions rapides */}
        <Card style={styles.quickActionsCard}>
          <Text style={styles.sectionTitle}>⚡ ACTIONS RAPIDES</Text>
          
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity style={styles.quickActionButton} onPress={handleChercherTuteur}>
              <Ionicons name="search" size={24} color="#007AFF" />
              <Text style={styles.quickActionText}>Chercher un tuteur</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.quickActionButton} onPress={handleReserverSeanceRapide}>
              <Ionicons name="calendar" size={24} color="#27ae60" />
              <Text style={styles.quickActionText}>Réserver une séance</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.quickActionsGrid}>
            <TouchableOpacity style={styles.quickActionButton} onPress={handleConsulterRessources}>
              <Ionicons name="folder" size={24} color="#f39c12" />
              <Text style={styles.quickActionText}>Consulter ressources</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.quickActionButton} onPress={handlePoserQuestion}>
              <Ionicons name="help-circle" size={24} color="#e74c3c" />
              <Text style={styles.quickActionText}>Poser une question</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.quickActionsGrid}>
            <TouchableOpacity style={styles.quickActionButton} onPress={handleRejoindreGroupe}>
              <Ionicons name="people" size={24} color="#9b59b6" />
              <Text style={styles.quickActionText}>Rejoindre un groupe</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.quickActionButton} onPress={handleContacterMonTuteur}>
              <Ionicons name="mail" size={24} color="#3498db" />
              <Text style={styles.quickActionText}>Contacter mon tuteur</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.quickActionsGrid}>
            <TouchableOpacity style={styles.quickActionButton} onPress={handleDefinirObjectifs}>
              <Ionicons name="target" size={24} color="#16a085" />
              <Text style={styles.quickActionText}>Définir objectifs</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.quickActionButton} onPress={handleVoirStatistiques}>
              <Ionicons name="stats-chart" size={24} color="#e67e22" />
              <Text style={styles.quickActionText}>Voir statistiques</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.quickActionsBottom}>
            <TouchableOpacity style={styles.quickActionButtonBottom} onPress={handleSettings}>
              <Ionicons name="settings" size={20} color="#666" />
              <Text style={styles.quickActionTextBottom}>⚙️ Paramètres</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.quickActionButtonBottom} onPress={onRefresh}>
              <Ionicons name="refresh" size={20} color="#666" />
              <Text style={styles.quickActionTextBottom}>🔄 Actualiser</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Notifications importantes */}
        {dashboardData.notifications.length > 0 && (
          <Card style={styles.notificationsCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>🔔 NOTIFICATIONS IMPORTANTES</Text>
              <TouchableOpacity onPress={handleVoirNotifications}>
                <Text style={styles.seeAllText}>Voir tout</Text>
              </TouchableOpacity>
            </View>
            
            {dashboardData.notifications.slice(0, 3).map((notification, index) => (
              <TouchableOpacity key={notification.id} style={styles.notificationItem}>
                <Text style={styles.notificationTitle}>{notification.titre}</Text>
                <Text style={styles.notificationMessage}>{notification.message}</Text>
                <Text style={styles.notificationTime}>⏰ {new Date(notification.date_creation).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</Text>
                <TouchableOpacity style={styles.notificationButton}>
                  <Text style={styles.notificationButtonText}>✅</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </Card>
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
  
  // Section Bienvenue
  welcomeCard: {
    marginBottom: 20,
    padding: 20,
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
    backgroundColor: '#007AFF',
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
  welcome: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
  },
  studentInfo: {
    marginTop: 8,
  },
  studentRole: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
    marginBottom: 4,
  },
  studentMajor: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  studentLevel: {
    fontSize: 14,
    color: '#28a745',
    fontWeight: '500',
  },
  profileButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
  },
  
  // Progression académique
  progressionCard: {
    marginBottom: 8,
    padding: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  progressItem: {
    marginBottom: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  progressLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  progressValue: {
    fontSize: 12,
    color: '#333',
    fontWeight: 'bold',
  },
  progressBar: {
    height: 5,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginBottom: 2,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressTarget: {
    fontSize: 10,
    color: '#666',
  },
  progressActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  progressButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    padding: 8,
    borderRadius: 8,
    marginHorizontal: 2,
    alignItems: 'center',
  },
  progressButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  
  // Statistiques
  statsCard: {
    marginBottom: 8,
    padding: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statItem: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 8,
    borderRadius: 8,
    marginHorizontal: 2,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 3,
  },
  statLabel: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
    marginBottom: 3,
  },
  statEvolution: {
    fontSize: 9,
    color: '#27ae60',
    fontWeight: '500',
  },
  
  // Séances
  seancesCard: {
    marginBottom: 20,
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seeAllText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    color: '#999',
    fontSize: 16,
    marginTop: 8,
    marginBottom: 16,
  },
  reserveButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  reserveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  seanceItem: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  seanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  seanceSubject: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  seanceAction: {
    padding: 4,
  },
  seanceTutor: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  seanceDateTime: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  seanceLocation: {
    fontSize: 14,
    color: '#666',
  },
  seanceActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  seanceActionButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  seanceActionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  
  // Recommandations
  recommendationsCard: {
    marginBottom: 20,
    padding: 20,
  },
  recommendationItem: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  recommendationTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  recommendationName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  recommendationDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  recommendationStats: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  recommendationMatch: {
    fontSize: 12,
    color: '#27ae60',
    fontWeight: '500',
    marginBottom: 8,
  },
  recommendationButton: {
    backgroundColor: '#27ae60',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  recommendationButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  recommendationActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  recommendationActionButton: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  recommendationActionText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  
  // Forum
  forumCard: {
    marginBottom: 20,
    padding: 20,
  },
  forumItem: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  forumQuestionTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  forumStats: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  forumSolution: {
    fontSize: 12,
    color: '#27ae60',
    fontWeight: '500',
    marginBottom: 8,
  },
  forumButton: {
    backgroundColor: '#9b59b6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  forumButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  forumActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  forumActionButton: {
    flex: 1,
    backgroundColor: '#9b59b6',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  forumActionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  
  // Ressources
  resourcesCard: {
    marginBottom: 20,
    padding: 20,
  },
  resourceItem: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  resourceTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  resourceMeta: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  resourceStats: {
    fontSize: 12,
    color: '#666',
  },
  favoritesText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  lastViewedText: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  resourceActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  resourceActionButton: {
    flex: 1,
    backgroundColor: '#f39c12',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  resourceActionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  
  // Actions rapides
  quickActionsCard: {
    marginBottom: 20,
    padding: 20,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  quickActionText: {
    fontSize: 12,
    color: '#333',
    marginTop: 8,
    textAlign: 'center',
  },
  quickActionsBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  quickActionButtonBottom: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionTextBottom: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  
  // Notifications
  notificationsCard: {
    marginBottom: 20,
    padding: 20,
  },
  notificationItem: {
    backgroundColor: '#fff3cd',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 12,
    color: '#856404',
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 11,
    color: '#856404',
    marginBottom: 8,
  },
  notificationButton: {
    backgroundColor: '#ffc107',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  notificationButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
});

export default StudentDashboardScreen;
