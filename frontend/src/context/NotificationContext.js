import React, { createContext, useState, useContext, useEffect } from 'react';
import { getUnreadNotifications } from '../api/notificationService';
import { useAuth } from '../context/AuthContext';

const NotificationContext = createContext({});

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const refreshUnreadCount = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const result = await getUnreadNotifications();
      if (result.success) {
        setUnreadCount(result.data.length);
      }
    } catch (error) {
      console.error('Erreur récupération notifications non lues:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      refreshUnreadCount();
      // Option: polling toutes les 30 secondes
      const interval = setInterval(refreshUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  return (
    <NotificationContext.Provider value={{ unreadCount, loading, refreshUnreadCount }}>
      {children}
    </NotificationContext.Provider>
  );
};