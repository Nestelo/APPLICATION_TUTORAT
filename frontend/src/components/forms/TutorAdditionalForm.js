import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import CustomInput from '../ui/Input';

const TutorAdditionalForm = ({ setAdditionalInfo, loading }) => {
  const [tarif, setTarif] = useState('');
  const [matieres, setMatieres] = useState('');
  const [motivation, setMotivation] = useState('');

  useEffect(() => {
    setAdditionalInfo({ tarif, matieres, motivation });
  }, [tarif, matieres, motivation]);

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Informations complémentaires</Text>
      <CustomInput
        label="Tarif horaire (€) - laisser vide pour gratuit"
        value={tarif}
        onChangeText={setTarif}
        keyboardType="numeric"
        editable={!loading}
      />
      <CustomInput
        label="Matières d'expertise * (séparées par des virgules)"
        value={matieres}
        onChangeText={setMatieres}
        multiline
        editable={!loading}
      />
      <CustomInput
        label="Motivation"
        value={motivation}
        onChangeText={setMotivation}
        multiline
        numberOfLines={4}
        placeholder="Expliquez pourquoi vous souhaitez devenir tuteur..."
        editable={!loading}
      />
      {/* Optionnel : ajouter un composant de sélection de fichier pour le justificatif */}
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
});

export default TutorAdditionalForm;