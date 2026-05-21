import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, ActivityIndicator } from 'react-native';
import Header from '../../components/ui/Header';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { getRessources, createRessource } from '../../api/ressourceService';

const TestRessourceScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [resources, setResources] = useState([]);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    testAPI();
  }, []);

  const testAPI = async () => {
    try {
      setLoading(true);
      
      // Test 1: Charger les ressources
      console.log('🔍 Test 1: Chargement des ressources...');
      const resourcesData = await getRessources();
      console.log('✅ Ressources chargées:', resourcesData);
      setResources(resourcesData || []);
      
      // Test 2: Créer une ressource de test
      console.log('🔍 Test 2: Création d\'une ressource de test...');
      const testFormData = new FormData();
      testFormData.append('titre', 'Ressource de test API');
      testFormData.append('description', 'Ceci est une ressource de test pour vérifier la communication avec l\'admin');
      testFormData.append('type_fichier', 'cours'); // Corrigé: type_fichier au lieu de type
      testFormData.append('matiere', 'Test');
      testFormData.append('niveau', 'L1');
      testFormData.append('auteur', 20); // ID de l'utilisateur existant (Bienvenue Motar)
      
      const newResource = await createRessource(testFormData);
      console.log('✅ Ressource créée:', newResource);
      
      setTestResult({
        success: true,
        message: 'Communication API réussie !',
        resourcesCount: resourcesData?.length || 0,
        newResourceId: newResource?.id
      });
      
    } catch (error) {
      console.error('❌ Erreur API:', error);
      setTestResult({
        success: false,
        message: `Erreur: ${error.message || 'Erreur inconnue'}`,
        error: error
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header title="Test Ressources" showBack onBackPress={() => navigation.goBack()} />
      <ScrollView style={styles.container}>
        <Card style={styles.testCard}>
          <Text style={styles.title}>🧪 Test de Communication API</Text>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#0b3d6d" />
              <Text style={styles.loadingText}>Test en cours...</Text>
            </View>
          ) : testResult ? (
            <View style={styles.resultContainer}>
              <Text style={[
                styles.resultMessage,
                { color: testResult.success ? '#28a745' : '#dc3545' }
              ]}>
                {testResult.success ? '✅' : '❌'} {testResult.message}
              </Text>
              
              {testResult.success && (
                <>
                  <Text style={styles.detailText}>
                    📚 Nombre de ressources: {testResult.resourcesCount}
                  </Text>
                  {testResult.newResourceId && (
                    <Text style={styles.detailText}>
                      🆔 ID nouvelle ressource: {testResult.newResourceId}
                    </Text>
                  )}
                </>
              )}
              
              <Button
                title="🔄 Relancer le test"
                onPress={testAPI}
                style={styles.retestButton}
              />
            </View>
          ) : (
            <Button
              title="🚀 Lancer le test API"
              onPress={testAPI}
              style={styles.testButton}
            />
          )}
        </Card>

        {resources.length > 0 && (
          <Card style={styles.resourcesCard}>
            <Text style={styles.subtitle}>📋 Ressources existantes:</Text>
            {resources.slice(0, 5).map((resource) => (
              <View key={resource.id} style={styles.resourceItem}>
                <Text style={styles.resourceTitle}>• {resource.titre}</Text>
                <Text style={styles.resourceDetail}>
                  Statut: {resource.statut || 'Non défini'} | 
                  Type: {resource.type || 'Non défini'}
                </Text>
              </View>
            ))}
            {resources.length > 5 && (
              <Text style={styles.moreText}>... et {resources.length - 5} autres</Text>
            )}
          </Card>
        )}
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
  testCard: {
    padding: 20,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: '#0b3d6d',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  resultContainer: {
    alignItems: 'center',
  },
  resultMessage: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 16,
    textAlign: 'center',
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  testButton: {
    backgroundColor: '#007bff',
  },
  retestButton: {
    backgroundColor: '#28a745',
    marginTop: 16,
  },
  resourcesCard: {
    padding: 16,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#0b3d6d',
  },
  resourceItem: {
    marginBottom: 8,
    padding: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
  },
  resourceTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  resourceDetail: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  moreText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
  },
});

export default TestRessourceScreen;
