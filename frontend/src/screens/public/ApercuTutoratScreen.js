import React from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import Header from '../../components/ui/Header';
import Card from '../../components/ui/Card';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get("window");
const isSmallDevice = width < 380;

// Données modernes et variées pour le tutorat
const tutoratCategories = [
  {
    id: '1',
    titre: 'Département de Génie Informatique (GI)',
    description: 'Algorithmique, Programmation orientée objet, Bases de données',
    icon: 'code-outline',
    color: '#4ECDC4',
    bgColor: '#E5F9F6',
    matieres: [
      'Algorithmique et structures de données',
      'Programmation orientée objet (Java, C++, Python)',
      'Bases de données SQL/NoSQL',
      'Développement Web et Mobile',
      'Génie logiciel et modélisation'
    ]
  },
  {
    id: '2',
    titre: 'Département de Génie Mécanique (GM)',
    description: 'Mécanique des milieux continus, Résistance des matériaux, CAO/DAO',
    icon: 'construct-outline',
    color: '#FECA57',
    bgColor: '#FFF9E5',
    matieres: [
      'Mécanique des milieux continus',
      'Résistance des matériaux',
      'Construction mécanique et CAO/DAO',
      'Fabrication mécanique et usinage',
      'Dynamique et vibrations des structures'
    ]
  },
  {
    id: '3',
    titre: 'Master EEA (Électrotechnique-Énergie-Automatique)',
    description: 'Commande avancée, Smart Grids, Machines électriques',
    icon: 'battery-charging-outline',
    color: '#96CEB4',
    bgColor: '#E5F5EE',
    matieres: [
      'Automatique avancée (commande robuste, commande optimale)',
      'Modélisation et commande des machines électriques',
      'Gestion intelligente des réseaux électriques (Smart Grids)',
      'Optimisation des systèmes énergétiques hybrides',
      'Conversibilité et qualité de l’énergie'
    ]
  },
  {
    id: '4',
    titre: 'Master MEGVIB (Génie Mécanique)',
    description: 'Vibrations, éléments finis, acoustique industrielle',
    icon: 'speedometer-outline',
    color: '#FFA726',
    bgColor: '#FFF4E6',
    matieres: [
      'Dynamique avancée et vibrations des structures',
      'Éléments finis et modélisation numérique',
      'Acoustique industrielle et contrôle des bruits',
      'Fiabilité des systèmes mécaniques',
      'Maintenance prédictive et diagnostic'
    ]
  },
  {
    id: '5',
    titre: 'Département de Télécommunication et Multimédia (TELECOM)',
    description: 'Réseaux, 4G/5G, traitement d’images et multimédia',
    icon: 'wifi-outline',
    color: '#5C6BC0',
    bgColor: '#E8EAF6',
    matieres: [
      'Théorie du signal et traitement numérique',
      'Réseaux informatiques et protocoles IP',
      'Télécommunications mobiles 4G/5G',
      'Fibres optiques et communications satellites',
      'Traitement d’image et multimédia'
    ]
  },
  {
    id: '6',
    titre: 'Sciences Biomédicales et Pharmaceutiques (SBMP)',
    description: 'Anatomie, Biochimie, Pharmacologie et pathologie',
    icon: 'medical-outline',
    color: '#EC407A',
    bgColor: '#FCE4EC',
    matieres: [
      'Anatomie humaine et physiologie',
      'Biochimie clinique et biologie moléculaire',
      'Pharmacologie générale',
      'Microbiologie médicale et immunologie',
      'Pathologie générale et sémiologie'
    ]
  }
];

const ApercuTutoratScreen = ({ navigation }) => {
  const { user } = useAuth();

  const handlePressItem = (item) => {
    if (user) {
      // Si connecté, rediriger vers le détail de la ressource (à adapter selon votre logique)
      navigation.navigate('RessourceDetail', { id: item.id });
    } else {
      navigation.navigate('Connexion');
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity onPress={() => handlePressItem(item)} style={styles.categoryCard}>
      <View style={[styles.iconContainer, { backgroundColor: item.bgColor }]}>
        <Ionicons name={item.icon} size={isSmallDevice ? 28 : 32} color={item.color} />
      </View>
      <View style={styles.categoryInfo}>
        <Text style={styles.categoryTitle}>{item.titre}</Text>
        <Text style={styles.categoryDescription}>{item.description}</Text>
        <View style={styles.matieresContainer}>
          {item.matieres.slice(0, 3).map((matiere, index) => (
            <View key={index} style={[styles.matiereTag, { borderColor: item.color }]}>
              <Text style={[styles.matiereText, { color: item.color }]}>{matiere}</Text>
            </View>
          ))}
          {item.matieres.length > 3 && (
            <Text style={[styles.plusText, { color: item.color }]}>+{item.matieres.length - 3}</Text>
          )}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#C0C0C0" />
    </TouchableOpacity>
  );

  return (
    <>
      <Header title="Aperçu du tutorat" showBack onBackPress={() => navigation.goBack()} />
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>Explorez nos catégories de tutorat</Text>
          <Text style={styles.heroSubtitle}>
            Accédez à un apprentissage personnalisé avec nos tuteurs qualifiés dans divers domaines
          </Text>
        </View>
        
        <View style={styles.statsSection}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>6+</Text>
            <Text style={styles.statLabel}>Catégories</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>30+</Text>
            <Text style={styles.statLabel}>Matières</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>24/7</Text>
            <Text style={styles.statLabel}>Disponibilité</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Catégories disponibles</Text>
        <FlatList
          data={tutoratCategories}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          scrollEnabled={false}
        />

        {!user && (
          <View style={styles.ctaSection}>
            <TouchableOpacity 
              style={styles.ctaButton} 
              onPress={() => navigation.navigate('Connexion')}
            >
              <Text style={styles.ctaText}>Connectez-vous pour accéder à tout le contenu</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  contentContainer: {
    padding: 20,
  },
  heroSection: {
    marginBottom: 30,
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: isSmallDevice ? 24 : 28,
    fontWeight: 'bold',
    color: '#00796B',
    textAlign: 'center',
    marginBottom: 10,
  },
  heroSubtitle: {
    fontSize: isSmallDevice ? 14 : 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 30,
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: isSmallDevice ? 20 : 24,
    fontWeight: 'bold',
    color: '#00796B',
  },
  statLabel: {
    fontSize: isSmallDevice ? 12 : 14,
    color: '#64748b',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: isSmallDevice ? 18 : 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 20,
  },
  list: {
    paddingBottom: 20,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginBottom: 15,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  iconContainer: {
    width: isSmallDevice ? 50 : 60,
    height: isSmallDevice ? 50 : 60,
    borderRadius: isSmallDevice ? 25 : 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: isSmallDevice ? 16 : 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 5,
  },
  categoryDescription: {
    fontSize: isSmallDevice ? 13 : 14,
    color: '#64748b',
    marginBottom: 10,
  },
  matieresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  matiereTag: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 6,
    marginBottom: 4,
  },
  matiereText: {
    fontSize: isSmallDevice ? 10 : 11,
    fontWeight: '500',
  },
  plusText: {
    fontSize: isSmallDevice ? 10 : 11,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  ctaSection: {
    marginTop: 30,
    alignItems: 'center',
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00796B',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  ctaText: {
    color: '#fff',
    fontSize: isSmallDevice ? 14 : 16,
    fontWeight: 'bold',
    marginRight: 10,
  },
});

export default ApercuTutoratScreen;