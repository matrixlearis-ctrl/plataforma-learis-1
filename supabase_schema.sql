
-- TABELA DE PERFIS (PROFILES)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  full_name TEXT,
  role TEXT CHECK (role IN ('CLIENT', 'PROFESSIONAL', 'ADMIN')),
  avatar_url TEXT,
  description TEXT,
  categories TEXT[], -- Array de categorias
  region TEXT,
  phone TEXT,
  credits INTEGER DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 5.0,
  completed_jobs INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- TABELA DE PEDIDOS (ORDERS)
CREATE TABLE public.orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.profiles(id),
  client_name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT NOT NULL,
  neighborhood TEXT,
  deadline TEXT,
  status TEXT DEFAULT 'OPEN',
  lead_price INTEGER DEFAULT 5,
  unlocked_by UUID[] DEFAULT '{}', -- IDs dos profissionais que compraram o lead
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- TABELA DE AVALIAÇÕES (REVIEWS)
CREATE TABLE public.reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  professional_id UUID REFERENCES public.profiles(id),
  client_id UUID REFERENCES public.profiles(id),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ATIVAR RLS (ROW LEVEL SECURITY)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS PARA PROFILES
-- 1. Qualquer um pode ler perfis (para o diretório e login)
CREATE POLICY "Leitura pública de perfis" ON public.profiles FOR SELECT USING (true);

-- 2. Usuários podem criar seu próprio perfil (o que você fez no print)
CREATE POLICY "Inserção de perfil por usuários autenticados" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- 3. Usuários podem atualizar apenas seu próprio perfil
CREATE POLICY "Atualização do próprio perfil" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- POLÍTICAS PARA ORDERS
-- 1. Qualquer um pode ver ordens abertas
CREATE POLICY "Leitura pública de ordens" ON public.orders FOR SELECT USING (true);

-- 2. Clientes podem criar ordens
CREATE POLICY "Clientes criam ordens" ON public.orders FOR INSERT WITH CHECK (true);

-- 3. Profissionais podem atualizar ordens (para desbloquear leads)
CREATE POLICY "Atualização de ordens por profissionais" ON public.orders FOR UPDATE USING (true);
