
import { createClient } from '@supabase/supabase-js';

// Chaves extraídas diretamente do seu projeto configurado.
// Override opcional via VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY
// (ex.: apontar o front para um outro projeto durante os testes de dev).
const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://rkeirrjseieecgbtaqju.supabase.co';
const SUPABASE_ANON_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJrZWlycmpzZWllZWNnYnRhcWp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NDQ3MTcsImV4cCI6MjEwNDMyMDcxN30.dtlcnbi5JJzsbjro7_drYg1c5ncIeVxdIBeN359EeV4';

export const supabaseIsConfigured = true;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  db: {
    schema: 'public'
  }
});
