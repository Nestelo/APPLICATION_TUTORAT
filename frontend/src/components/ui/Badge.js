import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const Badge = ({ 
  text, 
  color = '#007AFF', 
  size = 'medium',
  style 
}) => {
  const badgeStyles = [
    styles.badge,
    styles[size],
    { backgroundColor: color },
    style
  ];

  const textStyles = [
    styles.text,
    styles[`${size}Text`]
  ];

  return (
    <View style={badgeStyles}>
      <Text style={textStyles}>{text}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  small: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  medium: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  large: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  text: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  smallText: {
    fontSize: 10,
  },
  mediumText: {
    fontSize: 12,
  },
  largeText: {
    fontSize: 14,
  },
});

export default Badge;
