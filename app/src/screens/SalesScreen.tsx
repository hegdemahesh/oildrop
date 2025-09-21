import React, { useState } from 'react';
import { View, Text, StyleSheet, Button, FlatList } from 'react-native';
import { useInventory } from '../hooks/useInventory';

interface DraftLineItem { id: string; qty: number; }

export default function SalesScreen() {
  const { items } = useInventory();
  const [draft, setDraft] = useState<DraftLineItem[]>([]);

  const addLine = (id: string) => {
    setDraft(prev => {
      const found = prev.find(l => l.id === id);
      if (found) return prev.map(l => l.id === id ? { ...l, qty: l.qty + 1 } : l);
      return [...prev, { id, qty: 1 }];
    });
  };

  const total = draft.reduce((sum, l) => {
    const item = items.find(i => i.id === l.id);
    return sum + (item ? item.price * l.qty : 0);
  }, 0);

  const submitInvoice = () => {
    // TODO: Persist invoice -> Firestore; trigger function for stock decrement & PDF generation.
    console.log('Invoice draft', draft);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Sales</Text>
      <FlatList data={items} keyExtractor={i => i.id} renderItem={({ item }) => (
        <View style={styles.item}> 
          <Text style={styles.itemName}>{item.name}</Text>
          <Button title="Add" onPress={() => addLine(item.id)} />
        </View>
      )} />
      <View style={styles.summary}> 
        <Text style={styles.total}>Total: ₹{total}</Text>
        <Button title="Create Invoice" onPress={submitInvoice} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  header: { fontSize: 24, fontWeight: '700', marginBottom: 12 },
  item: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#eee' },
  itemName: { fontSize: 16 },
  summary: { paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#ddd' },
  total: { fontSize: 20, fontWeight: '700', marginBottom: 8 }
});
