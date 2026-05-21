import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const TuteurCard = ({ tuteur, onPress }) => {
  const {
    nom,
    prenom,
    photo,
    matieres_maitrisees,
    tarif_horaire,
    note_moyenne,
    nb_evaluations,
  } = tuteur;

  const matieresList = matieres_maitrisees ? matieres_maitrisees.split(',').slice(0, 3) : [];

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <Image
          source={photo ? { uri: photo } : require('../../../assets/images/default-avatar.png')}
          style={styles.avatar}
        />
        <View style={styles.info}>
          <Text style={styles.name}>{prenom} {nom}</Text>
          <View style={styles.rating}>
            <Ionicons name="star" size={16} color="#FFD700" />
            <Text style={styles.ratingText}>
              {note_moyenne ? note_moyenne.toFixed(1) : 'Nouveau'} ({nb_evaluations || 0} avis)
            </Text>
          </View>
        </View>
        {tarif_horaire ? (
          <Text style={styles.tarif}>{tarif_horaire}€/h</Text>
        ) : (
          <Text style={styles.gratuit}>Gratuit</Text>
        )}
      </View>
      <View style={styles.matieres}>
        {matieresList.map((matiere, index) => (
          <View key={index} style={styles.matiereTag}>
            <Text style={styles.matiereText}>{matiere.trim()}</Text>
          </View>
        ))}
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
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  ratingText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#666',
  },
  tarif: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#28a745',
  },
  gratuit: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#007bff',
  },
  matieres: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  matiereTag: {
    backgroundColor: '#f0f0f0',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 6,
    marginBottom: 4,
  },
  matiereText: {
    fontSize: 12,
    color: '#333',
  },
});

export default TuteurCard;