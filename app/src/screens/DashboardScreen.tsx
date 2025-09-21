import React from 'react';
import { View, Text, StyleSheet, ScrollView, Button } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/StatCard';
import { useInventory } from '../hooks/useInventory';

export default function DashboardScreen() {
  const nav = useNavigation<any>();
  const { logout } = useAuth();
  const { inventoryCount, lowStock } = useInventory();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Dashboard</Text>
      <View style={styles.row}>
        <StatCard label="Inventory Items" value={inventoryCount} />
        <StatCard label="Low Stock" value={lowStock.length} color="#e65100" />
        <StatCard label="Recent Sales" value={0} color="#43a047" />
      </View>
      <View style={styles.navButtons}>
        <Button title="Customers" onPress={() => nav.navigate('Customers')} />
        <Button title="Inventory" onPress={() => nav.navigate('Inventory')} />
        <Button title="Sales" onPress={() => nav.navigate('Sales')} />
      </View>
      <View style={{ marginTop: 24 }}>
        <Button title="Logout" color="#b71c1c" onPress={logout} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  header: { fontSize: 26, fontWeight: '700', marginBottom: 12 },
  row: { flexDirection: 'row', flexWrap: 'wrap' },
  navButtons: { marginTop: 24, gap: 12 }
});
