import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import Header from '../../components/ui/Header';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import TextInputField from '../../components/ui/TextInputField';
import { Picker } from '@react-native-picker/picker';
import { createGroupe } from '../../api/tutorService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../context/AuthContext';

const CreerGroupeScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nom: '',
    description: '',
    nombre_max_etudiants: 10,
  });

  const matieres = [
    'Mathématiques', 'Physique', 'Chimie', 'Biologie',
    'Informatique', 'Français', 'Anglais', 'Histoire',
    'Géographie', 'Économie', 'Droit', 'Marketing'
  ];

  const handleSubmit = async () => {
    if (!formData.nom.trim()) {
      Alert.alert('Erreur', 'Le nom du groupe est obligatoire');
      return;
    }

    try {
      setLoading(true);
      
      const token = await AsyncStorage.getItem('accessToken');
      // Utiliser l'ID de l'utilisateur connecté
      const userId = user?.id;

      const groupeData = {
        nom: formData.nom.trim(),
        description: formData.description.trim(),
        capacite_max: parseInt(formData.nombre_max_etudiants),
        createur: userId,
        prive: false,
        auto_inscription: true
      };

      console.log('🎯 Données groupe envoyées:', groupeData);

      await createGroupe(groupeData);
      Alert.alert('Succès', 'Groupe créé avec succès', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Erreur création groupe:', error);
      console.error('Détails erreur:', error.response?.data);
      Alert.alert('Erreur', `Impossible de créer le groupe: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header title="Créer un groupe" showBack onBackPress={() => navigation.goBack()} />
      <ScrollView style={styles.container}>
        <Card style={styles.formCard}>
          <TextInputField
            label="Nom du groupe *"
            value={formData.nom}
            onChangeText={(text) => setFormData(prev => ({ ...prev, nom: text }))}
            placeholder="Ex: Groupe de révision L1 Math"
            multiline
            numberOfLines={2}
          />

          <TextInputField
            label="Description"
            value={formData.description}
            onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
            placeholder="Description du groupe..."
            multiline
            numberOfLines={3}
          />

          <TextInputField
            label="Nombre maximum d'étudiants"
            value={formData.nombre_max_etudiants.toString()}
            onChangeText={(text) => setFormData(prev => ({ 
              ...prev, 
              nombre_max_etudiants: parseInt(text) || 10 
            }))}
            placeholder="10"
            keyboardType="numeric"
          />

          <View style={styles.buttonContainer}>
            <Button
              title="Créer le groupe"
              onPress={handleSubmit}
              loading={loading}
              style={styles.submitButton}
            />
            <Button
              title="Annuler"
              onPress={() => navigation.goBack()}
              variant="secondary"
              style={styles.cancelButton}
            />
          </View>
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
  formCard: {
    padding: 20,
  },
  pickerContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
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
    marginBottom: 20,
  },
  switchLabel: {
    fontSize: 16,
    color: '#333',
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

export default CreerGroupeScreen;