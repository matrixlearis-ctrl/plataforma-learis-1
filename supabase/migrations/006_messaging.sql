-----------------------------------------------
-- SAMEJ SOCIAL — Migration 006: MENSAGENS
-- Domínio: Comunicação privada
-- Natureza: CRIAR conversations, conversation_participants, messages
-- Rollback: DROP TABLE messages, conversation_participants, conversations.
-- ATENÇÃO: NÃO executar em produção ainda.
-----------------------------------------------

BEGIN;

CREATE TABLE IF NOT EXISTS public.conversations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind          TEXT NOT NULL DEFAULT 'direct' CHECK (kind IN ('direct')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),  -- última atividade
  last_message  TEXT
);
CREATE INDEX IF NOT EXISTS idx_conversations_updated ON public.conversations(updated_at DESC);

CREATE TABLE IF NOT EXISTS public.conversation_participants (
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  profile_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_read_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  left_at         TIMESTAMPTZ,
  PRIMARY KEY (conversation_id, profile_id)
);
CREATE INDEX IF NOT EXISTS idx_conv_participant ON public.conversation_participants(profile_id);

CREATE TABLE IF NOT EXISTS public.messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content         TEXT,
  attachments     JSONB DEFAULT '[]',   -- metadados R2
  status          TEXT NOT NULL DEFAULT 'sent'
                  CHECK (status IN ('sent','delivered','read','deleted','blocked')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_messages_conv ON public.messages(conversation_id, created_at);

GRANT SELECT ON public.conversations, public.conversation_participants, public.messages
TO authenticated;
GRANT ALL ON public.conversations, public.conversation_participants, public.messages
TO service_role;

COMMIT;