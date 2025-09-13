import { supabase } from '../lib/supabase';

export async function signUp(email, password) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data.user;
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.user;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export function onAuthStateChange(cb) {
  const sub = supabase.auth.onAuthStateChange((_event, session) => {
    const u = session?.user ?? null;
    if (u) cb({ id: u.id ?? null, email: u.email ?? null });
    else cb(null);
  });
  return sub;
}
