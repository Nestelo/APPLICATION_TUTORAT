import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import StudentDashboardScreen from '../screens/student/StudentDashboardScreen';
import FindTutorScreen from '../screens/student/FindTutorScreen';
import TutorProfile from '../screens/student/TutorProfile';
import BookingSession from '../screens/student/BookingSession';
import EvaluateTutor from '../screens/student/EvaluateTutor';
import ProfilTuteurScreen from '../screens/student/ProfilTuteurScreen';
import PlanningStudentScreen from '../screens/student/PlanningStudentScreen';
import MesGroupesScreen from '../screens/student/MesGroupesScreen';
import GroupeDetailScreen from '../screens/student/GroupeDetailScreen';
import StudentGroupsScreen from '../screens/student/StudentGroupsScreen';
import GroupesListScreen from '../screens/student/GroupesListScreen';
import GroupeMembresScreen from '../screens/student/GroupeMembresScreen';
import MesFavorisScreen from '../screens/student/MesFavorisScreen';
import TutorReviewScreen from '../screens/student/TutorReviewScreen';
import StudentHistoryScreen from '../screens/student/StudentHistoryScreen';
import StudentMessagesScreen from '../screens/student/StudentMessagesScreen';
import StudentResourcesScreen from '../screens/student/StudentResourcesScreen';
import StudentSessionsScreen from '../screens/student/StudentSessionsScreen';
import RessourceListScreen from '../screens/ressources/RessourceListScreen';
import RessourceDetailScreen from '../screens/ressources/RessourceDetailScreen';
import AjoutRessourceScreen from '../screens/ressources/AjoutRessourceScreen';
import EditRessourceScreen from '../screens/ressources/EditRessourceScreen';
import GroupeRessourcesScreen from '../screens/student/GroupeRessourcesScreen';
import GroupeRessourceDetailScreen from '../screens/student/GroupeRessourceDetailScreen';
import ForumListScreen from '../screens/forum/ForumListScreen';
import PoserQuestionScreen from '../screens/forum/PoserQuestionScreen';
import ForumScreen from '../screens/forum/ForumScreen';
import StudentForumScreen from '../screens/student/StudentForumScreen';
import QuestionDetailScreen from '../screens/forum/QuestionDetailScreen';
import RepondreScreen from '../screens/forum/RepondreScreen';
import StatisticsScreen from '../screens/student/StatisticsScreen';
import MyResourcesScreen from '../screens/student/MyResourcesScreen';
import GlobalResourcesScreen from '../screens/student/GlobalResourcesScreen';
import NousContacterScreen from '../screens/public/NousContacterScreen';
// import EditProfilScreen from '../screens/auth/EditProfilScreen'; // à supprimer

const Stack = createStackNavigator();

export default function StudentStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="StudentDashboard" component={StudentDashboardScreen} options={{ title: 'Tableau de bord' }} />
      <Stack.Screen name="FindTutor" component={FindTutorScreen} options={{ title: 'Rechercher un tuteur' }} />
      <Stack.Screen name="TutorProfile" component={TutorProfile} options={{ title: 'Profil du tuteur' }} />
      <Stack.Screen name="BookingSession" component={BookingSession} options={{ title: 'Réserver une séance' }} />
      <Stack.Screen name="StudentSessions" component={StudentSessionsScreen} options={{ title: 'Séances disponibles' }} />
      <Stack.Screen name="EvaluateTutor" component={EvaluateTutor} options={{ title: 'Évaluer le tuteur' }} />
      <Stack.Screen name="ProfilTuteur" component={ProfilTuteurScreen} options={{ title: 'Profil du tuteur' }} />
      <Stack.Screen name="PlanningStudent" component={PlanningStudentScreen} options={{ title: 'Mon planning' }} />
      <Stack.Screen name="MesGroupes" component={MesGroupesScreen} options={{ title: 'Mes groupes' }} />
      <Stack.Screen name="GroupeDetail" component={GroupeDetailScreen} options={{ title: 'Détail du groupe' }} />
      <Stack.Screen name="GroupeRessources" component={GroupeRessourcesScreen} options={{ title: 'Ressources du groupe' }} />
      <Stack.Screen name="GroupeRessourceDetail" component={GroupeRessourceDetailScreen} options={{ title: 'Détails de la ressource' }} />
      <Stack.Screen name="StudentGroups" component={StudentGroupsScreen} options={{ title: 'Rejoindre un groupe' }} />
      <Stack.Screen name="GroupesList" component={GroupesListScreen} options={{ title: 'Liste des groupes' }} />
      <Stack.Screen name="GroupeMembres" component={GroupeMembresScreen} options={{ title: 'Membres du groupe' }} />
      <Stack.Screen name="MesFavoris" component={MesFavorisScreen} options={{ title: 'Mes favoris' }} />
      <Stack.Screen name="TutorReview" component={TutorReviewScreen} options={{ title: 'Évaluer le tuteur' }} />
      <Stack.Screen name="StudentHistory" component={StudentHistoryScreen} options={{ title: "Historique d'apprentissage" }} />
      <Stack.Screen name="StudentMessages" component={StudentMessagesScreen} options={{ title: 'Messagerie' }} />
      <Stack.Screen name="StudentResources" component={StudentResourcesScreen} options={{ title: 'Ressources' }} />
      {/* Alias routes utilisées par le tableau de bord */}
      <Stack.Screen name="RechercheTuteurs" component={FindTutorScreen} options={{ title: 'Rechercher un tuteur' }} />
      <Stack.Screen name="RessourceList" component={RessourceListScreen} options={{ title: 'Ressources' }} />
      <Stack.Screen name="RessourceDetail" component={RessourceDetailScreen} options={{ title: 'Détail ressource' }} />
      <Stack.Screen name="AjoutRessource" component={AjoutRessourceScreen} options={{ title: 'Publier une ressource' }} />
      <Stack.Screen name="EditRessource" component={EditRessourceScreen} options={{ title: 'Modifier ressource' }} />
      <Stack.Screen name="ForumList" component={ForumListScreen} options={{ title: 'Forum' }} />
      <Stack.Screen name="CreateQuestion" component={PoserQuestionScreen} options={{ title: 'Poser une question' }} />
      <Stack.Screen name="PoserQuestion" component={PoserQuestionScreen} options={{ title: 'Poser une question' }} />
      <Stack.Screen name="Forum" component={ForumScreen} options={{ title: 'Forum' }} />
      <Stack.Screen name="StudentForum" component={StudentForumScreen} options={{ title: 'Forum' }} />
      <Stack.Screen name="QuestionDetail" component={QuestionDetailScreen} options={{ title: 'Détail question' }} />
      <Stack.Screen name="Repondre" component={RepondreScreen} options={{ title: 'Répondre' }} />
      <Stack.Screen name="Statistics" component={StatisticsScreen} options={{ title: 'Mes Statistiques' }} />
      <Stack.Screen name="MyResources" component={MyResourcesScreen} options={{ title: 'My Resources' }} />
      <Stack.Screen name="GlobalResources" component={GlobalResourcesScreen} options={{ title: 'Ressources Globales' }} />
      <Stack.Screen name="NousContacter" component={NousContacterScreen} options={{ title: 'Nous contacter' }} />
      {/* Route EditProfil supprimée */}
    </Stack.Navigator>
  );
}