import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Dimensions,
  Animated,
  Linking,
} from 'react-native';
import Header from '../../components/ui/Header';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get("window");
const isSmallDevice = width < 380;

const NousContacterScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    message: ''
  });
  
  const [messages, setMessages] = useState([]);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.9));

  useEffect(() => {
    loadMessages();
    
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

  const loadMessages = async () => {
    try {
      const storedMessages = await AsyncStorage.getItem('contactMessages');
      if (storedMessages) {
        setMessages(JSON.parse(storedMessages));
      }
    } catch (error) {
      console.log('Erreur chargement messages:', error);
    }
  };

  const saveMessages = async (newMessages) => {
    try {
      await AsyncStorage.setItem('contactMessages', JSON.stringify(newMessages));
    } catch (error) {
      console.log('Erreur sauvegarde messages:', error);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = () => {
    if (!formData.nom || !formData.prenom || !formData.email || !formData.message) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Alert.alert('Erreur', 'Veuillez entrer une adresse email valide');
      return;
    }

    const newMessage = {
      id: Date.now(),
      nom: formData.nom,
      prenom: formData.prenom,
      email: formData.email,
      message: formData.message,
      date: new Date().toLocaleString('fr-FR')
    };

    const updatedMessages = [newMessage, ...messages];
    setMessages(updatedMessages);
    saveMessages(updatedMessages);

    setFormData({
      nom: '',
      prenom: '',
      email: '',
      message: ''
    });

    Alert.alert('Succès', 'Votre message a été envoyé avec succès!');
  };

  const openWhatsApp = () => {
    const phoneNumber = '+23561357549';
    const url = `whatsapp://send?phone=${phoneNumber}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Erreur', 'WhatsApp n\'est pas installé sur votre appareil');
    });
  };

  const ContactInfoCard = ({ icon, title, value, color }) => (
    <Animated.View
      style={[
        styles.contactCard,
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
      <View style={[styles.contactIcon, { backgroundColor: color }]}>
        <Ionicons name={icon} size={isSmallDevice ? 20 : 24} color="#fff" />
      </View>
      <View style={styles.contactInfo}>
        <Text style={styles.contactTitle}>{title}</Text>
        <Text style={styles.contactValue}>{value}</Text>
      </View>
    </Animated.View>
  );

  return (
    <>
      <Header title="Nous contacter" showBack onBackPress={() => navigation.goBack()} />
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        
        {/* En-tête */}
        <Animated.View
          style={[
            styles.headerSection,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }]
            }
          ]}
        >
          <View style={styles.headerIconContainer}>
            <Ionicons name="business" size={isSmallDevice ? 40 : 50} color="#00796B" />
          </View>
          <Text style={styles.headerTitle}>Département d'Informatique</Text>
          <Text style={styles.headerSubtitle}>Institut National des Sciences Techniques d'Abéché (INSTA)</Text>
        </Animated.View>

        {/* Coordonnées */}
        <View style={styles.contactSection}>
          <Text style={styles.sectionTitle}>Coordonnées</Text>
          
          <ContactInfoCard
            icon="mail-outline"
            title="Email"
            value="ndjerabeernest@gmail.com"
            color="#E53935"
          />
          
          <ContactInfoCard
            icon="call-outline"
            title="Téléphone(s)"
            value="+235 61 35 75 49 / +235 91 35 75 45"
            color="#43A047"
          />
        </View>

        {/* Formulaire de contact */}
        <Animated.View
          style={[
            styles.formSection,
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
          <Text style={styles.sectionTitle}>Formulaire de contact</Text>
          
          <View style={styles.formCard}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nom</Text>
              <TextInput
                style={styles.input}
                value={formData.nom}
                onChangeText={(value) => handleInputChange('nom', value)}
                placeholder="Votre nom"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Prénom</Text>
              <TextInput
                style={styles.input}
                value={formData.prenom}
                onChangeText={(value) => handleInputChange('prenom', value)}
                placeholder="Votre prénom"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={formData.email}
                onChangeText={(value) => handleInputChange('email', value)}
                placeholder="votre@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Votre message</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.message}
                onChangeText={(value) => handleInputChange('message', value)}
                placeholder="Écrivez votre message ici..."
                multiline
                numberOfLines={4}
              />
            </View>

            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
              <Ionicons name="send-outline" size={20} color="#fff" />
              <Text style={styles.submitButtonText}>Envoyer</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Tableau des messages */}
        <Animated.View
          style={[
            styles.messagesSection,
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
          <Text style={styles.sectionTitle}>Messages soumis</Text>
          
          {messages.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="chatbox-outline" size={40} color="#ccc" />
              <Text style={styles.emptyText}>Aucun message pour le moment</Text>
            </View>
          ) : (
            <View style={styles.tableContainer}>
              <View style={styles.tableHeader}>
                <Text style={[styles.headerCell, { flex: 1 }]}>Nom</Text>
                <Text style={[styles.headerCell, { flex: 1 }]}>Prénom</Text>
                <Text style={[styles.headerCell, { flex: 2 }]}>Email</Text>
                <Text style={[styles.headerCell, { flex: 3 }]}>Message</Text>
              </View>
              
              {messages.slice(0, 5).map((message) => (
                <View key={message.id} style={styles.tableRow}>
                  <Text style={[styles.tableCell, { flex: 1 }]}>{message.nom}</Text>
                  <Text style={[styles.tableCell, { flex: 1 }]}>{message.prenom}</Text>
                  <Text style={[styles.tableCell, { flex: 2 }]}>{message.email}</Text>
                  <Text style={[styles.tableCell, { flex: 3 }]} numberOfLines={2}>
                    {message.message}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </Animated.View>

        {/* QR Code Section */}
        <Animated.View
          style={[
            styles.qrSection,
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
          <Text style={styles.sectionTitle}>QR Code WhatsApp</Text>
          
          <TouchableOpacity style={styles.qrCard} onPress={openWhatsApp}>
            <View style={styles.qrPlaceholder}>
              <Ionicons name="logo-whatsapp" size={60} color="#25D366" />
            </View>
            <Text style={styles.qrText}>
              Scannez pour nous contacter sur WhatsApp
            </Text>
            <Text style={styles.qrSubtext}>
              +235 61 35 75 49
            </Text>
          </TouchableOpacity>
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
  headerIconContainer: {
    width: isSmallDevice ? 80 : 100,
    height: isSmallDevice ? 80 : 100,
    borderRadius: isSmallDevice ? 40 : 50,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  headerTitle: {
    fontSize: isSmallDevice ? 20 : 24,
    fontWeight: 'bold',
    color: '#00796B',
    marginBottom: 8,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: isSmallDevice ? 14 : 16,
    color: '#64748b',
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  contactSection: {
    margin: 15,
  },
  sectionTitle: {
    fontSize: isSmallDevice ? 18 : 20,
    fontWeight: 'bold',
    color: '#00796B',
    marginBottom: 15,
  },
  contactCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  contactIcon: {
    width: isSmallDevice ? 40 : 50,
    height: isSmallDevice ? 40 : 50,
    borderRadius: isSmallDevice ? 20 : 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  contactInfo: {
    flex: 1,
  },
  contactTitle: {
    fontSize: isSmallDevice ? 12 : 14,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  contactValue: {
    fontSize: isSmallDevice ? 14 : 16,
    color: '#475569',
    lineHeight: isSmallDevice ? 18 : 20,
  },
  formSection: {
    margin: 15,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: isSmallDevice ? 14 : 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    padding: isSmallDevice ? 12 : 15,
    fontSize: isSmallDevice ? 14 : 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#00796B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: isSmallDevice ? 12 : 15,
    borderRadius: 10,
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: isSmallDevice ? 14 : 16,
    marginLeft: 8,
  },
  messagesSection: {
    margin: 15,
  },
  tableContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#00796B',
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  headerCell: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: isSmallDevice ? 12 : 14,
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  tableCell: {
    fontSize: isSmallDevice ? 11 : 12,
    color: '#475569',
    textAlign: 'center',
    paddingHorizontal: 5,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
  },
  emptyText: {
    fontSize: isSmallDevice ? 14 : 16,
    color: '#64748b',
    marginTop: 10,
  },
  qrSection: {
    margin: 15,
  },
  qrCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  qrPlaceholder: {
    width: isSmallDevice ? 120 : 150,
    height: isSmallDevice ? 120 : 150,
    borderRadius: 10,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  qrText: {
    fontSize: isSmallDevice ? 14 : 16,
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 5,
  },
  qrSubtext: {
    fontSize: isSmallDevice ? 12 : 14,
    color: '#64748b',
    textAlign: 'center',
  },
});

export default NousContacterScreen;
