import { createClient } from '@supabase/supabase-js';

/**
 * Esta configuração detecta as chaves injetadas pelo Vercel ou Vite.
 * O Vercel frequentemente usa NEXT_PUBLIC_ em suas integrações.
 */
const getEnv = (key: string) => {
  if (typeof process !== 'undefined' && process.env) {
    return process.env[`VITE_${key}`] || process.env[key] || process.env[`NEXT_PUBLIC_${key}`];
  }
  const metaEnv = (import.meta as any).env;
  return metaEnv?.[`VITE_${key}`] || metaEnv?.[key];
};

const supabaseUrl = getEnv('SUPABASE_URL') || '';
const supabaseAnonKey = getEnv('SUPABASE_ANON_KEY') || '';

// Validação mínima para não quebrar o cliente
const isValid = supabaseUrl.startsWith('http') && supabaseAnonKey.length > 10;

export const supabase = createClient(
  isValid ? supabaseUrl : 'https://placeholder.supabase.co', 
  isValid ? supabaseAnonKey : 'placeholder'
);

export const supabaseIsConfigured = isValid;
