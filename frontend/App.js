import React from 'react';
import { AuthProvider } from './src/context/AuthContext';
import { NotificationProvider } from './src/context/NotificationContext';
import AppNav from './src/navigation';

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <AppNav />
      </NotificationProvider>
    </AuthProvider>
  );
}