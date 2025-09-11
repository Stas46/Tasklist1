import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
        // сид пуст
      ],

      _lastDeleted: null,

      /** ===== actions ===== */
      setSelectedProject: (projectId) => set({ selectedProjectId: projectId || 'all' }),
      setViewMode: (mode) => set({ viewMode: mode }),

      setFilterImportant: (v) => set({ filterImportant: !!v }),
      setFilterUrgent: (v) => set({ filterUrgent: !!v }),

      addTask: (title, opts = {}) => set((s) => {
        const t = (title || '').trim();
        if (!t) return {};
        const patch = opts.quadrant && mapQuadrant[opts.quadrant] ? mapQuadrant[opts.quadrant] : {};
        const task = {
          id: makeId(),
          title: t,
          important: !!patch.important,
          urgent: !!patch.urgent,
          done: false,
          projectId: opts.projectId || s.selectedProjectId || 'inbox',
          createdAt: new Date().toISOString(),
        };
        return { tasks: [task, ...s.tasks] };
      }),

      editTitle: (id, title) => set((s) => ({
        tasks: s.tasks.map(t => (t.id === id ? { ...t, title: (title || '').trim() } : t)),
      })),
      toggleDone: (id) => set((s) => ({ tasks: s.tasks.map(t => (t.id === id ? { ...t, done: !t.done } : t)) })),
      deleteTask: (id) => set((s) => {
        const victim = s.tasks.find(t => t.id === id) || null;
        return { tasks: s.tasks.filter(t => t.id !== id), _lastDeleted: victim };
      }),
      undoDelete: () => set((s) => (s._lastDeleted ? { tasks: [s._lastDeleted, ...s.tasks], _lastDeleted: null } : {})),
      moveBetweenProjects: (id, projectId) => set((s) => ({ tasks: s.tasks.map(t => (t.id === id ? { ...t, projectId } : t)) })),
      moveToQuadrant: (id, qKey) => set((s) => {
        const patch = mapQuadrant[qKey]; if (!patch) return {};
        return { tasks: s.tasks.map(t => (t.id === id ? { ...t, ...patch } : t)) };
      }),

      /** ручное упорядочивание через createdAt */
      setCreatedAt: (id, iso) => set((s) => ({ tasks: s.tasks.map(t => (t.id === id ? { ...t, createdAt: iso } : t)) })),

      /** ===== проекты ===== */
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
