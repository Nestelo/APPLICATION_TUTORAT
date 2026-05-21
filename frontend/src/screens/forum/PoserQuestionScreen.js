import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import Header from '../../components/ui/Header';
import QuestionForm from '../../components/forms/QuestionForm';
import { createQuestion } from '../../api/forumService';

const PoserQuestionScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (formData) => {
    setLoading(true);
    try {
      const newQuestion = await createQuestion(formData);
      Alert.alert('Succès', 'Votre question a été publiée');
      navigation.navigate('QuestionDetail', { questionId: newQuestion.id });
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de publier la question');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header title="Poser une question" showBack onBackPress={() => navigation.goBack()} />
      <View style={styles.container}>
        <QuestionForm onSubmit={handleSubmit} loading={loading} />
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});

export default PoserQuestionScreen;