import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/ui/Header';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { getUser } from '../../api/userService';
import { getSeances } from '../../api/tutorService';
import { formatDate } from '../../utils/helpers';

const EleveDetailScreen = ({ navigation, route }) => {
  const { eleveId } = route.params;
  const [eleve, setEleve] = useState(null);
  const [seances, setSeances] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [user, seancesData] = await Promise.all([
        getUser(eleveId),
        getSeances({ etudiant: eleveId }),
      ]);
      
      // Gérer les deux formats possibles de réponse API pour les séances
      const seances = Array.isArray(seancesData) ? seancesData : (seancesData.results || []);
      
      setEleve(user);
      setSeances(seances);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de charger les données');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <>
      <Header title="Détail élève" showBack onBackPress={() => navigation.goBack()} />
      <ScrollView style={styles.container}>
        {/* Photo et informations principales */}
        <Card style={styles.profileCard}>
          <View style={styles.profileHeader}>
            {eleve.photo ? (
              <Image source={{ uri: eleve.photo }} style={styles.profilePhoto} />
            ) : (
              <View style={styles.profilePhotoPlaceholder}>
                <Ionicons name="person" size={40} color="#95a5a6" />
              </View>
            )}
            <View style={styles.profileInfo}>
              <Text style={styles.name}>{eleve.prenom} {eleve.nom}</Text>
              <Text style={styles.email}>{eleve.email}</Text>
              <Text style={styles.filiere}>{eleve.filiere} • {eleve.annee}</Text>
            </View>
          </View>
        </Card>

        {/* Biographie */}
        {eleve.biographie && (
          <Card style={styles.bioCard}>
            <Text style={styles.sectionTitle}>📝 Biographie</Text>
            <Text style={styles.bioText}>{eleve.biographie}</Text>
          </Card>
        )}

        {/* Objectifs d'apprentissage */}
        {eleve.objectifs_apprentissage && (
          <Card style={styles.objectifsCard}>
            <Text style={styles.sectionTitle}>🎯 Objectifs d'apprentissage</Text>
            <Text style={styles.objectifsText}>{eleve.objectifs_apprentissage}</Text>
          </Card>
        )}

        {/* Centres d'intérêt */}
        {eleve.centres_interet && (
          <Card style={styles.interetsCard}>
            <Text style={styles.sectionTitle}>💡 Centres d'intérêt</Text>
            <Text style={styles.interetsText}>{eleve.centres_interet}</Text>
          </Card>
        )}

        {/* Statistiques */}
        <Card style={styles.statsCard}>
          <Text style={styles.sectionTitle}>📊 Statistiques</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{seances.length}</Text>
              <Text style={styles.statLabel}>Séances totales</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{seances.filter(s => s.statut === 'terminee').length}</Text>
              <Text style={styles.statLabel}>Séances terminées</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{seances.filter(s => s.statut === 'planifiee').length}</Text>
              <Text style={styles.statLabel}>Séances planifiées</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{eleve.note_moyenne || 0}</Text>
              <Text style={styles.statLabel}>Note moyenne</Text>
            </View>
          </View>
        </Card>

        {/* Séances récentes */}
        <Card style={styles.seancesCard}>
          <Text style={styles.sectionTitle}>📅 Séances récentes</Text>
          {Array.isArray(seances) && seances.length > 0 ? (
            seances.slice(-5).reverse().map((seance) => (
              <View key={seance.id} style={styles.seanceItem}>
                <View style={styles.seanceHeader}>
                  <Text style={styles.seanceDate}>{formatDate(seance.date_heure_debut)}</Text>
                  <Text style={[
                    styles.seanceStatus,
                    seance.statut === 'terminee' ? styles.statusTerminee : 
                    seance.statut === 'planifiee' ? styles.statusPlanifiee : 
                    styles.statusEnCours
                  ]}>
                    {seance.statut === 'terminee' ? 'Terminée' : 
                     seance.statut === 'planifiee' ? 'Planifiée' : 'En cours'}
                  </Text>
                </View>
                <Text style={styles.seanceSubject}>{seance.sujet}</Text>
                {seance.lieu && <Text style={styles.seanceLieu}>📍 {seance.lieu}</Text>}
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>Aucune séance pour le moment</Text>
          )}
        </Card>

        {/* Actions */}
        <View style={styles.actionsContainer}>
          <Button
            title="Envoyer un message"
            onPress={() => navigation.navigate('TutorMessages', { autreId: eleveId })}
            style={styles.messageButton}
          />
          <Button
            title="📋 Planifier une séance"
            onPress={() => navigation.navigate('BookingSession', { etudiantId: eleveId })}
            style={styles.bookingButton}
          />
        </View>
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
  profileCard: {
    marginBottom: 12,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  profilePhoto: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
  },
  profilePhotoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ecf0f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 2,
  },
  filiere: {
    fontSize: 16,
    color: '#34495e',
    fontWeight: '500',
  },
  bioCard: {
    marginBottom: 12,
    padding: 16,
  },
  bioText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#34495e',
  },
  objectifsCard: {
    marginBottom: 12,
    padding: 16,
  },
  objectifsText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#34495e',
  },
  interetsCard: {
    marginBottom: 12,
    padding: 16,
  },
  interetsText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#34495e',
  },
  statsCard: {
    marginBottom: 12,
    padding: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3498db',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  seancesCard: {
    marginBottom: 12,
    padding: 16,
  },
  seanceItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  seanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  seanceDate: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  seanceStatus: {
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  statusTerminee: {
    backgroundColor: '#d4edda',
    color: '#155724',
  },
  statusPlanifiee: {
    backgroundColor: '#fff3cd',
    color: '#856404',
  },
  statusEnCours: {
    backgroundColor: '#cce5ff',
    color: '#004085',
  },
  seanceSubject: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2c3e50',
    marginBottom: 2,
  },
  seanceLieu: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  emptyText: {
    textAlign: 'center',
    color: '#7f8c8d',
    fontStyle: 'italic',
    paddingVertical: 20,
  },
  actionsContainer: {
    marginBottom: 20,
  },
  messageButton: {
    marginBottom: 8,
  },
  bookingButton: {
    backgroundColor: '#27ae60',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 12,
  },
});

export default EleveDetailScreen;