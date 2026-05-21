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
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  
  // États pour le tableau de bord complet - initialisé avec des valeurs vides
  const [dashboardData, setDashboardData] = useState({
    // Statistiques principales - sera rempli par l'API
    statistiquesPrincipales: {
      nombreSeancesSuivies: 0,
      heuresEtudeTotales: 0,
      ressourcesConsultees: 0,
      questionsPosees: 0,
      reponsesRecues: 0,
      noteMoyenneTuteurs: 0,
      matieresSuivies: [],
      badgesObtenus: []
    },
    // Progression académique - sera calculée à partir des vraies données
    progression: {
      objectifSemestre: 80, // Objectif de 80% pour le semestre
      progressionSemestre: 0,
      progressionGlobale: 0,
      tempsEtude: 0,
      tempsEtudeObjectif: 60, // Objectif de 60h d'étude par semestre
      seancesReussies: 0,
      seancesTotales: 0,
      evolutionParMatiere: {}
    },
    // Statistiques d'activité - sera rempli par l'API
    statistiques: {
      total_seances: 0,
      evolutionSeances: '',
      total_ressources: 0,
      evolutionRessources: '',
      total_questions: 0,
      evolutionQuestions: '',
      total_evaluations: 0,
      evolutionEvaluations: '',
      pointsFidelite: 0,
      niveauFidelite: '',
      streakActif: 0,
      streakNiveau: ''
    },
    // Activités récentes - sera rempli par l'API
    activitesRecentes: {
      prochainesSeances: [],
      dernieresRessourcesConsultees: [],
      dernieresQuestions: [],
      reponsesNonLues: []
    },
    seances_a_venir: [],
    recommandations: {
      tuteurRecommande: null,
      ressourceSuggeree: null,
      groupeSuggere: null,
      objectifsApprentissage: []
    },
    forumActivite: {
      questionRecente: null,
      reponsesRecues: 0,
      badgeObtenu: null,
      questionsRepondues: 0,
      moyenneReponses: 0
    },
    ressourcesRecentes: [],
    notifications: [],
    annoncesNonLues: [],
    objectifsApprentissage: []
  });

  // Chargement initial des données (sans actualisation automatique)
  useEffect(() => {
    loadDashboardData();
    loadProfileImage();
  }, []);

  // Rafraîchir les activités récentes lorsque l'écran redevient focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', async () => {
      console.log('🔄 Écran focus - Rafraîchissement des activités récentes');
      try {
        const token = await AsyncStorage.getItem('access_token');
        if (token) {
          await loadActivitesRecentes(token);
        }
      } catch (error) {
        console.error('Erreur lors du rafraîchissement des activités récentes:', error);
      }
    });

    return unsubscribe;
  }, [navigation]);

  // Écouter le trigger de rafraîchissement depuis d'autres écrans
  useEffect(() => {
    let interval;
    
    const checkRefreshTrigger = async () => {
      try {
        // Utiliser les clés spécifiques à l'utilisateur
        const triggerKey = `user_${user?.id}_dashboard_refresh_trigger`;
        const lastTriggerKey = `user_${user?.id}_last_processed_trigger`;
        
        const trigger = await AsyncStorage.getItem(triggerKey);
        const lastProcessedTrigger = await AsyncStorage.getItem(lastTriggerKey);
        
        console.log('🔄 Vérification trigger:', { triggerKey, lastTriggerKey, trigger, lastProcessedTrigger });
        
        if (trigger && trigger !== lastProcessedTrigger) {
          console.log('🔄 NOUVEAU Trigger détecté - Rafraîchissement automatique des activités');
          
          // Mettre à jour directement les consultations locales (sans token)
          try {
            // Utiliser les clés spécifiques à l'utilisateur
            const interactionsKey = `user_${user?.id}_ressources_interactions`;
            const lastTriggerKey = `user_${user?.id}_last_processed_trigger`;
            
            console.log('🔄 Clés de rafraîchissement:', { interactionsKey, lastTriggerKey });
            
            // Utiliser le système unifié d'interactions
            const interactionsStockees = await AsyncStorage.getItem(interactionsKey) || '[]';
            const interactions = JSON.parse(interactionsStockees);
            
            let ressourcesFormatees = [];
            let nombreRessourcesConsultees = 0;
            
            if (Array.isArray(interactions) && interactions.length > 0) {
              console.log('📚 Interactions trouvées pour rafraîchissement auto:', interactions.length);
              
              // Utiliser les interactions pour les activités récentes
              ressourcesFormatees = interactions.slice(0, 3).map((interaction, index) => {
                return {
                  id: interaction.ressource_id,
                  titre: interaction.titre || 'Ressource consultée',
                  type: interaction.type === 'telechargement' ? 'téléchargée récemment' : 'consultée récemment',
                  date_consultation: interaction.date_interaction
                };
              });
              
              // Calculer le nombre de ressources uniques (toutes interactions)
              const ressourcesUniques = new Set(
                interactions.map(i => i.ressource_id)
              );
              nombreRessourcesConsultees = ressourcesUniques.size;
              console.log('📚 Nombre de ressources uniques (auto, interactions):', nombreRessourcesConsultees);
            } else {
              // Fallback : utiliser les consultations si pas d'interactions
              const consultationsStockees = await AsyncStorage.getItem('consultations_ressources') || '[]';
              const consultations = JSON.parse(consultationsStockees);
              
              if (Array.isArray(consultations) && consultations.length > 0) {
                console.log('📚 Utilisation des consultations en fallback pour rafraîchissement auto');
                
                ressourcesFormatees = consultations.slice(0, 3).map((consultation, index) => {
                  return {
                    id: consultation.ressource_id,
                    titre: consultation.titre || 'Ressource consultée',
                    type: 'consultée récemment',
                    date_consultation: consultation.date_consultation
                  };
                });
                
                const ressourcesUniques = new Set(
                  consultations.map(c => c.ressource_id)
                );
                nombreRessourcesConsultees = ressourcesUniques.size;
                console.log('📚 Nombre de ressources uniques (auto, fallback):', nombreRessourcesConsultees);
              }
            }
            
            console.log('📚 Activités mises à jour localement:', ressourcesFormatees.length);
              
              setDashboardData(prev => ({
                ...prev,
                activitesRecentes: {
                  ...prev.activitesRecentes,
                  dernieresRessourcesConsultees: ressourcesFormatees
                },
                statistiquesPrincipales: {
                  ...prev.statistiquesPrincipales,
                  ressourcesConsultees: nombreRessourcesConsultees
                }
              }));
          } catch (localError) {
            console.error('📚 Erreur mise à jour locale:', localError);
          }
          
          // Marquer le trigger comme traité
          await AsyncStorage.setItem(lastTriggerKey, trigger);
        }
      } catch (error) {
        console.error('Erreur vérification trigger:', error);
      }
    };

    // Vérifier toutes les secondes
    interval = setInterval(checkRefreshTrigger, 1000);

    return () => clearInterval(interval);
  }, []);

  // Rendre la fonction disponible globalement pour les autres écrans
  useEffect(() => {
    // Mettre la fonction en cache pour qu'elle soit accessible depuis d'autres écrans
    if (navigation && navigation.setParams) {
      navigation.setParams({
        enregistrerConsultation: enregistrerConsultationRessource
      });
    }
  }, [navigation]);

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
      
      // Charger les statistiques principales
      await loadStatistiquesPrincipales(token);
      
      // Charger les activités récentes
      await loadActivitesRecentes(token);
      
      // Charger les notifications et annonces
      await loadNotificationsEtAnnonces(token);
      
      // Charger les séances à venir
      await loadSeancesAVenir();
      
      // Charger les recommandations
      await loadRecommandations();
      
      // Charger l'activité forum
      await loadForumActivite();
      
      // Charger les badges et objectifs
      await loadBadgesEtObjectifs(token);
      
    } catch (error) {
      console.error('Erreur chargement dashboard:', error);
      Alert.alert('Erreur', 'Impossible de charger vos informations');
    } finally {
      setLoading(false);
    }
  };

  // Charger les statistiques principales avec calcul de progression réelle
  const loadStatistiquesPrincipales = async (token) => {
    try {
      // Mettre à jour automatiquement les séances expirées
      try {
        const updateResponse = await fetch(`${API_BASE_URL}/api/tutorat/seances/mettre-a-jour-expirees/`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (updateResponse.ok) {
          const updateData = await updateResponse.json();
          if (updateData.nombre_seances_mises_a_jour > 0) {
            console.log(`🔄 ${updateData.nombre_seances_mises_a_jour} séances marquées comme terminées`);
          }
        }
      } catch (error) {
        console.warn('⚠️ Erreur mise à jour séances expirées:', error);
      }

      // Statistiques des séances - NOUVEL ENDPOINT FONCTIONNEL
      const seancesResponse = await fetch(`${API_BASE_URL}/api/tutorat/seances/statistiques/etudiant/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      // Statistiques des ressources - utilisera des données factices pour l'instant
      const ressourcesResponse = await fetch(`${API_BASE_URL}/api/ressources/statistiques/etudiant/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      }).catch(() => ({ ok: false }));
      
      // Statistiques du forum - utilisera des données factices pour l'instant
      const forumResponse = await fetch(`${API_BASE_URL}/api/forum/statistiques/etudiant/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      }).catch(() => ({ ok: false }));
      
      // Évaluations des tuteurs - utilisera des données factices pour l'instant
      const evalResponse = await fetch(`${API_BASE_URL}/api/tutorat/evaluations/moyenne/etudiant/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      }).catch(() => ({ ok: false }));
      
      let statistiquesPrincipales = {
        nombreSeancesSuivies: 0,
        heuresEtudeTotales: 0,
        ressourcesConsultees: 0,
        questionsPosees: 0,
        reponsesRecues: 0,
        noteMoyenneTuteurs: 0,
        matieresSuivies: [],
        badgesObtenus: []
      };
      
      // Utiliser les vraies données des séances
      if (seancesResponse && seancesResponse.ok) {
        const seancesData = await seancesResponse.json();
        console.log('Statistiques séances réelles:', seancesData);
        console.log('📊 Heures d\'étude reçues:', seancesData.temps_etude, 'minutes');
        
        statistiquesPrincipales.nombreSeancesSuivies = seancesData.nombre_seances_suivies || 0;
        statistiquesPrincipales.heuresEtudeTotales = seancesData.temps_etude || 0; // en minutes
        statistiquesPrincipales.noteMoyenneTuteurs = seancesData.note_moyenne_tuteurs || 0;
        statistiquesPrincipales.matieresSuivies = seancesData.matieres_suivies || [];
        statistiquesPrincipales.badgesObtenus = []; // Sera implémenté plus tard
      } else {
        console.warn('Erreur chargement statistiques séances:', seancesResponse?.status);
      }
      
      console.log('Statistiques principales chargées:', statistiquesPrincipales);
      console.log('📊 Heures d\'étude après chargement:', statistiquesPrincipales.heuresEtudeTotales, 'minutes =', Math.round(statistiquesPrincipales.heuresEtudeTotales / 60 * 10) / 10, 'heures');
      
      // Mettre à jour l'état avec les nouvelles données
      setDashboardData(prev => ({
        ...prev,
        statistiquesPrincipales,
        progression: {
          ...prev.progression,
          seancesTotales: statistiquesPrincipales.nombreSeancesSuivies,
          tempsEtude: statistiquesPrincipales.heuresEtudeTotales,
          seancesReussies: statistiquesPrincipales.nombreSeancesSuivies
        }
      }));
      
      let progressionData = {
        objectifSemestre: 80, // Objectif de 80% pour le semestre
        progressionSemestre: 0,
        progressionGlobale: 0,
        tempsEtude: 0,
        tempsEtudeObjectif: 60, // Objectif de 60h d'étude par semestre
        seancesReussies: 0,
        seancesTotales: 0,
        evolutionParMatiere: {}
      };
      
      // Utiliser les données déjà chargées pour la progression
      if (seancesResponse && seancesResponse.ok) {
        // Utiliser statistiquesPrincipales qui contient déjà les données
        progressionData.seancesReussies = statistiquesPrincipales.nombreSeancesSuivies;
        progressionData.seancesTotales = statistiquesPrincipales.nombreSeancesSuivies;
        progressionData.tempsEtude = statistiquesPrincipales.heuresEtudeTotales;
        
        // Calcul de la progression du semestre (basé sur les séances suivies)
        const objectifSeancesSemestre = 12; // Objectif de 12 séances par semestre
        progressionData.progressionSemestre = Math.min((progressionData.seancesReussies / objectifSeancesSemestre) * 100, 100);
        
        // Calcul de la progression globale (basé sur les séances totales)
        const objectifSeancesGlobales = 24; // Objectif de 24 séances sur l'année
        progressionData.progressionGlobale = Math.min((progressionData.seancesReussies / objectifSeancesGlobales) * 100, 100);
      }
      
      // Mettre à jour l'état avec les données de progression calculées
      setDashboardData(prev => ({
        ...prev,
        progression: {
          ...prev.progression,
          objectifSemestre: progressionData.objectifSemestre,
          progressionSemestre: progressionData.progressionSemestre,
          progressionGlobale: progressionData.progressionGlobale,
          tempsEtude: progressionData.tempsEtude,
          tempsEtudeObjectif: progressionData.tempsEtudeObjectif,
          seancesReussies: progressionData.seancesReussies,
          seancesTotales: progressionData.seancesTotales,
          evolutionParMatiere: progressionData.evolutionParMatiere
        }
      }));
      
      console.log('Progression calculée:', progressionData);
      
    } catch (error) {
      console.error('Erreur chargement statistiques principales:', error);
    }
  };

  // Charger les activités récentes avec vraies données
  // Enregistrer une consultation de ressource
  const enregistrerConsultationRessource = async (ressourceId, titre) => {
    console.log('📚 Début enregistrerConsultationRessource:', { ressourceId, titre });
    try {
      const token = await AsyncStorage.getItem('access_token');
      console.log('📚 Token trouvé:', !!token);

      const consultationData = {
        ressource_id: ressourceId,
        titre: titre,
        date_consultation: new Date().toISOString()
      };
      console.log('📚 Données consultation:', consultationData);

      // Stocker localement pour un accès immédiat (même sans token)
      const consultationsStockees = await AsyncStorage.getItem('consultations_ressources') || '[]';
      console.log('📚 Consultations stockées avant:', consultationsStockees);
      const consultations = JSON.parse(consultationsStockees);
      
      // Ajouter la nouvelle consultation au début
      consultations.unshift(consultationData);
      
      // Garder seulement les 10 plus récentes
      const consultationsRecentes = consultations.slice(0, 10);
      
      await AsyncStorage.setItem('consultations_ressources', JSON.stringify(consultationsRecentes));
      console.log('📚 Consultation enregistrée localement:', consultationData);
      console.log('📚 Consultations après enregistrement:', consultationsRecentes);
      
      // Rafraîchir les activités récentes (seulement si token disponible)
      if (token) {
        console.log('📚 Appel de loadActivitesRecentes...');
        await loadActivitesRecentes(token);
        console.log('📚 loadActivitesRecentes terminé');
      } else {
        console.log('📚 Pas de token, pas de rafraîchissement des activités');
      }
      
    } catch (error) {
      console.error('📚 Erreur lors de l\'enregistrement de la consultation:', error);
    }
  };

  const loadActivitesRecentes = async (token) => {
    try {
      // Créer un objet pour stocker les activités récentes
      const activitesRecentes = {
        prochainesSeances: [],
        dernieresRessourcesConsultees: [],
        dernieresQuestions: [],
        reponsesNonLues: []
      };

      // Prochaines séances - NOUVEL ENDPOINT FONCTIONNEL
      const seancesResponse = await fetch(`${API_BASE_URL}/api/tutorat/seances/avenir/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      // Dernières ressources consultées - avec gestion d'erreur détaillée
      let ressourcesResponse;
      try {
        ressourcesResponse = await fetch(`${API_BASE_URL}/api/ressources/consultations/recentes/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log('📚 Ressources response status:', ressourcesResponse.status);
      } catch (error) {
        console.error('❌ Erreur ressources:', error);
        ressourcesResponse = { ok: false, status: 0, error: error.message };
      }
      
      // Dernières questions posées - avec gestion d'erreur détaillée
      let questionsResponse;
      try {
        questionsResponse = await fetch(`${API_BASE_URL}/api/forum/questions/recentes/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log('❓ Questions response status:', questionsResponse.status);
      } catch (error) {
        console.error('❌ Erreur questions:', error);
        questionsResponse = { ok: false, status: 0, error: error.message };
      }
      
      // Réponses non lues - avec gestion d'erreur détaillée
      let reponsesResponse;
      try {
        reponsesResponse = await fetch(`${API_BASE_URL}/api/forum/reponses/non_lues/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log('💡 Réponses response status:', reponsesResponse.status);
      } catch (error) {
        console.error('❌ Erreur réponses:', error);
        reponsesResponse = { ok: false, status: 0, error: error.message };
      }
      
      // Gestion des ressources avec diagnostic
      if (ressourcesResponse.ok) {
        const ressourcesData = await ressourcesResponse.json();
        console.log('📚 Ressources data:', ressourcesData);
        // S'assurer que c'est un tableau
        activitesRecentes.dernieresRessourcesConsultees = Array.isArray(ressourcesData) ? ressourcesData : [];
      } else {
        console.log('📚 Ressources failed, status:', ressourcesResponse.status);
        // Essayer un endpoint alternatif
        try {
          const altResponse = await fetch(`${API_BASE_URL}/api/ressources/`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (altResponse.ok) {
            const allRessources = await altResponse.json();
            console.log('📚 All ressources type:', typeof allRessources, Array.isArray(allRessources));
            console.log('📚 All ressources structure:', JSON.stringify(allRessources, null, 2));
            
            // S'assurer que c'est un tableau avant d'utiliser slice
            const ressourcesArray = Array.isArray(allRessources) ? allRessources : 
                              (allRessources && allRessources.results && Array.isArray(allRessources.results)) ? allRessources.results : 
                              (allRessources && Array.isArray(allRessources.data)) ? allRessources.data : [];
            
            // Prendre les 3 plus récentes avec gestion robuste des données
            console.log('📚 RessourcesArray avant mapping:', ressourcesArray.length, ressourcesArray.slice(0, 3));
            
            let ressourcesFormatees = [];
            
            // Si l'API ressources retourne des données, les utiliser
            if (ressourcesArray.length > 0) {
              ressourcesFormatees = ressourcesArray
                .filter(r => r && (r.titre || r.nom || r.intitule)) // Filtrer les ressources valides
                .slice(0, 3)
                .map((r, index) => {
                  console.log(`📚 Ressource ${index}:`, {
                    id: r.id,
                    titre: r.titre,
                    nom: r.nom,
                    intitule: r.intitule,
                    type: r.type,
                    categorie: r.categorie,
                    date_creation: r.date_creation,
                    date_ajout: r.date_ajout,
                    created_at: r.created_at,
                    updated_at: r.updated_at
                  });
                  
                  return {
                    id: r.id,
                    titre: r.titre || r.nom || r.intitule || 'Ressource sans titre',
                    type: r.type || r.categorie || 'document',
                    date_consultation: r.date_creation || r.date_ajout || r.created_at || new Date().toISOString()
                  };
                });
            } else {
              // Alternative 1: Utiliser les consultations stockées localement (source principale)
              console.log('📚 Utilisation des consultations stockées localement');
              try {
                const consultationsKey = `user_${user?.id}_consultations_ressources`;
                const consultationsStockees = await AsyncStorage.getItem(consultationsKey) || '[]';
                const consultations = JSON.parse(consultationsStockees);
                console.log('📚 Consultations trouvées dans AsyncStorage:', consultations);
                
                if (Array.isArray(consultations) && consultations.length > 0) {
                  ressourcesFormatees = consultations.slice(0, 3).map((consultation, index) => {
                    console.log(`📚 Traitement consultation ${index}:`, consultation);
                    return {
                      id: consultation.ressource_id,
                      titre: consultation.titre || 'Ressource consultée',
                      type: 'consultée récemment',
                      date_consultation: consultation.date_consultation
                    };
                  });
                  console.log('📚 Ressources depuis consultations locales:', ressourcesFormatees.length);
                } else {
                  console.log('📚 Aucune consultation locale trouvée');
                }
              } catch (error) {
                console.log('📚 Erreur consultations locales:', error);
              }
              
              // Alternative 2: Si pas de consultations locales, essayer l'API
              if (ressourcesFormatees.length === 0) {
                console.log('📚 Tentative de récupération des consultations réelles via API');
                try {
                  const consultationsResponse = await fetch(`${API_BASE_URL}/api/ressources/consultations/recentes/`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                  });
                  
                  if (consultationsResponse.ok) {
                    const consultationsData = await consultationsResponse.json();
                    console.log('📚 Consultations API data:', consultationsData);
                    
                    if (Array.isArray(consultationsData) && consultationsData.length > 0) {
                      ressourcesFormatees = consultationsData.slice(0, 3).map((consultation, index) => ({
                        id: consultation.ressource?.id || consultation.id,
                        titre: consultation.ressource?.titre || consultation.ressource?.nom || 'Ressource consultée',
                        type: consultation.ressource?.type || 'consultée',
                        date_consultation: consultation.date_consultation || consultation.created_at
                      }));
                      console.log('📚 Ressources depuis consultations API:', ressourcesFormatees.length);
                    }
                  }
                } catch (error) {
                  console.log('📚 Erreur consultations API:', error);
                }
              }
              
              // Alternative 3: Si toujours pas de consultations, utiliser les notifications de ressources partagées
              if (ressourcesFormatees.length === 0) {
                console.log('📚 Utilisation des notifications comme source alternative');
                try {
                  const notificationsResponse = await fetch(`${API_BASE_URL}/api/notifications/non_lues/`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                  });
                  
                  if (notificationsResponse.ok) {
                    const notificationsData = await notificationsResponse.json();
                    const ressourcesNotifications = notificationsData.results?.filter(n => 
                      n.type === 'ressource_partagee' && n.message && n.message.includes('vous a partagé la ressource')
                    ) || [];
                    
                    ressourcesFormatees = ressourcesNotifications.slice(0, 3).map((notification, index) => {
                      // Vérifier que la notification n'est pas nulle
                      if (!notification) {
                        console.log(`📚 Notification ${index} est nulle, ignorée`);
                        return null;
                      }
                      
                      // Extraire le titre de la ressource depuis le message
                      const titreMatch = notification.message?.match(/la ressource \"([^\"]+)\"/);
                      const titre = titreMatch ? titreMatch[1] : 'Ressource partagée';
                      
                      // Extraire l'ID de la ressource depuis le lien
                      const idMatch = notification.lien?.match(/\/ressources\/(\d+)/);
                      const id = idMatch ? parseInt(idMatch[1]) : notification.id;
                      
                      console.log(`📚 Ressource depuis notification ${index}:`, {
                        id: id,
                        titre: titre,
                        date: notification.date_creation
                      });
                      
                      return {
                        id: id,
                        titre: titre,
                        type: 'ressource partagée',
                        date_consultation: notification.date_creation
                      };
                    }).filter(r => r !== null); // Filtrer les entrées nulles
                    
                    console.log('📚 Ressources depuis notifications:', ressourcesFormatees.length);
                  }
                } catch (error) {
                  console.log('📚 Erreur notifications alternatives:', error);
                }
              }
            }
            
            activitesRecentes.dernieresRessourcesConsultees = ressourcesFormatees;
            console.log('📚 Utilisation des ressources alternatives:', activitesRecentes.dernieresRessourcesConsultees.length);
            console.log('📚 Ressources finales:', activitesRecentes.dernieresRessourcesConsultees);
          } else {
            activitesRecentes.dernieresRessourcesConsultees = [];
          }
        } catch (error) {
          console.log('📚 Erreur endpoint alternatif ressources:', error);
          activitesRecentes.dernieresRessourcesConsultees = [];
        }
      }
      
      // Forcer l'initialisation du système unifié et diagnostiquer
      try {
        console.log('🔍 === INITIALISATION SYSTÈME UNIFIÉ ===');
        
        // Utiliser les clés spécifiques à l'utilisateur
        const consultationsKey = `user_${user?.id}_consultations_ressources`;
        const interactionsKey = `user_${user?.id}_ressources_interactions`;
        
        console.log('🔍 Clés utilisateur:', { consultationsKey, interactionsKey });
        
        // Vérifier consultations_ressources
        const consultations = await AsyncStorage.getItem(consultationsKey) || '[]';
        const consultationsParsed = JSON.parse(consultations);
        console.log('📚 consultations_ressources existantes:', consultationsParsed.length);
        
        // Vérifier ressources_interactions
        const interactions = await AsyncStorage.getItem(interactionsKey) || '[]';
        const interactionsParsed = JSON.parse(interactions);
        console.log('🔄 ressources_interactions existantes:', interactionsParsed.length);
        
        // Si ressources_interactions est vide mais consultations contient des données, initialiser
        if (interactionsParsed.length === 0 && consultationsParsed.length > 0) {
          console.log('🔄 Initialisation de ressources_interactions avec les consultations existantes...');
          
          // Convertir les consultations en interactions unifiées
          const interactionsFromConsultations = consultationsParsed.map(consultation => ({
            ressource_id: consultation.ressource_id,
            titre: consultation.titre,
            type: 'consultation',
            categorie: 'globale', // Par défaut, car les anciennes consultations n'avaient pas de catégorie
            date_interaction: consultation.date_consultation
          }));
          
          await AsyncStorage.setItem(interactionsKey, JSON.stringify(interactionsFromConsultations));
          console.log('🔄 ressources_interactions initialisé avec:', interactionsFromConsultations.length, 'interactions');
        }
        
        // Vérifier après initialisation
        const interactionsAfterInit = await AsyncStorage.getItem(interactionsKey) || '[]';
        const interactionsAfterParsed = JSON.parse(interactionsAfterInit);
        
        console.log('🔍 État final:', {
          consultations: consultationsParsed.length,
          interactions: interactionsAfterParsed.length,
          ids_uniques_consultations: [...new Set(consultationsParsed.map(c => c.ressource_id))],
          ids_uniques_interactions: [...new Set(interactionsAfterParsed.map(i => i.ressource_id))],
          ids_tous: [...new Set([
            ...consultationsParsed.map(c => c.ressource_id),
            ...interactionsAfterParsed.map(i => i.ressource_id)
          ])]
        });
        
        console.log('🔍 === FIN INITIALISATION ===');
      } catch (error) {
        console.log('🔍 Erreur initialisation système:', error);
      }

      // Calculer le nombre de ressources consultées/téléchargées uniques (toutes catégories)
      let nombreRessourcesConsultees = 0;
      try {
        console.log('📚 Début calcul du compteur de ressources pour utilisateur:', user?.id, user?.email);
        
        // Utiliser les clés spécifiques à l'utilisateur
        const interactionsKey = `user_${user?.id}_ressources_interactions`;
        const consultationsKey = `user_${user?.id}_consultations_ressources`;
        
        console.log('📚 Clés de calcul:', { interactionsKey, consultationsKey });
        
        // Utiliser le système unifié d'interactions
        const interactionsStockees = await AsyncStorage.getItem(interactionsKey) || '[]';
        console.log('📚 Interactions brutes:', interactionsStockees);
        const interactions = JSON.parse(interactionsStockees);
        
        if (Array.isArray(interactions) && interactions.length > 0) {
          console.log('📚 Interactions trouvées:', interactions.length, 'interactions');
          console.log('📚 Détail interactions:', interactions);
          
          // Compter les ressources uniques par ID (toutes interactions confondues)
          const ressourcesUniques = new Set(
            interactions.map(i => i.ressource_id)
          );
          nombreRessourcesConsultees = ressourcesUniques.size;
          console.log('📚 IDs de ressources uniques:', Array.from(ressourcesUniques));
          console.log('📚 Nombre total de ressources uniques (toutes interactions):', ressourcesUniques.size);
        } else {
          console.log('📚 Aucune interaction trouvée dans ressources_interactions, fallback vers consultations...');
          
          // Fallback : utiliser les consultations si pas d'interactions
          const consultationsStockees = await AsyncStorage.getItem(consultationsKey) || '[]';
          console.log('📚 Consultations brutes:', consultationsStockees);
          const consultations = JSON.parse(consultationsStockees);
          
          if (Array.isArray(consultations) && consultations.length > 0) {
            console.log('📚 Consultations trouvées:', consultations.length, 'consultations');
            console.log('📚 Détail consultations:', consultations);
            
            const ressourcesUniques = new Set(
              consultations.map(c => c.ressource_id)
            );
            nombreRessourcesConsultees = ressourcesUniques.size;
            console.log('📚 IDs de consultations uniques:', Array.from(ressourcesUniques));
            console.log('📚 Nombre de ressources consultées uniques (fallback consultations):', ressourcesUniques.size);
          } else {
            console.log('📚 Aucune consultation trouvée non plus');
          }
        }
      } catch (error) {
        console.log('📚 Erreur lecture interactions unifiées:', error);
        // Dernier fallback : utiliser les activités récentes
        if (activitesRecentes.dernieresRessourcesConsultees.length > 0) {
          const ressourcesUniques = new Set(
            activitesRecentes.dernieresRessourcesConsultees.map(r => r.id)
          );
          nombreRessourcesConsultees = ressourcesUniques.size;
          console.log('📚 Nombre de ressources consultées uniques (fallback activités):', ressourcesUniques.size);
        }
      }
      
      // Mettre à jour les statistiques principales avec le nouveau nombre
      setDashboardData(prev => ({
        ...prev,
        statistiquesPrincipales: {
          ...prev.statistiquesPrincipales,
          ressourcesConsultees: nombreRessourcesConsultees
        }
      }));
      
      // Gestion des questions avec diagnostic
      if (questionsResponse.ok) {
        const questionsData = await questionsResponse.json();
        console.log('❓ Questions data:', questionsData);
        // S'assurer que c'est un tableau
        activitesRecentes.dernieresQuestions = Array.isArray(questionsData) ? questionsData : [];
      } else {
        console.log('❓ Questions failed, status:', questionsResponse.status);
        // Essayer l'endpoint général des questions
        try {
          const altResponse = await fetch(`${API_BASE_URL}/api/forum/questions/`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (altResponse.ok) {
            const allQuestions = await altResponse.json();
            console.log('❓ All questions type:', typeof allQuestions, Array.isArray(allQuestions));
            
            // S'assurer que c'est un tableau avant d'utiliser filter
            const questionsArray = Array.isArray(allQuestions) ? allQuestions : 
                                (allQuestions && allQuestions.results && Array.isArray(allQuestions.results)) ? allQuestions.results : [];
            
            // Filtrer les questions de l'utilisateur et prendre les plus récentes
            const userQuestions = questionsArray.filter(q => q.auteur === user?.id).slice(0, 3);
            activitesRecentes.dernieresQuestions = userQuestions.map(q => ({
              id: q.id,
              titre: q.titre || 'Question sans titre',
              date: q.date || new Date().toISOString(),
              nb_reponses: q.nb_reponses || 0
            }));
            console.log('❓ Utilisation des questions alternatives:', activitesRecentes.dernieresQuestions.length);
          } else {
            activitesRecentes.dernieresQuestions = [];
          }
        } catch (error) {
          console.log('❓ Erreur endpoint alternatif questions:', error);
          activitesRecentes.dernieresQuestions = [];
        }
      }
      
      // Gestion des réponses avec diagnostic
      if (reponsesResponse.ok) {
        const reponsesData = await reponsesResponse.json();
        console.log('💡 Réponses data:', reponsesData);
        // S'assurer que c'est un tableau
        activitesRecentes.reponsesNonLues = Array.isArray(reponsesData) ? reponsesData : [];
      } else {
        console.log('💡 Réponses failed, status:', reponsesResponse.status);
        // Essayer de trouver les réponses aux questions de l'utilisateur
        try {
          const altResponse = await fetch(`${API_BASE_URL}/api/forum/reponses/`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (altResponse.ok) {
            const allReponses = await altResponse.json();
            console.log('💡 All reponses type:', typeof allReponses, Array.isArray(allReponses));
            
            // S'assurer que c'est un tableau avant d'utiliser filter
            const reponsesArray = Array.isArray(allReponses) ? allReponses : 
                                (allReponses && allReponses.results && Array.isArray(allReponses.results)) ? allReponses.results : [];
            
            // Filtrer les réponses non lues aux questions de l'utilisateur
            const userQuestionsResponse = await fetch(`${API_BASE_URL}/api/forum/questions/`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            
            let userQuestions = [];
            if (userQuestionsResponse.ok) {
              const userQuestionsData = await userQuestionsResponse.json();
              userQuestions = Array.isArray(userQuestionsData) ? userQuestionsData : 
                             (userQuestionsData && userQuestionsData.results && Array.isArray(userQuestionsData.results)) ? userQuestionsData.results : [];
            }
            
            const userQuestionIds = userQuestions.map(q => q.id);
            const reponsesNonLues = reponsesArray.filter(r => 
              userQuestionIds.includes(r.question) && r.auteur !== user?.id
            ).slice(0, 5);
            
            activitesRecentes.reponsesNonLues = reponsesNonLues.map(r => {
              // Trouver le titre de la question correspondante
              const questionCorrespondante = userQuestions.find(q => q.id === r.question);
              return {
                id: r.id,
                question_id: r.question,
                question_titre: questionCorrespondante?.titre || 'Question sans titre',
                contenu: r.contenu ? r.contenu.substring(0, 100) + '...' : 'Réponse sans contenu',
                auteur: r.auteur_details?.nom || r.auteur_details?.prenom + ' ' + r.auteur_details?.nom || 'Anonyme',
                date: r.date || new Date().toISOString()
              };
            });
            console.log('💡 Utilisation des réponses alternatives:', activitesRecentes.reponsesNonLues.length);
          } else {
            activitesRecentes.reponsesNonLues = [];
          }
        } catch (error) {
          console.log('💡 Erreur endpoint alternatif réponses:', error);
          activitesRecentes.reponsesNonLues = [];
        }
      }
      
      console.log('Activités récentes chargées:', activitesRecentes);
      
      // Mise à jour immédiate avec animation pour montrer les nouvelles données
      setDashboardData(prev => ({
        ...prev,
        activitesRecentes,
        seances_a_venir: activitesRecentes.prochainesSeances
      }));
      
      // Forcer un re-render pour montrer les nouvelles données
      setTimeout(() => {
        setDashboardData(prev => ({
          ...prev,
          activitesRecentes: { ...prev.activitesRecentes }
        }));
      }, 100);
      
    } catch (error) {
      console.error('Erreur chargement activités récentes:', error);
    }
  };

  // Charger les notifications et annonces avec vraies données
  const loadNotificationsEtAnnonces = async (token) => {
    try {
      // Notifications non lues
      const notifResponse = await fetch(`${API_BASE_URL}/api/notifications/non_lues/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      // Annonces non lues
      const annoncesResponse = await fetch(`${API_BASE_URL}/api/annonces/non_lues/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      let notifications = [];
      let annoncesNonLues = [];
      
      if (notifResponse.ok) {
        const notifData = await notifResponse.json();
        console.log('Notifications réelles:', notifData);
        notifications = notifData;
      }
      
      if (annoncesResponse.ok) {
        const annoncesData = await annoncesResponse.json();
        console.log('Annonces réelles:', annoncesData);
        annoncesNonLues = annoncesData;
      }
      
      setDashboardData(prev => ({
        ...prev,
        notifications,
        annoncesNonLues
      }));
      
      console.log('Notifications et annonces chargées:', { notifications, annoncesNonLues });
      
    } catch (error) {
      console.error('Erreur chargement notifications et annonces:', error);
    }
  };

  // Charger les badges et objectifs d'apprentissage avec vraies données
  const loadBadgesEtObjectifs = async (token) => {
    try {
      // Badges obtenus
      const badgesResponse = await fetch(`${API_BASE_URL}/api/gamification/badges/etudiant/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      // Objectifs d'apprentissage
      const objectifsResponse = await fetch(`${API_BASE_URL}/api/apprentissage/objectifs/etudiant/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      let badgesObtenus = [];
      let objectifsApprentissage = [];
      
      if (badgesResponse.ok) {
        const badgesData = await badgesResponse.json();
        console.log('Badges réels:', badgesData);
        badgesObtenus = badgesData;
      }
      
      if (objectifsResponse.ok) {
        const objectifsData = await objectifsResponse.json();
        console.log('Objectifs réels:', objectifsData);
        objectifsApprentissage = objectifsData;
      }
      
      setDashboardData(prev => ({
        ...prev,
        statistiquesPrincipales: {
          ...prev.statistiquesPrincipales,
          badgesObtenus
        },
        objectifsApprentissage,
        recommandations: {
          ...prev.recommandations,
          objectifsApprentissage
        }
      }));
      
      console.log('Badges et objectifs chargés:', { badgesObtenus, objectifsApprentissage });
      
    } catch (error) {
      console.error('Erreur chargement badges et objectifs:', error);
    }
  };

  // Charger les séances à venir
  const loadSeancesAVenir = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      
      // Mettre à jour automatiquement les séances expirées
      try {
        await fetch(`${API_BASE_URL}/api/tutorat/seances/mettre-a-jour-expirees/`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } catch (error) {
        console.warn('⚠️ Erreur mise à jour séances expirées:', error);
      }
      
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

  // Charger les recommandations avec vraies données
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
      
      let recommandations = {
        tuteurRecommande: null,
        ressourceSuggeree: null,
        groupeSuggere: null,
        objectifsApprentissage: []
      };
      
      if (tuteurResponse.ok) {
        const tuteurs = await tuteurResponse.json();
        console.log('Tuteurs recommandés réels:', tuteurs);
        recommandations.tuteurRecommande = tuteurs[0] || null;
      }
      
      if (ressourceResponse.ok) {
        const ressources = await ressourceResponse.json();
        console.log('Ressources suggérées réelles:', ressources);
        recommandations.ressourceSuggeree = ressources[0] || null;
      }
      
      setDashboardData(prev => ({
        ...prev,
        recommandations: {
          ...prev.recommandations,
          ...recommandations
        }
      }));
      
      console.log('Recommandations chargées:', recommandations);
      
    } catch (error) {
      console.error('Erreur chargement recommandations:', error);
    }
  };

  // Charger l'activité forum avec vraies données
  const loadForumActivite = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}/api/forum/mes-questions/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const questions = await response.json();
        console.log('Questions forum réelles:', questions);
        
        // Calcul des statistiques réelles
        const reponsesRecues = questions.reduce((total, q) => total + (q.nb_reponses || 0), 0);
        const questionsRepondues = questions.filter(q => q.nb_reponses > 0).length;
        const moyenneReponses = questionsRepondues > 0 ? reponsesRecues / questionsRepondues : 0;
        
        setDashboardData(prev => ({
          ...prev,
          forumActivite: {
            questionRecente: questions[0] || null,
            reponsesRecues,
            badgeObtenu: null, // Sera chargé via les badges
            questionsRepondues,
            moyenneReponses: parseFloat(moyenneReponses.toFixed(1))
          }
        }));
        
        console.log('Activité forum calculée:', { reponsesRecues, questionsRepondues, moyenneReponses });
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
  const handleVoirSeancesDisponibles = () => navigation.navigate('StudentSessions');
  const handleForum = () => navigation.navigate('StudentForum');
  const handleRejoindreGroupe = () => navigation.navigate('GroupesList');
  const handleContacterMonTuteur = () => navigation.navigate('StudentMessages');
  const handleDefinirObjectifs = () => Alert.alert('Objectifs', 'Définir vos objectifs');
  const handleVoirStatistiques = () => navigation.navigate('Statistics');

  // My Resources - Partage de documents entre étudiants
  const handleMyResources = () => {
    navigation.navigate('MyResources'); // Écran pour gérer les ressources partagées entre étudiants
  };

  // Ressources Globales - Bibliothèque de ressources validées par l'admin
  const handleGlobalResources = () => {
    navigation.navigate('GlobalResources'); // Nouvel écran pour les ressources globales
  };
  const handleAudioForum = () => {
    Alert.alert('Messages Vocaux', 'Accéder aux messages vocaux envoyés par les tuteurs', [
      {
        text: 'Écouter les messages',
        onPress: () => navigation.navigate('StudentMessages')
      },
      {
        text: 'Envoyer une réponse vocale',
        onPress: () => navigation.navigate('StudentForum')
      },
      {
        text: 'Annuler',
        style: 'cancel'
      }
    ]);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setSearching(true);
    
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const query = searchQuery.trim().toLowerCase();
      
      // Dictionnaire de termes sémantiques pour la recherche scientifique (plus strict)
      const semanticTerms = {
        'scientifique': ['science', 'scientifique', 'recherche scientifique', 'étude scientifique', 'expérimental', 'laboratoire', 'théorie scientifique', 'méthode scientifique', 'hypothèse', 'expérience', 'données', 'analyse', 'résultat', 'conclusion', 'publication', 'article scientifique'],
        'informatique': ['informatique', 'programmation', 'code', 'développement', 'algorithm', 'logiciel', 'application', 'web', 'mobile', 'base de données', 'réseau', 'sécurité', 'cryptographie'],
        'robotique': ['robotique', 'robot', 'automatisation', 'automatisme', 'intelligence artificielle', 'ia', 'ai', 'machine learning', 'deep learning', 'neurone', 'capteur', 'actionneur', 'automate', 'programmation robot', 'contrôle robotique', 'robot industriel', 'robot mobile', 'drone', 'arduino', 'raspberry pi'],
        'math': ['math', 'mathématique', 'calcul', 'algèbre', 'géométrie', 'statistique', 'probabilité', 'équation', 'théorème', 'formule'],
        'physique': ['physique', 'mécanique', 'optique', 'électricité', 'magnétisme', 'quantique', 'énergie', 'force', 'vitesse', 'accélération'],
        'chimie': ['chimie', 'molécule', 'atome', 'réaction', 'composé', 'élément', 'solution', 'acide', 'base', 'catalyseur'],
        'biologie': ['biologie', 'cellule', 'gène', 'adn', 'protéine', 'organisme', 'évolution', 'écologie', 'métabolisme'],
        'médecine': ['médecine', 'médical', 'santé', 'traitement', 'diagnostic', 'maladie', 'thérapie', 'pharmacologie', 'chirurgie']
      };
      
      // Fonction pour vérifier la correspondance sémantique (très stricte pour 'scientifique')
      const checkSemanticMatch = (text, searchTerm) => {
        const lowerText = text.toLowerCase();
        
        // Correspondance directe exacte ou partielle
        if (lowerText.includes(searchTerm)) return true;
        
        // Pour 'scientifique', être très strict - ne chercher que les termes vraiment scientifiques
        if (searchTerm === 'scientifique') {
          const scientificTerms = semanticTerms['scientifique'];
          // Exclure les termes trop généraux qui pourraient apparaître dans des contextes non scientifiques
          const strictScientificTerms = scientificTerms.filter(term => 
            !['étude', 'recherche', 'données', 'analyse'].includes(term) ||
            (term === 'étude' && lowerText.includes('étude scientifique')) ||
            (term === 'recherche' && lowerText.includes('recherche scientifique')) ||
            (term === 'données' && (lowerText.includes('données scientifiques') || lowerText.includes('données expérimentales'))) ||
            (term === 'analyse' && (lowerText.includes('analyse scientifique') || lowerText.includes('analyse expérimentale')))
          );
          return strictScientificTerms.some(term => lowerText.includes(term));
        }
        
        // Pour les autres termes, utiliser la logique normale
        const relatedTerms = semanticTerms[searchTerm];
        if (!relatedTerms || relatedTerms.length === 0) return false;
        
        return relatedTerms.some(term => lowerText.includes(term));
      };
      
      // Fonction pour calculer le score de pertinence
      const calculateRelevanceScore = (text, searchTerm) => {
        const lowerText = text.toLowerCase();
        let score = 0;
        
        // Score élevé pour correspondance directe
        if (lowerText.includes(searchTerm)) score += 10;
        
        // Score moyen pour correspondance sémantique
        const relatedTerms = semanticTerms[searchTerm] || [];
        relatedTerms.forEach(term => {
          if (lowerText.includes(term)) score += 5;
        });
        
        return score;
      };
      
      // Rechercher d'abord dans les questions
      const questionsResponse = await fetch(`${API_BASE_URL}/api/forum/questions/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (questionsResponse.ok) {
        const questionsData = await questionsResponse.json();
        console.log('🔍 Questions API response:', questionsData);
        
        // Vérifier si la réponse est un objet avec results ou un tableau direct
        const questions = Array.isArray(questionsData) ? questionsData : (questionsData.results || []);
        console.log('🔍 Questions trouvées:', questions.length);
        
        // Chercher la meilleure correspondance avec score de pertinence
        const scoredQuestions = questions
          .filter(q => q.titre && checkSemanticMatch(q.titre, query))
          .map(q => ({
            ...q,
            score: calculateRelevanceScore(q.titre, query)
          }))
          .sort((a, b) => b.score - a.score);
        
        if (scoredQuestions.length > 0) {
          console.log('✅ Questions trouvées:', scoredQuestions.length, 'questions');
          // Stocker les résultats et les afficher dans le dashboard
          setSearchResults(scoredQuestions);
          setShowSearchResults(true);
          setSearching(false);
          return;
        }
        
        // Si aucune question trouvée, rechercher dans les réponses
        console.log('🔍 Recherche dans les réponses...');
        const responsesResponse = await fetch(`${API_BASE_URL}/api/forum/reponses/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (responsesResponse.ok) {
          const responsesData = await responsesResponse.json();
          console.log('🔍 Réponses API response:', responsesData);
          
          // Vérifier si la réponse est un objet avec results ou un tableau direct
          const responses = Array.isArray(responsesData) ? responsesData : (responsesData.results || []);
          console.log('🔍 Réponses trouvées:', responses.length);
          
          // Chercher la meilleure correspondance dans les réponses avec score
          const scoredResponses = responses
            .filter(r => r.contenu && checkSemanticMatch(r.contenu, query))
            .map(r => ({
              ...r,
              score: calculateRelevanceScore(r.contenu, query)
            }))
            .sort((a, b) => b.score - a.score);
          
          if (scoredResponses.length > 0) {
            console.log('✅ Réponses trouvées:', scoredResponses.length, 'réponses');
            // Récupérer les questions correspondantes pour les afficher
            const questionIds = [...new Set(scoredResponses.map(r => r.question))];
            const questionsWithResponses = Array.isArray(questionsData) ? questionsData : (questionsData.results || []);
            
            const questionsWithFoundResponses = questionIds.map(questionId => {
              const question = questionsWithResponses.find(q => q.id === questionId);
              const responses = scoredResponses.filter(r => r.question === questionId);
              return {
                ...question,
                foundResponses: responses,
                score: Math.max(...responses.map(r => r.score)),
                type: 'response_match'
              };
            }).filter(q => q);
            
            setSearchResults(questionsWithFoundResponses);
            setShowSearchResults(true);
            setSearching(false);
            return;
          }
        }
        
        // Rechercher aussi dans les détails des auteurs (matières maîtrisées)
        console.log('🔍 Recherche dans les profils des auteurs...');
        const allResponses = await fetch(`${API_BASE_URL}/api/forum/reponses/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (allResponses.ok) {
          const responsesData = await allResponses.json();
          
          // Vérifier si la réponse est un objet avec results ou un tableau direct
          const responses = Array.isArray(responsesData) ? responsesData : (responsesData.results || []);
          
          // Chercher dans les matières maîtrisées des auteurs avec score
          const scoredProfiles = responses
            .filter(r => r.auteur_details && r.auteur_details.matieres_maitrisees && checkSemanticMatch(r.auteur_details.matieres_maitrisees, query))
            .map(r => ({
              ...r,
              score: calculateRelevanceScore(r.auteur_details.matieres_maitrisees, query)
            }))
            .sort((a, b) => b.score - a.score);
          
          if (scoredProfiles.length > 0) {
            const bestProfile = scoredProfiles[0];
            console.log('✅ Profil trouvé (score:', bestProfile.score, ') avec matières pertinentes, question ID:', bestProfile.question);
            navigation.navigate('QuestionDetail', { questionId: bestProfile.question });
            setSearching(false);
            return;
          }
        }
      }
      
      // Si aucune correspondance trouvée, afficher un message dans le dashboard
      console.log('📝 Aucune correspondance trouvée, affichage du message');
      setSearchResults([]);
      setShowSearchResults(true);
      setSearching(false);
      
    } catch (error) {
      console.error('❌ Erreur lors de la recherche:', error);
      // En cas d'erreur, afficher un message d'erreur dans le dashboard
      setSearchResults([]);
      setShowSearchResults(true);
      setSearching(false);
    } finally {
      setSearching(false);
    }
  };

  // Fonction pour effacer la recherche et revenir à l'affichage par défaut
  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchResults(false);
  };

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
      <ScrollView style={styles.container}>
        {/* Section Bienvenue avec profil */}
        <Card style={styles.welcomeCard}>
          <View style={styles.welcomeHeader}>
            <Text style={styles.welcomeTitle}>👋 Bienvenue, {user?.prenom || 'Étudiant'} !</Text>
            <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
              <Ionicons name="refresh" size={20} color="#007AFF" />
              <Text style={styles.refreshButtonText}>Actualiser</Text>
            </TouchableOpacity>
          </View>
          
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
              <Text style={styles.progressValue}>{Math.round(dashboardData.progression.tempsEtude / 60 * 10) / 10}h / {dashboardData.progression.tempsEtudeObjectif}h</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { 
                width: `${dashboardData.progression.tempsEtudeObjectif > 0 ? Math.min((dashboardData.progression.tempsEtude / dashboardData.progression.tempsEtudeObjectif) * 100, 100) : 0}%`, 
                backgroundColor: '#f39c12' 
              }]} />
            </View>
          </View>

          <View style={styles.progressItem}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>🏆 Réussite</Text>
              <Text style={styles.progressValue}>{dashboardData.progression.seancesReussies} séances terminées sur {dashboardData.progression.seancesTotales}</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { 
                width: `${dashboardData.progression.seancesTotales > 0 ? Math.min((dashboardData.progression.seancesReussies / dashboardData.progression.seancesTotales) * 100, 100) : 0}%`, 
                backgroundColor: '#e74c3c' 
              }]} />
            </View>
          </View>

                  </Card>

        {/* Statistiques principales */}
        <Card style={styles.statsCard}>
          <Text style={styles.sectionTitle}>📊 MES STATISTIQUES PRINCIPALES</Text>
          
          <View style={styles.statsGrid}>
            <TouchableOpacity style={styles.statItem}>
              <Text style={styles.statNumber}>{dashboardData.statistiquesPrincipales.nombreSeancesSuivies}</Text>
              <Text style={styles.statLabel}>📚 Séances suivies</Text>
              <Text style={styles.statEvolution}>Total cumulé</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.statItem}>
              <Text style={styles.statNumber}>{Math.round(dashboardData.statistiquesPrincipales.heuresEtudeTotales / 60 * 10) / 10}h</Text>
              <Text style={styles.statLabel}>⏱️ Heures d'étude</Text>
              <Text style={styles.statEvolution}>Temps total</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.statsGrid}>
            <TouchableOpacity style={styles.statItem}>
              <Text style={styles.statNumber}>{dashboardData.statistiquesPrincipales.ressourcesConsultees}</Text>
              <Text style={styles.statLabel}> Ressources consultées</Text>
              <Text style={styles.statEvolution}>Uniques</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.statItem} onPress={handleVoirForum}>
              <Text style={styles.statNumber}>{dashboardData.forumActivite.questionsRepondues || 0}</Text>
              <Text style={styles.statLabel}> Questions posées</Text>
              <Text style={styles.statEvolution}>Au forum</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.statsGrid}>
            <TouchableOpacity style={styles.statItem} onPress={handleVoirForum}>
              <Text style={styles.statNumber}>{dashboardData.forumActivite.reponsesRecues || 0}</Text>
              <Text style={styles.statLabel}> Réponses reçues</Text>
              <Text style={styles.statEvolution}>À vos questions</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.statItem}>
              <Text style={styles.statNumber}>{dashboardData.statistiquesPrincipales.noteMoyenneTuteurs.toFixed(1)}</Text>
              <Text style={styles.statLabel}> Note moyenne</Text>
              <Text style={styles.statEvolution}>Tuteurs évalués</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Matières suivies */}
        <Card style={styles.matieresCard}>
          <Text style={styles.sectionTitle}>📚 MATIÈRES SUIVIES</Text>
          
          {dashboardData.statistiquesPrincipales.matieresSuivies.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="book-outline" size={40} color="#ccc" />
              <Text style={styles.emptyText}>Aucune matière suivie pour le moment</Text>
            </View>
          ) : (
            <View style={styles.matieresList}>
              {dashboardData.statistiquesPrincipales.matieresSuivies.map((matiere, index) => (
                <TouchableOpacity key={index} style={styles.matiereItem}>
                  <Text style={styles.matiereName}>{matiere.nom_affichage || matiere.nom}</Text>
                  <Text style={styles.matiereStats}>{matiere.nb_seances} séances • {matiere.heures}h</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </Card>

        {/* Activités récentes */}
        <Card style={styles.activitesCard}>
          <Text style={styles.sectionTitle}>🔄 ACTIVITÉS RÉCENTES</Text>
          
          {/* Dernières ressources consultées */}
          <View style={styles.activiteSection}>
            <Text style={styles.activiteTitle}>📚 Dernières ressources consultées</Text>
            {dashboardData.activitesRecentes.dernieresRessourcesConsultees.length === 0 ? (
              <Text style={styles.noActivityText}>Aucune ressource consultée récemment</Text>
            ) : (
              dashboardData.activitesRecentes.dernieresRessourcesConsultees.slice(0, 3).map((ressource, index) => (
                <TouchableOpacity key={`${ressource.id}-${index}-${ressource.date_consultation}`} style={styles.activityItem} onPress={() => handleVoirRessource(ressource.id)}>
                  <Text style={styles.activityTitle}>{ressource?.titre || 'Sans titre'}</Text>
                  <Text style={styles.activityDetail}>{new Date(ressource.date_consultation).toLocaleDateString('fr-FR')}</Text>
                </TouchableOpacity>
              ))
            )}
          </View>

          {/* Dernières questions posées */}
          <View style={styles.activiteSection}>
            <Text style={styles.activiteTitle}>💬 Dernières questions posées</Text>
            {dashboardData.activitesRecentes.dernieresQuestions.length === 0 ? (
              <Text style={styles.noActivityText}>Aucune question posée récemment</Text>
            ) : (
              dashboardData.activitesRecentes.dernieresQuestions.slice(0, 3).map((question) => (
                <TouchableOpacity key={question.id} style={styles.activityItem} onPress={() => navigation.navigate('QuestionDetail', { questionId: question.id })}>
                  <Text style={styles.activityTitle}>{question?.titre || 'Sans titre'}</Text>
                  <Text style={styles.activityDetail}>{question.nb_reponses} réponses • 
                    {question.date ? 
                      (() => {
                        try {
                          const date = new Date(question.date);
                          if (isNaN(date.getTime())) {
                            return 'Date invalide';
                          }
                          return date.toLocaleDateString('fr-FR');
                        } catch (error) {
                          return 'Date invalide';
                        }
                      })() : 
                      'Date non disponible'
                    }
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </View>

          {/* Réponses non lues */}
          <View style={styles.activiteSection}>
            <Text style={styles.activiteTitle}>💡 Réponses non lues</Text>
            {dashboardData.activitesRecentes.reponsesNonLues.length === 0 ? (
              <Text style={styles.noActivityText}>Aucune réponse non lue</Text>
            ) : (
              dashboardData.activitesRecentes.reponsesNonLues.slice(0, 3).map((reponse) => (
                <TouchableOpacity key={reponse.id} style={styles.activityItem} onPress={() => navigation.navigate('QuestionDetail', { questionId: reponse.question_id })}>
                  <Text style={styles.activityTitle}>Réponse à: {reponse.question_titre}</Text>
                  <Text style={styles.activityDetail}>Par {reponse.auteur} • 
                    {reponse.date ? 
                      (() => {
                        try {
                          const date = new Date(reponse.date);
                          if (isNaN(date.getTime())) {
                            return 'Date invalide';
                          }
                          return date.toLocaleDateString('fr-FR');
                        } catch (error) {
                          return 'Date invalide';
                        }
                      })() : 
                      'Date non disponible'
                    }
                  </Text>
                </TouchableOpacity>
              ))
            )}
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

        
        {/* Activité forum */}
        <Card style={styles.forumCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>💬 ACTIVITÉ FORUM</Text>
            <TouchableOpacity onPress={handleVoirForum}>
              <Text style={styles.seeAllText}>Voir tout</Text>
            </TouchableOpacity>
          </View>
          
          {/* Barre de recherche pour le forum */}
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher une question ou réponse..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
              editable={!searching}
            />
            <TouchableOpacity 
              style={[styles.searchButton, searching && styles.searchButtonDisabled]} 
              onPress={handleSearch}
              disabled={searching}
            >
              {searching ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="search" size={20} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
          {searching && (
            <View style={styles.searchingContainer}>
              <Text style={styles.searchingText}>🔍 Recherche intelligente en cours...</Text>
              <Text style={styles.searchingSubText}>Analyse des questions, réponses et profils</Text>
            </View>
          )}
          
          {/* Afficher les résultats de recherche si présents */}
          {showSearchResults && (
            <View style={styles.searchResultsContainer}>
              <View style={styles.searchResultsHeader}>
                <Text style={styles.searchResultsTitle}>
                  📊 Résultats pour "{searchQuery}"
                </Text>
                <TouchableOpacity onPress={clearSearch} style={styles.clearSearchButton}>
                  <Ionicons name="close-circle" size={20} color="#007AFF" />
                  <Text style={styles.clearSearchText}>Effacer</Text>
                </TouchableOpacity>
              </View>
              
              {searchResults.length > 0 ? (
                <ScrollView style={styles.searchResultsList} nestedScrollEnabled={true}>
                  {searchResults.map((item, index) => (
                    <View key={item.id || index} style={styles.searchResultItem}>
                      <View style={styles.searchResultHeader}>
                        <Text style={styles.searchResultTitle}>
                          {item.type === 'response_match' ? '💬 Réponse trouvée dans' : '❓ Question'} : "{item.titre}"
                        </Text>
                        <Text style={styles.searchResultScore}>
                          Score: {item.score}
                        </Text>
                      </View>
                      
                      <Text style={styles.searchResultContent}>
                        {item.contenu || item.description || 'Aucune description disponible'}
                      </Text>
                      
                      <View style={styles.searchResultMeta}>
                        <Text style={styles.searchResultAuthor}>
                          👤 {item.auteur_details?.prenom || 'Anonyme'} {item.auteur_details?.nom || ''}
                        </Text>
                        <Text style={styles.searchResultDate}>
                          📅 {new Date(item.date_publication || item.date_creation).toLocaleDateString()}
                        </Text>
                        <Text style={styles.searchResultResponses}>
                          💬 {item.nb_reponses || 0} réponses
                        </Text>
                      </View>
                      
                      {/* Afficher les réponses trouvées si c'est une recherche par réponse */}
                      {item.foundResponses && item.foundResponses.length > 0 && (
                        <View style={styles.foundResponsesContainer}>
                          <Text style={styles.foundResponsesTitle}>
                            🔍 Réponses correspondantes:
                          </Text>
                          {item.foundResponses.map((response, respIndex) => (
                            <View key={response.id || respIndex} style={styles.foundResponseItem}>
                              <Text style={styles.foundResponseContent}>
                                "{response.contenu.substring(0, 150)}..."
                              </Text>
                              <Text style={styles.foundResponseAuthor}>
                                - {response.auteur_details?.prenom || 'Anonyme'} (Score: {response.score})
                              </Text>
                            </View>
                          ))}
                        </View>
                      )}
                      
                      <TouchableOpacity 
                        style={styles.viewQuestionButton}
                        onPress={() => navigation.navigate('QuestionDetail', { questionId: item.id })}
                      >
                        <Text style={styles.viewQuestionButtonText}>
                          👁️ Voir la question complète
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              ) : (
                <View style={searchQuery && searchQuery.trim() ? styles.noResultsContainer : styles.errorMessageContainer}>
                  <Ionicons name={searchQuery && searchQuery.trim() ? "search" : "warning"} size={50} color={searchQuery && searchQuery.trim() ? "#ccc" : "#dc3545"} />
                  <Text style={searchQuery && searchQuery.trim() ? styles.noResultsText : styles.errorMessageText}>
                    {searchQuery && searchQuery.trim() ? "Aucune question trouvée pour cette recherche" : "Erreur lors de la recherche"}
                  </Text>
                  <Text style={searchQuery && searchQuery.trim() ? styles.noResultsSubText : styles.errorSubText}>
                    {searchQuery && searchQuery.trim() ? "Essayez avec d'autres mots-clés ou consultez le forum complet" : "Veuillez réessayer ultérieurement"}
                  </Text>
                  {searchQuery && searchQuery.trim() && (
                    <TouchableOpacity 
                      style={styles.goToForumButton}
                      onPress={() => {
                        clearSearch();
                        navigation.navigate('StudentForum', { searchQuery });
                      }}
                    >
                      <Text style={styles.goToForumButtonText}>
                        🌐 Voir le forum complet
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          )}
          
          {/* Afficher l'activité forum par défaut si pas de recherche */}
          {!showSearchResults && dashboardData.forumActivite.questionRecente && (
            <TouchableOpacity style={styles.forumItem}>
              <Text style={styles.forumQuestionTitle}>❓ Votre question : "{dashboardData.forumActivite.questionRecente.titre}"</Text>
              <Text style={styles.forumStats}>💬 {dashboardData.forumActivite.reponsesRecues} nouvelles réponses • ⏰ Il y a 2h</Text>
              <Text style={styles.forumSolution}>🏆 Meilleure réponse sélectionnée</Text>
              <TouchableOpacity style={styles.forumButton} onPress={handleVoirForum}>
                <Text style={styles.forumButtonText}>💬 Voir</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          )}
          
          {!showSearchResults && (
            <View style={styles.forumStats}>
              <Text style={styles.forumStatItem}> Réponses à vos questions</Text>
              <Text style={styles.forumStatItem}> Badge obtenu : "Helper du mois"</Text>
              <Text style={styles.forumStatItem}> {dashboardData.forumActivite.questionsRepondues} questions répondues • {dashboardData.forumActivite.moyenneReponses} moyenne</Text>
            </View>
          )}
          
          
          
          {/* Actions rapides */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚡ Actions rapides</Text>
          <View style={styles.quickActions}>
            <Button
              title="🔍 Chercher un tuteur"
              onPress={handleChercherTuteur}
              variant="outline"
              style={styles.quickAction}
            />
            <Button
              title="📅 Séances disponibles"
              onPress={handleVoirSeancesDisponibles}
              variant="outline"
              style={styles.quickAction}
            />
            <Button
              title="📚 My Resources"
              onPress={handleMyResources}
              variant="outline"
              style={styles.quickAction}
            />
          </View>
          <View style={styles.quickActions}>
            <Button
              title="📖 Ressources Globales"
              onPress={handleGlobalResources}
              variant="outline"
              style={styles.quickAction}
            />
            <Button
              title="💬 Forum"
              onPress={handleForum}
              variant="outline"
              style={styles.quickAction}
            />
            <Button
              title="👥 Rejoindre groupe"
              onPress={handleRejoindreGroupe}
              variant="outline"
              style={styles.quickAction}
            />
          </View>
          <View style={styles.quickActions}>
            <Button
              title="📊 Statistiques"
              onPress={handleVoirStatistiques}
              variant="outline"
              style={styles.quickAction}
            />
                      </View>
        </View>

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
                  <Text style={styles.notificationTitle}>{notification?.titre || 'Sans titre'}</Text>
                  <Text style={styles.notificationMessage}>{notification.message}</Text>
                  <Text style={styles.notificationTime}>⏰ 
                      {notification.date_creation ? 
                        (() => {
                          try {
                            const date = new Date(notification.date_creation);
                            if (isNaN(date.getTime())) {
                              return 'Date invalide';
                            }
                            return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                          } catch (error) {
                            return 'Date invalide';
                          }
                        })() : 
                        'Date non disponible'
                      }
                    </Text>
                  <TouchableOpacity style={styles.notificationButton}>
                    <Text style={styles.notificationButtonText}>✅</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </Card>
          )}
        </Card>
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
  welcomeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  welcomeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  refreshButtonText: {
    fontSize: 14,
    color: '#007AFF',
    marginLeft: 6,
    fontWeight: '500',
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
    marginBottom: 20,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  progressItem: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  progressValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: 'bold',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressTarget: {
    fontSize: 12,
    color: '#666',
  },
  progressActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  progressButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  progressButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  
  // Statistiques
  statsCard: {
    marginBottom: 20,
    padding: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 4,
  },
  statEvolution: {
    fontSize: 11,
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
  
  // Actions rapides - Style similaire au tuteur
  section: {
    marginBottom: 20,
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
  
  // Styles pour la recherche
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: '#333',
    marginRight: 8,
  },
  searchButton: {
    backgroundColor: '#007AFF',
    borderRadius: 6,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchButtonDisabled: {
    backgroundColor: '#ccc',
  },
  searchingContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  searchingText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  searchingSubText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  searchInputContainer: {
    flex: 1,
    height: 40,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 8,
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
  
  // Matières suivies
  matieresCard: {
    marginBottom: 20,
    padding: 20,
  },
  matieresList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  matiereItem: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    minWidth: 120,
    alignItems: 'center',
  },
  matiereName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  matiereStats: {
    fontSize: 12,
    color: '#666',
  },
  
  // Activités récentes
  activitesCard: {
    marginBottom: 20,
    padding: 20,
  },
  activiteSection: {
    marginBottom: 20,
  },
  activiteTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  noActivityText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  activityItem: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  activityDetail: {
    fontSize: 12,
    color: '#666',
  },
  
  // Badges
  badgesCard: {
    marginBottom: 20,
    padding: 20,
  },
  badgesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  badgeItem: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
    minWidth: 140,
  },
  badgeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgeName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  badgeDescription: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 4,
  },
  badgeDate: {
    fontSize: 10,
    color: '#999',
    textAlign: 'center',
  },
  
  // Objectifs d'apprentissage
  objectifsCard: {
    marginBottom: 20,
    padding: 20,
  },
  objectifsList: {
    gap: 16,
  },
  objectifItem: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  objectifTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  objectifDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  objectifProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  objectifProgression: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#27ae60',
    marginLeft: 12,
  },
  objectifEcheance: {
    fontSize: 12,
    color: '#666',
  },
  
  // Annonces administratives
  annoncesCard: {
    marginBottom: 20,
    padding: 20,
  },
  annonceItem: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3498db',
  },
  annonceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  annonceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  annoncePriority: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  annoncePriorityText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  annonceMessage: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  annonceDate: {
    fontSize: 12,
    color: '#999',
  },
  
  // Styles pour les résultats de recherche dans le dashboard
  searchResultsContainer: {
    marginTop: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchResultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchResultsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  clearSearchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
  },
  clearSearchText: {
    fontSize: 12,
    color: '#007AFF',
    marginLeft: 4,
  },
  searchResultsList: {
    maxHeight: 400,
  },
  searchResultItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchResultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  searchResultTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  searchResultScore: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  searchResultContent: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  searchResultMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  searchResultAuthor: {
    fontSize: 12,
    color: '#007AFF',
  },
  searchResultDate: {
    fontSize: 12,
    color: '#666',
  },
  searchResultResponses: {
    fontSize: 12,
    color: '#666',
  },
  foundResponsesContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  foundResponsesTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  foundResponseItem: {
    backgroundColor: '#fff',
    borderRadius: 6,
    padding: 10,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  foundResponseContent: {
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  foundResponseAuthor: {
    fontSize: 11,
    color: '#007AFF',
    textAlign: 'right',
  },
  viewQuestionButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  viewQuestionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  noResultsContainer: {
    alignItems: 'center',
    padding: 40,
  },
  noResultsText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  noResultsSubText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 20,
  },
  errorMessageContainer: {
    alignItems: 'center',
    padding: 40,
  },
  errorMessageText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#dc3545',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorSubText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 20,
  },
  goToForumButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  goToForumButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default StudentDashboardScreen;