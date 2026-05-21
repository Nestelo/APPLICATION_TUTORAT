import React, { useState } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import Header from '../../components/ui/Header';
import TextInputField from '../../components/ui/TextInputField';
import Button from '../../components/ui/Button';
import RessourceCard from '../../components/lists/RessourceCard';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { getRessources } from '../../api/ressourceService';

const RechercheRessourcesScreen = ({ navigation }) => {
  const [ressources, setRessources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    titre: '',
    matiere: '',
    type: '',
  });

  const handleSearch = async () => {
    setLoading(true);
    try {
      const data = await getRessources(filters);
      setRessources(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header title="Recherche avancée" showBack onBackPress={() => navigation.goBack()} />
      <View style={styles.container}>
        <View style={styles.filters}>
          <TextInputField
            placeholder="Titre"
            value={filters.titre}
            onChangeText={(text) => setFilters({ ...filters, titre: text })}
          />
          <TextInputField
            placeholder="Matière"
            value={filters.matiere}
            onChangeText={(text) => setFilters({ ...filters, matiere: text })}
          />
          <TextInputField
            placeholder="Type (pdf, video, lien, image)"
            value={filters.type}
            onChangeText={(text) => setFilters({ ...filters, type: text })}
          />
          <Button title="Rechercher" onPress={handleSearch} style={styles.searchButton} />
        </View>
        {loading ? (
          <LoadingSpinner />
        ) : (
          <FlatList
            data={ressources}
            renderItem={({ item }) => (
              <RessourceCard
                ressource={item}
                onPress={() => navigation.navigate('RessourceDetail', { id: item.id })}
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

export default RechercheRessourcesScreen;