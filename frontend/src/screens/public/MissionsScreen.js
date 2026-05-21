import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity, Animated } from 'react-native';
import Header from '../../components/ui/Header';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get("window");
const isSmallDevice = width < 380;

const MissionsScreen = ({ navigation }) => {
  const [selectedMission, setSelectedMission] = useState(null);

  const missionData = [
    {
      id: 'accompagnement',
      icon: "school-outline",
      color: "#2E7D32",
      bgColor: "#E8F5E9",
      title: "Accompagnement Personnalisé",
      description: "Offrir un soutien pédagogique adapté à chaque étudiant pour maximiser son potentiel académique.",
      details: "Programmes individualisés, suivi régulier, adaptation aux besoins spécifiques"
    },
    {
      id: 'connexion',
      icon: "people-outline",
      color: "#1565C0",
      bgColor: "#E3F2FD",
      title: "Connexion Pédagogique",
      description: "Mettre en relation les étudiants avec des tuteurs qualifiés pour un apprentissage efficace.",
      details: "Matching intelligent, profils vérifiés, expertise validée"
    },
    {
      id: 'ressources',
      icon: "book-outline",
      color: "#EF6C00",
      bgColor: "#FFF3E0",
      title: "Ressources de Qualité",
      description: "Faciliter l'accès à des ressources académiques pertinentes et actualisées.",
      details: "Bibliothèque numérique, fiches de cours, exercices corrigés"
    },
    {
      id: 'collaboratif',
      icon: "chatbubbles-outline",
      color: "#6A1B9A",
      bgColor: "#F3E5F5",
      title: "Apprentissage Collaboratif",
      description: "Promouvoir l'entraide entre pairs et le partage de connaissances.",
      details: "Groupes d'étude, forums, sessions collectives"
    },
    {
      id: 'excellence',
      icon: "trophy-outline",
      color: "#C62828",
      bgColor: "#FFEBEE",
      title: "Excellence Académique",
      description: "Améliorer les taux de réussite et accompagner vers l'excellence.",
      details: "Préparation aux examens, méthodologie, coaching"
    },
    {
      id: 'bienetre',
      icon: "heart-outline",
      color: "#00695C",
      bgColor: "#E0F2F1",
      title: "Bien-être Étudiant",
      description: "Créer un environnement bienveillant pour favoriser l'épanouissement personnel.",
      details: "Soutien psychologique, gestion du stress, équilibre vie études"
    }
  ];

  const handleMissionPress = (mission) => {
    setSelectedMission(selectedMission === mission.id ? null : mission.id);
  };

  const CompactMissionCard = ({ item, index }) => {
    const iconScaleAnim = React.useRef(new Animated.Value(1)).current;
    const titleScaleAnim = React.useRef(new Animated.Value(1)).current;
    const isSelected = selectedMission === item.id;

    const handlePressIn = () => {
      Animated.parallel([
        Animated.spring(iconScaleAnim, {
          toValue: 0.25,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.spring(titleScaleAnim, {
          toValue: 0.25,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    };

    const handlePressOut = () => {
      Animated.parallel([
        Animated.spring(iconScaleAnim, {
          toValue: 1,
          friction: 3,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.spring(titleScaleAnim, {
          toValue: 1,
          friction: 3,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    };

    const getShortTitle = (title) => {
      const words = title.split(' ');
      if (words.length <= 2) return title;
      return words.slice(0, 2).join(' ');
    };

    return (
      <TouchableOpacity
        onPress={() => handleMissionPress(item)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <View style={styles.compactCard}>
          <Animated.View 
            style={[
              styles.compactIcon, 
              { 
                backgroundColor: item.bgColor,
                transform: [{ scale: iconScaleAnim }]
              }
            ]}
          >
            <Ionicons
              name={item.icon}
              size={isSmallDevice ? 22 : 26}
              color={item.color}
            />
          </Animated.View>
          <View style={styles.textContainer}>
            <Animated.Text 
              style={[
                styles.compactTitle,
                { transform: [{ scale: titleScaleAnim }] }
              ]}
            >
              {getShortTitle(item.title)}
            </Animated.Text>
            <View style={[styles.compactLine, { backgroundColor: item.color }]} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <>
      <Header title="Missions" showBack onBackPress={() => navigation.goBack()} />
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* Mission Header */}
        <View style={styles.headerSection}>
          <View style={styles.iconContainer}>
            <Ionicons name="rocket-outline" size={isSmallDevice ? 40 : 50} color="#00796B" />
          </View>
          <Text style={styles.mainTitle}>Notre Mission</Text>
          <Text style={styles.mainDescription}>
            La plateforme de tutorat de l'INSTA a pour mission d'offrir un accompagnement
            pédagogique personnalisé aux étudiants, favorisant la réussite académique
            et l'entraide entre pairs.
          </Text>
        </View>

        {/* Compact Mission Cards - 6 missions en 2 rangées */}
        <View style={styles.compactMissionsContainer}>
          <CompactMissionCard item={missionData[0]} index={0} />
          <CompactMissionCard item={missionData[1]} index={1} />
          <CompactMissionCard item={missionData[2]} index={2} />
        </View>
        <View style={styles.compactMissionsContainer}>
          <CompactMissionCard item={missionData[3]} index={3} />
          <CompactMissionCard item={missionData[4]} index={4} />
          <CompactMissionCard item={missionData[5]} index={5} />
        </View>

        {/* Selected Mission Details */}
        {selectedMission && (
          <View style={styles.detailsSection}>
            {missionData.filter(item => item.id === selectedMission).map(item => (
              <View key={item.id} style={styles.detailsCard}>
                <View style={[styles.detailsIcon, { backgroundColor: item.bgColor }]}>
                  <Ionicons name={item.icon} size={30} color={item.color} />
                </View>
                <Text style={styles.detailsTitle}>{item.title}</Text>
                <Text style={styles.detailsDescription}>{item.description}</Text>
                <View style={styles.detailsDivider} />
                <Text style={styles.detailsLabel}>Détails:</Text>
                <Text style={styles.detailsText}>{item.details}</Text>
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={() => setSelectedMission(null)}
                >
                  <Ionicons name="close-outline" size={20} color="#fff" />
                  <Text style={styles.closeButtonText}>Fermer</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Values Section */}
        <View style={styles.valuesSection}>
          <Text style={styles.sectionTitle}>Nos Valeurs</Text>
          <View style={styles.valuesGrid}>
            <View style={styles.valueItem}>
              <View style={[styles.valueIcon, { backgroundColor: "#E8F5E9" }]}>
                <Ionicons name="shield-checkmark-outline" size={24} color="#2E7D32" />
              </View>
              <Text style={styles.valueTitle}>Excellence</Text>
              <Text style={styles.valueText}>Recherche constante de la qualité</Text>
            </View>
            <View style={styles.valueItem}>
              <View style={[styles.valueIcon, { backgroundColor: "#E3F2FD" }]}>
                <Ionicons name="handshake-outline" size={24} color="#1565C0" />
              </View>
              <Text style={styles.valueTitle}>Collaboration</Text>
              <Text style={styles.valueText}>Travail ensemble pour réussir</Text>
            </View>
            <View style={styles.valueItem}>
              <View style={[styles.valueIcon, { backgroundColor: "#FFF3E0" }]}>
                <Ionicons name="bulb-outline" size={24} color="#EF6C00" />
              </View>
              <Text style={styles.valueTitle}>Innovation</Text>
              <Text style={styles.valueText}>Approches pédagogiques modernes</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  contentContainer: {
    paddingBottom: 30,
  },
  headerSection: {
    backgroundColor: '#FFFFFF',
    margin: 15,
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  iconContainer: {
    width: isSmallDevice ? 70 : 80,
    height: isSmallDevice ? 70 : 80,
    borderRadius: isSmallDevice ? 35 : 40,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  mainTitle: {
    fontSize: isSmallDevice ? 24 : 28,
    fontWeight: 'bold',
    color: '#00796B',
    marginBottom: 10,
    textAlign: 'center',
  },
  mainDescription: {
    fontSize: isSmallDevice ? 14 : 16,
    lineHeight: isSmallDevice ? 22 : 24,
    color: '#475569',
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  missionsGrid: {
    padding: 15,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  missionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    width: isSmallDevice ? '48%' : '31%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardIcon: {
    width: isSmallDevice ? 50 : 60,
    height: isSmallDevice ? 50 : 60,
    borderRadius: isSmallDevice ? 25 : 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: isSmallDevice ? 14 : 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
    textAlign: 'center',
  },
  cardDescription: {
    fontSize: isSmallDevice ? 11 : 12,
    lineHeight: isSmallDevice ? 16 : 18,
    color: '#64748b',
    textAlign: 'center',
  },
  valuesSection: {
    backgroundColor: '#FFFFFF',
    margin: 15,
    borderRadius: 20,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: isSmallDevice ? 20 : 24,
    fontWeight: 'bold',
    color: '#00796B',
    marginBottom: 20,
    textAlign: 'center',
  },
  valuesGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-start',
  },
  valueItem: {
    alignItems: 'center',
    width: isSmallDevice ? 90 : 100,
  },
  valueIcon: {
    width: isSmallDevice ? 45 : 50,
    height: isSmallDevice ? 45 : 50,
    borderRadius: isSmallDevice ? 22.5 : 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  valueTitle: {
    fontSize: isSmallDevice ? 12 : 14,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 5,
    textAlign: 'center',
  },
  valueText: {
    fontSize: isSmallDevice ? 10 : 11,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 14,
  },
  compactMissionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 10,
    marginVertical: 20,
  },
  compactCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
    width: isSmallDevice ? 115 : 125,
    height: isSmallDevice ? 85 : 95,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    position: 'relative',
  },
  compactIcon: {
    width: isSmallDevice ? 32 : 38,
    height: isSmallDevice ? 32 : 38,
    borderRadius: isSmallDevice ? 16 : 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  compactTitle: {
    fontSize: isSmallDevice ? 10 : 11,
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'left',
    lineHeight: isSmallDevice ? 12 : 14,
    marginBottom: 4,
  },
  compactLine: {
    height: 2,
    width: '100%',
    borderRadius: 1,
    opacity: 0.7,
  },
  detailsSection: {
    margin: 15,
    marginTop: 0,
  },
  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 2,
    borderColor: '#00796B',
  },
  detailsIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  detailsTitle: {
    fontSize: isSmallDevice ? 20 : 24,
    fontWeight: 'bold',
    color: '#00796B',
    marginBottom: 10,
    textAlign: 'center',
  },
  detailsDescription: {
    fontSize: isSmallDevice ? 14 : 16,
    lineHeight: isSmallDevice ? 20 : 22,
    color: '#475569',
    textAlign: 'center',
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  detailsDivider: {
    width: '80%',
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 15,
  },
  detailsLabel: {
    fontSize: isSmallDevice ? 14 : 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
    textAlign: 'center',
  },
  detailsText: {
    fontSize: isSmallDevice ? 13 : 15,
    lineHeight: isSmallDevice ? 18 : 20,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 15,
  },
  closeButton: {
    backgroundColor: '#00796B',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: isSmallDevice ? 12 : 14,
    marginLeft: 5,
  },
});

export default MissionsScreen;