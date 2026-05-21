import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import Header from '../../components/ui/Header';
import QuestionCard from '../../components/lists/QuestionCard';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import { getQuestions } from '../../api/forumService';

const MesQuestionsScreen = ({ navigation }) => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMesQuestions();
  }, []);

  const loadMesQuestions = async () => {
    try {
      // Endpoint avec filtre par auteur (à implémenter côté backend)
      const data = await getQuestions({ auteur: 'me' }); // ou un paramètre spécifique
      setQuestions(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header title="Mes questions" showBack onBackPress={() => navigation.goBack()} />
      <View style={styles.container}>
        {loading ? (
          <LoadingSpinner />
        ) : questions.length === 0 ? (
          <EmptyState
            icon="chatbubbles-outline"
            message="Vous n'avez posé aucune question"
            buttonTitle="Poser une question"
            onButtonPress={() => navigation.navigate('PoserQuestion')}
          />
        ) : (
          <FlatList
            data={questions}
            renderItem={({ item }) => (
              <QuestionCard
                question={item}
                onPress={() => navigation.navigate('QuestionDetail', { questionId: item.id })}
              />
            )}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.list}
          />
        )}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  list: {
    padding: 12,
  },
});

export default MesQuestionsScreen;