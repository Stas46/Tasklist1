import { supabase } from '../lib/supabase';

/**
 * Task shape used locally:
 * { id, title, done, important, urgent, projectId, createdAt, updated_at }
 */

export async function fetchTasks() {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return data.map(normalizeFromDb);
}

export async function createTask(t) {
  // Map local shape to DB columns
  const toInsert = {
    title: t.title,
    done: !!t.done,
    quadrant: mapQuadrantToDb(t),
    project_id: t.projectId || null,
    user_id: t.user_id || undefined,
  };
  const { data, error } = await supabase.from('tasks').insert(toInsert).select().single();
  if (error) throw error;
  return normalizeFromDb(data);
}

export async function updateTask(id, patch) {
  const dbPatch = { ...patch };
  if (patch.important !== undefined || patch.urgent !== undefined) {
    dbPatch.quadrant = mapQuadrantToDb(patch);
  }
  if (patch.projectId !== undefined) dbPatch.project_id = patch.projectId;
  delete dbPatch.projectId;
  const { data, error } = await supabase.from('tasks').update(dbPatch).eq('id', id).select().single();
  if (error) throw error;
  return normalizeFromDb(data);
}

export async function deleteTask(id) {
  const { error } = await supabase.from('tasks').delete().eq('id', id);
  if (error) throw error;
}

function normalizeFromDb(row) {
  return {
    id: row.id,
    title: row.title,
    done: !!row.done,
    important: quadrantFromDb(row.quadrant).important,
    urgent: quadrantFromDb(row.quadrant).urgent,
    projectId: row.project_id || 'inbox',
    createdAt: row.created_at || row.updated_at,
    updated_at: row.updated_at,
  };
}

function quadrantFromDb(q) {
  // assume mapping Q1: uv, Q2: v, Q3: u, Q4: o
  if (!q) return { important: false, urgent: false };
  if (q === 'Q1') return { important: true, urgent: true };
  if (q === 'Q2') return { important: true, urgent: false };
  if (q === 'Q3') return { important: false, urgent: true };
  return { important: false, urgent: false };
}

function mapQuadrantToDb(t) {
  // t can be either { important, urgent } or a key like 'uv'|'v'|'u'|'o'
  if (typeof t === 'string') {
    if (t === 'uv') return 'Q1';
    if (t === 'v') return 'Q2';
    if (t === 'u') return 'Q3';
    return 'Q4';
  }
  const imp = !!t.important;
  const urg = !!t.urgent;
  if (imp && urg) return 'Q1';
  if (imp && !urg) return 'Q2';
  if (!imp && urg) return 'Q3';
  return 'Q4';
}
