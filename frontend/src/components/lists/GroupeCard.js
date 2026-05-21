import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from '../ui/Card';
import Button from '../ui/Button';

const GroupeCard = ({ groupe, onPress, onRejoindre, showJoinButton = true }) => {
  const [loading, setLoading] = React.useState(false);

  const handleRejoindrePress = () => {
    if (onRejoindre) {
      setLoading(true);
      onRejoindre();
      setTimeout(() => setLoading(false), 1000); // Reset après 1 seconde
    }
  };

  const placesDisponibles = groupe.places_disponibles || 0;
  const placesText = placesDisponibles > 0 ? `${placesDisponibles} places` : 'Complet';
  const placesColor = placesDisponibles > 0 ? '#28a745' : '#dc3545';

  return (
    <Card style={styles.card}>
      <TouchableOpacity onPress={onPress} style={styles.content}>
        <View style={styles.header}>
          <View style={styles.infoContainer}>
            <Text style={styles.nom}>{groupe.nom}</Text>
            <Text style={styles.matiere}>{groupe.offre?.matiere || 'Tutorat'}</Text>
          </View>
          
          <View style={[styles.placesBadge, { backgroundColor: placesColor }]}>
            <Text style={styles.placesText}>{placesText}</Text>
          </View>
        </View>

        <View style={styles.details}>
          <Text style={styles.description} numberOfLines={2}>
            {groupe.description || 'Groupe de tutorat collaboratif'}
          </Text>
          
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Ionicons name="people" size={14} color="#666" />
              <Text style={styles.statText}>{groupe.nombre_membres || 0}/{groupe.capacite_max}</Text>
            </View>
            
            {groupe.nombre_sessions > 0 && (
              <View style={styles.statItem}>
                <Ionicons name="calendar" size={14} color="#666" />
                <Text style={styles.statText}>{groupe.nombre_sessions} séances</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.tuteur}>
            <Ionicons name="person" size={12} color="#007bff" />
            {' '}{groupe.createur?.prenom} {groupe.createur?.nom}
          </Text>
          
          {groupe.date_debut && (
            <Text style={styles.date}>
              Début: {new Date(groupe.date_debut).toLocaleDateString()}
            </Text>
          )}
        </View>
      </TouchableOpacity>

      {showJoinButton && !groupe.inscrit && (
        <View style={styles.actionContainer}>
          {loading ? (
            <ActivityIndicator size="small" color="#007bff" />
          ) : (
            <Button
              title="Rejoindre"
              onPress={handleRejoindrePress}
              style={styles.joinButton}
              disabled={placesDisponibles === 0}
            />
          )}
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  infoContainer: {
    flex: 1,
  },
  nom: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  matiere: {
    fontSize: 14,
    color: '#666',
    backgroundColor: '#e9ecef',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  placesBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  placesText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  details: {
    flex: 1,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    paddingTop: 12,
    marginTop: 8,
  },
  tuteur: {
    fontSize: 12,
    color: '#007bff',
    fontWeight: '500',
  },
  date: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
  },
  actionContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  joinButton: {
    marginTop: 8,
  },
});

export default GroupeCard;