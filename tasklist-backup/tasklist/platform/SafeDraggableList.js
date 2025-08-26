import React from 'react';
import { Platform, FlatList } from 'react-native';
import DraggableFlatList from 'react-native-draggable-flatlist';

/**
 * На web — обычный FlatList без dnd,
 * чтобы структура и рендер совпадали с native.
 */
export default function SafeDraggableList({ data, keyExtractor, renderItem, contentContainerStyle, onDragEnd, ...rest }) {
  if (Platform.OS === 'web') {
    return (
      <FlatList
        data={data}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={contentContainerStyle}
        {...rest}
      />
    );
  }
  return (
    <DraggableFlatList
      data={data}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      onDragEnd={onDragEnd}
      contentContainerStyle={contentContainerStyle}
      {...rest}
    />
  );
}
