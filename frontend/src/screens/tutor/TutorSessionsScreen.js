import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, ActivityIndicator, RefreshControl, Linking, TextInput } from 'react-native';
import Header from '../../components/ui/Header';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { API_BASE_URL } from '../../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from '../../context/AuthContext';
import { useFocusEffect } from '@react-navigation/native';

const TutorSessionsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  
  const [formData, setFormData] = useState({
    matiere: '',
    niveau: '',
    groupe: 1, // ID par défaut
    date: new Date(),
    heure: new Date(),
    duree: 60,
    lien_reunion: '',
    description: '',
    rappel_actif: true,
    delai_rappel: 30 // minutes avant
  });

  const [niveaux] = useState([
    'L1', 'L2', 'L3', 'M1', 'M2'
  ]);

  const [groupes, setGroupes] = useState([
    { id: 1, nom: 'Groupe A' },
    { id: 2, nom: 'Groupe B' },
    { id: 3, nom: 'TD1' },
    { id: 4, nom: 'TD2' },
    { id: 5, nom: 'TD3' }
  ]);

  const [durees] = useState([
    { id: 30, label: '30 min' },
    { id: 60, label: '1 heure' },
    { id: 90, label: '1h 30min' },
    { id: 120, label: '2 heures' }
  ]);

  const [delaisRappel] = useState([
    { id: 15, label: '15 min avant' },
    { id: 30, label: '30 min avant' },
    { id: 60, label: '1 heure avant' },
    { id: 1440, label: '1 jour avant' }
  ]);

  useEffect(() => {
    loadSessions();
  }, []);

  // Recharger automatiquement les sessions quand l'écran redevient actif
  useFocusEffect(
    useCallback(() => {
      loadSessions();
    }, [])
  );

  const loadSessions = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}/api/tutorat/seances/?tuteur=${user?.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setSessions(data.results || data || []); // Protection contre undefined
      } else {
        setSessions([]); // En cas d'erreur, initialiser comme tableau vide
      }
    } catch (error) {
      console.error('Erreur chargement séances:', error);
      setSessions([]); // En cas d'erreur, initialiser comme tableau vide
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSessions();
    setRefreshing(false);
  };

  const resetForm = () => {
    setFormData({
      matiere: '',
      niveau: '',
      groupe: 1, // ID par défaut
      date: new Date(),
      heure: new Date(),
      duree: 60,
      lien_reunion: '',
      description: '',
      rappel_actif: true,
      delai_rappel: 30
    });
    setEditingSession(null);
    setShowAddForm(false);
  };

  const handleSubmit = async () => {
    if (!formData.matiere || !formData.niveau) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('accessToken');
      
      const sessionData = {
        tuteur: user.id, // Utiliser l'ID du tuteur connecté
        sujet: formData.matiere.trim(),
        niveau: formData.niveau,
        // groupe: formData.groupe, // Temporairement désactivé
        date_heure_debut: new Date(
          formData.date.getFullYear(),
          formData.date.getMonth(),
          formData.date.getDate(),
          formData.heure.getHours(),
          formData.heure.getMinutes()
        ).toISOString(),
        date_heure_fin: new Date(
          formData.date.getFullYear(),
          formData.date.getMonth(),
          formData.date.getDate(),
          formData.heure.getHours() + Math.floor(formData.duree / 60),
          formData.heure.getMinutes() + (formData.duree % 60)
        ).toISOString(),
        duree: formData.duree,
        lien_reunion: formData.lien_reunion ? formData.lien_reunion.trim() : '',
        description: formData.description ? formData.description.trim() : '',
        rappel_actif: formData.rappel_actif,
        delai_rappel: formData.delai_rappel
      };

      console.log('📅 Données de séance envoyées:', sessionData);

      const url = editingSession 
        ? `${API_BASE_URL}/api/tutorat/seances/${editingSession.id}/`
        : `${API_BASE_URL}/api/tutorat/seances/`;
      
      const method = editingSession ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(sessionData)
      });

      if (response.ok) {
        Alert.alert(
          'Succès',
          editingSession ? 'Séance modifiée avec succès' : 'Séance planifiée avec succès',
          [
            { text: 'OK', onPress: () => {
              resetForm();
              loadSessions();
            }}
          ]
        );
      } else {
        const errorText = await response.text();
        console.log('🔍 Réponse complète du backend:', response);
        console.log('🔍 Status:', response.status);
        console.log('🔍 Headers:', response.headers);
        console.log('🔍 Corps de la réponse (errorText):', errorText);
        console.log('🔍 Type de errorText:', typeof errorText);
        console.log('🔍 Longueur de errorText:', errorText.length);
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
          console.log('🔍 ErrorData parsé:', errorData);
        } catch (e) {
          console.log('🔍 Erreur parsing JSON:', e);
          errorData = { message: errorText };
        }
        
        Alert.alert('Erreur', errorData.message || errorData.detail || errorText || 'Impossible de créer/modifier la séance');
      }
    } catch (error) {
      console.error('Erreur séance:', error);
      Alert.alert('Erreur', 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (session) => {
    setEditingSession(session);
    setFormData({
      matiere: session.matiere,
      niveau: session.niveau,
      groupe: session.groupe?.id || session.groupe || 1, // Gérer les deux formats
      date: new Date(session.date_heure),
      heure: new Date(session.date_heure),
      duree: session.duree || 60,
      lien_reunion: session.lien_reunion || '',
      description: session.description || '',
      rappel_actif: session.rappel_actif !== undefined ? session.rappel_actif : true,
      delai_rappel: session.delai_rappel || 30
    });
    setShowAddForm(true);
  };

  const handleCancel = (session) => {
    Alert.alert(
      'Annuler la séance',
      `Voulez-vous vraiment annuler cette séance de ${session.matiere} ?`,
      [
        { text: 'Non', style: 'cancel' },
        {
          text: 'Oui, annuler',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('accessToken');
              const response = await fetch(`${API_BASE_URL}/api/tutorat/seances/${session.id}/`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
              });

              if (response.ok) {
                Alert.alert('Succès', 'Séance annulée avec succès');
                loadSessions();
              } else {
                Alert.alert('Erreur', 'Impossible d\'annuler la séance');
              }
            } catch (error) {
              console.error('Erreur annulation séance:', error);
              Alert.alert('Erreur', 'Une erreur est survenue');
            }
          },
        },
      ]
    );
  };

  const handleStartSession = (session) => {
    if (session.lien_reunion) {
      Alert.alert(
        'Démarrer la séance',
        'Voulez-vous rejoindre la séance en ligne ?',
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Rejoindre',
            onPress: () => {
              Linking.openURL(session.lien_reunion).catch(() => {
                Alert.alert('Erreur', 'Impossible d\'ouvrir le lien de réunion');
              });
            }
          },
        ]
      );
    } else {
      Alert.alert(
        'Information',
        'Aucun lien de réunion configuré pour cette séance. Vous pouvez ajouter un lien en modifiant la séance.'
      );
    }
  };

  const handleViewParticipants = (session) => {
    setSelectedSession(session);
    // Navigation vers l'écran des participants
    navigation.navigate('SessionParticipants', { sessionId: session.id });
  };

  const formatDate = (dateString) => {
    if (!dateString) {
      return {
        date: 'Date non définie',
        time: 'Heure non définie',
        isToday: false,
        isPast: false
      };
    }
    
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const isPast = date < now;
    
    // Vérifier si la date est valide
    if (isNaN(date.getTime())) {
      return {
        date: 'Date invalide',
        time: 'Heure invalide',
        isToday: false,
        isPast: false
      };
    }
    
    return {
      date: date.toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }),
      time: date.toLocaleTimeString('fr-FR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      isToday,
      isPast
    };
  };

  const getSessionStatus = (session) => {
    const dateString = session.date_heure_debut || session.date_heure;
    if (!dateString) {
      return { status: 'inconnue', color: '#666', text: 'Date inconnue' };
    }
    
    const date = new Date(dateString);
    const now = new Date();
    
    // Vérifier si la date est valide
    if (isNaN(date.getTime())) {
      return { status: 'invalide', color: '#dc3545', text: 'Date invalide' };
    }
    
    const endTime = new Date(date.getTime() + (session.duree || 60) * 60000);
    
    if (now > endTime) return { status: 'terminee', color: '#666', text: 'Terminée' };
    if (now >= date) return { status: 'en_cours', color: '#28a745', text: 'En cours' };
    if (date.toDateString() === now.toDateString()) return { status: 'aujourdhui', color: '#007AFF', text: 'Aujourd\'hui' };
    return { status: 'a_venir', color: '#ffc107', text: 'À venir' };
  };

  if (loading && sessions.length === 0) {
    return (
      <>
        <Header title="Mes séances de tutorat" showBack onBackPress={() => navigation.goBack()} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Chargement de vos séances...</Text>
        </View>
      </>
    );
  }

  return (
    <>
      <Header title="Mes séances de tutorat" showBack onBackPress={() => navigation.goBack()} />
      <ScrollView 
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Card style={styles.addCard}>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => setShowAddForm(!showAddForm)}
          >
            <Ionicons name="add-circle-outline" size={24} color="#007AFF" />
            <Text style={styles.addButtonText}>
              {showAddForm ? 'Annuler' : 'Planifier une nouvelle séance'}
            </Text>
          </TouchableOpacity>
        </Card>

        {showAddForm && (
          <Card style={styles.formCard}>
            <Text style={styles.sectionTitle}>
              {editingSession ? 'Modifier la séance' : 'Nouvelle séance de tutorat'}
            </Text>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Sujet *</Text>
              <TextInput
                style={styles.input}
                placeholder="Entrez le sujet de la séance..."
                value={formData.matiere}
                onChangeText={(text) => setFormData(prev => ({ ...prev, matiere: text }))}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Niveau *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagsScroll}>
                {niveaux.map((niveau, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.tag,
                      formData.niveau === niveau && styles.tagSelected
                    ]}
                    onPress={() => setFormData(prev => ({ ...prev, niveau }))}
                  >
                    <Text style={[
                      styles.tagText,
                      formData.niveau === niveau && styles.tagTextSelected
                    ]}>{niveau}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Temporairement désactivé - à réactiver quand les groupes existent
            <View style={styles.formGroup}>
              <Text style={styles.label}>Groupe *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagsScroll}>
                {groupes.map((groupe) => (
                  <TouchableOpacity
                    key={groupe.id}
                    style={[
                      styles.tag,
                      formData.groupe === groupe.id && styles.tagSelected
                    ]}
                    onPress={() => setFormData(prev => ({ ...prev, groupe: groupe.id }))}
                  >
                    <Text style={[
                      styles.tagText,
                      formData.groupe === groupe.id && styles.tagTextSelected
                    ]}>{groupe.nom}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            */}

            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.label}>Date *</Text>
                <TouchableOpacity 
                  style={styles.dateButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Ionicons name="calendar-outline" size={20} color="#007AFF" />
                  <Text style={styles.dateButtonText}>
                    {formData.date.toLocaleDateString('fr-FR')}
                  </Text>
                </TouchableOpacity>
              </View>
              
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.label}>Heure *</Text>
                <TouchableOpacity 
                  style={styles.dateButton}
                  onPress={() => setShowTimePicker(true)}
                >
                  <Ionicons name="time-outline" size={20} color="#007AFF" />
                  <Text style={styles.dateButtonText}>
                    {formData.heure.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Durée</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagsScroll}>
                {durees.map((duree, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.tag,
                      formData.duree === duree.id && styles.tagSelected
                    ]}
                    onPress={() => setFormData(prev => ({ ...prev, duree: duree.id }))}
                  >
                    <Text style={[
                      styles.tagText,
                      formData.duree === duree.id && styles.tagTextSelected
                    ]}>{duree.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Lien de réunion (Zoom, Teams, etc.)</Text>
              <TextInput
                style={styles.input}
                value={formData.lien_reunion}
                onChangeText={(text) => setFormData(prev => ({ ...prev, lien_reunion: text }))}
                placeholder="https://zoom.us/j/..."
                keyboardType="url"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={styles.input}
                multiline
                numberOfLines={3}
                value={formData.description}
                onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
                placeholder="Points à aborder, prérequis, etc."
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Rappel automatique</Text>
              <TouchableOpacity 
                style={styles.recurrenceButton}
                onPress={() => setFormData(prev => ({ ...prev, rappel_actif: !prev.rappel_actif }))}
              >
                <Ionicons 
                  name={formData.rappel_actif ? "notifications" : "notifications-off-outline"} 
                  size={20} 
                  color={formData.rappel_actif ? "#28a745" : "#666"} 
                />
                <Text style={styles.recurrenceText}>
                  {formData.rappel_actif ? 'Rappel activé' : 'Rappel désactivé'}
                </Text>
              </TouchableOpacity>
              
              {formData.rappel_actif && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagsScroll}>
                  {delaisRappel.map((delai, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.tag,
                        formData.delai_rappel === delai.id && styles.tagSelected
                      ]}
                      onPress={() => setFormData(prev => ({ ...prev, delai_rappel: delai.id }))}
                    >
                      <Text style={[
                        styles.tagText,
                        formData.delai_rappel === delai.id && styles.tagTextSelected
                      ]}>{delai.label}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>

            <View style={styles.buttonContainer}>
              <Button 
                title={editingSession ? "Modifier" : "Créer"} 
                onPress={handleSubmit}
                loading={loading}
                style={styles.submitButton}
              />
              {editingSession && (
                <Button 
                  title="Annuler" 
                  onPress={resetForm}
                  type="secondary"
                  style={styles.cancelButton}
                />
              )}
            </View>
          </Card>
        )}

        {sessions.length === 0 ? (
          <Card style={styles.emptyCard}>
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={60} color="#ccc" />
              <Text style={styles.emptyTitle}>Aucune séance</Text>
              <Text style={styles.emptyText}>
                Commencez par planifier votre première séance de tutorat !
              </Text>
            </View>
          </Card>
        ) : (
          (sessions || []).map(session => {
            const dateString = session.date_heure_debut || session.date_heure;
            const dateInfo = formatDate(dateString);
            const statusInfo = getSessionStatus(session);
            
            return (
              <Card key={session.id} style={styles.sessionCard}>
                <View style={styles.sessionHeader}>
                  <View style={styles.sessionInfo}>
                    <Text style={styles.sessionTitle}>{session.matiere}</Text>
                    <Text style={styles.sessionLevel}>{session.niveau} • {session.groupe}</Text>
                    <Text style={[styles.sessionDate, statusInfo.isToday && styles.todayDate]}>
                      {dateInfo.isToday ? "Aujourd'hui" : dateInfo.date}
                    </Text>
                    <Text style={styles.sessionTime}>{dateInfo.time} • {session.duree || 60} min</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: statusInfo.color }]}>
                    <Text style={styles.statusText}>{statusInfo.text}</Text>
                  </View>
                </View>
                
                {session.description && (
                  <Text style={styles.sessionDescription} numberOfLines={2}>
                    {session.description}
                  </Text>
                )}
                
                <View style={styles.sessionStats}>
                  <View style={styles.statItem}>
                    <Ionicons name="people-outline" size={16} color="#666" />
                    <Text style={styles.statText}>
                      {session.nombre_etudiants || 0} participant{(session.nombre_etudiants || 0) > 1 ? 's' : ''}
                    </Text>
                  </View>
                  {session.lien_reunion && (
                    <View style={styles.statItem}>
                      <Ionicons name="videocam-outline" size={16} color="#007AFF" />
                      <Text style={styles.statText}>En ligne</Text>
                    </View>
                  )}
                  {session.rappel_actif !== false && (
                    <View style={styles.statItem}>
                      <Ionicons name="notifications-outline" size={16} color="#28a745" />
                      <Text style={styles.statText}>Rappel</Text>
                    </View>
                  )}
                </View>
                
                <View style={styles.sessionActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.viewButton]}
                    onPress={() => handleViewParticipants(session)}
                  >
                    <Ionicons name="people-outline" size={16} color="#666" />
                    <Text style={styles.actionText}>Participants</Text>
                  </TouchableOpacity>
                  
                  {statusInfo.status === 'en_cours' && session.lien_reunion && (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.startButton]}
                      onPress={() => handleStartSession(session)}
                    >
                      <Ionicons name="play-circle-outline" size={16} color="#28a745" />
                      <Text style={[styles.actionText, styles.startText]}>Démarrer</Text>
                    </TouchableOpacity>
                  )}
                  
                  <TouchableOpacity
                    style={[styles.actionButton, styles.editButton]}
                    onPress={() => handleEdit(session)}
                  >
                    <Ionicons name="create-outline" size={16} color="#007AFF" />
                    <Text style={[styles.actionText, styles.editText]}>Modifier</Text>
                  </TouchableOpacity>
                  
                  {statusInfo.status !== 'terminee' && (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.cancelButton]}
                      onPress={() => handleCancel(session)}
                    >
                      <Ionicons name="close-circle-outline" size={16} color="#dc3545" />
                      <Text style={[styles.actionText, styles.cancelText]}>Annuler</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </Card>
            );
          })
        )}

        {showDatePicker && (
          <DateTimePicker
            value={formData.date}
            mode="date"
            display="default"
            minimumDate={new Date()}
            onChange={(event, selectedDate) => {
              setShowDatePicker(false);
              if (selectedDate) {
                setFormData(prev => ({ ...prev, date: selectedDate }));
              }
            }}
          />
        )}

        {showTimePicker && (
          <DateTimePicker
            value={formData.heure}
            mode="time"
            display="default"
            onChange={(event, selectedTime) => {
              setShowTimePicker(false);
              if (selectedTime) {
                setFormData(prev => ({ ...prev, heure: selectedTime }));
              }
            }}
          />
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
  addCard: {
    marginBottom: 16,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#f8f9ff',
    borderRadius: 8,
  },
  addButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
    marginLeft: 8,
  },
  formCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
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
  },
  tagsScroll: {
    flexDirection: 'row',
    marginHorizontal: -4,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    marginHorizontal: 4,
  },
  tagSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  tagText: {
    fontSize: 12,
    color: '#666',
  },
  tagTextSelected: {
    color: '#fff',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
  },
  recurrenceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
  },
  recurrenceText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  submitButton: {
    flex: 1,
  },
  cancelButton: {
    flex: 1,
  },
  emptyCard: {
    alignItems: 'center',
    padding: 40,
  },
  emptyContainer: {
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
  sessionCard: {
    marginBottom: 16,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  sessionLevel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  sessionDate: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  todayDate: {
    color: '#007AFF',
    fontWeight: '600',
  },
  sessionTime: {
    fontSize: 12,
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '500',
  },
  sessionDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  sessionStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: '#666',
  },
  sessionActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 6,
    flex: 1,
    marginHorizontal: 2,
    justifyContent: 'center',
  },
  viewButton: {
    backgroundColor: '#f0f0f0',
  },
  startButton: {
    backgroundColor: '#e8f5e8',
  },
  editButton: {
    backgroundColor: '#e3f2fd',
  },
  cancelButton: {
    backgroundColor: '#ffebee',
  },
  actionText: {
    fontSize: 12,
    fontWeight: '500',
  },
  startText: {
    color: '#28a745',
  },
  editText: {
    color: '#007AFF',
  },
  cancelText: {
    color: '#dc3545',
  },
});

export default TutorSessionsScreen;
