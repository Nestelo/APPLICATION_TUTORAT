import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
import Header from '../../components/ui/Header';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import CustomInput from '../../components/ui/Input';
import { createUser } from '../../api/userService';

const CreateUserScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    email: '',
    nom: '',
    prenom: '',
    role: 'etudiant',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    // Validation
    if (!formData.email || !formData.nom || !formData.prenom) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
      return;
    }

    if (formData.password.length < 6) {
      Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setLoading(true);
    try {
      const result = await createUser({
        email: formData.email,
        nom: formData.nom,
        prenom: formData.prenom,
        role: formData.role,
        password: formData.password,
        password2: formData.confirmPassword,
      });

      if (result.success) {
        Alert.alert('Succès', 'Utilisateur créé avec succès', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        Alert.alert('Erreur', result.error || 'Impossible de créer l\'utilisateur');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <>
      <Header title="Créer un utilisateur" showBack />
      <ScrollView style={styles.container}>
        <Card style={styles.formCard}>
          <Text style={styles.sectionTitle}>Informations de base</Text>
          
          <CustomInput
            placeholder="Email *"
            value={formData.email}
            onChangeText={(value) => updateField('email', value)}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          
          <CustomInput
            placeholder="Nom *"
            value={formData.nom}
            onChangeText={(value) => updateField('nom', value)}
            autoCapitalize="words"
          />
          
          <CustomInput
            placeholder="Prénom *"
            value={formData.prenom}
            onChangeText={(value) => updateField('prenom', value)}
            autoCapitalize="words"
          />
        </Card>

        <Card style={styles.formCard}>
          <Text style={styles.sectionTitle}>Rôle et mot de passe</Text>
          
          <View style={styles.roleContainer}>
            <Text style={styles.label}>Rôle:</Text>
            {['etudiant', 'tuteur', 'enseignant', 'admin'].map(role => (
              <Button
                key={role}
                title={role.charAt(0).toUpperCase() + role.slice(1)}
                variant={formData.role === role ? 'primary' : 'outline'}
                onPress={() => updateField('role', role)}
                style={styles.roleButton}
              />
            ))}
          </View>
          
          <CustomInput
            placeholder="Mot de passe *"
            value={formData.password}
            onChangeText={(value) => updateField('password', value)}
            secureTextEntry
          />
          
          <CustomInput
            placeholder="Confirmer le mot de passe *"
            value={formData.confirmPassword}
            onChangeText={(value) => updateField('confirmPassword', value)}
            secureTextEntry
          />
        </Card>

        <View style={styles.actions}>
          <Button
            title="Créer l'utilisateur"
            onPress={handleCreate}
            loading={loading}
            style={styles.createButton}
          />
          <Button
            title="Annuler"
            variant="outline"
            onPress={() => navigation.goBack()}
            style={styles.cancelButton}
          />
        </View>
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  formCard: {
    margin: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  roleContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  roleButton: {
    marginBottom: 8,
  },
  actions: {
    padding: 16,
    gap: 12,
  },
  createButton: {
    marginBottom: 8,
  },
  cancelButton: {
    marginTop: 8,
  },
});

export default CreateUserScreen;
