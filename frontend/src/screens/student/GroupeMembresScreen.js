import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, Text, TouchableOpacity, Alert, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/ui/Header';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import { getMembresGroupe } from '../../api/tutorService';

const GroupeMembresScreen = ({ navigation, route }) => {
  const { groupeId } = route.params || {};
  const [membres, setMembres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [groupeInfo, setGroupeInfo] = useState(null);

  useEffect(() => {
    loadMembres();
  }, [groupeId]);

  const loadMembres = async () => {
    try {
      setLoading(true);
      const result = await getMembresGroupe(groupeId);
      if (result.success) {
        setMembres(result.data.membres || []);
        setGroupeInfo({
          nom: result.data.groupe_nom,
          total: result.data.total
        });
      } else {
        console.error('Erreur membres:', result.error);
        setMembres([]);
      }
    } catch (error) {
      console.error('Erreur loadMembres:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderMembre = ({ item }) => (
    <View style={styles.membreCard}>
      <View style={styles.membreHeader}>
        {item.photo ? (
          <Image source={{ uri: item.photo }} style={styles.photo} />
        ) : (
          <View style={[styles.photo, styles.photoPlaceholder]}>
            <Ionicons name="person" size={24} color="#666" />
          </View>
        )}
        
        <View style={styles.membreInfo}>
          <Text style={styles.membreNom}>
            {item.prenom} {item.nom}
          </Text>
          <Text style={styles.membreEmail}>{item.email}</Text>
          <Text style={styles.dateInscription}>
            Membre depuis {new Date(item.date_inscription).toLocaleDateString()}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <>
      <Header 
        title={`Membres (${groupeInfo?.total || 0})`} 
        showBack 
        onBackPress={() => navigation.goBack()} 
      />
      
      <View style={styles.container}>
        {loading ? (
          <LoadingSpinner />
        ) : membres.length === 0 ? (
          <EmptyState
            icon="people-outline"
            message="Aucun membre dans ce groupe"
            buttonTitle="Actualiser"
            onButtonPress={loadMembres}
          />
        ) : (
          <FlatList
            data={membres}
            renderItem={renderMembre}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.list}
            ListHeaderComponent={
              <View style={styles.headerInfo}>
                <Text style={styles.groupeNom}>{groupeInfo?.nom}</Text>
                <Text style={styles.totalMembres}>
                  {membres.length} membre{membres.length > 1 ? 's' : ''}
                </Text>
              </View>
            }
          />
        )}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerInfo: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  groupeNom: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  totalMembres: {
    fontSize: 14,
    color: '#666',
  },
  list: {
    padding: 12,
  },
  membreCard: {
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
  membreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  photo: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  photoPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e9ecef',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  membreInfo: {
    flex: 1,
  },
  membreNom: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  membreEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  dateInscription: {
    fontSize: 12,
    color: '#999',
  },
});

export default GroupeMembresScreen;
