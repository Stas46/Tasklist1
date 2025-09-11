// components/DrawerProjects.js
import React, { useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList, Platform, Alert } from 'react-native';
import { useTasks } from '../store/useTasks';

export default function DrawerProjects({ navigation }) {
  const projects = useTasks((s) => s.projects);
  const currentId = useTasks((s) => s.selectedProjectId);
  const setSelectedProject = useTasks((s) => s.setSelectedProject);
  const addProject = useTasks((s) => s.addProject);
  const renameProject = useTasks((s) => s.renameProject);
  const deleteProject = useTasks((s) => s.deleteProject);

  const handleSelect = useCallback((id) => {
    setSelectedProject(id);
    navigation?.closeDrawer?.();
  }, [setSelectedProject, navigation]);

  const askNewProject = useCallback(() => {
    if (Platform.OS === 'web') {
      const name = window.prompt('Название проекта');
      if (name && name.trim()) addProject(name.trim());
    } else {
      Alert.prompt?.('Новый проект', undefined, (text) => {
        if (text && text.trim()) addProject(text.trim());
      });
    }
  }, [addProject]);

  const askRename = useCallback((p) => {
    if (p.id === 'all' || p.id === 'inbox') return; // системные
    if (Platform.OS === 'web') {
      const name = window.prompt('Переименовать проект', p.name);
      if (name && name.trim()) renameProject(p.id, name.trim());
    } else {
      Alert.prompt?.('Переименовать проект', undefined, (text) => {
        if (text && text.trim()) renameProject(p.id, text.trim());
      }, undefined, p.name);
    }
  }, [renameProject]);

  const askDelete = useCallback((p) => {
    if (p.id === 'all' || p.id === 'inbox') return;
    if (Platform.OS === 'web') {
      if (window.confirm(`Удалить проект «${p.name}»? Задачи будут перемещены во «Входящие».`)) {
        deleteProject(p.id);
      }
    } else {
      Alert.alert('Удалить проект', `Задачи будут перемещены во «Входящие».`, [
        { text: 'Отмена', style: 'cancel' },
        { text: 'Удалить', style: 'destructive', onPress: () => deleteProject(p.id) },
      ]);
    }
  }, [deleteProject]);

  const renderItem = ({ item }) => {
    const active = item.id === currentId;
    return (
      <View style={styles.row}>
        <Pressable
          onPress={() => handleSelect(item.id)}
          style={({ pressed }) => [styles.item, active && styles.itemActive, pressed && { opacity: 0.85 }]}
          hitSlop={6}
        >
          <Text style={styles.emoji}>{item.emoji ?? '📁'}</Text>
          <Text style={[styles.title, active && styles.titleActive]}>{item.name}</Text>
        </Pressable>

        {/* кнопка «⋯» для редактирования обычных проектов */}
        {item.id !== 'all' && item.id !== 'inbox' && (
          <Pressable
            onPress={() => askRename(item)}
            onLongPress={() => askDelete(item)}
            hitSlop={6}
            style={({ pressed }) => [styles.kebab, pressed && { opacity: 0.7 }]}
          >
            <Text style={styles.kebabText}>⋯</Text>
          </Pressable>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Проекты</Text>

      <Pressable onPress={askNewProject} style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.8 }]}>
        <Text style={styles.addIcon}>＋</Text>
        <Text style={styles.addText}>Новый проект</Text>
      </Pressable>

      <FlatList
        data={projects}
        keyExtractor={(p) => p.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingVertical: 8 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 16, paddingHorizontal: 12, backgroundColor: '#fff' },
  header: { fontSize: 16, fontWeight: '700', color: '#111', marginBottom: 8 },

  addBtn: {
    alignSelf: 'flex-start',
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F2F3F5',
    borderRadius: 12, paddingVertical: 8, paddingHorizontal: 10,
    marginBottom: 8,
  },
  addIcon: { fontSize: 16, marginRight: 6, color: '#111' },
  addText: { fontSize: 14, color: '#111', fontWeight: '700' },

  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  item: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 12, paddingVertical: 10, paddingHorizontal: 10, marginVertical: 4,
    flex: 1,
  },
  itemActive: { backgroundColor: '#F2F3F5' },
  emoji: { fontSize: 16, marginRight: 8 },
  title: { fontSize: 14, color: '#333', fontWeight: '600' },
  titleActive: { color: '#111' },

  kebab: { padding: 8, marginLeft: 6, borderRadius: 8 },
  kebabText: { fontSize: 18, color: '#666', lineHeight: 18 },
});
