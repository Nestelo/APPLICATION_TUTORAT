import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Text } from 'react-native';
import CustomInput from '../ui/Input';
import Button from '../ui/Button';
import { Picker } from '@react-native-picker/picker';

const TutorApplyForm = ({ onSubmit, loading }) => {
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    role: 'tuteur', // tuteur ou enseignant
    tarif_horaire: '',
    matieres_maitrisees: '',
    motivation: '',
    justificatif: null, // pour l'upload de fichier
  });
  const [errors, setErrors] = useState({});

  const handleChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
    if (errors[name]) setErrors({ ...errors, [name]: null });
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.nom) newErrors.nom = 'Nom requis';
    if (!formData.prenom) newErrors.prenom = 'Prénom requis';
    if (!formData.email) newErrors.email = 'Email requis';
    if (!formData.matieres_maitrisees) newErrors.matieres_maitrisees = 'Matières requises';
    return newErrors;
  };

  const handleSubmit = () => {
    const newErrors = validate();
    if (Object.keys(newErrors).length === 0) {
      onSubmit(formData);
    } else {
      setErrors(newErrors);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <CustomInput
        label="Nom *"
        value={formData.nom}
        onChangeText={(text) => handleChange('nom', text)}
        error={errors.nom}
      />
      <CustomInput
        label="Prénom *"
        value={formData.prenom}
        onChangeText={(text) => handleChange('prenom', text)}
        error={errors.prenom}
      />
      <CustomInput
        label="Email *"
        value={formData.email}
        onChangeText={(text) => handleChange('email', text)}
        keyboardType="email-address"
        autoCapitalize="none"
        error={errors.email}
      />
      <View style={styles.pickerContainer}>
        <Text style={styles.label}>Rôle souhaité</Text>
        <Picker
          selectedValue={formData.role}
          onValueChange={(value) => handleChange('role', value)}
          style={styles.picker}
        >
          <Picker.Item label="Tuteur étudiant" value="tuteur" />
          <Picker.Item label="Enseignant" value="enseignant" />
        </Picker>
      </View>
      <CustomInput
        label="Tarif horaire (€) - laisser vide pour gratuit"
        value={formData.tarif_horaire}
        onChangeText={(text) => handleChange('tarif_horaire', text)}
        keyboardType="numeric"
      />
      <CustomInput
        label="Matières d'expertise * (séparées par des virgules)"
        value={formData.matieres_maitrisees}
        onChangeText={(text) => handleChange('matieres_maitrisees', text)}
        multiline
        error={errors.matieres_maitrisees}
      />
      <CustomInput
        label="Motivation"
        value={formData.motivation}
        onChangeText={(text) => handleChange('motivation', text)}
        multiline
        numberOfLines={4}
        placeholder="Expliquez pourquoi vous souhaitez devenir tuteur..."
      />
      {/* Pour l'upload de fichier, vous pouvez intégrer un composant comme expo-document-picker */}
      <View style={styles.filePlaceholder}>
        <Text style={styles.fileText}>Pièce justificative (relevé de notes, diplôme...)</Text>
        {/* Ici vous pouvez ajouter un bouton pour sélectionner un fichier */}
      </View>
      <Button
        title="Soumettre ma candidature"
        onPress={handleSubmit}
        loading={loading}
        style={styles.button}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
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
  filePlaceholder: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  fileText: {
    color: '#666',
  },
  button: {
    marginTop: 20,
  },
});

export default TutorApplyForm;