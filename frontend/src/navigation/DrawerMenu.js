import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { useAuth } from '../context/AuthContext';
import StudentStack from './StudentStack';
import TutorStack from './TutorStack';
import AdminStack from './AdminStack';
import ProfilScreen from '../screens/auth/ProfilScreen';
import NotificationsScreen from '../screens/auth/NotificationsScreen';

const Drawer = createDrawerNavigator();

export default function DrawerMenu() {
  const { user } = useAuth();

  // Sélection du stack en fonction du rôle
  const getRoleStack = () => {
    switch (user?.role) {
      case 'etudiant':
        return StudentStack;
      case 'tuteur':
      case 'enseignant':
        return TutorStack;
      case 'admin':
        return AdminStack;
      default:
        return StudentStack; // fallback
    }
  };

  const RoleStack = getRoleStack();

  return (
    <Drawer.Navigator>
      <Drawer.Screen name="Accueil" component={RoleStack} />
      <Drawer.Screen name="Profil" component={ProfilScreen} />
      <Drawer.Screen name="Notifications" component={NotificationsScreen} />
    </Drawer.Navigator>
  );
}