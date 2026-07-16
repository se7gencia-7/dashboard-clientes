import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL  = 'https://bynejkhwcvxccjeevjiv.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5bmVqa2h3Y3Z4Y2NqZWV2aml2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MDIyMjUsImV4cCI6MjA5NzM3ODIyNX0.EGMhFZSA_Z_DwO0x5QYKgKBfLnUIug7tizGDJi5xw3k';

const globalForSupa = global as unknown as { supa: ReturnType<typeof createClient> };

const _supa = globalForSupa.supa ?? createClient(SUPABASE_URL, SUPABASE_ANON);

if (process.env.NODE_ENV !== 'production') globalForSupa.supa = _supa;

// Safe RPC wrapper without strict generic typing
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function rpc(fn: string, args?: Record<string, unknown>): Promise<{ data: unknown; error: { message: string } | null }> {
  return (_supa.rpc as any)(fn, args);
}

export interface DbUser {
  id: string;
  email: string;
  password: string;
  name: string;
  role: string;
  userType: string;
  clientId: string | null;
}

export async function findUserByEmail(email: string): Promise<DbUser | null> {
  const { data, error } = await rpc('get_user_by_email', { p_email: email });
  if (error || !data) return null;
  return data as DbUser;
}

export async function se7TeamExists(): Promise<boolean> {
  const { data } = await rpc('se7_team_exists');
  return !!data;
}

export async function userExists(email: string): Promise<boolean> {
  return (await findUserByEmail(email)) !== null;
}

export async function createUser(params: {
  id: string; email: string; password: string;
  name: string; role: string; userType: string;
}): Promise<DbUser> {
  const { data, error } = await rpc('create_user', {
    p_id: params.id, p_email: params.email, p_password: params.password,
    p_name: params.name, p_role: params.role, p_user_type: params.userType,
  });
  if (error || !data) throw new Error(error?.message ?? 'Failed to create user');
  return data as DbUser;
}
