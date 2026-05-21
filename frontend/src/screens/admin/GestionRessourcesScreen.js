import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/ui/Header';
import Card from '../../components/ui/Card';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import StatsCard from '../../components/ui/StatsCard';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { getRessources, validerRessource, rejeterRessource, deleteRessource } from '../../api/ressourceService';

const statutLabel = {
  en_attente: 'En attente',
  publie: 'Publié',
  rejete: 'Rejeté',
};

const roleLabel = {
  etudiant: 'Étudiant',
  tuteur: 'Tuteur',
  enseignant: 'Enseignant',
  admin: 'Admin',
};

const GestionRessourcesScreen = ({ navigation }) => {
  const [ressources, setRessources] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, en_attente, publie, rejete

  useEffect(() => {
    loadRessources();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [ressources, search, statusFilter]);

  const loadRessources = async () => {
    try {
      const data = await getRessources();
      setRessources(data);
    } catch (error) {
      console.error(error);
      Alert.alert('Erreur', 'Impossible de charger les ressources');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    const source = Array.isArray(ressources) ? ressources : [];
    let list = source;

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.titre?.toLowerCase().includes(q) ||
          r.matiere?.toLowerCase().includes(q) ||
          r.niveau?.toLowerCase().includes(q) ||
          r.auteur_details?.prenom?.toLowerCase().includes(q) ||
          r.auteur_details?.nom?.toLowerCase().includes(q),
      );
    }

    if (statusFilter !== 'all') {
      list = list.filter((r) => r.statut === statusFilter);
    }

    setFiltered(list);
  };

  const handleUpdateStatut = async (ressource, newStatut) => {
    Alert.alert(
      'Confirmation',
      `Confirmer la décision: "${statutLabel[newStatut] || newStatut}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: async () => {
            try {
              if (newStatut === 'publie') {
                await validerRessource(ressource.id, {});
              } else if (newStatut === 'rejete') {
                Alert.prompt(
                  'Motif de rejet obligatoire',
                  'Veuillez indiquer le motif du rejet :',
                  [
                    { text: 'Annuler', style: 'cancel' },
                    {
                      text: 'Rejeter',
                      style: 'destructive',
                      onPress: async (motif) => {
                        if (!motif || motif.trim() === '') {
                          Alert.alert('Erreur', 'Motif de rejet obligatoire');
                          return;
                        }
                        await rejeterRessource(ressource.id, motif.trim());
                      },
                    },
                  ],
                  'plain-text',
                  null,
                  null
                );
                return;
              } else {
                // fallback: si statut inattendu, on tente update
                await rejeterRessource(ressource.id, 'Motif non précisé');
              }

              loadRessources();
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de mettre à jour la ressource');
            }
          },
        },
      ],
    );
  };

  const handleDelete = (ressource) => {
    Alert.alert(
      'Suppression',
      `Supprimer définitivement la ressource "${ressource.titre}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteRessource(ressource.id);
              loadRessources();
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de supprimer la ressource');
            }
          },
        },
      ],
    );
  };

  const total = ressources.length;
  const enAttente = ressources.filter((r) => r.statut === 'en_attente').length;
  const publiees = ressources.filter((r) => r.statut === 'publie').length;
  const rejetes = ressources.filter((r) => r.statut === 'rejete').length;
  const totalDownloads = ressources.reduce(
    (sum, r) => sum + (r.nb_telechargements || 0),
    0,
  );

  const renderItem = ({ item }) => {
    const isPending = item.statut === 'en_attente';
    const isPublie = item.statut === 'publie';
    const isRejete = item.statut === 'rejete';

    let statutColor = '#ff9800';
    if (isPublie) statutColor = '#28a745';
    if (isRejete) statutColor = '#dc3545';

    const auteurRoleKey = item.auteur_details?.role;
    const auteurRole = roleLabel[auteurRoleKey] || auteurRoleKey || '';
    let datePub = '';
    if (item.date_publication) {
      try {
        datePub = format(new Date(item.date_publication), "dd MMM yyyy 'à' HH:mm", { locale: fr });
      } catch {
        datePub = item.date_publication;
      }
    }

    return (
      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{item.titre}</Text>
            <Text style={styles.subtitle}>
              {item.auteur_details?.prenom} {item.auteur_details?.nom}
              {auteurRole ? ` (${auteurRole})` : ''} • {item.matiere || 'Matière ?'} •{' '}
              {item.niveau || 'Niveau ?'}
            </Text>
            {datePub ? (
              <Text style={styles.dateText}>Publié le {datePub}</Text>
            ) : null}
          </View>
          <View style={[styles.statutBadge, { backgroundColor: statutColor + '20' }]}>
            <Text style={[styles.statutText, { color: statutColor }]}>
              {statutLabel[item.statut] || item.statut}
            </Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons name="document-text-outline" size={16} color="#555" />
            <Text style={styles.metaText}>{item.type_fichier?.toUpperCase()}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="eye-outline" size={16} color="#555" />
            <Text style={styles.metaText}>{item.nb_vues ?? 0} vues</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="download-outline" size={16} color="#555" />
            <Text style={styles.metaText}>{item.nb_telechargements ?? 0} téléchargements</Text>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => navigation.navigate('ValidationRessource', { ressourceId: item.id })}
          >
            <Ionicons name="information-circle-outline" size={18} color="#007bff" />
            <Text style={[styles.actionText, { color: '#007bff' }]}>Détails</Text>
          </TouchableOpacity>
          {isPending && (
            <>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => handleUpdateStatut(item, 'publie')}
              >
                <Ionicons name="checkmark-circle-outline" size={18} color="#28a745" />
                <Text style={[styles.actionText, { color: '#28a745' }]}>Valider</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => handleUpdateStatut(item, 'rejete')}
              >
                <Ionicons name="close-circle-outline" size={18} color="#dc3545" />
                <Text style={[styles.actionText, { color: '#dc3545' }]}>Rejeter</Text>
              </TouchableOpacity>
            </>
          )}
          {!isPending && (
            <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(item)}>
              <Ionicons name="trash-outline" size={18} color="#dc3545" />
              <Text style={[styles.actionText, { color: '#dc3545' }]}>Supprimer</Text>
            </TouchableOpacity>
          )}
        </View>
      </Card>
    );
  };

  if (loading) return <LoadingSpinner />;

  return (
    <>
      <Header title="Gestion des ressources" showBack onBackPress={() => navigation.goBack()} />
      <FlatList
        ListHeaderComponent={
          <View style={styles.headerContainer}>
            <View style={styles.statsRow}>
              <StatsCard value={total} label="Total" icon="documents" color="#007bff" />
              <StatsCard value={enAttente} label="En attente" icon="time" color="#ff9800" />
            </View>
            <View style={styles.statsRow}>
              <StatsCard value={publiees} label="Publiées" icon="checkmark-circle" color="#28a745" />
              <StatsCard value={rejetes} label="Rejetées" icon="close-circle" color="#dc3545" />
            </View>
            <View style={styles.statsRow}>
              <StatsCard
                value={totalDownloads}
                label="Téléchargements"
                icon="download"
                color="#17a2b8"
              />
              <View style={styles.statsSpacer} />
            </View>

            <View style={styles.searchSection}>
              <View style={styles.searchBar}>
                <Ionicons name="search" size={20} color="#999" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Rechercher par titre, matière, auteur..."
                  value={search}
                  onChangeText={setSearch}
                />
              </View>
              <View style={styles.statusFilters}>
                <TouchableOpacity
                  style={[styles.statusChip, statusFilter === 'all' && styles.statusChipActive]}
                  onPress={() => setStatusFilter('all')}
                >
                  <Text
                    style={[
                      styles.statusText,
                      statusFilter === 'all' && styles.statusTextActive,
                    ]}
                  >
                    Toutes
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.statusChip,
                    statusFilter === 'en_attente' && styles.statusChipActive,
                  ]}
                  onPress={() => setStatusFilter('en_attente')}
                >
                  <Text
                    style={[
                      styles.statusText,
                      statusFilter === 'en_attente' && styles.statusTextActive,
                    ]}
                  >
                    En attente
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.statusChip,
                    statusFilter === 'publie' && styles.statusChipActive,
                  ]}
                  onPress={() => setStatusFilter('publie')}
                >
                  <Text
                    style={[
                      styles.statusText,
                      statusFilter === 'publie' && styles.statusTextActive,
                    ]}
                  >
                    Publiées
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.statusChip,
                    statusFilter === 'rejete' && styles.statusChipActive,
                  ]}
                  onPress={() => setStatusFilter('rejete')}
                >
                  <Text
                    style={[
                      styles.statusText,
                      statusFilter === 'rejete' && styles.statusTextActive,
                    ]}
                  >
                    Rejetées
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {filtered.length === 0 && (
              <EmptyState
                icon="document-text-outline"
                message="Aucune ressource ne correspond à vos filtres"
              />
            )}
          </View>
        }
        data={filtered}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
      />
    </>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 4,
    backgroundColor: '#f5f5f5',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  statsSpacer: {
    flex: 1,
    margin: 5,
  },
  searchSection: {
    marginTop: 4,
    paddingVertical: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  searchInput: {
    flex: 1,
    paddingVertical: 8,
    marginLeft: 8,
  },
  statusFilters: {
    flexDirection: 'row',
    marginTop: 8,
    flexWrap: 'wrap',
  },
  statusChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#e9ecef',
    marginRight: 8,
    marginTop: 4,
  },
  statusChipActive: {
    backgroundColor: '#007bff',
  },
  statusText: {
    fontSize: 13,
    color: '#333',
  },
  statusTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  list: {
    paddingHorizontal: 12,
    paddingBottom: 16,
  },
  card: {
    marginVertical: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
  },
  subtitle: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  statutBadge: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statutText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#555',
    marginLeft: 4,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    marginTop: 8,
    paddingTop: 6,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  actionText: {
    fontSize: 12,
    marginLeft: 4,
  },
});

export default GestionRessourcesScreen;