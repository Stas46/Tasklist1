import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform } from 'react-native';

const FILTERS = [
  { k: 'all',      l: 'Все' },
  { k: 'today',    l: 'Сегодня' },
  { k: 'tomorrow', l: 'Завтра' },
  { k: 'week',     l: 'Неделя' },
  { k: 'month',    l: 'Месяц' },
  { k: 'done',     l: 'Готово' },
  { k: 'important', l: 'Важные' },
  { k: 'urgent',   l: 'Срочные' },
];

export default function FilterRail({ current, onChange }) {
  return (
    <View style={styles.rail}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.railContent}
      >
        {FILTERS.map(f => {
          const active = current === f.k;
          return (
            <TouchableOpacity
              key={f.k}
              onPress={() => onChange(f.k)}
              style={[styles.chip, active && styles.chipActive]}
              activeOpacity={0.8}
            >
              <Text style={active ? styles.chipTextActive : styles.chipText}>
                {f.l}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  rail: {
    width: 112,
    paddingVertical: 10,
    paddingHorizontal: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ECEFF3',
    position: 'relative', // важно: не absolute
    flexShrink: 0,
    ...(Platform.OS === 'web' ? {
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    } : {}),
  },
  railContent: {
    gap: 8,
    paddingBottom: 8,
  },
  chip: {
    borderWidth: 1,
    borderColor: '#E7EAEE',
    backgroundColor: '#F6F8FA',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  chipActive: {
    backgroundColor: '#111',
    borderColor: '#111',
  },
  chipText: {
    fontSize: 13,
    color: '#333',
    fontWeight: '600',
  },
  chipTextActive: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '800',
  },
});
