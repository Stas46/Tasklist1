import React, { useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, Platform } from 'react-native';
import SafeSwipeable from '../platform/SafeSwipeable';

export default function TaskItem({
  task,
  onToggleDone,
  onDelete,
  onEditTitle,            // (id, title)
  onLongPress,            // long-press -> меню переноса (mobile)
  onOpenContextMenu,      // (x, y, task) — контекст-меню (web, ПК)
  showProjectBadge = false,
  showPills = true,       // в матрице true, но рендерятся иконками
  compact = false,        // в матрице true — компактный вид
  projectBadge,           // { name, emoji }
  onBadgeLongPress,       // перенос в проект
  dragHandleProps,        // { onLongPress: drag } для списка (native)
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const longPressGuard = useRef(false);

  const swipeRef = useRef(null);

  const armGuard = () => {
    longPressGuard.current = true;
    setTimeout(() => (longPressGuard.current = false), 350);
  };

  const commitEdit = () => {
    const t = title.trim();
    if (t && t !== task.title) onEditTitle?.(task.id, t);
    setEditing(false);
  };

  // ПК: правый клик -> контекст-меню
  const handleContextMenu = useCallback((e) => {
    if (Platform.OS !== 'web') return;
    try {
      e.preventDefault?.();
      const nx = e?.nativeEvent?.pageX ?? e?.pageX ?? 0;
      const ny = e?.nativeEvent?.pageY ?? e?.pageY ?? 0;
      onOpenContextMenu?.(nx, ny, task);
    } catch {}
  }, [onOpenContextMenu, task]);

  // Web: also open context menu on long press (touch) at the touch coordinates
  const handleLongPressWeb = useCallback((e) => {
    if (Platform.OS !== 'web') return;
    try {
      // e.nativeEvent may have touches array
      const ne = e?.nativeEvent ?? e;
      const touch = (ne.touches && ne.touches[0]) || ne;
      const nx = touch?.pageX ?? touch?.clientX ?? 0;
      const ny = touch?.pageY ?? touch?.clientY ?? 0;
      onOpenContextMenu?.(nx, ny, task);
    } catch {}
  }, [onOpenContextMenu, task]);

  const PillsRow = () => {
    if (!showPills) return null;
    // По требованию иконки/плашки приоритетов не показываем ни в одном режиме
    // (оставляем только бейдж проекта в некопактном списке, если включён)
    if (!compact && showProjectBadge && projectBadge) {
      return (
        <View style={styles.pillsIcons}>
          <Text style={[styles.iconChip, styles.iconProject]} accessibilityLabel={projectBadge.name}>
            {projectBadge.emoji ?? '📁'}
          </Text>
        </View>
      );
    }
    return null;
  };

  const ProjectBadge = () => {
    if (!showProjectBadge || !projectBadge) return null;
    // В матрице — скрываем (иконка уже в PillsRow)
    if (compact) return null;
    return (
      <View style={styles.footer}>
        <Pressable onLongPress={onBadgeLongPress} hitSlop={8} style={({ pressed }) => [styles.badge, pressed && styles.badgePressed]}>
          <Text style={styles.badgeText}>
            {projectBadge.emoji ?? '📁'} {projectBadge.name}
          </Text>
        </Pressable>
      </View>
    );
  };

  const closeSwipe = () => {
    // на native Swipeable есть close(); SafeSwipeable проксирует ref
    try { swipeRef.current?.close?.(); } catch {}
  };

  return (
    <View onContextMenu={handleContextMenu} style={{ borderRadius: 14, overflow: 'hidden' }}>
      <SafeSwipeable
        ref={swipeRef}
        renderLeftActions={
          Platform.OS !== 'web'
            ? () => (<View style={[styles.swipeBox, { backgroundColor: '#E6F7EA' }]}><Text style={styles.swipeText}>Готово</Text></View>)
            : undefined
        }
        renderRightActions={
          Platform.OS !== 'web'
            ? () => (<View style={[styles.swipeBox, { backgroundColor: '#FFE6E6', alignItems:'flex-end' }]}><Text style={styles.swipeText}>Удалить</Text></View>)
            : undefined
        }
        onSwipeableOpen={
          Platform.OS !== 'web'
            ? (dir) => {
                if (dir === 'left') {
                  onToggleDone?.(task.id);
                  setTimeout(closeSwipe, 50);
                }
                if (dir === 'right') {
                  onDelete?.(task.id);
                  setTimeout(closeSwipe, 50);
                }
              }
            : undefined
        }
        overshootLeft={false}
        overshootRight={false}
        leftThreshold={24}
        rightThreshold={24}
        friction={1.5}
      >
        <Pressable
          onLongPress={(e) => { armGuard(); onLongPress?.(task); if (Platform.OS === 'web') handleLongPressWeb(e); }}
          delayLongPress={250}
          style={({ pressed }) => [
            styles.card,
            compact ? styles.cardCompact : null,
            pressed && styles.pressed
          ]}
        >
          <View style={styles.row}>
            <Pressable
              onPress={() => onToggleDone?.(task.id)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={({ pressed }) => [styles.checkbox, compact && styles.checkboxCompact, pressed && styles.checkboxPressed]}
            >
              <Text style={styles.checkboxText}>{task.done ? '✓' : ''}</Text>
            </Pressable>

            <View style={[styles.titleWrap, compact && styles.titleWrapCompact]}>
              {editing ? (
                <TextInput
                  value={title}
                  onChangeText={setTitle}
                  onBlur={commitEdit}
                  onSubmitEditing={commitEdit}
                  autoFocus
                  style={[styles.input, compact && styles.inputCompact]}
                />
              ) : (
                <Pressable
                  onPress={() => { if (!longPressGuard.current) setEditing(true); }}
                  onLongPress={() => { armGuard(); onLongPress?.(task); }}
                  delayLongPress={250}
                >
                  <Text
                    style={[styles.title, compact && styles.titleCompact, task.done && styles.done]}
                    numberOfLines={2}
                    ellipsizeMode="tail"
                  >
                    {task.title}
                  </Text>
                </Pressable>
              )}

              <PillsRow />
            </View>

            {dragHandleProps ? (
              <Pressable {...dragHandleProps} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} style={({ pressed }) => [styles.handle, pressed && styles.handlePressed]}>
                <Text style={styles.handleText}>≡</Text>
              </Pressable>
            ) : null}
          </View>

          <ProjectBadge />
        </Pressable>
      </SafeSwipeable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
  padding: 10,
  marginHorizontal: 10,
  marginVertical: 5,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  // компактнее карточка в матрице
  cardCompact: { paddingHorizontal: 8, paddingVertical: 8, marginHorizontal: 6, marginVertical: 4, borderRadius: 12 },
  pressed: { opacity: 0.7 },

  row: { flexDirection: 'row', alignItems: 'center' },
  titleWrap: { flex: 1, paddingRight: 8 },
  titleWrapCompact: { paddingRight: 4 },
  title: { fontSize: 16, color: '#111' },
  titleCompact: { fontSize: 13, lineHeight: 17 },       // ещё компактнее на мобилках
  done: { textDecorationLine: 'line-through', color: '#999' },

  input: {
    borderRadius: 10, borderWidth: StyleSheet.hairlineWidth, borderColor: '#D9D9DF',
    paddingHorizontal: 10, paddingVertical: 6,
  },
  inputCompact: { paddingVertical: 3, fontSize: 13 },

  checkbox: {
    width: 22, height: 22, borderRadius: 6,
    borderWidth: 2, borderColor: '#d1d5db', alignItems: 'center', justifyContent: 'center',
    marginRight: 10,
  },
  checkboxCompact: { width: 16, height: 16, marginRight: 8 },     // ещё меньше чекбокс
  checkboxPressed: { opacity: 0.6 },
  checkboxText: { fontSize: 14, color: '#111' },

  handle: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 8, backgroundColor: '#F2F3F5' },
  handlePressed: { opacity: 0.6 },
  handleText: { fontSize: 16, lineHeight: 18, color: '#666' },

  // ---- Pills: список / матрица
  pillsText: { flexDirection: 'row', gap: 6, marginTop: 4 },
  pill: { fontSize: 11, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, overflow: 'hidden' },
  pillImportant: { backgroundColor: '#FFF3C4', color: '#8A6D00' },
  pillUrgent: { backgroundColor: '#E6F3FF', color: '#004A7A' },

  // компактный ряд мини-иконок (сейчас используем только для бейджа проекта)
  pillsIcons: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  iconChip: {
  fontSize: 10,
  paddingHorizontal: 4, paddingVertical: 1,
    borderRadius: 999, overflow: 'hidden',
  },
  iconProject: { backgroundColor: '#F2F3F5', color: '#333' },

  footer: { marginTop: 8, flexDirection: 'row', alignItems: 'center' },
  badge: { alignSelf: 'flex-start', backgroundColor: '#F2F3F5', borderRadius: 999, paddingVertical: 4, paddingHorizontal: 10 },
  badgePressed: { opacity: 0.6 },
  badgeText: { fontSize: 12, color: '#333' },

  swipeBox: { flex:1, justifyContent:'center', paddingHorizontal:16 },
  swipeText: { fontSize:14, color:'#333', fontWeight:'600' },
});
