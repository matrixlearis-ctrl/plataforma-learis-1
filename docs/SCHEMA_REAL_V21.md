# SAMEJ SOCIAL — OBTER O SCHEMA REAL DO STAGING (ANTES DE MIGRAR)

> Objetivo: capturar o schema ATUAL do banco (staging de teste, nunca produção)
> para que as migrations V2.1 sejam executadas sobre a mesma base real e para
> detectar divergências antes de qualquer `CREATE`.

## 1. Fatos já conhecidos (auditoria 06/09/2026 — podem divergir)
| Item | supabase_schema.sql (legado) | Banco REAL (observado) | Ação |
|---|---|---|---|
| `profiles.email` | NÃO existe | **EXISTE** (via REST) | conferir coluna real |
| `orders.image_url` | NÃO existe | **EXISTE** (via REST) | conferir coluna real |
| `profiles_role_check` | `CHECK (role IN ('CLIENT','PROFESSIONAL','ADMIN'))` | nome auto-gerado, confirmar | 001 depende do nome |
| `profiles.*` extras | region/rating/completed_jobs | conferir tipos | não assumir |
| `orders.*` extras | — | conferir | não assumir |
| `payments.mercadopago_id` UNIQUE | sim | conferir | convive com gateway_payment_id |

> **Regra:** `supabase_schema.sql` é histórico, NÃO é fonte de verdade.
> Sempre capturar o schema do próprio staging antes de aplicar 001–010.

## 2. Comandos para capturar o schema real

### 2.1 Via Supabase CLI (recommendado)
```powershell
supabase db pull --db-url $env:STAGING_DB_URL
# gera ./supabase/migrations/timestamp_init.sql com o schema real completo
```

### 2.2 Via psql (schema relacional de `public`)
```powershell
psql $env:STAGING_DB_URL -c "\d+ public.profiles"
psql $env:STAGING_DB_URL -c "\d+ public.orders"
psql $env:STAGING_DB_URL -c "\d+ public.reviews"
psql $env:STAGING_DB_URL -c "\d+ public.payments"
```

### 2.3 Consultas de inventário (constraints/fks/indexes/policies/functions/triggers)
```sql
-- Tabelas existentes em public
SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY 1;

-- Colunas por tabela (tipo + not null + default)
SELECT table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema='public' ORDER BY table_name, ordinal_position;

-- Constraints (inclui nome do CHECK de role!)
SELECT conrelid::regclass AS tabela, conname, pg_get_constraintdef(oid)
FROM pg_constraint WHERE connamespace='public'::regnamespace ORDER BY 1,2;

-- Foreign keys
SELECT conrelid::regclass AS de, pg_get_constraintdef(oid) AS fk
FROM pg_constraint WHERE contype='f' AND connamespace='public'::regnamespace;

-- Índices
SELECT tablename, indexname, indexdef FROM pg_indexes WHERE schemaname='public' ORDER BY 1,2;

-- Políticas RLS
SELECT tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies WHERE schemaname='public' ORDER BY tablename, policyname;

-- Funções (aridade/definer)
SELECT proname, pg_get_function_arguments(oid) AS args, prolang, prosecdef, proconfig
FROM pg_proc WHERE pronamespace='public'::regnamespace
  AND prokind='f' ORDER BY proname;

-- Triggers
SELECT event_object_table, trigger_name, action_timing, event_manipulation
FROM information_schema.triggers WHERE trigger_schema='public' ORDER BY 1,2;

-- Roles e grants (sem valores de credenciais)
SELECT grantee, table_schema, table_name, privilege_type
FROM information_schema.role_table_grants WHERE table_schema='public'
ORDER BY grantee, table_name;
```

### 2.4 Schema `auth` e Storage (não entram em dump de public)
```sql
-- auth.users (metadados, NUNCA senhas)
SELECT id, email, created_at, last_sign_in_at, raw_app_meta_data->>'provider' AS provider
FROM auth.users ORDER BY created_at;

-- buckets de Storage
SELECT name, public, file_size_limit, allowed_mime_types
FROM storage.buckets;
```

## 3. Comparar com o esperado (diff)
1. Salvar dump real em `docs/schema_staging_YYYYMMDD.sql` (fora do git? — melhor: manter no git
   pois não contém dados PII; contém apenas estrutura. OK versionar).
2. Comparar colunas reais `profiles` e `orders` vs. migrations 001 (espera `username`, etc.).
3. Confirmar que a constraint de role chama-se **`profiles_role_check`** antes do 001;
   caso contrário, ajustar o `DO $$`do 001 para o nome real (não fabricar nome).
4. Confirmar que `orders`/`reviews`/`payments` seguem com as colunas esperadas pelas migrations
   add-only (008 usa `user_id`, `status`, `credits`, `amount`, `updated_at`).

## 4. Gatilhos de alerta (PARAR antes de migrar)
- `profiles` sem colunas esperadas pela v2 (ex.: não tem `id` PK, ou tipos diferentes).
- `orders`/`payments` com tipos incompatíveis (ex.: `lead_price` number vs `price` integer).
- Nome de constraint de role diferente de `profiles_role_check` (ex.: duplicada).
- Existência de tabelas que as migrations 001–010 também criam (`plans`, `posts`...) **já existirem**
  com estrutura divergente → as `CREATE TABLE IF NOT EXISTS` silenciosamente manteriam a antiga.

## 5. Saída esperada deste passo
- `/docs/schema_staging_YYYYMMDD.sql`
- `/docs/SCHEMA_DIFF_V21.md` (resultado da comparação) — com lista de divergências aceitas/ajustadas.