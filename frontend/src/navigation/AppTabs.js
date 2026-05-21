import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import StudentStack from './StudentStack';
import TutorStack from './TutorStack';
import AdminStack from './AdminStack';
import ProfileStack from './MonProfil';
import PublicStack from './PublicStack';
import NotificationsScreen from '../screens/auth/NotificationsScreen';
import TabBarIcon from '../components/navigation/TabBarIcon';

const Tab = createBottomTabNavigator();

export default function AppTabs() {
  const { user } = useAuth();
  const { unreadCount } = useNotifications();

  const getMainStack = () => {
    // Vérifier si l'utilisateur est actif
    // Si is_active n'est pas défini, considérer l'utilisateur comme actif
    if (!user || (user.is_active !== undefined && !user.is_active)) {
      return null; // Ne pas donner accès si inactif
    }
    
    switch (user?.role) {
      case 'etudiant':
        return StudentStack;
      case 'tuteur':
      case 'enseignant':
        return TutorStack;
      case 'admin':
        return AdminStack;
      default:
        return StudentStack;
    }
  };

  const MainStack = getMainStack();
  
  // Si l'utilisateur n'est pas actif, ne pas afficher les tabs
  if (!MainStack) {
    return (
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;
            if (route.name === 'Public') {
              iconName = focused ? 'earth' : 'earth-outline';
            }
            return <TabBarIcon name={iconName} color={color} size={size} />;
          },
          tabBarActiveTintColor: '#007bff',
          tabBarInactiveTintColor: 'gray',
        })}
      >
        <Tab.Screen
          name="Public"
          component={PublicStack}
          options={{ title: 'Public' }}
        />
      </Tab.Navigator>
    );
  }

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Profil') {
            iconName = focused ? 'person' : 'person-outline';
          } else if (route.name === 'Notifications') {
            iconName = focused ? 'notifications' : 'notifications-outline';
          }
          return <TabBarIcon name={iconName} color={color} size={size} />;
        },
        tabBarActiveTintColor: '#007bff',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen
        name="Home"
        component={MainStack}
        options={{ title: 'Accueil' }}
      />
      <Tab.Screen
        name="Profil"
        component={ProfileStack}
        options={{ title: 'Profil' }}
      />
      <Tab.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          title: 'Notifications',
          tabBarBadge: unreadCount > 0 ? unreadCount : null,
        }}
      />
      <Tab.Screen
        name="Public"
        component={PublicStack}
        options={{
          title: 'Public',
          tabBarIcon: ({ focused, color, size }) => {
            return <TabBarIcon name={focused ? 'earth' : 'earth-outline'} color={color} size={size} />;
          },
        }}
      />
    </Tab.Navigator>
  );
}