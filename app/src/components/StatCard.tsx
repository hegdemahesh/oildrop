import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  label: string;
  value: string | number;
  color?: string;
}

export default function StatCard({ label, value, color = '#1e88e5' }: Props) {
  return (
    <View style={[styles.card, { borderColor: color }]}> 
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 12, borderWidth: 2, borderRadius: 8, minWidth: 120, margin: 6, backgroundColor: '#fff' },
  label: { fontSize: 12, color: '#444' },
  value: { fontSize: 20, fontWeight: '700' }
});
