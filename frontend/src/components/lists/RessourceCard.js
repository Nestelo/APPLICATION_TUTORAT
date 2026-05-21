import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const RessourceCard = ({ ressource, onPress }) => {
  const { titre, matiere, type_fichier, auteur_details, date_publication, nb_telechargements, moyenne_notes } = ressource;

  const getIcon = () => {
    switch (type_fichier) {
      case 'pdf': return 'document-text';
      case 'video': return 'videocam';
      case 'lien': return 'link';
      case 'image': return 'image';
      default: return 'document';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons name={getIcon()} size={24} color="#007bff" />
        </View>
        <View style={styles.info}>
          <Text style={styles.titre} numberOfLines={2}>{titre}</Text>
          <Text style={styles.matiere}>{matiere}</Text>
        </View>
        {moyenne_notes && (
          <View style={styles.note}>
            <Ionicons name="star" size={16} color="#FFD700" />
            <Text style={styles.noteText}>{moyenne_notes.toFixed(1)}</Text>
          </View>
        )}
      </View>
      <View style={styles.footer}>
        <Text style={styles.auteur}>Par {auteur_details?.prenom} {auteur_details?.nom}</Text>
        <Text style={styles.date}>{formatDate(date_publication)}</Text>
      </View>
      {nb_telechargements > 0 && (
        <View style={styles.telechargements}>
          <Ionicons name="download-outline" size={14} color="#666" />
          <Text style={styles.telechargementsText}>{nb_telechargements}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#e6f2ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  titre: {
    fontSize: 16,
    fontWeight: '600',
  },
  matiere: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  note: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  noteText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  auteur: {
    fontSize: 12,
    color: '#666',
  },
  date: {
    fontSize: 12,
    color: '#999',
  },
  telechargements: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    bottom: 12,
    right: 12,
  },
  telechargementsText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
});

export default RessourceCard;