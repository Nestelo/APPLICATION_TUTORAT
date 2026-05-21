import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, Alert } from 'react-native';
import Header from '../../components/ui/Header';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import { getOffres, deleteOffre } from '../../api/offreService';

const OffreItem = ({ offre, onPress, onDelete }) => (
  <Card onPress={onPress} style={styles.offreCard}>
    <View style={styles.offreHeader}>
      <Text style={styles.offreTitre}>{offre.titre}</Text>
      <Text style={[styles.offreStatut, offre.est_active ? styles.actif : styles.inactif]}>
        {offre.est_active ? 'Actif' : 'Inactif'}
      </Text>
    </View>
    <Text>Matière : {offre.matiere}</Text>
    <Text>Type : {offre.type}</Text>
    <Text>Tarif : {offre.tarif ? `${offre.tarif} FCFA/h` : 'Gratuit'}</Text>
    <View style={styles.actions}>
      <Button title="Modifier" variant="outline" size="small" onPress={onPress} />
      <Button title="Supprimer" variant="danger" size="small" onPress={onDelete} />
    </View>
  </Card>
);

const GestionOffresScreen = ({ navigation }) => {
  const [offres, setOffres] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOffres();
  }, []);

  const loadOffres = async () => {
    try {
      setLoading(true);
      const result = await getOffres();
      setOffres(result.success ? result.data : []);
    } catch (error) {
      console.error('Erreur loadOffres:', error);
      Alert.alert('Erreur', 'Impossible de charger les offres');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id) => {
    Alert.alert('Confirmation', 'Voulez-vous vraiment supprimer cette offre ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            const result = await deleteOffre(id);
            if (result.success) {
              setOffres(prev => Array.isArray(prev) ? prev.filter(o => o.id !== id) : []);
              Alert.alert('Succès', 'Offre supprimée avec succès');
            } else {
              Alert.alert('Erreur', 'Impossible de supprimer cette offre');
            }
          } catch (error) {
            console.error('Erreur suppression offre:', error);
            Alert.alert('Erreur', 'Impossible de supprimer cette offre');
          }
        },
      },
    ]);
  };

  return (
    <>
      <Header title="Gestion des offres" showBack onBackPress={() => navigation.goBack()} />
      <View style={styles.container}>
        <Button
          title="Créer une offre"
          onPress={() => navigation.navigate('CreerOffre')}
          style={styles.addButton}
        />
        {loading ? (
          <LoadingSpinner />
        ) : offres.length === 0 ? (
          <EmptyState
            icon="briefcase-outline"
            message="Vous n'avez pas encore créé d'offre"
            buttonTitle="Créer une offre"
            onButtonPress={() => navigation.navigate('CreerOffre')}
          />
        ) : (
          <FlatList
            data={offres}
            renderItem={({ item }) => (
              <OffreItem
                offre={item}
                onPress={() => navigation.navigate('EditOffre', { offreId: item.id })}
                onDelete={() => handleDelete(item.id)}
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
  offreCard: {
    marginVertical: 4,
  },
  offreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  offreTitre: {
    fontSize: 16,
    fontWeight: '600',
  },
  offreStatut: {
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  actif: {
    backgroundColor: '#d4edda',
    color: '#155724',
  },
  inactif: {
    backgroundColor: '#f8d7da',
    color: '#721c24',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
});

export default GestionOffresScreen;