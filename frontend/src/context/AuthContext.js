import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { login as apiLogin } from '../api/authService';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) {
        const userData = JSON.parse(userStr);
        console.log('Données utilisateur chargées:', userData);
        console.log('user.is_active:', userData.is_active);
        console.log('user.est_actif:', userData.est_actif);
        
        // Vérifier si l'utilisateur est actif
        const isActive = userData.est_actif !== false && userData.is_active !== false;
        
        if (isActive) {
          console.log('Utilisateur actif, connexion acceptée');
          setUser(userData);
        } else {
          console.log('Utilisateur non actif, déconnexion forcée');
          await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
          setUser(null);
        }
      }
    } catch (err) {
      console.error('Erreur chargement utilisateur:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // MODIFICATION: Ajout du paramètre selectedRole avec assouplissement enseignant/tuteur
  const login = async (email, password, selectedRole) => {
    try {
      setError(null);
      console.log(`Tentative de connexion: ${email}, rôle sélectionné: ${selectedRole}`);
      
      // Appel à l'API avec le rôle sélectionné
      const result = await apiLogin(email, password, selectedRole);
      
      console.log('Résultat login API:', result);
      
      if (result.success) {
        console.log('Utilisateur connecté:', result.user);
        console.log('Rôle réel de l\'utilisateur:', result.user?.role);
        
        // Vérification de rôle avec assouplissement pour enseignant/tuteur
        if (selectedRole && result.user?.role) {
          // Cas particulier : l'utilisateur a sélectionné "tuteur" mais son vrai rôle est "enseignant"
          if (selectedRole === 'tuteur' && result.user.role === 'enseignant') {
            console.log('✅ Connexion autorisée pour enseignant via le rôle tuteur');
          } else if (selectedRole !== result.user.role) {
            console.error(`⚠️ Incohérence de rôle: sélectionné=${selectedRole}, réel=${result.user.role}`);
            await logout();
            return { 
              success: false, 
              error: `Le rôle sélectionné (${selectedRole}) ne correspond pas à votre compte. Vous êtes connecté en tant que ${result.user.role}.` 
            };
          }
        }
        
        setUser(result.user);
        return { success: true, user: result.user };
      } else {
        setError(result.error);
        return { success: false, error: result.error };
      }
    } catch (err) {
      const message =
        err.response?.data?.detail || err.response?.data?.error || 'Erreur de connexion';
      setError(message);
      return { success: false, error: message };
    }
  };

  const logout = async () => {
    await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
    setUser(null);
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    AsyncStorage.setItem('user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, error, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export { AuthContext };