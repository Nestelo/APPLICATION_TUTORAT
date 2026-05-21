import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import Header from '../../components/ui/Header';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { debugBackend, testEndpoint } from '../../api/debugService';

const DebugScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  const runFullDiagnostic = async () => {
    setLoading(true);
    try {
      const diagnosticResults = await debugBackend();
      setResults(diagnosticResults);
      
      // Afficher un résumé
      const successCount = Object.values(diagnosticResults).filter(r => r?.success).length;
      const totalCount = Object.keys(diagnosticResults).length;
      
      Alert.alert(
        'Diagnostic terminé',
        `${successCount}/${totalCount} services fonctionnent correctement`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Erreur diagnostic:', error);
      Alert.alert('Erreur', 'Le diagnostic a échoué');
    } finally {
      setLoading(false);
    }
  };

  const testSpecificEndpoint = async (endpoint, description) => {
    setLoading(true);
    try {
      const result = await testEndpoint(endpoint, description);
      Alert.alert(
        `Test ${description}`,
        result.success ? '✅ Succès' : `❌ Erreur: ${result.error}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Erreur', 'Test échoué');
    } finally {
      setLoading(false);
    }
  };

  const renderResults = () => {
    if (!results) return null;

    return (
      <View style={styles.resultsContainer}>
        <Text style={styles.resultsTitle}>📊 Résultats du diagnostic</Text>
        
        {Object.entries(results).map(([service, result]) => (
          <View key={service} style={styles.resultItem}>
            <Text style={styles.serviceName}>{service.toUpperCase()}</Text>
            <Text style={[
              styles.statusText,
              { color: result?.success ? '#27ae60' : '#e74c3c' }
            ]}>
              {result?.success ? '✅ OK' : '❌ ERREUR'}
            </Text>
            {result?.status && (
              <Text style={styles.statusCode}>Status: {result.status}</Text>
            )}
            {result?.error && (
              <Text style={styles.errorText}>{JSON.stringify(result.error)}</Text>
            )}
            {result?.data && (
              <View style={styles.dataInfo}>
                <Text>Array: {result.isArray ? '✅' : '❌'}</Text>
                <Text>Paginated: {result.isPaginated ? '✅' : '❌'}</Text>
              </View>
            )}
          </View>
        ))}
      </View>
    );
  };

  return (
    <>
      <Header title="Diagnostic API" showBack onBackPress={() => navigation.goBack()} />
      <ScrollView style={styles.container}>
        <Text style={styles.description}>
          Cet écran permet de tester tous les endpoints du backend pour identifier les problèmes.
        </Text>

        <View style={styles.actions}>
          <Button
            title="🔍 Diagnostic complet"
            onPress={runFullDiagnostic}
            style={styles.button}
          />
        </View>

        <View style={styles.quickTests}>
          <Text style={styles.sectionTitle}>Tests rapides</Text>
          
          <Button
            title="👤 Auth /profile"
            variant="outline"
            onPress={() => testSpecificEndpoint('/auth/profile/', 'Auth Profile')}
            style={styles.testButton}
          />
          
          <Button
            title="🔔 Notifications"
            variant="outline"
            onPress={() => testSpecificEndpoint('/notifications/notifications/', 'Notifications')}
            style={styles.testButton}
          />
          
          <Button
            title="📚 Tutorat /offres"
            variant="outline"
            onPress={() => testSpecificEndpoint('/tutorat/offres/', 'Tutorat Offres')}
            style={styles.testButton}
          />
          
          <Button
            title="📖 Ressources"
            variant="outline"
            onPress={() => testSpecificEndpoint('/ressources/ressources/', 'Ressources')}
            style={styles.testButton}
          />
          
          <Button
            title="💬 Forum"
            variant="outline"
            onPress={() => testSpecificEndpoint('/forum/questions/', 'Forum Questions')}
            style={styles.testButton}
          />
          
          <Button
            title="📨 Messagerie"
            variant="outline"
            onPress={() => testSpecificEndpoint('/messagerie/conversations/', 'Messagerie')}
            style={styles.testButton}
          />
        </View>

        {renderResults()}

        {loading && <LoadingSpinner />}
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  actions: {
    marginBottom: 20,
  },
  button: {
    marginBottom: 10,
  },
  quickTests: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  testButton: {
    marginBottom: 8,
  },
  resultsContainer: {
    marginTop: 20,
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 8,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: '#333',
  },
  resultItem: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
  },
  serviceName: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  statusCode: {
    fontSize: 11,
    color: '#666',
    marginBottom: 4,
  },
  errorText: {
    fontSize: 11,
    color: '#e74c3c',
    marginBottom: 4,
  },
  dataInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
});

export default DebugScreen;
