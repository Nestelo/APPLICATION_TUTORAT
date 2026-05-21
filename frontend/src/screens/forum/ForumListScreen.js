import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import Header from '../../components/ui/Header';
import TextInputField from '../../components/ui/TextInputField';
import Button from '../../components/ui/Button';
import QuestionCard from '../../components/lists/QuestionCard';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import CustomInput from '../../components/ui/Input';
import { getQuestions } from '../../api/forumService';

const ForumListScreen = ({ navigation }) => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadQuestions();
  }, []);

  useEffect(() => {
    // Recherche automatique avec un délai pour éviter trop de requêtes
    const timeoutId = setTimeout(() => {
      if (search.trim() !== '') {
        loadQuestions(true); // Indiquer que c'est une recherche
      } else if (search === '') {
        loadQuestions(false); // Charger toutes les questions
      }
    }, 500); // 500ms de délai

    return () => clearTimeout(timeoutId);
  }, [search]);

  const loadQuestions = async (isSearch = false) => {
    if (isSearch) {
      setSearchLoading(true);
    } else {
      setLoading(true);
    }
    
    try {
      const result = await getQuestions({ search });
      console.log('Données brutes de l\'API:', result);
      // L'API retourne des données paginées avec .results
      const questionsData = result.success ? result.data.results || result.data : [];
      console.log('Questions extraites:', questionsData);
      // Filtrer les questions null/undefined
      const filteredQuestions = questionsData.filter(q => q != null);
      console.log('Questions filtrées:', filteredQuestions);
      setQuestions(filteredQuestions);
    } catch (error) {
      console.error(error);
      setQuestions([]);
    } finally {
      if (isSearch) {
        setSearchLoading(false);
      } else {
        setLoading(false);
      }
    }
  };

  const renderQuestion = ({ item }) => (
    <QuestionCard
      question={item}
      onPress={() => navigation.navigate('QuestionDetail', { questionId: item.id })}
    />
  );

  if (loading) return <LoadingSpinner />;

  return (
    <>
      <Header title="Forum" />
      <View style={styles.container}>
        <CustomInput
          placeholder="Rechercher une question..."
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={() => loadQuestions(true)}
          style={styles.search}
          loading={searchLoading}
        />
        <Button
          title="Poser une question"
          onPress={() => navigation.navigate('CreateQuestion')}
          style={styles.createButton}
        />
        {questions.length === 0 ? (
          <EmptyState
            title="Aucune question"
            message="Soyez le premier à poser une question !"
            actionTitle="Poser une question"
            onAction={() => navigation.navigate('CreateQuestion')}
          />
        ) : (
          <FlatList
            data={questions}
            renderItem={renderQuestion}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.list}
            onRefresh={loadQuestions}
            refreshing={loading}
          />
        )}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 12,
    backgroundColor: '#f5f5f5',
  },
  search: {
    marginBottom: 12,
  },
  createButton: {
    marginBottom: 12,
  },
  list: {
    paddingBottom: 20,
  },
});

export default ForumListScreen;
