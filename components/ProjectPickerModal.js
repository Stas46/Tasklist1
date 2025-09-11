import React, { useMemo } from 'react';
import { Modal, View, Text, Pressable, FlatList, StyleSheet } from 'react-native';

export default function ProjectPickerModal({ visible, projects, currentProjectId, onSelect, onClose }) {
  const items = useMemo(() => projects.filter(p => p.id !== 'all'), [projects]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Переместить в проект…</Text>

          {items.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>Нет проектов</Text>
            </View>
          ) : (
            <FlatList
              data={items}
              keyExtractor={(p) => p.id}
              ItemSeparatorComponent={() => <View style={{ height: 6 }} />}
              renderItem={({ item }) => {
                const active = item.id === currentProjectId;
                return (
                  <Pressable
                    onPress={() => onSelect?.(item.id)}
                    style={({ pressed }) => [styles.row, pressed && styles.pressed]}
                  >
                    <Text style={styles.emoji}>{item.emoji ?? '📁'}</Text>
                    <Text style={[styles.name, active && styles.active]}>{item.name}</Text>
                  </Pressable>
                );
              }}
            />
          )}

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
  sheet: { width: '100%', maxWidth: 420, backgroundColor: '#fff', borderRadius: 16, paddingVertical: 12, paddingHorizontal: 12 },
  title: { fontSize: 16, fontWeight: '600', textAlign: 'center', marginBottom: 6 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 10, borderRadius: 10, backgroundColor: '#F7F8FA' },
  emoji: { fontSize: 18, width: 28, textAlign: 'center' },
  name: { fontSize: 16, flexShrink: 1 },
  active: { opacity: 0.5 },
  cancel: { alignSelf: 'center', paddingVertical: 10, paddingHorizontal: 20, marginTop: 8 },
  cancelText: { fontSize: 16, color: '#666' },
  pressed: { opacity: 0.6 },
  emptyBox: { paddingVertical: 16, alignItems: 'center' },
  emptyText: { color: '#666' },
});
