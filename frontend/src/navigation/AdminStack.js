import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import GestionUtilisateursScreen from '../screens/admin/GestionUtilisateursScreen';
import UsersListScreen from '../screens/admin/UsersListScreen';
import CreateUserScreen from '../screens/admin/CreateUserScreen';
import SettingsScreen from '../screens/admin/SettingsScreen';
import UtilisateurDetailScreen from '../screens/admin/UtilisateurDetailScreen';
import GestionRessourcesScreen from '../screens/admin/GestionRessourcesScreen';
import ValidationRessourceScreen from '../screens/admin/ValidationRessourceScreen';
import ValidationRessourcesGroupeScreen from '../screens/admin/ValidationRessourcesGroupeScreen';
import AdminValidationRessourcesScreen from '../screens/admin/AdminValidationRessourcesScreen';
import GestionTutoratScreen from '../screens/admin/GestionTutoratScreen';
import ModerationScreen from '../screens/admin/ModerationScreen';
import CommunicationScreen from '../screens/admin/CommunicationScreen';
import RapportsScreen from '../screens/admin/RapportsScreen';
import ValidationTuteurScreen from '../screens/admin/ValidationTuteurScreen';
import MessagesScreen from '../screens/admin/MessagesScreen';
import MessageDetailScreen from '../screens/admin/MessageDetailScreen';
import DownloadsScreen from '../screens/admin/DownloadsScreen';
import EditProfilScreen from '../screens/auth/EditProfilScreen'; // Pour modifier le profil depuis l'admin
import DebugScreen from '../screens/shared/DebugScreen'; // Pour diagnostic
import AdminForumScreen from '../screens/admin/AdminForumScreen';
import ForumListScreen from '../screens/forum/ForumListScreen';
import PoserQuestionScreen from '../screens/forum/PoserQuestionScreen';
import ForumScreen from '../screens/forum/ForumScreen';
import QuestionDetailScreen from '../screens/forum/QuestionDetailScreen';
import RepondreScreen from '../screens/forum/RepondreScreen';

const Stack = createStackNavigator();

export default function AdminStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="AdminDashboard"
        component={AdminDashboardScreen}
        options={{ title: 'Administration' }}
      />
      <Stack.Screen
        name="GestionUtilisateurs"
        component={GestionUtilisateursScreen}
        options={{ title: 'Gestion des utilisateurs' }}
      />
      <Stack.Screen
        name="UsersList"
        component={UsersListScreen}
        options={{ title: 'Liste des utilisateurs' }}
      />
      <Stack.Screen
        name="CreateUser"
        component={CreateUserScreen}
        options={{ title: 'Créer un utilisateur' }}
      />
      <Stack.Screen
        name="UtilisateurDetail"
        component={UtilisateurDetailScreen}
        options={{ title: 'Détail utilisateur' }}
      />
      <Stack.Screen
        name="GestionRessources"
        component={GestionRessourcesScreen}
        options={{ title: 'Gestion des ressources' }}
      />
      <Stack.Screen
        name="ValidationRessource"
        component={ValidationRessourceScreen}
        options={{ title: 'Validation' }}
      />
      <Stack.Screen
        name="AdminValidationRessources"
        component={AdminValidationRessourcesScreen}
        options={{ title: 'Validation des ressources' }}
      />
      <Stack.Screen
        name="ValidationRessourcesGroupe"
        component={ValidationRessourcesGroupeScreen}
        options={{ title: 'Validation ressources groupe' }}
      />
      <Stack.Screen
        name="ValidationTuteur"
        component={ValidationTuteurScreen}
        options={{ title: 'Validation des tuteurs' }}
      />
      <Stack.Screen
        name="GestionTutorat"
        component={GestionTutoratScreen}
        options={{ title: 'Gestion du tutorat' }}
      />
      <Stack.Screen
        name="Moderation"
        component={ModerationScreen}
        options={{ title: 'Modération' }}
      />
      <Stack.Screen
        name="Communication"
        component={CommunicationScreen}
        options={{ title: 'Communication' }}
      />
      <Stack.Screen
        name="Rapports"
        component={RapportsScreen}
        options={{ title: 'Rapports' }}
      />
      <Stack.Screen
        name="Downloads"
        component={DownloadsScreen}
        options={{ title: 'Téléchargements' }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Paramètres' }}
      />
      <Stack.Screen
        name="EditProfil"
        component={EditProfilScreen}
        options={{ title: 'Modifier le profil' }}
      />
      <Stack.Screen
        name="Messages"
        component={MessagesScreen}
        options={{ title: 'Messages' }}
      />
      <Stack.Screen
        name="MessageDetail"
        component={MessageDetailScreen}
        options={{ title: 'Conversation' }}
      />
      <Stack.Screen
        name="Debug"
        component={DebugScreen}
        options={{ title: 'Diagnostic' }}
      />
      <Stack.Screen
        name="AdminForum"
        component={AdminForumScreen}
        options={{ title: 'Forum Administration' }}
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
    </Stack.Navigator>
  );
}