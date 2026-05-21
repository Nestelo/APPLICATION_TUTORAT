import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/ui/Header';
import Card from '../../components/ui/Card';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import { getNotifications, markAsRead, marquerToutLu } from '../../api/compatService';
import { formatDate, formatTime } from '../../utils/helpers';

const NotificationsScreen = ({ navigation }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const data = await getNotifications();
      setNotifications(data || []);
    } catch (error) {
      console.error('Erreur loadNotifications:', error);
      Alert.alert('Erreur', 'Impossible de charger les notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await markAsRead(id);
      setNotifications(prev => {
        const prevArray = Array.isArray(prev) ? prev : [];
        return prevArray.map(n => n.id === id ? { ...n, est_lue: true } : n);
      });
    } catch (error) {
      console.error('Erreur marquer comme lu:', error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await marquerToutLu();
      setNotifications(prev => {
        const prevArray = Array.isArray(prev) ? prev : [];
        return prevArray.map(n => ({ ...n, est_lue: true }));
      });
      Alert.alert('Succès', 'Toutes les notifications marquées comme lues');
    } catch (error) {
      console.error('Erreur marquer tout comme lu:', error);
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => {
        if (!item.est_lue) handleMarkAsRead(item.id);
        if (item.lien) navigation.navigate(item.lien); // navigation basée sur le lien
      }}
    >
      <Card style={[styles.card, !item.est_lue && styles.unread]}>
        <View style={styles.header}>
          <Ionicons
            name={item.est_lue ? 'notifications-outline' : 'notifications'}
            size={24}
            color={item.est_lue ? '#999' : '#007bff'}
          />
          <Text style={styles.date}>{formatDate(item.date_creation)} à {formatTime(item.date_creation)}</Text>
        </View>
        <Text style={styles.titre}>{item.titre}</Text>
        {item.message && <Text style={styles.message}>{item.message}</Text>}
      </Card>
    </TouchableOpacity>
  );

  if (loading) return <LoadingSpinner />;

  return (
    <>
      <Header
        title="Notifications"
        showBack
        onBackPress={() => navigation.goBack()}
        rightIcon="checkmark-done"
        onRightPress={handleMarkAllRead}
      />
      {notifications.length === 0 ? (
        <EmptyState
          icon="notifications-off-outline"
          message="Aucune notification"
        />
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  list: {
    padding: 12,
  },
  card: {
    marginVertical: 4,
  },
  unread: {
    backgroundColor: '#e6f2ff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  date: {
    fontSize: 12,
    color: '#999',
  },
  titre: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    color: '#666',
  },
});

export default NotificationsScreen;