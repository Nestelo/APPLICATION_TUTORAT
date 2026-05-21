import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import AccueilScreen from '../screens/public/AccueilScreen';
import ConnexionScreen from '../screens/public/ConnexionScreen';
import LoginScreen from '../screens/public/LoginScreen';
import InscriptionStudentScreen from '../screens/public/InscriptionStudentScreen';
import DevenirTuteurScreen from '../screens/public/DevenirTuteurScreen';
import MissionsScreen from '../screens/public/MissionsScreen';
import AProposScreen from '../screens/public/AProposScreen';
import ApercuTutoratScreen from '../screens/public/ApercuTutoratScreen';

const Stack = createStackNavigator();

export default function AuthStack() {
  return (
    <Stack.Navigator initialRouteName="Accueil">
      <Stack.Screen
        name="Accueil"
        component={AccueilScreen}
        options={{ headerShown: false }}
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
        name="Connexion"
        component={ConnexionScreen}
        options={{ title: 'Connexion' }}
      />
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ title: 'Se connecter' }}
      />
      <Stack.Screen
        name="Inscription"
        component={InscriptionStudentScreen}
        options={{ title: 'Inscription étudiant' }}
      />
      <Stack.Screen
        name="DevenirTuteur"
        component={DevenirTuteurScreen}
        options={{ title: 'Devenir tuteur' }}
      />
      <Stack.Screen
        name="ApercuTutorat"
        component={ApercuTutoratScreen}
        options={{ title: 'Aperçu tutorat' }}
      />
    </Stack.Navigator>
  );
}