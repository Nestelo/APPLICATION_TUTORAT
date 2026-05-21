import { StyleSheet } from 'react-native';

export const typography = StyleSheet.create({
  h1: {
    fontSize: 32,
    fontWeight: 'bold',
    lineHeight: 40,
  },
  h2: {
    fontSize: 28,
    fontWeight: 'bold',
    lineHeight: 34,
  },
  h3: {
    fontSize: 24,
    fontWeight: '600',
    lineHeight: 30,
  },
  h4: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 26,
  },
  body1: {
    fontSize: 16,
    lineHeight: 22,
  },
  body2: {
    fontSize: 14,
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    color: '#6c757d',
  },
});

export default typography;