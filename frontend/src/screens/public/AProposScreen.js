import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Dimensions } from 'react-native';
import Header from '../../components/ui/Header';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg'; // Changement d'import

const { width } = Dimensions.get("window");
const isSmallDevice = width < 380;

const AProposScreen = ({ navigation }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    console.log('AProposScreen - Navigation props:', navigation);
    console.log('AProposScreen - Available navigate methods:', Object.keys(navigation));
    
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Le reste du code reste identique, sauf la partie QRCode

  const FeatureCard = ({ icon, title, description, color, bgColor, index }) => {
    const cardScaleAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
      Animated.spring(cardScaleAnim, {
        toValue: 0.95,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }).start();
    };

    const handlePressOut = () => {
      Animated.spring(cardScaleAnim, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }).start();
    };

    return (
      <Animated.View
        style={[
          styles.featureCard,
          {
            backgroundColor: bgColor,
            transform: [
              { scale: cardScaleAnim },
              { translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [50, 0],
              }) }
            ],
            opacity: fadeAnim,
          }
        ]}
      >
        <TouchableOpacity
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={styles.cardTouchable}
        >
          <View style={[styles.featureIcon, { backgroundColor: color }]}>
            <Ionicons name={icon} size={isSmallDevice ? 24 : 28} color="#fff" />
          </View>
          <Text style={styles.featureTitle}>{title}</Text>
          <Text style={styles.featureDescription}>{description}</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <>
      <Header title="À propos" showBack onBackPress={() => navigation.goBack()} />
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* Header avec icône principale */}
        <Animated.View
          style={[
            styles.headerSection,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }]
            }
          ]}
        >
          <View style={styles.mainIconContainer}>
            <Ionicons name="rocket-outline" size={isSmallDevice ? 50 : 60} color="#00796B" />
          </View>
          <Text style={styles.mainTitle}>Tutorat INSTA</Text>
          <Text style={styles.subtitle}>Plateforme d'apprentissage collaborative</Text>
        </Animated.View>

        {/* Cartes de fonctionnalités */}
        <View style={styles.featuresGrid}>
          <FeatureCard
            icon="school-outline"
            title="Projet Académique"
            description="Développée dans le cadre d'un projet de fin d'études à l'INSTA"
            color="#2E7D32"
            bgColor="#E8F5E9"
            index={0}
          />
          <FeatureCard
            icon="people-outline"
            title="Communauté Dynamique"
            description="Crée une communauté où étudiants et tuteurs peuvent échanger et apprendre"
            color="#1565C0"
            bgColor="#E3F2FD"
            index={1}
          />
          <FeatureCard
            icon="book-outline"
            title="Partage de Ressources"
            description="Permet de partager des ressources et d'organiser des séances de tutorat"
            color="#EF6C00"
            bgColor="#FFF3E0"
            index={2}
          />
        </View>

        {/* Section Commission du Tutorat */}
        <Animated.View
          style={[
            styles.commissionSection,
            {
              opacity: fadeAnim,
              transform: [
                { translateY: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [30, 0],
                }) }
              ]
            }
          ]}
        >
          {/* Informations de contact */}
          <View style={styles.contactInfoSection}>
            <Text style={styles.contactTitle}>Contactez-nous</Text>
            
            <View style={styles.contactInfoCard}>
              <Ionicons name="mail-outline" size={20} color="#E53935" />
              <Text style={styles.contactInfoText}>ndjerabeernest@gmail.com</Text>
            </View>
            
            <View style={styles.contactInfoCard}>
              <Ionicons name="call-outline" size={20} color="#43A047" />
              <Text style={styles.contactInfoText}>+235 61 35 75 49 / +235 91 35 75 45</Text>
            </View>
            
            <View style={styles.contactInfoCard}>
              <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
              <Text style={styles.contactInfoText}>WhatsApp: +235 61 35 75 49</Text>
            </View>
            
            {/* Code QR avec informations du développeur */}
            <View style={styles.qrCodeSection}>
              <Text style={styles.qrCodeTitle}>Informations du Développeur</Text>
              <View style={styles.qrCodeContainer}>
                <QRCode
                  value="L'APPLICATION DE TUTORAT EST DEVELOPPE PAR : ING DJERABE ERNEST (ETUDIANT EN GENIE INFORMATIQUE DE L'INSTA)"
                  size={isSmallDevice ? 120 : 150}
                  color="#000000"
                  backgroundColor="#FFFFFF"
                />
              </View>
              <Text style={styles.qrCodeDescription}>
                Scannez ce code QR pour obtenir les informations complètes sur le développeur.
              </Text>
            </View>
          </View>
        </Animated.View>
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
  mainIconContainer: {
    width: isSmallDevice ? 80 : 100,
    height: isSmallDevice ? 80 : 100,
    borderRadius: isSmallDevice ? 40 : 50,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  mainTitle: {
    fontSize: isSmallDevice ? 24 : 28,
    fontWeight: 'bold',
    color: '#00796B',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: isSmallDevice ? 14 : 16,
    color: '#64748b',
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  featuresGrid: {
    padding: 15,
    gap: 15,
  },
  featureCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTouchable: {
    width: '100%',
  },
  featureIcon: {
    width: isSmallDevice ? 50 : 60,
    height: isSmallDevice ? 50 : 60,
    borderRadius: isSmallDevice ? 25 : 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: isSmallDevice ? 16 : 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
    textAlign: 'center',
  },
  featureDescription: {
    fontSize: isSmallDevice ? 12 : 14,
    lineHeight: isSmallDevice ? 18 : 20,
    color: '#64748b',
    textAlign: 'center',
  },
  objectivesSection: {
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
  objectiveItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 10,
  },
  objectiveText: {
    fontSize: isSmallDevice ? 14 : 16,
    color: '#475569',
    marginLeft: 12,
    flex: 1,
    lineHeight: isSmallDevice ? 20 : 22,
  },
  commissionSection: {
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
  commissionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 15,
    padding: 20,
    marginTop: 10,
  },
  commissionText: {
    fontSize: isSmallDevice ? 14 : 16,
    color: '#475569',
    marginLeft: 15,
    flex: 1,
    lineHeight: isSmallDevice ? 20 : 22,
    textAlign: 'center',
  },
  contactInfoSection: {
    marginTop: 20,
    padding: 20,
    backgroundColor: '#F8F9FA',
    borderRadius: 15,
  },
  contactTitle: {
    fontSize: isSmallDevice ? 18 : 20,
    fontWeight: 'bold',
    color: '#00796B',
    marginBottom: 15,
    textAlign: 'center',
  },
  contactInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  contactInfoText: {
    fontSize: isSmallDevice ? 12 : 14,
    color: '#475569',
    marginLeft: 12,
    flex: 1,
  },
  qrCodeSection: {
    marginTop: 25,
    padding: 20,
    backgroundColor: '#F8F9FA',
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  qrCodeTitle: {
    fontSize: isSmallDevice ? 16 : 18,
    fontWeight: 'bold',
    color: '#00796B',
    marginBottom: 15,
    textAlign: 'center',
  },
  qrCodeContainer: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 15,
  },
  qrCodeDescription: {
    fontSize: isSmallDevice ? 11 : 12,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: isSmallDevice ? 16 : 18,
    paddingHorizontal: 10,
  },
});

export default AProposScreen;