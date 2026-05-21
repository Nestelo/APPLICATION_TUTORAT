import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import Header from '../../components/ui/Header';
import PlanningHebdo from '../../components/calendar/PlanningHebdo';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { getStudentSeances } from '../../api/studentService';

const PlanningStudentScreen = ({ navigation }) => {
  const [seances, setSeances] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSeances();
  }, []);

  const loadSeances = async () => {
    try {
      const data = await getStudentSeances();
      setSeances(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <>
      <Header title="Mon planning" showBack onBackPress={() => navigation.goBack()} />
      <View style={styles.container}>
        <PlanningHebdo
          seances={seances}
          onCreneauPress={(seance) => navigation.navigate('SeanceDetail', { seanceId: seance.id })}
        />
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

export default PlanningStudentScreen;