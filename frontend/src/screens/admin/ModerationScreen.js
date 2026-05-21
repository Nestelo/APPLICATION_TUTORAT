import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, Alert, Text, TouchableOpacity, Modal } from 'react-native';
import Header from '../../components/ui/Header';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import CustomInput from '../../components/ui/Input';
import {
  getSignalements,
  traiterSignalement,
  getModerationQuestions,
  getModerationResponses,
  deleteQuestion,
  restoreQuestion,
  deleteResponse,
  restoreResponse,
  suspendUser,
  unsuspendUser,
} from '../../api/adminService';

const TabButton = ({ title, active, onPress }) => (
  <TouchableOpacity onPress={onPress} style={[styles.tab, active && styles.tabActive]}>
    <Text style={[styles.tabText, active && styles.tabTextActive]}>{title}</Text>
  </TouchableOpacity>
);

const ModerationScreen = ({ navigation }) => {
  const [tab, setTab] = useState('questions');
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [processingId, setProcessingId] = useState(null);
  const [reason, setReason] = useState('');
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    load();
  }, [tab]);

  const load = async () => {
    setLoading(true);
    try {
      if (tab === 'questions') {
        const data = await getModerationQuestions();
        setItems(data || []);
      } else if (tab === 'reponses') {
        const data = await getModerationResponses();
        setItems(data || []);
      } else if (tab === 'signalements') {
        const data = await getSignalements();
        setItems(data || []);
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Erreur', "Impossible de charger");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteQuestion = async (id) => {
    console.log('Tentative de suppression question ID:', id);
    Alert.alert(
      'Confirmation de suppression',
      'Voulez-vous supprimer cette question ?',
      [
        { text: 'Non', style: 'cancel' },
        { 
          text: 'Oui', 
          style: 'destructive',
          onPress: async () => {
            setProcessingId(id);
            try {
              console.log('Appel API deleteQuestion avec ID:', id);
              const result = await deleteQuestion(id, 'Supprimé par administrateur');
              console.log('Résultat API:', result);
              Alert.alert('Succès', 'Question supprimée avec succès');
              load();
            } catch (err) {
              console.error('Erreur suppression question:', err);
              Alert.alert('Erreur', `Échec de l'opération: ${err.message || err}`);
            } finally {
              setProcessingId(null);
            }
          }
        }
      ]
    );
  };

  const handleRestoreQuestion = async (id) => {
    setProcessingId(id);
    try {
      console.log('Tentative de restauration question ID:', id);
      const result = await restoreQuestion(id, 'Restaurée par admin');
      console.log('Résultat API:', result);
      Alert.alert('Succès', 'Question restaurée');
      load();
    } catch (err) {
      console.error('Erreur restauration question:', err);
      Alert.alert('Erreur', "Échec de l'opération");
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeleteResponse = async (id) => {
    console.log('Tentative de suppression réponse ID:', id);
    Alert.alert(
      'Confirmation de suppression',
      'Voulez-vous supprimer cette réponse ?',
      [
        { text: 'Non', style: 'cancel' },
        { 
          text: 'Oui', 
          style: 'destructive',
          onPress: async () => {
            setProcessingId(id);
            try {
              console.log('Appel API deleteResponse avec ID:', id);
              const result = await deleteResponse(id, 'Supprimé par administrateur');
              console.log('Résultat API deleteResponse:', result);
              Alert.alert('Succès', 'Réponse supprimée avec succès');
              load();
            } catch (err) {
              console.error('Erreur suppression réponse:', err);
              Alert.alert('Erreur', `Échec de l'opération: ${err.message || err}`);
            } finally {
              setProcessingId(null);
            }
          }
        }
      ]
    );
  };

  const handleRestoreResponse = async (id) => {
    setProcessingId(id);
    try {
      console.log('Tentative de restauration réponse ID:', id);
      const result = await restoreResponse(id, 'Restaurée par admin');
      console.log('Résultat API:', result);
      Alert.alert('Succès', 'Réponse restaurée');
      load();
    } catch (err) {
      console.error('Erreur restauration réponse:', err);
      Alert.alert('Erreur', "Échec de l'opération");
    } finally {
      setProcessingId(null);
    }
  };

  const handleSuspendUser = async (userId) => {
    if (!reason) return Alert.alert('Erreur', 'Veuillez fournir une raison');
    setProcessingId(userId);
    try {
      await suspendUser(userId, { reason });
      Alert.alert('Succès', 'Utilisateur suspendu');
      setReason('');
      load();
    } catch (err) {
      console.error(err);
      Alert.alert('Erreur', "Échec de l'opération");
    } finally {
      setProcessingId(null);
    }
  };

  const handleUnsuspendUser = async (userId) => {
    setProcessingId(userId);
    try {
      await unsuspendUser(userId);
      Alert.alert('Succès', 'Utilisateur réactivé');
      load();
    } catch (err) {
      console.error(err);
      Alert.alert('Erreur', "Échec de l'opération");
    } finally {
      setProcessingId(null);
    }
  };

  const handleViewUserProfile = (user) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const handleBlockAuthor = (item) => {
    if (item.auteur_details) {
      setSelectedUser(item.auteur_details);
      setReason('Violation des règles de modération');
      Alert.alert(
        'Confirmation',
        `Voulez-vous suspendre ${item.auteur_details.prenom} ${item.auteur_details.nom} ?`,
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Suspendre',
            style: 'destructive',
            onPress: () => handleSuspendUser(item.auteur_details.id)
          }
        ]
      );
    } else {
      Alert.alert('Erreur', 'Informations de l\'auteur non disponibles');
    }
  };

  const renderQuestion = ({ item }) => (
    <Card style={styles.card}>
      <Text style={styles.title}>{item.titre}</Text>
      <Text style={{ marginTop: 6 }}>{item.contenu?.slice(0, 300)}</Text>
      <Text style={{ marginTop: 6, color: '#666' }}>Auteur: {item.auteur_details?.prenom || item.auteur}</Text>
      <View style={{ flexDirection: 'row', marginTop: 10, flexWrap: 'wrap' }}>
        {item.auteur_details && (
          <TouchableOpacity 
            style={styles.authorButton} 
            onPress={() => handleViewUserProfile(item.auteur_details)}
          >
            <Text style={styles.authorButtonText}>👤 Voir profil</Text>
          </TouchableOpacity>
        )}
        {!item.deleted ? (
          <Button title="Supprimer" variant="danger" onPress={() => handleDeleteQuestion(item.id)} style={styles.button} loading={processingId===item.id} />
        ) : (
          <Button title="Restaurer" onPress={() => handleRestoreQuestion(item.id)} style={styles.button} loading={processingId===item.id} />
        )}
        <Button title="🚫 Bloquer auteur" onPress={() => handleBlockAuthor(item)} style={styles.button} />
      </View>
    </Card>
  );

  const renderResponse = ({ item }) => (
    <Card style={styles.card}>
      <Text>{item.contenu?.slice(0, 300)}</Text>
      <Text style={{ marginTop: 6, color: '#666' }}>Auteur: {item.auteur_details?.prenom || item.auteur}</Text>
      <View style={{ flexDirection: 'row', marginTop: 10, flexWrap: 'wrap' }}>
        {item.auteur_details && (
          <TouchableOpacity 
            style={styles.authorButton} 
            onPress={() => handleViewUserProfile(item.auteur_details)}
          >
            <Text style={styles.authorButtonText}>👤 Voir profil</Text>
          </TouchableOpacity>
        )}
        {!item.deleted ? (
          <Button title="Supprimer" variant="danger" onPress={() => handleDeleteResponse(item.id)} style={styles.button} loading={processingId===item.id} />
        ) : (
          <Button title="Restaurer" onPress={() => handleRestoreResponse(item.id)} style={styles.button} loading={processingId===item.id} />
        )}
        <Button title="🚫 Bloquer auteur" onPress={() => handleBlockAuthor(item)} style={styles.button} />
      </View>
    </Card>
  );

  const renderSignalement = ({ item }) => (
    <Card style={styles.card}>
      <Text>Type: {item.type_contenu}</Text>
      <Text>ID: {item.id_contenu}</Text>
      <Text>Motif: {item.motif}</Text>
      <Text>Signalé par: {item.signalant_id}</Text>
      <View style={{ flexDirection: 'row', marginTop: 10 }}>
        {!item.traite && <Button title="Marquer traité" onPress={() => traiterSignalement(item.id).then(load)} style={styles.button} />}
      </View>
    </Card>
  );

  return (
    <>
      <Header title="Modération" showBack onBackPress={() => navigation.goBack()} />
      <View style={styles.container}>
        <View style={styles.tabs}>
          <TabButton title="Questions" active={tab==='questions'} onPress={() => setTab('questions')} />
          <TabButton title="Réponses" active={tab==='reponses'} onPress={() => setTab('reponses')} />
          <TabButton title="Signalements" active={tab==='signalements'} onPress={() => setTab('signalements')} />
        </View>

        {loading ? (
          <LoadingSpinner />
        ) : (
          <FlatList
            data={items}
            keyExtractor={(i) => String(i.id)}
            renderItem={tab === 'questions' ? renderQuestion : tab === 'reponses' ? renderResponse : renderSignalement}
            contentContainerStyle={{ padding: 12 }}
          />
        )}

        <View style={{ padding: 12 }}>
          <CustomInput 
            label="Raison suspension (sélectionnez un utilisateur d'abord)" 
            value={reason} 
            onChangeText={(text) => setReason(text)} 
            placeholder="Entrez la raison de la suspension..."
          />
          <Button 
            title="🚫 Suspendre utilisateur sélectionné" 
            onPress={() => {
              if (selectedUser) {
                handleSuspendUser(selectedUser.id);
              } else {
                Alert.alert('Info', 'Sélectionnez d\'abord un utilisateur en cliquant sur "👤 Voir profil" ou "🚫 Bloquer auteur"');
              }
            }} 
            variant="danger"
            disabled={!selectedUser || !reason}
          />
        </View>
      </View>

      {/* Modal Profil Utilisateur */}
      <Modal
        visible={showUserModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowUserModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Profil Utilisateur</Text>
              <TouchableOpacity onPress={() => setShowUserModal(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>
            {selectedUser && (
              <View style={styles.modalBody}>
                <Text style={styles.userInfo}>Nom: {selectedUser.prenom} {selectedUser.nom}</Text>
                <Text style={styles.userInfo}>Email: {selectedUser.email}</Text>
                <Text style={styles.userInfo}>Rôle: {selectedUser.role}</Text>
                <Text style={styles.userInfo}>Statut: {selectedUser.is_active ? 'Actif' : 'Suspendu'}</Text>
                <View style={styles.modalActions}>
                  {selectedUser.is_active ? (
                    <Button
                      title="🚫 Suspendre"
                      onPress={() => {
                        setShowUserModal(false);
                        handleSuspendUser(selectedUser.id);
                      }}
                      variant="danger"
                      style={styles.modalButton}
                    />
                  ) : (
                    <Button
                      title="✅ Réactiver"
                      onPress={() => {
                        setShowUserModal(false);
                        handleUnsuspendUser(selectedUser.id);
                      }}
                      style={styles.modalButton}
                    />
                  )}
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  tabs: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  tabActive: {
    backgroundColor: '#007AFF',
  },
  tabText: {
    color: '#333',
  },
  tabTextActive: {
    color: '#fff',
  },
  card: {
    marginBottom: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  button: {
    marginRight: 8,
  },
  authorButton: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    marginRight: 8,
    marginBottom: 4,
  },
  authorButtonText: {
    color: '#007bff',
    fontSize: 12,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    fontSize: 20,
    color: '#666',
    padding: 4,
  },
  modalBody: {
    marginBottom: 16,
  },
  userInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 4,
  },
});

export default ModerationScreen;
