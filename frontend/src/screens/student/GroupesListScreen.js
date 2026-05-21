import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, Alert } from 'react-native';
import Header from '../../components/ui/Header';
import GroupeCard from '../../components/lists/GroupeCard';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import { getGroupes } from '../../api/tutorService';

const GroupesListScreen = ({ navigation, route }) => {
  const [groupes, setGroupes] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Paramètres de filtrage depuis la navigation
  const { matiere, niveau, search } = route.params || {};

  useEffect(() => {
    loadGroupes();
  }, [matiere, niveau, search]);

  const loadGroupes = async () => {
    try {
      setLoading(true);
      const params = {};
      
      // Ajouter les filtres
      if (matiere) params.matiere = matiere;
      if (niveau) params.niveau = niveau;
      if (search) params.search = search;
      
      // Par défaut, montrer les groupes disponibles
      params.places_disponibles = true;
      
      const result = await getGroupes(params);
      if (result.success) {
        setGroupes(result.data || []);
      } else {
        console.error('Erreur groupes:', result.error);
        setGroupes([]);
      }
    } catch (error) {
      console.error('Erreur loadGroupes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRejoindre = async (groupeId) => {
    try {
      Alert.alert(
        'Rejoindre un groupe',
        'Voulez-vous vraiment rejoindre ce groupe de tutorat ?',
        [
          { text: 'Annuler', style: 'cancel' },
          { 
            text: 'Rejoindre', 
            onPress: async () => {
              // Importer ici la fonction d'inscription
              const { inscrireGroupe } = require('../../api/tutorService');
              
              const result = await inscrireGroupe(groupeId);
              if (result.success) {
                Alert.alert(
                  'Succès !',
                  'Votre demande d\'inscription a été envoyée. Attendez la validation du tuteur.',
                  [{ text: 'OK' }]
                );
                loadGroupes(); // Recharger la liste
              } else {
                Alert.alert('Erreur', result.error || 'Impossible de rejoindre le groupe');
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Erreur rejoindre groupe:', error);
      Alert.alert('Erreur', 'Impossible de rejoindre le groupe');
    }
  };

  const renderGroupe = ({ item }) => (
    <GroupeCard
      groupe={item}
      onPress={() => navigation.navigate('GroupeDetail', { groupeId: item.id })}
      onRejoindre={() => handleRejoindre(item.id)}
      showJoinButton={true}
    />
  );

  return (
    <>
      <Header 
        title="Groupes disponibles" 
        showBack 
        onBackPress={() => navigation.goBack()} 
      />
      
      <View style={styles.container}>
        {loading ? (
          <LoadingSpinner />
        ) : groupes.length === 0 ? (
          <EmptyState
            icon="people-outline"
            message="Aucun groupe disponible"
            buttonTitle="Rechercher à nouveau"
            onButtonPress={() => navigation.navigate('StudentGroups')}
          />
        ) : (
          <FlatList
            data={groupes}
            renderItem={renderGroupe}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <EmptyState
                icon="people-outline"
                message="Aucun groupe trouvé"
                buttonTitle="Actualiser"
                onButtonPress={loadGroupes}
              />
            }
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
  list: {
    padding: 12,
  },
});

export default GroupesListScreen;
