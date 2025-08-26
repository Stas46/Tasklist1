import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

const mapQuadrant = {
  uv: { important: true,  urgent: true  },
  v:  { important: true,  urgent: false },
  u:  { important: false, urgent: true  },
  o:  { important: false, urgent: false },
};

export const useTasks = create(
  persist(
    (set, get) => ({
      projects: [
        { id: 'all',     name: 'Все',       emoji: '🗂️' },
        { id: 'inbox',   name: 'Входящие',  emoji: '📥' },
      ],
      selectedProjectId: 'all',
      tasks: [],

      // ====== ПРОЕКТЫ ======
      selectProject: (id) => set({ selectedProjectId: id }),
      addProject: (name, emoji = '📁') => set((s) => {
        const id = Math.random().toString(36).slice(2);
        return { projects: [...s.projects, { id, name, emoji }] };
      }),
      renameProject: (id, name) => set((s) => ({ projects: s.projects.map(p => p.id === id ? { ...p, name } : p) })),
      removeProject: (id) => set((s) => {
        if (id === 'all' || id === 'inbox') return {};
        return {
          projects: s.projects.filter(p => p.id !== id),
          tasks: s.tasks.map(t => t.projectId === id ? { ...t, projectId: 'inbox' } : t),
          selectedProjectId: s.selectedProjectId === id ? 'all' : s.selectedProjectId,
        };
      }),

      // ====== ТАСКИ ======
      filteredTasks: () => {
        const pid = get().selectedProjectId;
        const all = get().tasks;
        const filtered = pid === 'all' ? all : all.filter(t => t.projectId === pid);
        
        // Sort by: done status, then by importance/urgency, then by creation date
        return filtered.sort((a, b) => {
          // Done tasks go to bottom
          if (a.done !== b.done) return a.done ? 1 : -1;
          
          // Priority sorting for pending tasks
          if (!a.done && !b.done) {
            const aPriority = (a.important ? 2 : 0) + (a.urgent ? 1 : 0);
            const bPriority = (b.important ? 2 : 0) + (b.urgent ? 1 : 0);
            if (aPriority !== bPriority) return bPriority - aPriority;
          }
          
          // Sort by creation date (newest first)
          return new Date(b.createdAt) - new Date(a.createdAt);
        });
      },

      getTask: (id) => get().tasks.find(t => t.id === id),

      addTask: ({ title, urgent = false, important = false, projectId = 'inbox' }) =>
        set((s) => ({
          tasks: [
            {
              id: Math.random().toString(36).slice(2),
              title,
              notes: '',
              urgent,
              important,
              done: false,
              projectId,
              createdAt: new Date().toISOString(),
            },
            ...s.tasks,
          ],
        })),

      // точечное восстановление (для Undo — сохраняем тот же id)
      restoreTask: (task) => set((s) => ({ tasks: [task, ...s.tasks] })),

      editTitle: (id, title) => set((s) => ({ tasks: s.tasks.map(t => t.id === id ? { ...t, title } : t) })),
      toggleDone: (id) => set((s) => ({ tasks: s.tasks.map(t => t.id === id ? { ...t, done: !t.done } : t) })),
      removeTask: (id) => set((s) => ({ tasks: s.tasks.filter(t => t.id !== id) })),
      moveBetweenProjects: (id, projectId) => set((s) => ({ tasks: s.tasks.map(t => t.id === id ? { ...t, projectId } : t) })),
      moveToQuadrant: (id, qKey) => set((s) => {
        const patch = mapQuadrant[qKey];
        if (!patch) return {};
        return { tasks: s.tasks.map(t => t.id === id ? { ...t, ...patch } : t) };
      }),
    }),
    {
      name: '@tasklist/state:v2',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ tasks: s.tasks, projects: s.projects, selectedProjectId: s.selectedProjectId }),
    }
  )
);
