
-- TABELA DE PERFIS (PROFILES)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  full_name TEXT,
  role TEXT CHECK (role IN ('CLIENT', 'PROFESSIONAL', 'ADMIN')),
  avatar_url TEXT,
  description TEXT,
  categories TEXT[],
  region TEXT,
  phone TEXT,
  credits INTEGER DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 5.0,
  completed_jobs INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- TABELA DE PEDIDOS (ORDERS)
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.profiles(id),
  client_name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT,
  number TEXT,
  complement TEXT,
  location TEXT NOT NULL, -- Cidade/UF
  neighborhood TEXT,
  deadline TEXT,
  status TEXT DEFAULT 'OPEN',
  lead_price INTEGER DEFAULT 5,
  unlocked_by UUID[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- TABELA DE AVALIAÇÕES (REVIEWS)
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  professional_id UUID REFERENCES public.profiles(id),
  client_id UUID REFERENCES public.profiles(id),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ATIVAR RLS (Segurança de Linha)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS DE ACESSO
CREATE POLICY "Leitura pública de perfis" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Inserção de perfil" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Atualização do próprio perfil" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Leitura pública de ordens" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Inserção de ordens" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Atualização de ordens" ON public.orders FOR UPDATE USING (true);

CREATE POLICY "Leitura de reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Inserção de reviews" ON public.reviews FOR INSERT WITH CHECK (true);
