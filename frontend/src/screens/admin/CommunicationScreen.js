import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, Picker, Text } from 'react-native';
import Header from '../../components/ui/Header';
import CustomInput from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { createAnnouncement } from '../../api/adminService';

const CommunicationScreen = ({ navigation }) => {
  const [titre, setTitre] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState('autre');
  const [audienceType, setAudienceType] = useState('all');
  const [audienceFilter, setAudienceFilter] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');

  const handleSend = async () => {
    if (!titre) {
      Alert.alert('Erreur', 'Le titre est requis');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        titre,
        message,
        type,
        audience_type: audienceType,
        audience_filter: audienceFilter ? JSON.parse(audienceFilter) : null,
        scheduled_at: scheduledAt || null,
        send_now: !scheduledAt,
      };
      await createAnnouncement(payload);
      Alert.alert('Succès', 'Annonce créée et envoyée (ou programmée)');
      navigation.goBack();
    } catch (error) {
      console.error(error);
      Alert.alert('Erreur', "Impossible d'envoyer l'annonce");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header title="Communication" showBack onBackPress={() => navigation.goBack()} />
      <ScrollView style={styles.container}>
        <Card>
          <CustomInput label="Titre" value={titre} onChangeText={setTitre} />
          <CustomInput label="Message" value={message} onChangeText={setMessage} multiline numberOfLines={5} />

          <View style={{ marginBottom: 12 }}>
            <Text style={styles.label}>Type</Text>
            <Picker selectedValue={type} onValueChange={(v) => setType(v)}>
              <Picker.Item label="Demande séance" value="demande_seance" />
              <Picker.Item label="Message" value="message" />
              <Picker.Item label="Validation ressource" value="validation_ressource" />
              <Picker.Item label="Réponse forum" value="reponse_forum" />
              <Picker.Item label="Autre" value="autre" />
            </Picker>
          </View>

          <View style={{ marginBottom: 12 }}>
            <Text style={styles.label}>Audience</Text>
            <Picker selectedValue={audienceType} onValueChange={(v) => setAudienceType(v)}>
              <Picker.Item label="Tous" value="all" />
              <Picker.Item label="Rôle (ex: tuteur, etudiant)" value="role" />
              <Picker.Item label="Utilisateurs (ids JSON)" value="users" />
              <Picker.Item label="Filtre (JSON)" value="filter" />
            </Picker>
          </View>

          <CustomInput
            label="Audience filter (JSON)"
            value={audienceFilter}
            onChangeText={setAudienceFilter}
            placeholder='Ex: {"role":"tuteur"} ou {"user_ids":[1,2,3]}'
          />

          <CustomInput label="Scheduled at (ISO)" value={scheduledAt} onChangeText={setScheduledAt} placeholder="YYYY-MM-DDThh:mm:ss (optionnel)" />

          <Button title={loading ? 'Envoi...' : "Envoyer / Programmer"} onPress={handleSend} loading={loading} style={styles.button} />
        </Card>
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  button: {
    marginTop: 20,
  },
});

export default CommunicationScreen;