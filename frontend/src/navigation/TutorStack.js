import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import TutorDashboardScreen from '../screens/tutor/TutorDashboardScreen';
import GestionOffresScreen from '../screens/tutor/GestionOffresScreen';
import CreerOffreScreen from '../screens/tutor/CreerOffreScreen';
import EditOffreScreen from '../screens/tutor/EditOffreScreen';
import TutorOffersScreen from '../screens/tutor/TutorOffersScreen';
import SmartOfferCreationScreen from '../screens/tutor/SmartOfferCreationScreen';
import OfferInscriptionsScreen from '../screens/tutor/OfferInscriptionsScreen';
import TutorSessionsScreen from '../screens/tutor/TutorSessionsScreen';
import TestScreen from '../screens/tutor/TestScreen';
import TestRessourceScreen from '../screens/tutor/TestRessourceScreen';
import DebugScreen from '../screens/shared/DebugScreen';
import ManageInscriptionsScreen from '../screens/tutor/ManageInscriptionsScreen';
import GestionInscriptionsScreen from '../screens/tutor/GestionInscriptionsScreen';
import CreerGroupeScreen from '../screens/tutor/CreerGroupeScreen';
import GestionGroupesScreen from '../screens/tutor/GestionGroupesScreen';
import GroupeDetailScreen from '../screens/tutor/GroupeDetailScreen';
import PlanningTutorScreen from '../screens/tutor/PlanningTutorScreen';
import MesElevesScreen from '../screens/tutor/MesElevesScreen';
import EleveDetailScreen from '../screens/tutor/EleveDetailScreen';
import DisponibilitesScreen from '../screens/tutor/DisponibilitesScreen';
import TutorProfileScreen from '../screens/tutor/TutorProfileScreen';
import TutorForumScreen from '../screens/tutor/TutorForumScreen';
import TutorMessagesScreen from '../screens/tutor/TutorMessagesScreen';
import TutorNotificationsScreen from '../screens/tutor/TutorNotificationsScreen';
import TutorAdminCommunicationScreen from '../screens/tutor/TutorAdminCommunicationScreen';
import AjoutRessourceScreen from '../screens/tutor/AjoutRessourceScreen';
import GestionRessourcesScreen from '../screens/tutor/GestionRessourcesScreen';
import TutorResourcesScreen from '../screens/tutor/TutorResourcesScreen';
import EditProfilScreen from '../screens/auth/EditProfilScreen';
import NotificationsScreen from '../screens/auth/NotificationsScreen';
import ForumListScreen from '../screens/forum/ForumListScreen';
import PoserQuestionScreen from '../screens/forum/PoserQuestionScreen';
import ForumScreen from '../screens/forum/ForumScreen';
import QuestionDetailScreen from '../screens/forum/QuestionDetailScreen';
import RepondreScreen from '../screens/forum/RepondreScreen';
import ActivityScreen from '../screens/tutor/ActivityScreen';
import RessourceListScreen from '../screens/ressources/RessourceListScreen';
import RessourceDetailScreen from '../screens/ressources/RessourceDetailScreen';
import EditRessourceScreen from '../screens/ressources/EditRessourceScreen';
import CreateRessourceGroupe from '../screens/tutor/CreateRessourceGroupe';
import VoiceMessageTest from '../screens/test/VoiceMessageTest';
import TutorQuestionDetailScreen from '../screens/tutor/TutorQuestionDetailScreen';

const Stack = createStackNavigator();

export default function TutorStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="TutorDashboard"
        component={TutorDashboardScreen}
        options={{ title: 'Tableau de bord' }}
      />
      <Stack.Screen
        name="Test"
        component={TestScreen}
        options={{ title: 'Test' }}
      />
      <Stack.Screen
        name="TestRessource"
        component={TestRessourceScreen}
        options={{ title: 'Test Ressources' }}
      />
      <Stack.Screen
        name="Debug"
        component={DebugScreen}
        options={{ title: 'Débogage' }}
      />
      <Stack.Screen
        name="AjoutRessource"
        component={AjoutRessourceScreen}
        options={{ title: 'Ajouter une ressource' }}
      />
      <Stack.Screen
        name="GestionRessources"
        component={GestionRessourcesScreen}
        options={{ title: 'Gérer les ressources' }}
      />
      <Stack.Screen
        name="TutorResources"
        component={TutorResourcesScreen}
        options={{ title: 'Mes ressources' }}
      />
      <Stack.Screen
        name="GestionOffres"
        component={GestionOffresScreen}
        options={{ title: 'Gérer les offres' }}
      />
      <Stack.Screen
        name="TutorOffers"
        component={TutorOffersScreen}
        options={{ title: 'Mes offres' }}
      />
      <Stack.Screen
        name="SmartOfferCreation"
        component={SmartOfferCreationScreen}
        options={{ title: 'Créer une offre' }}
      />
      <Stack.Screen
        name="CreerOffre"
        component={CreerOffreScreen}
        options={{ title: 'Créer une offre' }}
      />
      <Stack.Screen
        name="EditOffre"
        component={EditOffreScreen}
        options={{ title: 'Modifier une offre' }}
      />
      <Stack.Screen
        name="OfferInscriptions"
        component={OfferInscriptionsScreen}
        options={{ title: 'Inscriptions à l\'offre' }}
      />
      <Stack.Screen
        name="TutorSessions"
        component={TutorSessionsScreen}
        options={{ title: 'Gestion des séances' }}
      />
      <Stack.Screen
        name="ManageInscriptions"
        component={ManageInscriptionsScreen}
        options={{ title: 'Gérer les inscriptions' }}
      />
      <Stack.Screen
        name="GestionInscriptions"
        component={GestionInscriptionsScreen}
        options={{ title: 'Gérer les inscriptions aux groupes' }}
      />
      <Stack.Screen
        name="CreerGroupe"
        component={CreerGroupeScreen}
        options={{ title: 'Créer un groupe' }}
      />
      <Stack.Screen
        name="GestionGroupes"
        component={GestionGroupesScreen}
        options={{ title: 'Gérer les groupes' }}
      />
      <Stack.Screen
        name="GroupeDetail"
        component={GroupeDetailScreen}
        options={{ title: 'Détails du groupe' }}
      />
      <Stack.Screen
        name="PlanningTutor"
        component={PlanningTutorScreen}
        options={{ title: 'Planning' }}
      />
      <Stack.Screen
        name="MesEleves"
        component={MesElevesScreen}
        options={{ title: 'Mes élèves' }}
      />
      <Stack.Screen
        name="EleveDetail"
        component={EleveDetailScreen}
        options={{ title: 'Détail élève' }}
      />
      <Stack.Screen
        name="Disponibilites"
        component={DisponibilitesScreen}
        options={{ title: 'Disponibilités' }}
      />
      <Stack.Screen
        name="TutorProfile"
        component={TutorProfileScreen}
        options={{ title: 'Profil tuteur' }}
      />
      <Stack.Screen
        name="TutorForum"
        component={TutorForumScreen}
        options={{ title: 'Forum' }}
      />
      <Stack.Screen
        name="TutorMessages"
        component={TutorMessagesScreen}
        options={{ title: 'Messages' }}
      />
      <Stack.Screen
        name="TutorNotifications"
        component={TutorNotificationsScreen}
        options={{ title: 'Notifications' }}
      />
      <Stack.Screen
        name="Activity"
        component={ActivityScreen}
        options={{ title: 'Mon activité' }}
      />
      <Stack.Screen
        name="TutorAdminCommunication"
        component={TutorAdminCommunicationScreen}
        options={{ title: 'Communication admin' }}
      />
      <Stack.Screen
        name="EditProfil"
        component={EditProfilScreen}
        options={{ title: 'Modifier le profil' }}
      />
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ title: 'Notifications' }}
      />
      <Stack.Screen
        name="ForumList"
        component={ForumListScreen}
        options={{ title: 'Forum' }}
      />
      <Stack.Screen
        name="CreateQuestion"
        component={PoserQuestionScreen}
        options={{ title: 'Poser une question' }}
      />
      <Stack.Screen
        name="PoserQuestion"
        component={PoserQuestionScreen}
        options={{ title: 'Poser une question' }}
      />
      <Stack.Screen
        name="Forum"
        component={ForumScreen}
        options={{ title: 'Forum' }}
      />
      <Stack.Screen
        name="QuestionDetail"
        component={QuestionDetailScreen}
        options={{ title: 'Détail question' }}
      />
      <Stack.Screen
        name="Repondre"
        component={RepondreScreen}
        options={{ title: 'Répondre' }}
      />
      <Stack.Screen
        name="RessourceList"
        component={RessourceListScreen}
        options={{ title: 'Ressources' }}
      />
      <Stack.Screen
        name="RessourceDetail"
        component={RessourceDetailScreen}
        options={{ title: 'Détail ressource' }}
      />
      <Stack.Screen
        name="EditRessource"
        component={EditRessourceScreen}
        options={{ title: 'Modifier ressource' }}
      />
      <Stack.Screen
        name="VoiceMessageTest"
        component={VoiceMessageTest}
        options={{ title: 'Test Messages Vocaux' }}
      />
      <Stack.Screen
        name="TutorQuestionDetail"
        component={TutorQuestionDetailScreen}
        options={{ title: 'Détail Question' }}
      />
      <Stack.Screen
        name="CreateRessourceGroupe"
        component={CreateRessourceGroupe}
        options={{ title: 'Créer une ressource de groupe' }}
      />
    </Stack.Navigator>
  );
}
