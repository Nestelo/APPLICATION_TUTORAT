import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import ProfilScreen from '../screens/auth/ProfilScreen';
import EditProfilScreen from '../screens/auth/EditProfilScreen';

const Stack = createStackNavigator();

export default function ProfileStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="MonProfil"
        component={ProfilScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="EditProfil"
        component={EditProfilScreen}
        options={{ title: 'Modifier le profil' }}
      />
    </Stack.Navigator>
  );
}