import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Text, Switch } from 'react-native';
import Header from '../../components/ui/Header';
import Button from '../../components/ui/Button';
import TextInputField from '../../components/ui/TextInputField';
import { Picker } from '@react-native-picker/picker';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { getOffre, updateOffre } from '../../api/tutorService';
import { useAuth } from '../../context/AuthContext';

const EditOffreScreen = ({ navigation, route }) => {
  const { offreId } = route.params || {};
  const { user } = useAuth();

  // Vérification de sécurité
  if (!offreId) {
    Alert.alert('Erreur', 'ID d\'offre non fourni');
    navigation.goBack();
    return null;
  }

  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadOffre();
  }, []);

  const loadOffre = async () => {
    try {
      const result = await getOffre(offreId);
      if (!result.success || !result.data) {
        Alert.alert('Erreur', 'Offre non trouvée');
        navigation.goBack();
        return;
      }
      const data = result.data;
      setFormData({
        titre: data.titre || '',
        description: data.description || '',
        matiere: data.matiere || '',
        niveau: data.niveau || '',
        type: data.type || 'individuel',
        tarif: data.tarif ? data.tarif.toString() : '',
        tarif_reduction: data.tarif_reduction ? data.tarif_reduction.toString() : '',
        gratuit: data.gratuit || false,
        duree_session: data.duree_session?.toString() || '60',
        nombre_places: data.nombre_places?.toString() || '1',
        planning_flexible: data.planning_flexible !== undefined ? data.planning_flexible : true,
        mode_planning: data.mode_planning || 'manuel',
        en_ligne: data.en_ligne !== undefined ? data.en_ligne : true,
        presentiel: data.presentiel || false,
        lieu: data.lieu || '',
        lien_visio: data.lien_visio || '',
        est_active: data.est_active !== undefined ? data.est_active : true,
        tuteur: data.tuteur?.id || user?.id,
      });
    } catch (error) {
      console.error('Erreur chargement offre:', error);
      Alert.alert('Erreur', 'Impossible de charger l\'offre');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async () => {
    if (!formData.titre || !formData.matiere) {
      Alert.alert('Erreur', 'Veuillez remplir les champs obligatoires');
      return;
    }
    setSubmitting(true);
    try {
      // Convertir tous les champs numériques
      const dataToSend = {
        ...formData,
        tarif: formData.tarif ? parseFloat(formData.tarif) : null,
        tarif_reduction: formData.tarif_reduction ? parseFloat(formData.tarif_reduction) : null,
        duree_session: formData.duree_session ? parseInt(formData.duree_session) : 60,
        nombre_places: formData.nombre_places ? parseInt(formData.nombre_places) : 1,
      };
      
      console.log(' Données envoyées:', dataToSend);
      
      const result = await updateOffre(offreId, dataToSend);
      if (result.success) {
        Alert.alert(' Succès', 'Offre mise à jour avec succès');
        navigation.goBack();
      } else {
        Alert.alert(' Erreur', result.error || 'Impossible de mettre à jour');
      }
    } catch (error) {
      console.error(' Erreur mise à jour offre:', error);
      Alert.alert(' Erreur', 'Impossible de mettre à jour');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <>
      <Header title="Modifier l'offre" showBack onBackPress={() => navigation.goBack()} />
      <ScrollView style={styles.container}>
        {/* Section Informations de base */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📝 Informations de base</Text>
          
          <TextInputField
            label="Titre *"
            value={formData.titre}
            onChangeText={(text) => handleChange('titre', text)}
          />
          
          <TextInputField
            label="Description"
            value={formData.description}
            onChangeText={(text) => handleChange('description', text)}
            multiline
            numberOfLines={3}
          />
          
          <TextInputField
            label="Matière *"
            value={formData.matiere}
            onChangeText={(text) => handleChange('matiere', text)}
          />
          
          <View style={styles.pickerContainer}>
            <Text style={styles.label}>Niveau *</Text>
            <Picker
              selectedValue={formData.niveau}
              onValueChange={(value) => handleChange('niveau', value)}
              style={styles.picker}
            >
              <Picker.Item label="Licence 1ère année" value="L1" />
              <Picker.Item label="Licence 2ème année" value="L2" />
              <Picker.Item label="Licence 3ème année" value="L3" />
              <Picker.Item label="Master 1ère année" value="M1" />
              <Picker.Item label="Master 2ème année" value="M2" />
            </Picker>
          </View>
          
          <View style={styles.pickerContainer}>
            <Text style={styles.label}>Type</Text>
            <Picker
              selectedValue={formData.type}
              onValueChange={(value) => handleChange('type', value)}
              style={styles.picker}
            >
              <Picker.Item label="Individuel" value="individuel" />
              <Picker.Item label="Groupe" value="groupe" />
            </Picker>
          </View>
        </View>

        {/* Section Tarification */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💰 Tarification</Text>
          
          <View style={styles.switchContainer}>
            <Text style={styles.label}>Offre gratuite</Text>
            <Switch
              value={formData.gratuit}
              onValueChange={(value) => handleChange('gratuit', value)}
            />
          </View>
          
          {!formData.gratuit && (
            <>
              <TextInputField
                label="Tarif horaire (FCFA)"
                value={formData.tarif}
                onChangeText={(text) => handleChange('tarif', text)}
                keyboardType="numeric"
              />
              
              <TextInputField
                label="Tarif réduit (FCFA) - optionnel"
                value={formData.tarif_reduction}
                onChangeText={(text) => handleChange('tarif_reduction', text)}
                keyboardType="numeric"
              />
            </>
          )}
        </View>

        {/* Session et Planning */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⏰ Session et Planning</Text>
          
          <TextInputField
            label="Durée de la session (minutes)"
            value={formData.duree_session}
            onChangeText={(text) => handleChange('duree_session', text)}
            keyboardType="numeric"
          />
          
          {formData.type === 'groupe' && (
            <TextInputField
              label="Nombre de places"
              value={formData.nombre_places}
              onChangeText={(text) => handleChange('nombre_places', text)}
              keyboardType="numeric"
            />
          )}
          
          <View style={styles.switchContainer}>
            <Text style={styles.label}>Planning flexible</Text>
            <Switch
              value={formData.planning_flexible}
              onValueChange={(value) => handleChange('planning_flexible', value)}
            />
          </View>
          
          <View style={styles.pickerContainer}>
            <Text style={styles.label}>Mode de planning</Text>
            <Picker
              selectedValue={formData.mode_planning}
              onValueChange={(value) => handleChange('mode_planning', value)}
              style={styles.picker}
            >
              <Picker.Item label="Manuel" value="manuel" />
              <Picker.Item label="Basé sur disponibilités" value="auto_dispos" />
              <Picker.Item label="Répétitif" value="repetitif" />
            </Picker>
          </View>
        </View>

        {/* Section Modalités */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📍 Modalités</Text>
          
          <View style={styles.switchContainer}>
            <Text style={styles.label}>En ligne</Text>
            <Switch
              value={formData.en_ligne}
              onValueChange={(value) => handleChange('en_ligne', value)}
            />
          </View>
          
          <View style={styles.switchContainer}>
            <Text style={styles.label}>Présentiel</Text>
            <Switch
              value={formData.presentiel}
              onValueChange={(value) => handleChange('presentiel', value)}
            />
          </View>
          
          {formData.presentiel && (
            <TextInputField
              label="Lieu"
              value={formData.lieu}
              onChangeText={(text) => handleChange('lieu', text)}
            />
          )}
          
          {formData.en_ligne && (
            <TextInputField
              label="Lien de visioconférence"
              value={formData.lien_visio}
              onChangeText={(text) => handleChange('lien_visio', text)}
              placeholder="https://..."
            />
          )}
        </View>

        {/* Section Statut */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎯 Statut</Text>
          
          <View style={styles.switchContainer}>
            <Text style={styles.label}>Offre active</Text>
            <Switch
              value={formData.est_active}
              onValueChange={(value) => handleChange('est_active', value)}
            />
          </View>
        </View>

        <Button
          title="💾 Enregistrer les modifications"
          onPress={handleSubmit}
          loading={submitting}
          style={styles.button}
        />
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f8f9fa',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#3498db',
    paddingBottom: 8,
  },
  pickerContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
    color: '#333',
  },
  picker: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 8,
  },
  button: {
    marginVertical: 20,
  },
  inputContainer: {
    marginBottom: 16,
    width: '100%',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  inputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
});

export default EditOffreScreen;