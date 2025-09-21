import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet, TextInput, Button } from 'react-native';
import { useInventory } from '../hooks/useInventory';
import { getFirestore, addDoc, collection } from 'firebase/firestore';
import { initFirebase } from '../services/firebase';

export default function InventoryScreen() {
  const { items } = useInventory();
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [stock, setStock] = useState('0');
  const [price, setPrice] = useState('0');
  initFirebase();
  const db = getFirestore();

  const addItem = async () => {
    if (!name) return;
    await addDoc(collection(db, 'inventory'), { name, brand, stock: Number(stock), price: Number(price), type: 'engine_oil', gstPercent: 18 });
    setName(''); setBrand(''); setStock('0'); setPrice('0');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Inventory</Text>
      <View style={styles.form}>
        <TextInput style={styles.input} placeholder="Name" value={name} onChangeText={setName} />
        <TextInput style={styles.input} placeholder="Brand" value={brand} onChangeText={setBrand} />
        <TextInput style={styles.input} placeholder="Stock" value={stock} onChangeText={setStock} keyboardType='numeric' />
        <TextInput style={styles.input} placeholder="Price" value={price} onChangeText={setPrice} keyboardType='numeric' />
        <Button title="Add Item" onPress={addItem} />
      </View>
      <FlatList data={items} keyExtractor={i => i.id} renderItem={({ item }) => (
        <View style={styles.item}>
          <Text style={styles.itemName}>{item.name} ({item.brand})</Text>
          <Text style={styles.itemMeta}>Stock: {item.stock} | ₹{item.price}</Text>
        </View>
      )} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  header: { fontSize: 24, fontWeight: '700', marginBottom: 12 },
  form: { marginBottom: 16, gap: 8 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 8, borderRadius: 6 },
  item: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  itemName: { fontSize: 16, fontWeight: '600' },
  itemMeta: { fontSize: 12, color: '#666' }
});
