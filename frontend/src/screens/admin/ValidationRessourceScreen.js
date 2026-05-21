import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Alert, 
  TouchableOpacity, 
  Modal, 
  TextInput,
  ActivityIndicator,
  Linking
} from 'react-native';
import Header from '../../components/ui/Header';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { getRessource } from '../../api/ressourceService';
import { validerRessource, rejeterRessource, getApercuValidation, getHistoriqueValidations } from '../../api/validationService';
import { API_BASE_URL } from '../../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ValidationRessourceScreen = ({ navigation, route }) => {
  const ressourceId = route?.params?.ressourceId;
  const [ressource, setRessource] = useState(null);
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  const [validationMode, setValidationMode] = useState('simple'); // simple, avancé
  const [commentaireAdmin, setCommentaireAdmin] = useState('');
  const [modifications, setModifications] = useState([]);
  const [newModification, setNewModification] = useState('');
  const [showApercu, setShowApercu] = useState(false);
  const [apercuData, setApercuData] = useState(null);
  const [showHistorique, setShowHistorique] = useState(false);
  const [historique, setHistorique] = useState([]);

  useEffect(() => {
    loadRessource();
  }, []);

  const loadRessource = async () => {
    try {
      const data = await getRessource(ressourceId);
      setRessource(data);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de charger la ressource');
    } finally {
      setLoading(false);
    }
  };

  const loadApercu = async () => {
    try {
      const data = await getApercuValidation(ressourceId);
      setApercuData(data);
      setShowApercu(true);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de charger l\'aperçu');
    }
  };

  const loadHistorique = async () => {
    try {
      const data = await getHistoriqueValidations(ressourceId);
      setHistorique(data.historique);
      setShowHistorique(true);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de charger l\'historique');
    }
  };

  const addModification = () => {
    if (newModification.trim()) {
      setModifications([...modifications, newModification.trim()]);
      setNewModification('');
    }
  };

  const removeModification = (index) => {
    setModifications(modifications.filter((_, i) => i !== index));
  };

  const handleValidation = async (statut) => {
    setValidating(true);
    try {
      if (statut === 'publie') {
        await validerRessource(ressourceId, {});
      } else {
        // Notre backend exige un motif pour le rejet.
        const motif = (commentaireAdmin || '').trim() || 'Motif non précisé';
        await rejeterRessource(ressourceId, motif);
      }
      
      Alert.alert(
        'Succès', 
        `Ressource ${statut === 'publie' ? 'publiée' : 'rejetée'} avec succès`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
          {
            text: 'Voir l\'historique',
            onPress: () => loadHistorique(),
          }
        ]
      );
    } catch (error) {
      Alert.alert('Erreur', error.response?.data?.error || 'Échec de la validation');
    } finally {
      setValidating(false);
    }
  };

  const openFile = async () => {
    if (ressource.fichier) {
      Linking.openURL(ressource.fichier);
    } else if (ressource.lien_externe) {
      Linking.openURL(ressource.lien_externe);
    }
  };

  const getStatusColor = (statut) => {
    switch (statut) {
      case 'en_attente': return '#FFA500';
      case 'publie': return '#4CAF50';
      case 'rejete': return '#F44336';
      case 'modifications_demandees': return '#FF9800';
      default: return '#9E9E9E';
    }
  };

  const getStatusText = (statut) => {
    switch (statut) {
      case 'en_attente': return 'En attente';
      case 'publie': return 'Publié';
      case 'rejete': return 'Rejeté';
      case 'modifications_demandees': return 'Modifications demandées';
      default: return statut;
    }
  };

  const getFileIcon = (type) => {
    switch (type) {
      case 'pdf': return '📄';
      case 'video': return '🎥';
      case 'image': return '🖼️';
      case 'lien': return '🔗';
      default: return '📁';
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) return <LoadingSpinner />;

  if (!ressource) {
    return (
      <>
        <Header title="Validation" showBack onBackPress={() => navigation.goBack()} />
        <View style={styles.container}>
          <Card>
            <Text>Aucune ressource trouvée ou erreur de chargement.</Text>
          </Card>
        </View>
      </>
    );
  }

  return (
    <>
      <Header title="Validation Ressource" showBack onBackPress={() => navigation.goBack()} />
      <ScrollView style={styles.container}>
        {/* Carte principale */}
        <Card style={styles.mainCard}>
          {/* En-tête avec statut */}
          <View style={styles.header}>
            <View style={styles.titleSection}>
              <Text style={styles.titre}>{ressource.titre}</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(ressource.statut) }]}>
                <Text style={styles.statusText}>{getStatusText(ressource.statut)}</Text>
              </View>
            </View>
            
            <Text style={styles.auteur}>
              👤 {ressource.auteur_details?.prenom} {ressource.auteur_details?.nom} 
              ({ressource.auteur_details?.role})
            </Text>
            <Text style={styles.meta}>📅 {formatDate(ressource.date_publication)}</Text>
          </View>

          {/* Informations détaillées */}
          <View style={styles.infoSection}>
            <View style={styles.infoRow}>
              <Text style={styles.label}>📚 Matière:</Text>
              <Text style={styles.value}>{ressource.matiere || 'Non spécifiée'}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.label}>🎓 Niveau:</Text>
              <Text style={styles.value}>{ressource.niveau || 'Non spécifié'}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.label}>📂 Type:</Text>
              <Text style={styles.value}>
                {getFileIcon(ressource.type_fichier)} {ressource.type_fichier?.toUpperCase()}
              </Text>
            </View>
            
            {ressource.fichier && (
              <View style={styles.infoRow}>
                <Text style={styles.label}>📊 Taille:</Text>
                <Text style={styles.value}>{formatFileSize(ressource.fichier_size)}</Text>
              </View>
            )}
            
            <View style={styles.infoRow}>
              <Text style={styles.label}>👁️ Vues:</Text>
              <Text style={styles.value}>{ressource.nb_vues || 0}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.label}>⬇️ Téléchargements:</Text>
              <Text style={styles.value}>{ressource.nb_telechargements || 0}</Text>
            </View>
          </View>

          {/* Tags */}
          {ressource.tags && (
            <View style={styles.tagsSection}>
              <Text style={styles.label}>🏷️ Tags:</Text>
              <View style={styles.tagsContainer}>
                {ressource.tags.split(',').map((tag, index) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>{tag.trim()}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Description */}
          {ressource.description && (
            <View style={styles.descriptionSection}>
              <Text style={styles.label}>📝 Description:</Text>
              <Text style={styles.description}>{ressource.description}</Text>
            </View>
          )}

          {/* Fichier/Lien */}
          <View style={styles.fileSection}>
            <Text style={styles.label}>📎 Fichier:</Text>
            <TouchableOpacity style={styles.fileButton} onPress={openFile}>
              <Text style={styles.fileButtonText}>
                {ressource.fichier ? '📄 Ouvrir le fichier' : '🔗 Visiter le lien'}
              </Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Actions de validation */}
        <Card style={styles.actionsCard}>
          <View style={styles.modeSelector}>
            <Text style={styles.modeTitle}>Mode de validation:</Text>
            <View style={styles.modeButtons}>
              <TouchableOpacity
                style={[styles.modeButton, validationMode === 'simple' && styles.modeButtonActive]}
                onPress={() => setValidationMode('simple')}
              >
                <Text style={styles.modeButtonText}>Simple</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modeButton, validationMode === 'avancé' && styles.modeButtonActive]}
                onPress={() => setValidationMode('avancé')}
              >
                <Text style={styles.modeButtonText}>Avancé</Text>
              </TouchableOpacity>
            </View>
          </View>

          {validationMode === 'simple' ? (
            <View style={styles.simpleActions}>
              <Button
                title="✅ Publier"
                onPress={() => handleValidation('publie')}
                style={styles.publishButton}
              />
              <Button
                title="❌ Rejeter"
                onPress={() => handleValidation('rejete')}
                variant="danger"
                style={styles.rejectButton}
              />
            </View>
          ) : (
            <View style={styles.advancedActions}>
              <Button
                title="📝 Demander modifications"
                onPress={() => handleValidation('modifications_demandees')}
                style={styles.modifyButton}
              />
              
              <View style={styles.commentSection}>
                <Text style={styles.label}>Commentaire admin:</Text>
                <TextInput
                  style={styles.commentInput}
                  multiline
                  numberOfLines={3}
                  value={commentaireAdmin}
                  onChangeText={setCommentaireAdmin}
                  placeholder="Expliquez les modifications nécessaires..."
                />
              </View>

              <View style={styles.modificationsSection}>
                <Text style={styles.label}>Modifications demandées:</Text>
                {modifications.map((mod, index) => (
                  <View key={index} style={styles.modificationItem}>
                    <Text style={styles.modificationText}>• {mod}</Text>
                    <TouchableOpacity
                      style={styles.removeModification}
                      onPress={() => removeModification(index)}
                    >
                      <Text style={styles.removeText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}
                
                <View style={styles.addModificationRow}>
                  <TextInput
                    style={styles.newModificationInput}
                    value={newModification}
                    onChangeText={setNewModification}
                    placeholder="Ajouter une modification..."
                  />
                  <TouchableOpacity
                    style={styles.addModificationButton}
                    onPress={addModification}
                  >
                    <Text style={styles.addButtonText}>+ Ajouter</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.advancedButtons}>
                <Button
                  title="✅ Valider avec modifications"
                  onPress={() => handleValidation('modifications_demandees')}
                  style={styles.validateButton}
                  loading={validating}
                />
                <Button
                  title="❌ Rejeter"
                  onPress={() => handleValidation('rejete')}
                  variant="danger"
                  style={styles.rejectButton}
                />
              </View>
            </View>
          )}
        </Card>

        {/* Actions supplémentaires */}
        <View style={styles.extraActions}>
          <TouchableOpacity style={styles.extraButton} onPress={loadApercu}>
            <Text style={styles.extraButtonText}>👁️ Aperçu validation</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.extraButton} onPress={loadHistorique}>
            <Text style={styles.extraButtonText}>📋 Historique</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal Aperçu */}
      <Modal
        visible={showApercu}
        animationType="slide"
        onRequestClose={() => setShowApercu(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>👁️ Aperçu de Validation</Text>
            
            {apercuData && (
              <ScrollView style={styles.apercuContent}>
                <Text style={styles.apercuSection}>📊 Statistiques:</Text>
                <Text>• Vues: {apercuData.statistiques?.nb_vues || 0}</Text>
                <Text>• Téléchargements: {apercuData.statistiques?.nb_telechargements || 0}</Text>
                <Text>• Notes: {apercuData.statistiques?.nb_notes || 0}</Text>
                <Text>• Note moyenne: {apercuData.statistiques?.note_moyenne || 0}/5</Text>
                
                <Text style={styles.apercuSection}>💬 Commentaires récents:</Text>
                {apercuData.commentaires_recents?.map((comment, index) => (
                  <Text key={index} style={styles.commentaire}>
                    • {comment.auteur}: {comment.contenu}
                  </Text>
                ))}
              </ScrollView>
            )}
            
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowApercu(false)}
            >
              <Text style={styles.closeButtonText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal Historique */}
      <Modal
        visible={showHistorique}
        animationType="slide"
        onRequestClose={() => setShowHistorique(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>📋 Historique des Validations</Text>
            
            <ScrollView style={styles.historiqueContent}>
              {historique.map((item, index) => (
                <View key={index} style={styles.historiqueItem}>
                  <Text style={styles.historiqueDate}>
                    {formatDate(item.date)}
                  </Text>
                  <Text style={styles.historiqueTitle}>{item.titre}</Text>
                  <Text style={styles.historiqueMessage}>{item.message}</Text>
                  {item.commentaire && (
                    <Text style={styles.historiqueComment}>
                      💬 Commentaire: {item.commentaire}
                    </Text>
                  )}
                </View>
              ))}
            </ScrollView>
            
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowHistorique(false)}
            >
              <Text style={styles.closeButtonText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 12,
    backgroundColor: '#f5f5f5',
  },
  mainCard: {
    marginBottom: 16,
  },
  header: {
    marginBottom: 16,
  },
  titleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  titre: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 15,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  auteur: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  meta: {
    fontSize: 12,
    color: '#888',
  },
  infoSection: {
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#555',
    flex: 1,
  },
  value: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  tagsSection: {
    marginBottom: 16,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  tag: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 12,
    color: '#1976D2',
    fontWeight: '500',
  },
  descriptionSection: {
    marginBottom: 16,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    color: '#444',
    marginTop: 4,
  },
  fileSection: {
    marginBottom: 16,
  },
  fileButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  fileButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  actionsCard: {
    marginBottom: 16,
  },
  modeSelector: {
    marginBottom: 16,
  },
  modeTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  modeButtons: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 4,
  },
  modeButton: {
    flex: 1,
    padding: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  modeButtonActive: {
    backgroundColor: '#007AFF',
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  simpleActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 12,
  },
  advancedActions: {
    gap: 16,
  },
  commentSection: {
    marginBottom: 16,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    textAlignVertical: 'top',
    minHeight: 80,
  },
  modificationsSection: {
    marginBottom: 16,
  },
  modificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  modificationText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  removeModification: {
    marginLeft: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#dc3545',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  addModificationRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  newModificationInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
  },
  addModificationButton: {
    backgroundColor: '#28a745',
    padding: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  advancedButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 12,
  },
  publishButton: {
    backgroundColor: '#28a745',
    flex: 1,
  },
  modifyButton: {
    backgroundColor: '#FFA500',
    marginBottom: 12,
  },
  validateButton: {
    backgroundColor: '#007AFF',
    flex: 1,
  },
  rejectButton: {
    backgroundColor: '#dc3545',
    flex: 1,
  },
  extraActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  extraButton: {
    backgroundColor: '#6C757D',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 6,
  },
  extraButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    margin: 20,
    maxHeight: '80%',
    width: '90%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: '#333',
  },
  apercuContent: {
    maxHeight: 400,
  },
  apercuSection: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#007AFF',
  },
  commentaire: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  historiqueContent: {
    maxHeight: 400,
  },
  historiqueItem: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  historiqueDate: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  historiqueTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    color: '#333',
  },
  historiqueMessage: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  historiqueComment: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
  },
  closeButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ValidationRessourceScreen;
