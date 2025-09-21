import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet, TextInput, Button } from 'react-native';
import { useCustomers } from '../hooks/useCustomers';
import { getFirestore, addDoc, collection } from 'firebase/firestore';
import { initFirebase } from '../services/firebase';

export default function CustomersScreen() {
  const { customers } = useCustomers();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  initFirebase();
  const db = getFirestore();

  const addCustomer = async () => {
    if (!name || !phone) return;
    await addDoc(collection(db, 'customers'), { name, phone });
    setName('');
    setPhone('');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Customers</Text>
      <View style={styles.form}>
        <TextInput style={styles.input} placeholder="Name" value={name} onChangeText={setName} />
        <TextInput style={styles.input} placeholder="Phone" value={phone} onChangeText={setPhone} />
        <Button title="Add" onPress={addCustomer} />
      </View>
      <FlatList data={customers} keyExtractor={i => i.id} renderItem={({ item }) => (
        <View style={styles.item}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemPhone}>{item.phone}</Text>
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
  itemPhone: { fontSize: 14, color: '#555' }
});
