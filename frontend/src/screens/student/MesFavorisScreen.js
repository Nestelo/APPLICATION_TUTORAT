import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import Header from '../../components/ui/Header';
import RessourceCard from '../../components/lists/RessourceCard';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import { getFavoris } from '../../api/ressourceService';

const MesFavorisScreen = ({ navigation }) => {
  const [favoris, setFavoris] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFavoris();
  }, []);

  const loadFavoris = async () => {
    try {
      const data = await getFavoris();
      setFavoris(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <>
      <Header title="Mes favoris" showBack onBackPress={() => navigation.goBack()} />
      {favoris.length === 0 ? (
        <EmptyState
          icon="heart-outline"
          message="Aucun favori"
        />
      ) : (
        <FlatList
          data={favoris}
          renderItem={({ item }) => (
            <RessourceCard
              ressource={item.ressource_details}
              onPress={() => navigation.navigate('RessourceDetail', { id: item.ressource })}
            />
          )}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  list: {
    padding: 12,
  },
});

export default MesFavorisScreen;