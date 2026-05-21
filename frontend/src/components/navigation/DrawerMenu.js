import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';

const DrawerMenu = ({ navigation }) => {
  const { user, logout } = useAuth();

  const menuItems = [
    { label: 'Accueil', icon: 'home-outline', screen: 'Home' },
    { label: 'Profil', icon: 'person-outline', screen: 'Profil' },
    { label: 'Notifications', icon: 'notifications-outline', screen: 'Notifications' },
  ];

  if (user?.role === 'etudiant') {
    menuItems.push(
      { label: 'Rechercher un tuteur', icon: 'search-outline', screen: 'RechercheTuteurs' },
      { label: 'Mes groupes', icon: 'people-outline', screen: 'MesGroupes' },
      { label: 'Mes favoris', icon: 'heart-outline', screen: 'MesFavoris' }
    );
  } else if (user?.role === 'tuteur' || user?.role === 'enseignant') {
    menuItems.push(
      { label: 'Gérer mes offres', icon: 'briefcase-outline', screen: 'GestionOffres' },
      { label: 'Mes groupes', icon: 'people-outline', screen: 'GestionGroupes' },
      { label: 'Mes élèves', icon: 'school-outline', screen: 'MesEleves' },
      { label: 'Disponibilités', icon: 'time-outline', screen: 'Disponibilites' }
    );
  } else if (user?.role === 'admin') {
    menuItems.push(
      { label: 'Utilisateurs', icon: 'people-outline', screen: 'GestionUtilisateurs' },
      { label: 'Ressources', icon: 'document-text-outline', screen: 'GestionRessources' },
      { label: 'Tutorat', icon: 'calendar-outline', screen: 'GestionTutorat' },
      { label: 'Signalements', icon: 'alert-circle-outline', screen: 'Moderation' },
      { label: 'Rapports', icon: 'bar-chart-outline', screen: 'Rapports' }
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="person-circle" size={60} color="#007bff" />
        <Text style={styles.userName}>{user?.prenom} {user?.nom}</Text>
        <Text style={styles.userRole}>{user?.role}</Text>
      </View>
      <View style={styles.menu}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.menuItem}
            onPress={() => navigation.navigate(item.screen)}
          >
            <Ionicons name={item.icon} size={24} color="#333" />
            <Text style={styles.menuLabel}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Ionicons name="log-out-outline" size={24} color="#dc3545" />
        <Text style={styles.logoutText}>Déconnexion</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 8,
  },
  userRole: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  menu: {
    flex: 1,
    paddingVertical: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  menuLabel: {
    fontSize: 16,
    marginLeft: 16,
    color: '#333',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  logoutText: {
    fontSize: 16,
    marginLeft: 16,
    color: '#dc3545',
  },
});

export default DrawerMenu;