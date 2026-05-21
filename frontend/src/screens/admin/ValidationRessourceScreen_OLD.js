import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import Header from '../../components/ui/Header';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { getRessource, updateRessource } from '../../api/ressourceService';

const ValidationRessourceScreen = ({ navigation, route }) => {
  const ressourceId = route?.params?.ressourceId;
  const [ressource, setRessource] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRessource();
  }, []);

  const loadRessource = async () => {
    try {
      const data = await getRessource(ressourceId);
      setRessource(data);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de charger la ressource');
    } finally {
      setLoading(false);
    }
  };

  const handleValidation = async (statut) => {
    try {
      await updateRessource(ressourceId, { statut });
      Alert.alert('Succès', `Ressource ${statut === 'publie' ? 'publiée' : 'rejetée'}`);
      navigation.goBack();
    } catch (error) {
      Alert.alert('Erreur', 'Échec de la mise à jour');
    }
  };

  if (loading) return <LoadingSpinner />;

  if (!ressource) {
    return (
      <>
        <Header title="Validation" showBack onBackPress={() => navigation.goBack()} />
        <View style={styles.container}>
          <Card>
            <Text>Aucune ressource trouvée ou erreur de chargement.</Text>
          </Card>
        </View>
      </>
    );
  }

  return (
    <>
      <Header title="Validation" showBack onBackPress={() => navigation.goBack()} />
      <ScrollView style={styles.container}>
        <Card>
          <Text style={styles.titre}>{ressource.titre}</Text>
          <Text>Auteur : {ressource.auteur_details?.prenom} {ressource.auteur_details?.nom}</Text>
          <Text>Matière : {ressource.matiere}</Text>
          <Text>Type : {ressource.type_fichier}</Text>
          <Text>Description : {ressource.description}</Text>
          {ressource.fichier && <Text>Fichier : {ressource.fichier}</Text>}
          {ressource.lien_externe && <Text>Lien : {ressource.lien_externe}</Text>}
        </Card>
        <View style={styles.actions}>
          <Button title="Publier" onPress={() => handleValidation('publie')} style={styles.button} />
          <Button title="Rejeter" variant="danger" onPress={() => handleValidation('rejete')} style={styles.button} />
        </View>
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
  titre: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  button: {
    flex: 1,
    marginHorizontal: 8,
  },
});

export default ValidationRessourceScreen;