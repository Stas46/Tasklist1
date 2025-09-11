import React from 'react';
import { TouchableOpacity, StyleSheet, Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function Fab({ onPress, bottom }) {
  const insets = useSafeAreaInsets();
  const effectiveBottom = typeof bottom === 'number' ? bottom : (insets.bottom ? insets.bottom + 12 : 24);
  return (
    <View pointerEvents="box-none" style={[StyleSheet.absoluteFill]}>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.9}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        style={[styles.fab, { bottom: effectiveBottom }]}
      >
        <MaterialCommunityIcons name="plus" size={26} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 18,
    width: 52,
    height: 52,
    borderRadius: 26,
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
