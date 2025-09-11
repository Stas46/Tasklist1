import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Platform, useWindowDimensions } from 'react-native';
import { signIn, signUp, signOut } from '../src/services/auth';
import { useTasks } from '../store/useTasks';

export default function AuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);

  const userId = useTasks((s) => s.userId);
  const { width } = useWindowDimensions();
  const isNarrow = width < 520;

  const doSignIn = async () => {
    setLoading(true); setError(null);
    try {
      await signIn(email.trim(), password);
  setInfo(null);
    } catch (e) {
      setError(e.message || String(e));
    } finally { setLoading(false); }
  };

  const doSignUp = async () => {
    setLoading(true); setError(null);
    try {
      await signUp(email.trim(), password);
  // Supabase will usually send a confirmation email for new sign-ups.
  // Inform the user to check and confirm their email before signing in.
  setInfo('Регистрация прошла. Проверьте почту и подтвердите email по ссылке — после подтверждения выполните вход.');
  // clear sensitive inputs
  setPassword('');
    } catch (e) {
      setError(e.message || String(e));
    } finally { setLoading(false); }
  };

  const doSignOut = async () => {
    setLoading(true); setError(null);
    try {
      await signOut();
    } catch (e) {
      setError(e.message || String(e));
    } finally { setLoading(false); }
  };

  const cardWidth = Math.min(520, Math.max(320, width - 48));

  return (
    <View style={[styles.wrap, { alignItems: 'center' }]}>
      <View style={[styles.card, { width: cardWidth }]}> 
        <Text style={styles.title}>TaskList — Sign in</Text>
        <TextInput placeholder="Email" value={email} onChangeText={setEmail} style={styles.input} autoCapitalize="none" keyboardType="email-address" />
        <TextInput placeholder="Password" value={password} onChangeText={setPassword} style={styles.input} secureTextEntry />

  {error ? <Text style={styles.err}>{error}</Text> : null}
  {info ? <Text style={styles.info}>{info}</Text> : null}

        <View style={[styles.row, isNarrow && styles.rowStack]}>
          <Pressable onPress={doSignIn} style={[styles.btn, styles.primary, isNarrow && styles.btnFull]} disabled={loading}>
            <Text style={styles.btnText}>Sign In</Text>
          </Pressable>
          <Pressable onPress={doSignUp} style={[styles.btn, styles.ghost, isNarrow && styles.btnFull, isNarrow && { marginTop: 8 }]} disabled={loading}>
            <Text style={styles.ghostText}>Sign Up</Text>
          </Pressable>
        </View>

        {userId && (
          <View style={{ marginTop: 12 }}>
            <Text style={styles.info}>Signed in as: {userId}</Text>
            <Pressable onPress={doSignOut} style={[styles.btn, { marginTop: 8 }]}>
              <Text style={styles.btnText}>Sign Out</Text>
            </Pressable>
          </View>
        )}

        <Text style={styles.note}>Works on web + native (Expo). Use email+password.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: 20, justifyContent: 'center', backgroundColor: '#fff' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 18, elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width:0, height:6 } },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 14, textAlign: 'center' },
  input: { borderWidth: StyleSheet.hairlineWidth, borderColor: '#DDD', padding: 12, borderRadius: 8, marginBottom: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  rowStack: { flexDirection: 'column' },
  btn: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center' },
  btnFull: { width: '100%' },
  primary: { backgroundColor: '#111' },
  ghost: { backgroundColor: '#F2F3F5' },
  btnText: { color: '#fff', fontWeight: '700' },
  ghostText: { color: '#111', fontWeight: '700' },
  err: { color: '#B00020', marginBottom: 8, textAlign: 'center' },
  info: { color: '#333' },
  note: { marginTop: 18, fontSize: 12, color: '#666', textAlign: 'center' },
});
