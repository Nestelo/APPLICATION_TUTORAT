import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
  TouchableOpacity,
  Text,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/ui/Header';
import CustomInput from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { getProfile, updateProfile, getUserById, updateUser } from '../../api/userService';
import { useAuth } from '../../context/AuthContext';

const EditProfilScreen = ({ navigation, route }) => {
  const { user, updateUser: updateAuthUser } = useAuth();
  const { userId } = route.params || {};
  const isEditingOtherUser = !!userId;
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    bio: '',
    filiere: '',
    annee: '',
    centres_interet: '',
    matieres_maitrisees: '',
    tarif_horaire: '',
    photo: null,
    role: '',
  });
  const [photoUri, setPhotoUri] = useState(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      let data;
      if (isEditingOtherUser) {
        // Charger le profil d'un autre utilisateur
        const result = await getUserById(userId);
        if (result.success) {
          data = result.data;
        } else {
          Alert.alert('Erreur', 'Impossible de charger les données de cet utilisateur');
          navigation.goBack();
          return;
        }
      } else {
        // Charger le profil de l'utilisateur connecté
        data = await getProfile();
      }
      
      setFormData({
        nom: data.nom || '',
        prenom: data.prenom || '',
        bio: data.bio || '',
        filiere: data.filiere || '',
        annee: data.annee || '',
        centres_interet: data.centres_interet || '',
        matieres_maitrisees: data.matieres_maitrisees || '',
        tarif_horaire: data.tarif_horaire ? data.tarif_horaire.toString() : '',
        role: data.role || '',
      });
      if (data.photo) {
        setPhotoUri(data.photo);
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de charger les données');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
  };

  const pickImage = async () => {
    Alert.alert(
      'Changer la photo',
      'Choisissez une source',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Prendre une photo', onPress: takePhoto },
        { text: 'Choisir depuis la galerie', onPress: chooseFromGallery },
      ]
    );
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission refusée', 'Nous avons besoin de la caméra.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });
    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const chooseFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission refusée', 'Nous avons besoin d\'accéder à vos photos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });
    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const data = new FormData();
      data.append('nom', formData.nom);
      data.append('prenom', formData.prenom);

      // Champs selon le rôle
      const targetUserRole = isEditingOtherUser ? formData.role : user?.role;
      if (targetUserRole !== 'admin') {
        // Année et filière pour les non-admins
        data.append('annee', formData.annee);
        data.append('filiere', formData.filiere);
      }

      if (targetUserRole === 'tuteur' || targetUserRole === 'enseignant') {
        if (formData.bio) data.append('bio', formData.bio);
        if (formData.centres_interet) data.append('centres_interet', formData.centres_interet);
        if (formData.matieres_maitrisees) data.append('matieres_maitrisees', formData.matieres_maitrisees);
        if (formData.tarif_horaire) data.append('tarif_horaire', formData.tarif_horaire);
      }

      if (photoUri && photoUri !== formData.photo) {
        const filename = photoUri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        data.append('photo', { uri: photoUri, name: filename, type });
      }

      let updatedUser;
      if (isEditingOtherUser) {
        updatedUser = await updateUser(userId, data);
      } else {
        updatedUser = await updateProfile(data);
        updateAuthUser(updatedUser); // Mettre à jour le contexte d'authentification
      }

      // Redirection selon le rôle de l'utilisateur modifié
      Alert.alert('Succès', 'Profil mis à jour avec succès!', [
        {
          text: 'OK',
          onPress: () => {
            if (isEditingOtherUser) {
              // Si on modifie un autre utilisateur, retourner au dashboard admin
              navigation.navigate('AdminDashboard');
            } else {
              // Si on modifie son propre profil, retourner à l'accueil selon son rôle
              const userRole = updatedUser?.role || user?.role;
              switch (userRole) {
                case 'admin':
                  navigation.navigate('Home');
                  break;
                case 'tuteur':
                case 'enseignant':
                  navigation.navigate('Home');
                  break;
                case 'etudiant':
                  navigation.navigate('Home');
                  break;
                default:
                  navigation.navigate('Home');
              }
            }
          }
        }
      ]);
    } catch (error) {
      console.error(error);
      Alert.alert('Erreur', 'Échec de la mise à jour');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <>
      <Header title="Modifier le profil" showBack onBackPress={() => navigation.goBack()} />
      <ScrollView style={styles.container}>
        <TouchableOpacity style={styles.photoContainer} onPress={pickImage}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.photo} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Ionicons name="camera" size={40} color="#999" />
              <Text style={styles.photoText}>Ajouter une photo</Text>
            </View>
          )}
        </TouchableOpacity>

        <CustomInput
          label="Nom"
          value={formData.nom}
          onChangeText={(text) => handleChange('nom', text)}
        />
        <CustomInput
          label="Prénom"
          value={formData.prenom}
          onChangeText={(text) => handleChange('prenom', text)}
        />

        {!isEditingOtherUser && user?.role !== 'admin' && (
          <>
            <CustomInput
              label="Année"
              value={formData.annee}
              onChangeText={(text) => handleChange('annee', text)}
            />
            <CustomInput
              label="Filière"
              value={formData.filiere}
              onChangeText={(text) => handleChange('filiere', text)}
            />
          </>
        )}

        {(!isEditingOtherUser && (user?.role === 'tuteur' || user?.role === 'enseignant')) || 
          (isEditingOtherUser && (formData.role === 'tuteur' || formData.role === 'enseignant')) ? (
          <>
            <CustomInput
              label="Bio"
              value={formData.bio}
              onChangeText={(text) => handleChange('bio', text)}
              multiline
              numberOfLines={3}
            />
            <CustomInput
              label="Centres d'intérêt"
              value={formData.centres_interet}
              onChangeText={(text) => handleChange('centres_interet', text)}
            />
            <CustomInput
              label="Matières maîtrisées"
              value={formData.matieres_maitrisees}
              onChangeText={(text) => handleChange('matieres_maitrisees', text)}
            />
            <CustomInput
              label="Tarif horaire"
              value={formData.tarif_horaire}
              onChangeText={(text) => handleChange('tarif_horaire', text)}
              keyboardType="numeric"
            />
          </>
        ) : null}

        <Button
          title="Enregistrer"
          onPress={handleSubmit}
          loading={submitting}
          style={styles.button}
        />
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  photoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoText: {
    marginTop: 5,
    fontSize: 12,
    color: '#999',
  },
  button: {
    marginVertical: 20,
  },
});

export default EditProfilScreen;