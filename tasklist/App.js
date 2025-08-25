// ВАЖНО: gesture-handler должен инициализироваться первым
import 'react-native-gesture-handler';

import React, { Component, useMemo } from 'react';
import { Platform, View, Text, StyleSheet, Pressable } from 'react-native';

// ✅ На native Reanimated обязателен, на web — отключаем
if (Platform.OS !== 'web') {
  // eslint-disable-next-line global-require
  require('react-native-reanimated');
}

import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import TasksScreen from './screens/TasksScreen';
import DrawerProjects from './components/DrawerProjects';
import { useTasks } from './store/useTasks';

const Drawer = createDrawerNavigator();

const navTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: '#fff' },
};

// Плашка выбора проекта в шапке
function ProjectHeaderChip({ onPress }) {
  const { selectedProjectId, projects } = useTasks();
  const current = useMemo(
    () => projects.find((p) => p.id === selectedProjectId) || projects[0],
    [projects, selectedProjectId]
  );

  return (
    <Pressable onPress={onPress} hitSlop={8} style={({ pressed }) => [
      styles.chip,
      pressed && { opacity: 0.7 },
    ]}>
      <Text style={styles.chipText}>
        {(current?.emoji ?? '📁') + ' ' + (current?.name ?? 'Проекты')}
      </Text>
    </Pressable>
  );
}

// Простой ErrorBoundary, чтобы вместо белого экрана видеть ошибку
class AppErrorBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    console.error('App error:', error, info);
  }
  render() {
    if (this.state.error) {
      return (
        <View style={styles.errWrap}>
          <Text style={styles.errTitle}>Что-то пошло не так</Text>
          <Text style={styles.errMsg}>
            {String(this.state.error?.message || this.state.error)}
          </Text>
          <Text style={styles.errSub}>
            Открой DevTools (F12 → Console) для деталей.
          </Text>
        </View>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppErrorBoundary>
          <NavigationContainer theme={navTheme}>
            <Drawer.Navigator
              initialRouteName="Tasks"
              screenOptions={{
                headerTitle: 'TaskList',
                headerShadowVisible: false,
              }}
              drawerContent={(props) => <DrawerProjects {...props} />}
            >
              <Drawer.Screen
                name="Tasks"
                component={TasksScreen}
                options={({ navigation }) => ({
                  // ← Плашка выбора проекта в шапке
                  headerLeft: () => (
                    <ProjectHeaderChip onPress={() => navigation.openDrawer()} />
                  ),
                })}
              />
            </Drawer.Navigator>
          </NavigationContainer>
        </AppErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  errWrap: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    padding: 16, backgroundColor: '#fff'
  },
  errTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  errMsg: { fontSize: 14, color: '#b00020', textAlign: 'center' },
  errSub: { fontSize: 12, color: '#666', marginTop: 12, textAlign: 'center' },

  // стиль плашки в шапке
  chip: {
    marginLeft: 12,
    backgroundColor: '#F2F3F5',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipText: {
    fontSize: 14,
    color: '#111',
    fontWeight: '600',
  },
});
