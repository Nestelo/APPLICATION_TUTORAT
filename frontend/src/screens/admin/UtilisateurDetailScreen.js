import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Linking,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/ui/Header';
import Card from '../../components/ui/Card';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { getUser, updateUser, deleteUser, sendDirectMessage } from '../../api/userService';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const UtilisateurDetailScreen = ({ navigation, route }) => {
  const { userId } = route.params;
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const result = await getUser(userId);
      if (result.success) {
        setUser(result.data);
      } else {
        Alert.alert('Erreur', 'Impossible de charger les données');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de charger les données');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActif = async () => {
    try {
      const updatedUser = { ...user, is_active: !user.is_active };
      const result = await updateUser(userId, updatedUser);
      if (result.success) {
        setUser(result.data);
      } else {
        Alert.alert('Erreur', 'Impossible de modifier le statut');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de modifier le statut');
    }
  };

  const handleDelete = () => {
    Alert.alert('Confirmation', 'Voulez-vous vraiment supprimer cet utilisateur ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            const result = await deleteUser(userId);
            if (result.success) {
              navigation.goBack();
            } else {
              Alert.alert('Erreur', 'Impossible de supprimer');
            }
          } catch (error) {
            Alert.alert('Erreur', 'Impossible de supprimer');
          }
        },
      },
    ]);
  };

  const handleSendEmail = () => {
    Alert.prompt(
      'Envoyer un message',
      'Écrivez votre message pour cet utilisateur',
      [
        {
          text: 'Sujet',
          placeholder: 'Sujet du message',
          defaultValue: `Message de l'administrateur`,
        },
        {
          text: 'Message',
          placeholder: 'Contenu du message...',
          multiline: true,
        },
      ],
      async (sujet, contenu) => {
        if (sujet && contenu) {
          try {
            const result = await sendDirectMessage(userId, sujet, contenu);
            if (result.success) {
              Alert.alert('Succès', 'Message envoyé avec succès');
            } else {
              Alert.alert('Erreur', 'Impossible d\'envoyer le message');
            }
          } catch (error) {
            Alert.alert('Erreur', 'Impossible d\'envoyer le message');
          }
        } else {
          Alert.alert('Erreur', 'Sujet et message sont requis');
        }
      }
    );
  };

  const handleChangeRole = () => {
    const current = user.role;
    const options =
      current === 'etudiant'
        ? ['Passer tuteur', 'Annuler']
        : current === 'tuteur'
        ? ['Passer admin', 'Annuler']
        : ['Annuler'];

    const onSelect = async (index) => {
      if (options[index] === 'Passer tuteur') {
        const updated = { ...user, role: 'tuteur' };
        try {
          const result = await updateUser(userId, updated);
          if (result.success) {
            setUser(result.data);
          } else {
            Alert.alert('Erreur', 'Impossible de changer le rôle');
          }
        } catch {
          Alert.alert('Erreur', 'Impossible de changer le rôle');
        }
      } else if (options[index] === 'Passer admin') {
        const updated = { ...user, role: 'admin' };
        try {
          const result = await updateUser(userId, updated);
          if (result.success) {
            setUser(result.data);
          } else {
            Alert.alert('Erreur', 'Impossible de changer le rôle');
          }
        } catch {
          Alert.alert('Erreur', 'Impossible de changer le rôle');
        }
      }
    };

    Alert.alert(
      'Modifier le rôle',
      `Rôle actuel : ${current}`,
      options.map((label, idx) => ({
        text: label,
        style: label === 'Annuler' ? 'cancel' : 'default',
        onPress: () => onSelect(idx),
      })),
    );
  };

  if (loading) return <LoadingSpinner />;
  if (!user) return null;

  return (
    <>
      <Header title="Détail utilisateur" showBack onBackPress={() => navigation.goBack()} />
      <ScrollView style={styles.container}>
        <Card>
          <View style={styles.header}>
            <View style={styles.avatar}>
              {user.photo_url ? (
                <Image 
                  source={{ uri: user.photo_url }} 
                  style={styles.avatarImage} 
                />
              ) : (
                <Text style={styles.avatarText}>
                  {user.prenom?.[0]}
                  {user.nom?.[0]}
                </Text>
              )}
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.name}>
                {user.prenom} {user.nom}
              </Text>
              <Text style={styles.email}>{user.email}</Text>
              <View style={styles.statusContainer}>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: user.is_active ? '#28a745' : '#dc3545' },
                  ]}
                />
                <Text style={styles.statusText}>{user.is_active ? 'Actif' : 'Inactif'}</Text>
              </View>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Rôle :</Text>
            <Text style={styles.value}>{user.role}</Text>
          </View>
          {user.filiere && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>Filière :</Text>
              <Text style={styles.value}>{user.filiere}</Text>
            </View>
          )}
          {user.annee && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>Année :</Text>
              <Text style={styles.value}>{user.annee}</Text>
            </View>
          )}
          <View style={styles.infoRow}>
            <Text style={styles.label}>Inscrit le :</Text>
            <Text style={styles.value}>
              {user.date_inscription ? 
                (() => {
                  try {
                    const date = new Date(user.date_inscription);
                    if (isNaN(date.getTime())) {
                      return 'Date invalide';
                    }
                    return format(date, 'dd MMMM yyyy', { locale: fr });
                  } catch (error) {
                    return 'Date invalide';
                  }
                })() : 
                'Date non disponible'
              }
            </Text>
          </View>
        </Card>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionButton} onPress={handleSendEmail}>
            <Ionicons name="mail" size={24} color="#007bff" />
            <Text style={styles.actionText}>Envoyer un email</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleChangeRole}>
            <Ionicons name="swap-horizontal" size={24} color="#ffc107" />
            <Text style={styles.actionText}>Changer le rôle</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleToggleActif}>
            <Ionicons
              name={user.is_active ? 'eye-off' : 'eye'}
              size={24}
              color="#28a745"
            />
            <Text style={styles.actionText}>
              {user.is_active ? 'Désactiver' : 'Activer'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleDelete}>
            <Ionicons name="trash" size={24} color="#dc3545" />
            <Text style={styles.actionText}>Supprimer</Text>
          </TouchableOpacity>
        </View>
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
  header: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007bff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
  },
  avatarText: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
  },
  headerInfo: {
    flex: 1,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  email: {
    fontSize: 16,
    color: '#666',
    marginVertical: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 4,
  },
  statusText: {
    fontSize: 14,
    color: '#666',
  },
  infoRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  label: {
    width: 140,
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  value: {
    flex: 1,
    fontSize: 14,
    color: '#666',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  actionButton: {
    alignItems: 'center',
  },
  actionText: {
    marginTop: 4,
    fontSize: 12,
    color: '#666',
  },
});

export default UtilisateurDetailScreen;