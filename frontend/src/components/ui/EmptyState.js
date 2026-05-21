import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Button from './Button';

const EmptyState = ({ icon = 'alert-circle-outline', message, buttonTitle, onButtonPress }) => {
  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={64} color="#ccc" />
      <Text style={styles.message}>{message}</Text>
      {buttonTitle && onButtonPress && (
        <Button title={buttonTitle} onPress={onButtonPress} style={styles.button} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  message: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 20,
  },
  button: {
    minWidth: 150,
  },
});

export default EmptyState;