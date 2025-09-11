import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'tasklist:v1';

export async function loadTasks() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.warn('loadTasks error', e);
    return [];
  }
}

export async function saveTasks(tasks) {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(tasks));
  } catch (e) {
    console.warn('saveTasks error', e);
  }
}
