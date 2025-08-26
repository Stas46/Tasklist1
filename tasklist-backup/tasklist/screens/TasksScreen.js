import React, { useMemo, useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Platform } from 'react-native';
import SafeDraggableList from '../platform/SafeDraggableList';

import { useTasks } from '../store/useTasks';
import TaskItem from '../components/TaskItem';
import QuadrantPickerModal from '../components/QuadrantPickerModal';
import ProjectPickerModal from '../components/ProjectPickerModal';
import AddTaskSheet from '../components/AddTaskSheet';
import Fab from '../components/Fab';

export default function TasksScreen() {
  const {
    filteredTasks,
    selectedProjectId,
    projects,
    toggleDone,
    moveToQuadrant,
    moveBetweenProjects,
    addTask,
    editTitle,
    removeTask,
    getTask,
    restoreTask,
  } = useTasks();

  const [mode, setMode] = useState('list');
  const visibleTasks = filteredTasks();

  // Task statistics
  const stats = useMemo(() => {
    const total = visibleTasks.length;
    const done = visibleTasks.filter(t => t.done).length;
    const pending = total - done;
    return { total, done, pending };
  }, [visibleTasks]);

  const quad = useMemo(() => {
    const res = { uv: [], v: [], u: [], o: [] };
    for (const t of visibleTasks) {
      const key =
        t.important && t.urgent ? 'uv' :
        t.important && !t.urgent ? 'v' :
        !t.important && t.urgent ? 'u' : 'o';
      res[key].push(t);
    }
    return res;
  }, [visibleTasks]);

  const listData = useMemo(() => {
    const build = (sec, title) => ([
      { type: 'header', key: `h-${sec}`, sec, title },
      ...quad[sec].map(t => ({ type: 'task', key: t.id, task: t }))
    ]);
    return [
      ...build('uv', '⭐⚡ Важно и срочно'),
      ...build('v',  '⭐ Важно, не срочно'),
      ...build('u',  '⚡ Срочно, не важно'),
      ...build('o',  '🕒 Не важно, не срочно'),
    ];
  }, [quad]);

  const projectMap = useMemo(() => {
    const m = {};
    for (const p of projects) m[p.id] = { name: p.name, emoji: p.emoji };
    return m;
  }, [projects]);

  const [qpVisible, setQpVisible] = useState(false);
  const [qpTaskId, setQpTaskId] = useState(null);
  const openQuadrantPicker = useCallback((taskId) => { setQpTaskId(taskId); setQpVisible(true); }, []);
  const closeQuadrantPicker = useCallback(() => { setQpVisible(false); setQpTaskId(null); }, []);
  const handleSelectQuadrant = useCallback((qKey) => {
    if (qpTaskId) moveToQuadrant(qpTaskId, qKey);
    closeQuadrantPicker();
  }, [qpTaskId, moveToQuadrant, closeQuadrantPicker]);

  const [ppVisible, setPpVisible] = useState(false);
  const [ppTaskId, setPpTaskId] = useState(null);
  const openProjectPicker = useCallback((taskId) => { setPpTaskId(taskId); setPpVisible(true); }, []);
  const closeProjectPicker = useCallback(() => { setPpVisible(false); setPpTaskId(null); }, []);
  const handleSelectProject = useCallback((projectId) => {
    if (ppTaskId) moveBetweenProjects(ppTaskId, projectId);
    closeProjectPicker();
  }, [ppTaskId, moveBetweenProjects, closeProjectPicker]);

  const [addOpen, setAddOpen] = useState(false);
  const openAdd = () => setAddOpen(true);
  const closeAdd = () => setAddOpen(false);
  const submitAdd = ({ title, important, urgent, projectId }) => {
    addTask({ title, important, urgent, projectId });
    closeAdd();
  };

  // Undo
  const [undoPayload, setUndoPayload] = useState(null);
  const undoTimer = useRef(null);
  const handleDelete = useCallback((id) => {
    const t = getTask(id);
    if (!t) { removeTask(id); return; }
    setUndoPayload({ task: t });
    removeTask(id);
    if (undoTimer.current) clearTimeout(undoTimer.current);
    undoTimer.current = setTimeout(() => setUndoPayload(null), 6000);
  }, [getTask, removeTask]);

  const handleUndo = useCallback(() => {
    if (!undoPayload) return;
    restoreTask(undoPayload.task);
    setUndoPayload(null);
    if (undoTimer.current) clearTimeout(undoTimer.current);
  }, [restoreTask, undoPayload]);

  // DnD: если натив, SafeDraggableList сам вызовет onDragEnd; на web он игнорируется
  const getSectionForIndex = (data, index) => {
    let sec = null;
    for (let i = index; i >= 0; i--) {
      const it = data[i];
      if (it?.type === 'header') { sec = it.sec; break; }
    }
    return sec;
  };

  const onDragEnd = useCallback(({ to, data }) => {
    const dropped = data[to];
    if (!dropped || dropped.type !== 'task') return;
    const newSec = getSectionForIndex(data, to);
    if (!newSec) return;
    moveToQuadrant(dropped.task.id, newSec);
  }, [moveToQuadrant]);

  const renderHeaderRow = (title) => (
    <View style={styles.headerRow}>
      <Text style={styles.headerRowText}>{title}</Text>
    </View>
  );

  const renderListItem = useCallback(({ item, drag }) => {
    if (item.type === 'header') {
      return <View>{renderHeaderRow(item.title)}</View>;
    }
    const t = item.task;
    return (
      <TaskItem
        task={t}
        onToggleDone={toggleDone}
        onDelete={handleDelete}
        onEditTitle={editTitle}
        onLongPress={() => openQuadrantPicker(t.id)}
        showPills={true}
        showProjectBadge={selectedProjectId === 'all'}
        projectBadge={projectMap[t.projectId]}
        onBadgeLongPress={() => openProjectPicker(t.id)}
        // на web dragHandleProps просто проигнорируется
        dragHandleProps={{ onLongPress: drag }}
      />
    );
  }, [toggleDone, handleDelete, editTitle, openQuadrantPicker, openProjectPicker, projectMap, selectedProjectId]);

  const renderMatrixCard = useCallback((t) => (
    <TaskItem
      key={t.id}
      task={t}
      onToggleDone={toggleDone}
      onDelete={handleDelete}
      onEditTitle={editTitle}
      onLongPress={() => openQuadrantPicker(t.id)}
      showPills={false}
      compact
      showProjectBadge={false}
    />
  ), [toggleDone, handleDelete, editTitle, openQuadrantPicker]);

  return (
    <View style={styles.container}>
      <View style={styles.topSwitch}>
        <View style={styles.switchContainer}>
          <Pressable onPress={() => setMode('list')} style={[styles.switchBtn, mode === 'list' && styles.switchActive]}>
            <Text style={[styles.switchText, mode === 'list' && styles.switchTextActive]}>Список</Text>
          </Pressable>
          <Pressable onPress={() => setMode('matrix')} style={[styles.switchBtn, mode === 'matrix' && styles.switchActive]}>
            <Text style={[styles.switchText, mode === 'matrix' && styles.switchTextActive]}>Матрица</Text>
          </Pressable>
        </View>
        
        {stats.total > 0 && (
          <View style={styles.statsContainer}>
            <Text style={styles.statsText}>
              {stats.done}/{stats.total} выполнено
            </Text>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${stats.total > 0 ? (stats.done / stats.total) * 100 : 0}%` }
                ]} 
              />
            </View>
          </View>
        )}
      </View>

      {mode === 'list' ? (
        <SafeDraggableList
          data={listData}
          keyExtractor={(item) => item.key}
          renderItem={renderListItem}
          onDragEnd={onDragEnd}
          activationDistance={6}
          autoscrollThreshold={60}
          contentContainerStyle={{ paddingBottom: 24 }}
        />
      ) : (
        <View style={styles.matrixGrid}>
          <View style={[styles.cell, styles.cellUV]}>
            <View style={styles.cellHeader}>
              <Text style={styles.cellTitle}>⭐⚡ Важно и срочно</Text>
              <Text style={styles.cellCount}>({quad.uv.length})</Text>
            </View>
            <ScrollView contentContainerStyle={styles.cellContent}>
              {quad.uv.map(renderMatrixCard)}
            </ScrollView>
          </View>
          <View style={[styles.cell, styles.cellV]}>
            <View style={styles.cellHeader}>
              <Text style={styles.cellTitle}>⭐ Важно, не срочно</Text>
              <Text style={styles.cellCount}>({quad.v.length})</Text>
            </View>
            <ScrollView contentContainerStyle={styles.cellContent}>
              {quad.v.map(renderMatrixCard)}
            </ScrollView>
          </View>
          <View style={[styles.cell, styles.cellU]}>
            <View style={styles.cellHeader}>
              <Text style={styles.cellTitle}>⚡ Срочно, не важно</Text>
              <Text style={styles.cellCount}>({quad.u.length})</Text>
            </View>
            <ScrollView contentContainerStyle={styles.cellContent}>
              {quad.u.map(renderMatrixCard)}
            </ScrollView>
          </View>
          <View style={[styles.cell, styles.cellO]}>
            <View style={styles.cellHeader}>
              <Text style={styles.cellTitle}>🕒 Не важно, не срочно</Text>
              <Text style={styles.cellCount}>({quad.o.length})</Text>
            </View>
            <ScrollView contentContainerStyle={styles.cellContent}>
              {quad.o.map(renderMatrixCard)}
            </ScrollView>
          </View>
        </View>
      )}

      <Fab onPress={openAdd} />

      {undoPayload && (
        <Pressable onPress={handleUndo} style={styles.undoFab} hitSlop={8}>
          <Text style={styles.undoText}>↶ Отменить</Text>
        </Pressable>
      )}

      <QuadrantPickerModal visible={qpVisible} onSelect={handleSelectQuadrant} onClose={closeQuadrantPicker} />
      <ProjectPickerModal visible={ppVisible} projects={projects} currentProjectId={selectedProjectId} onSelect={handleSelectProject} onClose={closeProjectPicker} />
      <AddTaskSheet visible={addOpen} projects={projects} initialProjectId={selectedProjectId} onSubmit={submitAdd} onClose={closeAdd} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  topSwitch: { paddingHorizontal: 12, paddingTop: 6, paddingBottom: 8, flexDirection: 'row', gap: 8 },
  switchContainer: { flexDirection: 'row', gap: 8 },
  switchBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, backgroundColor: '#F2F3F5' },
  switchActive: { backgroundColor: '#111' },
  switchText: { color: '#333', fontSize: 13, fontWeight: '600' },
  switchTextActive: { color: '#fff' },
  
  statsContainer: { flex: 1, alignItems: 'flex-end', justifyContent: 'center' },
  statsText: { fontSize: 12, color: '#666', marginBottom: 4 },
  progressBar: { 
    width: 80, 
    height: 4, 
    backgroundColor: '#E5E7EB', 
    borderRadius: 2,
    overflow: 'hidden'
  },
  progressFill: { 
    height: '100%', 
    backgroundColor: '#10B981',
    borderRadius: 2,
    minWidth: 2
  },

  headerRow: { paddingHorizontal: 12, paddingTop: 10, paddingBottom: 4 },
  headerRowText: { fontSize: 12, fontWeight: '600', color: '#666' },

  matrixGrid: { flex: 1, flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: '50%', height: '50%', padding: 6 },
  cellContent: { paddingBottom: 24 },
  cellHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  cellTitle: { fontSize: 12, fontWeight: '600', color: '#333' },
  cellCount: { fontSize: 11, color: '#666', backgroundColor: 'rgba(255,255,255,0.7)', 
               paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 },

  cellUV: { backgroundColor: '#FFF0F0' },
  cellV:  { backgroundColor: '#F2FFF5' },
  cellU:  { backgroundColor: '#FFF9E8' },
  cellO:  { backgroundColor: '#F6F7F9' },

  undoFab: {
    position: 'absolute',
    left: 16,
    bottom: 20,
    backgroundColor: '#111',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  undoText: { color: '#fff', fontWeight: '600' },
});
