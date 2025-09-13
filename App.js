// ВАЖНО: gesture-handler должен инициализироваться первым
import 'react-native-gesture-handler';

import React, { Component, useMemo } from 'react';
import { Platform, View, Text, StyleSheet, Pressable, Alert } from 'react-native';

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
import AuthScreen from './screens/AuthScreen';
import { onAuthStateChange, signOut } from './src/services/auth';

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

// Компонент меню пользователя (иконка в правом верхнем углу)
function UserMenu({ userId, email, onSignOut }) {
  // Для web: показываем всплывающее меню при клике/наведении
  if (Platform.OS === 'web') {
    const [open, setOpen] = React.useState(false);
    const ref = React.useRef(null);
    // Закрывать при клике вне
    React.useEffect(() => {
      function onDoc(e) {
        if (ref.current && !ref.current.contains(e.target)) setOpen(false);
      }
      document.addEventListener('mousedown', onDoc);
      return () => document.removeEventListener('mousedown', onDoc);
    }, []);

    return (
      <View ref={ref} style={{ marginRight: 12 }}>
        <Pressable onPress={() => setOpen(s => !s)} hitSlop={8} style={({ pressed }) => [{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F2F3F5' }, pressed && { opacity: 0.75 }]}>
          <Text style={{ fontSize: 16, lineHeight: 18 }}>{userId ? '👤' : '🔒'}</Text>
        </Pressable>
        {open && (
          <View style={{ position: 'fixed', right: 12, top: 56, backgroundColor: '#fff', borderRadius: 10, padding: 10, borderWidth: StyleSheet.hairlineWidth, borderColor: '#E6E6E6', boxShadow: '0 10px 30px rgba(0,0,0,0.12)' }}>
            <Text style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>Signed in as</Text>
            <Text style={{ fontSize: 14, fontWeight: '700', marginBottom: 8 }}>{email || userId || '—'}</Text>
            <Pressable onPress={onSignOut} style={({ pressed }) => [{ paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, backgroundColor: '#F2F3F5' }, pressed && { opacity: 0.8 }]}>
              <Text style={{ fontWeight: '700' }}>Log out</Text>
            </Pressable>
          </View>
        )}
      </View>
    );
  }

  // На native: просто показываем иконку, при нажатии — Alert с подтверждением выхода
  const onPressNative = () => {
    Alert.alert('Account', userId ? `Signed in as ${email || userId}` : 'Not signed in', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: onSignOut },
    ]);
  };

  return (
    <Pressable onPress={onPressNative} hitSlop={8} style={({ pressed }) => [
      {
        marginRight: 12,
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F2F3F5',
      },
      pressed && { opacity: 0.75 },
    ]}>
      <Text style={{ fontSize: 16, lineHeight: 18 }}>{userId ? '👤' : '🔒'}</Text>
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
  const setUser = useTasks((s) => s.setUser);

  React.useEffect(() => {
    const sub = onAuthStateChange(setUser);
    // supabase onAuthStateChange returns { data: { subscription } } in newer clients
    return () => { try { sub?.data?.subscription?.unsubscribe?.(); } catch {} };
  }, [setUser]);

  const userId = useTasks((s) => s.userId);
  const userEmail = useTasks((s) => s.userEmail);

  const doSignOut = async () => {
    try {
      await signOut();
    } catch (e) {
      console.warn('signOut failed', e?.message || e);
    }
  };

  if (!userId) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <AppErrorBoundary>
            <AuthScreen />
          </AppErrorBoundary>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }

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
                headerRight: () => (
                  <UserMenu userId={userId} email={userEmail} onSignOut={doSignOut} />
                ),
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
