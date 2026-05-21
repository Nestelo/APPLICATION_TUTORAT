import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Image, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import Header from '../../components/ui/Header';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { API_BASE_URL } from '../../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

const TutorProfileScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    photo: null,
    biographie: '',
    matieres_enseignees: [],
    niveau_enseignement: '',
    experience: '',
    disponibilites: {
      lundi: { matin: false, apres_midi: false, soir: false },
      mardi: { matin: false, apres_midi: false, soir: false },
      mercredi: { matin: false, apres_midi: false, soir: false },
      jeudi: { matin: false, apres_midi: false, soir: false },
      vendredi: { matin: false, apres_midi: false, soir: false },
      samedi: { matin: false, apres_midi: false, soir: false },
      dimanche: { matin: false, apres_midi: false, soir: false }
    },
    competences: [],
    horaires: {
      debut_matin: '08:00',
      fin_matin: '12:00',
      debut_apres_midi: '14:00',
      fin_apres_midi: '18:00'
    }
  });

  const [matieresDisponibles] = useState([
    'Mathématiques', 'Physique', 'Chimie', 'Biologie', 'Français', 'Anglais',
    'Espagnol', 'Histoire', 'Géographie', 'Philosophie', 'Économie', 'Informatique'
  ]);

  const [niveauxDisponibles] = useState([
    'Primaire', 'Collège', 'Lycée', 'Université', 'Formation professionnelle'
  ]);

  const [competencesDisponibles] = useState([
    'Pédagogie adaptée', 'Gestion de groupe', 'Évaluation formative',
    'Utilisation du numérique', 'Communication', 'Patience', 'Créativité',
    'Organisation', 'Résolution de problèmes', 'Leadership'
  ]);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}/api/tutor/profile/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data);
      }
    } catch (error) {
      console.error('Erreur chargement profil:', error);
      Alert.alert('Erreur', 'Impossible de charger votre profil');
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled) {
        setProfile(prev => ({ ...prev, photo: result.assets[0].uri }));
      }
    } catch (error) {
      console.error('Erreur sélection image:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner une image');
    }
  };

  const toggleDisponibilite = (jour, periode) => {
    setProfile(prev => ({
      ...prev,
      disponibilites: {
        ...prev.disponibilites,
        [jour]: {
          ...prev.disponibilites[jour],
          [periode]: !prev.disponibilites[jour][periode]
        }
      }
    }));
  };

  const toggleCompetence = (competence) => {
    setProfile(prev => ({
      ...prev,
      competences: Array.isArray(prev.competences) && prev.competences.includes(competence)
        ? prev.competences.filter(c => c !== competence)
        : [...(Array.isArray(prev.competences) ? prev.competences : []), competence]
    }));
  };

  const toggleMatiere = (matiere) => {
    setProfile(prev => ({
      ...prev,
      matieres_enseignees: Array.isArray(prev.matieres_enseignees) && prev.matieres_enseignees.includes(matiere)
        ? prev.matieres_enseignees.filter(m => m !== matiere)
        : [...(Array.isArray(prev.matieres_enseignees) ? prev.matieres_enseignees : []), matiere]
    }));
  };

  const saveProfile = async () => {
    try {
      setSaving(true);
      const token = await AsyncStorage.getItem('accessToken');
      
      const formData = new FormData();
      if (profile.photo) {
        formData.append('photo', {
          uri: profile.photo,
          type: 'image/jpeg',
          name: 'profile.jpg'
        });
      }
      
      formData.append('biographie', profile.biographie);
      formData.append('matieres_enseignees', JSON.stringify(profile.matieres_enseignees));
      formData.append('niveau_enseignement', profile.niveau_enseignement);
      formData.append('experience', profile.experience);
      formData.append('disponibilites', JSON.stringify(profile.disponibilites));
      formData.append('competences', JSON.stringify(profile.competences));
      formData.append('horaires', JSON.stringify(profile.horaires));

      const response = await fetch(`${API_BASE_URL}/api/tutor/profile/update/`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (response.ok) {
        Alert.alert('Succès', 'Votre profil a été mis à jour avec succès');
      } else {
        const error = await response.json();
        Alert.alert('Erreur', error.message || 'Impossible de mettre à jour votre profil');
      }
    } catch (error) {
      console.error('Erreur sauvegarde profil:', error);
      Alert.alert('Erreur', 'Impossible de mettre à jour votre profil');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <Header title="Mon profil" showBack onBackPress={() => navigation.goBack()} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Chargement du profil...</Text>
        </View>
      </>
    );
  }

  return (
    <>
      <Header title="Mon profil" showBack onBackPress={() => navigation.goBack()} />
      <ScrollView style={styles.container}>
        <Card style={styles.photoCard}>
          <View style={styles.photoContainer}>
            {profile.photo ? (
              <Image source={{ uri: profile.photo }} style={styles.photo} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Ionicons name="person" size={50} color="#ccc" />
              </View>
            )}
            <TouchableOpacity style={styles.changePhotoButton} onPress={pickImage}>
              <Ionicons name="camera" size={20} color="#007AFF" />
              <Text style={styles.changePhotoText}>Changer</Text>
            </TouchableOpacity>
          </View>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>📝 Biographie</Text>
          <Text style={styles.label}>Parlez-nous de vous et de votre approche pédagogique</Text>
          <TextInput
            style={styles.textArea}
            multiline
            numberOfLines={4}
            value={profile.biographie}
            onChangeText={(text) => setProfile(prev => ({ ...prev, biographie: text }))}
            placeholder="Décrivez votre expérience et votre méthode d'enseignement..."
          />
        </Card>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>📚 Matières enseignées</Text>
          <View style={styles.tagsContainer}>
            {matieresDisponibles.map((matiere, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.tag,
                  profile.matieres_enseignees.includes(matiere) && styles.tagSelected
                ]}
                onPress={() => toggleMatiere(matiere)}
              >
                <Text style={[
                  styles.tagText,
                  profile.matieres_enseignees.includes(matiere) && styles.tagTextSelected
                ]}>{matiere}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>🎓 Niveau d'enseignement</Text>
          <View style={styles.niveauxContainer}>
            {niveauxDisponibles.map((niveau, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.niveauButton,
                  profile.niveau_enseignement === niveau && styles.niveauSelected
                ]}
                onPress={() => setProfile(prev => ({ ...prev, niveau_enseignement: niveau }))}
              >
                <Text style={[
                  styles.niveauText,
                  profile.niveau_enseignement === niveau && styles.niveauTextSelected
                ]}>{niveau}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>💼 Expérience</Text>
          <Text style={styles.label}>Années d'expérience</Text>
          <TextInput
            style={styles.input}
            value={profile.experience}
            onChangeText={(text) => setProfile(prev => ({ ...prev, experience: text }))}
            placeholder="Ex: 3 ans"
          />
        </Card>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>🏆 Compétences</Text>
          <View style={styles.tagsContainer}>
            {competencesDisponibles.map((competence, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.tag,
                  profile.competences.includes(competence) && styles.tagSelected
                ]}
                onPress={() => toggleCompetence(competence)}
              >
                <Text style={[
                  styles.tagText,
                  profile.competences.includes(competence) && styles.tagTextSelected
                ]}>{competence}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>⏰ Disponibilités</Text>
          <View style={styles.disponibilitesContainer}>
            {Object.entries(profile.disponibilites).map(([jour, periodes]) => (
              <View key={jour} style={styles.jourContainer}>
                <Text style={styles.jourText}>{jour.charAt(0).toUpperCase() + jour.slice(1)}</Text>
                <View style={styles.periodesContainer}>
                  {Object.entries(periodes).map(([periode, disponible]) => (
                    <TouchableOpacity
                      key={periode}
                      style={[
                        styles.periodeButton,
                        disponible && styles.periodeSelected
                      ]}
                      onPress={() => toggleDisponibilite(jour, periode)}
                    >
                      <Text style={[
                        styles.periodeText,
                        disponible && styles.periodeTextSelected
                      ]}>{periode.replace('_', ' ').charAt(0).toUpperCase()}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}
          </View>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>🕐 Horaires préférés</Text>
          <View style={styles.horairesContainer}>
            <View style={styles.horaireRow}>
              <Text style={styles.horaireLabel}>Matin</Text>
              <Text style={styles.horaireInput}>{profile.horaires.debut_matin} - {profile.horaires.fin_matin}</Text>
            </View>
            <View style={styles.horaireRow}>
              <Text style={styles.horaireLabel}>Après-midi</Text>
              <Text style={styles.horaireInput}>{profile.horaires.debut_apres_midi} - {profile.horaires.fin_apres_midi}</Text>
            </View>
          </View>
        </Card>

        <View style={styles.buttonContainer}>
          <Button
            title={saving ? "Sauvegarde en cours..." : "Sauvegarder le profil"}
            onPress={saveProfile}
            loading={saving}
            style={styles.saveButton}
          />
        </View>
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
  photoCard: {
    alignItems: 'center',
    padding: 20,
  },
  photoContainer: {
    alignItems: 'center',
    position: 'relative',
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#007AFF',
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ddd',
  },
  changePhotoButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 15,
  },
  changePhotoText: {
    color: '#fff',
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '500',
  },
  card: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    backgroundColor: '#fff',
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
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
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
  niveauxContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  niveauButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  niveauSelected: {
    backgroundColor: '#28a745',
    borderColor: '#28a745',
  },
  niveauText: {
    fontSize: 14,
    color: '#666',
  },
  niveauTextSelected: {
    color: '#fff',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  disponibilitesContainer: {
    gap: 12,
  },
  jourContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  jourText: {
    width: 80,
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  periodesContainer: {
    flexDirection: 'row',
    gap: 8,
    flex: 1,
  },
  periodeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  periodeSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  periodeText: {
    fontSize: 12,
    color: '#666',
  },
  periodeTextSelected: {
    color: '#fff',
  },
  horairesContainer: {
    gap: 12,
  },
  horaireRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  horaireLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  horaireInput: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  buttonContainer: {
    marginTop: 20,
    marginBottom: 40,
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
});

export default TutorProfileScreen;
