import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTasks, selectStats } from '../store/useTasks';

export default function HeaderProgress() {
  const { done, total, pct } = useTasks(selectStats);

  const label = useMemo(() => `Progress ${done}/${total}`, [done, total]);

  return (
    <View style={s.wrap}>
      <Text style={s.label}>{label}</Text>
      <View style={s.bar}><View style={[s.fill, { width: `${pct}%` }]} /></View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { fontSize: 12, color: '#555' },
  bar: {
    width: 120,
    height: 6,
    borderRadius: 999,
    backgroundColor: '#EEE',
    overflow: 'hidden',
  },
  fill: { height: '100%', backgroundColor: '#111' },
});
