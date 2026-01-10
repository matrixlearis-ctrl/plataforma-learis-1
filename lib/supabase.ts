
import { createClient } from '@supabase/supabase-js';

const getEnv = (key: string) => {
  if (typeof process !== 'undefined' && process.env) {
    const value = process.env[`VITE_${key}`] || 
                  process.env[key] || 
                  process.env[`NEXT_PUBLIC_${key}`];
    if (value) return value;
  }
  
  try {
    const metaEnv = (import.meta as any).env;
    if (metaEnv) {
      return metaEnv[`VITE_${key}`] || 
             metaEnv[key] || 
             metaEnv[`NEXT_PUBLIC_${key}`];
    }
  } catch (e) {}
  
  // URL extraída do seu projeto Supabase
  if (key === 'SUPABASE_URL') return 'https://vhtbnptfxilcukytuoba.supabase.co';
  
  // Chave 'anon public' fornecida para conexão
  if (key === 'SUPABASE_ANON_KEY') return 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZodGJucHRmeGlsY3VreXR1b2JhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwNjI1ODYsImV4cCI6MjA4MzYzODU4Nn0.1E8wO0faIl-eYxWW84GhsDXHwmkc4VBS19-k_zu4gGg'; 
  
  return '';
};

const supabaseUrl = getEnv('SUPABASE_URL');
const supabaseAnonKey = getEnv('SUPABASE_ANON_KEY');

// Verifica se a chave foi preenchida corretamente
export const supabaseIsConfigured = supabaseUrl && supabaseUrl.includes('supabase.co') && 
                                   supabaseAnonKey && supabaseAnonKey.length > 20;

export const supabase = createClient(
  supabaseIsConfigured ? supabaseUrl : 'https://vhtbnptfxilcukytuoba.supabase.co',
  supabaseIsConfigured ? supabaseAnonKey : 'placeholder-key'
);
