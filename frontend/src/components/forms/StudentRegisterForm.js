import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import CustomInput from '../ui/Input';
import Button from '../ui/Button';

const StudentRegisterForm = ({ onSubmit, loading }) => {
  const [formData, setFormData] = useState({
    email: '',
    nom: '',
    prenom: '',
    filiere: '',
    annee: '',
    centres_interet: '',
    bio: '',
    photo: null,
    password: '',
    password2: '',
  });
  const [errors, setErrors] = useState({});

  const handleChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
    if (errors[name]) setErrors({ ...errors, [name]: null });
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.email) newErrors.email = 'Email requis';
    if (!formData.nom) newErrors.nom = 'Nom requis';
    if (!formData.prenom) newErrors.prenom = 'Prénom requis';
    if (!formData.filiere) newErrors.filiere = 'Filière requise';
    if (!formData.password) newErrors.password = 'Mot de passe requis';
    if (formData.password !== formData.password2) newErrors.password2 = 'Les mots de passe ne correspondent pas';
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
        label="Email"
        value={formData.email}
        onChangeText={(text) => handleChange('email', text)}
        keyboardType="email-address"
        autoCapitalize="none"
        error={errors.email}
      />
      <CustomInput
        label="Nom"
        value={formData.nom}
        onChangeText={(text) => handleChange('nom', text)}
        error={errors.nom}
      />
      <CustomInput
        label="Prénom"
        value={formData.prenom}
        onChangeText={(text) => handleChange('prenom', text)}
        error={errors.prenom}
      />
      <CustomInput
        label="Filière"
        value={formData.filiere}
        onChangeText={(text) => handleChange('filiere', text)}
        error={errors.filiere}
      />
      <CustomInput
        label="Année (ex: L1, M2)"
        value={formData.annee}
        onChangeText={(text) => handleChange('annee', text)}
      />
      <CustomInput
        label="Centres d'intérêt (séparés par des virgules)"
        value={formData.centres_interet}
        onChangeText={(text) => handleChange('centres_interet', text)}
        multiline
      />
      <CustomInput
        label="Bio / Présentation"
        value={formData.bio}
        onChangeText={(text) => handleChange('bio', text)}
        multiline
        numberOfLines={3}
      />
      <CustomInput
        label="Mot de passe"
        value={formData.password}
        onChangeText={(text) => handleChange('password', text)}
        secureTextEntry
        error={errors.password}
      />
      <CustomInput
        label="Confirmer le mot de passe"
        value={formData.password2}
        onChangeText={(text) => handleChange('password2', text)}
        secureTextEntry
        error={errors.password2}
      />
      <Button
        title="S'inscrire"
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
  button: {
    marginTop: 20,
  },
});

export default StudentRegisterForm;