import React, { useMemo, useState, useEffect } from 'react';
import {
  Modal, View, Text, StyleSheet, TextInput, Pressable,
  Platform, KeyboardAvoidingView, ScrollView
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AddTaskSheet({
  visible,
  projects,
  initialProjectId = 'inbox',
  onSubmit,
  onClose,
}) {
  const insets = useSafeAreaInsets();
  const items = useMemo(() => projects.filter(p => p.id !== 'all'), [projects]);
  const [title, setTitle] = useState('');
  const [important, setImportant] = useState(false);
  const [urgent, setUrgent] = useState(false);
  const [projectId, setProjectId] = useState(initialProjectId);

  useEffect(() => {
    if (visible) {
      setTitle('');
      setImportant(false);
      setUrgent(false);
      setProjectId(initialProjectId === 'all' ? 'inbox' : initialProjectId);
    }
  }, [visible, initialProjectId]);

  const submit = () => {
    const t = title.trim();
    if (!t) return;
    onSubmit?.({ title: t, important, urgent, projectId });
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: 'padding', android: undefined })}
        style={{ flex: 1 }}
        keyboardVerticalOffset={insets.top + 8}
      >
        <View style={styles.backdrop}>
          <View style={[styles.sheet, { paddingBottom: 12 + insets.bottom }]}>
            <ScrollView contentContainerStyle={{ paddingBottom: 8 }} keyboardShouldPersistTaps="handled">
              <Text style={styles.title}>Новая задача</Text>

              <TextInput
                autoFocus
                placeholder="Название…"
                value={title}
                onChangeText={setTitle}
                style={styles.input}
                returnKeyType="done"
                onSubmitEditing={submit}
              />

              <View style={styles.row}>
                <Pressable onPress={() => setImportant(v => !v)} style={({ pressed }) => [styles.chip, important && styles.chipOn, pressed && styles.pressed]}>
                  <Text style={[styles.chipText, important && styles.chipTextOn]}>⭐ Важно</Text>
                </Pressable>
                <Pressable onPress={() => setUrgent(v => !v)} style={({ pressed }) => [styles.chip, urgent && styles.chipOnRed, pressed && styles.pressed]}>
                  <Text style={[styles.chipText, urgent && styles.chipTextOnRed]}>⚡ Срочно</Text>
                </Pressable>
              </View>

              <Text style={styles.section}>Проект</Text>
              <ScrollView horizontal contentContainerStyle={{ paddingVertical: 4 }} showsHorizontalScrollIndicator={false}>
                {items.map((item) => {
                  const active = item.id === projectId;
                  return (
                    <Pressable
                      key={item.id}
                      onPress={() => setProjectId(item.id)}
                      style={({ pressed }) => [styles.proj, active && styles.projOn, pressed && styles.pressed]}
                    >
                      <Text style={[styles.projText, active && styles.projTextOn]}>
                        {item.emoji ?? '📁'} {item.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </ScrollView>

            <View style={styles.actions}>
              <Pressable onPress={onClose} style={styles.btn}><Text>Отмена</Text></Pressable>
              <Pressable onPress={submit} style={[styles.btn, styles.btnPrimary]}><Text style={{ color: '#fff' }}>Добавить</Text></Pressable>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex:1, backgroundColor:'rgba(0,0,0,0.35)', alignItems:'center', justifyContent:'center', padding:16 },
  sheet: { width:'100%', maxWidth:460, backgroundColor:'#fff', borderRadius:16, padding:14 },
  title: { fontSize:16, fontWeight:'600', textAlign:'center', marginBottom:8 },
  input: {
    borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, borderColor: '#D9D9DF',
    paddingHorizontal: 12, paddingVertical: Platform.select({ ios: 10, android: 8 }), backgroundColor: '#fff',
  },
  row: { flexDirection:'row', gap:8, marginTop:10 },
  chip: { paddingVertical:6, paddingHorizontal:10, borderRadius:999, backgroundColor:'#F2F3F5' },
  chipOn: { backgroundColor:'#FFF3C4' },
  chipOnRed: { backgroundColor:'#FFE1E1' },
  chipText: { fontSize:13, color:'#333' },
  chipTextOn: { color:'#8A6D00' },
  chipTextOnRed: { color:'#8A0000' },
  section: { marginTop:12, marginBottom:6, fontSize:12, color:'#666', fontWeight:'600' },
  proj: { marginRight:8, paddingVertical:6, paddingHorizontal:10, borderRadius:999, backgroundColor:'#F2F3F5' },
  projOn: { backgroundColor:'#111' },
  projText: { fontSize:13, color:'#333' },
  projTextOn: { color:'#fff' },
  actions: { flexDirection:'row', justifyContent:'flex-end', gap:10, marginTop:8 },
  btn: { paddingVertical:10, paddingHorizontal:12, borderRadius:10, backgroundColor:'#F2F3F5' },
  btnPrimary: { backgroundColor:'#111' },
  pressed: { opacity:0.6 },
});
