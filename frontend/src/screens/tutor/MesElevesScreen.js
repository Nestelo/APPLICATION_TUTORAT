import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, Text, Image, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/ui/Header';
import Card from '../../components/ui/Card';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import { getSeances } from '../../api/tutorService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../../config/api';

const EleveItem = ({ eleve, onPress }) => (
  <Card onPress={onPress} style={styles.eleveCard}>
    <View style={styles.eleveHeader}>
      <View style={styles.eleveInfo}>
        {eleve.photo ? (
          <Image source={{ uri: eleve.photo }} style={styles.elevePhoto} />
        ) : (
          <View style={styles.elevePhotoPlaceholder}>
            <Ionicons name="person" size={24} color="#95a5a6" />
          </View>
        )}
        <View style={styles.eleveDetails}>
          <Text style={styles.eleveName}>{eleve.prenom} {eleve.nom}</Text>
          <Text style={styles.eleveEmail}>{eleve.email}</Text>
          <Text style={styles.eleveFiliere}>{eleve.filiere} • {eleve.annee}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#95a5a6" />
    </View>
    
    {eleve.biographie && (
      <Text style={styles.eleveBio} numberOfLines={2}>
        {eleve.biographie}
      </Text>
    )}
    
    <View style={styles.eleveStats}>
      <View style={styles.statItem}>
        <Text style={styles.statValue}>{eleve.nombre_seances || 0}</Text>
        <Text style={styles.statLabel}>Séances</Text>
      </View>
      <View style={styles.statItem}>
        <Text style={styles.statValue}>{eleve.note_moyenne || 0}</Text>
        <Text style={styles.statLabel}>Note</Text>
      </View>
      <View style={styles.statItem}>
        <Text style={styles.statValue}>{eleve.objectifs_apprentissage ? 'Oui' : 'Non'}</Text>
        <Text style={styles.statLabel}>Objectifs</Text>
      </View>
    </View>
  </Card>
);

const MesElevesScreen = ({ navigation }) => {
  const [eleves, setEleves] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEleves();
  }, []);

  const loadEleves = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const userStr = await AsyncStorage.getItem('user');
      const user = JSON.parse(userStr);
      
      console.log('🔍 Utilisateur connecté:', user.prenom, user.nom, 'ID:', user.id);
      
      // Récupérer les séances DU TUTEUR CONNECTÉ uniquement
      const response = await fetch(`${API_BASE_URL}/api/tutorat/seances/?tuteur=${user.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('🔍 Données brutes des séances:', data);
        
        // Gérer les deux formats possibles de réponse API
        const seances = Array.isArray(data) ? data : (data.results || []);
        console.log('🔍 Séances extraites:', seances.length, 'séances');
        
        if (seances.length > 0) {
          console.log('🔍 Exemple de séance:', seances[0]);
        }
        
        const uniqueEleves = [];
        const seen = new Set();
        
        seances.forEach((s, index) => {
          console.log(`🔍 Séance ${index}:`, {
            id: s.id,
            etudiants: s.etudiants,
            etudiants_details: s.etudiants_details,
            sujet: s.sujet,
            statut: s.statut,
            tuteur: s.tuteur
          });
          
          // CORRECTION : Utiliser etudiants et etudiants_details au lieu de etudiant et etudiant_details
          if (s.etudiants && s.etudiants.length > 0 && s.etudiants_details && s.etudiants_details.length > 0) {
            s.etudiants.forEach((etudiantId, idx) => {
              if (!seen.has(etudiantId)) {
                seen.add(etudiantId);
                // Trouver les détails correspondants
                const etudiantDetails = s.etudiants_details.find(ed => ed.id === etudiantId);
                if (etudiantDetails) {
                  uniqueEleves.push({
                    ...etudiantDetails,
                    nombre_seances: seances.filter(se => 
                      se.etudiants && se.etudiants.includes(etudiantId)
                    ).length
                  });
                }
              }
            });
          }
        });
        
        console.log('🔍 Étudiants uniques trouvés:', uniqueEleves.length);
        console.log('🔍 Détails étudiants:', uniqueEleves);
        
        setEleves(uniqueEleves);
      }
    } catch (error) {
      console.error('Erreur chargement élèves:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header title="Mes élèves" showBack onBackPress={() => navigation.goBack()} />
      <View style={styles.container}>
        {loading ? (
          <LoadingSpinner />
        ) : eleves.length === 0 ? (
          <View style={styles.emptyContainer}>
            <EmptyState icon="people-outline" message="Vous n'avez pas encore d'élèves" />
            <View style={styles.emptyActions}>
              <Button
                title="Non"
                onPress={() => navigation.goBack()}
                style={styles.noButton}
              />
            </View>
          </View>
        ) : (
          <FlatList
            data={eleves}
            renderItem={({ item }) => (
              <EleveItem
                eleve={item}
                onPress={() => navigation.navigate('EleveDetail', { eleveId: item.id })}
              />
            )}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.list}
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
  list: {
    padding: 12,
  },
  eleveCard: {
    marginBottom: 12,
    padding: 16,
  },
  eleveHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  eleveInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  elevePhoto: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  elevePhotoPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#ecf0f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  eleveDetails: {
    flex: 1,
  },
  eleveName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 2,
  },
  eleveEmail: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 2,
  },
  eleveFiliere: {
    fontSize: 12,
    color: '#95a5a6',
  },
  eleveBio: {
    fontSize: 14,
    color: '#34495e',
    lineHeight: 20,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  eleveStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
    paddingTop: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3498db',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyActions: {
    marginTop: 20,
  },
  noButton: {
    backgroundColor: '#e74c3c',
    minWidth: 80,
  },
});

export default MesElevesScreen;