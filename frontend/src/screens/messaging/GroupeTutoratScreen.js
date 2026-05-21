import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Alert,
  TextInput, ScrollView, RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/ui/Header';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';
import { getGroupesTutorat, createGroupe, ajouterMembresGroupe } from '../../api/messagingService';

const GroupeTutoratScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [groupes, setGroupes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newGroupe, setNewGroupe] = useState({
    nom: '',
    description: '',
    matiere: '',
    niveau: ''
  });

  useEffect(() => {
    loadGroupes();
  }, []);

  const loadGroupes = async () => {
    try {
      const data = await getGroupesTutorat();
      setGroupes(data.results || data);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de charger les groupes');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadGroupes();
    setRefreshing(false);
  };

  const handleCreateGroupe = async () => {
    if (!newGroupe.nom.trim()) {
      Alert.alert('Erreur', 'Le nom du groupe est requis');
      return;
    }

    try {
      await createGroupe(newGroupe);
      Alert.alert('Succès', 'Groupe créé avec succès');
      setNewGroupe({ nom: '', description: '', matiere: '', niveau: '' });
      setShowCreateForm(false);
      loadGroupes();
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de créer le groupe');
    }
  };

  const renderGroupe = ({ item }) => (
    <TouchableOpacity
      style={styles.groupeCard}
      onPress={() => navigation.navigate('GroupeDetail', { groupeId: item.id })}
    >
      <View style={styles.groupeHeader}>
        <View style={styles.groupeInfo}>
          <Text style={styles.groupeNom}>{item.nom}</Text>
          <Text style={styles.groupeDescription} numberOfLines={2}>
            {item.description || 'Aucune description'}
          </Text>
        </View>
        <View style={styles.groupeMeta}>
          {item.matiere && (
            <View style={styles.matiereBadge}>
              <Text style={styles.matiereText}>{item.matiere}</Text>
            </View>
          )}
          <View style={styles.membresBadge}>
            <Ionicons name="people" size={16} color="#666" />
            <Text style={styles.membresText}>{item.nb_membres || 0}</Text>
          </View>
        </View>
      </View>
      <View style={styles.groupeFooter}>
        <Text style={styles.tuteurText}>
          Par {item.tuteur_details?.prenom} {item.tuteur_details?.nom}
        </Text>
        <Text style={styles.dateText}>
          {formatDate(item.date_creation)}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays === 1) return "Hier";
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    return date.toLocaleDateString('fr-FR');
  };

  if (loading) return <LoadingSpinner />;

  return (
    <>
      <Header title="Groupes de Tutorat" showBack={false} />
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Bouton de création pour les tuteurs */}
        {user.role === 'tuteur' && (
          <Card style={styles.createCard}>
            <Button
              title="➕ Créer un groupe"
              onPress={() => setShowCreateForm(true)}
              style={styles.createButton}
            />
          </Card>
        )}

        {/* Formulaire de création */}
        {showCreateForm && (
          <Card style={styles.formCard}>
            <Text style={styles.formTitle}>Nouveau Groupe</Text>
            <TextInput
              style={styles.input}
              placeholder="Nom du groupe *"
              value={newGroupe.nom}
              onChangeText={(text) => setNewGroupe({ ...newGroupe, nom: text })}
            />
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Description"
              value={newGroupe.description}
              onChangeText={(text) => setNewGroupe({ ...newGroupe, description: text })}
              multiline
              numberOfLines={3}
            />
            <TextInput
              style={styles.input}
              placeholder="Matière"
              value={newGroupe.matiere}
              onChangeText={(text) => setNewGroupe({ ...newGroupe, matiere: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Niveau (L1, L2, L3, M1, M2...)"
              value={newGroupe.niveau}
              onChangeText={(text) => setNewGroupe({ ...newGroupe, niveau: text })}
            />
            <View style={styles.formButtons}>
              <Button
                title="Annuler"
                onPress={() => setShowCreateForm(false)}
                variant="secondary"
                style={styles.cancelButton}
              />
              <Button
                title="Créer"
                onPress={handleCreateGroupe}
                style={styles.submitButton}
              />
            </View>
          </Card>
        )}

        {/* Liste des groupes */}
        {groupes.length > 0 ? (
          <View>
            <Text style={styles.sectionTitle}>
              {user.role === 'tuteur' ? 'Mes groupes' : 'Mes groupes de tutorat'}
            </Text>
            <FlatList
              data={groupes}
              renderItem={renderGroupe}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
            />
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color="#ccc" />
            <Text style={styles.emptyTitle}>
              {user.role === 'tuteur' ? 'Aucun groupe créé' : 'Aucun groupe disponible'}
            </Text>
            <Text style={styles.emptyText}>
              {user.role === 'tuteur' 
                ? 'Créez votre premier groupe de tutorat pour commencer'
                : 'Rejoignez des groupes de tutorat pour bénéficier d\'un accompagnement'
              }
            </Text>
          </View>
        )}
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  createCard: {
    margin: 16,
    padding: 8,
  },
  createButton: {
    backgroundColor: '#007bff',
  },
  formCard: {
    margin: 16,
    padding: 16,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  formButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    marginRight: 8,
  },
  submitButton: {
    flex: 1,
    marginLeft: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    margin: 16,
    marginBottom: 8,
    color: '#333',
  },
  groupeCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  groupeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  groupeInfo: {
    flex: 1,
  },
  groupeNom: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  groupeDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  groupeMeta: {
    alignItems: 'flex-end',
  },
  matiereBadge: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  matiereText: {
    fontSize: 12,
    color: '#1976d2',
    fontWeight: '600',
  },
  membresBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  membresText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  groupeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  tuteurText: {
    fontSize: 12,
    color: '#666',
  },
  dateText: {
    fontSize: 12,
    color: '#999',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 64,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default GroupeTutoratScreen;
