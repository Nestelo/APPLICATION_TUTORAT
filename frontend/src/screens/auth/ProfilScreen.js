import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Alert } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import Header from '../../components/ui/Header';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { getProfile } from '../../api/userService';
import { formatDate } from '../../utils/helpers';

const ProfilScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await getProfile();
      setProfile(data);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de charger le profil');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <>
      <Header title="Mon Profil" showBack onBackPress={() => navigation.goBack()} />
      <ScrollView style={styles.container}>
        <View style={styles.avatarContainer}>
          {profile?.photo || profile?.photo_url ? (
            <Image 
              source={{ 
                uri: profile?.photo_url || `http://192.168.43.210:8000${profile?.photo}` 
              }} 
              style={styles.avatar} 
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitial}>
                {profile?.prenom?.[0]}{profile?.nom?.[0]}
              </Text>
            </View>
          )}
        </View>
        <Card style={styles.infoCard}>
          <Text style={styles.name}>{profile?.prenom} {profile?.nom}</Text>
          <Text style={styles.role}>{profile?.role}</Text>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Email :</Text>
            <Text style={styles.value}>{profile?.email}</Text>
          </View>
          {profile?.filiere && (
            <View style={styles.detailRow}>
              <Text style={styles.label}>Filière :</Text>
              <Text style={styles.value}>{profile?.filiere}</Text>
            </View>
          )}
          {profile?.annee && (
            <View style={styles.detailRow}>
              <Text style={styles.label}>Année :</Text>
              <Text style={styles.value}>{profile?.annee}</Text>
            </View>
          )}
          {profile?.bio && (
            <View style={styles.detailRow}>
              <Text style={styles.label}>Bio :</Text>
              <Text style={styles.value}>{profile?.bio}</Text>
            </View>
          )}
          <View style={styles.detailRow}>
            <Text style={styles.label}>Membre depuis :</Text>
            <Text style={styles.value}>
              {formatDate(profile?.date_inscription, 'dd MMMM yyyy')}
            </Text>
          </View>
        </Card>
        <Button
          title="Modifier le profil"
          onPress={() => navigation.navigate('EditProfil')}
          style={styles.button}
        />
        <Button
          title="Déconnexion"
          variant="danger"
          onPress={() => {
            Alert.alert('Déconnexion', 'Voulez-vous vraiment vous déconnecter ?', [
              { text: 'Annuler', style: 'cancel' },
              { text: 'Se déconnecter', onPress: logout },
            ]);
          }}
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
    backgroundColor: '#f5f5f5',
  },
  avatarContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#007bff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 40,
    color: '#fff',
    fontWeight: 'bold',
  },
  infoCard: {
    marginBottom: 20,
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  role: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
    textTransform: 'capitalize',
  },
  detailRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  label: {
    width: 120,
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  value: {
    flex: 1,
    fontSize: 14,
    color: '#666',
  },
  button: {
    marginVertical: 8,
  },
});

export default ProfilScreen;