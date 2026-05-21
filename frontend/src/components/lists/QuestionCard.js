import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const QuestionCard = ({ question, onPress }) => {
  // Protection contre les questions null/undefined
  if (!question) {
    return null;
  }
  
  // Protection contre les questions sans titre
  if (!question.titre) {
    return null;
  }
  
  const { titre, contenu, auteur_details, date_publication, nb_reponses, est_resolue, tags, priorite } = question;

  const getPrioriteStyle = (priorite) => {
    switch (priorite) {
      case 'haute':
        return { backgroundColor: '#e74c3c', color: 'white' };
      case 'moyenne':
        return { backgroundColor: '#f39c12', color: 'white' };
      case 'basse':
        return { backgroundColor: '#27ae60', color: 'white' };
      default:
        return { backgroundColor: '#95a5a6', color: 'white' };
    }
  };

  const getPrioriteIcon = (priorite) => {
    switch (priorite) {
      case 'haute':
        return '🔴';
      case 'moyenne':
        return '🟡';
      case 'basse':
        return '🟢';
      default:
        return '⚪';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `il y a ${diffMins} min`;
    if (diffHours < 24) return `il y a ${diffHours} h`;
    return `il y a ${diffDays} j`;
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          {est_resolue && (
            <View style={styles.resolueBadge}>
              <Ionicons name="checkmark-circle" size={16} color="#28a745" />
            </View>
          )}
          {/* Badge de priorité */}
          <View style={[styles.prioriteBadge, getPrioriteStyle(priorite)]}>
            <Text style={styles.prioriteBadgeText}>{getPrioriteIcon(priorite)}</Text>
          </View>
          <Text style={[styles.titre, est_resolue && styles.titreResolue]} numberOfLines={2}>
            {titre}
          </Text>
        </View>
        <View style={styles.reponses}>
          <Ionicons name="chatbubble-outline" size={16} color="#666" />
          <Text style={styles.reponsesText}>{nb_reponses || 0}</Text>
        </View>
      </View>
      <Text style={styles.contenu} numberOfLines={2}>{contenu}</Text>
      {tags && tags.length > 0 && (
        <View style={styles.tags}>
          {tags.split(',').slice(0, 3).map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>{tag.trim()}</Text>
            </View>
          ))}
        </View>
      )}
      <View style={styles.footer}>
        <Text style={styles.auteur}>{auteur_details?.prenom} {auteur_details?.nom}</Text>
        <Text style={styles.date}>{formatDate(date_publication)}</Text>
      </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  resolueBadge: {
    marginRight: 4,
  },
  prioriteBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 6,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 24,
  },
  prioriteBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  titre: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  titreResolue: {
    color: '#28a745',
  },
  reponses: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reponsesText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#666',
  },
  contenu: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  tag: {
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 6,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 10,
    color: '#666',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 6,
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
});

export default QuestionCard;