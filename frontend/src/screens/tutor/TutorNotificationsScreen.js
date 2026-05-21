import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import Header from '../../components/ui/Header';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { API_BASE_URL } from '../../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const TutorNotificationsScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState('toutes');

  const [filters] = useState([
    { id: 'toutes', label: 'Toutes', icon: 'list-outline' },
    { id: 'non_lues', label: 'Non lues', icon: 'mail-unread-outline' },
    { id: 'seances', label: 'Séances', icon: 'calendar-outline' },
    { id: 'forum', label: 'Forum', icon: 'chatbubble-outline' },
    { id: 'ressources', label: 'Ressources', icon: 'folder-outline' },
    { id: 'systeme', label: 'Système', icon: 'settings-outline' }
  ]);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}/api/notifications/notifications/?est_lue=false`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(Array.isArray(data) ? data : (data.results || data || []));
      } else {
        setNotifications([]); // Initialiser comme tableau vide en cas d'erreur
      }
    } catch (error) {
      console.error('Erreur chargement notifications:', error);
      setNotifications([]); // Initialiser comme tableau vide en cas d'erreur
      Alert.alert('Erreur', 'Impossible de charger vos notifications');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const markAsRead = async (notificationId) => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      await fetch(`${API_BASE_URL}/api/tutor/notifications/${notificationId}/read/`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      setNotifications(prev => {
        const prevArray = Array.isArray(prev) ? prev : [];
        return prevArray.map(notif => 
          notif.id === notificationId ? { ...notif, est_lue: true } : notif
        );
      });
    } catch (error) {
      console.error('Erreur marquer comme lu:', error);
    }
  };

  const deleteNotification = async (notificationId) => {
    Alert.alert(
      'Supprimer la notification',
      'Voulez-vous vraiment supprimer cette notification ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('accessToken');
              const response = await fetch(`${API_BASE_URL}/api/tutor/notifications/${notificationId}/delete/`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
              });

              if (response.ok) {
                setNotifications(prev => Array.isArray(prev) ? prev.filter(notif => notif.id !== notificationId) : []);
                Alert.alert('Succès', 'Notification supprimée avec succès');
              } else {
                Alert.alert('Erreur', 'Impossible de supprimer la notification');
              }
            } catch (error) {
              console.error('Erreur suppression notification:', error);
              Alert.alert('Erreur', 'Impossible de supprimer la notification');
            }
          }
        }
      ]
    );
  };

  const markAllAsRead = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}/api/tutor/notifications/mark-all-read/`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setNotifications(prev => {
          const prevArray = Array.isArray(prev) ? prev : [];
          return prevArray.map(notif => ({ ...notif, est_lue: true }));
        });
        Alert.alert('Succès', 'Toutes les notifications ont été marquées comme lues');
      }
    } catch (error) {
      console.error('Erreur marquer tout comme lu:', error);
    }
  };

  const getNotificationIcon = (type) => {
    const icons = {
      nouvelle_inscription: 'person-add-outline',
      annulation_seance: 'calendar-remove-outline',
      rappel_seance: 'alarm-outline',
      nouvelle_question_forum: 'chatbubble-outline',
      message_recu: 'mail-outline',
      validation_ressource: 'checkmark-circle-outline',
      rejet_ressource: 'close-circle-outline',
      nouvelle_evaluation: 'star-outline',
      systeme: 'information-circle-outline'
    };
    return icons[type] || 'notifications-outline';
  };

  const getNotificationColor = (type) => {
    const colors = {
      nouvelle_inscription: '#28a745',
      annulation_seance: '#dc3545',
      rappel_seance: '#ffc107',
      nouvelle_question_forum: '#007AFF',
      message_recu: '#17a2b8',
      validation_ressource: '#28a745',
      rejet_ressource: '#dc3545',
      nouvelle_evaluation: '#ffc107',
      systeme: '#6f42c1'
    };
    return colors[type] || '#666';
  };

  const getNotificationTitle = (type) => {
    const titles = {
      nouvelle_inscription: 'Nouvelle inscription',
      annulation_seance: 'Séance annulée',
      rappel_seance: 'Rappel de séance',
      nouvelle_question_forum: 'Nouvelle question forum',
      message_recu: 'Message reçu',
      validation_ressource: 'Ressource validée',
      rejet_ressource: 'Ressource rejetée',
      nouvelle_evaluation: 'Nouvelle évaluation',
      systeme: 'Information système'
    };
    return titles[type] || 'Notification';
  };

  const renderNotificationItem = (notification) => (
    <Card 
      key={notification.id} 
      style={[
        styles.notificationCard,
        !notification.est_lue && styles.unreadCard
      ]}
    >
      <TouchableOpacity
        style={styles.notificationContent}
        onPress={() => markAsRead(notification.id)}
      >
        <View style={styles.notificationHeader}>
          <View style={[styles.iconContainer, { backgroundColor: getNotificationColor(notification.type) }]}>
            <Ionicons 
              name={getNotificationIcon(notification.type)} 
              size={20} 
              color="#fff" 
            />
          </View>
          <View style={styles.notificationInfo}>
            <Text style={styles.notificationTitle}>
              {getNotificationTitle(notification.type)}
            </Text>
            <Text style={styles.notificationTime}>
              {notification.date_creation ? 
                (() => {
                  try {
                    const date = new Date(notification.date_creation);
                    if (isNaN(date.getTime())) {
                      return 'Date invalide';
                    }
                    return date.toLocaleDateString('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    });
                  } catch (error) {
                    return 'Date invalide';
                  }
                })() : 
                'Date non disponible'
              }
            </Text>
          </View>
          {!notification.est_lue && (
            <View style={styles.unreadDot} />
          )}
        </View>
        
        <Text style={styles.notificationMessage} numberOfLines={3}>
          {notification.message}
        </Text>
        
        {notification.action_url && (
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => {
              // Navigation vers la page concernée
              markAsRead(notification.id);
            }}
          >
            <Text style={styles.actionButtonText}>Voir</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
      
      <View style={styles.notificationActions}>
        <TouchableOpacity
          style={styles.actionIconButton}
          onPress={() => markAsRead(notification.id)}
        >
          <Ionicons name="checkmark-outline" size={16} color="#28a745" />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.actionIconButton}
          onPress={() => deleteNotification(notification.id)}
        >
          <Ionicons name="trash-outline" size={16} color="#dc3545" />
        </TouchableOpacity>
      </View>
    </Card>
  );

  if (loading) {
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

  const unreadCount = Array.isArray(notifications) ? notifications.filter(n => !n.est_lue).length : 0;

  return (
    <>
      <Header 
        title="Notifications" 
        showBack 
        onBackPress={() => navigation.goBack()}
        rightButton={
          unreadCount > 0 ? {
            icon: 'checkmark-done-outline',
            onPress: markAllAsRead,
            color: '#28a745'
          } : null
        }
      />
      <ScrollView style={styles.container}>
        <View style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            {filters.map((filter) => (
              <TouchableOpacity
                key={filter.id}
                style={[
                  styles.filterButton,
                  selectedFilter === filter.id && styles.filterSelected
                ]}
                onPress={() => setSelectedFilter(filter.id)}
              >
                <Ionicons 
                  name={filter.icon} 
                  size={16} 
                  color={selectedFilter === filter.id ? '#fff' : '#666'} 
                />
                <Text style={[
                  styles.filterText,
                  selectedFilter === filter.id && styles.filterTextSelected
                ]}>{filter.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        
        {notifications.length === 0 ? (
          <Card style={styles.emptyCard}>
            <View style={styles.emptyContainer}>
              <Ionicons name="notifications-off-outline" size={60} color="#ccc" />
              <Text style={styles.emptyTitle}>Aucune notification</Text>
              <Text style={styles.emptyText}>
                Vous n'avez aucune notification pour le moment
              </Text>
            </View>
          </Card>
        ) : (
          (notifications || []).map(renderNotificationItem)
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
  filterContainer: {
    marginBottom: 16,
  },
  filterScroll: {
    flexDirection: 'row',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 8,
  },
  filterSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  filterText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
  },
  filterTextSelected: {
    color: '#fff',
  },
  notificationCard: {
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#ddd',
  },
  unreadCard: {
    borderLeftColor: '#007AFF',
    backgroundColor: '#f8f9ff',
  },
  notificationContent: {
    padding: 16,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationInfo: {
    flex: 1,
    marginLeft: 12,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  notificationTime: {
    fontSize: 12,
    color: '#999',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#007AFF',
  },
  notificationMessage: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  actionButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginTop: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
  },
  notificationActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 12,
  },
  actionIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
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
});

export default TutorNotificationsScreen;
