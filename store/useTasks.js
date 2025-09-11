import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as tasksService from '../src/services/tasks';

/** ===== helpers ===== */
const mapQuadrant = {
  uv: { important: true,  urgent: true  },   // важно + срочно (розовый/красный)
  v:  { important: true,  urgent: false },   // важно (жёлтый)
  u:  { important: false, urgent: true  },   // срочно (голубой)
  o:  { important: false, urgent: false },   // остальное (зелёный)
};
export const qKeyOf = (t) =>
  (t.important && t.urgent) ? 'uv' :
  (t.important && !t.urgent) ? 'v'  :
  (!t.important && t.urgent) ? 'u'  : 'o';

const makeId = () => `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

const priorityScore = (t) => (t.important && t.urgent ? 2 : (t.important || t.urgent ? 1 : 0));

/** сортировка: незавершённые ↑, приоритет ↑, новые ↑ */
export const sortTasks = (a, b) => {
  if (!!a.done !== !!b.done) return a.done ? 1 : -1;
  const pa = priorityScore(a), pb = priorityScore(b);
  if (pa !== pb) return pb - pa;
  const da = new Date(a.createdAt || 0), db = new Date(b.createdAt || 0);
  return db - da;
};

const safeWebStorage = () => {
  try { if (typeof window !== 'undefined' && window.localStorage) return window.localStorage; } catch {}
  return { getItem: async () => null, setItem: async () => {}, removeItem: async () => {} };
};

export const useTasks = create(
  persist(
    (set, get) => ({
  // ===== remote sync fields =====
  userId: null,
  loading: false,
      /** ===== модель ===== */
      projects: [
        { id: 'all',   name: 'Все',       emoji: '📁' },
        { id: 'inbox', name: 'Входящие',  emoji: '🪄' },
      ],
      selectedProjectId: 'all',
      viewMode: 'list', // 'list' | 'matrix'

      filterImportant: false,
      filterUrgent: false,

      tasks: [
        // пустой по умолчанию; локальные данные сохраняются через persist
      ],

      _lastDeleted: null,

      /** ===== actions ===== */
      setSelectedProject: (projectId) => set({ selectedProjectId: projectId || 'all' }),
      setViewMode: (mode) => set({ viewMode: mode }),

      setFilterImportant: (v) => set({ filterImportant: !!v }),
      setFilterUrgent: (v) => set({ filterUrgent: !!v }),

      addTask: async (title, opts = {}) => {
        const t = (title || '').trim();
        if (!t) return;
        const patch = opts.quadrant && mapQuadrant[opts.quadrant] ? mapQuadrant[opts.quadrant] : {};
        const localTask = {
          id: makeId(),
          title: t,
          important: !!patch.important,
          urgent: !!patch.urgent,
          done: false,
          projectId: opts.projectId || get().selectedProjectId || 'inbox',
          createdAt: new Date().toISOString(),
        };
        // optimistic local insert
        set((s) => ({ tasks: [localTask, ...s.tasks] }));
        // if user is logged in, try to create remotely and replace local id
        try {
          if (get().userId) {
            const created = await tasksService.createTask({ ...localTask, user_id: get().userId });
            set((s) => ({ tasks: s.tasks.map(x => x.id === localTask.id ? created : x) }));
          }
        } catch (e) {
          console.warn('remote create failed', e.message || e);
        }
      },

      editTitle: (id, title) => set((s) => ({
        tasks: s.tasks.map(t => (t.id === id ? { ...t, title: (title || '').trim() } : t)),
      })),
      toggleDone: async (id) => {
        // optimistic
        const prev = get().tasks.find(t => t.id === id);
        if (!prev) return;
        set((s) => ({ tasks: s.tasks.map(t => (t.id === id ? { ...t, done: !t.done } : t)) }));
        try {
          if (get().userId) {
            await tasksService.updateTask(id, { done: !prev.done });
          }
        } catch (e) {
          console.warn('remote update failed', e.message || e);
        }
      },
      deleteTask: async (id) => {
        const victim = get().tasks.find(t => t.id === id) || null;
        set((s) => ({ tasks: s.tasks.filter(t => t.id !== id), _lastDeleted: victim }));
        try {
          if (get().userId) {
            await tasksService.deleteTask(id);
          }
        } catch (e) {
          console.warn('remote delete failed', e.message || e);
        }
      },
      undoDelete: () => set((s) => (s._lastDeleted ? { tasks: [s._lastDeleted, ...s.tasks], _lastDeleted: null } : {})),
      moveBetweenProjects: (id, projectId) => set((s) => ({ tasks: s.tasks.map(t => (t.id === id ? { ...t, projectId } : t)) })),
      moveToQuadrant: (id, qKey) => set((s) => {
        const patch = mapQuadrant[qKey]; if (!patch) return {};
        return { tasks: s.tasks.map(t => (t.id === id ? { ...t, ...patch } : t)) };
      }),

      /** ручное упорядочивание через createdAt */
      setCreatedAt: (id, iso) => set((s) => ({ tasks: s.tasks.map(t => (t.id === id ? { ...t, createdAt: iso } : t)) })),

      /** ===== проекты ===== */
      // ====== remote sync methods =====
      setUser: (uid) => {
        set({ userId: uid });
        if (uid) {
          get().loadRemote();
        }
      },

      loadRemote: async () => {
        set({ loading: true });
        try {
          const remote = await tasksService.fetchTasks();
          // simple replace strategy: overwrite local tasks with remote (could be merged)
          set({ tasks: remote, loading: false });
        } catch (e) {
          console.warn('loadRemote failed', e.message || e);
          set({ loading: false });
        }
      },
      addProject: (name, emoji = '📁') => set((s) => {
        const n = (name || '').trim(); if (!n) return {};
        const newId = `prj_${makeId()}`;
        return { projects: [...s.projects, { id: newId, name: n, emoji }] };
      }),
      renameProject: (id, name, emoji) => set((s) => ({
        projects: s.projects.map(p => (p.id === id ? { ...p, name: name ?? p.name, emoji: emoji ?? p.emoji } : p)),
      })),
      deleteProject: (id) => set((s) => {
        if (id === 'all' || id === 'inbox') return {}; // системные
        const fallback = 'inbox';
        const projects = s.projects.filter(p => p.id !== id);
        const tasks = s.tasks.map(t => (t.projectId === id ? { ...t, projectId: fallback } : t));
        const selectedProjectId = s.selectedProjectId === id ? 'all' : s.selectedProjectId;
        return { projects, tasks, selectedProjectId };
      }),
    }),
    {
      name: '@tasklist/state:v3',
      storage: createJSONStorage(() => (Platform.OS === 'web' ? safeWebStorage() : AsyncStorage)),
      partialize: (s) => ({
        tasks: s.tasks,
        projects: s.projects,
        selectedProjectId: s.selectedProjectId,
        viewMode: s.viewMode,
        filterImportant: s.filterImportant,
        filterUrgent: s.filterUrgent,
      }),
    }
  )
);
