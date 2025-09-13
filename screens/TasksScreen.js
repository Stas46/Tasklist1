// screens/TasksScreen.js
import React, { useMemo, useCallback, useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, Platform, Alert, Pressable, TextInput,
  KeyboardAvoidingView, ScrollView, Keyboard, BackHandler, Dimensions
} from 'react-native';

import FilterRail from '../components/FilterRail';
import TaskItem from '../components/TaskItem';
import Fab from '../components/Fab';

import { useTasks, sortTasks, qKeyOf } from '../store/useTasks';

export default function TasksScreen() {
  const viewMode          = useTasks((s) => s.viewMode);
  const compactModeGlobal = useTasks((s) => s.compactMode);
  const tasksRaw          = useTasks((s) => s.tasks);
  const selectedProjectId = useTasks((s) => s.selectedProjectId);
  const projects          = useTasks((s) => s.projects);
  const filterImportant   = useTasks((s) => s.filterImportant);
  const filterUrgent      = useTasks((s) => s.filterUrgent);

  const toggleDone     = useTasks((s) => s.toggleDone);
  const deleteTask     = useTasks((s) => s.deleteTask);
  const editTitle      = useTasks((s) => s.editTitle);
  const moveToQuadrant = useTasks((s) => s.moveToQuadrant);
  const addTask        = useTasks((s) => s.addTask);
  const setCreatedAt   = useTasks((s) => s.setCreatedAt);
  const undoDelete     = useTasks((s) => s.undoDelete);

  const tasks = useMemo(() => {
    const byProject = selectedProjectId === 'all' ? tasksRaw : tasksRaw.filter(t => t.projectId === selectedProjectId);
    const byFilters = byProject
      .filter(t => (filterImportant ? t.important : true))
      .filter(t => (filterUrgent ? t.urgent : true));
    return byFilters.slice().sort(sortTasks);
  }, [tasksRaw, selectedProjectId, filterImportant, filterUrgent]);

  const groups = useMemo(() => {
    const uv = [], v = [], u = [], o = [];
    for (const t of tasks) {
      if (t.important && t.urgent) uv.push(t);
      else if (t.important && !t.urgent) v.push(t);
      else if (!t.important && t.urgent) u.push(t);
      else o.push(t);
    }
    return { uv, v, u, o };
  }, [tasks]);

  // ---------- контекстное меню (web)
  const [menu, setMenu] = useState(null);
  const openContextMenu = useCallback((x, y, task) => {
    if (Platform.OS !== 'web') return;
    const vw = window.innerWidth || 0;
    const vh = window.innerHeight || 0;
    const MENU_W = 272;
    const MAX_H  = Math.min(vh - 24, 420);
    let left = x, top = y;
    if (left + MENU_W > vw - 8) left = Math.max(8, vw - MENU_W - 8);
    if (top + MAX_H > vh - 8)   top  = Math.max(8, y - MAX_H);
    setMenu({ x: left, y: top, maxH: MAX_H, task });
  }, []);
  const closeMenu = useCallback(() => setMenu(null), []);

  // undo delete
  const [undo, setUndo] = useState({ visible: false, title: '' });
  const undoTimer = useRef(null);
  useEffect(() => () => { if (undoTimer.current) clearTimeout(undoTimer.current); }, []);

  const doDelete = useCallback((victim) => {
    deleteTask(victim.id);
    setUndo({ visible: true, title: victim.title || '' });
    if (undoTimer.current) clearTimeout(undoTimer.current);
    undoTimer.current = setTimeout(() => setUndo({ visible: false, title: '' }), 4000);
  }, [deleteTask]);

  const handleCtxToggleDone = useCallback(() => { if (menu?.task) toggleDone(menu.task.id); closeMenu(); }, [menu, toggleDone, closeMenu]);
  const handleCtxDelete     = useCallback(() => { if (menu?.task) doDelete(menu.task); closeMenu(); }, [menu, doDelete, closeMenu]);

  const handleCtxEdit = useCallback(() => {
    if (!menu?.task) return;
    if (Platform.OS === 'web') {
      const t = window.prompt('Изменить название', menu.task.title);
      if (t && t.trim()) editTitle(menu.task.id, t.trim());
      closeMenu();
    } else {
      Alert.prompt?.('Edit title', undefined, (text) => {
        if (text && text.trim()) editTitle(menu.task.id, text.trim());
        closeMenu();
      }, undefined, menu.task.title);
    }
  }, [menu, editTitle, closeMenu]);

  const handleCtxMove = useCallback((qKey) => { if (menu?.task) moveToQuadrant(menu.task.id, qKey); closeMenu(); }, [menu, moveToQuadrant, closeMenu]);

  const swapCreatedAt = useCallback((a, b) => {
    if (!a || !b) return;
    const aTime = a.createdAt || new Date().toISOString();
    const bTime = b.createdAt || new Date().toISOString();
    setCreatedAt(a.id, bTime); setCreatedAt(b.id, aTime);
  }, [setCreatedAt]);

  const handleCtxMoveUp = useCallback(() => {
    if (!menu?.task) return;
    const id = menu.task.id;
    const scope = (viewMode === 'matrix') ? (groups[qKeyOf(menu.task)] || []) : tasks;
    const idx = scope.findIndex(t => t.id === id);
    if (idx > 0) swapCreatedAt(scope[idx], scope[idx - 1]);
    closeMenu();
  }, [menu, viewMode, groups, tasks, swapCreatedAt, closeMenu]);

  const handleCtxMoveDown = useCallback(() => {
    if (!menu?.task) return;
    const id = menu.task.id;
    const scope = (viewMode === 'matrix') ? (groups[qKeyOf(menu.task)] || []) : tasks;
    const idx = scope.findIndex(t => t.id === id);
    if (idx >= 0 && idx < scope.length - 1) swapCreatedAt(scope[idx], scope[idx + 1]);
    closeMenu();
  }, [menu, viewMode, groups, tasks, swapCreatedAt, closeMenu]);

  // ---------- добавление задачи (модалка)
  const [addOpen, setAddOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newQuad, setNewQuad] = useState('o'); // uv|v|u|o
  const [newProjectId, setNewProjectId] = useState(selectedProjectId);

  const openAdd = useCallback(() => {
    setNewTitle(''); setNewQuad('o');
    setNewProjectId(selectedProjectId === 'all' ? 'inbox' : selectedProjectId);
    setAddOpen(true);
  }, [selectedProjectId]);

  const openAddForQuadrant = useCallback((q) => {
    setNewTitle(''); setNewQuad(q);
    setNewProjectId(selectedProjectId === 'all' ? 'inbox' : selectedProjectId);
    setAddOpen(true);
  }, [selectedProjectId]);

  const submitAdd = useCallback(() => {
    const t = newTitle.trim();
    if (!t) return;
    addTask(t, { quadrant: newQuad, projectId: newProjectId });
    setAddOpen(false);
  }, [newTitle, newQuad, newProjectId, addTask]);

  // Клавиатура — запас по высоте, чтобы кнопка «Добавить» не уезжала
  const [kbHeight, setKbHeight] = useState(0);
  useEffect(() => {
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvt, e => setKbHeight((e.endCoordinates?.height ?? 0)));
    const hideSub = Keyboard.addListener(hideEvt, () => setKbHeight(0));
    return () => { showSub.remove(); hideSub.remove(); };
  }, []);

  // ---------- долгий тап (mobile): «Куда перенести?» — кастомная модалка
  const [moveOpen, setMoveOpen] = useState(false);
  const [moveTask, setMoveTask] = useState(null);
  const [moveAnchor, setMoveAnchor] = useState({ x: 0, y: 0 });
  const openMovePicker = useCallback((task, x = 0, y = 0) => { setMoveTask(task); setMoveAnchor({ x, y }); setMoveOpen(true); }, []);
  const closeMovePicker = useCallback(() => { setMoveOpen(false); setMoveTask(null); }, []);

  // Закрытие модалок по кнопке «Назад» на Android
  useEffect(() => {
    const onBack = () => {
      if (moveOpen) { closeMovePicker(); return true; }
      if (addOpen) { setAddOpen(false); return true; }
      return false;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBack);
    return () => sub.remove();
  }, [moveOpen, addOpen, closeMovePicker]);

  const showProjectBadge = selectedProjectId === 'all';
  const getProjectBadge = useCallback(
    (task) => {
      if (!showProjectBadge) return null;
      const p = projects.find(pr => pr.id === task.projectId);
      if (p) return { name: p.name, emoji: p.emoji ?? '📁' };
      const inbox = projects.find(pr => pr.id === 'inbox');
      return inbox ? { name: inbox.name, emoji: inbox.emoji ?? '📥' } : null;
    },
    [projects, showProjectBadge]
  );

  const isMatrix = viewMode === 'matrix';
  const compact = isMatrix || compactModeGlobal;

  const renderTaskList = useCallback(
    ({ item }) => (
      <TaskItem
        task={item}
        onToggleDone={() => toggleDone(item.id)}
        onDelete={() => doDelete(item)}
        onEditTitle={editTitle}
        onLongPress={() => openMovePicker(item)}
        onOpenContextMenu={openContextMenu}
        showProjectBadge={showProjectBadge}
        projectBadge={getProjectBadge(item)}
        // В матрице всегда компактно; в списке — по глобальному флагу
        compact={isMatrix || compactModeGlobal}
        // Показывать плашки/иконки приоритетов: в матрице — скрываем; в списке — только когда не компактно
        showPills={!isMatrix && !compactModeGlobal}
      />
    ),
    [toggleDone, doDelete, editTitle, openMovePicker, openContextMenu, showProjectBadge, getProjectBadge, isMatrix, compactModeGlobal]
  );

  return (
    <View style={styles.container}>
      <FilterRail />

      {isMatrix ? (
        <View style={styles.grid}>
          <QuadrantCell compact title="⭐⚡ Важно + Срочно" tint="#FFC5CF" bg="rgba(255,197,207,0.45)" data={groups.uv} renderItem={renderTaskList} onAdd={() => openAddForQuadrant('uv')} />
          <QuadrantCell compact title="⭐ Важно"          tint="#FFE8A3" bg="rgba(255,232,163,0.45)" data={groups.v}  renderItem={renderTaskList} onAdd={() => openAddForQuadrant('v')} />
          <QuadrantCell compact title="⚡ Срочно"         tint="#D8EFFD" bg="rgba(216,239,253,0.45)" data={groups.u}  renderItem={renderTaskList} onAdd={() => openAddForQuadrant('u')} />
          <QuadrantCell compact title="• Остальное"       tint="#D9F5E5" bg="rgba(217,245,229,0.55)" data={groups.o}  renderItem={renderTaskList} onAdd={() => openAddForQuadrant('o')} />
        </View>
      ) : (
        // В списке: если включён компактный режим — показываем простой компактный список (единый FlatList)
        compact ? (
          <FlatList
            data={tasks}
            keyExtractor={(t) => t.id}
            renderItem={renderTaskList}
            contentContainerStyle={{ paddingVertical: 6 }}
          />
        ) : (
          // В обычном (не компактном) режиме — один FlatList с заголовками-секциями как элементами
          <FlatList
            data={([
              { key:'uv', title:'⭐⚡ Важно + Срочно', tint:'#FFC5CF', bg:'rgba(255,197,207,0.28)', data: groups.uv },
              { key:'v',  title:'⭐ Важно',           tint:'#FFE8A3', bg:'rgba(255,232,163,0.28)', data: groups.v  },
              { key:'u',  title:'⚡ Срочно',          tint:'#D8EFFD', bg:'rgba(216,239,253,0.28)', data: groups.u  },
              { key:'o',  title:'• Остальное',        tint:'#D9F5E5', bg:'rgba(217,245,229,0.35)', data: groups.o  },
            ]).flatMap(sec => [
              { _type:'header', _key:`header-${sec.key}`, title:sec.title, tint:sec.tint, bg:sec.bg, count:sec.data.length },
              ...sec.data.map(t => ({ _type:'item', ...t }))
            ])}
            keyExtractor={(it) => it._type === 'header' ? it._key : it.id}
            renderItem={({ item }) => (
              item._type === 'header' ? (
                <View style={{ paddingHorizontal: 8, marginBottom: 2 }}>
                  <View style={{ backgroundColor: item.bg, borderColor: item.tint, borderWidth: 2, borderRadius: 12 }}>
                    <View style={[styles.cellHeader, { backgroundColor: item.tint, borderTopLeftRadius: 10, borderTopRightRadius: 10, marginBottom: 0 }]}> 
                      <Text style={styles.cellTitle}>{item.title} ({item.count})</Text>
                    </View>
                  </View>
                </View>
              ) : (
                renderTaskList({ item })
              )
            )}
            contentContainerStyle={{ paddingBottom: 12 }}
          />
        )
      )}

      {/* Контекст-меню (web) */}
      {Platform.OS === 'web' && menu?.task && (
        <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
          <Pressable pointerEvents="box-only" style={StyleSheet.absoluteFill} onPress={closeMenu} />
          <View style={[styles.ctxMenu, { position: 'fixed', top: menu.y, left: menu.x, maxHeight: menu.maxH, maxWidth: 320 }]}>
            <CtxItem label={menu.task.done ? 'Снять отметку' : 'Отметить как готово'} onPress={handleCtxToggleDone} />
            <CtxItem label="Редактировать" onPress={handleCtxEdit} />
            <View style={styles.ctxSeparator} />
            <CtxItem label="Поднять выше" onPress={handleCtxMoveUp} />
            <CtxItem label="Опустить ниже" onPress={handleCtxMoveDown} />
            <View style={styles.ctxSeparator} />
            <Text style={styles.ctxGroupTitle}>Перенести в…</Text>
            <CtxItem label="⭐⚡ Важно + Срочно" onPress={() => handleCtxMove('uv')} />
            <CtxItem label="⭐ Важно"            onPress={() => handleCtxMove('v')} />
            <CtxItem label="⚡ Срочно"           onPress={() => handleCtxMove('u')} />
            <CtxItem label="• Остальное"         onPress={() => handleCtxMove('o')} />
            <View style={styles.ctxSeparator} />
            <CtxItem danger label="Удалить" onPress={handleCtxDelete} />
          </View>
        </View>
      )}

      <Fab onPress={openAdd} />

      {/* Снэк-бар Undo */}
      {undo.visible && (
        <View style={styles.snack}>
          <Text style={styles.snackText} numberOfLines={1}>Удалено: {undo.title || 'задача'}</Text>
          <Pressable onPress={() => { if (undoTimer.current) clearTimeout(undoTimer.current); undoDelete(); setUndo({ visible:false, title:'' }); }}>
            <Text style={styles.snackAction}>Восстановить</Text>
          </Pressable>
        </View>
      )}

      {/* Модалка добавления */}
      {addOpen && (
        <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
          <Pressable pointerEvents="box-only" style={styles.modalBackdrop} onPress={() => setAddOpen(false)} />
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[styles.modalWrap, Platform.OS === 'android' && { bottom: kbHeight > 0 ? kbHeight : 0 }]}
            keyboardVerticalOffset={16}
          >
            <View style={styles.modalCard}>
              <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 24 }}>
                <Text style={styles.modalTitle}>Новая задача</Text>

                <TextInput
                  placeholder="Название задачи"
                  value={newTitle}
                  onChangeText={setNewTitle}
                  style={styles.input}
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={submitAdd}
                />

                <Text style={styles.label}>Проект</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 8 }}>
                  <View style={styles.rowH}>
                    {projects.filter(p=>p.id!=='all').map((p) => (
                      <Pressable key={p.id} onPress={() => setNewProjectId(p.id)} style={[styles.chip, newProjectId === p.id && styles.chipOn]}>
                        <Text style={[styles.chipText, newProjectId === p.id && styles.chipTextOn]}>
                          {(p.emoji ?? '📁') + ' ' + p.name}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </ScrollView>

                <Text style={[styles.label, { marginTop: 10 }]}>Приоритет (матрица)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 8 }}>
                  <View style={styles.rowH}>
                    {[
                      { key:'uv', label:'⭐⚡ Важно + Срочно' },
                      { key:'v',  label:'⭐ Важно' },
                      { key:'u',  label:'⚡ Срочно' },
                      { key:'o',  label:'• Остальное' },
                    ].map(q => (
                      <Pressable key={q.key} onPress={() => setNewQuad(q.key)} style={[styles.chip, newQuad === q.key && styles.chipOn]}>
                        <Text style={[styles.chipText, newQuad === q.key && styles.chipTextOn]}>{q.label}</Text>
                      </Pressable>
                    ))}
                  </View>
                </ScrollView>
              </ScrollView>

              <View style={styles.modalActions}>
                <Pressable onPress={() => setAddOpen(false)} style={[styles.btn, styles.btnGhost]}><Text style={styles.btnGhostText}>Отмена</Text></Pressable>
                <Pressable onPress={submitAdd} style={[styles.btn, styles.btnPrimary]}><Text style={styles.btnPrimaryText}>Добавить</Text></Pressable>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      )}

      {/* Модалка «Перенести в…» */}
      {moveOpen && (
        <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
          <Pressable pointerEvents="box-only" style={styles.modalBackdrop} onPress={closeMovePicker} />
          {(() => {
            const { width: vw, height: vh } = Dimensions.get('window');
            const menuW = 260; const menuH = 200; const margin = 8;
            let left = moveAnchor.x; let top = moveAnchor.y;
            if (left + menuW > vw - margin) left = Math.max(margin, vw - menuW - margin);
            if (top + menuH > vh - margin) top = Math.max(margin, vh - menuH - margin);
            // Если клавиатура открыта на Android и поповер низко — поднимем его
            if (Platform.OS === 'android' && kbHeight > 0 && top + menuH > vh - kbHeight - margin) {
              top = Math.max(margin, vh - kbHeight - menuH - margin);
            }
            return (
              <View style={[styles.movePopover, { left, top, width: menuW }]}> 
                <Text style={styles.modalTitle}>Перенести в…</Text>
                <View style={{ paddingVertical: 4 }}>
                  <Pressable onPress={() => { if (moveTask) moveToQuadrant(moveTask.id, 'uv'); closeMovePicker(); }} style={styles.ctxItem}>
                    <Text style={styles.ctxText}>⭐⚡ Важно + Срочно</Text>
                  </Pressable>
                  <Pressable onPress={() => { if (moveTask) moveToQuadrant(moveTask.id, 'v'); closeMovePicker(); }} style={styles.ctxItem}>
                    <Text style={styles.ctxText}>⭐ Важно</Text>
                  </Pressable>
                  <Pressable onPress={() => { if (moveTask) moveToQuadrant(moveTask.id, 'u'); closeMovePicker(); }} style={styles.ctxItem}>
                    <Text style={styles.ctxText}>⚡ Срочно</Text>
                  </Pressable>
                  <Pressable onPress={() => { if (moveTask) moveToQuadrant(moveTask.id, 'o'); closeMovePicker(); }} style={styles.ctxItem}>
                    <Text style={styles.ctxText}>• Остальное</Text>
                  </Pressable>
                </View>
                <View style={[styles.modalActions, { marginTop: 4 }]}>
                  <Pressable onPress={closeMovePicker} style={[styles.btn, styles.btnGhost]}>
                    <Text style={styles.btnGhostText}>Отмена</Text>
                  </Pressable>
                </View>
              </View>
            );
          })()}
        </View>
      )}
    </View>
  );
}

/** ====== вспомогательные вьюхи ====== */
function QuadrantCell({ title, tint, bg, data, renderItem, onAdd }) {
  return (
    <View style={[styles.cell, { backgroundColor: bg, borderColor: tint }]}>
      <View style={[styles.cellHeader, { backgroundColor: tint }]}>
        <Text style={styles.cellTitle}>{title} ({data.length})</Text>
      </View>

      <View style={styles.cellScroll}>
        <FlatList data={data} keyExtractor={(t) => t.id} renderItem={renderItem} contentContainerStyle={{ paddingVertical: 6 }} />
      </View>

      <Pressable onPress={onAdd} hitSlop={8} style={({ pressed }) => [styles.qPlus, pressed && { opacity: 0.85 }]}>
            <Text style={styles.qPlusText}>＋</Text>
          </Pressable>
    </View>
  );
}

// Вертикальная секция для компактного списка
function ListSection({ title, tint, bg, data, renderItem, onAdd }) {
  return (
    <View style={{ paddingHorizontal: 8, marginBottom: 10 }}>
      <View style={{ backgroundColor: bg, borderColor: tint, borderWidth: 2, borderRadius: 12 }}>
        <View style={[styles.cellHeader, { backgroundColor: tint, borderTopLeftRadius: 10, borderTopRightRadius: 10, marginBottom: 0 }]}> 
          <Text style={styles.cellTitle}>{title} ({data.length})</Text>
        </View>
  <FlatList data={data} keyExtractor={(t) => t.id} renderItem={renderItem} contentContainerStyle={{ paddingVertical: 6 }} />
      </View>
      {/* В режиме списка плюсик для секций скрыт по требованию */}
    </View>
  );
}

function CtxItem({ label, onPress, danger }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.ctxItem, pressed && { backgroundColor: '#F5F5F7' }]}>
      <Text style={[styles.ctxText, danger && { color: '#B00020' }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  grid: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', padding: 6 },
  cell: { width: '50%', height: '50%', padding: 4, borderWidth: 2, borderRadius: 12, position: 'relative', overflow: 'hidden' },
  cellHeader: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginBottom: 6 },
  cellTitle: { fontSize: 12, color: '#333', fontWeight: '700' },
  cellScroll: { flex: 1 },

  qPlus: { position: 'absolute', left: '50%', bottom: 10, width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: '#111', transform: [{ translateX: -18 }] },
  qPlusText: { color: '#fff', fontSize: 18, lineHeight: 18, fontWeight: '700' },

  ctxMenu: {
    position: 'absolute',
    minWidth: 240, maxWidth: 300,
    overflow: 'auto',
    backgroundColor: '#fff',
    borderRadius: 12, paddingVertical: 6,
    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
    borderWidth: StyleSheet.hairlineWidth, borderColor: '#E6E6E6',
    zIndex: 9999,
  },
  ctxItem: { paddingHorizontal: 12, paddingVertical: 10 },
  ctxText: { fontSize: 14, color: '#111' },
  ctxGroupTitle: { fontSize: 11, color: '#666', paddingHorizontal: 12, paddingVertical: 4, fontWeight: '700', textTransform: 'uppercase' },
  ctxSeparator: { height: StyleSheet.hairlineWidth, backgroundColor: '#E6E6E6', marginVertical: 6 },

  snack: {
    position: 'absolute', left: 12, right: 12, bottom: 90,
    backgroundColor: '#111', paddingHorizontal: 12, paddingVertical: 10,
    borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', zIndex: 10000,
  },
  snackText: { color: '#fff', fontSize: 13, marginRight: 16, flex: 1 },
  snackAction: { color: '#FFEB3B', fontWeight: '800', fontSize: 13 },

  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)' },
  modalWrap: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16, borderTopRightRadius: 16,
    padding: 14, gap: 8, maxHeight: '70%',            // чтобы не залезало слишком высоко
  },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#111', marginBottom: 4 },
  input: { borderWidth: StyleSheet.hairlineWidth, borderColor: '#D9D9DF', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8 },
  label: { fontSize: 12, color: '#666', fontWeight: '700' },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  rowH: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4, paddingRight: 8 },

  chip: { backgroundColor: '#F2F3F5', borderRadius: 999, paddingVertical: 6, paddingHorizontal: 10 },
  chipOn: { backgroundColor: '#111' },
  chipText: { fontSize: 12, color: '#333', fontWeight: '700' },
  chipTextOn: { color: '#fff' },

  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 10 },
  btn: { borderRadius: 10, paddingVertical: 10, paddingHorizontal: 14 },
  btnGhost: { backgroundColor: '#F2F3F5' },
  btnGhostText: { color: '#111', fontWeight: '700' },
  btnPrimary: { backgroundColor: '#111' },
  btnPrimaryText: { color: '#fff', fontWeight: '700' },

  // Поповер переноса (якорный)
  movePopover: {
    position: 'absolute',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E6E6E6',
    elevation: 4,
    // web-friendly shadow
    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
  },
});
