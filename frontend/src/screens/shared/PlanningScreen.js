import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import Header from '../../components/ui/Header';
import PlanningHebdo from '../../components/calendar/PlanningHebdo';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { getSeances } from '../../api/tutorService';
import { useAuth } from '../../context/AuthContext';

const PlanningScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [seances, setSeances] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSeances();
  }, []);

  const loadSeances = async () => {
    try {
      // Récupère les séances selon le rôle (backend doit filtrer)
      const data = await getSeances();
      setSeances(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header title="Planning" showBack onBackPress={() => navigation.goBack()} />
      <View style={styles.container}>
        {loading ? (
          <LoadingSpinner />
        ) : (
          <PlanningHebdo
            seances={seances}
            onCreneauPress={(seance) => {
              if (user.role === 'etudiant') {
                navigation.navigate('PlanningStudent', { seanceId: seance.id });
              } else if (user.role === 'tuteur' || user.role === 'enseignant') {
                navigation.navigate('PlanningTutor', { seanceId: seance.id });
              }
            }}
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
});

export default PlanningScreen;