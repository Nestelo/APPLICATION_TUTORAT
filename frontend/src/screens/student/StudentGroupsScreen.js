import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, TextInput, TouchableOpacity, Text, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/ui/Header';
import GroupeCard from '../../components/lists/GroupeCard';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import { getGroupes, inscrireGroupe } from '../../api/tutorService';
import { useAuth } from '../../context/AuthContext';

const StudentGroupsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [groupes, setGroupes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtre, setFiltre] = useState('tous'); // tous, disponibles, mes_inscriptions

  useEffect(() => {
    loadGroupes();
  }, []);

  const loadGroupes = async () => {
    try {
      setLoading(true);
      let params = {};
      
      // Filtrage
      if (filtre === 'disponibles') {
        params.places_disponibles = true;
      } else if (filtre === 'mes_inscriptions') {
        params.mes_inscriptions = true;
      }
      
      // Recherche
      if (searchTerm) {
        params.search = searchTerm;
      }

      const result = await getGroupes(params);
      if (result.success) {
        setGroupes(result.data || []);
      } else {
        console.error('Erreur groupes:', result.error);
        setGroupes([]);
      }
    } catch (error) {
      console.error('Erreur loadGroupes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRejoindreGroupe = async (groupeId) => {
    try {
      Alert.alert(
        'Rejoindre un groupe',
        `Voulez-vous vraiment rejoindre ce groupe de tutorat ?`,
        [
          { text: 'Annuler', style: 'cancel' },
          { 
            text: 'Rejoindre', 
            onPress: async () => {
              const result = await inscrireGroupe(groupeId);
              if (result.success) {
                Alert.alert(
                  'Succès !',
                  'Votre demande d\'inscription a été envoyée. Attendez la validation du tuteur.',
                  [{ text: 'OK' }]
                );
                loadGroupes(); // Recharger la liste
              } else {
                Alert.alert('Erreur', result.error || 'Impossible de rejoindre le groupe');
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Erreur rejoindre groupe:', error);
      Alert.alert('Erreur', 'Impossible de rejoindre le groupe');
    }
  };

  const renderGroupe = ({ item }) => (
    <GroupeCard
      groupe={item}
      onPress={() => navigation.navigate('GroupeDetail', { groupeId: item.id })}
      onRejoindre={() => handleRejoindre(item.id)}
      showJoinButton={filtre === 'disponibles' || !item.inscrit}
    />
  );

  const renderFiltres = () => (
    <View style={styles.filtresContainer}>
      <TouchableOpacity
        style={[styles.filtreButton, filtre === 'tous' && styles.filtreActif]}
        onPress={() => {
          setFiltre('tous');
          setSearchTerm('');
          loadGroupes();
        }}
      >
        <Text style={styles.filtreText}>Tous</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.filtreButton, filtre === 'disponibles' && styles.filtreActif]}
        onPress={() => {
          setFiltre('disponibles');
          setSearchTerm('');
          loadGroupes();
        }}
      >
        <Text style={styles.filtreText}>Disponibles</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.filtreButton, filtre === 'mes_inscriptions' && styles.filtreActif]}
        onPress={() => {
          setFiltre('mes_inscriptions');
          setSearchTerm('');
          loadGroupes();
        }}
      >
        <Text style={styles.filtreText}>Mes inscriptions</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) return <LoadingSpinner />;

  return (
    <>
      <Header title="Groupes de tutorat" showBack onBackPress={() => navigation.goBack()} />
      
      <View style={styles.container}>
        {/* Barre de recherche */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un groupe..."
            value={searchTerm}
            onChangeText={setSearchTerm}
            onSubmitEditing={() => loadGroupes()}
          />
        </View>

        {/* Filtres */}
        {renderFiltres()}

        {/* Liste des groupes */}
        <FlatList
          data={groupes}
          renderItem={renderGroupe}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <EmptyState
              icon="people-outline"
              message="Aucun groupe disponible"
              buttonTitle="Actualiser"
              onButtonPress={loadGroupes}
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    marginHorizontal: 12,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 8,
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
});

export default StudentGroupsScreen;
