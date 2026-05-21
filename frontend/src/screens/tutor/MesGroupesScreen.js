import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, Alert } from 'react-native';
import Header from '../../components/ui/Header';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import { getGroupes } from '../../api/tutorService';

const GroupeItem = ({ groupe, onPress, onDelete }) => (
  <Card style={styles.groupeCard}>
    <View style={styles.groupeHeader}>
      <View style={styles.groupeInfo}>
        <Text style={styles.groupeNom}>{groupe.nom}</Text>
        <Text style={styles.groupeMatiere}>{groupe.matiere}</Text>
        <Text style={styles.groupeNiveau}>{groupe.niveau}</Text>
      </View>
      <View style={styles.groupeActions}>
        <Button title="Voir" variant="outline" size="small" onPress={onPress} />
        <Button title="Supprimer" variant="danger" size="small" onPress={onDelete} />
      </View>
    </View>
    <Text style={styles.groupeDescription} numberOfLines={2}>
      {groupe.description || 'Aucune description'}
    </Text>
    <View style={styles.groupeStats}>
      <Text style={styles.statText}>
        {groupe.nombre_etudiants || 0} étudiant{(groupe.nombre_etudiants || 0) > 1 ? 's' : ''}
      </Text>
      <Text style={styles.statText}>
        {groupe.nombre_seances || 0} séance{(groupe.nombre_seances || 0) > 1 ? 's' : ''}
      </Text>
    </View>
  </Card>
);

const MesGroupesScreen = ({ navigation }) => {
  const [groupes, setGroupes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGroupes();
  }, []);

  const loadGroupes = async () => {
    try {
      setLoading(true);
      const result = await getGroupes();
      const groupesData = Array.isArray(result.data) ? result.data : (Array.isArray(result) ? result : []);
      setGroupes(groupesData);
    } catch (error) {
      console.error('Erreur chargement groupes:', error);
      setGroupes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (groupeId) => {
    Alert.alert(
      'Supprimer le groupe',
      'Voulez-vous vraiment supprimer ce groupe ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              // TODO: Implémenter la suppression de groupe
              Alert.alert('Info', 'Fonctionnalité de suppression à implémenter');
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de supprimer le groupe');
            }
          }
        }
      ]
    );
  };

  const renderGroupeItem = ({ item }) => (
    <GroupeItem
      groupe={item}
      onPress={() => navigation.navigate('GroupeDetail', { groupeId: item.id })}
      onDelete={() => handleDelete(item.id)}
    />
  );

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
            message="Vous n'avez pas encore créé de groupe"
            buttonTitle="Créer un groupe"
            onButtonPress={() => navigation.navigate('CreerGroupe')}
          />
        ) : (
          <FlatList
            data={groupes}
            renderItem={renderGroupeItem}
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
  groupeCard: {
    marginVertical: 4,
  },
  groupeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  groupeInfo: {
    flex: 1,
  },
  groupeNom: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  groupeMatiere: {
    fontSize: 14,
    color: '#007AFF',
    marginBottom: 2,
  },
  groupeNiveau: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  groupeActions: {
    flexDirection: 'row',
    gap: 8,
  },
  groupeDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  groupeStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 8,
  },
  statText: {
    fontSize: 12,
    color: '#666',
  },
});

export default MesGroupesScreen;
