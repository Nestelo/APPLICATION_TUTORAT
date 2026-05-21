import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import Header from '../../components/ui/Header';
import TextInputField from '../../components/ui/TextInputField';
import Button from '../../components/ui/Button';
import RessourceCard from '../../components/lists/RessourceCard';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import CustomInput from '../../components/ui/Input';
import { API_BASE_URL } from '../../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const RessourceListScreen = ({ navigation }) => {
  const [ressources, setRessources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadRessources();
  }, [search]);

  const loadRessources = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const url = search 
        ? `${API_BASE_URL}/api/ressources/ressources/?search=${encodeURIComponent(search)}`
        : `${API_BASE_URL}/api/ressources/ressources/`;
      
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = response.ok ? await response.json() : [];
      setRessources(data);
    } catch (error) {
      console.error(error);
      setRessources([]);
    } finally {
      setLoading(false);
    }
  };

  const renderRessource = ({ item }) => (
    <RessourceCard
      ressource={item}
      onPress={() => navigation.navigate('RessourceDetail', { ressourceId: item.id })}
    />
  );

  if (loading) return <LoadingSpinner />;

  return (
    <>
      <Header title="Ressources" />
      <View style={styles.container}>
        <CustomInput
          placeholder="Rechercher une ressource..."
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={loadRessources}
          style={styles.search}
        />
        <Button
          title="Ajouter une ressource"
          onPress={() => navigation.navigate('AjoutRessource')}
          style={styles.createButton}
        />
        {ressources.length === 0 ? (
          <EmptyState
            title="Aucune ressource"
            message="Commencez par ajouter votre première ressource !"
            actionTitle="Ajouter une ressource"
            onAction={() => navigation.navigate('AjoutRessource')}
          />
        ) : (
          <FlatList
            data={ressources}
            renderItem={renderRessource}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.list}
            onRefresh={loadRessources}
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

export default RessourceListScreen;
