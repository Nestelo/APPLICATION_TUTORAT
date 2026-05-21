import React, { useState } from 'react';
import { 
  View, 
  StyleSheet, 
  Text, 
  TextInput, 
  Button, 
  Alert, 
  Image, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView,
  TouchableOpacity
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import api from '../../api/axiosConfig';
import Header from '../../components/ui/Header';
import { Ionicons } from '@expo/vector-icons';

const InscriptionStudentScreen = ({ navigation }) => {
  const [prenom, setPrenom] = useState('');
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [filiere, setFiliere] = useState('');
  const [annee, setAnnee] = useState('');
  const [photo, setPhoto] = useState(null);
  const [tempPhoto, setTempPhoto] = useState(null); // Stocke la photo temporaire avant validation
  const [loading, setLoading] = useState(false);

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission refusée', 'Nous avons besoin de la permission pour utiliser la caméra.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });
    if (!result.canceled) {
      setTempPhoto(result.assets[0].uri); // Stocke temporairement
    }
  };

  const handleValidatePhoto = () => {
    if (tempPhoto) {
      setPhoto(tempPhoto);
      setTempPhoto(null); // Efface la temporaire
    }
  };

  const handleCancelPhoto = () => {
    setTempPhoto(null); // Annule la prise de vue
  };

  const handleSubmit = async () => {
    if (!prenom || !nom || !email || !password || !confirmPassword || !filiere) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('email', email);
      formData.append('nom', nom);
      formData.append('prenom', prenom);
      formData.append('password', password);
      formData.append('password2', confirmPassword);
      formData.append('role', 'etudiant');
      formData.append('filiere', filiere);
      formData.append('annee', annee);
      if (photo) {
        const filename = photo.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        formData.append('photo', { uri: photo, name: filename, type });
      }

      await api.post('/auth/register/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      Alert.alert('Succès', 'Inscription réussie ! Vous pouvez maintenant vous connecter.');
      navigation.navigate('Connexion');
    } catch (error) {
      console.error(error);
      const message = error.response?.data?.email?.[0] ||
                      error.response?.data?.password?.[0] ||
                      'Erreur lors de l\'inscription';
      Alert.alert('Erreur', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header title="Inscription étudiant" showBack onBackPress={() => navigation.goBack()} />
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.globalContainer}>
            <View style={styles.logoRow}>
              <View style={styles.logoContainer}>
                <Image
                  source={require('../../../assets/images/logo-insta.png')}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View>
              {photo && (
                <View style={styles.photoContainer}>
                  <Image source={{ uri: photo }} style={styles.photoPreview} />
                </View>
              )}
            </View>

            <View style={styles.formContainer}>
              <Text style={styles.title}>Inscription</Text>
              <Text style={styles.subtitle}>Complétez vos informations</Text>

              {/* Bouton pour prendre une photo */}
              <TouchableOpacity style={styles.photoButton} onPress={handleTakePhoto}>
                <Ionicons name="camera" size={24} color="#00796B" />
                <Text style={styles.photoButtonText}>
                  {photo ? 'Changer la photo' : 'Prendre une photo (optionnel)'}
                </Text>
              </TouchableOpacity>

              {/* Aperçu de la photo temporaire avec boutons de validation */}
              {tempPhoto && (
                <View style={styles.tempPhotoContainer}>
                  <Image source={{ uri: tempPhoto }} style={styles.tempPhoto} />
                  <View style={styles.tempPhotoButtons}>
                    <TouchableOpacity style={styles.validateButton} onPress={handleValidatePhoto}>
                      <Text style={styles.validateButtonText}>Valider</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.cancelButton} onPress={handleCancelPhoto}>
                      <Text style={styles.cancelButtonText}>Annuler</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              <TextInput
                style={styles.input}
                placeholder="Prénom *"
                value={prenom}
                onChangeText={setPrenom}
              />
              <TextInput
                style={styles.input}
                placeholder="Nom *"
                value={nom}
                onChangeText={setNom}
              />
              <TextInput
                style={styles.input}
                placeholder="Email *"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <TextInput
                style={styles.input}
                placeholder="Filière *"
                value={filiere}
                onChangeText={setFiliere}
              />
              <TextInput
                style={styles.input}
                placeholder="Année (L1, L2, L3, M1, M2)"
                value={annee}
                onChangeText={setAnnee}
              />
              <TextInput
                style={styles.input}
                placeholder="Mot de passe *"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
              <TextInput
                style={styles.input}
                placeholder="Confirmez le mot de passe *"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />

              <View style={styles.buttonContainer}>
                <Button
                  title={loading ? "Inscription en cours..." : "Créer mon compte"}
                  onPress={handleSubmit}
                  color="#00796B"
                  disabled={loading}
                />
              </View>

              <View style={styles.footer}>
                <Text>Déjà un compte ? <Text style={styles.link} onPress={() => navigation.navigate('Connexion')}>Se connecter</Text></Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#E0F7FA',
  },
  globalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 20,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  logoContainer: {
    alignItems: 'center',
  },
  logo: {
    width: 80,
    height: 80,
  },
  photoContainer: {
    alignItems: 'center',
  },
  photoPreview: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#00796B',
  },
  formContainer: {
    padding: 10,
  },
  title: {
    fontSize: 28,
    textAlign: 'center',
    marginBottom: 10,
    color: '#00796B',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#777',
  },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderWidth: 1,
    borderColor: '#00796B',
    borderRadius: 5,
    marginBottom: 15,
  },
  photoButtonText: {
    marginLeft: 10,
    color: '#00796B',
    fontSize: 16,
  },
  tempPhotoContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  tempPhoto: {
    width: 120,
    height: 120,
    borderRadius: 10,
    marginBottom: 10,
  },
  tempPhotoButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  validateButton: {
    backgroundColor: '#00796B',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  validateButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#f44336',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  cancelButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    borderColor: '#00796B',
    borderRadius: 5,
    padding: 15,
    marginBottom: 15,
    width: '100%',
  },
  buttonContainer: {
    marginTop: 10,
    marginBottom: 20,
    width: '100%',
  },
  footer: {
    marginTop: 20,
    textAlign: 'center',
  },
  link: {
    color: '#007BFF',
  },
});

export default InscriptionStudentScreen;