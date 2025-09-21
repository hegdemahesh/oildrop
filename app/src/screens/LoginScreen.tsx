import React, { useRef, useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { useAuth } from '../context/AuthContext';
import PhoneRecaptcha from '../components/PhoneRecaptcha';
import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha';

export default function LoginScreen() {
  const { signInWithGoogle, loading, startPhoneVerification, confirmPhoneCode, phoneSessionId, error } = useAuth();
  const [mode, setMode] = useState<'google' | 'phone'>('google');
  const [phone, setPhone] = useState('+91');
  const [code, setCode] = useState('');
  const [resendSeconds, setResendSeconds] = useState(0);
  const recaptchaRef = useRef<FirebaseRecaptchaVerifierModal>(null);

  useEffect(() => {
    let timer: any;
    if (resendSeconds > 0) {
      timer = setTimeout(() => setResendSeconds(s => s - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendSeconds]);

  const sendCode = () => {
    if (!phone || phone.length < 8) return;
    startPhoneVerification(phone);
    setResendSeconds(45);
  };

  const confirmCode = () => {
    if (!code) return;
    confirmPhoneCode(code);
  };

  return (
    <View style={styles.container}>
      <PhoneRecaptcha ref={recaptchaRef} />
      <Text style={styles.title}>OilDrop Garage</Text>
      <View style={styles.toggleRow}>
        <TouchableOpacity onPress={() => setMode('google')} style={[styles.toggleBtn, mode==='google' && styles.toggleActive]}>
          <Text style={styles.toggleText}>Google</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setMode('phone')} style={[styles.toggleBtn, mode==='phone' && styles.toggleActive]}>
          <Text style={styles.toggleText}>Phone</Text>
        </TouchableOpacity>
      </View>
      {mode === 'google' && (
        <View style={styles.card}>
          {loading ? <ActivityIndicator /> : (
            <TouchableOpacity style={styles.primaryBtn} onPress={signInWithGoogle} disabled={loading}>
              <Text style={styles.primaryBtnText}>Sign in with Google</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
      {mode === 'phone' && (
        <View style={styles.card}>
          {!phoneSessionId && (
            <>
              <TextInput style={styles.input} placeholder="Phone (+91...)" keyboardType='phone-pad' value={phone} onChangeText={setPhone} />
              <TouchableOpacity style={[styles.primaryBtn, (loading || phone.length < 8) && styles.btnDisabled]} onPress={sendCode} disabled={loading || phone.length < 8}>
                <Text style={styles.primaryBtnText}>{loading ? 'Sending...' : 'Send Code'}</Text>
              </TouchableOpacity>
            </>
          )}
          {phoneSessionId && (
            <>
              <Text style={styles.helper}>Code sent to {phone}</Text>
              <TextInput style={styles.input} placeholder="OTP Code" keyboardType='number-pad' value={code} onChangeText={setCode} />
              <TouchableOpacity style={[styles.primaryBtn, (!code || code.length < 4) && styles.btnDisabled]} onPress={confirmCode} disabled={!code || code.length < 4 || loading}>
                <Text style={styles.primaryBtnText}>{loading ? 'Verifying...' : 'Verify Code'}</Text>
              </TouchableOpacity>
              <View style={styles.resendRow}>
                <Text style={styles.resendText}>{resendSeconds > 0 ? `Resend in ${resendSeconds}s` : 'Didn\'t get code?'}</Text>
                {resendSeconds === 0 && (
                  <TouchableOpacity onPress={sendCode}><Text style={styles.resendLink}>Resend</Text></TouchableOpacity>
                )}
              </View>
            </>
          )}
        </View>
      )}
      {!!error && <Text style={styles.error}>{error}</Text>}
      <Text style={styles.note}>Use Google or Phone OTP to sign in.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16, backgroundColor: '#f5f7fa' },
  title: { fontSize: 30, fontWeight: '800', marginBottom: 28, letterSpacing: 0.5 },
  note: { marginTop: 16, fontSize: 12, color: '#555', textAlign: 'center' },
  toggleRow: { flexDirection: 'row', marginBottom: 20, backgroundColor: '#eee', borderRadius: 8 },
  toggleBtn: { flex: 1, paddingVertical: 10, alignItems: 'center' },
  toggleActive: { backgroundColor: '#fff', borderRadius: 8, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 3 },
  toggleText: { fontSize: 14, fontWeight: '600' },
  card: { width: '100%', maxWidth: 360, backgroundColor: '#fff', padding: 20, borderRadius: 16, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  input: { borderWidth: 1, borderColor: '#d0d5dd', padding: 12, borderRadius: 10, marginBottom: 14, fontSize: 15, backgroundColor: '#fafbfc' },
  primaryBtn: { backgroundColor: '#2563eb', paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginTop: 4 },
  primaryBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  btnDisabled: { opacity: 0.5 },
  helper: { marginBottom: 6, fontSize: 13, color: '#444' },
  resendRow: { flexDirection: 'row', marginTop: 10, justifyContent: 'center', alignItems: 'center', gap: 6 },
  resendText: { fontSize: 12, color: '#555' },
  resendLink: { fontSize: 12, color: '#2563eb', fontWeight: '600', marginLeft: 6 },
  error: { marginTop: 16, color: '#b71c1c', fontSize: 13, textAlign: 'center', paddingHorizontal: 20 }
});
