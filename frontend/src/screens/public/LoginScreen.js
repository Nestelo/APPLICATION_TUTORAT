import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import Header from '../../components/ui/Header';
import TextInputField from '../../components/ui/TextInputField';
import Button from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';

const LoginScreen = ({ navigation, route }) => {
  const { role } = route.params || { role: 'etudiant' };
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleLogin = async () => {
    const newErrors = {};
    if (!email) newErrors.email = 'Email requis';
    if (!password) newErrors.password = 'Mot de passe requis';
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setLoading(true);
    const result = await login(email, password);
    if (!result.success) {
      Alert.alert('Erreur de connexion', result.error);
    } else {
      // Redirection selon le rôle de l'utilisateur
      const userRole = result.user?.role;
      console.log('Connexion réussie, rôle:', userRole);
      
      // La connexion est réussie, le système AuthContext va gérer la redirection automatiquement
      // grâce à la logique dans AppTabs.js
      console.log('Redirection automatique vers le dashboard...');
    }
    setLoading(false);
  };

  return (
    <>
      <Header title={`Connexion ${role}`} showBack onBackPress={() => navigation.goBack()} />
      <View style={styles.container}>
        <TextInputField
          label="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInputField
          label="Mot de passe"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <Button
          title="Se connecter"
          onPress={handleLogin}
          loading={loading}
          style={styles.button}
        />
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  button: {
    marginTop: 20,
  },
});

export default LoginScreen;