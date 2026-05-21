import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Header from '../../components/ui/Header';
import Card from '../../components/ui/Card';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import StatsCard from '../../components/ui/StatsCard';
import {
  getOffres,
  getSeances,
  getGroupes,
  updateOffre,
  updateSeance,
} from '../../api/tutorService';

const GestionTutoratScreen = ({ navigation }) => {
  const [tab, setTab] = useState('offres'); // 'offres' | 'seances' | 'groupes'
  const [offres, setOffres] = useState([]);
  const [seances, setSeances] = useState([]);
  const [groupes, setGroupes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [offresResult, seancesResult, groupesResult] = await Promise.all([
        getOffres(),
        getSeances(),
        getGroupes(),
      ]);

      setOffres(offresResult?.success ? offresResult.data : []);
      setSeances(seancesResult?.success ? seancesResult.data : []);
      setGroupes(groupesResult?.success ? groupesResult.data : []);
    } catch (error) {
      console.error(error);
      Alert.alert('Erreur', 'Impossible de charger les données de tutorat');
    } finally {
      setLoading(false);
    }
  };

  // --- Stats globales ---
  const nbOffresActives = offres.filter((o) => o.est_active).length;
  const nbGroupes = groupes.length;
  const nbSeancesAVenir = seances.filter((s) =>
    ['planifiee', 'confirmee'].includes(s.statut),
  ).length;
  const nbSeancesAnnulees = seances.filter((s) => s.statut === 'annulee').length;

  // --- Actions ---
  const toggleOffreActive = (offre) => {
    const newVal = !offre.est_active;
    Alert.alert(
      'Confirmation',
      `Voulez-vous ${newVal ? 'activer' : 'désactiver'} cette offre ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: async () => {
            try {
              await updateOffre(offre.id, { est_active: newVal });
              loadData();
            } catch (error) {
              Alert.alert('Erreur', "Impossible de mettre à jour l'offre");
            }
          },
        },
      ],
    );
  };

  const annulerSeance = (seance) => {
    if (seance.statut === 'annulee' || seance.statut === 'terminee') {
      return;
    }
    Alert.alert(
      'Annuler la séance',
      'Voulez-vous vraiment annuler cette séance ?',
      [
        { text: 'Non', style: 'cancel' },
        {
          text: 'Oui, annuler',
          style: 'destructive',
          onPress: async () => {
            try {
              await updateSeance(seance.id, { statut: 'annulee' });
              loadData();
            } catch (error) {
              Alert.alert('Erreur', "Impossible d'annuler la séance");
            }
          },
        },
      ],
    );
  };

  // --- Render items ---
  const renderOffre = ({ item }) => {
    return (
      <Card style={styles.card}>
        <View style={styles.offreHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{item.titre}</Text>
            <Text style={styles.subtitle}>
              {item.tuteur_details?.prenom} {item.tuteur_details?.nom} • {item.matiere} •{' '}
              {item.niveau || 'Niveau ?'}
            </Text>
          </View>
          <View
            style={[
              styles.badge,
              { backgroundColor: (item.est_active ? '#28a745' : '#dc3545') + '20' },
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                { color: item.est_active ? '#28a745' : '#dc3545' },
              ]}
            >
              {item.est_active ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaText}>
            Type : {item.type === 'groupe' ? 'Groupe' : 'Individuel'}
          </Text>
          {item.tarif && <Text style={styles.metaText}>Tarif : {item.tarif} DA</Text>}
        </View>
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => toggleOffreActive(item)}>
            <Ionicons
              name={item.est_active ? 'pause-circle-outline' : 'play-circle-outline'}
              size={20}
              color={item.est_active ? '#dc3545' : '#28a745'}
            />
            <Text
              style={[
                styles.actionText,
                { color: item.est_active ? '#dc3545' : '#28a745' },
              ]}
            >
              {item.est_active ? 'Désactiver' : 'Activer'}
            </Text>
          </TouchableOpacity>
        </View>
      </Card>
    );
  };

  const renderSeance = ({ item }) => {
    let dateStr = '';
    try {
      dateStr = format(new Date(item.date_heure_debut), "dd MMM yyyy 'à' HH:mm", { locale: fr });
    } catch {
      dateStr = item.date_heure_debut;
    }

    const canAnnuler = !['annulee', 'terminee'].includes(item.statut);

    return (
      <Card style={styles.card}>
        <View style={styles.seanceHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{dateStr}</Text>
            <Text style={styles.subtitle}>
              Tuteur : {item.tuteur_details?.prenom} {item.tuteur_details?.nom}
            </Text>
            {item.etudiant_details && (
              <Text style={styles.subtitle}>
                Étudiant : {item.etudiant_details.prenom} {item.etudiant_details.nom}
              </Text>
            )}
            {item.groupe && <Text style={styles.subtitle}>Groupe ID : {item.groupe}</Text>}
          </View>
          <View style={styles.badgeSeance}>
            <Text style={styles.badgeText}>{item.statut}</Text>
          </View>
        </View>
        <View style={styles.actionsRow}>
          {canAnnuler && (
            <TouchableOpacity style={styles.actionBtn} onPress={() => annulerSeance(item)}>
              <Ionicons name="alert-circle-outline" size={20} color="#dc3545" />
              <Text style={[styles.actionText, { color: '#dc3545' }]}>Annuler</Text>
            </TouchableOpacity>
          )}
        </View>
      </Card>
    );
  };

  const renderGroupe = ({ item }) => {
    let periode = '';
    if (item.date_debut) {
      try {
        const deb = format(new Date(item.date_debut), 'dd MMM yyyy', { locale: fr });
        if (item.date_fin) {
          const fin = format(new Date(item.date_fin), 'dd MMM yyyy', { locale: fr });
          periode = `${deb} → ${fin}`;
        } else {
          periode = `À partir du ${deb}`;
        }
      } catch {
        periode = `${item.date_debut} - ${item.date_fin || ''}`;
      }
    }

    return (
      <Card style={styles.card}>
        <View style={styles.groupeHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{item.nom}</Text>
            <Text style={styles.subtitle}>
              Créé par : {item.createur_details?.prenom} {item.createur_details?.nom}
            </Text>
            <Text style={styles.subtitle}>Capacité : {item.capacite_max}</Text>
            {periode ? <Text style={styles.subtitle}>{periode}</Text> : null}
          </View>
        </View>
      </Card>
    );
  };

  const renderContent = () => {
    if (tab === 'offres') {
      if (offres.length === 0) {
        return (
          <EmptyState icon="briefcase-outline" message="Aucune offre de tutorat pour le moment" />
        );
      }
      return (
        <FlatList
          data={offres}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderOffre}
          contentContainerStyle={styles.list}
        />
      );
    }

    if (tab === 'seances') {
      if (seances.length === 0) {
        return (
          <EmptyState icon="calendar-outline" message="Aucune séance planifiée pour le moment" />
        );
      }
      return (
        <FlatList
          data={seances}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderSeance}
          contentContainerStyle={styles.list}
        />
      );
    }

    // groupes
    if (groupes.length === 0) {
      return <EmptyState icon="people-outline" message="Aucun groupe de tutorat pour le moment" />;
    }
    return (
      <FlatList
        data={groupes}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderGroupe}
        contentContainerStyle={styles.list}
      />
    );
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <>
      <Header title="Gestion du tutorat" showBack onBackPress={() => navigation.goBack()} />
      <View style={styles.container}>
        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            <StatsCard
              value={nbOffresActives}
              label="Offres actives"
              icon="briefcase"
              color="#007bff"
            />
            <StatsCard
              value={nbGroupes}
              label="Groupes"
              icon="people-circle"
              color="#17a2b8"
            />
          </View>
          <View style={styles.statsRow}>
            <StatsCard
              value={nbSeancesAVenir}
              label="Séances à venir"
              icon="calendar"
              color="#28a745"
            />
            <StatsCard
              value={nbSeancesAnnulees}
              label="Séances annulées"
              icon="alert-circle"
              color="#dc3545"
            />
          </View>
        </View>

        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, tab === 'offres' && styles.tabActive]}
            onPress={() => setTab('offres')}
          >
            <Text style={[styles.tabText, tab === 'offres' && styles.tabTextActive]}>Offres</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, tab === 'seances' && styles.tabActive]}
            onPress={() => setTab('seances')}
          >
            <Text style={[styles.tabText, tab === 'seances' && styles.tabTextActive]}>
              Séances
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, tab === 'groupes' && styles.tabActive]}
            onPress={() => setTab('groupes')}
          >
            <Text style={[styles.tabText, tab === 'groupes' && styles.tabTextActive]}>
              Groupes
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ flex: 1 }}>{renderContent()}</View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  statsContainer: {
    paddingHorizontal: 8,
    paddingTop: 6,
    paddingBottom: 2,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 6,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 6,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#007bff',
  },
  tabText: {
    fontSize: 12,
    color: '#555',
  },
  tabTextActive: {
    color: '#007bff',
    fontWeight: '600',
  },
  list: {
    paddingHorizontal: 8,
    paddingBottom: 12,
  },
  card: {
    marginVertical: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#222',
  },
  subtitle: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  offreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 3,
  },
  seanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  groupeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  badge: {
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeSeance: {
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: '#e9ecef',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 3,
  },
  metaText: {
    fontSize: 10,
    color: '#555',
    marginRight: 8,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 4,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  actionText: {
    fontSize: 10,
    marginLeft: 3,
  },
});

export default GestionTutoratScreen;