import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, Alert, Platform } from 'react-native';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTasks } from '../store/useTasks';

export default function DrawerProjects(props) {
  const insets = useSafeAreaInsets();
  const {
    projects,
    selectedProjectId,
    selectProject,
    addProject,
    renameProject,
    removeProject,
  } = useTasks();

  const systemIds = useMemo(() => new Set(['all', 'inbox']), []);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState('');

  const closeDrawer = () => props.navigation?.closeDrawer?.();

  const onSelect = (id) => {
    selectProject(id);
    closeDrawer();
  };

  const submitAdd = () => {
    const name = newName.trim();
    if (!name) return;
    addProject(name, '📁');
    setNewName('');
    setAdding(false);
  };

  const startRename = (id, name) => {
    setRenamingId(id);
    setRenameValue(name);
  };

  const submitRename = () => {
    const name = renameValue.trim();
    if (!name || !renamingId) return setRenamingId(null);
    renameProject(renamingId, name);
    setRenamingId(null);
    setRenameValue('');
  };

  const onDelete = (id) => {
    Alert.alert('Удалить проект?', 'Задачи будут перенесены во «Входящие».', [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Удалить', style: 'destructive', onPress: () => removeProject(id) },
    ]);
  };

  return (
    <DrawerContentScrollView
      {...props}
      contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 16 }}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Проекты</Text>
      </View>

      <View style={{ paddingHorizontal: 12, paddingBottom: 12 }}>
        {projects.map((item) => {
          const active = item.id === selectedProjectId;
          const isSystem = systemIds.has(item.id);
          return (
            <View key={item.id} style={{ marginBottom: 6 }}>
              <View style={styles.rowWrap}>
                <Pressable
                  onPress={() => onSelect(item.id)}
                  style={[styles.row, active && styles.rowActive]}
                >
                  <Text style={styles.emoji}>
                    {item.emoji ?? (item.id === 'inbox' ? '📥' : '🗂️')}
                  </Text>

                  {renamingId === item.id ? (
                    <TextInput
                      value={renameValue}
                      onChangeText={setRenameValue}
                      onBlur={submitRename}
                      onSubmitEditing={submitRename}
                      autoFocus
                      style={styles.renameInput}
                    />
                  ) : (
                    <Text style={[styles.name, active && styles.nameActive]} numberOfLines={1}>
                      {item.name}
                    </Text>
                  )}
                </Pressable>

                {!isSystem && renamingId !== item.id && (
                  <View style={styles.actions}>
                    <Pressable onPress={() => startRename(item.id, item.name)} hitSlop={8} style={styles.actionBtn}>
                      <Text style={styles.actionText}>✏️</Text>
                    </Pressable>
                    <Pressable onPress={() => onDelete(item.id)} hitSlop={8} style={styles.actionBtn}>
                      <Text style={[styles.actionText, { color: '#C30000' }]}>🗑️</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            </View>
          );
        })}
      </View>

      <View style={styles.addBox}>
        {adding ? (
          <View style={styles.addRow}>
            <TextInput
              value={newName}
              onChangeText={setNewName}
              placeholder="Название проекта"
              autoFocus
              style={styles.addInput}
              onSubmitEditing={submitAdd}
              returnKeyType="done"
            />
            <Pressable onPress={submitAdd} style={[styles.addBtn, styles.addPrimary]}>
              <Text style={{ color: '#fff' }}>Добавить</Text>
            </Pressable>
            <Pressable onPress={() => { setAdding(false); setNewName(''); }} style={styles.addBtn}>
              <Text>Отмена</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable onPress={() => setAdding(true)} style={styles.addProject}>
            <Text style={styles.addPlus}>＋</Text>
            <Text style={styles.addText}>Новый проект</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.footer}>
        <Text style={styles.hint}>Долгий тап по карточке — сменить квадрант. Тап по названию — редактировать.</Text>
      </View>
    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 12, marginBottom: 8 },
  title: { fontSize: 18, fontWeight: '700' },

  rowWrap: { flexDirection: 'row', alignItems: 'center', paddingRight: 6 },
  row: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 10,
    backgroundColor: '#F7F8FA',
    borderRadius: 12,
  },
  rowActive: { backgroundColor: '#111' },
  emoji: { fontSize: 18, width: 28, textAlign: 'center' },
  name: { fontSize: 16, color: '#333', flexShrink: 1 },
  nameActive: { color: '#fff' },

  actions: { flexDirection: 'row', gap: 6, marginLeft: 6 },
  actionBtn: {
    paddingVertical: 6, paddingHorizontal: 8, borderRadius: 8,
    backgroundColor: Platform.select({ ios: '#EFEFF2', android: '#EFEFF2' }),
  },
  actionText: { fontSize: 14, color: '#333' },

  addBox: { paddingHorizontal: 12, marginTop: 8 },
  addProject: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 10, paddingHorizontal: 10, backgroundColor: '#F2F3F5', borderRadius: 12,
  },
  addPlus: { fontSize: 18 },
  addText: { fontSize: 16 },

  addRow: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  addInput: {
    flex: 1, borderRadius: 10, borderWidth: StyleSheet.hairlineWidth, borderColor: '#D9D9DF',
    paddingHorizontal: 10, paddingVertical: Platform.select({ ios: 10, android: 8 }), backgroundColor: '#fff',
  },
  addBtn: { paddingVertical: 8, paddingHorizontal: 10, borderRadius: 10, backgroundColor: '#F2F3F5' },
  addPrimary: { backgroundColor: '#111' },

  footer: { paddingHorizontal: 12, marginTop: 12 },
  hint: { fontSize: 12, color: '#666' },
});
