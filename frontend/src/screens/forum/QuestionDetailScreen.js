import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/ui/Header';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import TextInputField from '../../components/ui/TextInputField';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';
import { getQuestion, createReponse, marquerSolution, voterReponse, getReponses } from '../../api/forumService';
import { formatDate } from '../../utils/helpers';

const QuestionDetailScreen = ({ navigation, route }) => {
  const { questionId } = route.params;
  
  // Protection si questionId n'est pas fourni
  if (!questionId) {
    Alert.alert('Erreur', 'ID de question manquant');
    navigation.goBack();
    return null;
  }
  
  const { user } = useAuth();
  const [question, setQuestion] = useState(null);
  const [reponses, setReponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reponse, setReponse] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadQuestion();
    loadReponses();
  }, []);

  const loadQuestion = async () => {
    try {
      const data = await getQuestion(questionId);
      setQuestion(data);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de charger la question');
    }
  };

  const loadReponses = async () => {
    try {
      const data = await getReponses(questionId);
      setReponses(data);
    } catch (error) {
      console.error('Erreur lors du chargement des réponses:', error);
      setReponses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (reponseId, valeur) => {
    if (!Array.isArray(reponses)) {
      Alert.alert('Erreur', 'Impossible de voter');
      return;
    }
    try {
      await voterReponse(reponseId, valeur);
      // Mettre à jour localement le compteur de votes
      setReponses(prev => {
        const prevArray = Array.isArray(prev) ? prev : [];
        return prevArray.map(r => 
          r.id === reponseId ? { ...r, nb_votes: r.nb_votes + valeur } : r
        );
      });
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de voter');
    }
  };

  const handleMarkSolution = async (reponseId) => {
    if (!Array.isArray(reponses)) {
      Alert.alert('Erreur', 'Impossible de marquer comme solution');
      return;
    }
    try {
      await marquerSolution(reponseId);
      // Marquer cette réponse comme solution et les autres non
      setReponses(prev => {
        const prevArray = Array.isArray(prev) ? prev : [];
        return prevArray.map(r => ({
          ...r,
          est_solution: r.id === reponseId
        }));
      });
      setQuestion(prev => ({ ...prev, est_resolue: true }));
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de marquer comme solution');
    }
  };

  const handleSubmitReponse = async () => {
    if (!reponse.trim()) {
      Alert.alert('Erreur', 'Veuillez écrire une réponse');
      return;
    }
    setSubmitting(true);
    try {
      const newReponse = await createReponse(questionId, reponse);
      setReponses(prev => [...prev, newReponse]);
      setReponse('');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'envoyer la réponse');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <>
      <Header title="Question" showBack onBackPress={() => navigation.goBack()} />
      <ScrollView style={styles.container}>
        <Card>
          <Text style={styles.titre}>{question.titre}</Text>
          <Text style={styles.contenu}>{question.contenu}</Text>
          <View style={styles.meta}>
            <Text>Par {question.auteur_details?.prenom} {question.auteur_details?.nom}</Text>
            <Text>{formatDate(question.date_publication)}</Text>
          </View>
          <View style={styles.tags}>
            {question.matiere && <Text style={styles.tag}>Matière: {question.matiere}</Text>}
          </View>
        </Card>

        <Text style={styles.reponsesTitle}>Réponses ({Array.isArray(reponses) ? reponses.length : 0})</Text>
        {Array.isArray(reponses) && reponses.map((reponse) => (
          <Card key={reponse.id} style={[styles.reponseCard, reponse.est_solution && styles.solutionCard]}>
            <View style={styles.reponseHeader}>
              <Text style={styles.reponseAuteur}>
                {reponse.auteur_details?.prenom} {reponse.auteur_details?.nom}
              </Text>
              <Text style={styles.reponseDate}>{formatDate(reponse.date)}</Text>
            </View>
            <Text style={styles.reponseContenu}>{reponse.contenu}</Text>
            <View style={styles.reponseFooter}>
              <View style={styles.votes}>
                <Button
                  title="+"
                  size="small"
                  onPress={() => handleVote(reponse.id, 1)}
                  style={styles.voteButton}
                />
                <Text style={styles.voteCount}>{reponse.nb_votes}</Text>
                <Button
                  title="-"
                  size="small"
                  variant="danger"
                  onPress={() => handleVote(reponse.id, -1)}
                  style={styles.voteButton}
                />
              </View>
              {!question.est_resolue && user?.id === question.auteur && (
                <Button
                  title="Marquer comme solution"
                  size="small"
                  variant="success"
                  onPress={() => handleMarkSolution(reponse.id)}
                />
              )}
              {reponse.est_solution && (
                <Text style={styles.solutionBadge}>✓ Solution</Text>
              )}
            </View>
          </Card>
        ))}

        <Card style={styles.repondreCard}>
          <Text style={styles.repondreTitle}>Votre réponse</Text>
          <TextInputField
            value={reponse}
            onChangeText={setReponse}
            multiline
            numberOfLines={4}
            placeholder="Écrivez votre réponse..."
          />
          <Button
            title="Publier la réponse"
            onPress={handleSubmitReponse}
            loading={submitting}
            style={styles.submitButton}
          />
        </Card>
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
  titre: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  contenu: {
    fontSize: 16,
    marginBottom: 12,
  },
  meta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 12,
    color: '#666',
  },
  tags: {
    marginTop: 8,
  },
  tag: {
    fontSize: 12,
    color: '#007bff',
  },
  reponsesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 12,
  },
  reponseCard: {
    marginVertical: 4,
  },
  solutionCard: {
    borderColor: '#28a745',
    borderWidth: 2,
  },
  reponseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  reponseAuteur: {
    fontWeight: '600',
  },
  reponseDate: {
    color: '#999',
    fontSize: 12,
  },
  reponseContenu: {
    fontSize: 14,
    marginBottom: 8,
  },
  reponseFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  votes: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  voteButton: {
    width: 40,
    marginHorizontal: 4,
  },
  voteCount: {
    fontSize: 16,
    fontWeight: 'bold',
    marginHorizontal: 8,
  },
  solutionBadge: {
    color: '#28a745',
    fontWeight: 'bold',
  },
  repondreCard: {
    marginTop: 20,
    marginBottom: 20,
  },
  repondreTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  submitButton: {
    marginTop: 12,
  },
});

export default QuestionDetailScreen;