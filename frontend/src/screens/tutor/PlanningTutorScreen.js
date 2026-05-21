import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import Header from '../../components/ui/Header';
import PlanningHebdo from '../../components/calendar/PlanningHebdo';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { getSeances, getDisponibilites } from '../../api/tutorService';
import { useAuth } from '../../context/AuthContext';

const PlanningTutorScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [seances, setSeances] = useState([]);
  const [disponibilites, setDisponibilites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      console.log('📅 Chargement planning pour utilisateur:', user?.id);
      
      const [s, d] = await Promise.all([
        getSeances(),
        getDisponibilites(user?.id || 20), // Passer l'ID utilisateur
      ]);
      
      console.log('📅 Séances reçues:', s);
      console.log('📅 Disponibilités reçues:', d);
      
      setSeances(s.data || s || []); // Gérer les deux formats de réponse
      // Extraire le tableau results si la réponse est paginée
      const disposArray = d.results || d.data || d || [];
      setDisponibilites(disposArray);
    } catch (error) {
      console.error('❌ Erreur chargement planning:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header title="Mon planning" showBack onBackPress={() => navigation.goBack()} />
      <View style={styles.container}>
        {loading ? (
          <LoadingSpinner />
        ) : (
          <>
            <PlanningHebdo
              disponibilites={disponibilites}
              seances={seances}
              onCreneauPress={(item) => {
                if (item.type === 'seance') {
                  navigation.navigate('SeanceDetail', { seanceId: item.id });
                }
              }}
            />
            <Button
              title="Gérer mes disponibilités"
              onPress={() => navigation.navigate('Disponibilites')}
              style={styles.manageButton}
            />
          </>
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
  manageButton: {
    margin: 12,
  },
});

export default PlanningTutorScreen;