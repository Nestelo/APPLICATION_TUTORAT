import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import Header from '../../components/ui/Header';
import TextInputField from '../../components/ui/TextInputField';
import Button from '../../components/ui/Button';
import TuteurCard from '../../components/lists/TuteurCard';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import CustomInput from '../../components/ui/Input';
import { getOffres } from '../../api/tutorService';

const RechercheTuteursScreen = ({ navigation }) => {
  const [tuteurs, setTuteurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    matiere: '',
    niveau: '',
  });

  useEffect(() => {
    loadTuteurs();
  }, []);

  const loadTuteurs = async () => {
    setLoading(true);
    try {
      const result = await getOffres({ ...filters, est_active: true });
      if (result.success) {
        setTuteurs(result.data || []);
      } else {
        console.error(result.error);
        setTuteurs([]);
      }
    } catch (error) {
      console.error(error);
      setTuteurs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadTuteurs();
  };

  const renderItem = ({ item }) => (
    <TuteurCard
      tuteur={item.tuteur_details}
      onPress={() => navigation.navigate('ProfilTuteur', { tuteurId: item.tuteur })}
    />
  );

  return (
    <>
      <Header title="Rechercher un tuteur" showBack onBackPress={() => navigation.goBack()} />
      <View style={styles.container}>
        <View style={styles.filters}>
          <CustomInput
            placeholder="Matière"
            value={filters.matiere}
            onChangeText={(text) => setFilters({ ...filters, matiere: text })}
          />
          <CustomInput
            placeholder="Niveau (L1, M2...)"
            value={filters.niveau}
            onChangeText={(text) => setFilters({ ...filters, niveau: text })}
          />
          <Button title="Rechercher" onPress={handleSearch} style={styles.searchButton} />
        </View>
        {loading ? (
          <LoadingSpinner />
        ) : tuteurs.length === 0 ? (
          <EmptyState
            icon="search-outline"
            message="Aucun tuteur trouvé"
          />
        ) : (
          <FlatList
            data={tuteurs}
            renderItem={renderItem}
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
  filters: {
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  searchButton: {
    marginTop: 8,
  },
  list: {
    padding: 12,
  },
});

export default RechercheTuteursScreen;