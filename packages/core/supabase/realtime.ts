import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Setup Supabase client with safe fallback defaults for local offline/standalone execution
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://xyzcompany.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder';

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

type RealtimeCallback = (payload: any) => void;

/**
 * Subscribe to realtime updates on a specific table for a specific user.
 */
export function subscribeToTableUpdates(
  table: string,
  userId: string,
  onUpdate: RealtimeCallback
) {
  return supabase
    .channel(`${table}_changes`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: table,
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        onUpdate(payload);
      }
    )
    .subscribe();
}

/**
 * Send a message via broadcast channel (e.g. for typing indicators)
 */
export async function broadcastState(channelId: string, state: any) {
  const channel = supabase.channel(channelId);
  return channel.send({
    type: 'broadcast',
    event: 'state_update',
    payload: state,
  });
}
