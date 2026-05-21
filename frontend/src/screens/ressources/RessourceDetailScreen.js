import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/ui/Header';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import TextInputField from '../../components/ui/TextInputField';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import CustomInput from '../../components/ui/Input';
import { useAuth } from '../../context/AuthContext';
import {
  getRessource,
  telechargerRessource,
  vueRessource,
  getCommentaires,
  createCommentaire,
  noterRessource,
  toggleFavori,
  deleteRessource,
} from '../../api/ressourceService';
import { formatDate } from '../../utils/helpers';

const RessourceDetailScreen = ({ navigation, route }) => {
  const { id, ressourceId, resourceId } = route.params || {};
  const resourceIdFinal = id || ressourceId || resourceId;
  const { user } = useAuth();
  const [ressource, setRessource] = useState(null);
  const [commentaires, setCommentaires] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [userNote, setUserNote] = useState(null);
  const [isFavori, setIsFavori] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      console.log('📚 RessourceDetailScreen loadData appelé avec resourceId:', resourceIdFinal);
      const [r, c] = await Promise.all([
        getRessource(resourceIdFinal),
        getCommentaires(resourceIdFinal),
      ]);
      console.log('📚 Ressource chargée:', r?.titre, 'ID:', r?.id);
      setRessource(r);
      setIsFavori(Boolean(r?.est_favori));
      setCommentaires(c);
      // Incrémenter les vues
      console.log('📚 Appel de vueRessource depuis RessourceDetailScreen...');
      await vueRessource(resourceIdFinal, r?.titre || 'Ressource sans titre', 'globale', user?.id);
      console.log('📚 vueRessource terminé depuis RessourceDetailScreen');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de charger la ressource');
    } finally {
      setLoading(false);
    }
  };

  const handleTelecharger = async () => {
    try {
      const data = await telechargerRessource(resourceIdFinal, resource?.titre, user?.id);
      if (data.lien) {
        Linking.openURL(data.lien);
      } else if (data.fichier) {
        // Télécharger via Linking ou autre (selon backend)
        Linking.openURL(data.fichier);
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de télécharger');
    }
  };

  const handleCommenter = async () => {
    if (!newComment.trim()) return;
    setSubmitting(true);
    try {
      const comment = await createCommentaire(resourceIdFinal, newComment);
      setCommentaires([...commentaires, comment]);
      setNewComment('');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'ajouter le commentaire');
    } finally {
      setSubmitting(false);
    }
  };

  const handleNoter = async (note) => {
    try {
      await noterRessource(resourceIdFinal, note);
      setUserNote(note);
      Alert.alert('Succès', 'Note enregistrée');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de noter');
    }
  };

  const handleFavori = async () => {
    try {
      await toggleFavori(resourceIdFinal);
      setIsFavori(!isFavori);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de modifier les favoris');
    }
  };

  const handleDelete = async () => {
    try {
      // confirmation simple côté UI
      Alert.alert(
        'Supprimer',
        'Voulez-vous vraiment supprimer cette ressource ?',
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Supprimer',
            style: 'destructive',
            onPress: async () => {
              await deleteRessource(resourceIdFinal);
              navigation.goBack();
            },
          },
        ]
      );
    } catch (e) {
      Alert.alert('Erreur', 'Impossible de supprimer la ressource');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <>
      <Header title="Détail ressource" showBack onBackPress={() => navigation.goBack()} />
      <ScrollView style={styles.container}>
        <Card>
          <Text style={styles.titre}>{ressource.titre}</Text>
          <Text>Auteur : {ressource.auteur_details?.prenom} {ressource.auteur_details?.nom}</Text>
          <Text>Matière : {ressource.matiere}</Text>
          <Text>Type : {ressource.type_fichier}</Text>
          <Text>Publié le : {formatDate(ressource.date_publication)}</Text>
          <Text>Description : {ressource.description}</Text>
          <Text>Tags : {ressource.tags}</Text>
          <Text>Vues : {ressource.nb_vues} | Téléchargements : {ressource.nb_telechargements}</Text>
          <View style={styles.actions}>
            <Button
              title="Télécharger"
              icon="download-outline"
              onPress={handleTelecharger}
              style={styles.actionButton}
            />
            <Button
              title={isFavori ? 'Retirer des favoris' : 'Ajouter aux favoris'}
              icon={isFavori ? 'heart' : 'heart-outline'}
              variant={isFavori ? 'danger' : 'outline'}
              onPress={handleFavori}
              style={styles.actionButton}
            />
          </View>

          {/* Actions tuteur (auteur de la ressource) */}
          {user?.role !== 'etudiant' && ressource?.auteur_details?.id === user?.id && (
            <View style={styles.actions}>
              <Button
                title="Modifier"
                icon="create-outline"
                onPress={() => navigation.navigate('EditRessource', { id: ressource.id })}
                style={styles.actionButton}
              />
              <Button
                title="Supprimer"
                icon="trash-outline"
                variant="danger"
                onPress={handleDelete}
                style={styles.actionButton}
              />
            </View>
          )}
        </Card>

        <Card style={styles.noteCard}>
          <Text style={styles.sectionTitle}>Noter cette ressource</Text>
          <View style={styles.noteButtons}>
            {[1,2,3,4,5].map(n => (
              <Button
                key={n}
                title={n.toString()}
                variant={userNote === n ? 'primary' : 'outline'}
                size="small"
                onPress={() => handleNoter(n)}
                style={styles.noteButton}
              />
            ))}
          </View>
        </Card>

        <Text style={styles.commentairesTitle}>Commentaires ({commentaires.length})</Text>
        {commentaires.map((comment) => (
          <Card key={comment.id}>
            <Text>{comment.contenu}</Text>
            <View style={styles.commentMeta}>
              <Text>Par {comment.auteur_details?.prenom} {comment.auteur_details?.nom}</Text>
              <Text>{formatDate(comment.date)}</Text>
            </View>
          </Card>
        ))}

        <Card>
          <CustomInput
            placeholder="Ajouter un commentaire..."
            value={newComment}
            onChangeText={setNewComment}
            multiline
            numberOfLines={3}
          />
          <Button
            title="Commenter"
            onPress={handleCommenter}
            loading={submitting}
            style={styles.commentButton}
          />
        </Card>
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 12,
    backgroundColor: '#f5f5f5',
  },
  titre: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  noteCard: {
    marginVertical: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  noteButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  noteButton: {
    width: 40,
    marginHorizontal: 2,
  },
  commentairesTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginVertical: 12,
  },
  commentMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  commentButton: {
    marginTop: 12,
  },
});

export default RessourceDetailScreen;