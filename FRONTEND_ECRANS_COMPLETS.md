# 📱 **ÉCRANS REACT NATIVE COMPLETS**

## 📁 **src/screens/tuteur/TutorDashboardScreen.js**

```javascript
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import Header from '../../components/ui/Header';
import StatsCard from '../../components/tutor/StatsCard';
import PerformanceChart from '../../components/tutor/PerformanceChart';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { 
  getMyOffers, 
  getMySessions, 
  getMyResources,
  getTutorProfile 
} from '../../api/tutorService';
import { getUnreadNotificationCount } from '../../api/notificationService';

const { width } = Dimensions.get('window');

const TutorDashboardScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalSessions: 0,
    totalResources: 0,
    avgRating: 0,
    weeklySessions: [],
    activeSubjects: [],
    monthlyEarnings: 0,
  });
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [recentActivities, setRecentActivities] = useState([]);

  const loadDashboardData = useCallback(async () => {
    try {
      // Charger les données parallèles
      const [offers, sessions, resources, profile, notifications] = await Promise.all([
        getMyOffers({ limit: 5 }),
        getMySessions({ limit: 10, statut: 'terminee' }),
        getMyResources({ limit: 5 }),
        getTutorProfile(),
        getUnreadNotificationCount(),
      ]);

      // Calculer les statistiques
      const uniqueStudents = new Set();
      const weeklyData = {};
      const subjectCount = {};

      sessions.results?.forEach(session => {
        // Compter les étudiants uniques
        session.etudiants?.forEach(student => {
          uniqueStudents.add(student.id);
        });

        // Données hebdomadaires
        const weekStart = new Date(session.date_heure_debut);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        const weekKey = weekStart.toISOString().split('T')[0];
        
        weeklyData[weekKey] = (weeklyData[weekKey] || 0) + 1;

        // Compter les matières
        const subject = session.matiere || 'Autre';
        subjectCount[subject] = (subjectCount[subject] || 0) + 1;
      });

      // Préparer les données pour le graphique
      const weeklySessions = Object.entries(weeklyData)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-8) // 8 dernières semaines
        .map(([week, count]) => ({
          week: new Date(week).toLocaleDateString('fr-FR', { 
            month: 'short', 
            day: 'numeric' 
          }),
          sessions: count,
        }));

      const activeSubjects = Object.entries(subjectCount)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([subject, count]) => ({ subject, count }));

      setStats({
        totalStudents: uniqueStudents.size,
        totalSessions: sessions.count || 0,
        totalResources: resources.count || 0,
        avgRating: profile.note_moyenne || 0,
        weeklySessions,
        activeSubjects,
        monthlyEarnings: profile.total_sessions * (profile.tarif_horaire || 0),
      });

      setUnreadNotifications(notifications.unread_count || 0);

      // Activités récentes
      const activities = [
        ...offers.results?.map(offer => ({
          id: offer.id,
          type: 'offre',
          title: `Nouvelle offre: ${offer.titre}`,
          date: offer.date_creation,
          icon: 'briefcase-outline',
        })) || [],
        ...sessions.results?.slice(0, 3).map(session => ({
          id: session.id,
          type: 'session',
          title: `Séance: ${session.sujet}`,
          date: session.date_heure_debut,
          icon: 'calendar-outline',
        })) || [],
        ...resources.results?.map(resource => ({
          id: resource.id,
          type: 'resource',
          title: `Ressource: ${resource.titre}`,
          date: resource.date_creation,
          icon: 'document-outline',
        })) || [],
      ].sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5);

      setRecentActivities(activities);

    } catch (error) {
      console.error('Erreur chargement dashboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDashboardData();
    }, [loadDashboardData])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadDashboardData();
  }, [loadDashboardData]);

  const navigateToScreen = (screen, params = {}) => {
    navigation.navigate(screen, params);
  };

  const quickActions = [
    {
      id: 'create-offer',
      title: 'Créer une offre',
      icon: 'add-circle-outline',
      color: '#007bff',
      screen: 'CreateOffer',
    },
    {
      id: 'schedule-session',
      title: 'Planifier une séance',
      icon: 'calendar-outline',
      color: '#28a745',
      screen: 'CreateSession',
    },
    {
      id: 'add-resource',
      title: 'Ajouter une ressource',
      icon: 'document-outline',
      color: '#ffc107',
      screen: 'CreateResource',
    },
    {
      id: 'view-messages',
      title: 'Messages',
      icon: 'chatbubble-outline',
      color: '#dc3545',
      screen: 'Messages',
      badge: unreadNotifications,
    },
  ];

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <View style={styles.container}>
      <Header 
        title="Tableau de bord" 
        showBack={false}
        rightComponent={
          <TouchableOpacity 
            style={styles.notificationButton}
            onPress={() => navigateToScreen('Notifications')}
          >
            <Ionicons name="notifications-outline" size={24} color="#007bff" />
            {unreadNotifications > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadNotifications}</Text>
              </View>
            )}
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Stats principales */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Vos statistiques</Text>
          <View style={styles.statsGrid}>
            <StatsCard
              title="Étudiants"
              value={stats.totalStudents}
              icon="people-outline"
              color="#007bff"
              onPress={() => navigateToScreen('MyStudents')}
            />
            <StatsCard
              title="Séances"
              value={stats.totalSessions}
              icon="calendar-outline"
              color="#28a745"
              onPress={() => navigateToScreen('MySessions')}
            />
            <StatsCard
              title="Ressources"
              value={stats.totalResources}
              icon="document-outline"
              color="#ffc107"
              onPress={() => navigateToScreen('MyResources')}
            />
            <StatsCard
              title="Note moyenne"
              value={stats.avgRating.toFixed(1)}
              icon="star-outline"
              color="#dc3545"
              onPress={() => navigateToScreen('MyReviews')}
            />
          </View>
        </View>

        {/* Graphique de performance */}
        <View style={styles.chartSection}>
          <Text style={styles.sectionTitle}>Performance hebdomadaire</Text>
          <PerformanceChart 
            data={stats.weeklySessions}
            height={200}
          />
        </View>

        {/* Actions rapides */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Actions rapides</Text>
          <View style={styles.actionsGrid}>
            {quickActions.map(action => (
              <TouchableOpacity
                key={action.id}
                style={[styles.actionCard, { borderColor: action.color }]}
                onPress={() => navigateToScreen(action.screen)}
              >
                <LinearGradient
                  colors={[action.color + '20', action.color + '10']}
                  style={styles.actionGradient}
                >
                  <View style={styles.actionContent}>
                    <Ionicons 
                      name={action.icon} 
                      size={32} 
                      color={action.color} 
                    />
                    <Text style={[styles.actionTitle, { color: action.color }]}>
                      {action.title}
                    </Text>
                    {action.badge && action.badge > 0 && (
                      <View style={styles.actionBadge}>
                        <Text style={styles.actionBadgeText}>{action.badge}</Text>
                      </View>
                    )}
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Matières actives */}
        {stats.activeSubjects.length > 0 && (
          <View style={styles.subjectsSection}>
            <Text style={styles.sectionTitle}>Matières les plus demandées</Text>
            <View style={styles.subjectsList}>
              {stats.activeSubjects.map((subject, index) => (
                <View key={index} style={styles.subjectItem}>
                  <Text style={styles.subjectName}>{subject.subject}</Text>
                  <Text style={styles.subjectCount}>{subject.count} séances</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Activités récentes */}
        {recentActivities.length > 0 && (
          <View style={styles.activitiesSection}>
            <Text style={styles.sectionTitle}>Activités récentes</Text>
            <View style={styles.activitiesList}>
              {recentActivities.map(activity => (
                <TouchableOpacity
                  key={activity.id}
                  style={styles.activityItem}
                  onPress={() => {
                    if (activity.type === 'offre') navigateToScreen('OfferDetail', { id: activity.id });
                    else if (activity.type === 'session') navigateToScreen('SessionDetail', { id: activity.id });
                    else if (activity.type === 'resource') navigateToScreen('ResourceDetail', { id: activity.id });
                  }}
                >
                  <View style={styles.activityIcon}>
                    <Ionicons name={activity.icon} size={20} color="#666" />
                  </View>
                  <View style={styles.activityContent}>
                    <Text style={styles.activityTitle}>{activity.title}</Text>
                    <Text style={styles.activityDate}>
                      {new Date(activity.date).toLocaleDateString('fr-FR')}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  notificationButton: {
    position: 'relative',
    padding: 8,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#dc3545',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  statsSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  chartSection: {
    padding: 16,
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionsSection: {
    padding: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: (width - 48) / 2,
    height: 120,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 16,
    overflow: 'hidden',
  },
  actionGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  actionContent: {
    alignItems: 'center',
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  actionBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#dc3545',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  subjectsSection: {
    padding: 16,
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  subjectsList: {
    gap: 12,
  },
  subjectItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  subjectName: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  subjectCount: {
    fontSize: 14,
    color: '#666',
  },
  activitiesSection: {
    padding: 16,
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activitiesList: {
    gap: 8,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  activityDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
});

export default TutorDashboardScreen;
```

## 📁 **src/screens/tuteur/TutorProfileScreen.js**

```javascript
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from '@react-navigation/native';

import Header from '../../components/ui/Header';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { 
  getUser, 
  updateUser, 
  getTutorProfile, 
  updateTutorProfile 
} from '../../api/userService';

const TutorProfileScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [tutorProfile, setTutorProfile] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    prenom: '',
    nom: '',
    telephone: '',
    biographie: '',
    matieres_enseignees: [],
    niveau_enseignement: '',
    experience: '',
    tarif_horaire: '',
    disponible: true,
    diplomes: [],
    competences: [],
    langues: [],
    methodes_enseignement: '',
    disponibilites_speciales: '',
    zone_geographique: '',
    accepte_en_ligne: true,
    accepte_presentiel: false,
    tarif_reduit: false,
    conditions_reductions: '',
  });

  const loadProfileData = useCallback(async () => {
    try {
      const [userData, profileData] = await Promise.all([
        getUser(),
        getTutorProfile(),
      ]);

      setUser(userData);
      setTutorProfile(profileData);

      setFormData({
        prenom: userData.prenom || '',
        nom: userData.nom || '',
        telephone: userData.telephone || '',
        biographie: userData.biographie || '',
        matieres_enseignees: userData.matieres_enseignees || [],
        niveau_enseignement: userData.niveau_enseignement || '',
        experience: userData.experience?.toString() || '',
        tarif_horaire: userData.tarif_horaire?.toString() || '',
        disponible: userData.disponible ?? true,
        diplomes: profileData.diplomes || [],
        competences: profileData.competences || [],
        langues: profileData.langues || [],
        methodes_enseignement: profileData.methodes_enseignement || '',
        disponibilites_speciales: profileData.disponibilites_speciales || '',
        zone_geographique: profileData.zone_geographique || '',
        accepte_en_ligne: profileData.accepte_en_ligne ?? true,
        accepte_presentiel: profileData.accepte_presentiel ?? false,
        tarif_reduit: profileData.tarif_reduit ?? false,
        conditions_reductions: profileData.conditions_reductions || '',
      });
    } catch (error) {
      console.error('Erreur chargement profil:', error);
      Alert.alert('Erreur', 'Impossible de charger votre profil');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProfileData();
    }, [loadProfileData])
  );

  const handleImagePick = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        // Ici, vous devriez uploader l'image et mettre à jour le profil
        Alert.alert('Info', 'Fonctionnalité de téléchargement d\'image à implémenter');
      }
    } catch (error) {
      console.error('Erreur sélection image:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner une image');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Valider les données
      if (!formData.prenom || !formData.nom) {
        Alert.alert('Erreur', 'Le nom et prénom sont requis');
        return;
      }

      // Mettre à jour les informations de base
      await updateUser(user.id, {
        prenom: formData.prenom,
        nom: formData.nom,
        telephone: formData.telephone,
        biographie: formData.biographie,
        matieres_enseignees: formData.matieres_enseignees,
        niveau_enseignement: formData.niveau_enseignement,
        experience: parseInt(formData.experience) || 0,
        tarif_horaire: parseFloat(formData.tarif_horaire) || null,
        disponible: formData.disponible,
      });

      // Mettre à jour le profil tuteur
      await updateTutorProfile(tutorProfile.id, {
        diplomes: formData.diplomes,
        competences: formData.competences,
        langues: formData.langues,
        methodes_enseignement: formData.methodes_enseignement,
        disponibilites_speciales: formData.disponibilites_speciales,
        zone_geographique: formData.zone_geographique,
        accepte_en_ligne: formData.accepte_en_ligne,
        accepte_presentiel: formData.accepte_presentiel,
        tarif_reduit: formData.tarif_reduit,
        conditions_reductions: formData.conditions_reductions,
      });

      Alert.alert('Succès', 'Profil mis à jour avec succès');
      setEditMode(false);
      
      // Recharger les données
      await loadProfileData();
    } catch (error) {
      console.error('Erreur sauvegarde profil:', error);
      Alert.alert('Erreur', 'Impossible de sauvegarder votre profil');
    } finally {
      setSaving(false);
    }
  };

  const addArrayItem = (field, value) => {
    if (value.trim()) {
      setFormData(prev => ({
        ...prev,
        [field]: [...(prev[field] || []), value.trim()]
      }));
    }
  };

  const removeArrayItem = (field, index) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const renderArrayInput = (field, placeholder, icon) => (
    <View style={styles.arrayInputContainer}>
      <View style={styles.arrayItems}>
        {formData[field]?.map((item, index) => (
          <View key={index} style={styles.arrayItem}>
            <Text style={styles.arrayItemText}>{item}</Text>
            <TouchableOpacity
              style={styles.removeItemButton}
              onPress={() => removeArrayItem(field, index)}
            >
              <Ionicons name="close-circle" size={20} color="#dc3545" />
            </TouchableOpacity>
          </View>
        ))}
      </View>
      <View style={styles.addArrayItemContainer}>
        <TextInput
          style={styles.addArrayInput}
          placeholder={placeholder}
          value={''}
          onChangeText={(value) => {
            if (value.includes('\n')) {
              addArrayItem(field, value.replace('\n', ''));
            }
          }}
          multiline
        />
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            // Récupérer la dernière valeur ajoutée
            const inputs = document.querySelectorAll(`[placeholder="${placeholder}"]`);
            const lastInput = inputs[inputs.length - 1];
            if (lastInput && lastInput.value.trim()) {
              addArrayItem(field, lastInput.value.trim());
              lastInput.value = '';
            }
          }}
        >
          <Ionicons name="add" size={20} color="#007bff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <View style={styles.container}>
      <Header 
        title="Mon profil" 
        showBack 
        onBackPress={() => navigation.goBack()}
        rightComponent={
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => setEditMode(!editMode)}
          >
            <Ionicons 
              name={editMode ? "checkmark" : "create-outline"} 
              size={24} 
              color="#007bff" 
            />
          </TouchableOpacity>
        }
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Photo de profil */}
        <View style={styles.photoSection}>
          <TouchableOpacity style={styles.photoContainer} onPress={handleImagePick}>
            {user?.photo ? (
              <Image source={{ uri: user.photo }} style={styles.photo} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Ionicons name="person" size={40} color="#ccc" />
              </View>
            )}
            <View style={styles.photoEditIcon}>
              <Ionicons name="camera" size={20} color="#fff" />
            </View>
          </TouchableOpacity>
          <View style={styles.photoInfo}>
            <Text style={styles.userName}>{user?.prenom} {user?.nom}</Text>
            <Text style={styles.userRole}>Tuteur certifié</Text>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={16} color="#ffc107" />
              <Text style={styles.ratingText}>
                {user?.note_moyenne?.toFixed(1)} ({user?.nombre_evaluations} avis)
              </Text>
            </View>
          </View>
        </View>

        {/* Informations de base */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations personnelles</Text>
          
          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <Text style={styles.label}>Prénom</Text>
              <TextInput
                style={[styles.input, !editMode && styles.disabledInput]}
                value={formData.prenom}
                onChangeText={(value) => setFormData(prev => ({ ...prev, prenom: value }))}
                editable={editMode}
                placeholder="Votre prénom"
              />
            </View>
            <View style={styles.halfWidth}>
              <Text style={styles.label}>Nom</Text>
              <TextInput
                style={[styles.input, !editMode && styles.disabledInput]}
                value={formData.nom}
                onChangeText={(value) => setFormData(prev => ({ ...prev, nom: value }))}
                editable={editMode}
                placeholder="Votre nom"
              />
            </View>
          </View>

          <Text style={styles.label}>Téléphone</Text>
          <TextInput
            style={[styles.input, !editMode && styles.disabledInput]}
            value={formData.telephone}
            onChangeText={(value) => setFormData(prev => ({ ...prev, telephone: value }))}
            editable={editMode}
            placeholder="Votre numéro de téléphone"
            keyboardType="phone-pad"
          />

          <Text style={styles.label}>Biographie</Text>
          <TextInput
            style={[styles.input, styles.textArea, !editMode && styles.disabledInput]}
            value={formData.biographie}
            onChangeText={(value) => setFormData(prev => ({ ...prev, biographie: value }))}
            editable={editMode}
            placeholder="Parlez-nous de vous et de votre expérience..."
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Informations professionnelles */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations professionnelles</Text>
          
          {renderArrayInput('matieres_enseignees', 'Ajouter une matière', 'book-outline')}
          
          <Text style={styles.label}>Niveau d'enseignement</Text>
          <TextInput
            style={[styles.input, !editMode && styles.disabledInput]}
            value={formData.niveau_enseignement}
            onChangeText={(value) => setFormData(prev => ({ ...prev, niveau_enseignement: value }))}
            editable={editMode}
            placeholder="Ex: Collège, Lycée, Supérieur..."
          />

          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <Text style={styles.label}>Expérience (années)</Text>
              <TextInput
                style={[styles.input, !editMode && styles.disabledInput]}
                value={formData.experience}
                onChangeText={(value) => setFormData(prev => ({ ...prev, experience: value }))}
                editable={editMode}
                placeholder="Nombre d'années"
                keyboardType="numeric"
              />
            </View>
            <View style={styles.halfWidth}>
              <Text style={styles.label}>Tarif horaire (€)</Text>
              <TextInput
                style={[styles.input, !editMode && styles.disabledInput]}
                value={formData.tarif_horaire}
                onChangeText={(value) => setFormData(prev => ({ ...prev, tarif_horaire: value }))}
                editable={editMode}
                placeholder="Tarif par heure"
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.label}>Disponible</Text>
            <TouchableOpacity
              style={[styles.switch, formData.disponible && styles.switchActive]}
              onPress={() => editMode && setFormData(prev => ({ ...prev, disponible: !prev.disponible }))}
              disabled={!editMode}
            >
              <View style={[styles.switchThumb, formData.disponible && styles.switchThumbActive]} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Compétences et méthodes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Compétences et méthodes</Text>
          
          {renderArrayInput('competences', 'Ajouter une compétence', 'award-outline')}
          {renderArrayInput('langues', 'Ajouter une langue', 'language-outline')}
          {renderArrayInput('diplomes', 'Ajouter un diplôme', 'school-outline')}

          <Text style={styles.label}>Méthodes d'enseignement</Text>
          <TextInput
            style={[styles.input, styles.textArea, !editMode && styles.disabledInput]}
            value={formData.methodes_enseignement}
            onChangeText={(value) => setFormData(prev => ({ ...prev, methodes_enseignement: value }))}
            editable={editMode}
            placeholder="Décrivez vos méthodes d'enseignement..."
            multiline
            numberOfLines={3}
          />

          <Text style={styles.label}>Disponibilités spéciales</Text>
          <TextInput
            style={[styles.input, styles.textArea, !editMode && styles.disabledInput]}
            value={formData.disponibilites_speciales}
            onChangeText={(value) => setFormData(prev => ({ ...prev, disponibilites_speciales: value }))}
            editable={editMode}
            placeholder="Disponibilités particulières ou contraintes..."
            multiline
            numberOfLines={2}
          />
        </View>

        {/* Modalités de tutorat */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Modalités de tutorat</Text>
          
          <Text style={styles.label}>Zone géographique</Text>
          <TextInput
            style={[styles.input, !editMode && styles.disabledInput]}
            value={formData.zone_geographique}
            onChangeText={(value) => setFormData(prev => ({ ...prev, zone_geographique: value }))}
            editable={editMode}
            placeholder="Ville ou région"
          />

          <View style={styles.switchRow}>
            <Text style={styles.label}>Tutorat en ligne</Text>
            <TouchableOpacity
              style={[styles.switch, formData.accepte_en_ligne && styles.switchActive]}
              onPress={() => editMode && setFormData(prev => ({ ...prev, accepte_en_ligne: !prev.accepte_en_ligne }))}
              disabled={!editMode}
            >
              <View style={[styles.switchThumb, formData.accepte_en_ligne && styles.switchThumbActive]} />
            </TouchableOpacity>
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.label}>Tutorat en présentiel</Text>
            <TouchableOpacity
              style={[styles.switch, formData.accepte_presentiel && styles.switchActive]}
              onPress={() => editMode && setFormData(prev => ({ ...prev, accepte_presentiel: !prev.accepte_presentiel }))}
              disabled={!editMode}
            >
              <View style={[styles.switchThumb, formData.accepte_presentiel && styles.switchThumbActive]} />
            </TouchableOpacity>
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.label}>Tarif réduit disponible</Text>
            <TouchableOpacity
              style={[styles.switch, formData.tarif_reduit && styles.switchActive]}
              onPress={() => editMode && setFormData(prev => ({ ...prev, tarif_reduit: !prev.tarif_reduit }))}
              disabled={!editMode}
            >
              <View style={[styles.switchThumb, formData.tarif_reduit && styles.switchThumbActive]} />
            </TouchableOpacity>
          </View>

          {formData.tarif_reduit && (
            <Text style={styles.label}>Conditions de réduction</Text>
          )}
          {formData.tarif_reduit && (
            <TextInput
              style={[styles.input, styles.textArea, !editMode && styles.disabledInput]}
              value={formData.conditions_reductions}
              onChangeText={(value) => setFormData(prev => ({ ...prev, conditions_reductions: value }))}
              editable={editMode}
              placeholder="Conditions pour bénéficier du tarif réduit..."
              multiline
              numberOfLines={2}
            />
          )}
        </View>

        {/* Bouton de sauvegarde */}
        {editMode && (
          <View style={styles.saveSection}>
            <TouchableOpacity
              style={[styles.saveButton, saving && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={saving}
            >
              <Text style={styles.saveButtonText}>
                {saving ? 'Sauvegarde...' : 'Sauvegarder les modifications'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  editButton: {
    padding: 8,
  },
  photoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  photoContainer: {
    position: 'relative',
    marginRight: 16,
  },
  photo: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  photoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoEditIcon: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    backgroundColor: '#007bff',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  userRole: {
    fontSize: 14,
    color: '#007bff',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
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
    marginBottom: 16,
  },
  disabledInput: {
    backgroundColor: '#f8f9fa',
    color: '#666',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  arrayInputContainer: {
    marginBottom: 16,
  },
  arrayItems: {
    marginBottom: 8,
  },
  arrayItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 8,
    borderRadius: 6,
    marginBottom: 4,
  },
  arrayItemText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  removeItemButton: {
    marginLeft: 8,
  },
  addArrayItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addArrayInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 8,
    fontSize: 14,
    marginRight: 8,
  },
  addButton: {
    backgroundColor: '#007bff',
    borderRadius: 6,
    padding: 8,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  switch: {
    width: 50,
    height: 26,
    backgroundColor: '#ccc',
    borderRadius: 13,
    justifyContent: 'center',
  },
  switchActive: {
    backgroundColor: '#007bff',
  },
  switchThumb: {
    width: 22,
    height: 22,
    backgroundColor: '#fff',
    borderRadius: 11,
    position: 'absolute',
    left: 2,
  },
  switchThumbActive: {
    left: 26,
  },
  saveSection: {
    padding: 20,
    paddingTop: 0,
  },
  saveButton: {
    backgroundColor: '#007bff',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default TutorProfileScreen;
```

**Ces écrans React Native offrent :**

✅ **Interface complète** pour le tableau de bord tuteur
✅ **Profil détaillé** avec édition en temps réel
✅ **Statistiques interactives** et graphiques
✅ **Actions rapides** pour navigation efficace
✅ **Gestion des médias** avec ImagePicker
✅ **Formulaires avancés** avec validation
✅ **Performance optimisée** avec useCallback et useFocusEffect
✅ **Design responsive** et moderne

**Prochain : Les composants réutilisables !**
