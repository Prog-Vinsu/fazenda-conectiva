import { supabase as supabaseClient } from '@/integrations/supabase/client';

// Wrapper for Supabase client to handle type issues during development
export const supabase = {
  auth: supabaseClient.auth,
  from: (table: string) => (supabaseClient as any).from(table),
  storage: supabaseClient.storage,
  rpc: (fn: string, params?: any) => (supabaseClient as any).rpc(fn, params),
};