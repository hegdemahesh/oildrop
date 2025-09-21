import React from 'react';
import { View, Text, Button, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen() {
  const { signInWithGoogle, loading } = useAuth();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>OilDrop Garage</Text>
      {loading ? <ActivityIndicator /> : <Button title="Sign in with Google" onPress={signInWithGoogle} />}
      <Text style={styles.note}>Google login placeholder - complete flow in AuthContext.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 24 },
  note: { marginTop: 16, fontSize: 12, color: '#555', textAlign: 'center' }
});
