import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, Alert, Text } from 'react-native';
import Header from '../../components/ui/Header';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import TextInputField from '../../components/ui/TextInputField';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import { Picker } from '@react-native-picker/picker';
import { getDisponibilites, createDisponibilite, deleteDisponibilite } from '../../api/tutorService';

const DisponibiliteItem = ({ dispo, onDelete }) => {
  const jours = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
  return (
    <Card style={styles.dispoCard}>
      <View style={styles.dispoHeader}>
        <Text style={styles.dispoText}>
          {jours[dispo.jour_semaine]} : {dispo.heure_debut} - {dispo.heure_fin}
        </Text>
        <Button title="Supprimer" variant="danger" size="small" onPress={onDelete} />
      </View>
    </Card>
  );
};

const DisponibilitesScreen = ({ navigation }) => {
  const [disponibilites, setDisponibilites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [jour, setJour] = useState('0');
  const [heureDebut, setHeureDebut] = useState('');
  const [heureFin, setHeureFin] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadDisponibilites();
  }, []);

  const loadDisponibilites = async () => {
    try {
      const result = await getDisponibilites();
      setDisponibilites(result.success ? result.data : []);
    } catch (error) {
      console.error(error);
      setDisponibilites([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!heureDebut || !heureFin) {
      Alert.alert('Erreur', 'Veuillez remplir les heures');
      return;
    }
    setSubmitting(true);
    try {
      await createDisponibilite({
        jour_semaine: parseInt(jour),
        heure_debut: heureDebut,
        heure_fin: heureFin,
        est_recurrent: true,
      });
      setShowForm(false);
      setJour('0');
      setHeureDebut('');
      setHeureFin('');
      loadDisponibilites();
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'ajouter la disponibilité');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    Alert.alert('Confirmation', 'Supprimer ce créneau ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteDisponibilite(id);
            setDisponibilites(prev => Array.isArray(prev) ? prev.filter(d => d.id !== id) : []);
          } catch (error) {
            Alert.alert('Erreur', 'Impossible de supprimer');
          }
        },
      },
    ]);
  };

  return (
    <>
      <Header title="Mes disponibilités" showBack onBackPress={() => navigation.goBack()} />
      <View style={styles.container}>
        <Button
          title={showForm ? "Annuler" : "Ajouter un créneau"}
          variant={showForm ? "secondary" : "primary"}
          onPress={() => setShowForm(!showForm)}
          style={styles.toggleButton}
        />
        {showForm && (
          <Card style={styles.form}>
            <View style={styles.pickerContainer}>
              <Text style={styles.label}>Jour</Text>
              <Picker selectedValue={jour} onValueChange={setJour} style={styles.picker}>
                <Picker.Item label="Lundi" value="0" />
                <Picker.Item label="Mardi" value="1" />
                <Picker.Item label="Mercredi" value="2" />
                <Picker.Item label="Jeudi" value="3" />
                <Picker.Item label="Vendredi" value="4" />
                <Picker.Item label="Samedi" value="5" />
                <Picker.Item label="Dimanche" value="6" />
              </Picker>
            </View>
            <TextInputField
              label="Heure début (HH:MM)"
              value={heureDebut}
              onChangeText={setHeureDebut}
              placeholder="14:00"
            />
            <TextInputField
              label="Heure fin (HH:MM)"
              value={heureFin}
              onChangeText={setHeureFin}
              placeholder="16:00"
            />
            <Button title="Ajouter" onPress={handleAdd} loading={submitting} />
          </Card>
        )}
        {loading ? (
          <LoadingSpinner />
        ) : disponibilites.length === 0 && !showForm ? (
          <EmptyState
            icon="time-outline"
            message="Aucune disponibilité définie"
            buttonTitle="Ajouter un créneau"
            onButtonPress={() => setShowForm(true)}
          />
        ) : (
          <FlatList
            data={disponibilites}
            renderItem={({ item }) => (
              <DisponibiliteItem dispo={item} onDelete={() => handleDelete(item.id)} />
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
  toggleButton: {
    margin: 12,
  },
  form: {
    margin: 12,
    marginTop: 0,
  },
  pickerContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
    color: '#333',
  },
  picker: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  list: {
    padding: 12,
    paddingTop: 0,
  },
  dispoCard: {
    marginVertical: 4,
  },
  dispoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dispoText: {
    fontSize: 16,
  },
});

export default DisponibilitesScreen;