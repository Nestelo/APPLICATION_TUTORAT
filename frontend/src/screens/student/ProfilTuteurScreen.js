import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import Header from '../../components/ui/Header';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { getOffre } from '../../api/tutorService';
import { formatDate } from '../../utils/helpers';

const ProfilTuteurScreen = ({ navigation, route }) => {
  const { tuteurId } = route.params;
  const [tuteur, setTuteur] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTuteur();
  }, []);

  const loadTuteur = async () => {
    try {
      // On suppose qu'on récupère les infos via une offre
      const offre = await getOffre(tuteurId);
      setTuteur(offre.tuteur_details);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de charger le profil');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <>
      <Header title="Profil du tuteur" showBack onBackPress={() => navigation.goBack()} />
      <ScrollView style={styles.container}>
        <Card>
          <Text style={styles.name}>{tuteur?.prenom} {tuteur?.nom}</Text>
          <Text style={styles.bio}>{tuteur?.bio || 'Aucune bio'}</Text>
        </Card>
        <Card>
          <Text style={styles.sectionTitle}>Matières</Text>
          <Text>{tuteur?.matieres_maitrisees}</Text>
        </Card>
        {tuteur?.tarif_horaire && (
          <Card>
            <Text style={styles.sectionTitle}>Tarif</Text>
            <Text>{tuteur.tarif_horaire} €/h</Text>
          </Card>
        )}
        <Button
          title="Demander une séance"
          onPress={() => navigation.navigate('DemandeSeance', { tuteurId })}
          style={styles.button}
        />
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 12,
    backgroundColor: '#f5f5f5',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  bio: {
    fontSize: 16,
    color: '#666',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  button: {
    marginVertical: 16,
  },
});

export default ProfilTuteurScreen;