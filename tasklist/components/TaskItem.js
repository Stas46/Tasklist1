import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, Platform } from 'react-native';
import SafeSwipeable from '../platform/SafeSwipeable';

export default function TaskItem({
  task,
  onToggleDone,
  onDelete,
  onEditTitle,            // (id, title)
  onLongPress,            // long-press -> QuadrantPicker (и в списке, и в матрице)
  showProjectBadge = false,
  showPills = true,       // в матрице false
  compact = false,        // в матрице true — меньше паддинги/поля
  projectBadge,           // { name, emoji }
  onBadgeLongPress,       // перенос в проект
  dragHandleProps,        // { onLongPress: drag } для списка
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const longPressGuard = useRef(false);

  const armGuard = () => {
    longPressGuard.current = true;
    setTimeout(() => (longPressGuard.current = false), 350);
  };

  const commitEdit = () => {
    const t = title.trim();
    if (t && t !== task.title) onEditTitle?.(task.id, t);
    setEditing(false);
  };

  // На web свайпы отключены (SafeSwipeable => View),
  // Поэтому кнопки "Готово/Удалить" доступны через тап/меню, свайпов нет.
  return (
    <SafeSwipeable
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
              if (dir === 'left') onToggleDone?.(task.id);
              if (dir === 'right') onDelete?.(task.id);
            }
          : undefined
      }
      overshootLeft={false}
      overshootRight={false}
    >
      <Pressable
        onLongPress={() => { armGuard(); onLongPress?.(); }}
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
            hitSlop={8}
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
                onLongPress={() => { armGuard(); onLongPress?.(); }}
                delayLongPress={250}
              >
                <Text style={[styles.title, task.done && styles.done]} numberOfLines={compact ? 2 : 2}>
                  {task.title}
                </Text>
              </Pressable>
            )}

            {showPills && (
              <View style={styles.pills}>
                {task.important ? <Text style={[styles.pill, styles.pillImportant]}>⭐ Важно</Text> : null}
                {task.urgent ? <Text style={[styles.pill, styles.pillUrgent]}>⚡ Срочно</Text> : null}
              </View>
            )}
          </View>

          {dragHandleProps ? (
            <Pressable {...dragHandleProps} hitSlop={8} style={({ pressed }) => [styles.handle, pressed && styles.handlePressed]}>
              <Text style={styles.handleText}>≡</Text>
            </Pressable>
          ) : null}
        </View>

        {showProjectBadge && !!projectBadge && (
          <View style={styles.footer}>
            <Pressable onLongPress={onBadgeLongPress} hitSlop={8} style={({ pressed }) => [styles.badge, pressed && styles.badgePressed]}>
              <Text style={styles.badgeText}>
                {projectBadge.emoji ?? '📁'} {projectBadge.name}
              </Text>
            </Pressable>
          </View>
        )}
      </Pressable>
    </SafeSwipeable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    backgroundColor: '#fff',
    padding: 12,
    marginHorizontal: 12,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cardCompact: { paddingHorizontal: 10, marginHorizontal: 8 },
  pressed: { opacity: 0.7 },

  row: { flexDirection: 'row', alignItems: 'center' },
  titleWrap: { flex: 1, paddingRight: 8 },
  titleWrapCompact: { paddingRight: 4 },
  title: { fontSize: 16, color: '#111' },
  done: { textDecorationLine: 'line-through', color: '#999' },

  input: {
    borderRadius: 10, borderWidth: StyleSheet.hairlineWidth, borderColor: '#D9D9DF',
    paddingHorizontal: 10, paddingVertical: 6,
  },
  inputCompact: { paddingVertical: 4 },

  checkbox: {
    width: 22, height: 22, borderRadius: 6,
    borderWidth: 2, borderColor: '#d1d5db', alignItems: 'center', justifyContent: 'center',
    marginRight: 10,
  },
  checkboxCompact: { width: 20, height: 20, marginRight: 8 },
  checkboxPressed: { opacity: 0.6 },
  checkboxText: { fontSize: 14, color: '#111' },

  handle: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 8, backgroundColor: '#F2F3F5' },
  handlePressed: { opacity: 0.6 },
  handleText: { fontSize: 16, lineHeight: 18, color: '#666' },

  footer: { marginTop: 8, flexDirection: 'row', alignItems: 'center' },
  badge: { alignSelf: 'flex-start', backgroundColor: '#F2F3F5', borderRadius: 999, paddingVertical: 4, paddingHorizontal: 10 },
  badgePressed: { opacity: 0.6 },
  badgeText: { fontSize: 12, color: '#333' },

  pills: { flexDirection: 'row', gap: 6, marginTop: 4 },
  pill: { fontSize: 11, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, overflow: 'hidden' },
  pillImportant: { backgroundColor: '#FFF3C4', color: '#8A6D00' },
  pillUrgent: { backgroundColor: '#FFE1E1', color: '#8A0000' },

  swipeBox: { flex:1, justifyContent:'center', paddingHorizontal:16, borderRadius:14 },
  swipeText: { fontSize:14, color:'#333', fontWeight:'600' },
});
