import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, TextInput } from 'react-native';
import Header from '../../components/ui/Header';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { Picker } from '@react-native-picker/picker';
import { createOffre } from '../../api/tutorService';

const CreerOffreScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    titre: '',
    description: '',
    matiere: '',
    niveau: '',
    type: 'individuel',
    tarif: '',
  });
  const [submitting, setSubmitting] = useState(false);

  // Composant TextInput simple
  const TextInputField = ({ label, value, onChangeText, placeholder, multiline = false, numberOfLines = 1, keyboardType = 'default' }) => (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.inputMultiline]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        multiline={multiline}
        numberOfLines={numberOfLines}
        keyboardType={keyboardType}
      />
    </View>
  );

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
      await createOffre(formData);
      Alert.alert('Succès', 'Offre créée');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de créer l\'offre');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Header title="Créer une offre" showBack onBackPress={() => navigation.goBack()} />
      <ScrollView style={styles.container}>
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
        <TextInputField
          label="Niveau (ex: L1, M2)"
          value={formData.niveau}
          onChangeText={(text) => handleChange('niveau', text)}
        />
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
        <TextInputField
          label="Tarif horaire (FCFA) - laisser vide pour gratuit"
          value={formData.tarif}
          onChangeText={(text) => handleChange('tarif', text)}
          keyboardType="numeric"
        />
        <Button
          title="Créer l'offre"
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
    backgroundColor: '#fff',
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

export default CreerOffreScreen;