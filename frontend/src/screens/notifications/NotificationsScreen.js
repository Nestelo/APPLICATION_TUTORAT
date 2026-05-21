import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Header from '../../components/ui/Header';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { Ionicons } from '@expo/vector-icons';
import { 
  getNotifications, 
  markAsRead, 
  markAllAsRead, 
  deleteNotification 
} from '../../api/notificationService';

const NotificationsScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('toutes');
  const [error, setError] = useState(null);

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      let params = {};
      if (filter === 'non_lues') {
        params.est_lue = false;
      } else if (filter === 'lues') {
        params.est_lue = true;
      }
      
      console.log('🔍 Chargement notifications avec filtre:', filter, params);
      
      const result = await getNotifications(params);
      
      if (result.success) {
        console.log('✅ Notifications reçues:', result.data?.length || 0);
        setNotifications(result.data || []);
      } else {
        console.error('❌ Erreur API:', result.error);
        setError(result.error);
        setNotifications([]);
      }
    } catch (error) {
      console.error('❌ Erreur chargement notifications:', error);
      setError(error.message);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, [loadNotifications])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      const result = await markAsRead(notificationId);
      if (result.success) {
        loadNotifications();
      }
    } catch (error) {
      console.error('Erreur marquer comme lue:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const result = await markAllAsRead();
      if (result.success) {
        Alert.alert('Succès', 'Toutes les notifications ont été marquées comme lues');
        loadNotifications();
      } else {
        Alert.alert('Erreur', result.error || 'Impossible de marquer toutes les notifications');
      }
    } catch (error) {
      console.error('Erreur marquer toutes comme lues:', error);
      Alert.alert('Erreur', 'Impossible de marquer toutes les notifications');
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    Alert.alert(
      'Supprimer',
      'Voulez-vous supprimer cette notification ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await deleteNotification(notificationId);
              if (result.success) {
                loadNotifications();
              }
            } catch (error) {
              console.error('Erreur suppression notification:', error);
            }
          }
        }
      ]
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Date invalide';
      
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'À l\'instant';
      if (diffMins < 60) return `Il y a ${diffMins} min`;
      if (diffHours < 24) return `Il y a ${diffHours}h`;
      if (diffDays < 7) return `Il y a ${diffDays}j`;
      
      return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    } catch (error) {
      return 'Date inconnue';
    }
  };

  const getNotificationIcon = (type) => {
    const icons = {
      'ressource_validee': 'checkmark-circle-outline',
      'ressource_rejetee': 'close-circle-outline',
      'nouvelle_offre': 'school-outline',
      'seance_planifiee': 'calendar-outline',
      'message_recu': 'chatbubble-outline',
      'inscription_seance': 'person-add-outline',
      'rappel_seance': 'notifications-outline',
      'demande_seance': 'calendar-outline'
    };
    return icons[type] || 'notifications-outline';
  };

  const getNotificationColor = (type) => {
    const colors = {
      'ressource_validee': '#28a745',
      'ressource_rejetee': '#dc3545',
      'nouvelle_offre': '#007AFF',
      'seance_planifiee': '#17a2b8',
      'message_recu': '#6c757d',
      'inscription_seance': '#fd7e14',
      'rappel_seance': '#ffc107',
      'demande_seance': '#17a2b8'
    };
    return colors[type] || '#6c757d';
  };

  const safeNotifications = Array.isArray(notifications) ? notifications : [];
  
  const getFilteredNotifications = () => {
    if (filter === 'non_lues') return safeNotifications.filter(n => !n.est_lue);
    if (filter === 'lues') return safeNotifications.filter(n => n.est_lue);
    return safeNotifications;
  };

  const unreadCount = safeNotifications.filter(n => !n.est_lue).length;
  const filtered = getFilteredNotifications();

  if (loading && safeNotifications.length === 0) {
    return (
      <>
        <Header title="Notifications" showBack onBackPress={() => navigation.goBack()} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Chargement des notifications...</Text>
        </View>
      </>
    );
  }

  if (error && safeNotifications.length === 0 && !loading) {
    return (
      <>
        <Header title="Notifications" showBack onBackPress={() => navigation.goBack()} />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={60} color="#dc3545" />
          <Text style={styles.errorTitle}>Erreur de chargement</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadNotifications}>
            <Text style={styles.retryButtonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      </>
    );
  }

  return (
    <>
      <Header title="Notifications" showBack onBackPress={() => navigation.goBack()} />
      <ScrollView 
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Card style={styles.filterCard}>
          <View style={styles.filterHeader}>
            <Text style={styles.filterTitle}>Filtrer</Text>
            {unreadCount > 0 && (
              <Button 
                title="Tout marquer comme lu" 
                onPress={handleMarkAllAsRead}
                size="small"
                style={styles.markAllButton}
              />
            )}
          </View>
          <View style={styles.filterButtons}>
            {[
              { id: 'toutes', label: 'Toutes', count: safeNotifications.length },
              { id: 'non_lues', label: 'Non lues', count: unreadCount },
              { id: 'lues', label: 'Lues', count: safeNotifications.filter(n => n.est_lue).length }
            ].map((filterOption) => (
              <TouchableOpacity
                key={filterOption.id}
                style={[
                  styles.filterButton,
                  filter === filterOption.id && styles.filterButtonActive
                ]}
                onPress={() => setFilter(filterOption.id)}
              >
                <Text style={[
                  styles.filterButtonText,
                  filter === filterOption.id && styles.filterButtonTextActive
                ]}>
                  {filterOption.label} ({filterOption.count})
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {filtered.length === 0 ? (
          <Card style={styles.emptyCard}>
            <View style={styles.emptyContainer}>
              <Ionicons name="notifications-off-outline" size={60} color="#ccc" />
              <Text style={styles.emptyTitle}>
                {filter === 'non_lues' ? 'Aucune notification non lue' : 
                 filter === 'lues' ? 'Aucune notification lue' : 
                 'Aucune notification'}
              </Text>
              <Text style={styles.emptyText}>
                {filter === 'non_lues' ? 'Vous êtes à jour !' : 
                 filter === 'lues' ? 'Pas de notifications lues' : 
                 'Vous n\'avez pas encore de notifications'}
              </Text>
            </View>
          </Card>
        ) : (
          filtered.map(notification => (
            <Card key={notification.id} style={[
              styles.notificationCard,
              !notification.est_lue && styles.unreadCard
            ]}>
              <View style={styles.notificationHeader}>
                <View style={styles.notificationIcon}>
                  <Ionicons 
                    name={getNotificationIcon(notification.type)} 
                    size={24} 
                    color={getNotificationColor(notification.type)} 
                  />
                </View>
                <View style={styles.notificationInfo}>
                  <Text style={styles.notificationTitle}>
                    {notification.titre || 'Notification'}
                  </Text>
                  <Text style={styles.notificationDate}>
                    {formatDate(notification.date_creation)}
                  </Text>
                </View>
                <View style={styles.notificationActions}>
                  {!notification.est_lue && (
                    <TouchableOpacity
                      style={styles.readButton}
                      onPress={() => handleMarkAsRead(notification.id)}
                    >
                      <Ionicons name="checkmark-outline" size={16} color="#28a745" />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteNotification(notification.id)}
                  >
                    <Ionicons name="trash-outline" size={16} color="#dc3545" />
                  </TouchableOpacity>
                </View>
              </View>
              
              <Text style={styles.notificationMessage}>
                {notification.message || 'Aucun message'}
              </Text>
              
              {notification.lien && (
                <TouchableOpacity style={styles.actionLink}>
                  <Text style={styles.actionText}>Voir les détails</Text>
                  <Ionicons name="arrow-forward-outline" size={14} color="#007AFF" />
                </TouchableOpacity>
              )}
            </Card>
          ))
        )}
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#dc3545',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  filterCard: {
    marginBottom: 16,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  markAllButton: {
    paddingHorizontal: 12,
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  filterButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  emptyCard: {
    alignItems: 'center',
    padding: 40,
  },
  emptyContainer: {
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
  notificationCard: {
    marginBottom: 16,
    padding: 16,
  },
  unreadCard: {
    backgroundColor: '#f8f9ff',
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  notificationIcon: {
    marginRight: 12,
    paddingTop: 2,
  },
  notificationInfo: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  notificationDate: {
    fontSize: 12,
    color: '#666',
  },
  notificationActions: {
    flexDirection: 'row',
    gap: 8,
  },
  readButton: {
    padding: 6,
    borderRadius: 12,
    backgroundColor: '#e8f5e8',
  },
  deleteButton: {
    padding: 6,
    borderRadius: 12,
    backgroundColor: '#ffebee',
  },
  notificationMessage: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  actionLink: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  actionText: {
    fontSize: 14,
    color: '#007AFF',
    marginRight: 4,
  },
});

export default NotificationsScreen;