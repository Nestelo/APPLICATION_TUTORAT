import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import Header from '../../components/ui/Header';
import RessourceUploadForm from '../../components/forms/RessourceUploadForm';
import { createRessource } from '../../api/ressourceService';

const AjoutRessourceScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (formData) => {
    setLoading(true);
    try {
      // Convertir en FormData pour l'upload de fichier
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
      await createRessource(data);
      Alert.alert('Succès', 'Ressource ajoutée (en attente de validation)');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'ajouter la ressource');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header title="Ajouter une ressource" showBack onBackPress={() => navigation.goBack()} />
      <View style={styles.container}>
        <RessourceUploadForm onSubmit={handleSubmit} loading={loading} />
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

export default AjoutRessourceScreen;