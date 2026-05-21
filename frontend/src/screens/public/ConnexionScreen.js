import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/ui/Header';
import { useAuth } from '../../context/AuthContext';

const { width } = Dimensions.get("window");
const isSmallDevice = width < 380;

const ConnexionScreen = ({ navigation }) => {
  const { login } = useAuth();
  const [selectedRole, setSelectedRole] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);

  const roles = [
    { label: 'Étudiant', value: 'etudiant', icon: 'person' },
    { label: 'Tuteur', value: 'tuteur', icon: 'school' },
    { label: 'Admin', value: 'admin', icon: 'shield' },
  ];

  const handleSelectRole = (role) => {
    setSelectedRole(role);
    // Message d'information lorsque l'utilisateur choisit "Tuteur"
    if (role === 'tuteur') {
      Alert.alert('Info', 'Si vous êtes enseignant, vous pouvez aussi vous connecter avec le profil Tuteur.');
    }
  };

  const handleLogin = async () => {
    if (!selectedRole) {
      Alert.alert('Erreur', 'Veuillez sélectionner un rôle.');
      return;
    }
    if (!email || !password) {
      Alert.alert('Erreur', 'Veuillez entrer votre email et mot de passe.');
      return;
    }

    setLoading(true);
    // Appel à login avec le rôle sélectionné
    const result = await login(email, password, selectedRole);
    setLoading(false);

    if (!result.success) {
      Alert.alert('Erreur de connexion', result.error);
      return;
    }

    // Si la connexion réussit, le rôle a déjà été vérifié par le backend
    // La redirection est gérée par AuthContext et AppTabs
  };

  return (
    <>
      <Header title="Connexion" showBack onBackPress={() => navigation.goBack()} />
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* Section Welcome */}
        <View style={styles.welcomeSection}>
          <View style={styles.logoContainer}>
            <Ionicons name="school-outline" size={isSmallDevice ? 40 : 50} color="#00796B" />
          </View>
          <Text style={styles.welcomeTitle}>Bienvenue sur INSTA Tutorat</Text>
          <Text style={styles.welcomeSubtitle}>
            Connectez-vous pour accéder à votre espace personnalisé et commencer votre apprentissage
          </Text>
        </View>

        {/* Section Rôles */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Choisissez votre profil</Text>
          <View style={styles.rolesContainer}>
            {roles.map((role) => (
              <TouchableOpacity
                key={role.value}
                style={[styles.roleCard, selectedRole === role.value && styles.selectedCard]}
                onPress={() => handleSelectRole(role.value)}
                activeOpacity={0.8}
              >
                <View style={[styles.iconContainer, selectedRole === role.value && styles.selectedIconContainer]}>
                  <Ionicons
                    name={role.icon}
                    size={isSmallDevice ? 24 : 28}
                    color={selectedRole === role.value ? "#fff" : "#00796B"}
                  />
                </View>
                <Text style={[styles.roleLabel, selectedRole === role.value && styles.selectedRoleLabel]}>
                  {role.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Section Formulaire */}
        <View style={styles.sectionContainer}>
          <View style={styles.inputContainer}>
            <View style={[styles.inputWrapper, focusedInput === 'email' && styles.inputFocused]}>
              <Ionicons name="mail-outline" size={20} color="#64748b" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="Adresse email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                onFocus={() => setFocusedInput('email')}
                onBlur={() => setFocusedInput(null)}
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <View style={[styles.inputWrapper, focusedInput === 'password' && styles.inputFocused]}>
              <Ionicons name="lock-closed-outline" size={20} color="#64748b" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="Mot de passe"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                onFocus={() => setFocusedInput('password')}
                onBlur={() => setFocusedInput(null)}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.passwordToggle}>
                <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#64748b" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Bouton de connexion */}
        <TouchableOpacity
          style={[styles.loginButton, (!selectedRole || loading) && styles.loginButtonDisabled]}
          onPress={handleLogin}
          disabled={!selectedRole || loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="log-in-outline" size={20} color="#fff" style={styles.buttonIcon} />
              <Text style={styles.loginButtonText}>Se connecter</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Lien d'inscription */}
        <View style={styles.footerSection}>
          <Text style={styles.footerText}>Pas encore de compte ?</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Inscription')}>
            <Text style={styles.footerLink}>S'inscrire</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  welcomeSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    width: isSmallDevice ? 80 : 100,
    height: isSmallDevice ? 80 : 100,
    borderRadius: isSmallDevice ? 40 : 50,
    backgroundColor: '#E0F2F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  welcomeTitle: {
    fontSize: isSmallDevice ? 24 : 28,
    fontWeight: 'bold',
    color: '#00796B',
    textAlign: 'center',
    marginBottom: 10,
  },
  welcomeSubtitle: {
    fontSize: isSmallDevice ? 14 : 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  sectionContainer: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: isSmallDevice ? 18 : 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 20,
    textAlign: 'center',
  },
  rolesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  roleCard: {
    flex: 1,
    alignItems: 'center',
    padding: isSmallDevice ? 16 : 20,
    marginHorizontal: 5,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  selectedCard: {
    backgroundColor: '#00796B',
    shadowColor: '#00796B',
    shadowOpacity: 0.2,
  },
  iconContainer: {
    width: isSmallDevice ? 40 : 50,
    height: isSmallDevice ? 40 : 50,
    borderRadius: isSmallDevice ? 20 : 25,
    backgroundColor: '#E0F2F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  selectedIconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  roleLabel: {
    fontSize: isSmallDevice ? 14 : 16,
    color: '#64748b',
    fontWeight: '500',
  },
  selectedRoleLabel: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    paddingHorizontal: 15,
    paddingVertical: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  inputFocused: {
    shadowColor: '#00796B',
    shadowOpacity: 0.15,
    borderWidth: 1,
    borderColor: '#00796B',
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: isSmallDevice ? 16 : 18,
    color: '#1e293b',
    paddingVertical: isSmallDevice ? 12 : 15,
  },
  passwordToggle: {
    marginLeft: 10,
    padding: 5,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00796B',
    paddingVertical: isSmallDevice ? 16 : 18,
    paddingHorizontal: 30,
    borderRadius: 25,
    shadowColor: '#00796B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 20,
  },
  loginButtonDisabled: {
    backgroundColor: '#94A3B8',
    shadowColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: isSmallDevice ? 16 : 18,
    fontWeight: 'bold',
  },
  buttonIcon: {
    marginRight: 8,
  },
  footerSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: isSmallDevice ? 14 : 16,
    color: '#64748b',
    marginRight: 5,
  },
  footerLink: {
    fontSize: isSmallDevice ? 14 : 16,
    color: '#00796B',
    fontWeight: 'bold',
  },
});

export default ConnexionScreen;