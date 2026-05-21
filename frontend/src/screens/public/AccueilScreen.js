import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import { getStatsPubliques } from "../../api/statsService";
import { Ionicons } from "@expo/vector-icons"; // Import de Ionicons

const { width } = Dimensions.get("window");
const isSmallDevice = width < 380;

const AccueilScreen = () => {
  const navigation = useNavigation();
  const { user, logout } = useAuth();
  const animationRef = useRef(null);
  const isMounted = useRef(true);

  const [targetStats, setTargetStats] = useState({
    etudiants: 1240,
    tuteurs: 85,
    seances: 3500,
    taux_reussite: 92,
  });

  const [displayStats, setDisplayStats] = useState({
    etudiants: 0,
    tuteurs: 0,
    seances: 0,
    taux_reussite: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getStatsPubliques();
        console.log('Données stats reçues:', JSON.stringify(data, null, 2));
        if (data) {
          setTargetStats({
            etudiants: data.utilisateurs?.etudiants || 1240,
            tuteurs: data.utilisateurs?.tuteurs || 85,
            seances: data.seances?.total || 3500,
            taux_reussite: data.taux_reussite || 92,
          });
        }
      } catch (error) {
        console.log("Erreur chargement statistiques", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  useEffect(() => {
    isMounted.current = true;
    if (loading) return;

    const startTime = Date.now();
    const duration = 2000;
    const targets = targetStats;

    const animate = () => {
      if (!isMounted.current) return;
      const now = Date.now();
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);

      setDisplayStats({
        etudiants: Math.floor(progress * targets.etudiants),
        tuteurs: Math.floor(progress * targets.tuteurs),
        seances: Math.floor(progress * targets.seances),
        taux_reussite: Math.floor(progress * targets.taux_reussite),
      });

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayStats(targets);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      isMounted.current = false;
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [loading, targetStats]);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerCard}>
          <View style={styles.headerContent}>
            <View style={styles.logoContainer}>
              <Image
                source={require("../../../assets/images/logo-insta.png")}
                style={styles.logo}
              />
              <View>
                <Text style={styles.title}>Tutorat INSTA</Text>
                <Text style={styles.subtitle}>Plateforme pédagogique</Text>
              </View>
            </View>
            <View style={styles.authRow}>
              {!user ? (
                <TouchableOpacity
                  style={styles.loginBtn}
                  onPress={() => navigation.navigate("Connexion")}
                >
                  <Text style={styles.loginText}>Connexion</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.logoutBtn}
                  onPress={handleLogout}
                >
                  <Text style={styles.logoutText}>Déconnexion</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* Hero */}
        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>Apprenez et progressez avec</Text>
          <Text style={styles.heroHighlight}>Tutorat INSTA</Text>
          <Text style={styles.description}>
            Connectez étudiants et tuteurs pour réussir ensemble.
            Planifiez vos séances et améliorez vos performances académiques.
          </Text>

          <View style={styles.buttonsRow}>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => navigation.navigate("Inscription")}
            >
              <Ionicons name="person-add-outline" size={16} color="#fff" />
              <Text style={styles.primaryText}>Insc Étudiant</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => navigation.navigate("DevenirTuteur")}
            >
              <Ionicons name="person-outline" size={16} color="#fff" />
              <Text style={styles.primaryText}>Dev Tuteur</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => navigation.navigate("ApercuTutorat")}
            >
              <Ionicons name="book-outline" size={16} color="#fff" />
              <Text style={styles.primaryText}>A Tutorat Rapide</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Statistiques */}
        {loading ? (
          <LoadingSpinner text="Chargement des statistiques..." />
        ) : (
          <View style={styles.statsSection}>
            <View style={styles.statCard}>
              <View style={[styles.iconCircle, { backgroundColor: "#E8F5E9" }]}>
                <Ionicons name="school-outline" size={isSmallDevice ? 24 : 28} color="#2E7D32" />
              </View>
              <Text style={styles.statValue}>{displayStats.etudiants}+</Text>
              <Text style={styles.statLabel}>Étudiants accompagnés</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.iconCircle, { backgroundColor: "#E3F2FD" }]}>
                <Ionicons name="people-outline" size={isSmallDevice ? 24 : 28} color="#1565C0" />
              </View>
              <Text style={styles.statValue}>{displayStats.tuteurs}</Text>
              <Text style={styles.statLabel}>Tuteurs actifs</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.iconCircle, { backgroundColor: "#FFF3E0" }]}>
                <Ionicons name="book-outline" size={isSmallDevice ? 24 : 28} color="#EF6C00" />
              </View>
              <Text style={styles.statValue}>{displayStats.seances}</Text>
              <Text style={styles.statLabel}>Séances réalisées</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.iconCircle, { backgroundColor: "#F3E5F5" }]}>
                <Ionicons name="trophy-outline" size={isSmallDevice ? 24 : 28} color="#6A1B9A" />
              </View>
              <Text style={styles.statValue}>{displayStats.taux_reussite}%</Text>
              <Text style={styles.statLabel}>Taux de réussite</Text>
            </View>
          </View>
        )}

        {/* Horizontal Buttons */}
        <View style={styles.buttonsSection}>
          <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate("Accueil")}>
            <Ionicons name="home-outline" size={24} color="#fff" />
            <Text style={styles.buttonText}>Accueil</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate("Missions")}>
            <Ionicons name="document-text-outline" size={24} color="#fff" />
            <Text style={styles.buttonText}>Missions</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate("APropos")}>
            <Ionicons name="information-circle-outline" size={24} color="#fff" />
            <Text style={styles.buttonText}>À propos</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate("Connexion")}>
            <Ionicons name="log-in-outline" size={24} color="#fff" />
            <Text style={styles.buttonText}>Connexion</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#E0F7FA",
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 20,
  },
  headerCard: {
    backgroundColor: "#00796B",
    marginHorizontal: 10,
    marginTop: 10,
    borderRadius: 15,
    paddingVertical: 10,
    paddingHorizontal: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  logo: {
    width: isSmallDevice ? 35 : 40,
    height: isSmallDevice ? 35 : 40,
    marginRight: 5,
  },
  title: {
    color: "#fff",
    fontSize: isSmallDevice ? 14 : 16,
    fontWeight: "bold",
  },
  subtitle: {
    color: "#B2DFDB",
    fontSize: isSmallDevice ? 10 : 12,
  },
  authRow: {
    flexDirection: "row",
  },
  loginBtn: {
    backgroundColor: "#fff",
    paddingHorizontal: isSmallDevice ? 8 : 10,
    paddingVertical: isSmallDevice ? 4 : 6,
    borderRadius: 20,
  },
  loginText: {
    color: "#00796B",
    fontWeight: "bold",
    fontSize: isSmallDevice ? 10 : 12,
  },
  logoutBtn: {
    backgroundColor: "#ff4d4d",
    paddingHorizontal: isSmallDevice ? 8 : 10,
    paddingVertical: isSmallDevice ? 4 : 6,
    borderRadius: 20,
  },
  logoutText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: isSmallDevice ? 10 : 12,
  },
  heroCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 10,
    marginTop: 15,
    borderRadius: 15,
    paddingVertical: isSmallDevice ? 15 : 20,
    paddingHorizontal: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    alignItems: "center",
  },
  heroTitle: {
    fontSize: isSmallDevice ? 18 : 22,
    color: "#1e293b",
    fontWeight: "600",
    textAlign: "center",
  },
  heroHighlight: {
    fontSize: isSmallDevice ? 24 : 32,
    fontWeight: "bold",
    color: "#00796B",
    marginVertical: 8,
    textAlign: "center",
  },
  description: {
    textAlign: "center",
    fontSize: isSmallDevice ? 12 : 14,
    color: "#475569",
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  buttonsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    width: "100%",
    flexWrap: "wrap",
  },
  primaryBtn: {
    backgroundColor: "#FFC107",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: isSmallDevice ? 6 : 8,
    paddingHorizontal: 10,
    borderRadius: 25,
    margin: 5,
    minWidth: isSmallDevice ? 80 : 90,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  primaryText: {
    fontWeight: "bold",
    textAlign: "center",
    fontSize: isSmallDevice ? 10 : 12,
    marginLeft: 5, // Ajout d'un espacement à gauche
  },
  statsSection: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
    paddingVertical: 20,
    paddingHorizontal: 5,
  },
  statCard: {
    backgroundColor: "#FFFFFF",
    padding: isSmallDevice ? 10 : 12,
    borderRadius: 15,
    alignItems: "center",
    margin: 5,
    width: isSmallDevice ? "45%" : "22%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  iconCircle: {
    width: isSmallDevice ? 40 : 45,
    height: isSmallDevice ? 40 : 45,
    borderRadius: isSmallDevice ? 20 : 22.5,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  statValue: {
    fontSize: isSmallDevice ? 18 : 24,
    fontWeight: "bold",
    color: "#00796B",
  },
  statLabel: {
    fontSize: isSmallDevice ? 10 : 12,
    color: "#64748b",
    textAlign: "center",
    marginTop: 4,
  },
  buttonsSection: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 20,
  },
  iconButton: {
    backgroundColor: "#00796B",
    flexDirection: "column",
    alignItems: "center",
    padding: 10,
    borderRadius: 10,
    width: isSmallDevice ? 70 : 80,
  },
  buttonText: {
    color: "#fff",
    fontSize: isSmallDevice ? 10 : 12,
    marginTop: 4,
  },
});

export default AccueilScreen;