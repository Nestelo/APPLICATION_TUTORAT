import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Dimensions, TouchableOpacity, Image, TextInput, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import Header from '../../components/ui/Header';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';
import { getOffres } from '../../api/offreService';
import { getNotifications, getUnreadCount } from '../../api/notificationService';
import { formatDate, formatTime } from '../../utils/helpers';
import { API_BASE_URL } from '../../config/api';
import { getQuestions, getReponses } from '../../api/forumService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const TutorDashboardScreen = ({ navigation, route }) => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [updatingImage, setUpdatingImage] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [stats, setStats] = useState({
    nombreEtudiants: 2,
    nombreSeances: 15,
    ressourcesPubliees: 7,
    questionsRepondues: 3,
    noteMoyenne: 4.5,
    nombreEvaluations: 8,
    evolutionEtudiants: '+15%',
    evolutionSeances: '+20%',
  });
  const [prochainesSeances, setProchainesSeances] = useState([]);
  const [mesOffres, setMesOffres] = useState([
    {
      id: 1,
      titre: 'Cours particulier Cryptographie',
      type: 'individuel',
      tarif: 2500,
      description: 'Soutien en cryptographie et sécurité informatique pour tous niveaux. Algorithmes de chiffrement, protocoles de sécurité.',
      matiere: 'cryptographie',
      niveau: 'L2'
    },
    {
      id: 2,
      titre: 'Préparation examen Analyse Mathématique',
      type: 'individuel',
      tarif: 3000,
      description: 'Préparation intensive aux examens d\'analyse mathématique. Limites, dérivées, intégrales.',
      matiere: 'analyse',
      niveau: 'L2'
    },
    {
      id: 3,
      titre: 'Cours groupe Physique-Chimie',
      type: 'groupe',
      tarif: 1500,
      description: 'Introduction à la physique-chimie en petit groupe. Mécanique, thermodynamique, réactions chimiques.',
      matiere: 'physique',
      niveau: 'L1'
    },
    {
      id: 4,
      titre: 'Tutorat Algorithmique et Programmation',
      type: 'individuel',
      tarif: 2800,
      description: 'Apprentissage des algorithmes et structures de données. Python, Java, C++.',
      matiere: 'informatique',
      niveau: 'L2'
    }
  ]);
  const [editingOffre, setEditingOffre] = useState(null);
  const [modifiedOffre, setModifiedOffre] = useState({});
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const [matieresRefreshKey, setMatieresRefreshKey] = useState(0);
  const [showAllOffres, setShowAllOffres] = useState(false); // false = 2 récentes, true = toutes
  const [showAllSeances, setShowAllSeances] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [recentQuestions, setRecentQuestions] = useState([]);
  const [lastResponseCount, setLastResponseCount] = useState(0); // Suivre le nombre de réponses pour détecter les changements

  useEffect(() => {
    // Charger les données initiales uniquement
    loadData();
    loadProfileImage();
  }, [user]);

  useEffect(() => {
    console.log('📊 Tableau de bord actif - rafraîchissement des données...');
    loadData();
    forceReloadProfileImage();
  }, [refreshKey]);

  const loadProfileImage = async () => {
    try {
      console.log('Chargement image profil pour user:', user?.id);
      
      const photoUrl = user?.photo_url || user?.photo;
      
      if (photoUrl) {
        const imageUrl = getImageUrl(photoUrl);
        console.log('URL image profil avec anti-cache:', imageUrl);
        setProfileImage(imageUrl);
      } else {
        console.log('Aucune photo de profil trouvée pour:', user?.id);
        setProfileImage(null);
      }
    } catch (error) {
      console.error('Erreur chargement image profil:', error);
      setProfileImage(null);
    }
  };

  const forceReloadProfileImage = async () => {
    try {
      console.log('Rechargement forcé de l\'image profil...');
      
      const token = await AsyncStorage.getItem('accessToken');
      const profileUrl = `${API_BASE_URL}/api/auth/profile/`;
      console.log('URL profil pour rechargement:', profileUrl);
      
      const response = await fetch(profileUrl, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      console.log('Response status:', response.status);
      
      if (response.ok) {
        const updatedUserData = await response.json();
        console.log('Données utilisateur mises à jour:', updatedUserData);
        
        const userData = updatedUserData.user || updatedUserData;
        
        const photoUrl = userData.photo_url || userData.photo;
        
        if (photoUrl) {
          const newImageUrl = getImageUrl(photoUrl);
          console.log('Nouvelle URL image avec timestamp:', newImageUrl);
          setProfileImage(newImageUrl);
        } else {
          setProfileImage(null);
        }
      } else {
        const errorText = await response.text();
        console.log('Erreur response:', errorText);
      }
    } catch (error) {
      console.error('Erreur rechargement forcé image:', error);
    }
  };

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

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    await forceReloadProfileImage();
    setRefreshing(false);
  };

  const handleModifierOffre = (offre) => {
    setEditingOffre(offre.id);
    setModifiedOffre({
      titre: offre.titre || '',
      description: offre.description || '',
      tarif: offre.tarif || null,
      type: offre.type || 'individuel',
      matiere: offre.matiere || '',
      niveau: offre.niveau || '',
      gratuit: offre.gratuit || false,
      en_ligne: offre.en_ligne !== undefined ? offre.en_ligne : true,
      lieu: offre.lieu || '',
      nombre_places: offre.nombre_places || 1,
      duree_session: offre.duree_session || 60
    });
  };

  const handleEnregistrerOffre = async (offreId) => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      
      // Préparer les données à sauvegarder
      const dataToSave = {
        ...modifiedOffre,
        // Si gratuit est true, mettre tarif à null
        tarif: modifiedOffre.gratuit ? null : (modifiedOffre.tarif || null),
        // S'assurer que gratuit est bien défini
        gratuit: modifiedOffre.gratuit || false
      };
      
      console.log('🔧 Données à sauvegarder:', dataToSave);
      
      const response = await fetch(`${API_BASE_URL}/api/tutorat/offres/${offreId}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(dataToSave)
      });

      if (response.ok) {
        Alert.alert('Succès', 'Offre modifiée avec succès');
        setEditingOffre(null);
        setModifiedOffre({});
        // Forcer le rechargement immédiat des offres
        await loadData();
        // Forcer un re-render pour mettre à jour l'affichage
        setRefreshKey(prev => prev + 1);
      } else {
        const error = await response.json();
        console.error('❌ Erreur API:', error);
        Alert.alert('Erreur', 'Impossible de modifier l\'offre');
      }
    } catch (error) {
      console.error('❌ Erreur modification offre:', error);
      Alert.alert('Erreur', 'Impossible de modifier l\'offre');
    }
  };

  const handleAnnulerModification = () => {
    setEditingOffre(null);
    setModifiedOffre({});
  };

  const loadUserData = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}/api/auth/profile/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const result = await response.json();
        const userData = result.user || result;
        updateUser(userData);
        console.log('🔍 Données utilisateur rechargées:', userData);
        // Forcer le rafraîchissement des matières
        setMatieresRefreshKey(prev => prev + 1);
      }
    } catch (error) {
      console.error('❌ Erreur rechargement utilisateur:', error);
    }
  };

  // Effet pour recharger les données utilisateur au focus
  useFocusEffect(
    React.useCallback(() => {
      console.log('📊 Focus sur tableau de bord - vérification des changements...');
      loadUserData();
      
      // Vérifier si le nombre de réponses a changé avant de rafraîchir
      const checkAndUpdateStats = async () => {
        try {
          const token = await AsyncStorage.getItem('accessToken');
          const timestamp = Date.now(); // Anti-cache
          const response = await fetch(`${API_BASE_URL}/api/forum/reponses/?auteur=${user.id}&_t=${timestamp}`, {
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache'
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            const responses = data.results || data || [];
            const currentResponseCount = responses.length;
            
            // L'API retourne déjà les réponses filtrées par auteur, pas besoin de filtrer à nouveau
            const userResponseCount = responses.length;
            
            console.log(`� Analyse réponses: ${currentResponseCount} totales, ${userResponseCount} de l'utilisateur ${user.id}`);
            console.log('🔍 Dernières réponses:', responses.slice(-3).map(r => ({ id: r.id, contenu: r.contenu.substring(0, 30) })));
            
            // Toujours rafraîchir pour garantir la mise à jour
            console.log(`🔄 Rafraîchissement forcé: ${lastResponseCount} → ${userResponseCount} réponses`);
            setLastResponseCount(userResponseCount);
            loadData();
          }
        } catch (error) {
          console.error('❌ Erreur vérification réponses:', error);
          loadData(); // En cas d'erreur, rafraîchir quand même
        }
      };
      
      checkAndUpdateStats();
    }, [user?.id, lastResponseCount])
  );

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Charger les séances depuis la bonne API
      const authToken = await AsyncStorage.getItem('accessToken');
      const seancesResponse = await fetch(`${API_BASE_URL}/api/tutorat/mes-seances/`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      
      let seances = [];
      if (seancesResponse.ok) {
        const seancesData = await seancesResponse.json();
        // Combiner les séances à venir et passées
        const seancesAVenir = seancesData.seances_avenir || [];
        const seancesPassees = seancesData.seances_passees || [];
        seances = [...seancesAVenir, ...seancesPassees];
      } else {
        console.error('❌ Erreur chargement séances mes-seances:', seancesResponse.status);
      }
      
      const [offresResult, notificationsResult, questionsResult] = await Promise.all([
        getOffres({ tuteur: user.id, est_active: true }),
        getNotifications({ est_lue: false }),
        getQuestions({ limit:10 }) // Augmenter la limite pour avoir plus de questions
      ]);
      
      const offresResponse = Array.isArray(offresResult) ? offresResult : (offresResult.data || offresResult.results || []);
      const offres = offresResponse.success ? offresResponse.data : offresResponse;
      const notifications = Array.isArray(notificationsResult) ? notificationsResult : (notificationsResult.results || []);
      const questionsData = Array.isArray(questionsResult) ? questionsResult : (questionsResult.results || []);
      console.log('🔍 Séances de mes-seances reçues:', seances.length, seances);
      console.log('🔍 Offres reçues:', offres.length, offres);
      
      // Utiliser les vraies offres de l'API
      if (offres.length > 0) {
        setMesOffres(offres);
      } else {
        // Garder les offres par défaut si aucune offre dans l'API
        console.log('🔍 Aucune offre trouvée, utilisation des offres par défaut');
      }
      
      // Récupérer les réponses du tuteur (plus pertinent que les questions)
      const reponsesToken = await AsyncStorage.getItem('accessToken');
      const timestamp = Date.now(); // Anti-cache
      const reponsesResponse = await fetch(`${API_BASE_URL}/api/forum/reponses/?auteur=${user.id}&_t=${timestamp}`, {
        headers: { 
          'Authorization': `Bearer ${reponsesToken}`,
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      let reponsesData = [];
      if (reponsesResponse.ok) {
        const data = await reponsesResponse.json();
        reponsesData = data.results || data || [];
      }
      
      console.log('🔍 Réponses du tuteur reçues:', reponsesData.length, reponsesData);
      
      // Filtrer les séances correctement
      console.log('🔍 Séances brutes de mes-seances:', seances.length, seances);
      
      // Séances à venir : statut 'planifiee' ET date future
      const maintenant = new Date();
      const seancesAVenir = seances.filter(s => {
        const dateSeance = new Date(s.date_heure_debut);
        const estPlanifiee = s.statut === 'planifiee';
        const estFuture = dateSeance > maintenant;
        return estPlanifiee && estFuture;
      });
      
      // Séances passées : statut 'terminee' OU (statut 'planifiee' ET date passée)
      const seancesTermineesAujourdhui = seances.filter(s => {
        const dateSeance = new Date(s.date_heure_debut);
        const estTerminee = s.statut === 'terminee';
        const estPlanifieePassee = s.statut === 'planifiee' && dateSeance <= maintenant;
        return estTerminee || estPlanifieePassee;
      });
      
      console.log('🔍 Séances filtrées:', {
        aVenir: seancesAVenir.length,
        termineesAujourdhui: seancesTermineesAujourdhui.length,
        details: {
          maintenant: maintenant.toISOString(),
          seancesAVenir: seancesAVenir.map(s => ({
            id: s.id,
            statut: s.statut,
            date: s.date_heure_debut,
            dateObj: new Date(s.date_heure_debut),
            estFuture: new Date(s.date_heure_debut) > maintenant
          })),
          seancesTermineesAujourdhui: seancesTermineesAujourdhui.map(s => ({
            id: s.id,
            statut: s.statut,
            date: s.date_heure_debut,
            dateObj: new Date(s.date_heure_debut),
            estPassee: new Date(s.date_heure_debut) <= maintenant
          }))
        }
      });
      
      // Afficher les séances à venir (priorité) ou les séances du jour si aucune à venir
      const prochainesSeancesAffichees = seancesAVenir.length > 0 
        ? seancesAVenir.slice(0, 3)
        : seancesTermineesAujourdhui.slice(0, 3);
      
      setProchainesSeances(prochainesSeancesAffichees);
      
      const resourcesToken = await AsyncStorage.getItem('accessToken');
      const resourcesResponse = await fetch(`${API_BASE_URL}/api/ressources/ressources/?auteur=${user.id}`, {
        headers: { 'Authorization': `Bearer ${resourcesToken}` }
      });
      
      let resourcesData = [];
      if (resourcesResponse.ok) {
        const data = await resourcesResponse.json();
        resourcesData = data.results || data || [];
      }
      
      // Calculer le vrai nombre de réponses du tuteur
      const totalReponses = reponsesData.length;
      
      // Parcourir toutes les séances (terminées et planifiées)
      const tousEtudiants = new Set();
      seances.forEach(s => {
        // Récupérer les étudiants depuis le champ etudiants (array d'objets avec id)
        if (s.etudiants && Array.isArray(s.etudiants)) {
          s.etudiants.forEach(etudiant => {
            // etudiant est un objet {id, nom, prenom, email}
            if (etudiant && etudiant.id) {
              tousEtudiants.add(etudiant.id);
            }
          });
        }
        // Alternative: si etudiants_details existe
        if (s.etudiants_details && Array.isArray(s.etudiants_details)) {
          s.etudiants_details.forEach(etudiant => {
            if (etudiant && etudiant.id) tousEtudiants.add(etudiant.id);
          });
        }
      });
      
      console.log('🔍 Calcul étudiants:', {
        totalSeances: seances.length,
        etudiantsUniques: tousEtudiants.size,
        detailsSeances: seances.map(s => ({
          id: s.id,
          sujet: s.sujet,
          statut: s.statut,
          nbEtudiants: s.etudiants?.length || 0,
          etudiantsIds: s.etudiants?.map(e => e.id) || []
        }))
      });
      
            
      const evaluationsToken = await AsyncStorage.getItem('accessToken');
      const evaluationsResponse = await fetch(`${API_BASE_URL}/api/tutorat/evaluations/?tuteur=${user.id}`, {
        headers: { 'Authorization': `Bearer ${evaluationsToken}` }
      });
      const evaluationsData = evaluationsResponse.ok ? await evaluationsResponse.json() : [];
      
      const noteMoyenne = evaluationsData.length > 0 
        ? evaluationsData.reduce((sum, evaluation) => sum + evaluation.note, 0) / evaluationsData.length 
        : 0;
      
      // Statistiques basées sur les vraies activités du tuteur
      const statsCalculees = {
        nombreEtudiants: tousEtudiants.size, // Vrai nombre d'étudiants uniques (Set)
        nombreSeances: seances.length, // Vrai nombre de séances (planifiées + terminées)
        ressourcesPubliees: resourcesData.length || 0, // Vrai nombre de ressources
        questionsRepondues: totalReponses, // Vrai nombre de réponses
        noteMoyenne: noteMoyenne,
        nombreEvaluations: evaluationsData.length,
        classement: { position: 3, total: 25 }, // À calculer dynamiquement plus tard
        evolutionEtudiants: '+15%', // À calculer dynamiquement plus tard
        evolutionSeances: '+20%', // À calculer dynamiquement plus tard
      };
      
      console.log('📊 Statistiques basées sur les vraies activités:', {
        ...statsCalculees,
        details: {
          vraisEtudiants: tousEtudiants.size,
          vraiesSeances: seances.length,
          vraiesRessources: resourcesData.length,
          vraiesReponses: totalReponses,
          evaluations: evaluationsData.length
        }
      });
      
      setStats(statsCalculees);
      setUnreadNotifications(notifications.length);
      
    } catch (error) {
      console.error('Erreur chargement données:', error);
      Alert.alert('Erreur', 'Impossible de charger les données du tableau de bord');
    } finally {
      setLoading(false);
    }
  };

  const getTarifMoyen = (offres) => {
    if (!offres || offres.length === 0) return 2500;
    
    const tarifsValid = offres
      .filter(offre => offre.tarif && offre.tarif > 0)
      .map(offre => parseFloat(offre.tarif));
    
    if (tarifsValid.length === 0) return 2500;
    
    return tarifsValid.reduce((sum, tarif) => sum + tarif, 0) / tarifsValid.length;
  };

  const getRepartitionTypes = (offres) => {
    if (!offres || offres.length === 0) {
      return [
        { label: 'Individuel', percentage: 100, color: '#e74c3c' }
      ];
    }

    const individuel = offres.filter(offre => offre.type === 'individuel').length;
    const groupe = offres.filter(offre => offre.type === 'groupe').length;
    const total = individuel + groupe;

    if (total === 0) {
      return [
        { label: 'Individuel', percentage: 100, color: '#e74c3c' }
      ];
    }

    const result = [];
    if (individuel > 0) {
      result.push({
        label: 'Individuel',
        percentage: Math.round((individuel / total) * 100),
        color: '#e74c3c'
      });
    }
    if (groupe > 0) {
      result.push({
        label: 'Groupe',
        percentage: Math.round((groupe / total) * 100),
        color: '#f39c12'
      });
    }

    return result;
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

  if (loading) return <LoadingSpinner />;

  return (
    <>
      <Header title="Tableau de bord tuteur" showBack={false} />
      <ScrollView style={styles.container}>
        {/* Bouton d'actualisation manuel - En haut */}
        <View style={styles.refreshSection}>
          <Text style={styles.refreshTitle}>🔄 Actualisation des données</Text>
          <View style={styles.refreshButtonContainer}>
            <Button
              title="🔄 Actualiser maintenant"
              onPress={handleRefresh}
              loading={refreshing}
              style={styles.mainRefreshButton}
            />
          </View>
        </View>

        {/* Message de bienvenue avec profil */}
        <Card style={styles.welcomeCard}>
          <View style={styles.welcomeHeader}>
            <View style={styles.profileSection}>
              <View style={styles.profileImageContainer}>
                {profileImage ? (
                  <Image source={{ uri: profileImage }} style={styles.profileImage} />
                ) : (
                  <View style={[styles.profileImage, styles.profilePlaceholder]}>
                    <Ionicons name="person" size={40} color="#666" />
                  </View>
                )}
                {updatingImage && (
                  <View style={styles.uploadingOverlay}>
                    <LoadingSpinner size="small" />
                  </View>
                )}
                <View style={styles.editIcon}>
                  <Ionicons name="camera" size={16} color="#fff" />
                </View>
              </View>
              
              <View style={styles.welcomeInfo}>
                <Text style={styles.welcome}>Bonjour {user?.prenom} !</Text>
                <Text style={styles.subtitle}>Voici votre activité et performances</Text>
                <View style={styles.tutorInfo}>
                  <Text style={styles.tutorRole}>👨‍🏫 Tuteur</Text>
                  <Text style={styles.tutorSpecialty}>📚 {user?.matieres_maitrisees || 'En cours de configuration'}</Text>
                  <Text style={styles.tutorExperience}>⭐ {stats.nombreEvaluations} évaluations</Text>
                </View>
              </View>
            </View>
            
            <View style={styles.classementBadge}>
              <Text style={styles.classementText}>
                🏆 Classement: {stats.classement?.position || 3}/{stats.classement?.total || 25}
              </Text>
            </View>
          </View>
        </Card>

        {/* Statistiques principales */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Vos statistiques</Text>
          <View style={styles.statsGrid}>
            <StatCard 
              title="Étudiants accompagnés" 
              value={stats.nombreEtudiants} 
              evolution={stats.evolutionEtudiants}
              icon="👥"
              color="#e74c3c"
              onPress={() => navigation.navigate('MesEleves')}
            />
            <StatCard 
              title="Séances réalisées" 
              value={stats.nombreSeances} 
              evolution={stats.evolutionSeances}
              icon="📅"
              color="#3498db"
              onPress={() => navigation.navigate('PlanningTutor')}
            />
            <StatCard 
              title="Ressources publiées" 
              value={stats.ressourcesPubliees} 
              icon="📚"
              color="#9b59b6"
              onPress={() => navigation.navigate('TutorResources')}
            />
            <StatCard 
              title="Questions répondues" 
              value={stats.questionsRepondues} 
              icon="💬"
              color="#f39c12"
              onPress={() => navigation.navigate('ForumList')}
            />
          </View>
        </View>

        {/* Séances à venir */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>📅 Séances à venir</Text>
            <TouchableOpacity onPress={() => navigation.navigate('PlanningTutor')}>
              <Text style={styles.seeAllText}>Voir tout</Text>
            </TouchableOpacity>
          </View>
          {prochainesSeances.length > 0 ? (
            prochainesSeances.map((seance) => (
              <Card key={seance.id} style={styles.seanceCard}>
                <View style={styles.seanceHeader}>
                  <Text style={styles.seanceSujet}>{seance.sujet}</Text>
                  <Text style={styles.seanceStatut}>{seance.statut_display || 'Planifiée'}</Text>
                </View>
                <View style={styles.seanceDetails}>
                  <Text style={styles.seanceDate}>📅 {new Date(seance.date_heure_debut).toLocaleDateString('fr-FR')}</Text>
                  <Text style={styles.seanceTime}>⏰ {new Date(seance.date_heure_debut).toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'})}</Text>
                </View>
                {seance.etudiants && seance.etudiants.length > 0 && (
                  <Text style={styles.seanceEtudiants}>
                    👥 {seance.etudiants.length} étudiant{seance.etudiants.length > 1 ? 's' : ''}
                  </Text>
                )}
                {seance.lieu && (
                  <Text style={styles.seanceLieu}>📍 {seance.lieu}</Text>
                )}
              </Card>
            ))
          ) : (
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyText}>Aucune séance à venir</Text>
              <TouchableOpacity onPress={() => navigation.navigate('TutorSessions')}>
                <Text style={styles.emptyAction}>Planifier une séance</Text>
              </TouchableOpacity>
            </Card>
          )}
        </View>

        {/* Performance et Activité côte à côte */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⭐ Vos indicateurs</Text>
          <View style={styles.performanceActivityGrid}>
            {/* Performance */}
            <Card style={styles.compactPerformanceCard}>
              <Text style={styles.compactCardTitle}>📊 Performance</Text>
              <Text style={styles.compactCardValue}>{stats.noteMoyenne}/5</Text>
              <Text style={styles.compactCardSubtext}>{stats.nombreEvaluations} évaluations</Text>
              <View style={styles.compactStars}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Text key={star} style={styles.compactStar}>
                    {star <= Math.floor(stats.noteMoyenne) ? '⭐' : '☆'}
                  </Text>
                ))}
              </View>
            </Card>
            
            {/* Activité */}
            <Card style={styles.compactActivityCard}>
              <Text style={styles.compactCardTitle}>📈 Mon activité</Text>
              <Text style={styles.compactCardValue}>📊</Text>
              <Text style={styles.compactCardSubtext}>Voir détails</Text>
              <TouchableOpacity 
                style={styles.compactCardButton}
                onPress={() => navigation.navigate('Activity')}
              >
                <Text style={styles.compactCardButtonText}>Accéder</Text>
              </TouchableOpacity>
            </Card>
          </View>
        </View>

        {/* Notifications */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🔔 Notifications</Text>
            {unreadNotifications > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadNotifications}</Text>
              </View>
            )}
          </View>
          <Card onPress={() => navigation.navigate('Notifications')}>
            <Text style={styles.notificationText}>
              {unreadNotifications > 0 
                ? `Vous avez ${unreadNotifications} notification${unreadNotifications > 1 ? 's' : ''} non lue${unreadNotifications > 1 ? 's' : ''}`
                : 'Aucune notification non lue'
              }
            </Text>
          </Card>
        </View>

        {/* Vos offres actives */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>📝 Vos offres actives</Text>
            <View style={styles.toggleContainer}>
              <TouchableOpacity 
                style={[styles.toggleButton, !showAllOffres && styles.toggleButtonActive]} 
                onPress={() => setShowAllOffres(false)}
              >
                <Text style={[styles.toggleButtonText, !showAllOffres && styles.toggleButtonTextActive]}>
                  OFF
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.toggleButton, showAllOffres && styles.toggleButtonActive]} 
                onPress={() => setShowAllOffres(true)}
              >
                <Text style={[styles.toggleButtonText, showAllOffres && styles.toggleButtonTextActive]}>
                  ON
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.offresContainer}>
            {mesOffres.filter(offre => offre.titre && offre.titre !== null && offre.titre.trim() !== '').slice(0, showAllOffres ? mesOffres.length : 2).map((offre) => (
              <Card key={offre.id} style={styles.offreCard}>
                {editingOffre === offre.id ? (
                  // Mode édition
                  <View>
                    <TextInput
                      style={styles.inputOffre}
                      value={modifiedOffre.titre}
                      onChangeText={(text) => setModifiedOffre({...modifiedOffre, titre: text})}
                      placeholder="Titre de l'offre"
                    />
                    <TextInput
                      style={[styles.inputOffre, styles.textAreaOffre]}
                      value={modifiedOffre.description}
                      onChangeText={(text) => setModifiedOffre({...modifiedOffre, description: text})}
                      placeholder="Description"
                      multiline
                    />
                    <View style={styles.offreEditRow}>
                      <TextInput
                        style={[styles.inputOffre, styles.tarifInput]}
                        value={modifiedOffre.tarif?.toString()}
                        onChangeText={(text) => setModifiedOffre({...modifiedOffre, tarif: text ? parseFloat(text) : null})}
                        placeholder="Tarif (FCFA)"
                        keyboardType="numeric"
                      />
                      <View style={styles.typeButtons}>
                        <TouchableOpacity
                          style={[styles.typeButton, modifiedOffre.type === 'individuel' && styles.typeButtonActive]}
                          onPress={() => setModifiedOffre({...modifiedOffre, type: 'individuel'})}
                        >
                          <Text style={styles.typeButtonText}>Individuel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.typeButton, modifiedOffre.type === 'groupe' && styles.typeButtonActive]}
                          onPress={() => setModifiedOffre({...modifiedOffre, type: 'groupe'})}
                        >
                          <Text style={styles.typeButtonText}>Groupe</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                    <View style={styles.offreEditRow}>
                      <TextInput
                        style={[styles.inputOffre, styles.smallInput]}
                        value={modifiedOffre.matiere}
                        onChangeText={(text) => setModifiedOffre({...modifiedOffre, matiere: text})}
                        placeholder="Matière"
                      />
                      <TextInput
                        style={[styles.inputOffre, styles.smallInput]}
                        value={modifiedOffre.niveau}
                        onChangeText={(text) => setModifiedOffre({...modifiedOffre, niveau: text})}
                        placeholder="Niveau"
                      />
                    </View>
                    <View style={styles.offreEditRow}>
                      <TouchableOpacity
                        style={[styles.checkboxButton, modifiedOffre.gratuit && styles.checkboxActive]}
                        onPress={() => setModifiedOffre({...modifiedOffre, gratuit: !modifiedOffre.gratuit})}
                      >
                        <Text style={styles.checkboxText}>
                          {modifiedOffre.gratuit ? '✓ Gratuit' : ' Gratuit'}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.checkboxButton, modifiedOffre.en_ligne && styles.checkboxActive]}
                        onPress={() => setModifiedOffre({...modifiedOffre, en_ligne: !modifiedOffre.en_ligne})}
                      >
                        <Text style={styles.checkboxText}>
                          {modifiedOffre.en_ligne ? '✓ En ligne' : ' En ligne'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                    <View style={styles.editButtonsRow}>
                      <TouchableOpacity
                        onPress={() => handleEnregistrerOffre(offre.id)}
                        style={styles.enregistrerButton}
                      >
                        <Text style={styles.enregistrerButtonText}>Enregistrer</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={handleAnnulerModification}
                        style={styles.annulerButton}
                      >
                        <Text style={styles.annulerButtonText}>Annuler</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  // Mode affichage
                  <View>
                    <View style={styles.offreHeader}>
                      <Text style={styles.offreTitre}>{offre.titre}</Text>
                      <View style={[styles.offreType,offre.type === 'individuel' ? styles.typeIndividuel : styles.typeGroupe]}>
                        <Text style={styles.offreTypeText}>{offre.type === 'individuel' ? 'Individuel' : 'Groupe'}</Text>
                      </View>
                    </View>
                    <Text style={styles.offreDescription}>{offre.description}</Text>
                    <View style={styles.offreFooter}>
                      <Text style={styles.offreTarif}>
  {modifiedOffre.gratuit !== undefined ? (modifiedOffre.gratuit ? 'Gratuit' : (modifiedOffre.tarif ? `${modifiedOffre.tarif} FCFA/h` : 'Tarif non défini')) : 
   (offre.gratuit ? 'Gratuit' : (offre.tarif ? `${offre.tarif} FCFA/h` : 'Tarif non défini'))}
</Text>
                      <TouchableOpacity 
                        onPress={() => handleModifierOffre(offre)}
                        style={styles.editOffreButton}
                      >
                        <Text style={styles.editOffreText}>Modifier</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </Card>
            ))}
          </View>
        </View>

        {/* Matières enseignées */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📚 Mes matières enseignées</Text>
          <View style={styles.tagsContainer}>
            {user?.matieres_maitrisees && user.matieres_maitrisees.length > 0 ? (
              (() => {
                // Gérer le cas où matieres_maitrisees est une chaîne ou un tableau
                let matieresArray = [];
                if (typeof user.matieres_maitrisees === 'string') {
                  try {
                    // Essayer de parser la chaîne JSON
                    matieresArray = JSON.parse(user.matieres_maitrisees.replace(/\\u00e9/g, 'é').replace(/\\u00e8/g, 'è'));
                  } catch (e) {
                    // Si le parsing échoue, diviser par virgule et nettoyer
                    matieresArray = user.matieres_maitrisees
                      .split(',')
                      .map(m => m.trim())
                      .filter(m => m.length > 0); // Filtrer les chaînes vides
                  }
                } else if (Array.isArray(user.matieres_maitrisees)) {
                  matieresArray = user.matieres_maitrisees;
                }
                
                return matieresArray.map((matiere, index) => (
                  <Card key={`${matieresRefreshKey}-${index}`} style={styles.tag}>
                    <Text style={styles.tagText}>{matiere}</Text>
                  </Card>
                ));
              })()
            ) : (
              <Card key={`${matieresRefreshKey}-empty`} style={styles.tag}>
                <Text style={styles.tagText}>Aucune matière</Text>
              </Card>
            )}
          </View>
        </View>

        {/* Performance récente */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📈 Performance récente</Text>
          <View style={styles.performanceGrid}>
            <View style={styles.performanceItem}>
              <Text style={styles.performanceValue}>{stats.nombreEtudiants}</Text>
              <Text style={styles.performanceLabel}>Étudiants</Text>
              <Text style={styles.performanceTrend}>{stats.evolutionEtudiants}</Text>
            </View>
            <View style={styles.performanceItem}>
              <Text style={styles.performanceValue}>{stats.nombreSeances}</Text>
              <Text style={styles.performanceLabel}>Séances</Text>
              <Text style={styles.performanceTrend}>{stats.evolutionSeances}</Text>
            </View>
            <View style={styles.performanceItem}>
              <Text style={styles.performanceValue}>{stats.noteMoyenne.toFixed(1)}</Text>
              <Text style={styles.performanceLabel}>Note moy.</Text>
              <Text style={styles.performanceTrend}>⭐ {stats.nombreEvaluations} avis</Text>
            </View>
          </View>
        </View>

        {/* Actions rapides */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚡ Actions rapides</Text>
          <View style={styles.quickActions}>
            <Button
              title="📝 Créer offre"
              onPress={() => navigation.navigate('SmartOfferCreation')}
              variant="outline"
              style={styles.quickAction}
            />
            <Button
              title="📅 Planifier"
              onPress={() => navigation.navigate('TutorSessions')}
              variant="outline"
              style={styles.quickAction}
            />
            <Button
              title="✅ Gérer inscriptions"
              onPress={() => navigation.navigate('ManageInscriptions')}
              variant="outline"
              style={styles.quickAction}
            />
          </View>
          <View style={styles.quickActions}>
            <Button
              title="💬 Forum"
              onPress={() => navigation.navigate('TutorForum')}
              variant="outline"
              style={styles.quickAction}
            />
            <Button
              title="👤 Profil"
              onPress={() => navigation.navigate('EditProfil')}
              variant="outline"
              style={styles.quickAction}
            />
          </View>
          <View style={styles.quickActions}>
            <Button
              title="👥 Gérer les groupes"
              onPress={() => navigation.navigate('GestionGroupes')}
              variant="outline"
              style={styles.quickAction}
            />
            <Button
              title="Messages Vocaux"
              onPress={() => navigation.navigate('VoiceMessageTest')}
              variant="outline"
              style={styles.quickAction}
            />
          </View>
        </View>

        </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 12,
    backgroundColor: '#f5f5f5',
  },
  refreshSection: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  refreshTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 12,
    textAlign: 'center',
  },
  refreshButtonContainer: {
    alignItems: 'center',
  },
  mainRefreshButton: {
    backgroundColor: '#27ae60',
    marginBottom: 8,
    minWidth: 200,
  },
  refreshInfo: {
    fontSize: 12,
    color: '#7f8c8d',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  offresContainer: {
    gap: 12,
  },
  offreCard: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  offreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  offreTitre: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    flex: 1,
  },
  offreType: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeIndividuel: {
    backgroundColor: '#3498db',
  },
  typeGroupe: {
    backgroundColor: '#f39c12',
  },
  offreTypeText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  offreDescription: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 12,
  },
  offreFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  offreTarif: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#27ae60',
  },
  editOffreButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#e74c3c',
    borderRadius: 6,
  },
  editOffreText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  inputOffre: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  textAreaOffre: {
    height: 80,
    textAlignVertical: 'top',
  },
  offreEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  tarifInput: {
    flex: 1,
  },
  typeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  typeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f8f9fa',
  },
  typeButtonActive: {
    backgroundColor: '#3498db',
    borderColor: '#3498db',
  },
  typeButtonText: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  editButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  enregistrerButton: {
    flex: 1,
    backgroundColor: '#27ae60',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  enregistrerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  annulerButton: {
    flex: 1,
    backgroundColor: '#e74c3c',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  smallInput: {
    flex: 1,
    minWidth: 100,
  },
  checkboxButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    backgroundColor: '#f8f9fa',
    marginRight: 8,
  },
  checkboxActive: {
    backgroundColor: '#3498db',
    borderColor: '#3498db',
  },
  checkboxText: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  welcomeCard: {
    marginBottom: 20,
    padding: 20,
  },
  welcomeHeader: {
    flexDirection: 'column',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
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
    backgroundColor: '#3498db',
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 40,
  },
  welcomeInfo: {
    flex: 1,
  },
  welcome: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    marginBottom: 16,
  },
  tutorInfo: {
    marginTop: 8,
  },
  tutorRole: {
    fontSize: 14,
    color: '#3498db',
    marginBottom: 4,
  },
  tutorSpecialty: {
    fontSize: 14,
    color: '#27ae60',
    marginBottom: 4,
  },
  tutorExperience: {
    fontSize: 14,
    color: '#f39c12',
    marginBottom: 4,
  },
  classementBadge: {
    backgroundColor: '#f39c12',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  classementText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  statCard: {
    width: (width - 30) / 2 - 6,
    padding: 10,
    marginBottom: 6,
    borderRadius: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statIcon: {
    fontSize: 22,
    marginRight: 8,
  },
  statTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#2c3e50',
    flex: 1,
  },
  statValue: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  statEvolution: {
    fontSize: 11,
    color: '#27ae60',
    fontWeight: '500',
  },
  // Styles pour la section des séances
  seanceCard: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  seanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  seanceSujet: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    flex: 1,
  },
  seanceStatut: {
    fontSize: 12,
    color: '#27ae60',
    backgroundColor: '#e8f8f5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontWeight: '500',
  },
  seanceDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  seanceDate: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  seanceTime: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  seanceEtudiants: {
    fontSize: 13,
    color: '#3498db',
    marginBottom: 4,
  },
  seanceLieu: {
    fontSize: 13,
    color: '#e67e22',
  },
  emptyCard: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyText: {
    fontSize: 16,
    color: '#7f8c8d',
    marginBottom: 12,
  },
  emptyAction: {
    fontSize: 14,
    color: '#3498db',
    fontWeight: '500',
  },
  seeAllText: {
    fontSize: 14,
    color: '#3498db',
    fontWeight: '500',
  },
  performanceCard: {
    padding: 20,
    borderRadius: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  performanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  performanceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  performanceNote: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f39c12',
  },
  performanceSubtext: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
    marginTop: 8,
  },
  stars: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
  },
  star: {
    fontSize: 20,
    marginHorizontal: 2,
  },
  seancesContainer: {
    gap: 8,
  },
  seanceItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  seanceTitre: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  seanceDate: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  seanceMatiere: {
    fontSize: 14,
    color: '#3498db',
    fontStyle: 'italic',
  },
  seanceStatut: {
    fontSize: 12,
    color: '#27ae60',
    fontWeight: 'bold',
    marginTop: 4,
    backgroundColor: '#f0f8f0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    textAlign: 'center',
  },
  badge: {
    backgroundColor: '#e74c3c',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    position: 'absolute',
    right: 16,
    top: 8,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  notificationText: {
    fontSize: 16,
    color: '#2c3e50',
    textAlign: 'center',
    padding: 16,
  },
  voirTout: {
    fontSize: 14,
    color: '#3498db',
    textAlign: 'center',
    marginBottom: 16,
  },
  forumContainer: {
    gap: 8,
  },
  voirPlusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3498db',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  voirPlusQuestion: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
    backgroundColor: '#f8f9fa',
    borderLeftWidth: 3,
    borderLeftColor: '#3498db',
  },
  voirPlusContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  voirPlusText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3498db',
  },
  voirPlusArrow: {
    fontSize: 18,
    color: '#3498db',
    marginLeft: 8,
  },
  voirPlusSubtext: {
    fontSize: 12,
    color: '#7f8c8d',
    fontStyle: 'italic',
  },
  questionItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  questionTitre: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  questionContenu: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 8,
  },
  questionMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  questionAuteur: {
    fontSize: 12,
    color: '#3498db',
  },
  questionReponses: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#3498db',
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  performanceActivityGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  performanceGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  compactPerformanceCard: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
  },
  compactActivityCard: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
  },
  compactCardTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 6,
    textAlign: 'center',
  },
  compactCardValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3498db',
    marginBottom: 4,
  },
  compactCardSubtext: {
    fontSize: 10,
    color: '#7f8c8d',
    textAlign: 'center',
    marginBottom: 8,
  },
  compactStars: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  compactStar: {
    fontSize: 14,
    marginHorizontal: 1,
  },
  compactCardButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginTop: 4,
  },
  compactCardButtonText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  performanceItem: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    width: (width - 30) / 3 - 8,
    marginBottom: 8,
  },
  performanceValue: {
    fontSize: 21,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  performanceLabel: {
    fontSize: 11,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  performanceTrend: {
    fontSize: 10,
    color: '#27ae60',
    fontWeight: '500',
    marginTop: 2,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  quickAction: {
    flex: 1,
    marginHorizontal: 2,
  },
  voirPlusButton: {
    marginTop: 10,
    padding: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  voirPlusText: {
    fontSize: 12,
    color: '#3498db',
    fontWeight: '500',
  },
  empty: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    padding: 20,
  },
  // Styles pour les boutons toggle on/off
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#e9ecef',
    borderRadius: 20,
    padding: 2,
  },
  toggleButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 18,
    backgroundColor: 'transparent',
    minWidth: 40,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#3498db',
  },
  toggleButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#7f8c8d',
  },
  toggleButtonTextActive: {
    color: '#fff',
  },
});

export default TutorDashboardScreen;
