import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import CustomInput from '../ui/Input';
import { Picker } from '@react-native-picker/picker';

const TutorGeneralForm = ({ setGeneralInfo, loading }) => {
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [role, setRole] = useState('tuteur');

  useEffect(() => {
    setGeneralInfo({ nom, prenom, email, password, password2, role });
  }, [nom, prenom, email, password, password2, role]);

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Informations générales</Text>
      <CustomInput
        label="Nom *"
        value={nom}
        onChangeText={setNom}
        editable={!loading}
      />
      <CustomInput
        label="Prénom *"
        value={prenom}
        onChangeText={setPrenom}
        editable={!loading}
      />
      <CustomInput
        label="Email *"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        editable={!loading}
      />
      <CustomInput
        label="Mot de passe *"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        editable={!loading}
      />
      <CustomInput
        label="Confirmer le mot de passe *"
        value={password2}
        onChangeText={setPassword2}
        secureTextEntry
        editable={!loading}
      />
      <View style={styles.pickerContainer}>
        <Text style={styles.label}>Rôle souhaité</Text>
        <Picker
          selectedValue={role}
          onValueChange={(value) => setRole(value)}
          style={styles.picker}
          enabled={!loading}
        >
          <Picker.Item label="Tuteur étudiant" value="tuteur" />
          <Picker.Item label="Enseignant" value="enseignant" />
        </Picker>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#0b3d6d',
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
});

export default TutorGeneralForm;