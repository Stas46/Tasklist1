import { supabase } from '../lib/supabase';

export async function fetchProjects() {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return data.map(row => ({ id: row.id, name: row.name, emoji: row.emoji || '📁', created_at: row.created_at, updated_at: row.updated_at }));
}

export async function createProject(p) {
  const toInsert = { id: p.id, name: p.name, emoji: p.emoji || '📁', user_id: p.user_id };
  const { data, error } = await supabase.from('projects').insert(toInsert).select().single();
  if (error) throw error;
  return { id: data.id, name: data.name, emoji: data.emoji || '📁', created_at: data.created_at, updated_at: data.updated_at };
}

export async function updateProject(id, patch) {
  const { data, error } = await supabase.from('projects').update(patch).eq('id', id).select().single();
  if (error) throw error;
  return { id: data.id, name: data.name, emoji: data.emoji || '📁', created_at: data.created_at, updated_at: data.updated_at };
}

export async function deleteProject(id) {
  const { error } = await supabase.from('projects').delete().eq('id', id);
  if (error) throw error;
}
