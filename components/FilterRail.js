import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useTasks } from '../store/useTasks';

export default function FilterRail() {
  const {
    viewMode, setViewMode,
    filterImportant, setFilterImportant,
    filterUrgent, setFilterUrgent,
    compactMode, setCompactMode,
  } = useTasks();

  const isMatrix = viewMode === 'matrix';
  return (
    <View style={[s.wrap, isMatrix && s.noWrap]}>
      <View style={s.left}>
        <Segment
          active={viewMode === 'list'}
          label="Список"
          onPress={() => setViewMode('list')}
        />
        <Segment
          active={viewMode === 'matrix'}
          label="Матрица"
          onPress={() => setViewMode('matrix')}
        />
      </View>

      {isMatrix ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.right}>
          <Pill
            active={!!compactMode}
            label="🧩 Компактно"
            onPress={() => setCompactMode(!compactMode)}
          />
          <Pill
            active={!!filterImportant}
            label="⭐ Важно"
            onPress={() => setFilterImportant(!filterImportant)}
          />
          <Pill
            active={!!filterUrgent}
            label="⚡ Срочно"
            onPress={() => setFilterUrgent(!filterUrgent)}
          />
        </ScrollView>
      ) : (
        <View style={[s.right, { flexWrap: 'wrap' }]}>
          <Pill
            active={!!compactMode}
            label="🧩 Компактно"
            onPress={() => setCompactMode(!compactMode)}
          />
          <Pill
            active={!!filterImportant}
            label="⭐ Важно"
            onPress={() => setFilterImportant(!filterImportant)}
          />
          <Pill
            active={!!filterUrgent}
            label="⚡ Срочно"
            onPress={() => setFilterUrgent(!filterUrgent)}
          />
        </View>
      )}
    </View>
  );
}

function Segment({ active, label, onPress }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [
      s.segment,
      active && s.segmentOn,
      pressed && { opacity: 0.7 },
    ]}>
      <Text style={[s.segmentText, active && s.segmentTextOn]}>{label}</Text>
    </Pressable>
  );
}

function Pill({ active, label, onPress }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [
      s.pill,
      active && s.pillOn,
      pressed && { opacity: 0.7 },
    ]}>
      <Text style={[s.pillText, active && s.pillTextOn]}>{label}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 10,
    flexWrap: 'wrap',
  },
  noWrap: { flexWrap: 'nowrap' },
  left: { flexDirection: 'row', gap: 8, flexShrink: 0 },
  right: { flexDirection: 'row', gap: 8, flexShrink: 1, alignItems: 'center' },

  segment: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#F2F3F5',
  },
  segmentOn: { backgroundColor: '#111' },
  segmentText: { fontSize: 13, color: '#333', fontWeight: '600' },
  segmentTextOn: { color: '#fff' },

  pill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#F2F3F5',
  },
  pillOn: { backgroundColor: '#111', borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)' },
  pillText: { fontSize: 12, color: '#333', fontWeight: '600' },
  pillTextOn: { color: '#fff' },
});
