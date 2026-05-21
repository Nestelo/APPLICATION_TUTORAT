import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import Header from '../../components/ui/Header';
import TextInputField from '../../components/ui/TextInputField';
import Button from '../../components/ui/Button';
import RessourceCard from '../../components/lists/RessourceCard';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import CustomInput from '../../components/ui/Input';
import { getRessources } from '../../api/ressourceService';
import { useAuth } from '../../context/AuthContext';

const RessourcesScreen = ({ navigation }) => {
  const [ressources, setRessources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { user } = useAuth();

  const canCreate = user?.role === 'tuteur' || user?.role === 'enseignant' || user?.role === 'admin';

  useEffect(() => {
    loadRessources();
  }, []);

  const loadRessources = async () => {
    setLoading(true);
    try {
      const data = await getRessources({ search });
      setRessources(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => (
    <RessourceCard
      ressource={item}
      onPress={() => navigation.navigate('RessourceDetail', { id: item.id })}
    />
  );

  return (
    <>
      <Header title="Ressources" showBack onBackPress={() => navigation.goBack()} />
      <View style={styles.container}>
        <View style={styles.searchContainer}>
          <CustomInput
            placeholder="Rechercher..."
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={loadRessources}
            style={styles.searchInput}
          />
          <Button title="Rechercher" onPress={loadRessources} style={styles.searchButton} />
        </View>
        {canCreate && (
          <Button
            title="Ajouter une ressource"
            onPress={() => navigation.navigate('AjoutRessource')}
            style={styles.addButton}
          />
        )}
        {loading ? (
          <LoadingSpinner />
        ) : ressources.length === 0 ? (
          <EmptyState
            icon="document-text-outline"
            message="Aucune ressource trouvée"
            buttonTitle={canCreate ? "Ajouter une ressource" : undefined}
            onButtonPress={canCreate ? () => navigation.navigate('AjoutRessource') : undefined}
          />
        ) : (
          <FlatList
            data={ressources}
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
    backgroundColor: '#f5f5f5',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    marginRight: 8,
  },
  searchButton: {
    width: 100,
  },
  addButton: {
    margin: 12,
  },
  list: {
    padding: 12,
    paddingTop: 0,
  },
});

export default RessourcesScreen;