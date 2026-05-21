import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const clamp01 = (n) => Math.max(0, Math.min(1, n));

const ProgressLine = ({ label, value, rightLabel, color = '#28a745' }) => {
  const normalized = clamp01((value ?? 0) / 100);
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.right}>{rightLabel ?? `${Math.round((value ?? 0) * 10) / 10}%`}</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${normalized * 100}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: 13,
    color: '#333',
    flex: 1,
    paddingRight: 12,
  },
  right: {
    fontSize: 13,
    color: '#333',
    fontWeight: '600',
  },
  track: {
    height: 8,
    borderRadius: 8,
    backgroundColor: '#e9ecef',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 8,
  },
});

export default ProgressLine;
