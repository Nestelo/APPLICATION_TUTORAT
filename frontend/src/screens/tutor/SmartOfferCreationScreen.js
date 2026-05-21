import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, ActivityIndicator, Modal } from 'react-native';
import Header from '../../components/ui/Header';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import TextInputField from '../../components/ui/TextInputField';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from '../../context/AuthContext';
import { createOffre, getDisponibilites, createSeanceFromOffre } from '../../api/tutorService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { INSTA_DEPARTEMENTS, INSTA_NIVEAUX, getAllMatieres } from '../../config/instaConfig';

const SmartOfferCreationScreen = ({ navigation, route }) => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [disponibilites, setDisponibilites] = useState([]);
  const [selectedDispos, setSelectedDispos] = useState([]);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [generatedSessions, setGeneratedSessions] = useState([]);

  // Étape 1: Informations de base
  const [basicInfo, setBasicInfo] = useState({
    titre: '',
    description: '',
    matiere: '',
    niveau: '',
    type: 'individuel',
    tarif: '',
    gratuit: false
  });

  // Étape 2: Planning et disponibilités
  const [planningInfo, setPlanningInfo] = useState({
    mode_planning: 'manuel',
    duree_session: 60,
    nombre_places: 1,
    en_ligne: true,
    presentiel: false,
    lieu: '',
    lien_visio: '',
    repetition_config: {
      type: 'aucune',
      frequence: 'hebdomadaire',
      jours: [],
      date_fin: null,
      exceptions: []
    }
  });

  // Étape 3: Publication
  const [publicationInfo, setPublicationInfo] = useState({
    statut_workflow: 'brouillon',
    est_active: true,
    date_publication: null
  });

  // Configuration des matières et niveaux de l'INSTA
  const matieres = getAllMatieres();
  const niveaux = INSTA_NIVEAUX;

  const planningModes = [
    { id: 'manuel', label: 'Manuel', description: 'Définir les horaires manuellement' },
    { id: 'auto_dispos', label: 'Basé sur disponibilités', description: 'Utiliser vos créneaux disponibles' },
    { id: 'repetitif', label: 'Répétitif', description: 'Créer un planning récurrent' }
  ];

  const repetitionTypes = [
    { id: 'aucune', label: 'Aucune répétition' },
    { id: 'quotidien', label: 'Tous les jours' },
    { id: 'hebdomadaire', label: 'Chaque semaine' },
    { id: 'mensuel', label: 'Chaque mois' },
    { id: 'personnalise', label: 'Personnalisé' }
  ];

  const joursSemaine = [
    { id: 0, label: 'Lundi' },
    { id: 1, label: 'Mardi' },
    { id: 2, label: 'Mercredi' },
    { id: 3, label: 'Jeudi' },
    { id: 4, label: 'Vendredi' },
    { id: 5, label: 'Samedi' },
    { id: 6, label: 'Dimanche' }
  ];

  useEffect(() => {
    loadDisponibilites();
  }, []);

  const loadDisponibilites = async () => {
    try {
      const result = await getDisponibilites(user?.id);
      if (result.success) {
        const dispos = result.data?.results || result.data || [];
        setDisponibilites(dispos);
        console.log('📅 Disponibilités chargées:', dispos);
      }
    } catch (error) {
      console.error('❌ Erreur chargement disponibilités:', error);
    }
  };

  const handleBasicInfoChange = (field, value) => {
    setBasicInfo(prev => ({ ...prev, [field]: value }));
  };

  const handlePlanningInfoChange = (field, value) => {
    setPlanningInfo(prev => ({ ...prev, [field]: value }));
  };

  const handleRepetitionConfigChange = (field, value) => {
    setPlanningInfo(prev => ({
      ...prev,
      repetition_config: {
        ...prev.repetition_config,
        [field]: value
      }
    }));
  };

  const toggleDisponibiliteSelection = (dispoId) => {
    setSelectedDispos(prev => 
      prev.includes(dispoId) 
        ? prev.filter(id => id !== dispoId)
        : [...prev, dispoId]
    );
  };

  const toggleJourSelection = (jourId) => {
    handleRepetitionConfigChange('jours', 
      planningInfo.repetition_config.jours.includes(jourId)
        ? planningInfo.repetition_config.jours.filter(id => id !== jourId)
        : [...planningInfo.repetition_config.jours, jourId]
    );
  };

  const validateStep = (step) => {
    switch (step) {
      case 1:
        if (!basicInfo.titre || !basicInfo.matiere || !basicInfo.niveau) {
          Alert.alert('Erreur', 'Veuillez remplir les champs obligatoires');
          return false;
        }
        return true;
      
      case 2:
        if (planningInfo.mode_planning === 'auto_dispos' && selectedDispos.length === 0) {
          Alert.alert('Erreur', 'Veuillez sélectionner au moins une disponibilité');
          return false;
        }
        if (planningInfo.mode_planning === 'repetitif' && planningInfo.repetition_config.jours.length === 0) {
          Alert.alert('Erreur', 'Veuillez sélectionner au moins un jour pour la répétition');
          return false;
        }
        return true;
      
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 3) {
        setCurrentStep(currentStep + 1);
      } else {
        handleCreateOffer();
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const generateSessionsFromRepetition = () => {
    if (planningInfo.repetition_config.type === 'aucune') {
      return [];
    }

    const sessions = [];
    const today = new Date();
    const endDate = planningInfo.repetition_config.date_fin 
      ? new Date(planningInfo.repetition_config.date_fin)
      : new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 jours par défaut

    let currentDate = new Date(today);
    
    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay() === 0 ? 6 : currentDate.getDay() - 1; // 0=Lundi
      
      if (planningInfo.repetition_config.jours.includes(dayOfWeek)) {
        // Trouver les disponibilités pour ce jour
        const dayDispos = disponibilites.filter(d => d.jour_semaine === dayOfWeek);
        
        dayDispos.forEach(dispo => {
          const sessionDate = new Date(currentDate);
          const [hours, minutes] = dispo.heure_debut.split(':');
          sessionDate.setHours(parseInt(hours), parseInt(minutes));
          
          sessions.push({
            date_heure: sessionDate.toISOString(),
            duree: planningInfo.duree_session,
            from_disponibilite: dispo.id
          });
        });
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return sessions;
  };

  const handlePreview = () => {
    const sessions = generateSessionsFromRepetition();
    setGeneratedSessions(sessions);
    setPreviewMode(true);
  };

  const handleCreateOffer = async () => {
    try {
      setLoading(true);

      // Préparer les données de l'offre
      const offerData = {
        ...basicInfo,
        ...planningInfo,
        disponibilites_associees: selectedDispos,
        ...publicationInfo,
        tuteur: user.id, // Ajouter l'ID du tuteur connecté
        // S'assurer que le tarif est correctement formaté
        tarif: basicInfo.gratuit ? null : (basicInfo.tarif || 0)
      };

      console.log('📝 Création offre avec données:', offerData);

      // Utiliser le service createOffre
      const result = await createOffre(offerData);

      if (result.success) {
        const createdOffer = result.data;
        console.log('✅ Offre créée:', createdOffer);

        // Si mode planning automatique, créer les séances
        if (planningInfo.mode_planning === 'repetitif') {
          const sessions = generateSessionsFromRepetition();
          console.log('📅 Génération des séances:', sessions);
          
          // TODO: Implémenter la création des séances
          for (const session of sessions) {
            await createSeanceFromOffre(createdOffer.id, session);
          }
        }

        Alert.alert(
          'Succès',
          'Offre créée avec succès !',
          [
            { text: 'OK', onPress: () => navigation.navigate('TutorDashboard') }
          ]
        );
      } else {
        console.error('❌ Erreur création offre:', result.error);
        Alert.alert('Erreur', result.error || 'Erreur lors de la création de l\'offre');
      }
    } catch (error) {
      console.error('❌ Erreur handleCreateOffer:', error);
      Alert.alert('Erreur', 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => {
    return (
      <View style={styles.stepIndicator}>
        {[1, 2, 3].map((step) => (
          <TouchableOpacity
            key={step}
            style={[
              styles.stepDot,
              step <= currentStep && styles.stepDotActive
            ]}
            onPress={() => step < currentStep && setCurrentStep(step)}
          >
            <Text style={[
              styles.stepNumber,
              step <= currentStep && styles.stepNumberActive
            ]}>
              {step}
            </Text>
          </TouchableOpacity>
        ))}
        <View style={styles.stepLine} />
      </View>
    );
  };

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>📋 Informations de base</Text>
      
      <TextInputField
        label="Titre de l'offre *"
        value={basicInfo.titre}
        onChangeText={(value) => handleBasicInfoChange('titre', value)}
        placeholder="Ex: Cours de génie électrique niveau L1"
      />

      <TextInputField
        label="Description"
        value={basicInfo.description}
        onChangeText={(value) => handleBasicInfoChange('description', value)}
        placeholder="Décrivez votre offre de tutorat..."
        multiline
        numberOfLines={4}
      />

      <TextInputField
        label="Matière *"
        value={basicInfo.matiere}
        onChangeText={(value) => handleBasicInfoChange('matiere', value)}
        placeholder="Ex: Génie informatique, Mathématiques, Chimie..."
      />

      <View style={styles.pickerContainer}>
        <Text style={styles.pickerLabel}>Niveau *</Text>
        <Picker
          selectedValue={basicInfo.niveau}
          onValueChange={(value) => handleBasicInfoChange('niveau', value)}
          style={styles.picker}
        >
          <Picker.Item label="Sélectionner un niveau" value="" />
          {niveaux.map((niveau) => (
            <Picker.Item key={niveau.value} label={niveau.label} value={niveau.value} />
          ))}
        </Picker>
      </View>

      <View style={styles.pickerContainer}>
        <Text style={styles.pickerLabel}>Type de tutorat</Text>
        <Picker
          selectedValue={basicInfo.type}
          onValueChange={(value) => handleBasicInfoChange('type', value)}
          style={styles.picker}
        >
          <Picker.Item label="Individuel" value="individuel" />
          <Picker.Item label="Groupe" value="groupe" />
        </Picker>
      </View>

      <View style={styles.switchContainer}>
        <Text style={styles.switchLabel}>Offre gratuite</Text>
        <TouchableOpacity
          style={[styles.switch, basicInfo.gratuit && styles.switchActive]}
          onPress={() => handleBasicInfoChange('gratuit', !basicInfo.gratuit)}
        >
          <Text style={styles.switchText}>
            {basicInfo.gratuit ? 'OUI' : 'NON'}
          </Text>
        </TouchableOpacity>
      </View>

      {!basicInfo.gratuit && (
        <TextInputField
          label="Tarif (FCFA/heure)"
          value={basicInfo.tarif}
          onChangeText={(value) => handleBasicInfoChange('tarif', value)}
          placeholder="0.00"
          keyboardType="numeric"
        />
      )}
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>📅 Planning et disponibilités</Text>
      
      <View style={styles.pickerContainer}>
        <Text style={styles.pickerLabel}>Mode de planning</Text>
        {planningModes.map((mode) => (
          <TouchableOpacity
            key={mode.id}
            style={[
              styles.modeCard,
              planningInfo.mode_planning === mode.id && styles.modeCardSelected
            ]}
            onPress={() => handlePlanningInfoChange('mode_planning', mode.id)}
          >
            <Text style={styles.modeTitle}>{mode.label}</Text>
            <Text style={styles.modeDescription}>{mode.description}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TextInputField
        label="Durée d'une session (minutes)"
        value={planningInfo.duree_session.toString()}
        onChangeText={(value) => handlePlanningInfoChange('duree_session', parseInt(value) || 60)}
        placeholder="60"
        keyboardType="numeric"
      />

      {basicInfo.type === 'groupe' && (
        <TextInputField
          label="Nombre de places"
          value={planningInfo.nombre_places.toString()}
          onChangeText={(value) => handlePlanningInfoChange('nombre_places', parseInt(value) || 1)}
          placeholder="1"
          keyboardType="numeric"
        />
      )}

      <View style={styles.switchContainer}>
        <Text style={styles.switchLabel}>En ligne</Text>
        <TouchableOpacity
          style={[styles.switch, planningInfo.en_ligne && styles.switchActive]}
          onPress={() => handlePlanningInfoChange('en_ligne', !planningInfo.en_ligne)}
        >
          <Text style={styles.switchText}>
            {planningInfo.en_ligne ? 'OUI' : 'NON'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.switchContainer}>
        <Text style={styles.switchLabel}>Présentiel</Text>
        <TouchableOpacity
          style={[styles.switch, planningInfo.presentiel && styles.switchActive]}
          onPress={() => handlePlanningInfoChange('presentiel', !planningInfo.presentiel)}
        >
          <Text style={styles.switchText}>
            {planningInfo.presentiel ? 'OUI' : 'NON'}
          </Text>
        </TouchableOpacity>
      </View>

      {planningInfo.presentiel && (
        <TextInputField
          label="Lieu"
          value={planningInfo.lieu}
          onChangeText={(value) => handlePlanningInfoChange('lieu', value)}
          placeholder="Salle, bureau, etc."
        />
      )}

      {planningInfo.en_ligne && (
        <TextInputField
          label="Lien de visioconférence"
          value={planningInfo.lien_visio}
          onChangeText={(value) => handlePlanningInfoChange('lien_visio', value)}
          placeholder="https://zoom.us/..."
        />
      )}

      {/* Mode basé sur disponibilités */}
      {planningInfo.mode_planning === 'auto_dispos' && (
        <View style={styles.disponibilitesSection}>
          <Text style={styles.sectionTitle}>Sélectionnez vos disponibilités</Text>
          {disponibilites.map((dispo) => (
            <TouchableOpacity
              key={dispo.id}
              style={[
                styles.disponibiliteCard,
                selectedDispos.includes(dispo.id) && styles.disponibiliteCardSelected
              ]}
              onPress={() => toggleDisponibiliteSelection(dispo.id)}
            >
              <View style={styles.disponibiliteHeader}>
                <Text style={styles.disponibiliteJour}>
                  {['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'][dispo.jour_semaine]}
                </Text>
                <Ionicons
                  name={selectedDispos.includes(dispo.id) ? 'checkmark-circle' : 'ellipse-outline'}
                  size={20}
                  color={selectedDispos.includes(dispo.id) ? '#007AFF' : '#999'}
                />
              </View>
              <Text style={styles.disponibiliteHoraires}>
                {dispo.heure_debut} - {dispo.heure_fin}
              </Text>
              <Text style={styles.disponibiliteType}>
                {dispo.est_recurrent ? 'Récurrent' : 'Exceptionnel'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Mode répétitif */}
      {planningInfo.mode_planning === 'repetitif' && (
        <View style={styles.repetitionSection}>
          <Text style={styles.sectionTitle}>Configuration de la répétition</Text>
          
          <View style={styles.pickerContainer}>
            <Text style={styles.pickerLabel}>Type de répétition</Text>
            <Picker
              selectedValue={planningInfo.repetition_config.type}
              onValueChange={(value) => handleRepetitionConfigChange('type', value)}
              style={styles.picker}
            >
              {repetitionTypes.map((type) => (
                <Picker.Item key={type.id} label={type.label} value={type.id} />
              ))}
            </Picker>
          </View>

          {planningInfo.repetition_config.type !== 'aucune' && (
            <>
              <Text style={styles.sectionTitle}>Jours de la semaine</Text>
              <View style={styles.joursContainer}>
                {joursSemaine.map((jour) => (
                  <TouchableOpacity
                    key={jour.id}
                    style={[
                      styles.jourButton,
                      planningInfo.repetition_config.jours.includes(jour.id) && styles.jourButtonSelected
                    ]}
                    onPress={() => toggleJourSelection(jour.id)}
                  >
                    <Text style={styles.jourButtonText}>{jour.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={styles.previewButton}
                onPress={handlePreview}
              >
                <Text style={styles.previewButtonText}>👁️ Voir l'aperçu des séances</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>🚀 Publication</Text>
      
      <View style={styles.pickerContainer}>
        <Text style={styles.pickerLabel}>Statut de l'offre</Text>
        <Picker
          selectedValue={publicationInfo.statut_workflow}
          onValueChange={(value) => setPublicationInfo(prev => ({ ...prev, statut_workflow: value }))}
          style={styles.picker}
        >
          <Picker.Item label="Brouillon" value="brouillon" />
          <Picker.Item label="Publié" value="publie" />
          <Picker.Item label="En attente de validation" value="en_attente_validation" />
        </Picker>
      </View>

      <View style={styles.switchContainer}>
        <Text style={styles.switchLabel}>Offre active</Text>
        <TouchableOpacity
          style={[styles.switch, publicationInfo.est_active && styles.switchActive]}
          onPress={() => setPublicationInfo(prev => ({ ...prev, est_active: !prev.est_active }))}
        >
          <Text style={styles.switchText}>
            {publicationInfo.est_active ? 'OUI' : 'NON'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Résumé de l'offre */}
      <Card style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>📋 Résumé de votre offre</Text>
        
        <View style={styles.summarySection}>
          <Text style={styles.summaryLabel}>Titre:</Text>
          <Text style={styles.summaryValue}>{basicInfo.titre}</Text>
        </View>
        
        <View style={styles.summarySection}>
          <Text style={styles.summaryLabel}>Matière:</Text>
          <Text style={styles.summaryValue}>{basicInfo.matiere}</Text>
        </View>
        
        <View style={styles.summarySection}>
          <Text style={styles.summaryLabel}>Niveau:</Text>
          <Text style={styles.summaryValue}>
            {niveaux.find(n => n.value === basicInfo.niveau)?.label}
          </Text>
        </View>
        
        <View style={styles.summarySection}>
          <Text style={styles.summaryLabel}>Type:</Text>
          <Text style={styles.summaryValue}>{basicInfo.type}</Text>
        </View>
        
        <View style={styles.summarySection}>
          <Text style={styles.summaryLabel}>Tarif:</Text>
          <Text style={styles.summaryValue}>
            {basicInfo.gratuit ? 'Gratuit' : `${basicInfo.tarif} FCFA/heure`}
          </Text>
        </View>
        
        <View style={styles.summarySection}>
          <Text style={styles.summaryLabel}>Durée:</Text>
          <Text style={styles.summaryValue}>{planningInfo.duree_session} minutes</Text>
        </View>
        
        <View style={styles.summarySection}>
          <Text style={styles.summaryLabel}>Mode:</Text>
          <Text style={styles.summaryValue}>
            {planningModes.find(m => m.id === planningInfo.mode_planning)?.label}
          </Text>
        </View>
        
        {planningInfo.mode_planning === 'auto_dispos' && (
          <View style={styles.summarySection}>
            <Text style={styles.summaryLabel}>Disponibilités:</Text>
            <Text style={styles.summaryValue}>{selectedDispos.length} créneaux sélectionnés</Text>
          </View>
        )}
        
        {planningInfo.mode_planning === 'repetitif' && planningInfo.repetition_config.jours.length > 0 && (
          <View style={styles.summarySection}>
            <Text style={styles.summaryLabel}>Jours:</Text>
            <Text style={styles.summaryValue}>
              {planningInfo.repetition_config.jours.map(j => joursSemaine.find(js => js.id === j)?.label).join(', ')}
            </Text>
          </View>
        )}
      </Card>
    </View>
  );

  const renderPreviewModal = () => (
    <Modal
      visible={previewMode}
      animationType="slide"
      onRequestClose={() => setPreviewMode(false)}
    >
      <View style={styles.modalContainer}>
        <Header title="Aperçu des séances" showBack onBackPress={() => setPreviewMode(false)} />
        
        <ScrollView style={styles.previewContent}>
          <Text style={styles.previewTitle}>
            📅 {generatedSessions.length} séances générées
          </Text>
          
          {generatedSessions.map((session, index) => (
            <Card key={index} style={styles.sessionCard}>
              <Text style={styles.sessionDate}>
                {new Date(session.date_heure).toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </Text>
              <Text style={styles.sessionTime}>
                {new Date(session.date_heure).toLocaleTimeString('fr-FR', {
                  hour: '2-digit',
                  minute: '2-digit'
                })} - {session.duree} min
              </Text>
            </Card>
          ))}
        </ScrollView>
        
        <View style={styles.previewActions}>
          <Button
            title="Fermer"
            onPress={() => setPreviewMode(false)}
            style={styles.previewButton}
          />
        </View>
      </View>
    </Modal>
  );

  return (
    <>
      <Header title="Créer une offre" showBack onBackPress={() => navigation.goBack()} />
      
      <ScrollView style={styles.container}>
        {renderStepIndicator()}
        
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        
        <View style={styles.actions}>
          {currentStep > 1 && (
            <Button
              title="Précédent"
              onPress={prevStep}
              variant="outline"
              style={styles.actionButton}
            />
          )}
          
          <Button
            title={currentStep === 3 ? 'Créer l\'offre' : 'Suivant'}
            onPress={nextStep}
            loading={loading}
            style={styles.actionButton}
          />
        </View>
      </ScrollView>
      
      {renderPreviewModal()}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  stepDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 6,
  },
  stepDotActive: {
    backgroundColor: '#007AFF',
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#999',
  },
  stepNumberActive: {
    color: '#fff',
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 6,
  },
  stepContainer: {
    padding: 12,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  pickerContainer: {
    marginBottom: 12,
  },
  pickerLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 6,
    color: '#333',
  },
  picker: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  switch: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#e0e0e0',
  },
  switchActive: {
    backgroundColor: '#007AFF',
  },
  switchText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  modeCard: {
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 8,
  },
  modeCardSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f8ff',
  },
  modeTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  modeDescription: {
    fontSize: 12,
    color: '#666',
  },
  disponibilitesSection: {
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  disponibiliteCard: {
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 6,
  },
  disponibiliteCardSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f8ff',
  },
  disponibiliteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  disponibiliteJour: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  disponibiliteHoraires: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  disponibiliteType: {
    fontSize: 10,
    color: '#999',
  },
  repetitionSection: {
    marginTop: 12,
  },
  joursContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  jourButton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    margin: 2,
    backgroundColor: '#fff',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  jourButtonSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  jourButtonText: {
    fontSize: 10,
    color: '#333',
  },
  previewButton: {
    backgroundColor: '#f0f8ff',
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  previewButtonText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  summaryCard: {
    padding: 12,
    marginTop: 12,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  summarySection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
    flex: 1,
  },
  summaryValue: {
    fontSize: 12,
    color: '#333',
    flex: 2,
    textAlign: 'right',
  },
  actions: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
  },
  actionButton: {
    flex: 1,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  previewContent: {
    flex: 1,
    padding: 12,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  sessionCard: {
    padding: 12,
    marginBottom: 6,
  },
  sessionDate: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  sessionTime: {
    fontSize: 12,
    color: '#666',
  },
  previewActions: {
    padding: 12,
  },
});

export default SmartOfferCreationScreen;
