import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList, Alert } from 'react-native';
import Header from '../../components/ui/Header';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import CustomInput from '../../components/ui/Input';
import { getDemandesTuteur, validerDemande, rejeterDemande } from '../../api/adminService';

const ValidationTuteurScreen = ({ navigation }) => {
  const [demandes, setDemandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [commentaire, setCommentaire] = useState('');

  useEffect(() => {
    loadDemandes();
  }, []);

  const loadDemandes = async () => {
    setLoading(true);
    try {
      const data = await getDemandesTuteur();
      setDemandes(data || []);
    } catch (err) {
      console.error(err);
      Alert.alert('Erreur', "Impossible de charger les demandes");
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async (item) => {
    Alert.alert('Confirmation', `Valider la demande de ${displayName(item)} ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Valider',
        onPress: async () => {
          setProcessing(true);
          try {
            await validerDemande(item.id);
            Alert.alert('Succès', 'Demande validée');
            setSelected(null);
            await loadDemandes();
          } catch (err) {
            console.error(err);
            Alert.alert('Erreur', 'Échec de la validation');
          } finally {
            setProcessing(false);
          }
        },
      },
    ]);
  };

  const handleReject = (item) => {
    setSelected(item);
    setCommentaire('');
    // show comment input inline
  };

  const submitReject = async (item) => {
    if (!commentaire) {
      Alert.alert('Erreur', 'Veuillez ajouter un commentaire');
      return;
    }
    setProcessing(true);
    try {
      await rejeterDemande(item.id, commentaire);
      Alert.alert('Succès', 'Demande rejetée');
      setSelected(null);
      await loadDemandes();
    } catch (err) {
      console.error(err);
      Alert.alert('Erreur', "Impossible de rejeter la demande");
    } finally {
      setProcessing(false);
    }
  };

  const displayName = (item) => {
    const u = item.utilisateur || item.utilisateur_details || {};
    if (u.prenom || u.nom) return `${u.prenom || ''} ${u.nom || ''}`.trim();
    if (u.email) return u.email;
    return 'Utilisateur';
  };

  if (loading) return <LoadingSpinner />;

  return (
    <>
      <Header title="Validation tuteurs" showBack onBackPress={() => navigation.goBack()} />
      <ScrollView style={styles.container}>
        {demandes.length === 0 && (
          <Card>
            <Text>Aucune demande en attente.</Text>
          </Card>
        )}

        <FlatList
          data={demandes}
          keyExtractor={(i) => String(i.id)}
          renderItem={({ item }) => (
            <Card style={styles.card}>
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{displayName(item)}</Text>
                  <Text>Filière: {item.utilisateur?.filiere || item.filiere || '—'}</Text>
                  <Text>Matières: {item.utilisateur?.matieres_maitrisees || item.matiere || '—'}</Text>
                </View>
                <View style={styles.actions}>
                  <Button title="Voir" onPress={() => setSelected(item)} style={styles.smallButton} />
                </View>
              </View>
              {selected && selected.id === item.id && (
                <View style={{ marginTop: 12 }}>
                  <Text style={{ fontWeight: '600', marginBottom: 6 }}>Bio</Text>
                  <Text>{item.utilisateur?.bio || item.bio || 'Aucune bio'}</Text>
                  <Text style={{ fontWeight: '600', marginTop: 8 }}>Justificatif</Text>
                  {item.utilisateur?.justificatif || item.justificatif ? (
                    <Text>Fichier: {item.utilisateur?.justificatif || item.justificatif}</Text>
                  ) : (
                    <Text>Aucun justificatif</Text>
                  )}

                  <View style={{ flexDirection: 'row', marginTop: 12 }}>
                    <Button title="Valider" onPress={() => handleValidate(item)} style={styles.button} loading={processing} />
                    <Button title="Rejeter" variant="danger" onPress={() => handleReject(item)} style={styles.button} />
                  </View>

                  {selected && selected.id === item.id && (
                    <View style={{ marginTop: 12 }}>
                      <CustomInput label="Commentaire (rejet)" value={commentaire} onChangeText={setCommentaire} placeholder='Raison du rejet' />
                      <View style={{ flexDirection: 'row' }}>
                        <Button title={processing ? 'En cours...' : 'Confirmer rejet'} variant="danger" onPress={() => submitReject(item)} style={[styles.button, { flex: 1 }]} loading={processing} />
                        <Button title="Annuler" onPress={() => setSelected(null)} style={[styles.button, { flex: 1 }]} />
                      </View>
                    </View>
                  )}
                </View>
              )}
            </Card>
          )}
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
  card: {
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  actions: {
    marginLeft: 8,
  },
  button: {
    flex: 1,
    marginRight: 8,
  },
  smallButton: {
    width: 80,
  },
});

export default ValidationTuteurScreen;
