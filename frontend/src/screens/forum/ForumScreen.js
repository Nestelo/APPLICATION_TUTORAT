import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import Header from '../../components/ui/Header';
import TextInputField from '../../components/ui/TextInputField';
import Button from '../../components/ui/Button';
import QuestionCard from '../../components/lists/QuestionCard';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import { getQuestions } from '../../api/forumService';

const ForumScreen = ({ navigation }) => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    setLoading(true);
    try {
      const data = await getQuestions({ search });
      setQuestions(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadQuestions();
  };

  return (
    <>
      <Header title="Forum" />
      <View style={styles.container}>
        <View style={styles.search}>
          <TextInputField
            placeholder="Rechercher une question..."
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={handleSearch}
          />
          <Button title="Rechercher" onPress={handleSearch} style={styles.searchButton} />
        </View>
        <Button
          title="Poser une question"
          onPress={() => navigation.navigate('PoserQuestion')}
          style={styles.addButton}
        />
        {loading ? (
          <LoadingSpinner />
        ) : questions.length === 0 ? (
          <EmptyState
            icon="chatbubbles-outline"
            message="Aucune question pour le moment"
            buttonTitle="Poser la première question"
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
  search: {
    flexDirection: 'row',
    padding: 12,
    alignItems: 'center',
  },
  searchButton: {
    marginLeft: 8,
  },
  addButton: {
    marginHorizontal: 12,
    marginBottom: 8,
  },
  list: {
    padding: 12,
  },
});

export default ForumScreen;