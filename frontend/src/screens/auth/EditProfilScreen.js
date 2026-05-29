import React, { useState, useEffect } from 'react';
import {
  View, StyleSheet, ScrollView, Alert, Image, TouchableOpacity, Text,
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
    nom: '', prenom: '', bio: '', filiere: '', annee: '',
    centres_interet: '', matieres_maitrisees: '', tarif_horaire: '', photo: null, role: '',
  });
  const [photoUri, setPhotoUri] = useState(null);

  useEffect(() => { loadProfile(); }, []);

  const loadProfile = async () => {
    try {
      let data;
      if (isEditingOtherUser) {
        const result = await getUserById(userId);
        if (!result.success) throw new Error(result.error || 'Erreur lors du chargement');
        data = result.data;
      } else {
        // ✅ getProfile renvoie directement l'objet user
        data = await getProfile();
      }

      setFormData({
        nom: data.nom || '', prenom: data.prenom || '', bio: data.bio || '',
        filiere: data.filiere || '', annee: data.annee || '',
        centres_interet: data.centres_interet || '', matieres_maitrisees: data.matieres_maitrisees || '',
        tarif_horaire: data.tarif_horaire ? data.tarif_horaire.toString() : '',
        role: data.role || '',
      });
      
      // ✅ Utiliser photo_url (Cloudinary) si disponible, sinon photo locale
      const imgUrl = data.photo_url || data.photo;
      if (imgUrl) setPhotoUri(imgUrl);
    } catch (error) {
      console.error(error);
      Alert.alert('Erreur', 'Impossible de charger les données');
    } finally { setLoading(false); }
  };

  const handleChange = (name, value) => setFormData({ ...formData, [name]: value });

  const pickImage = () => {
    Alert.alert('Changer la photo', 'Choisissez une source', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Prendre une photo', onPress: takePhoto },
      { text: 'Choisir depuis la galerie', onPress: chooseFromGallery },
    ]);
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission refusée', 'Nous avons besoin de la caméra.'); return; }
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1,1], quality: 0.5 });
    if (!result.canceled) setPhotoUri(result.assets[0].uri);
  };

  const chooseFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission refusée', 'Accès aux photos requis.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [1,1], quality: 0.5 });
    if (!result.canceled) setPhotoUri(result.assets[0].uri);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('nom', formData.nom);
      formDataToSend.append('prenom', formData.prenom);

      const targetRole = isEditingOtherUser ? formData.role : user?.role;
      if (targetRole !== 'admin') {
        formDataToSend.append('annee', formData.annee);
        formDataToSend.append('filiere', formData.filiere);
      }
      if (targetRole === 'tuteur' || targetRole === 'enseignant') {
        if (formData.bio) formDataToSend.append('bio', formData.bio);
        if (formData.centres_interet) formDataToSend.append('centres_interet', formData.centres_interet);
        if (formData.matieres_maitrisees) formDataToSend.append('matieres_maitrisees', formData.matieres_maitrisees);
        if (formData.tarif_horaire) formDataToSend.append('tarif_horaire', formData.tarif_horaire);
      }
      
      // ✅ Si l'image locale a changé, l'ajouter au formulaire d'envoi
      if (photoUri && photoUri !== formData.photo && !photoUri.startsWith('http')) {
        const filename = photoUri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        formDataToSend.append('photo', { uri: photoUri, name: filename, type });
      }

      let updatedUser;
      if (isEditingOtherUser) {
        const result = await updateUser(userId, formDataToSend);
        if (!result.success) throw new Error(result.error || 'Erreur lors de la mise à jour');
        updatedUser = result.data;
      } else {
        // ✅ updateProfile renvoie directement l'objet user
        updatedUser = await updateProfile(formDataToSend);
        if (updatedUser) updateAuthUser(updatedUser);
      }
      if (!updatedUser) throw new Error('Aucune donnée retournée');

      // ✅ Mise à jour immédiate de l’image avec l’URL Cloudinary renvoyée par le serveur
      if (updatedUser.photo_url) setPhotoUri(updatedUser.photo_url);

      Alert.alert('Succès', 'Profil mis à jour !', [
        { text: 'OK', onPress: () => navigation.navigate(isEditingOtherUser ? 'AdminDashboard' : 'Home') }
      ]);
    } catch (error) {
      console.error(error);
      Alert.alert('Erreur', 'Échec de la mise à jour');
    } finally { setSubmitting(false); }
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

        <CustomInput label="Nom" value={formData.nom} onChangeText={(t) => handleChange('nom', t)} />
        <CustomInput label="Prénom" value={formData.prenom} onChangeText={(t) => handleChange('prenom', t)} />

        {!isEditingOtherUser && user?.role !== 'admin' && (
          <>
            <CustomInput label="Année" value={formData.annee} onChangeText={(t) => handleChange('annee', t)} />
            <CustomInput label="Filière" value={formData.filiere} onChangeText={(t) => handleChange('filiere', t)} />
          </>
        )}

        {(!isEditingOtherUser && (user?.role === 'tuteur' || user?.role === 'enseignant')) ||
         (isEditingOtherUser && (formData.role === 'tuteur' || formData.role === 'enseignant')) ? (
          <>
            <CustomInput label="Bio" value={formData.bio} onChangeText={(t) => handleChange('bio', t)} multiline numberOfLines={3} />
            <CustomInput label="Centres d'intérêt" value={formData.centres_interet} onChangeText={(t) => handleChange('centres_interet', t)} />
            <CustomInput label="Matières maîtrisées" value={formData.matieres_maitrisees} onChangeText={(t) => handleChange('matieres_maitrisees', t)} />
            <CustomInput label="Tarif horaire" value={formData.tarif_horaire} onChangeText={(t) => handleChange('tarif_horaire', t)} keyboardType="numeric" />
          </>
        ) : null}

        <Button title="Enregistrer" onPress={handleSubmit} loading={submitting} style={styles.button} />
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  photoContainer: { alignItems: 'center', marginBottom: 20 },
  photo: { width: 120, height: 120, borderRadius: 60 },
  photoPlaceholder: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' },
  photoText: { marginTop: 5, fontSize: 12, color: '#999' },
  button: { marginVertical: 20 },
});

export default EditProfilScreen;