import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import Header from '../../components/ui/Header';
import TextInputField from '../../components/ui/TextInputField';
import Button from '../../components/ui/Button';
import { createReponse } from '../../api/forumService';

const RepondreScreen = ({ navigation, route }) => {
  const { questionId } = route.params;
  const [contenu, setContenu] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!contenu.trim()) return;
    setSubmitting(true);
    try {
      await createReponse(questionId, contenu);
      Alert.alert('Succès', 'Réponse ajoutée');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'ajouter la réponse');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Header title="Répondre" showBack onBackPress={() => navigation.goBack()} />
      <View style={styles.container}>
        <TextInputField
          label="Votre réponse"
          value={contenu}
          onChangeText={setContenu}
          multiline
          numberOfLines={5}
        />
        <Button
          title="Publier"
          onPress={handleSubmit}
          loading={submitting}
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
  button: {
    marginTop: 20,
  },
});

export default RepondreScreen;