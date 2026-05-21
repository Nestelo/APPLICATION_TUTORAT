import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, Text, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/ui/Header';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import { getInscriptionsGroupe, accepterInscription, refuserInscription } from '../../api/tutorService';
import { useAuth } from '../../context/AuthContext';

const GestionInscriptionsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [inscriptions, setInscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtre, setFiltre] = useState('tous'); // tous, en_attente, acceptes, refuses

  useEffect(() => {
    loadInscriptions();
  }, []);

  const loadInscriptions = async () => {
    try {
      setLoading(true);
      const result = await getInscriptionsGroupe();
      if (result.success) {
        let filteredInscriptions = result.data || [];
        
        // Filtrer par statut
        if (filtre !== 'tous') {
          filteredInscriptions = filteredInscriptions.filter(
            insc => insc.statut === filtre
          );
        }
        
        setInscriptions(filteredInscriptions);
      } else {
        console.error('Erreur inscriptions:', result.error);
        setInscriptions([]);
      }
    } catch (error) {
      console.error('Erreur loadInscriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccepter = async (inscriptionId) => {
    try {
      Alert.alert(
        'Accepter l\'inscription',
        'Voulez-vous accepter cette demande d\'inscription ?',
        [
          { text: 'Annuler', style: 'cancel' },
          { 
            text: 'Accepter', 
            onPress: async () => {
              const result = await accepterInscription(inscriptionId);
              if (result.success) {
                Alert.alert(
                  'Succès !',
                  'L\'inscription a été acceptée avec succès.',
                  [{ text: 'OK' }]
                );
                loadInscriptions(); // Recharger la liste
              } else {
                Alert.alert('Erreur', result.error || 'Impossible d\'accepter l\'inscription');
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Erreur accepter inscription:', error);
      Alert.alert('Erreur', 'Impossible d\'accepter l\'inscription');
    }
  };

  const handleRefuser = async (inscriptionId) => {
    try {
      Alert.alert(
        'Refuser l\'inscription',
        'Voulez-vous refuser cette demande d\'inscription ?',
        [
          { text: 'Annuler', style: 'cancel' },
          { 
            text: 'Refuser', 
            onPress: async () => {
              const result = await refuserInscription(inscriptionId);
              if (result.success) {
                Alert.alert(
                  'Succès !',
                  'L\'inscription a été refusée.',
                  [{ text: 'OK' }]
                );
                loadInscriptions(); // Recharger la liste
              } else {
                Alert.alert('Erreur', result.error || 'Impossible de refuser l\'inscription');
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Erreur refuser inscription:', error);
      Alert.alert('Erreur', 'Impossible de refuser l\'inscription');
    }
  };

  const renderFiltres = () => (
    <View style={styles.filtresContainer}>
      {['tous', 'en_attente', 'acceptes', 'refuses'].map((statut) => (
        <TouchableOpacity
          key={statut}
          style={[styles.filtreButton, filtre === statut && styles.filtreActif]}
          onPress={() => setFiltre(statut)}
        >
          <Text style={styles.filtreText}>
            {statut === 'tous' && 'Tous'}
            {statut === 'en_attente' && 'En attente'}
            {statut === 'acceptes' && 'Acceptés'}
            {statut === 'refuses' && 'Refusés'}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const getStatutColor = (statut) => {
    switch (statut) {
      case 'en_attente': return '#ffc107';
      case 'accepte': return '#28a745';
      case 'refuse': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getStatutIcon = (statut) => {
    switch (statut) {
      case 'en_attente': return 'time';
      case 'accepte': return 'checkmark-circle';
      case 'refuse': return 'close-circle';
      default: return 'help-circle';
    }
  };

  const renderInscription = ({ item }) => (
    <View style={styles.inscriptionCard}>
      <View style={styles.inscriptionHeader}>
        <View style={styles.groupeInfo}>
          <Text style={styles.groupeNom}>{item.groupe_details?.nom}</Text>
          <Text style={styles.etudiantNom}>
            {item.etudiant_details?.prenom} {item.etudiant_details?.nom}
          </Text>
          <Text style={styles.etudiantEmail}>{item.etudiant_details?.email}</Text>
        </View>
        
        <View style={[styles.statutBadge, { backgroundColor: getStatutColor(item.statut) }]}>
          <Ionicons name={getStatutIcon(item.statut)} size={16} color="#fff" />
          <Text style={styles.statutText}>{item.statut_display}</Text>
        </View>
      </View>

      {/* Informations académiques */}
      {(item.etudiant_details?.filiere || item.etudiant_details?.annee) && (
        <Text style={styles.etudiantAcademicInfo}>
          {item.etudiant_details?.filiere && `Filière: ${item.etudiant_details.filiere}`}
          {item.etudiant_details?.filiere && item.etudiant_details?.annee && ' | '}
          {item.etudiant_details?.annee && `Niveau: ${item.etudiant_details.annee}`}
        </Text>
      )}
      
      {/* Biographie */}
      {item.etudiant_details?.biographie && (
        <Text style={styles.etudiantBio} numberOfLines={3}>
          {item.etudiant_details.biographie}
        </Text>
      )}
      
      {/* Téléphone */}
      {item.etudiant_details?.telephone && (
        <Text style={styles.etudiantPhone}>📞 {item.etudiant_details.telephone}</Text>
      )}

      <Text style={styles.dateInscription}>
        Inscrit le {new Date(item.date_inscription).toLocaleDateString()}
      </Text>

      <View style={styles.actions}>
        {item.statut === 'en_attente' && (
          <>
            <TouchableOpacity
              style={[styles.actionButton, styles.acceptButton]}
              onPress={() => handleAccepter(item.id)}
            >
              <Ionicons name="checkmark" size={16} color="#fff" />
              <Text style={styles.actionText}>Accepter</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.refuseButton]}
              onPress={() => handleRefuser(item.id)}
            >
              <Ionicons name="close" size={16} color="#fff" />
              <Text style={styles.actionText}>Refuser</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );

  if (loading) return <LoadingSpinner />;

  return (
    <>
      <Header title="Gérer les inscriptions" showBack onBackPress={() => navigation.goBack()} />
      
      <View style={styles.container}>
        {/* Filtres */}
        {renderFiltres()}

        {/* Liste des inscriptions */}
        <FlatList
          data={inscriptions}
          renderItem={renderInscription}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <EmptyState
              icon="person-add-outline"
              message="Aucune demande d'inscription"
              buttonTitle="Actualiser"
              onButtonPress={loadInscriptions}
            />
          }
        />
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  filtresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
    paddingHorizontal: 12,
  },
  filtreButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#e9ecef',
  },
  filtreActif: {
    backgroundColor: '#007bff',
  },
  filtreText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  list: {
    padding: 12,
  },
  inscriptionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inscriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
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
  etudiantNom: {
    fontSize: 14,
    color: '#666',
  },
  etudiantEmail: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  etudiantAcademicInfo: {
    fontSize: 12,
    color: '#555',
    marginTop: 8,
    fontStyle: 'italic',
  },
  etudiantBio: {
    fontSize: 12,
    color: '#666',
    marginTop: 6,
    marginBottom: 6,
    lineHeight: 16,
    backgroundColor: '#f8f9fa',
    padding: 8,
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  etudiantPhone: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    marginBottom: 8,
  },
  statutBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statutText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 6,
  },
  dateInscription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 100,
  },
  acceptButton: {
    backgroundColor: '#28a745',
  },
  refuseButton: {
    backgroundColor: '#dc3545',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
    marginLeft: 6,
  },
});

export default GestionInscriptionsScreen;
