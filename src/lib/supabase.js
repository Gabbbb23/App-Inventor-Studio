import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jpupnppqjwianuwpcuoo.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpwdXBucHBxandpYW51d3BjdW9vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4NDg2OTYsImV4cCI6MjA5MDQyNDY5Nn0.DYNYnqz3trAnDCtv6_Ipm6TfUGypfQPXtkoV2zcMa5U';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ─── Auth ────────────────────────────────────────────────────────────────────

export async function signUp(email, password) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// ─── Projects ────────────────────────────────────────────────────────────────

export async function saveProject(name, projectData) {
  const user = await getUser();
  if (!user) throw new Error('Not signed in');

  const { data, error } = await supabase
    .from('projects')
    .upsert(
      { user_id: user.id, name, data: projectData, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,name' }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function loadProject(id) {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function listProjects() {
  const user = await getUser();
  if (!user) throw new Error('Not signed in');

  const { data, error } = await supabase
    .from('projects')
    .select('id, name, updated_at, created_at')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function deleteProject(id) {
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
