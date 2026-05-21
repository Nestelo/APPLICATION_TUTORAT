import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Button from '../ui/Button';
import { envoyerEmail, envoyerEmailDirect } from '../../api/emailService';

const SendMessageModal = ({ visible, onClose, recipient, onSendSuccess }) => {
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!subject.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un sujet');
      return;
    }

    if (!content.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un message');
      return;
    }

    setLoading(true);
    try {
      // Étape 1: Créer le message en base de données
      const createResult = await envoyerEmail(recipient.id, subject, content);
      
      if (createResult.success || createResult.id) {
        const messageId = createResult.id || createResult.data?.id;
        
        if (messageId) {
          // Étape 2: Envoyer réellement l'email via SMTP
          const sendResult = await envoyerEmailDirect(messageId);
          
          if (sendResult.success) {
            Alert.alert('✅ Succès', `Message envoyé avec succès à ${recipient.prenom} ${recipient.nom}`);
            setSubject('');
            setContent('');
            onClose();
            if (onSendSuccess) {
              onSendSuccess();
            }
          } else {
            Alert.alert('⚠️ Attention', 'Le message a été créé mais l\'envoi par email a échoué. Il sera envoyé automatiquement.');
            setSubject('');
            setContent('');
            onClose();
            if (onSendSuccess) {
              onSendSuccess();
            }
          }
        } else {
          Alert.alert('Erreur', 'Impossible de récupérer l\'ID du message créé');
        }
      } else {
        Alert.alert('Erreur', 'Impossible de créer le message');
      }
    } catch (error) {
      console.error('Erreur envoi message:', error);
      Alert.alert('Erreur', 'Impossible d\'envoyer le message');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={28} color="#333" />
          </TouchableOpacity>
          <Text style={styles.title}>Envoyer un message</Text>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView style={styles.content}>
          {recipient && (
            <View style={styles.recipientSection}>
              <Text style={styles.label}>À:</Text>
              <View style={styles.recipientBox}>
                <Text style={styles.recipientName}>
                  {recipient.prenom} {recipient.nom}
                </Text>
                <Text style={styles.recipientEmail}>{recipient.email}</Text>
              </View>
            </View>
          )}

          <View style={styles.inputSection}>
            <Text style={styles.label}>Sujet</Text>
            <TextInput
              style={styles.subjectInput}
              placeholder="Entrez le sujet du message..."
              placeholderTextColor="#999"
              value={subject}
              onChangeText={setSubject}
              editable={!loading}
            />
          </View>

          <View style={styles.inputSection}>
            <Text style={styles.label}>Message</Text>
            <TextInput
              style={[styles.contentInput]}
              placeholder="Entrez votre message..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={10}
              value={content}
              onChangeText={setContent}
              textAlignVertical="top"
              editable={!loading}
            />
          </View>

          <View style={styles.charCount}>
            <Text style={styles.charCountText}>
              {content.length} caractères
            </Text>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Button
            text={loading ? 'Envoi en cours...' : 'Envoyer'}
            onPress={handleSend}
            disabled={loading}
          />
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onClose}
            disabled={loading}
          >
            <Text style={styles.cancelText}>Annuler</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  recipientSection: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  recipientBox: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#3498db',
  },
  recipientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  recipientEmail: {
    fontSize: 14,
    color: '#666',
  },
  inputSection: {
    marginBottom: 16,
  },
  subjectInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
  },
  contentInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
    minHeight: 200,
  },
  charCount: {
    alignItems: 'flex-end',
    marginTop: 8,
    marginBottom: 24,
  },
  charCountText: {
    fontSize: 12,
    color: '#999',
  },
  footer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  cancelText: {
    fontSize: 16,
    color: '#666',
  },
});

export default SendMessageModal;
