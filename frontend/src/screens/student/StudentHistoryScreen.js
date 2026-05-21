import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Header from '../../components/ui/Header';
import Card from '../../components/ui/Card';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { getStudentHistory } from '../../api/studentService';
import { formatDate } from '../../utils/helpers';

export default function StudentHistoryScreen({ navigation }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const res = await getStudentHistory();
      setData(res);
    } catch (e) {
      console.log('Erreur historique étudiant', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading && !data) {
    return <LoadingSpinner />;
  }

  const seances = data?.seances || [];
  const ressources = data?.ressources || [];
  const questions = data?.questions || [];

  return (
    <>
      <Header
        title="Historique d'apprentissage"
        showBack
        onBackPress={() => navigation.goBack()}
      />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.sectionTitle}>Séances suivies</Text>
        {seances.length === 0 ? (
          <Text style={styles.empty}>Aucune séance pour le moment.</Text>
        ) : (
          seances.map((s) => (
            <Card key={s.id} style={styles.itemCard}>
              <Text style={styles.itemTitle}>{s.sujet}</Text>
              <Text>{formatDate(s.date_heure_debut)}</Text>
              <Text style={styles.itemSub}>{s.matiere}</Text>
            </Card>
          ))
        )}

        <Text style={styles.sectionTitle}>Ressources consultées</Text>
        {ressources.length === 0 ? (
          <Text style={styles.empty}>Aucune ressource consultée.</Text>
        ) : (
          ressources.map((r) => (
            <Card key={r.id} style={styles.itemCard}>
              <Text style={styles.itemTitle}>{r.titre}</Text>
              <Text style={styles.itemSub}>{r.matiere} · {r.niveau}</Text>
            </Card>
          ))
        )}

        <Text style={styles.sectionTitle}>Questions posées</Text>
        {questions.length === 0 ? (
          <Text style={styles.empty}>Aucune question posée.</Text>
        ) : (
          questions.map((q) => (
            <Card key={q.id} style={styles.itemCard}>
              <Text style={styles.itemTitle}>{q.titre}</Text>
              <Text style={styles.itemSub}>{formatDate(q.date_publication)}</Text>
            </Card>
          ))
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  empty: {
    fontSize: 14,
    color: '#777',
  },
  itemCard: {
    marginBottom: 8,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  itemSub: {
    fontSize: 13,
    color: '#666',
  },
});

