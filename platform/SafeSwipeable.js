import React from 'react';
import { Platform, View } from 'react-native';
import { Swipeable as RNSwipeable } from 'react-native-gesture-handler';

/**
 * На native используем Swipeable,
 * на web — просто контейнер без свайпов (чтобы не падало).
 */
export default function SafeSwipeable(props) {
  if (Platform.OS === 'web') {
    return <View>{props.children}</View>;
  }
  return <RNSwipeable {...props}>{props.children}</RNSwipeable>;
}
