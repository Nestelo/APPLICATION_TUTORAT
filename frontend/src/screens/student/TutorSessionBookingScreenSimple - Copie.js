import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';

const TutorSessionBookingScreenSimple = ({ route, navigation }) => {
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    console.log('Component mounted');
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tutor Session Booking</Text>
      <Text>Si vous voyez ce message, useEffect fonctionne!</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 20,
  },
});

export default TutorSessionBookingScreenSimple;
