import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Header from '../../components/ui/Header';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import {
  getSystemSettings,
  updateSystemSettings,
  clearCache,
  exportData,
  importData,
  cleanupDatabase,
  getSystemInfo,
} from '../../api/userService';

const SettingsScreen = ({ navigation }) => {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    autoBackup: true,
    maintenanceMode: false,
    allowRegistration: true,
    requireEmailVerification: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [systemInfo, setSystemInfo] = useState(null);

  useEffect(() => {
    loadSettings();
    loadSystemInfo();
  }, []);

  const loadSettings = async () => {
    try {
      const result = await getSystemSettings();
      if (result.success) {
        setSettings({
          emailNotifications: result.data.email_notifications,
          pushNotifications: result.data.push_notifications,
          autoBackup: result.data.auto_backup,
          maintenanceMode: result.data.maintenance_mode,
          allowRegistration: result.data.allow_registration,
          requireEmailVerification: result.data.require_email_verification,
        });
      } else {
        Alert.alert('Erreur', 'Impossible de charger les paramètres');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const loadSystemInfo = async () => {
    try {
      const result = await getSystemInfo();
      if (result.success) {
        setSystemInfo(result.data);
      }
    } catch (error) {
      console.error('Erreur chargement info système:', error);
    }
  };

  const toggleSetting = (key) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    setSettings(newSettings);
    // Sauvegarde automatique
    saveSettings(newSettings);
  };

  const saveSettings = async (settingsToSave = settings) => {
    setSaving(true);
    try {
      const result = await updateSystemSettings({
        email_notifications: settingsToSave.emailNotifications,
        push_notifications: settingsToSave.pushNotifications,
        auto_backup: settingsToSave.autoBackup,
        maintenance_mode: settingsToSave.maintenanceMode,
        allow_registration: settingsToSave.allowRegistration,
        require_email_verification: settingsToSave.requireEmailVerification,
      });

      if (result.success) {
        // Recharger les infos système après sauvegarde
        loadSystemInfo();
      } else {
        Alert.alert('Erreur', result.error || 'Erreur lors de la sauvegarde');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Erreur de connexion');
    } finally {
      setSaving(false);
    }
  };

  const renderSettingItem = (title, subtitle, key) => (
    <View style={styles.settingItem}>
      <View style={styles.settingText}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingSubtitle}>{subtitle}</Text>
      </View>
      <Switch
        value={settings[key]}
        onValueChange={() => toggleSetting(key)}
        trackColor={{ false: '#767577', true: '#3498db' }}
        thumbColor={settings[key] ? '#fff' : '#f4f3f4'}
      />
    </View>
  );

  return (
    <>
      <Header title="Paramètres" showBack />
      <ScrollView style={styles.container}>
        {saving && (
          <View style={styles.savingIndicator}>
            <ActivityIndicator size="small" color="#007AFF" />
            <Text style={styles.savingText}>Sauvegarde en cours...</Text>
          </View>
        )}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>🔔 Notifications</Text>
          {renderSettingItem(
            'Notifications email',
            'Envoyer les notifications par email',
            'emailNotifications'
          )}
          {renderSettingItem(
            'Notifications push',
            'Activer les notifications push',
            'pushNotifications'
          )}
        </Card>

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>💾 Sauvegarde</Text>
          {renderSettingItem(
            'Sauvegarde automatique',
            'Sauvegarder les données automatiquement',
            'autoBackup'
          )}
        </Card>

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>🔐 Sécurité</Text>
          {renderSettingItem(
            'Mode maintenance',
            'Désactiver temporairement l\'accès',
            'maintenanceMode'
          )}
          {renderSettingItem(
            'Autoriser les inscriptions',
            'Permettre aux nouveaux utilisateurs de s\'inscrire',
            'allowRegistration'
          )}
          {renderSettingItem(
            'Vérification email requise',
            'Les utilisateurs doivent vérifier leur email',
            'requireEmailVerification'
          )}
        </Card>

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>⚙️ Actions système</Text>
          <Button
            title="🔄 Vider le cache"
            variant="outline"
            onPress={async () => {
              try {
                const result = await clearCache();
                if (result.success) {
                  Alert.alert('Succès', 'Cache vidé avec succès');
                } else {
                  Alert.alert('Erreur', result.error);
                }
              } catch (error) {
                Alert.alert('Erreur', 'Erreur lors du vidage du cache');
              }
            }}
            style={styles.actionButton}
          />
          <Button
            title="📤 Exporter les données"
            variant="outline"
            onPress={async () => {
              try {
                const result = await exportData();
                if (result.success) {
                  Alert.alert('Succès', 'Données exportées avec succès');
                } else {
                  Alert.alert('Erreur', result.error);
                }
              } catch (error) {
                Alert.alert('Erreur', 'Erreur lors de l\'export');
              }
            }}
            style={styles.actionButton}
          />
          <Button
            title="📥 Importer les données"
            variant="outline"
            onPress={async () => {
              try {
                const result = await importData();
                if (result.success) {
                  Alert.alert('Info', result.data.message);
                } else {
                  Alert.alert('Erreur', result.error);
                }
              } catch (error) {
                Alert.alert('Erreur', 'Erreur lors de l\'import');
              }
            }}
            style={styles.actionButton}
          />
          <Button
            title="🗑️ Nettoyer la base de données"
            variant="outline"
            onPress={async () => {
              Alert.alert(
                'Confirmation',
                'Cette action va supprimer des données obsolètes. Continuer ?',
                [
                  { text: 'Annuler', style: 'cancel' },
                  {
                    text: 'Confirmer',
                    onPress: async () => {
                      try {
                        const result = await cleanupDatabase();
                        if (result.success) {
                          Alert.alert('Succès', 'Base de données nettoyée avec succès');
                        } else {
                          Alert.alert('Erreur', result.error);
                        }
                      } catch (error) {
                        Alert.alert('Erreur', 'Erreur lors du nettoyage');
                      }
                    }
                  }
                ]
              );
            }}
            style={styles.actionButton}
          />
        </Card>

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>ℹ️ Informations système</Text>
          {loading ? (
            <ActivityIndicator size="large" color="#007AFF" />
          ) : (
            <>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Version de l'application:</Text>
                <Text style={styles.infoValue}>1.0.0</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Version de la base de données:</Text>
                <Text style={styles.infoValue}>v2.1.0</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Dernière sauvegarde:</Text>
                <Text style={styles.infoValue}>
                  {systemInfo?.timestamp ? new Date(systemInfo.timestamp).toLocaleString('fr-FR') : 'N/A'}
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Mémoire utilisée:</Text>
                <Text style={styles.infoValue}>
                  {systemInfo?.system?.memory_used || 'N/A'}
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Espace disque:</Text>
                <Text style={styles.infoValue}>
                  {systemInfo?.system?.disk_used ? `${systemInfo.system.disk_used} / ${systemInfo.system.disk_total}` : 'N/A'}
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Python:</Text>
                <Text style={styles.infoValue}>
                  {systemInfo?.system?.python_version || 'N/A'}
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Plateforme:</Text>
                <Text style={styles.infoValue}>
                  {systemInfo?.system?.platform || 'N/A'}
                </Text>
              </View>
            </>
          )}
        </Card>
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  savingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e3f2fd',
    padding: 10,
    margin: 16,
    borderRadius: 8,
  },
  savingText: {
    marginLeft: 10,
    color: '#007AFF',
    fontSize: 14,
  },
  section: {
    margin: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  actionButton: {
    marginBottom: 8,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
});

export default SettingsScreen;
