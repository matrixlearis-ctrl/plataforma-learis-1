-----------------------------------------------
-- SAMEJ SOCIAL — Migration 010: SEGURANÇA / RLS / TRIGGERS
-- Domínio: Segurança (matriz de acesso seção 7 da FASE 2)
-- Natureza: RLS em tabelas novas + correção das políticas críticas da auditoria
-- IMPORTANTE:
--   * Migração coordenada: exige frontend novo (v2) no mesmo deploy;
--     política de profiles muda (checagem legada pode quebrar até o front v2).
--   * Deve ser executada em staging e testada (tests/attack_tests_v21.sql)
--     antes de qualquer promoção. NÃO executar em produção isolada.
-- ROLLBACK: revogar policies/triggers/functions (não destrutivo p/ dados).
-----------------------------------------------

BEGIN;

-- =========================================================================
-- A. TRIGGER helpers
-- =========================================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END $$;

-- =========================================================================
-- B. TRIGGER de proteção financeira/de papéis em profiles ------------------
-- Impede auto-promoção a ADMIN, troca de plano, créditos, status e
-- verified/featured pelo cliente. Qualquer alteração nesses campos exige
-- ADMIN/SUPER_ADMIN ou contexto de backend (service_role/postgres).
-- =========================================================================
CREATE OR REPLACE FUNCTION public.protect_profile_privileges()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_privileged boolean;
BEGIN
  v_privileged := (session_user IN ('postgres','supabase_admin','service_role'))
                  OR public.is_admin(auth.uid());

  IF TG_OP = 'INSERT' THEN
    -- Novo perfil pelo signup: nunca nasce admin; força USER quando tentado.
    IF NOT v_privileged AND NEW.role IN ('ADMIN','SUPER_ADMIN') THEN
      NEW.role := 'USER';
    END IF;
    IF NOT v_privileged THEN
      NEW.plan_id       := NULL;
      NEW.verified      := false;
      NEW.featured      := false;
      NEW.account_status := 'active';
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF NOT v_privileged THEN
      IF NEW.role           IS DISTINCT FROM OLD.role           THEN RAISE EXCEPTION 'alteração de role não permitida'; END IF;
      IF NEW.plan_id        IS DISTINCT FROM OLD.plan_id        THEN RAISE EXCEPTION 'alteração de plano não permitida'; END IF;
      IF NEW.credits        IS DISTINCT FROM OLD.credits        THEN RAISE EXCEPTION 'alteração de créditos não permitida'; END IF;
      IF NEW.verified       IS DISTINCT FROM OLD.verified       THEN RAISE EXCEPTION 'alteração de verificação não permitida'; END IF;
      IF NEW.featured       IS DISTINCT FROM OLD.featured       THEN RAISE EXCEPTION 'alteração de destaque não permitida'; END IF;
      IF NEW.account_status IS DISTINCT FROM OLD.account_status AND
         (OLD.account_status IN ('active','pending') AND NEW.account_status NOT IN ('active','pending'))
                                                               THEN RAISE EXCEPTION 'alteração de status não permitida'; END IF;
    END IF;
    RETURN NEW;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_profiles_protect ON public.profiles;
CREATE TRIGGER trg_profiles_protect
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_privileges();

-- deleted_at = soft delete (AJUSTE 5): apagar dados sensíveis de forma segura
-- é responsabilidade de rotina administrativa, nunca de DELETE de financeiro.
CREATE INDEX IF NOT EXISTS idx_profiles_active
  ON public.profiles(account_status) WHERE deleted_at IS NULL;

-- =========================================================================
-- C. VIEW pública de perfis (sem PII) ---------------------------------------
-- O front v2 lê esta VIEW para público; a tabela profiles fica restrita.
-- =========================================================================
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT
  id, username, full_name, avatar_url, cover_url, description,
  city, state, profession, role, verified, featured, created_at
FROM public.profiles
WHERE deleted_at IS NULL;

GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- =========================================================================
-- D. RLS — PROFILES (correção da política aberta) ---------------------------
-- =========================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Leitura pública de perfis" ON public.profiles;
DROP POLICY IF EXISTS "Inserção de perfil"        ON public.profiles;
DROP POLICY IF EXISTS "Atualização do próprio perfil" ON public.profiles;

CREATE POLICY profiles_select_own_or_admin
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.is_admin(auth.uid()));

CREATE POLICY profiles_insert_self
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY profiles_update_self
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id OR public.is_admin(auth.uid()))
  WITH CHECK (auth.uid() = id OR public.is_admin(auth.uid()));

-- =========================================================================
-- D2. RLS — PERFIS ESPECIALIZADOS E CONTATOS (PII) -------------------------
-- FALHA #2 corrigida: tabelas com PII (phone/whatsapp/cpf/cnpj/email) não
-- tinham RLS — grants de 003/004 deixariam tudo legível por anon.
-- Leitura pública passa a viver em VIEWs sem PII; tabela = só dono/ADMIN.
-- =========================================================================
ALTER TABLE public.professional_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY pro_profiles_select_self_admin
  ON public.professional_profiles FOR SELECT
  USING (profile_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY pro_profiles_insert_self
  ON public.professional_profiles FOR INSERT
  WITH CHECK (profile_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY pro_profiles_update_self
  ON public.professional_profiles FOR UPDATE
  USING (profile_id = auth.uid() OR public.is_admin(auth.uid()))
  WITH CHECK (profile_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY pro_profiles_delete_admin
  ON public.professional_profiles FOR DELETE
  USING (public.is_admin(auth.uid()));

ALTER TABLE public.company_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY comp_profiles_select_self_admin
  ON public.company_profiles FOR SELECT
  USING (profile_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY comp_profiles_insert_self
  ON public.company_profiles FOR INSERT
  WITH CHECK (profile_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY comp_profiles_update_self
  ON public.company_profiles FOR UPDATE
  USING (profile_id = auth.uid() OR public.is_admin(auth.uid()))
  WITH CHECK (profile_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY comp_profiles_delete_admin
  ON public.company_profiles FOR DELETE
  USING (public.is_admin(auth.uid()));

ALTER TABLE public.profile_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY contacts_select_owner_or_visible
  ON public.profile_contacts FOR SELECT
  USING (
    profile_id = auth.uid()
    OR public.is_admin(auth.uid())
    OR public.is_contact_visible(id)
  );
CREATE POLICY contacts_insert_self
  ON public.profile_contacts FOR INSERT
  WITH CHECK (profile_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY contacts_update_self
  ON public.profile_contacts FOR UPDATE
  USING (profile_id = auth.uid() OR public.is_admin(auth.uid()))
  WITH CHECK (profile_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY contacts_delete_self
  ON public.profile_contacts FOR DELETE
  USING (profile_id = auth.uid() OR public.is_admin(auth.uid()));

ALTER TABLE public.profile_contact_visibility ENABLE ROW LEVEL SECURITY;
CREATE POLICY cv_select_owner_admin
  ON public.profile_contact_visibility FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profile_contacts c WHERE c.id = profile_contact_visibility.profile_contact_id AND c.profile_id = auth.uid())
    OR public.is_admin(auth.uid())
  );
CREATE POLICY cv_insert_owner
  ON public.profile_contact_visibility FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profile_contacts c WHERE c.id = profile_contact_visibility.profile_contact_id AND c.profile_id = auth.uid())
    OR public.is_admin(auth.uid())
  );

-- VIEWs públicas SEM PII (front v2 usa estas para cards/diretórios)
CREATE OR REPLACE VIEW public.public_professionals AS
SELECT
  id, profile_id, profession, specialties, experience_years, formation,
  description, city, state, created_at
FROM public.professional_profiles
WHERE active = true;

CREATE OR REPLACE VIEW public.public_companies AS
SELECT
  id, profile_id, company_name, description, logo_url, cover_url,
  city, state, website, social_links, team, created_at
FROM public.company_profiles
WHERE active = true;

GRANT SELECT ON public.public_professionals, public.public_companies TO anon, authenticated;

-- =========================================================================
-- E. RLS — ORDERS (legada): mantida até front v2; hardening em 911 opcional --
-- =========================================================================
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
-- (políticas legadas continuam; ver 911_orders_hardening.sql quando o
--  novo fluxo de quote_requests entrar)

-- =========================================================================
-- F. RLS — NOVAS TABELAS SOCIAIS -------------------------------------------
-- =========================================================================

-- POSTS ------------------------------------------------------------
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY posts_select
  ON public.posts FOR SELECT
  USING (
    author_id = auth.uid()
    OR (status = 'published' AND NOT EXISTS (
          SELECT 1 FROM public.profiles p WHERE p.id = posts.author_id AND p.account_status = 'deleted'))
    OR public.is_admin(auth.uid())
  );
CREATE POLICY posts_insert
  ON public.posts FOR INSERT
  WITH CHECK (
    author_id = auth.uid()
    AND public.effective_permission(auth.uid(), 'can_publish')
  );
CREATE POLICY posts_update_own
  ON public.posts FOR UPDATE
  USING (author_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY posts_delete_own
  ON public.posts FOR DELETE
  USING (author_id = auth.uid() OR public.is_admin(auth.uid()));

-- POST_MEDIA ----------------------------------------------------------
ALTER TABLE public.post_media ENABLE ROW LEVEL SECURITY;
CREATE POLICY post_media_select
  ON public.post_media FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_media.post_id));
CREATE POLICY post_media_insert
  ON public.post_media FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_media.post_id AND p.author_id = auth.uid()));
CREATE POLICY post_media_delete_owner
  ON public.post_media FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_media.post_id AND (p.author_id = auth.uid() OR public.is_admin(auth.uid()))));

-- COMMENTS ------------------------------------------------------------
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY comments_select
  ON public.comments FOR SELECT
  USING (status = 'published' OR public.is_admin(auth.uid()));
CREATE POLICY comments_insert
  ON public.comments FOR INSERT
  WITH CHECK (author_id = auth.uid());
CREATE POLICY comments_update_own
  ON public.comments FOR UPDATE
  USING (author_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY comments_delete_own
  ON public.comments FOR DELETE
  USING (author_id = auth.uid() OR public.is_admin(auth.uid()));

-- LIKES ----------------------------------------------------------------
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY likes_select ON public.likes FOR SELECT USING (true);
CREATE POLICY likes_insert_own ON public.likes FOR INSERT WITH CHECK (profile_id = auth.uid());
CREATE POLICY likes_delete_own ON public.likes FOR DELETE USING (profile_id = auth.uid() OR public.is_admin(auth.uid()));

-- SHARES / SAVES --------------------------------------------------------
ALTER TABLE public.shares ENABLE ROW LEVEL SECURITY;
CREATE POLICY shares_select ON public.shares FOR SELECT USING (true);
CREATE POLICY shares_insert_own ON public.shares FOR INSERT WITH CHECK (profile_id = auth.uid());
CREATE POLICY shares_delete_own ON public.shares FOR DELETE USING (profile_id = auth.uid() OR public.is_admin(auth.uid()));

ALTER TABLE public.saves ENABLE ROW LEVEL SECURITY;
CREATE POLICY saves_select ON public.saves FOR SELECT USING (true);
CREATE POLICY saves_insert_own ON public.saves FOR INSERT WITH CHECK (profile_id = auth.uid());
CREATE POLICY saves_delete_own ON public.saves FOR DELETE USING (profile_id = auth.uid() OR public.is_admin(auth.uid()));

-- FOLLOWS --------------------------------------------------------------
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY follows_select ON public.follows FOR SELECT USING (true);
CREATE POLICY follows_insert_own ON public.follows FOR INSERT WITH CHECK (follower_id = auth.uid());
CREATE POLICY follows_delete_own ON public.follows FOR DELETE USING (follower_id = auth.uid() OR public.is_admin(auth.uid()));

-- HASHTAGS / POST_HASHTAGS -------------------------------------------------
ALTER TABLE public.hashtags ENABLE ROW LEVEL SECURITY;
CREATE POLICY hashtags_select ON public.hashtags FOR SELECT USING (true);
ALTER TABLE public.post_hashtags ENABLE ROW LEVEL SECURITY;
CREATE POLICY post_hashtags_select ON public.post_hashtags FOR SELECT USING (true);
CREATE POLICY post_hashtags_insert
  ON public.post_hashtags FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_hashtags.post_id AND p.author_id = auth.uid()));
CREATE POLICY post_hashtags_delete
  ON public.post_hashtags FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_hashtags.post_id AND (p.author_id = auth.uid() OR public.is_admin(auth.uid()))));

-- STORIES -------------------------------------------------------------
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
CREATE POLICY stories_select
  ON public.stories FOR SELECT
  USING (
    author_id = auth.uid()
    OR (status = 'published' AND expires_at > now())
    OR public.is_admin(auth.uid())
  );
CREATE POLICY stories_insert
  ON public.stories FOR INSERT
  WITH CHECK (author_id = auth.uid() AND public.effective_permission(auth.uid(), 'can_create_stories'));
CREATE POLICY stories_update_own  ON public.stories FOR UPDATE USING (author_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY stories_delete_own  ON public.stories FOR DELETE USING (author_id = auth.uid() OR public.is_admin(auth.uid()));

ALTER TABLE public.story_media ENABLE ROW LEVEL SECURITY;
CREATE POLICY story_media_select ON public.story_media FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.stories s WHERE s.id = story_media.story_id));
CREATE POLICY story_media_insert ON public.story_media FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.stories s WHERE s.id = story_media.story_id AND s.author_id = auth.uid()));

ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY story_views_insert_own ON public.story_views FOR INSERT WITH CHECK (profile_id = auth.uid());
CREATE POLICY story_views_select_author
  ON public.story_views FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.stories s WHERE s.id = story_views.story_id AND (s.author_id = auth.uid() OR public.is_admin(auth.uid()))));

-- REELS ---------------------------------------------------------------
ALTER TABLE public.reels ENABLE ROW LEVEL SECURITY;
CREATE POLICY reels_select
  ON public.reels FOR SELECT
  USING (author_id = auth.uid() OR (status = 'published') OR public.is_admin(auth.uid()));
CREATE POLICY reels_insert
  ON public.reels FOR INSERT
  WITH CHECK (author_id = auth.uid() AND public.effective_permission(auth.uid(), 'can_create_reels'));
CREATE POLICY reels_update_own  ON public.reels FOR UPDATE USING (author_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY reels_delete_own  ON public.reels FOR DELETE USING (author_id = auth.uid() OR public.is_admin(auth.uid()));

ALTER TABLE public.reel_media ENABLE ROW LEVEL SECURITY;
CREATE POLICY reel_media_select ON public.reel_media FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.reels r WHERE r.id = reel_media.reel_id));
CREATE POLICY reel_media_insert ON public.reel_media FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.reels r WHERE r.id = reel_media.reel_id AND r.author_id = auth.uid()));

ALTER TABLE public.reel_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY reel_views_insert_own ON public.reel_views FOR INSERT WITH CHECK (profile_id = auth.uid());
CREATE POLICY reel_views_select_author
  ON public.reel_views FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.reels r WHERE r.id = reel_views.reel_id AND (r.author_id = auth.uid() OR public.is_admin(auth.uid()))));

-- NOTIFICATIONS -------------------------------------------------------
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY notifications_select_own  ON public.notifications FOR SELECT USING (profile_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY notifications_update_own  ON public.notifications FOR UPDATE USING (profile_id = auth.uid()) WITH CHECK (profile_id = auth.uid());
CREATE POLICY notifications_insert_own  ON public.notifications FOR INSERT WITH CHECK (profile_id = auth.uid() OR public.is_admin(auth.uid()));

-- BLOCKS ----------------------------------------------------------------
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY blocks_select_own  ON public.blocks FOR SELECT USING (blocker_id = auth.uid() OR blocked_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY blocks_insert_own  ON public.blocks FOR INSERT WITH CHECK (blocker_id = auth.uid());
CREATE POLICY blocks_delete_own  ON public.blocks FOR DELETE USING (blocker_id = auth.uid() OR public.is_admin(auth.uid()));

-- MENSAGENS ---------------------------------------------------------------
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY conversations_select_participant
  ON public.conversations FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.conversation_participants cp WHERE cp.conversation_id = conversations.id AND cp.profile_id = auth.uid()));
CREATE POLICY conversations_insert_owner
  ON public.conversations FOR INSERT
  WITH CHECK (true);

ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY conv_participants_select
  ON public.conversation_participants FOR SELECT
  USING (
    profile_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.conversation_participants me WHERE me.conversation_id = conversation_participants.conversation_id AND me.profile_id = auth.uid())
  );
CREATE POLICY conv_participants_insert_self
  ON public.conversation_participants FOR INSERT
  WITH CHECK (profile_id = auth.uid());
CREATE POLICY conv_participants_update_self
  ON public.conversation_participants FOR UPDATE
  USING (profile_id = auth.uid());

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY messages_select_participant
  ON public.messages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.conversation_participants cp
    WHERE cp.conversation_id = messages.conversation_id AND cp.profile_id = auth.uid()));
CREATE POLICY messages_insert_sender
  ON public.messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND public.effective_permission(auth.uid(), 'can_send_messages')
    AND NOT EXISTS (
      SELECT 1
      FROM public.conversation_participants cp_other
      JOIN public.blocks b
        ON (b.blocker_id = sender_id AND b.blocked_id = cp_other.profile_id)
        OR (b.blocker_id = cp_other.profile_id AND b.blocked_id = sender_id)
      WHERE cp_other.conversation_id = messages.conversation_id
        AND cp_other.profile_id <> sender_id
    )
  );
CREATE POLICY messages_delete_own
  ON public.messages FOR DELETE
  USING (sender_id = auth.uid() OR public.is_admin(auth.uid()));

-- =========================================================================
-- G. RLS — DOMÍNIO COMERCIAL -------------------------------------------------
-- =========================================================================
ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY sc_select ON public.service_categories FOR SELECT USING (active OR public.is_admin(auth.uid()));
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
CREATE POLICY s_select ON public.services FOR SELECT USING (active OR public.is_admin(auth.uid()));
ALTER TABLE public.professional_services ENABLE ROW LEVEL SECURITY;
CREATE POLICY ps_select ON public.professional_services FOR SELECT USING (true);
CREATE POLICY ps_insert_own ON public.professional_services FOR INSERT WITH CHECK (profile_id = auth.uid() OR public.is_admin(auth.uid()));
ALTER TABLE public.company_services ENABLE ROW LEVEL SECURITY;
CREATE POLICY cs_select ON public.company_services FOR SELECT USING (true);
CREATE POLICY cs_insert_company
  ON public.company_services FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.company_profiles cp WHERE cp.id = company_services.company_id AND cp.profile_id = auth.uid()));

ALTER TABLE public.portfolio_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY portfolio_select
  ON public.portfolio_items FOR SELECT
  USING (status = 'published' OR owner_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY portfolio_insert
  ON public.portfolio_items FOR INSERT
  WITH CHECK (owner_id = auth.uid() AND public.effective_permission(auth.uid(), 'can_publish'));
CREATE POLICY portfolio_update_own
  ON public.portfolio_items FOR UPDATE
  USING (owner_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY portfolio_delete_own
  ON public.portfolio_items FOR DELETE
  USING (owner_id = auth.uid() OR public.is_admin(auth.uid()));

-- VIEW pública de quote_requests (sem PII do solicitante) -----------------
CREATE OR REPLACE VIEW public.public_quote_requests AS
SELECT
  q.id, q.category_id, q.service_id, q.title, q.description,
  q.location, q.neighborhood, q.city, q.state, q.budget, q.deadline,
  q.status, q.created_at
FROM public.quote_requests q
WHERE q.status = 'open';

ALTER TABLE public.quote_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY qr_select_public_card
  ON public.quote_requests FOR SELECT
  USING (
    requester_id = auth.uid()
    OR (status = 'open' AND visibility = 'public')
    OR public.is_admin(auth.uid())
  );
CREATE POLICY qr_insert_authenticated
  ON public.quote_requests FOR INSERT
  WITH CHECK (requester_id = auth.uid() AND public.effective_permission(auth.uid(), 'can_request_quote'));
CREATE POLICY qr_update_own
  ON public.quote_requests FOR UPDATE
  USING (requester_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY qr_delete_admin
  ON public.quote_requests FOR DELETE
  USING (public.is_admin(auth.uid()));

ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
CREATE POLICY quotes_select_related
  ON public.quotes FOR SELECT
  USING (
    professional_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.quote_requests q WHERE q.id = quotes.quote_request_id AND q.requester_id = auth.uid())
    OR public.is_admin(auth.uid())
  );
CREATE POLICY quotes_insert_professional
  ON public.quotes FOR INSERT
  WITH CHECK (professional_id = auth.uid() AND public.effective_permission(auth.uid(), 'can_receive_leads'));

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY leads_select_owner
  ON public.leads FOR SELECT
  USING (professional_id = auth.uid() OR public.is_admin(auth.uid()) OR EXISTS (
     SELECT 1 FROM public.quote_requests q WHERE q.id = leads.quote_request_id AND q.requester_id = auth.uid()));
-- escrita de leads: SOMENTE backend (service_role/Edge) — nenhum cliente insere

-- REVIEWS ------------------------------------------------------------------
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Leitura de reviews" ON public.reviews;
DROP POLICY IF EXISTS "Inserção de reviews" ON public.reviews;
CREATE POLICY reviews_select_approved
  ON public.reviews FOR SELECT
  USING (status = 'approved' OR client_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY reviews_insert_authenticated
  ON public.reviews FOR INSERT
  WITH CHECK (client_id = auth.uid());

-- =========================================================================
-- H. RLS — MONETIZAÇÃO -------------------------------------------------------
-- =========================================================================
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY plans_select ON public.plans FOR SELECT USING (active OR public.is_admin(auth.uid()));

ALTER TABLE public.plan_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY plan_permissions_select ON public.plan_permissions FOR SELECT USING (true);

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY ss_select ON public.system_settings FOR SELECT USING (true);
CREATE POLICY ss_update_admin ON public.system_settings FOR UPDATE USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY subscriptions_select_own
  ON public.subscriptions FOR SELECT
  USING (profile_id = auth.uid() OR public.is_admin(auth.uid()));

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins podem ver todos os pagamentos" ON public.payments;
DROP POLICY IF EXISTS "Usuários podem ver próprios pagamentos" ON public.payments;
CREATE POLICY payments_select_own
  ON public.payments FOR SELECT
  USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

ALTER TABLE public.credits_ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY ledger_select_own
  ON public.credits_ledger FOR SELECT
  USING (profile_id = auth.uid() OR public.is_admin(auth.uid()));

-- =========================================================================
-- I. RLS — ADMIN / MODERAÇÃO -------------------------------------------------
-- =========================================================================
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY admin_users_select_admin ON public.admin_users FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY admin_users_insert_admin ON public.admin_users FOR INSERT WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY admin_users_update_admin ON public.admin_users FOR UPDATE USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY admin_users_delete_admin ON public.admin_users FOR DELETE USING (public.is_admin(auth.uid()));

ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY admin_logs_select_admin ON public.admin_logs FOR SELECT USING (public.is_admin(auth.uid()));

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY reports_select_admin ON public.reports FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY reports_insert_authenticated ON public.reports FOR INSERT WITH CHECK (reporter_id = auth.uid());
CREATE POLICY reports_update_admin ON public.reports FOR UPDATE USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- =========================================================================
-- J. TRIGGERS de updated_at -----------------------------------------------
-- =========================================================================
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['profiles','plans','subscriptions','posts','comments','reels','stories',
                           'conversations','portfolio_items','quote_requests',
                           'reports','admin_users','professional_profiles','company_profiles',
                           'profile_contacts','profile_contact_visibility','payments']
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%s_updated ON public.%I', t, t);
    EXECUTE format('CREATE TRIGGER trg_%s_updated BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()', t, t);
  END LOOP;
END $$;

COMMIT;