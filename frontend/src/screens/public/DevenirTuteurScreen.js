import React, { useState } from 'react';
import { View, StyleSheet, Alert, ScrollView, Image, Text, Button, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/ui/Header';
import TutorGeneralForm from '../../components/forms/TutorGeneralForm';
import TutorAdditionalForm from '../../components/forms/TutorAdditionalForm';
import api from '../../api/axiosConfig';

const { width } = Dimensions.get("window");
const isSmallDevice = width < 380;

const DevenirTuteurScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [generalInfo, setGeneralInfo] = useState({});
  const [additionalInfo, setAdditionalInfo] = useState({});
  const [currentStep, setCurrentStep] = useState(1);

  const handleSubmit = async () => {
    // Vérifier que les mots de passe correspondent
    if (generalInfo.password !== generalInfo.password2) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);
    try {
      // Envoyer toutes les informations au backend (endpoint d'inscription)
      await api.post('/auth/register/', {
        ...generalInfo,
        ...additionalInfo,
        role: generalInfo.role || 'tuteur', // Le rôle choisi
      });
      Alert.alert(
        'Candidature envoyée',
        'Votre demande a été soumise. Un administrateur la traitera dans les plus brefs délais. Vous pourrez vous connecter une fois votre compte activé.'
      );
      navigation.navigate('Accueil');
    } catch (error) {
      console.error(error);
      const message = error.response?.data?.email?.[0] ||
                      error.response?.data?.password?.[0] ||
                      error.response?.data?.detail ||
                      'Erreur lors de l\'envoi';
      Alert.alert('Erreur', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header title="Devenir tuteur" showBack onBackPress={() => navigation.goBack()} />
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* Section Hero */}
        <View style={styles.heroSection}>
          <View style={styles.iconContainer}>
            <Ionicons name="school-outline" size={isSmallDevice ? 40 : 50} color="#00796B" />
          </View>
          <Text style={styles.title}>Rejoignez notre équipe de tuteurs</Text>
          <Text style={styles.subtitle}>
            Partagez vos connaissances et aidez les étudiants à réussir
          </Text>
        </View>

        {/* Section Étapes */}
        <View style={styles.stepsSection}>
          <View style={styles.stepsHeader}>
            <Text style={styles.stepsTitle}>Processus d'inscription</Text>
            <Text style={styles.stepsSubtitle}>Étape {currentStep} sur 3</Text>
          </View>
          
          <View style={styles.progressBar}>
            <View style={[styles.progressStep, currentStep >= 1 && styles.progressActive]} />
            <View style={[styles.progressStep, currentStep >= 2 && styles.progressActive]} />
            <View style={[styles.progressStep, currentStep >= 3 && styles.progressActive]} />
          </View>

          <View style={styles.stepsContainer}>
            <View style={styles.stepItem}>
              <View style={[styles.stepNumber, currentStep >= 1 && styles.stepNumberActive]}>
                <Ionicons name="person-outline" size={isSmallDevice ? 16 : 20} color={currentStep >= 1 ? "#fff" : "#64748b"} />
              </View>
              <Text style={[styles.stepText, currentStep >= 1 && styles.stepTextActive]}>Informations générales</Text>
            </View>
            <View style={styles.stepItem}>
              <View style={[styles.stepNumber, currentStep >= 2 && styles.stepNumberActive]}>
                <Ionicons name="book-outline" size={isSmallDevice ? 16 : 20} color={currentStep >= 2 ? "#fff" : "#64748b"} />
              </View>
              <Text style={[styles.stepText, currentStep >= 2 && styles.stepTextActive]}>Compétences et matières</Text>
            </View>
            <View style={styles.stepItem}>
              <View style={[styles.stepNumber, currentStep >= 3 && styles.stepNumberActive]}>
                <Ionicons name="checkmark-outline" size={isSmallDevice ? 16 : 20} color={currentStep >= 3 ? "#fff" : "#64748b"} />
              </View>
              <Text style={[styles.stepText, currentStep >= 3 && styles.stepTextActive]}>Validation</Text>
            </View>
          </View>
        </View>

        {/* Section Bénéfices */}
        <View style={styles.benefitsSection}>
          <Text style={styles.benefitsTitle}>Pourquoi devenir tuteur ?</Text>
          <View style={styles.benefitsContainer}>
            <View style={styles.benefitItem}>
              <View style={styles.benefitIcon}>
                <Ionicons name="cash-outline" size={isSmallDevice ? 20 : 24} color="#00796B" />
              </View>
              <View style={styles.benefitContent}>
                <Text style={styles.benefitTitle}>Rémunération attractive</Text>
                <Text style={styles.benefitDescription}>Gagnez de l'argent en partageant vos connaissances</Text>
              </View>
            </View>
            <View style={styles.benefitItem}>
              <View style={styles.benefitIcon}>
                <Ionicons name="time-outline" size={isSmallDevice ? 20 : 24} color="#00796B" />
              </View>
              <View style={styles.benefitContent}>
                <Text style={styles.benefitTitle}>Flexibilité horaire</Text>
                <Text style={styles.benefitDescription}>Choisissez vos disponibilités</Text>
              </View>
            </View>
            <View style={styles.benefitItem}>
              <View style={styles.benefitIcon}>
                <Ionicons name="ribbon-outline" size={isSmallDevice ? 20 : 24} color="#00796B" />
              </View>
              <View style={styles.benefitContent}>
                <Text style={styles.benefitTitle}>Développement personnel</Text>
                <Text style={styles.benefitDescription}>Améliorez vos compétences pédagogiques</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Section Formulaire */}
        <View style={styles.formSection}>
          <View style={styles.formContainer}>
            <TutorGeneralForm setGeneralInfo={setGeneralInfo} loading={loading} />
            <TutorAdditionalForm setAdditionalInfo={setAdditionalInfo} loading={loading} />
          </View>
        </View>

        {/* Bouton d'action */}
        <View style={styles.actionSection}>
          <TouchableOpacity 
            style={[styles.submitButton, loading && styles.submitButtonDisabled]} 
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <Text style={styles.submitButtonText}>Envoi en cours...</Text>
            ) : (
              <>
                <Ionicons name="send-outline" size={20} color="#fff" style={styles.buttonIcon} />
                <Text style={styles.submitButtonText}>Soumettre ma candidature</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footerSection}>
          <Text style={styles.footerText}>
            Votre candidature sera examinée par notre équipe dans les plus brefs délais
          </Text>
        </View>
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  iconContainer: {
    width: isSmallDevice ? 80 : 100,
    height: isSmallDevice ? 80 : 100,
    borderRadius: isSmallDevice ? 40 : 50,
    backgroundColor: '#E0F2F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  title: {
    fontSize: isSmallDevice ? 24 : 28,
    fontWeight: 'bold',
    color: '#00796B',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: isSmallDevice ? 14 : 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  stepsSection: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 15,
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  stepsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  stepsTitle: {
    fontSize: isSmallDevice ? 16 : 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  stepsSubtitle: {
    fontSize: isSmallDevice ? 12 : 14,
    color: '#00796B',
    fontWeight: '500',
  },
  progressBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  progressStep: {
    flex: 1,
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    marginHorizontal: 2,
  },
  progressActive: {
    backgroundColor: '#00796B',
  },
  stepsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stepItem: {
    alignItems: 'center',
    flex: 1,
  },
  stepNumber: {
    width: isSmallDevice ? 32 : 40,
    height: isSmallDevice ? 32 : 40,
    borderRadius: isSmallDevice ? 16 : 20,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  stepNumberActive: {
    backgroundColor: '#00796B',
  },
  stepText: {
    fontSize: isSmallDevice ? 10 : 12,
    color: '#64748b',
    textAlign: 'center',
  },
  stepTextActive: {
    color: '#00796B',
    fontWeight: 'bold',
  },
  benefitsSection: {
    marginBottom: 25,
  },
  benefitsTitle: {
    fontSize: isSmallDevice ? 18 : 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 15,
    textAlign: 'center',
  },
  benefitsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  benefitIcon: {
    width: isSmallDevice ? 40 : 50,
    height: isSmallDevice ? 40 : 50,
    borderRadius: isSmallDevice ? 20 : 25,
    backgroundColor: '#E0F2F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  benefitContent: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: isSmallDevice ? 14 : 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  benefitDescription: {
    fontSize: isSmallDevice ? 12 : 14,
    color: '#64748b',
    lineHeight: 18,
  },
  formSection: {
    marginBottom: 25,
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  actionSection: {
    marginBottom: 25,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00796B',
    paddingVertical: isSmallDevice ? 16 : 18,
    paddingHorizontal: 30,
    borderRadius: 25,
    shadowColor: '#00796B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  submitButtonDisabled: {
    backgroundColor: '#94A3B8',
    shadowColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: isSmallDevice ? 16 : 18,
    fontWeight: 'bold',
  },
  buttonIcon: {
    marginRight: 8,
  },
  footerSection: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: isSmallDevice ? 12 : 14,
    color: '#64748b',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default DevenirTuteurScreen;