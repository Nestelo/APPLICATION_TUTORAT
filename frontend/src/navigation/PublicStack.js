import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import AccueilScreen from '../screens/public/AccueilScreen';
import MissionsScreen from '../screens/public/MissionsScreen';
import AProposScreen from '../screens/public/AProposScreen';
import NousContacterScreen from '../screens/public/NousContacterScreen';

const Stack = createStackNavigator();

export default function PublicStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="Accueil" 
        component={AccueilScreen} 
        options={{ title: 'Accueil' }} 
      />
      <Stack.Screen 
        name="Missions" 
        component={MissionsScreen} 
        options={{ title: 'Missions' }} 
      />
      <Stack.Screen 
        name="APropos" 
        component={AProposScreen} 
        options={{ title: 'À propos' }} 
      />
      <Stack.Screen 
        name="NousContacter" 
        component={NousContacterScreen} 
        options={{ title: 'Nous contacter' }} 
      />
    </Stack.Navigator>
  );
}
