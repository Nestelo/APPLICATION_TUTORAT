import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import Header from '../../components/ui/Header';
import RessourceUploadForm from '../../components/forms/RessourceUploadForm';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { getRessource, updateRessource } from '../../api/ressourceService';

const EditRessourceScreen = ({ navigation, route }) => {
  const { id } = route.params;
  const [initialData, setInitialData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadRessource();
  }, []);

  const loadRessource = async () => {
    try {
      const data = await getRessource(id);
      setInitialData(data);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de charger la ressource');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (formData) => {
    setSubmitting(true);
    try {
      // Convertir en multipart si un nouveau fichier est sélectionné
      const data = new FormData();
      Object.keys(formData || {}).forEach((key) => {
        if (key === 'fichier' && formData.fichier) {
          const file = formData.fichier;
          data.append('fichier', {
            uri: file.uri,
            type: file.mimeType || 'application/octet-stream',
            name: file.name || 'document',
          });
        } else if (key !== 'fichier') {
          if (formData[key] !== undefined && formData[key] !== null) {
            data.append(key, String(formData[key]));
          }
        }
      });

      await updateRessource(id, data);
      Alert.alert('Succès', 'Ressource mise à jour');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de mettre à jour');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <>
      <Header title="Modifier la ressource" showBack onBackPress={() => navigation.goBack()} />
      <View style={styles.container}>
        <RessourceUploadForm
          initialValues={initialData}
          onSubmit={handleSubmit}
          loading={submitting}
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

export default EditRessourceScreen;