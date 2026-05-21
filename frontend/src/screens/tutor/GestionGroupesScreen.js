import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, Alert } from 'react-native';
import Header from '../../components/ui/Header';
import Button from '../../components/ui/Button';
import GroupeCard from '../../components/lists/GroupeCard';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import { getGroupes, createSeance } from '../../api/tutorService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../context/AuthContext';

const GestionGroupesScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [groupes, setGroupes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGroupes();
  }, []);

  const loadGroupes = async () => {
    try {
      const result = await getGroupes({ createur: user?.id });
      if (result.success) {
        setGroupes(result.data);
      } else {
        console.error('Erreur:', result.error);
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLancerSeance = async (groupe) => {
    Alert.alert(
      'Lancer une séance',
      `Voulez-vous lancer une séance pour le groupe "${groupe.nom}" ?`,
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Lancer',
          onPress: async () => {
            try {
              // Créer une séance immédiate pour aujourd'hui
              const token = await AsyncStorage.getItem('accessToken');
              
              const seanceData = {
                groupe: groupe.id,
                tuteur: user?.id,
                date_heure_debut: new Date().toISOString(),
                date_heure_fin: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // +2 heures
                sujet: `Séance pour ${groupe.nom}`,
                description: 'Séance de tutorat',
                en_ligne: true,
                lien_visio: `https://meet.example.com/room-${groupe.id}-${Date.now()}`,
                statut: 'planifiee'
              };

              console.log('🎯 Données séance:', seanceData);

              const result = await createSeance(seanceData);
              
              if (result.success) {
                Alert.alert(
                  'Séance lancée !',
                  `La séance pour "${groupe.nom}" a été créée avec succès.\n\nLien de réunion: ${seanceData.lien_visio}`,
                  [
                    { text: 'OK' },
                    { 
                      text: 'Voir les séances', 
                      onPress: () => navigation.navigate('TutorSessions') 
                    }
                  ]
                );
              } else {
                Alert.alert('Erreur', result.error || 'Impossible de créer la séance');
              }
            } catch (error) {
              console.error('Erreur création séance:', error);
              Alert.alert('Erreur', 'Une erreur est survenue lors de la création de la séance');
            }
          },
        },
      ]
    );
  };

  return (
    <>
      <Header title="Mes groupes" showBack onBackPress={() => navigation.goBack()} />
      <View style={styles.container}>
        <Button
          title="Créer un groupe"
          onPress={() => navigation.navigate('CreerGroupe')}
          style={styles.addButton}
        />
        {loading ? (
          <LoadingSpinner />
        ) : groupes.length === 0 ? (
          <EmptyState
            icon="people-outline"
            message="Vous n'avez créé aucun groupe"
            buttonTitle="Créer un groupe"
            onButtonPress={() => navigation.navigate('CreerGroupe')}
          />
        ) : (
          <FlatList
            data={groupes}
            renderItem={({ item }) => (
              <GroupeCard
                groupe={item}
                onPress={() => navigation.navigate('GroupeDetail', { groupeId: item.id })}
                onLancerSeance={handleLancerSeance}
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
    backgroundColor: '#f5f5f5',
  },
  addButton: {
    margin: 12,
  },
  list: {
    padding: 12,
    paddingTop: 0,
  },
});

export default GestionGroupesScreen;
