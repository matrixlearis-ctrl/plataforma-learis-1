
import { createClient } from '@supabase/supabase-js';

// Chaves extraídas diretamente do seu projeto configurado
const SUPABASE_URL = 'https://vhtbnptfxilcukytuoba.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZodGJucHRmeGlsY3VreXR1b2JhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwNjI1ODYsImV4cCI6MjA4MzYzODU4Nn0.1E8wO0faIl-eYxWW84GhsDXHwmkc4VBS19-k_zu4gGg';

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
