import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const TestScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Test Screen</Text>
      <Text>Ceci est un écran de test pour vérifier si l'erreur persiste.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
});

export default TestScreen;
