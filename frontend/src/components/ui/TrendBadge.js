import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const TrendBadge = ({ value }) => {
  const isPositive = value >= 0;
  const color = isPositive ? '#28a745' : '#dc3545';
  const icon = isPositive ? 'trending-up' : 'trending-down';
  return (
    <View style={[styles.badge, { backgroundColor: color + '20' }]}>
      <Ionicons name={icon} size={14} color={color} />
      <Text style={[styles.text, { color }]}>{Math.abs(value)}%</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 2,
  },
});

export default TrendBadge;