import React from 'react';
import { TouchableOpacity, StyleSheet, Platform, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function Fab({ onPress, bottom = 24 }) {
  return (
    <View pointerEvents="box-none" style={[StyleSheet.absoluteFill]}>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.9}
        style={[styles.fab, { bottom }]}
      >
        <MaterialCommunityIcons name="plus" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    ...(Platform.OS === 'android' ? { elevation: 12 } : {}),
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
});
