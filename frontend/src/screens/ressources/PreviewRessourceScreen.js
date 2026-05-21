import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import Header from '../../components/ui/Header';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { getRessource } from '../../api/ressourceService';

const PreviewRessourceScreen = ({ navigation, route }) => {
  const { id } = route.params;
  const [ressource, setRessource] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRessource();
  }, []);

  const loadRessource = async () => {
    try {
      const data = await getRessource(id);
      setRessource(data);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de charger la ressource');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  if (ressource.type_fichier === 'pdf' && ressource.fichier) {
    return (
      <>
        <Header title={ressource.titre} showBack onBackPress={() => navigation.goBack()} />
        <WebView source={{ uri: ressource.fichier }} style={styles.webview} />
      </>
    );
  }

  if (ressource.type_fichier === 'lien' && ressource.lien_externe) {
    return (
      <>
        <Header title={ressource.titre} showBack onBackPress={() => navigation.goBack()} />
        <WebView source={{ uri: ressource.lien_externe }} style={styles.webview} />
      </>
    );
  }

  return (
    <>
      <Header title="Aperçu" showBack onBackPress={() => navigation.goBack()} />
      <View style={styles.placeholder}>
        <Text>Impossible de prévisualiser ce type de fichier.</Text>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  webview: {
    flex: 1,
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default PreviewRessourceScreen;