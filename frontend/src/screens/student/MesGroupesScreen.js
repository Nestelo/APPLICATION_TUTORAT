import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import Header from '../../components/ui/Header';
import GroupeCard from '../../components/lists/GroupeCard';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import { getMesInscriptions } from '../../api/tutorService';

const MesGroupesScreen = ({ navigation }) => {
  const [groupes, setGroupes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGroupes();
  }, []);

  const loadGroupes = async () => {
    try {
      // On récupère les inscriptions de l'étudiant, puis on en extrait les groupes
      const result = await getMesInscriptions();
      if (result.success) {
        const inscriptions = result.data || [];
        const groupes = inscriptions
          .map((insc) => insc.groupe_details || insc.groupe)
          .filter(Boolean);
        setGroupes(groupes);
      } else {
        console.error(result.error);
        setGroupes([]);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <>
      <Header title="Mes groupes" showBack onBackPress={() => navigation.goBack()} />
      {groupes.length === 0 ? (
        <EmptyState
          icon="people-outline"
          message="Vous n'êtes dans aucun groupe"
          buttonTitle="Rechercher des groupes"
          onButtonPress={() => navigation.navigate('RechercheTuteurs')}
        />
      ) : (
        <FlatList
          data={groupes}
          renderItem={({ item }) => (
            <GroupeCard
              groupe={item}
              onPress={() => navigation.navigate('GroupeDetail', { groupeId: item.id })}
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

export default MesGroupesScreen;