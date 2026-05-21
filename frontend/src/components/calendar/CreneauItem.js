import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const CreneauItem = ({ type, titre, heureDebut, heureFin, statut, onPress }) => {
  const getIcon = () => {
    if (type === 'disponibilite') return 'time-outline';
    if (type === 'seance') {
      switch (statut) {
        case 'planifiee': return 'calendar-outline';
        case 'confirmee': return 'checkmark-circle-outline';
        case 'annulee': return 'close-circle-outline';
        case 'terminee': return 'checkmark-done-outline';
        default: return 'calendar-outline';
      }
    }
  };

  const getColor = () => {
    if (type === 'disponiblite') return '#007bff';
    if (type === 'seance') {
      switch (statut) {
        case 'planifiee': return '#ffc107';
        case 'confirmee': return '#28a745';
        case 'annulee': return '#dc3545';
        case 'terminee': return '#6c757d';
        default: return '#007bff';
      }
    }
  };

  const getStatutLabel = () => {
    switch (statut) {
      case 'planifiee': return 'Planifiée';
      case 'confirmee': return 'Confirmée';
      case 'annulee': return 'Annulée';
      case 'terminee': return 'Terminée';
      default: return '';
    }
  };

  return (
    <TouchableOpacity style={[styles.container, { borderLeftColor: getColor() }]} onPress={onPress}>
      <View style={styles.iconContainer}>
        <Ionicons name={getIcon()} size={20} color={getColor()} />
      </View>
      <View style={styles.content}>
        {type === 'seance' && titre && <Text style={styles.titre}>{titre}</Text>}
        <Text style={styles.horaire}>{heureDebut} - {heureFin}</Text>
        {type === 'seance' && statut && (
          <Text style={[styles.statut, { color: getColor() }]}>{getStatutLabel()}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    marginVertical: 4,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  iconContainer: {
    width: 30,
    alignItems: 'center',
  },
  content: {
    flex: 1,
    marginLeft: 8,
  },
  titre: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  horaire: {
    fontSize: 13,
    color: '#333',
  },
  statut: {
    fontSize: 12,
    marginTop: 2,
  },
});

export default CreneauItem;