import React from 'react';
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';

const Q = [
  { key: 'uv', title: 'Важно и срочно',      desc: 'Сделать сейчас',        color: '#ffefef' },
  { key: 'v',  title: 'Важно, не срочно',    desc: 'Запланировать',         color: '#eef9f0' },
  { key: 'u',  title: 'Срочно, не важно',    desc: 'Делегировать/быстро',   color: '#fff8e5' },
  { key: 'o',  title: 'Не важно, не срочно', desc: 'Минимизировать/позже',  color: '#f2f3f5' },
];

export default function QuadrantPickerModal({ visible, onSelect, onClose }) {
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Перенести в квадрант…</Text>
          {Q.map(q => (
            <Pressable
              key={q.key}
              onPress={() => onSelect?.(q.key)}
              style={({ pressed }) => [styles.row, { backgroundColor: q.color }, pressed && styles.pressed]}
            >
              <Text style={styles.rowTitle}>{q.title}</Text>
              <Text style={styles.rowDesc}>{q.desc}</Text>
            </Pressable>
          ))}
          <Pressable onPress={onClose} style={({ pressed }) => [styles.cancel, pressed && styles.pressed]}>
            <Text style={styles.cancelText}>Отмена</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center', padding: 16 },
  sheet: { width: '100%', maxWidth: 420, backgroundColor: '#fff', borderRadius: 16, padding: 12, gap: 8 },
  title: { fontSize: 16, fontWeight: '600', textAlign: 'center', marginBottom: 4 },
  row: { borderRadius: 12, paddingVertical: 10, paddingHorizontal: 12 },
  rowTitle: { fontSize: 15, fontWeight: '600' },
  rowDesc: { fontSize: 12, color: '#666', marginTop: 2 },
  cancel: { alignSelf: 'center', paddingVertical: 10, paddingHorizontal: 20 },
  cancelText: { fontSize: 16, color: '#666' },
  pressed: { opacity: 0.6 },
});
