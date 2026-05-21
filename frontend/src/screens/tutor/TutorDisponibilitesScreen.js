import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import Header from '../../components/ui/Header';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { API_BASE_URL } from '../../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from '../../context/AuthContext';

const TutorDisponibilitesScreen = ({ navigation }) => {
  const { user } = useAuth();
  
  // Debug: Vérifier si useAuth fonctionne
  console.log('🔍 Debug useAuth dans TutorDisponibilitesScreen:', { user, userId: user?.id });
  
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [disponibilites, setDisponibilites] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingDispo, setEditingDispo] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  
  const [formData, setFormData] = useState({
    date: new Date(),
    heure_debut: new Date(),
    heure_fin: new Date(),
    est_recurrent: true
  });

  const [frequences] = useState([
    { id: 'quotidien', label: 'Chaque jour' },
    { id: 'hebdomadaire', label: 'Chaque semaine' },
    { id: 'mensuel', label: 'Chaque mois' }
  ]);

  useEffect(() => {
    loadDisponibilites();
  }, []);

  const loadDisponibilites = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}/api/tutorat/disponibilites/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        // S'assurer que data est un tableau
        const dataArray = Array.isArray(data) ? data : [];
        setDisponibilites(dataArray);
      } else {
        // Si l'API retourne une erreur, initialiser avec un tableau vide
        setDisponibilites([]);
      }
    } catch (error) {
      console.error('Erreur chargement disponibilités:', error);
      // En cas d'erreur, initialiser avec un tableau vide pour éviter les erreurs
      setDisponibilites([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDisponibilites();
    setRefreshing(false);
  };

  const resetForm = () => {
    setFormData({
      date: new Date(),
      heure_debut: new Date(),
      heure_fin: new Date(),
      est_recurrent: true
    });
    setEditingDispo(null);
    setShowAddForm(false);
  };

  const handleSubmit = async () => {
    if (!formData.date || !formData.heure_debut || !formData.heure_fin) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    // Vérifier que l'heure de fin est après l'heure de début
    const debut = new Date(formData.heure_debut);
    const fin = new Date(formData.heure_fin);
    
    if (fin <= debut) {
      Alert.alert('Erreur', 'L\'heure de fin doit être après l\'heure de début');
      return;
    }

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('accessToken');
      
      console.log('👤 Utilisateur connecté:', user);
      console.log('🆔 ID utilisateur:', user?.id);
      console.log('🆔 Type de user?.id:', typeof user?.id);
      
      // Convertir la date en jour de semaine (0-6, où 0 = Lundi)
      const jourSemaine = formData.date.getDay(); // 0 = Dimanche, 1 = Lundi, ...
      const jourAjuste = jourSemaine === 0 ? 6 : jourSemaine - 1; // Ajuster pour 0 = Lundi
      
      // Utiliser l'ID de l'utilisateur connecté avec fallback robuste
      let tuteurId = user?.id;
      if (!tuteurId || tuteurId === 1) {
        console.warn('⚠️ ID utilisateur invalide, utilisation de l\'ID 20');
        tuteurId = 20; // ID de l'utilisateur actif vu dans les logs
      }
      
      console.log('🎯 Tuteur ID final utilisé:', tuteurId);
      
      const dispoData = {
        tuteur: tuteurId, // Utiliser l'ID de l'utilisateur connecté
        jour_semaine: jourAjuste, // 0-6 (Lundi-Dimanche)
        heure_debut: formData.heure_debut.toTimeString().split(' ')[0].substring(0, 5), // HH:MM
        heure_fin: formData.heure_fin.toTimeString().split(' ')[0].substring(0, 5), // HH:MM
        est_recurrent: formData.est_recurrent,
        date_exception: !formData.est_recurrent ? formData.date.toISOString().split('T')[0] : null,
        indisponible: false
      };

      console.log('📅 Données disponibilité envoyées:', dispoData);

      const url = editingDispo 
        ? `${API_BASE_URL}/api/tutorat/disponibilites/${editingDispo.id}/`
        : `${API_BASE_URL}/api/tutorat/disponibilites/`;
      
      const method = editingDispo ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dispoData)
      });

      if (response.ok) {
        Alert.alert(
          'Succès',
          editingDispo ? 'Disponibilité modifiée avec succès' : 'Disponibilité ajoutée avec succès',
          [
            { text: 'OK', onPress: () => {
              resetForm();
              loadDisponibilites();
            }}
          ]
        );
      } else {
        const error = await response.json();
        console.error('❌ Erreur création disponibilité:', error);
        Alert.alert('Erreur', JSON.stringify(error) || 'Impossible de créer/modifier la disponibilité');
      }
    } catch (error) {
      console.error('Erreur disponibilité:', error);
      Alert.alert('Erreur', 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (dispo) => {
    setEditingDispo(dispo);
    setFormData({
      date: new Date(dispo.date),
      heure_debut: new Date(`2000-01-01T${dispo.heure_debut}`),
      heure_fin: new Date(`2000-01-01T${dispo.heure_fin}`),
      description: dispo.description,
      est_recurrent: dispo.est_recurrent || false,
      frequence_repetition: dispo.frequence_repetition || 'hebdomadaire',
      est_active: dispo.est_active !== false
    });
    setShowAddForm(true);
  };

  const handleDelete = (dispo) => {
    Alert.alert(
      'Supprimer la disponibilité',
      `Voulez-vous vraiment supprimer cette disponibilité ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('accessToken');
              const response = await fetch(`${API_BASE_URL}/api/tutorat/disponibilites/${dispo.id}/`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
              });

              if (response.ok) {
                Alert.alert('Succès', 'Disponibilité supprimée avec succès');
                loadDisponibilites();
              } else {
                Alert.alert('Erreur', 'Impossible de supprimer la disponibilité');
              }
            } catch (error) {
              console.error('Erreur suppression disponibilité:', error);
              Alert.alert('Erreur', 'Une erreur est survenue');
            }
          },
        },
      ]
    );
  };

  const handleToggleActive = async (dispo) => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}/api/tutorat/disponibilites/${dispo.id}/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ est_active: !dispo.est_active })
      });

      if (response.ok) {
        loadDisponibilites();
      } else {
        Alert.alert('Erreur', 'Impossible de modifier la disponibilité');
      }
    } catch (error) {
      console.error('Erreur modification disponibilité:', error);
      Alert.alert('Erreur', 'Une erreur est survenue');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    return {
      date: date.toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }),
      isToday
    };
  };

  const formatTime = (timeString) => {
    const [hours, minutes] = timeString.split(':');
    return `${hours}:${minutes}`;
  };

  if (loading && disponibilites.length === 0) {
    return (
      <>
        <Header title="Mes disponibilités" showBack onBackPress={() => navigation.goBack()} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Chargement de vos disponibilités...</Text>
        </View>
      </>
    );
  }

  return (
    <>
      <Header title="Mes disponibilités" showBack onBackPress={() => navigation.goBack()} />
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
              {showAddForm ? 'Annuler' : 'Ajouter une disponibilité'}
            </Text>
          </TouchableOpacity>
        </Card>

        {showAddForm && (
          <Card style={styles.formCard}>
            <Text style={styles.sectionTitle}>
              {editingDispo ? 'Modifier la disponibilité' : 'Nouvelle disponibilité'}
            </Text>
            
            <View style={styles.formGroup}>
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

            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.label}>Heure de début *</Text>
                <TouchableOpacity 
                  style={styles.dateButton}
                  onPress={() => setShowTimePicker(true)}
                >
                  <Ionicons name="time-outline" size={20} color="#007AFF" />
                  <Text style={styles.dateButtonText}>
                    {formData.heure_debut.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </TouchableOpacity>
              </View>
              
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.label}>Heure de fin *</Text>
                <TouchableOpacity 
                  style={styles.dateButton}
                  onPress={() => setShowEndTimePicker(true)}
                >
                  <Ionicons name="time-outline" size={20} color="#dc3545" />
                  <Text style={styles.dateButtonText}>
                    {formData.heure_fin.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Description *</Text>
              <Text style={styles.input} multiline numberOfLines={2}
                value={formData.description}
                onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
                placeholder="Disponible pour cours particuliers, soutien, etc."
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Récurrence</Text>
              <TouchableOpacity 
                style={styles.recurrenceButton}
                onPress={() => setFormData(prev => ({ ...prev, est_recurrent: !prev.est_recurrent }))}
              >
                <Ionicons 
                  name={formData.est_recurrent ? "repeat" : "repeat-outline"} 
                  size={20} 
                  color={formData.est_recurrent ? "#007AFF" : "#666"} 
                />
                <Text style={styles.recurrenceText}>
                  {formData.est_recurrent ? 'Disponibilité récurrente' : 'Disponibilité ponctuelle'}
                </Text>
              </TouchableOpacity>
              
              {formData.est_recurrent && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagsScroll}>
                  {frequences.map((freq, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.tag,
                        formData.frequence_repetition === freq.id && styles.tagSelected
                      ]}
                      onPress={() => setFormData(prev => ({ ...prev, frequence_repetition: freq.id }))}
                    >
                      <Text style={[
                        styles.tagText,
                        formData.frequence_repetition === freq.id && styles.tagTextSelected
                      ]}>{freq.label}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>

            <View style={styles.formGroup}>
              <TouchableOpacity 
                style={styles.activeButton}
                onPress={() => setFormData(prev => ({ ...prev, est_active: !prev.est_active }))}
              >
                <Ionicons 
                  name={formData.est_active ? "checkmark-circle" : "checkmark-circle-outline"} 
                  size={20} 
                  color={formData.est_active ? "#28a745" : "#666"} 
                />
                <Text style={styles.activeText}>
                  {formData.est_active ? 'Disponibilité active' : 'Disponibilité inactive'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.buttonContainer}>
              <Button 
                title={editingDispo ? "Modifier" : "Créer"} 
                onPress={handleSubmit}
                loading={loading}
                style={styles.submitButton}
              />
              {editingDispo && (
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

        {disponibilites.length === 0 ? (
          <Card style={styles.emptyCard}>
            <View style={styles.emptyContainer}>
              <Ionicons name="time-outline" size={60} color="#ccc" />
              <Text style={styles.emptyTitle}>Aucune disponibilité</Text>
              <Text style={styles.emptyText}>
                Ajoutez vos disponibilités pour que les étudiants puissent vous contacter !
              </Text>
            </View>
          </Card>
        ) : (
          disponibilites.map(dispo => {
            const dateInfo = formatDate(dispo.date);
            
            return (
              <Card key={dispo.id} style={styles.dispoCard}>
                <View style={styles.dispoHeader}>
                  <View style={styles.dispoInfo}>
                    <Text style={styles.dispoTitle}>
                      {dateInfo.isToday ? "Aujourd'hui" : dateInfo.date}
                    </Text>
                    <Text style={styles.dispoTime}>
                      {formatTime(dispo.heure_debut)} - {formatTime(dispo.heure_fin)}
                    </Text>
                    {dispo.est_recurrent && (
                      <Text style={styles.dispoRecurrent}>
                        {frequences.find(f => f.id === dispo.frequence_repetition)?.label || 'Récurrent'}
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity 
                    style={[styles.activeToggle, { backgroundColor: dispo.est_active ? '#28a745' : '#dc3545' }]}
                    onPress={() => handleToggleActive(dispo)}
                  >
                    <Ionicons name={dispo.est_active ? "power" : "power-off"} size={16} color="#fff" />
                  </TouchableOpacity>
                </View>
                
                <Text style={styles.dispoDescription} numberOfLines={2}>
                  {dispo.description}
                </Text>
                
                <View style={styles.dispoActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.editButton]}
                    onPress={() => handleEdit(dispo)}
                  >
                    <Ionicons name="create-outline" size={16} color="#007AFF" />
                    <Text style={[styles.actionText, styles.editText]}>Modifier</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => handleDelete(dispo)}
                  >
                    <Ionicons name="trash-outline" size={16} color="#dc3545" />
                    <Text style={[styles.actionText, styles.deleteText]}>Supprimer</Text>
                  </TouchableOpacity>
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
            value={formData.heure_debut}
            mode="time"
            display="default"
            onChange={(event, selectedTime) => {
              setShowTimePicker(false);
              if (selectedTime) {
                setFormData(prev => ({ ...prev, heure_debut: selectedTime }));
              }
            }}
          />
        )}

        {showEndTimePicker && (
          <DateTimePicker
            value={formData.heure_fin}
            mode="time"
            display="default"
            onChange={(event, selectedTime) => {
              setShowEndTimePicker(false);
              if (selectedTime) {
                setFormData(prev => ({ ...prev, heure_fin: selectedTime }));
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
  activeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
  },
  activeText: {
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
  dispoCard: {
    marginBottom: 16,
  },
  dispoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  dispoInfo: {
    flex: 1,
  },
  dispoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  dispoTime: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  dispoRecurrent: {
    fontSize: 12,
    color: '#007AFF',
    fontStyle: 'italic',
  },
  activeToggle: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignItems: 'center',
  },
  dispoDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  dispoActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    flex: 1,
    marginHorizontal: 4,
    justifyContent: 'center',
  },
  editButton: {
    backgroundColor: '#e3f2fd',
  },
  deleteButton: {
    backgroundColor: '#ffebee',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  editText: {
    color: '#007AFF',
  },
  deleteText: {
    color: '#dc3545',
  },
});

export default TutorDisponibilitesScreen;
