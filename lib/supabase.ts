import { createClient } from '@supabase/supabase-js';

/**
 * Esta função tenta buscar as chaves de conexão de diversas fontes comuns.
 * Vite usa VITE_, Vercel pode usar NEXT_PUBLIC_ ou o nome direto.
 */
const getEnv = (key: string) => {
  // Tenta buscar no process.env (Node/Vercel)
  if (typeof process !== 'undefined' && process.env) {
    const value = process.env[`VITE_${key}`] || 
                  process.env[key] || 
                  process.env[`NEXT_PUBLIC_${key}`];
    if (value) return value;
  }
  
  // Tenta buscar no import.meta.env (Vite nativo)
  try {
    const metaEnv = (import.meta as any).env;
    if (metaEnv) {
      return metaEnv[`VITE_${key}`] || 
             metaEnv[key] || 
             metaEnv[`NEXT_PUBLIC_${key}`];
    }
  } catch (e) {
    // Silencioso se não houver meta env
  }
  
  // FALLBACK: Se não encontrar nas variáveis de ambiente, usa as chaves do seu print
  if (key === 'SUPABASE_URL') return 'https://vhtbnptfxilcukytuoba.supabase.co';
  if (key === 'SUPABASE_ANON_KEY') return 'sb_publishable_5-VE4umrcjhuSA1lFdzjDg_tNfgxMfK';
  
  return '';
};

const supabaseUrl = getEnv('SUPABASE_URL');
const supabaseAnonKey = getEnv('SUPABASE_ANON_KEY');

// Verifica se as chaves são minimamente válidas
const isValid = (url: string, key: string) => {
  return url && url.startsWith('http') && key && key.length > 10;
};

export const supabaseIsConfigured = isValid(supabaseUrl, supabaseAnonKey);

// Inicializa o cliente com as chaves detectadas
export const supabase = createClient(
  supabaseIsConfigured ? supabaseUrl : 'https://placeholder-project.supabase.co',
  supabaseIsConfigured ? supabaseAnonKey : 'placeholder-key'
);
