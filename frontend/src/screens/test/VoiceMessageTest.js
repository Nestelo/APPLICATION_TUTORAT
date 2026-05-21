import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, Button
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/ui/Header';
import VoiceRecorder from '../../components/ui/VoiceRecorder';
import VoicePlayer from '../../components/ui/VoicePlayer';
import { getQuestions, envoyerMessageVocal, getMessagesVocauxReponse } from '../../api/forumService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const VoiceMessageTest = ({ navigation }) => {
  const [questions, setQuestions] = useState([]);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [audioFile, setAudioFile] = useState(null);
  const [voiceMessages, setVoiceMessages] = useState([]);
  const [testResults, setTestResults] = useState([]);

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const response = await getQuestions();
      if (response.success) {
        const questionsList = response.data.results || response.data || [];
        setQuestions(questionsList);
        addTestResult('Chargement questions', '✅', `${questionsList.length} questions chargées`);
      } else {
        addTestResult('Chargement questions', '❌', response.error);
      }
    } catch (error) {
      addTestResult('Chargement questions', '❌', error.message);
    } finally {
      setLoading(false);
    }
  };

  const addTestResult = (test, status, details) => {
    setTestResults(prev => [...prev, { test, status, details, timestamp: new Date().toLocaleTimeString() }]);
  };

  const handleVoiceRecordingComplete = async (audioData) => {
    try {
      setAudioFile(audioData);
      addTestResult('Enregistrement vocal', '✅', `Durée: ${audioData.duration}s, Taille: ${audioData.size} bytes`);
      
      // Créer une réponse texte d'abord
      const response = await createResponseForTest();
      if (response) {
        // Envoyer le message vocal
        await sendVoiceMessage(response.id, audioData);
      }
    } catch (error) {
      addTestResult('Enregistrement vocal', '❌', error.message);
    }
  };

  const createResponseForTest = async () => {
    if (!selectedQuestion) {
      addTestResult('Création réponse', '❌', 'Aucune question sélectionnée');
      return null;
    }

    try {
      const token = await AsyncStorage.getItem('accessToken');
      const response = await fetch('http://192.168.43.210:8000/api/forum/reponses/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          question: selectedQuestion.id,
          contenu: 'Réponse de test pour message vocal'
        })
      });

      if (response.ok) {
        const responseData = await response.json();
        addTestResult('Création réponse', '✅', `ID: ${responseData.id}`);
        return responseData;
      } else {
        const errorData = await response.json();
        addTestResult('Création réponse', '❌', errorData.detail || 'Erreur création');
        return null;
      }
    } catch (error) {
      addTestResult('Création réponse', '❌', error.message);
      return null;
    }
  };

  const sendVoiceMessage = async (responseId, audioData) => {
    try {
      const voiceData = {
        reponse: responseId,
        fichier_audio: audioData.uri,
        duree: `00:${Math.floor(audioData.duration / 60).toString().padStart(2, '0')}:${(audioData.duration % 60).toString().padStart(2, '0')}`
      };

      addTestResult('Envoi message vocal', '🔄', 'Envoi en cours...');
      
      const result = await envoyerMessageVocal(voiceData);
      
      if (result.success) {
        addTestResult('Envoi message vocal', '✅', `Message vocal ID: ${result.data.id}`);
        // Recharger les messages vocaux
        await loadVoiceMessages();
      } else {
        addTestResult('Envoi message vocal', '❌', result.error);
      }
    } catch (error) {
      addTestResult('Envoi message vocal', '❌', error.message);
    }
  };

  const loadVoiceMessages = async () => {
    if (!selectedQuestion || !selectedQuestion.reponses || selectedQuestion.reponses.length === 0) {
      addTestResult('Chargement messages vocaux', '⚠️', 'Aucune réponse trouvée');
      return;
    }

    try {
      const allVoiceMessages = [];
      
      for (const reponse of selectedQuestion.reponses) {
        const result = await getMessagesVocauxReponse(reponse.id);
        if (result.success && result.data.results) {
          allVoiceMessages.push(...result.data.results);
        }
      }

      setVoiceMessages(allVoiceMessages);
      addTestResult('Chargement messages vocaux', '✅', `${allVoiceMessages.length} messages vocaux trouvés`);
    } catch (error) {
      addTestResult('Chargement messages vocaux', '❌', error.message);
    }
  };

  const testAPIConnection = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const response = await fetch('http://192.168.43.210:8000/api/forum/questions/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        addTestResult('Connexion API', '✅', `API accessible, ${data.results ? data.results.length : data.length} questions`);
      } else {
        addTestResult('Connexion API', '❌', `Status: ${response.status}`);
      }
    } catch (error) {
      addTestResult('Connexion API', '❌', error.message);
    }
  };

  return (
    <>
      <Header title="Test Messages Vocaux" showBack onBackPress={() => navigation.goBack()} />
      <View style={styles.container}>
        <ScrollView style={styles.content}>
          {/* Section de test de connexion */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔐 Test de connexion API</Text>
            <TouchableOpacity style={styles.testButton} onPress={testAPIConnection}>
              <Text style={styles.testButtonText}>Tester la connexion</Text>
            </TouchableOpacity>
          </View>

          {/* Section de sélection de question */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📝 Sélectionner une question</Text>
            {questions.slice(0, 3).map((question) => (
              <TouchableOpacity
                key={question.id}
                style={[
                  styles.questionItem,
                  selectedQuestion?.id === question.id && styles.selectedQuestion
                ]}
                onPress={() => {
                  setSelectedQuestion(question);
                  setVoiceMessages([]);
                  addTestResult('Sélection question', '✅', `Question: ${question.titre}`);
                }}
              >
                <Text style={styles.questionText}>{question.titre}</Text>
                <Text style={styles.questionMeta}>
                  {question.reponses?.length || 0} réponses
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Section d'enregistrement vocal */}
          {selectedQuestion && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🎤 Test d'enregistrement vocal</Text>
              <VoiceRecorder
                onRecordingComplete={handleVoiceRecordingComplete}
                maxDuration={300}
              />
              {audioFile && (
                <View style={styles.audioInfo}>
                  <Text style={styles.audioInfoText}>
                    📁 Fichier: {audioFile.uri.split('/').pop()}
                  </Text>
                  <Text style={styles.audioInfoText}>
                    ⏱️ Durée: {audioFile.duration}s
                  </Text>
                  <Text style={styles.audioInfoText}>
                    📏 Taille: {audioFile.size} bytes
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Section des messages vocaux */}
          {voiceMessages.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🎧 Messages vocaux trouvés</Text>
              {voiceMessages.map((vm) => (
                <View key={vm.id} style={styles.voiceItem}>
                  <View style={styles.voiceHeader}>
                    <Ionicons name="mic" size={16} color="#007AFF" />
                    <Text style={styles.voiceLabel}>
                      {vm.auteur_details?.prenom} {vm.auteur_details?.nom}
                    </Text>
                    <Text style={styles.voiceDuration}>{vm.duree}</Text>
                  </View>
                  <VoicePlayer audioUri={vm.fichier_audio} />
                </View>
              ))}
            </View>
          )}

          {/* Section des résultats de test */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📊 Résultats des tests</Text>
            {testResults.map((result, index) => (
              <View key={index} style={styles.testResult}>
                <Text style={styles.testTime}>{result.timestamp}</Text>
                <Text style={styles.testName}>{result.test}</Text>
                <Text style={[styles.testStatus, result.status === '✅' && styles.success, result.status === '❌' && styles.error]}>
                  {result.status}
                </Text>
                <Text style={styles.testDetails}>{result.details}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  testButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  testButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  questionItem: {
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
    backgroundColor: '#f8f9fa',
    borderLeftWidth: 3,
    borderLeftColor: '#ddd',
  },
  selectedQuestion: {
    backgroundColor: '#e3f2fd',
    borderLeftColor: '#007AFF',
  },
  questionText: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
    color: '#333',
  },
  questionMeta: {
    fontSize: 12,
    color: '#666',
  },
  audioInfo: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 6,
    marginTop: 12,
  },
  audioInfoText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  voiceItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  voiceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  voiceLabel: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
    flex: 1,
  },
  voiceDuration: {
    fontSize: 11,
    color: '#666',
    backgroundColor: '#e9ecef',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  testResult: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  testTime: {
    fontSize: 10,
    color: '#999',
    width: 80,
  },
  testName: {
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
    color: '#333',
  },
  testStatus: {
    fontSize: 14,
    fontWeight: 'bold',
    width: 30,
    textAlign: 'center',
  },
  success: {
    color: '#28a745',
  },
  error: {
    color: '#dc3545',
  },
  testDetails: {
    fontSize: 11,
    color: '#666',
    flex: 2,
  },
});

export default VoiceMessageTest;
