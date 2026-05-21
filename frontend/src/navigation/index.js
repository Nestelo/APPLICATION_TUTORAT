import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext';
import AuthStack from './AuthStack';
import AppTabs from './AppTabs';
import PublicStack from './PublicStack';

const Stack = createStackNavigator();

export default function AppNav() {
  const { user, isLoading } = useAuth();

  if (isLoading) return null; // ou un écran de chargement

  // Vérifier si l'utilisateur est actif
  // Si is_active n'est pas défini, considérer l'utilisateur comme actif
  const isActiveUser = user && (user.is_active !== undefined ? user.is_active : true);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user && isActiveUser ? (
          <Stack.Screen name="App" component={AppTabs} />
        ) : (
          <>
            <Stack.Screen name="Auth" component={AuthStack} />
            <Stack.Screen name="Public" component={PublicStack} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}