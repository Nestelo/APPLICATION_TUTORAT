import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import Header from '../../components/ui/Header';
import Button from '../../components/ui/Button';
import TextInputField from '../../components/ui/TextInputField';
import CustomInput from '../../components/ui/Input';
import { createEvaluation } from '../../api/tutorService';

const TutorReviewScreen = ({ navigation, route }) => {
  const { seanceId, tuteurId } = route.params || {};
  const [note, setNote] = useState('5');
  const [commentaire, setCommentaire] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    const value = parseInt(note, 10);
    if (Number.isNaN(value) || value < 1 || value > 5) {
      Alert.alert('Erreur', 'La note doit être entre 1 et 5.');
      return;
    }
    if (!seanceId || !tuteurId) {
      Alert.alert('Erreur', 'Informations de séance ou de tuteur manquantes.');
      return;
    }
    try {
      setLoading(true);
      const payload = {
        seance: seanceId,
        cible: tuteurId,
        note: value,
        commentaire,
      };
      const result = await createEvaluation(payload);
      if (result.success) {
        Alert.alert('Merci', 'Votre avis a été enregistré.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert('Erreur', result.error || "Impossible d'enregistrer l'avis.");
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Erreur', "Une erreur est survenue lors de l'enregistrement.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header
        title="Évaluer le tuteur"
        showBack
        onBackPress={() => navigation.goBack()}
      />
      <View style={styles.container}>
        <Text style={styles.label}>Note (1 à 5)</Text>
        <CustomInput
          keyboardType="numeric"
          value={note}
          onChangeText={setNote}
          placeholder="5"
        />
        <Text style={styles.label}>Commentaire (optionnel)</Text>
        <CustomInput
          multiline
          numberOfLines={4}
          value={commentaire}
          onChangeText={setCommentaire}
          placeholder="Votre avis sur la séance..."
          style={styles.textArea}
        />

        <Button
          title={loading ? 'Envoi...' : 'Envoyer mon avis'}
          onPress={handleSubmit}
          disabled={loading}
          style={styles.button}
        />
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 4,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  button: {
    marginTop: 16,
  },
});

export default TutorReviewScreen;

