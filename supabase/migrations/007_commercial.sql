-----------------------------------------------
-- SAMEJ SOCIAL — Migration 007: DOMÍNIO COMERCIAL
-- Domínio: Serviços, Portfólio, Orçamentos, Leads, Avaliações
-- Natureza: CRIAR service_categories/services/portfolio/quote_requests/leads
--           + EVOLUIR reviews (add-only)
-- Rollback: novo = DROP TABLE; reviews = DROP COLUMN (status, verified_purchase,
--           moderation_reason).
-- OBS: orders legada permanece intacta até migration de dados aprovada;
--      quote_requests é a tabela nova (exige usuário autenticado - AJUSTE 4).
-- ATENÇÃO: NÃO executar em produção ainda.
-----------------------------------------------

BEGIN;

-- 1. CATEGORIAS E SERVIÇOS ------------------------------------------------
CREATE TABLE IF NOT EXISTS public.service_categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  icon        TEXT,           -- nome do ícone (lucide) - UI mapeia
  active      BOOLEAN NOT NULL DEFAULT true,
  order_index INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.services (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES public.service_categories(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  active      BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_services_category ON public.services(category_id);

CREATE TABLE IF NOT EXISTS public.professional_services (
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  PRIMARY KEY (profile_id, service_id)
);
CREATE TABLE IF NOT EXISTS public.company_services (
  company_id UUID NOT NULL REFERENCES public.company_profiles(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  PRIMARY KEY (company_id, service_id)
);

-- Seed das categorias atuais (espelha constants.tsx; admin poderá criar mais).
INSERT INTO public.service_categories (slug, name, icon, order_index) VALUES
  ('obras',                    'Construções e Reformas',        'Hammer',    1),
  ('eletrica',                 'Eletricista',                   'Lightbulb', 2),
  ('telhado',                  'Telhado',                       'Home',      3),
  ('pintura',                  'Pintura',                       'Paintbrush',4),
  ('gesso',                    'Gesso e Drywall',               'Layers',    5),
  ('jardim',                   'Jardinagem',                    'Shovel',    6),
  ('tecnico',                  'Climatização e ar condicionado','Wrench',    7),
  ('cuidadores-de-idosos',     'Cuidador de Idosos',            'Users',     8),
  ('diarista',                 'Diarista',                      'Sparkles',  9),
  ('churrasqueiro-em-domicilio','Churrasqueiro em domicílio',   'Flame',     10),
  ('cozinheiras-em-domicilio', 'Cozinheira em domicílio',       'ChefHat',   11),
  ('massagista',               'Massagista',                    'Heart',     12),
  ('arquitetos',               'Arquitetos',                    'Compass',   13),
  ('outros',                   'Outros Serviços',               'PlusCircle',14)
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, icon = EXCLUDED.icon;

-- 2. PORTFÓLIO --------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.portfolio_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  description   TEXT,
  category_id   UUID REFERENCES public.service_categories(id),
  location      TEXT,
  date_performed DATE,
  media         JSONB DEFAULT '[]',      -- metadados R2 (urls/thumb)
  before_after  JSONB DEFAULT '{}',
  status        TEXT NOT NULL DEFAULT 'published'
                CHECK (status IN ('published','deleted','hidden')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_portfolio_owner ON public.portfolio_items(owner_id, created_at DESC);

-- 3. QUOTE_REQUESTS (requer usuário autenticado - AJUSTE 4) --------------------
CREATE TABLE IF NOT EXISTS public.quote_requests (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id  UUID REFERENCES public.service_categories(id),
  service_id   UUID REFERENCES public.services(id),
  title        TEXT,
  description  TEXT NOT NULL,
  location     TEXT,
  neighborhood TEXT,
  city         TEXT,
  state        TEXT,
  budget       DECIMAL(10,2),
  deadline     DATE,
  images       JSONB DEFAULT '[]',       -- metadados R2 (sem PII pública)
  status       TEXT NOT NULL DEFAULT 'open'
               CHECK (status IN ('open','matched','closed','cancelled','expired')),
  visibility   TEXT NOT NULL DEFAULT 'public'
               CHECK (visibility IN ('public','private')),
  view_count   BIGINT NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_qr_status_created ON public.quote_requests(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_qr_city            ON public.quote_requests(city, state);
CREATE INDEX IF NOT EXISTS idx_qr_requester       ON public.quote_requests(requester_id);

-- 4. QUOTES (propostas/propostas de profissionais) ---------------------------
CREATE TABLE IF NOT EXISTS public.quotes (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_request_id UUID NOT NULL REFERENCES public.quote_requests(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message        TEXT,
  estimated_value DECIMAL(10,2),
  status         TEXT NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending','accepted','declined','expired')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (quote_request_id, professional_id)
);

-- 5. LEADS (domínio separado de créditos/assinaturas) --------------------------
CREATE TABLE IF NOT EXISTS public.leads (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_request_id UUID NOT NULL REFERENCES public.quote_requests(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  price          INTEGER NOT NULL DEFAULT 0,      -- custo em créditos
  status         TEXT NOT NULL DEFAULT 'available'
                 CHECK (status IN ('available','claimed','purchased','expired','refunded')),
  purchased_at   TIMESTAMPTZ,
  transaction_id UUID REFERENCES public.payments(id),  -- FK definida na 008
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (quote_request_id, professional_id)
);
CREATE INDEX IF NOT EXISTS idx_leads_professional ON public.leads(professional_id, status);

-- 6. REVIEWS V2 (evoluir add-only) ---------------------------------------------
ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS status             TEXT NOT NULL DEFAULT 'approved'
        CHECK (status IN ('pending','approved','rejected','removed')),
  ADD COLUMN IF NOT EXISTS verified_purchase  BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS moderation_reason  TEXT;

-- FKs de reviews p/ empresas também (alvo pode ser company)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'reviews_company_fk' AND conrelid = 'public.reviews'::regclass) THEN
    ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS company_id uuid;
    ALTER TABLE public.reviews
      ADD CONSTRAINT reviews_company_fk FOREIGN KEY (company_id) REFERENCES public.company_profiles(id) ON DELETE CASCADE;
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_reviews_status ON public.reviews(status);

GRANT SELECT ON public.service_categories, public.services, public.professional_services,
  public.company_services, public.portfolio_items, public.quote_requests, public.quotes,
  public.leads TO anon, authenticated;
GRANT ALL ON public.service_categories, public.services, public.professional_services,
  public.company_services, public.portfolio_items, public.quote_requests, public.quotes,
  public.leads TO service_role;

COMMIT;