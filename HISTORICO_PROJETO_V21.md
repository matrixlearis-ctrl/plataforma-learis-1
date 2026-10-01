# SAMEJ SOCIAL — HISTÓRICO COMPLETO DO PROJETO (Registro da evolução)

> Documento-memória: tudo o que foi feito, decidido e documentado ao longo do
> projeto de migração da plataforma para a arquitetura V2.1.
> Atualizado até: **2026-09-30 — Landing/cadastro novo implementados; fotos de
> perfil/capa via Supabase Storage; `R2_PUBLIC_URL` no custom domain
> `media-staging.samej.site` + DELETE autenticado na `r2-upload`; sistema antigo
> (Serviços/Profissionais/Ofertas) removido — aguardando revisão visual do dono.**
> Data desta atualização: **2026-09-30**. Diretriz oficial v2 do dono 2026-09-29
> (PROMPT DE CONTINUIDADE — evolução para PLATAFORMA social+profissional+comercial):
> ver **§12**. 2ª parte do prompt (UI/UX — "experiência semelhante ao Facebook"): **§12.23
> → §12.24**. Implementações de 2026-09-29/30: **§12.25, §12.26, §12.27**.

---

## ÍNDICE
1. [Contexto e ponto de partida](#1-contexto-e-ponto-de-partida)
2. [FASE 1 — Revisão e Decisões de Arquitetura](#2-fase-1--revisao-e-decisoes-de-arquitetura)
3. [FASE 2 — Plano de Migração V2.1](#3-fase-2--plano-de-migracao-v21)
4. [FASE 3 — Criação das Migrations 001–010 + 911](#4-fase-3--criacao-das-migrations-001010--911)
5. [FASE 3.1 — Validação Estática (git blast + revisão das migrations)](#5-fase-31--validacao-estatica-git-blast--revisao-das-migrations)
6. [FASE 3.2 — Preparação do Staging Kit (documentação + testes + fixture)](#6-fase-32--preparacao-do-staging-kit)
7. [FASE 3.3 — Conexão do STAGING](#7-fase-33--conexao-do-staging)
8. [FASE 3.4 (início) — Connection string do STAGING](#71-fase-34-inicio--connection-string-do-staging-recebida-e-validada)
9. [FASE 3.4 (retomada) — canal SQL + migrations 001–010 no STAGING](#72-fase-34-retomada--canal-sql--migrations-001010-no-staging)
10. [FASE 4.1 — Núcleo Social (DB + front)](#73-fase-41--nucleo-social-db--front)
11. [FASE 4.1 — Ciclo final: STAGING/R2/REVISÃO](#74-fase-41--ciclo-final-stagingr2revisao)
9. [Estado atual do repositório / lagomela](#8-estado-atual-do-repositorio--lagomela)
9. [Inventário completo de arquivos](#9-inventario-completo-de-arquivos)
10. [Pendências e próximos passos](#10-pendencias-e-proximos-passos)
11. [Linha do tempo resumida](#11-linha-do-tempo-resumida)
12. [Diretriz oficial v2 — PROMPT DE CONTINUIDADE SAMEJ (2026-09-29)](#12-diretriz-oficial-v2--prompt-de-continuidade-samej-2026-09-29)
13. [§12.25 — UI/UX do Núcleo Social (F4.1)](#1225-uiux-do-nucleo-social--implementacao-f41-2026-09-29)
14. [§12.26 — Landing + Cadastro novo (fluxo email-link)](#1226-landing--cadastro-novo-fluxo-email-link-2026-09-29)
15. [§12.27 — Fotos perfil/capa (Storage) + remoção sistema antigo + R2/DELETE](#1227-fotos-de-perfilcapa-storage-2026-09-29--remocao-do-sistema-antigo)

---

## 1. Contexto e ponto de partida

- Projeto: **SAMEJ SOCIAL** — rede social estilo Instagram/LinkedIn para conectar
  pessoas, profissionais e empresas, com monetização por créditos e assinaturas.
- Stack: **Next.js** (páginas em `pages/`) + **Supabase** (PostgreSQL + Auth +
  Storage) hospedado em **Vercel**.
- Repositório base original: `plataforma-learis-1-main`.
- Base de dados existente (schema legado): `supabase_schema.sql` — com tabelas
  `profiles`, `orders`, `reviews`, entre outras.
- Problemas identificados no legado:
  - Mercado de **leads** baseado em **orders** pedidos de serviço (v1).
  - `orders` sem RLS eficaz (política pública `USING (true)`).
  - `profiles` sem chave forte de plano/vantagens, sem RLS de linhas.
  - Monetização frágil (sem ledger de créditos, sem histórico de assinaturas).
  - Admin por email **hardcodado** em `pages/Auth.tsx:122`.
  - Front mocka PIX (`pages/RechargeCredits.tsx`).
  - Edge Functions do Mercado Pago sem auth de webhook/idempotência.

---

## 2. FASE 1 — Revisão e Decisões de Arquitetura

Decisões aprovadas nesta fase:

| Decisão | Escolha |
|---|---|
| Orientação do produto | Rede social (IG/LinkedIn) — pessoas comuns = futuros leads |
| Marketplaces | Leads trocados por **quote_requests** (pedido de orçamento) |
| Fluxo de negócio | Profissional envia quote → usuário aceita → lead pago com créditos |
| Créditos | **credits_ledger** é a FONTE DA VERDADE; `profiles.credits` é cache |
| Assinaturas | `subscriptions` = histórico comercial; plano efetivo = `profiles.plan_id` |
| Admin | `admin_users` + `is_admin()` (sem email hardcodado) |
| Hosting | Continua **Vercel** |
| Storage/CDN | **R2** fica para depois (Fase 5) |
| Pagamentos | **Mercado Pago permanece** (Stripe = abstração futura) |
| Framework de metadados | Migrations numeradas e por domínio (001–010) |
| Estratégia de migração | Não destrutiva, com rollback, camada de adaptação se necessário |
| RLS | Ativado por padrão em todas as tabelas novas + correção das legadas |

---

## 3. FASE 2 — Plano de Migração V2.1

Entregáveis desta fase:
- `MIGRATION_PLAN_V21.md` — plano completo da V2.1 (modelo, tabelas, RLS, créditos,
  administração, cronograma).
- `BACKUP_PLAN.md` — plano de backup/rollback de produção.

Decisões-chave registradas:
- Única origem de verdade para permissões de plano: `plan_permissions.compile` +
  função `effective_permission`.
- Views/triggers garantem integridade (soma do crédito = soma do ledger).
- Admin via `admin_users` (com `SUPER_ADMIN`); `profiles.role` guarda papel público.
- `is_admin()` SEM SECURITY DEFINER no legado → corrigido para SECURITY DEFINER
  com search_path restrito na V2.1.
- Regra de ouro de segurança: **nenhum cliente altera créditos/pagamentos/assinar**,
  somente backend (service_role) via token.

---

## 4. FASE 3 — Criação das Migrations 001–010 + 911

Migrations criadas em `supabase/migrations/` (cada uma em domínio próprio):

| Arquivo | Domínio |
|---|---|
| `001_profiles_v21.sql` | Augmentar `profiles` (username, cover, verified, featured, account_status, deleted_at, plan_id, updated_at, role CHECK) |
| `002_plans_permissions.sql` | `plans`, `plan_permissions`, `system_settings`, função `effective_permission`, FK `plan_id`, seed de planos |
| `003_professional_company_profiles.sql` | Perfis profissionais e de empresas (com PII, RLS em 010) |
| `004_contacts.sql` | Contatos (`profile_contacts` + `profile_contact_visibility`) e `is_contact_visible` |
| `005_social_core.sql` | posts, reels, stories, comments, likes, shares, saves, followed, notifications, blocks (17 tabelas) |
| `006_messaging.sql` | conversations, conversation_participants, messages |
| `007_commercial.sql` | categorias, serviços, portfolio, quote_requests, quotes, leads + reviews add-only |
| `008_monetization.sql` | payments add-only, subscriptions, credits_ledger, funções `add_credits`/`spend_credits` |
| `009_admin.sql` | admin_users, admin_logs, reports, `is_admin`, `has_admin_permission` |
| `010_security.sql` | Matriz completa de RLS, views públicas sem PII, triggers `set_updated_at` |
| `911_orders_hardening.sql` | (OPCIONAL/FUTURO) hardening das policies de `orders` — **NÃO EXECUTAR nesta fase** |

Notas:
- Cada migration é **não destrutiva** (add-only) com rollback documentado no cabeçalho.
- `credits` em `profiles` = cache; `credits_ledger` = fonte da verdade.
- Payments/Subscriptions: usuário não interage com SGD — via backend.
- RLS voltado: abrir leitura do card público, manter PII protegida.

---

## 5. FASE 3.1 — Validação Estática (git blast + revisão das migrations)

Processo executado nesta fase:

1. **Git do projeto**: `git init` na raiz `Rede social`.
   - Commit `ee7c023` — "Snapshot pre-v21: estado atual (marketplace) antes da migracao V2.1" (117 arquivos).
   - Tag `pre-v21` → `ee7c023` (protegida).
2. **Auditoria estática** das migrations 001–010 + 911 para execução sequencial → **8 falhas** encontradas:
   1. `002` chamava `is_admin()` (criada só no 009) numa função `LANGUAGE sql` → convertida para plpgsql + SECURITY DEFINER + search_path.
   2. **PII LEAK**: `010` não habilitava RLS em professional/company profiles/contacts → adicionadas policies e views públicas sem PII.
   3. `add_credits`/`spend_credits` com EXECUTE público → REVOGADO para PUBLIC/anon/authenticated; GRANT só service_role.
   4. Trigger `set_updated_at` em `conversation_participants` (coluna inexistente) → removido do loop.
   5. Política de portfolio anon com bug NULL (`owner_id <> NULL` = NULL) → corrigida com `status='published' OR owner_id=auth.uid() OR is_admin()`.
   6. `messages_insert_sender` sem checagem correta de bloqueio → reescrita com join em conversations/participants.
   7. ADMIN não conseguia atualizar profiles de terceiros → adicionado `OR is_admin()` no USING/WITH CHECK.
   8. Menores: ALTER duplicado de `plan_permissions`; FK `payments_subscription_fk` no 010 não idempotente → movido após criação de `subscriptions`.
   - Também: revogado EXECUTE de `is_admin`/`has_admin_permission` (009) e `is_contact_visible` (004) de PUBLIC/anon.
3. **Commit**: `d6cc54f` — "FASE 3.1 validacao: corrigir 8 falhas encontradas na revisao de migrations".
4. Relatório "SAMEJ SOCIAL — FASE 3.1 · VALIDAÇÃO" entregue (validado até estático; staging bloqueado; backup real pendente).

---

## 6. FASE 3.2 — Preparação do Staging Kit

Kit completo criado (todas as partes):

| Parte | Arquivo |
|---|---|
| 1 | Auditoria Git (master, commits, tag) |
| 2 | `docs/STAGING_SETUP_V21.md` — passo a passo do staging |
| 3 | `docs/SCHEMA_REAL_V21.md` — procedimento de captura do schema real (divergências: `profiles.email`, `orders.image_url`, `profiles_role_check`) |
| 4 | `scripts/staging_sanitize.sql` — fixture sintética com PII mascarada, UUIDs fixos |
| 5 | `docs/RUN_MIGRATIONS_V21.md` — ordem 001→010, log, PARAR em falha, 911 marcada "NÃO EXECUTAR" |
| 6 | `supabase/migrations/tests/security_tests_v21.sql` (18 cenários) + `RESULTS_V21.md` + `scripts/run_staging_tests.ps1` (runner com classificação PASS/FAIL/NOT TESTABLE) |
| 7 | `tests/security_definer_v21.sql` (is_admin, has_admin_permission, effective_permission, is_contact_visible, add/spend_credits) |
| 8 | `tests/credits_ledger_v21.sql` (inicial, purchase, spend, refund, boost, insuficiente, invariante, rollback, duplicidade) |
| 9 | `tests/contact_visibility_v21.sql` (FREE/pro/exceção admin/burla) |
| 10 | `tests/migrate_client_user_v21.sql` (CLIENT→USER preserva UUID/email/orders/reviews/payments, em ROLLBACK) |
| 11 | `tests/orders_pii_v21.sql` (911 simulada em transação revertida) |
| 12 | `docs/PRODUCTION_BACKUP_CHECKLIST_V21.md` (planejado × realizado) |
| 13 | `SAMEJ_SOCIAL_FASE_3_2_STAGING_KIT.md` (relatório final do kit) |

**Fixture (UUIDs fixos)** — usados por todos os testes:
- `FREE`    = `11111111-1111-4111-8111-111111111111` (role USER, plano free)
- `PRO`     = `22222222-2222-4222-8222-222222222222` (role PROFESSIONAL, plano pro)
- `OTHER`   = `33333333-3333-4333-8333-333333333333` (role USER, contatos ocultos)
- `PROF`    = `44444444-4444-4444-8444-444444444444` (role PROFESSIONAL, recebe lead)
- `ADMIN`   = `55555555-5555-4555-8555-555555555555` (role ADMIN + admin_users ativo)
- `COMPANY` = `66666666-6666-4666-8666-666666666666` (role COMPANY, plano company)

**Melhorias de segurança detectadas durante a enumeração dos 18 testes (aplicadas)**:
- `008_monetization.sql` — `spend_credits` ganhou `p_type` (`lead_spend|boost|refund|expiry|admin_adjust`); grants atualizados para a nova assinatura (6 args).
- `010_security.sql` — `messages_insert_sender` agora exige participação na conversa (fechava injeção de mensagens em conversas alheias).
- `docs/STAGING_SETUP_V21.md` — ordem corrigida: **sanitize após migrations 001–010**.

Regra de ouro executada: **não pedir/registrar credenciais** e **não tocar produção**, não rodar 911, não iniciar Fase 4, não implementar MP/R2 front-v2 sem sinal verde.

---

## 7. FASE 3.3 — Conexão do STAGING

- Projeto Supabase STAGING criado pelo dono: ref `rkeirrjseieecgbtaqju`,
  URL `https://rkeirrjseieecgbtaqju.supabase.co`.
- Chaves fornecidas (public/adservice): publishable, secret, anon (public JWT) e service_role.
- Guardadas **somente localmente** em `C:\Users\<user>\AppData\Local\Temp\opencode\staging_credentials.json`
  (fora do repositório; nada versionado; nada impresso no chat).
- **Resultado da bateria de validação REST**:
  - GoTrue v2.196.0 saudável.
  - `anon` e `service_role` autenticadas com sucesso.
  - Todas as tabelas (plans, profiles, subscriptions, credits_ledger, admin_users,
    quote_requests, reviews, posts, conversations…) → **404 = schema vazio**
    (as migrations 001–010 ainda não foram aplicadas).
- **BLOQUEIO identificado**: a REST API não executa `DDL`. Para aplicar as migrations
  e rodar os testes, é necessário um **canal SQL** (psql/Supabase CLI) com a senha
  do banco de staging — que fica somente local (sem digitar no chat).
- Produção (**samej.site**) **intocada**. Migração `911` **não executada**.

---

## 7.1. FASE 3.4 (início) — Connection string do STAGING recebida e validada
- O dono forneceu a connection string do banco do staging e a deixou num arquivo
  chamado literalmente `%TEMP%opencodestaging_db_url.txt` **dentro da raiz do repo**
  (`Rede social\`). Isso contraria a regra de "segredo não versionado", então:
  - Validada a **porta de destino** antes de qualquer outra coisa:
    - Formato: `postgresql://postgres:<senha>@db.rkeirrjseieecgbtaqju.supabase.co:5432/postgres`
    - Host = `db.rkeirrjseieecgbtaqju.supabase.co` (projeto STAGING alvo = **rkeirrjseieecgbtaqju**) ✔
    - Porta 5432 (conexão direta, não pooler).
  - **Movida para fora do repositório**: agora no local padrão de segredos locais
    `C:\Users\<user>\AppData\Local\Temp\opencode\staging_db_url.txt`. (Log: `repo_limpo=True`.)
- **Ferramenta SQL**: não há psql/supabase CLI/docker no ambiente. Definido o plano:
  baixar os **binários oficiais portáteis do PostgreSQL 16.8** (EDB `get.enterprisedb.com`,
  zip `postgresql-16.8-1-windows-x64-binaries.zip` — disponível, HTTP 200) e usar
  `psql.exe` sem instalação.
- Download iniciado, porém **lento/truncado pela lentidão do PC** (1,4 MB baixados num
  primeiro corte; retomada via `curl.exe -C -` em andamento quando o PC travou).
  **Suspenso para o dono reiniciar o PC.**
- Nenhuma migration executada ainda. Nenhum dado tocado. Nenhum segredo em arquivo versionado.

---

## 7.2. FASE 3.4 (retomada) — canal SQL + migrations 001–010 no STAGING
- **psql portátil** instalado (binários oficiais do PostgreSQL da EDB) em
  `%TEMP%\opencode\pgsql\pgsql\bin\psql.exe` (sem instalar nada no PC).
- Conexão ao STAGING via **pooler** (`aws-0-us-east-1.pooler.supabase.com:5432`,
  usuário `postgres.rkeirrjseieecgbtaqju`, db `postgres`); senha somente local em
  `%TEMP%\opencode\staging_db_url.txt` (nunca digitada no chat).
- **Prática definitiva de execução**: psql direto na sessão com `PGPASSWORD`
  (e `PGCLIENTENCODING=UTF8`, `-f` com arquivo). Tentativas com **subprocesso**
  (`powershell.exe -File` / `Start-Process`) foram **abandonadas**: dispararam
  prompt de UAC no desktop do dono ("Senha para o usuário James Silva").
- Migrations **001–010 aplicadas no STAGING**; **911 NÃO executada**.
  Divergência confirmada: `profiles.email` não existe (e-mail vive em `auth.users`,
  conforme previsão do `SCHEMA_REAL_V21.md`).
- Fixture sintética aplicada (`scripts/staging_sanitize.sql`, UUIDs fixos &
  documentos/emails mascarados).
- **Regressão V2.1 (pós-011), suítes automatizadas do Staging Kit** — todas **PASS** (exit 0):
  - `F1 security_definer_v21.sql` — funções security definer (is_admin, permissions, credits).
  - `F2 credits_ledger_v21.sql` — ledger (inicial, compra, gasto, reembolso, invariante, duplicidade).
  - `F3 migrate_client_user_v21.sql` — CLIENT→USER preserva UUID/orders/reviews/payments (em ROLLBACK).
  - `F4 orders_pii_v21.sql` — 911 simulada em transação revertida.
  - `contact_visibility_v21.sql` — visibilidade de contato (FREE/pro/admin/burla) PASS.
  - `attack_tests_v21.sql` e `security_tests_v21.sql`: **scripts manuais (deny-tests)**
    para o SQL editor do Supabase — psql não interpola `:var` dentro de `$$…$$`;
    fora do critério automatizado (linha "permission denied" = comportamento esperado).
- Comportamento do schema **inalterado** pela 011 em relação às suítes V21 (sem regressão).

---

## 7.3. FASE 4.1 — Núcleo Social (DB + front)
- Migration **`011_fase41_social_core.sql`** (posts, post_media, likes, comments,
  follows, views, `can_publish_profile`, `get_plan_limit`, trigger
  `enforce_post_media_rules` — vídeo bloqueado, quotas via `plan_limits`, RLS
  próprios) criada e **aplicada no STAGING** (produção NÃO).
- Suite **`fase41_social_core_tests.sql`** → **26 OK / 0 FAIL**.
- Front social (Etapas B–H):
  - `types.ts`: `UserRole` + USER/PROFESSIONAL/COMPANY/ADMIN (e CLIENT);
    interfaces `Social*`; `document?` em `ProfessionalProfile`.
  - `lib/supabase.ts`: URL/chave sobrescrevíveis via `VITE_SUPABASE_URL` /
    `VITE_SUPABASE_ANON_KEY` (fallback = produção).
  - `lib/social.ts` (feed, post detail, curtir, comentários — regex "letras",
    seguir, contagens, `canPublishProfile`, limites) e `lib/uploads.ts` +
    `lib/imageUtils.ts` (compressão antes do upload + presigned PUT).
  - Edge Function **`supabase/functions/r2-upload/index.ts`** (Deno, presigned PUT
    SigV4, secrets `R2_ACCOUNT_ID/R2_ACCESS_KEY_ID/R2_SECRET_ACCESS_KEY/R2_BUCKET/
    R2_PUBLIC_URL`).
  - Componentes/páginas: `PostCard`, `pages/Feed.tsx`, `pages/CreatePost.tsx`,
    `pages/PostDetail.tsx`, `pages/SocialProfile.tsx`; rotas `/feed`, `/publicar`
    (ProtectedRoute), `/post/:id`, `/social/:id`; Navbar com links Social/Publicar.
  - `tsconfig.json` exclui `supabase/functions` do bundle; `npm install` OK;
    **`npm run build` PASS**; **`npx tsc --noEmit` limpo** (corrigidos erros
    pré-existentes: `import.meta.env` em `lib/mercadopago.ts` e `document?`).
  - `.env.example` documenta overrides + secrets R2.
- Marco registrado: **FASE 4.1 NÚCLEO SOCIAL IMPLEMENTADO — AGUARDANDO REVISÃO**.

---

## 7.4. FASE 4.1 — Ciclo final: STAGING/R2/REVISÃO
- **`.env` local** criado (fora do git — `.gitignore` cobre `.env`), apontando
  **exclusivamente para o STAGING**. Build verificado por grep no bundle:
  `rkeirrjseieecgbtaqju` presente e `vhtbnptfxilcukytuoba` (produção) **ausente**.
- **STAGING CONNECTION: PASS** — anon key do STAGING autenticada na REST API
  (`ANON OK`), da mesma forma que o navegador usará.
- **Matriz funcional STAGING** (`%TEMP%\opencode\f41_matrix_staging.sql`):
  **27/27 PASS** — limites (FREE=20/PRO=80/COMPANY=80/profree=20, via plan_limits),
  feed USER e anon, NEGAR publish USER / profissional não aprovado / vídeo,
  PERMITIR pro e company, like + duplicado + descurtir + impersonação, follow +
  duplicado + deixar + auto-follow + impersonação, comentário válido (letras) +
  recusa número/URL/@/# + impersonação, update/delete de post alheio NEGADO,
  dono edita/apaga o próprio post, PII de `profiles` oculto.
- **Descobertas metodológicas**: RLS de UPDATE/DELETE oculta linhas **silenciosamente**
  (sem erro) → asserts por `ROW_COUNT`/contagem, não por exceção; `SET ROLE` persiste
  entre DO blocks → `RESET ROLE` no fim de cada bloco; `set_config` sem destino
  eleva erro → usar `PERFORM`.
- **CLI Supabase**: pacote npm não tem binário win32-x64 → baixado o **binário
  oficial v2.117.0** (GitHub releases, `supabase_windows_amd64.tar.gz` 57 MB) em
  `%TEMP%\opencode\supabase-cli\supabase.exe`. Access token pessoal (sbp_…) do dono
  usado; `projects list` OK (`samej-social-staging`, ACTIVE_HEALTHY).
- **Edge Function `r2-upload` deployada ao STAGING**, com **verify_jwt=True**
  (via Management API `PATCH /v1/projects/{ref}/functions/r2-upload`): sem JWT → 401;
  com anon key → 500 apenas por falta dos **secrets R2** (comportamento esperado,
  resposta `"R2 não configurado no projeto (secrets)."`).
- **Git**: `git status` auditado — sem secrets; `.env` não versionado; mudanças e
  arquivos novos conforme §§7.3/7.4; nada commitado sem ordem do dono.
- **Pendentes (bloqueados por credenciais)**:
  - Secrets R2 no STAGING: `R2_ACCOUNT_ID` (Account ID Cloudflare, ≠ nome de conta,
    32 chars), `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` (Manage R2 API Tokens —
    Object Read & Write), `R2_BUCKET`, `R2_PUBLIC_URL`.
  - Teste E2E real de upload (compressão → presigned PUT → URL pública R2).
  - Revisão visual pelo dono (login, feed, post, perfil — desktop e mobile).
  - Relatório final curto + marcador `FASE 4.1 — STAGING/R2/REVISÃO CONCLUÍDA`.

> **R2 CONCLUÍDO (mesmo dia, atualização)**
> - Secrets R2 **setados** no STAGING (token sbp_… novo com escopo secrets; o
>   primeiro token não tinha permissão — 401 em `secrets set`/Management API).
> - Bucket `samej-staging-media`, público via `r2.dev`:
>   `https://pub-d5ed6d58e8ed4d0099dae0e93122b7a0.r2.dev` (configurado como
>   `R2_PUBLIC_URL`).
> - **E2E completo**: usuário de teste criado via admin API → login (GoTrue) →
>   function devolve presigned PUT → **PUT 200** → objeto confirmado no bucket
>   (S3 ListObjectsV2, SigV4 via Python stdlib) → **GET público 200** (image/png).
> - **Bug corrigido na function**: assinatura incluía o bucket no path do host
>   virtual-hosted (`<bucket>.<account>.r2…`) → objeto gravado com chave duplicada
>   `bucket/chave`; corrigido para assinar só a chave e redeployado; objeto inválido
>   removido (DELETE 204).
> - Artefatos de teste removidos (objetos + usuário `e2e.upload@samej.test`).
> - **Atenção**: a limpeza do `%TEMP%` apagou `staging_db_url.txt` (senha do banco)
>   e `staging_credentials.json` (recriado). A **senha do banco STAGING precisa ser
>   reenviada** pelo dono para futuras operações SQL.
- **Arquitetura confirmada pelo dono**: Samej atual (base preservada) →
  **Samej Social** (nova camada: perfil, publicação, feed, curtidas, comentários,
  seguidores) → depois **Samej Social + Marketplace/Leads** (orçamento → lead →
  pagamento R$ 19,90 → desbloqueio do contato → PRO → WhatsApp). Produção intocada;
  911 não executada; FASE 4.2 não iniciada.

---

## 8. Estado atual do repositório / lagomela

- Branch: `master`; HEAD: `d6cc54f` (FASE 3.1) — nenhum commit novo na 3.2/3.3.
- Tag: `pre-v21` → `ee7c023` (protegida, intacta).
- Arquivos da 3.2 estão **untracked** (não commitados; nenhum segredo presente em arquivos versionados).
- Duas migrations modificadas na 3.2 mas **não commitadas**: `008`, `010` (alterações de segurança descritas acima).
- Nenhum arquivo versionado contém chaves/secrets (verificado por grep de `sb_secret_`, `sb_publishable_`, etc.).
- Arquivo `%TEMP%opencodestaging_db_url.txt` (com a connection string) foi **removido da raiz do repo**
  em 07/09/2026 e está agora em `%TEMP%\opencode\staging_db_url.txt` (fora do repositório).

---

## 9. Inventário completo de arquivos

**Raiz**
- `README.md` — visão geral do projeto (original).
- `MIGRATION_PLAN_V21.md` — plano V2.1 (FASE 2).
- `BACKUP_PLAN.md` — plano de backup/rollback (FASE 2).
- `SAMEJ_SOCIAL_FASE_3_2_STAGING_KIT.md` — relatório do kit (FASE 3.2, atualizado na 3.3).
- `.env.example` — modelo de variáveis de ambiente.

**docs/**
- `STAGING_SETUP_V21.md` — setup do staging (FASES 3.2/3.3).
- `SCHEMA_REAL_V21.md` — captura do schema real e divergências esperadas.
- `RUN_MIGRATIONS_V21.md` — procedimento de execução das migrations no staging.
- `PRODUCTION_BACKUP_CHECKLIST_V21.md` — checklist backup (planejado × realizado).

**scripts/**
- `staging_sanitize.sql` — fixture sintética (PII mascarada, UUIDs fixos).
- `run_staging_tests.ps1` — runner de testes com SET ROLE + classificação PASS/FAIL/NOT TESTABLE.

**supabase/migrations/**
- `001_profiles_v21.sql` … `010_security.sql` — migrations V2.1 (corrigidas na 3.1/3.2).
- `911_orders_hardening.sql` — **NÃO EXECUTAR nesta fase**.

**supabase/migrations/tests/**
- `security_tests_v21.sql` (18 cenários)
- `security_definer_v21.sql`
- `credits_ledger_v21.sql`
- `contact_visibility_v21.sql`
- `migrate_client_user_v21.sql`
- `orders_pii_v21.sql`
- `RLS_MATRIX_V21.md` + `rls_matrix_v21.sql`
- `attack_tests_v21.sql`
- `RESULTS_V21.md` (modelo de resultados)

**Código-fonte (auditoria/observações)**
- `lib/supabase.ts` — URL do Supabase de produção + anon key (pública por design).
- `pages/Auth.tsx` (linha ~122 — email de admin hardcodado).
- `pages/RechargeCredits.tsx` — PIX mockado.
- `supabase/functions/mercadopago-pix/index.ts` / `mercadopago-webhook/index.ts` — sem auth/idempotência robusta (a tratar na Fase 4).
- `constants.tsx`, `App.tsx` — utilitários.

---

## 10. Pendências e próximos passos

> **⚠ PONTO DE RETOMADA (salvar para depois do reinício do PC):**
> - Connection string do STAGING → `C:\Users\<user>\AppData\Local\Temp\opencode\staging_db_url.txt`
>   (host `db.rkeirrjseieecgbtaqju.supabase.co:5432`, db `postgres`, usuário `postgres`).
> - Chaves do STAGING → `C:\Users\<user>\AppData\Local\Temp\opencode\staging_credentials.json`.
> - psql portátil → baixar `postgresql-16.8-1-windows-x64-binaries.zip` da EDB
>   (`https://get.enterprisedb.com/postgresql/...`, HTTP 200 confirmado); extrair e usar
>   `psql.exe` direto. Download atual foi truncado (1,4 MB) — refazer pós-reboot
>   (`curl.exe -C -` retoma; ou apagar `%TEMP%\opencode\pgsql-bin.zip` e baixar de novo).
> - Ao retomar, executar em ordem: (1) testar conexão `psql "URL" -c "select version()"`,
>   (2) migrations 001–010 via `psql -v ON_ERROR_STOP=1 -f`, logando; **911 NÃO**,
>   (3) `staging_sanitize.sql`, (4) `run_staging_tests.ps1`, (5) preencher `RESULTS_V21.md`.

1. **Canal SQL para o staging** (em andamento): psql portátil 16.8 (EDB) + connection string local.
2. Aplicação das migrations **001–010** (sem 911) no staging com logs.
3. Rodar `staging_sanitize.sql` (fixture) após as migrations.
4. Executar `run_staging_tests.ps1` e preencher `RESULTS_V21.md`.
5. Comparar schema real (`SCHEMA_REAL_V21.md`) e corrigir divergências conhecidas
   (`profiles.email`, `orders.image_url`, `profiles_role_check`).
6. Executar checklist de backup em produção (planejado × realizado) com evidências.
7. Aprovação da V2.1 pelo dono (critérios no Staging Kit, seção 13/14).
8. Depois → coordenação da **FASE 4** (Mercado Pago com webhook autenticado +
   idempotência, storage robusto, front v2). RLSM PII de `orders` dependente da 911
   quando o front v2 deixar de usar `orders`.

> **STATUS ATUALIZADO (2026-09-07, fim do dia)** — itens 1–4 **concluídos**
> (migrations 001–010 aplicadas, fixture OK, regressão V21 F1–F4 + contact PASS);
> item 8 já em curso na **FASE 4.1** (storage R2 + front v2 social). **Próximos**:
> (a) secrets R2 no STAGING + teste E2E de upload; (b) revisão visual pelo dono
> (desktop/mobile); (c) relatório final + marcador FASE 4.1 concluída; (d) aprovação
> do dono antes de qualquer ação em produção; NÃO iniciar FASE 4.2.

> **STATUS ATUALIZADO (2026-09-30, fim da rodada)** — tudo o que será feito nesta
> rodada do fluxo novo foi CONCLUÍDO (detalhes e E2E nas §12.25–12.27):
> - **Implementado**: LP/cadastro novo email-link (`Landing`, `Signup`, `RoleChoice`),
>   `profiles` auto-criada, CPF/CNPJ no `/negocios`, photos de perfil/capa via
>   Supabase Storage + telefone em `/configuracoes` + nome menor, **remoção do sistema
>   antigo** (links Navbar/Footer + rotas + 5 páginas), `R2_PUBLIC_URL` no custom
>   domain (posts permanentes) e **DELETE autenticado** na `r2-upload`; builds/tsc OK.
> - **Próximos (bloqueados por revisão do dono)**: revisão visual/aprovação
>   (desktop+mobile) → depois **FASE ADMIN/MODERAÇÃO** (próxima do roadmap §12.19).
> - **Pendências abertas registradas**: (1) **posts antigos** criados antes da correção
>   guardam URL presigned expirada → imagens 404 (re-publicar); (2) apagar um post não
>   remove o arquivo (front ainda não chama o DELETE novo); (3) **produção** precisará
>   do mesmo arranjo (bucket/domínio/secret `R2_PUBLIC_URL`); (4) vídeos NÃO
>   implementados (imagem-only); (5) `R2_PUBLIC_URL` do staging não deve ser usada em
>   produção (é o custom domain do STAGING).

---

## 11. Linha do tempo resumida

| Data | Fase | Marcos |
|---|---|---|
| — | FASE 1 | Revisão, decisões de arquitetura, plano V2.1 |
| — | FASE 2 | `MIGRATION_PLAN_V21.md` + `BACKUP_PLAN.md` |
| — | FASE 3 | Migrations 001–010 + 911 criadas |
| 2026-09-07 | FASE 3.1 | Git init + tag `pre-v21`, auditoria, 8 falhas corrigidas, commit `d6cc54f` |
| 2026-09-07 | FASE 3.2 | Staging Kit completo (docs, scripts, testes, fixture, checklist) |
| 2026-09-07 | FASE 3.3 | STAGING conectado; REST validado; schema vazio; aguardando canal SQL |
| 2026-09-07 | FASE 3.4 (início) | Connection string do STAGING validada (host `db.rkeirrjseieecgbtaqju.supabase.co`); movida p/ fora do repo; psql portátil 16.8 em download (PC travando → pausa p/ reboot) |
| 2026-09-07 | FASE 3.4 (retomada) | psql portátil; migrations 001–010 no STAGING; fixture; regressão V21 (F1–F4 + contact_visibility PASS); prática psql em-sessão (subprocessos abortados por UAC) |
| 2026-09-07 | FASE 4.1 Núcleo Social | Migration 011 + suite 26/0; frontend social completo (Feed/CreatePost/PostDetail/SocialProfile/routes/Navbar); `npm run build` + `tsc` PASS |
| 2026-09-07 | FASE 4.1 Ciclo final | `.env`→STAGING (bundle sem produção); STAGING CONNECTION PASS; matriz funcional 27/27; CLI 2.118.0; `r2-upload` deployada (verify_jwt=True) |
| 2026-09-07 | FASE 4.1 R2 | Secrets R2 setados; bucket público r2.dev; upload E2E real PASS (presign→PUT 200→objeto OK→GET 200); fix chave duplicada; **aguardando revisão visual do dono** |
| 2026-09-29 | Limpeza STAGING | Todas as contas removidas a pedido do dono (6 perfis + 1 auth real + dados sociais em cascata; legados orders/payments/reviews/quote_requests primeiro; catálogo plans mantido). Bugfix coorte: `email` removido dos upserts de `profiles` (`Auth.tsx` e `UserManagement.tsx`). |
| 2026-09-29 | Diretriz oficial v2 | Dono enviou **PROMPT DE CONTINUIDADE** (ver §12) — plataforma social+profissional+comercial; solicitada 2ª parte. 2ª parte (UI/UX, referência de experiência Facebook) recebida em seguida (ver §12.23). |
| 2026-09-29 | UI/UX Núcleo Social | Implementação F4.1 na árvore social (ver §12.25): SocialShell 3 colunas + bottom nav, Feed/PostCard/PostDetail/SocialProfile FB-like, Profissionais/Empresas/Negócios/Busca/profile redirect; App.tsx bifurcado via isSocialPath (legado intacto); `npx tsc --noEmit` limpo + `npm run build` OK — **aguardando revisão visual/aprovação do dono**. |
| 2026-09-29 | Página inicial FB-like | `/` (convidado) → nova página estilo Facebook de login com logo.png + imagem.png (copiadas de `/image` → `public/images/`); logado → redireciona `/feed`. Imagens não visualizáveis pelo modelo (sem suporte a imagem) — posicionadas lado a lado conforme pedido do dono. |
| 2026-09-29 | Landing + Cadastro novo | `/criar-conta` (Signup em 3 passos form→confirm→role, confirmação por link); `RoleChoice` `/escolher-perfil`; App auto-cria `profiles` p/ quem confirmou fora do fluxo; `/negocios` com CPF/CNPJ obrigatório (ver §12.26). |
| 2026-09-29 | Fotos + ajustes | Upload avatar/capa via **Supabase Storage** (buckets `avatars`/`covers`/`portfolio` + políticas por usuário); botões de câmera no perfil; telefone visível em `/configuracoes`; nome 20% menor (`text-xl`); CTAs de convidado → `/criar-conta`. |
| 2026-09-30 | Remoção sistema antigo | Links **Serviços / Encontrar Profissionais / Ofertas de Trabalho** removidos (Navbar desktop+mobile + Footer); rotas e 5 páginas legadas deletadas (`ServicePage`, `JobOffers`, `JobDetails`, `PublicProfile`, `ProfessionalDirectory`); `NewRequest` sem desvio p/ `/servico`. |
| 2026-09-30 | R2 corrigido + DELETE | `R2_PUBLIC_URL` → **`https://media-staging.samej.site`** (custom domain ativo; posts com URL **permanente**); function `r2-upload` **v8** com **DELETE autenticado** (só arquivos do próprio usuário); E2E PUT 200→DELETE 204→GET 404→chave alheia 403; objeto de teste removido pelo dono (404 confirmado) — **aguardando revisão visual**. |

---

## 12. Diretriz oficial v2 — PROMPT DE CONTINUIDADE SAMEJ (2026-09-29)

> Fonte: documento enviado pelo dono em 2026-09-29 ("evo marketplace → plataforma
> social+profissional+comercial"). É a **direção oficial** do produto. Registro
> completo abaixo (não é um plano de execução imediata — execução é incremental).

### 12.1 Visão e princípios
- Samej **evolui de marketplace para plataforma**: social, profissional, empresarial,
  comercial, descoberta, leads, impulsionamento e publicidade.
- Construção civil é categoria inicial, mas **NÃO limita** o produto (expansível).
- **NÃO refazer do zero; NÃO apagar o marketplace existente; NÃO criar backend/banco
  paralelo; NÃO duplicar sistemas.**
- Estratégia: **INSPECIONAR → PRESERVAR → REUTILIZAR → EVOLUIR → TESTAR**.
- Arquitetura preparada desde já para os módulos futuros (núcleo definitivo, não MVP
  descartável).

### 12.2 Módulos oficiais do produto (16)
1. SOCIAL · 2. MÍDIA · 3. DESCOBERTA · 4. PROFISSIONAIS · 5. EMPRESAS · 6. PRODUTOS ·
7. SERVIÇOS · 8. LEADS · 9. IMPULSIONAMENTO · 10. PUBLICIDADE · 11. INDICAÇÃO ·
12. COMPARTILHAMENTO EXTERNO · 13. ADMINISTRAÇÃO · 14. MODERAÇÃO · 15. MÉTRICAS ·
16. APLICATIVO MOBILE. Implementação incremental SEM reescrever o núcleo.

### 12.3 Estado atual — NÃO REFAZER
Preservar todo o existente: auth, profiles, orders/orçamentos, pagamentos, créditos,
comissões, mensagens, administração, migrations 001–010, V21, Social Core 011
(posts/media/likes/comments/follows/views), RLS, frontend social (Feed, Publish, Post
Detail, Social Profile, Navbar, rotas, build, TypeScript, testes funcionais) e Edge
Function `r2-upload` no STAGING.

### 12.4 STAGING e PRODUÇÃO (regra absoluta)
- **NUNCA alterar produção.** Tudo em STAGING.
- **NÃO executar `911_orders_hardening.sql`** sem autorização explícita.
- Não rodar migrations novas em produção; não testar produção.

### 12.5 R2 (credentials já fornecidas — NÃO pedir de novo)
- Bucket STAGING: `samej-staging-media`. **URL pública oficial confirmada e APLICADA**
  (2026-09-30): `https://media-staging.samej.site` setado no secret `R2_PUBLIC_URL` e
  function `r2-upload` redeployada (v7, verify_jwt=true). E2E: presigned PUT 200 → GET
  via `https://media-staging.samej.site/<key>` 200. Antes esse secret apontava para
  `pub-d5ed6d58...r2.dev` (e chegou a ficar vazio — §12.25/§12.27). Obs.: as credenciais
  do arquivo local `chaves ... R2 ... txt` são de OUTRA conta de R2 (GET/DELETE assinados
  com elas retornaram 400 no staging) — as credenciais efetivas do STAGING são as secrets
  da function.
- Edge Function `r2-upload` já deployada no STAGING com `verify_jwt=true` — continuar
  desse estado. Fluxo oficial: USUÁRIO → FRONTEND → UPLOAD AUTENTICADO → EDGE FUNCTION
  → R2 → MEDIA RECORD → FEED/PERFIL. Sem upload arbitrário não autenticado.

### 12.6 Social — núcleo atual
Preservar/finalizar perfil, feed, publicação, imagem, like, comentário, follow,
visualizações, feed paginado, perfil social, detalhe, UI responsiva. **Feed IMAGE-FIRST**;
vídeos/Reels/Stories são futuros (arquitetura) e **NÃO prioridade agora**.

### 12.7 Comentários — REGRA CRÍTICA (obrigatória)
- Aceitar **somente letras + espaços**. Bloquear: números, telefone/WhatsApp, URLs,
  e-mail, `@`, `#`, emojis, pontuação, símbolos, caracteres especiais.
- Motivo: impedir contato direto e contorno do modelo de leads.
- **Proteção NÃO só no frontend**: validar no backend/API/Edge Function e (quando
  apropriado) no banco. Testar bypass via DevTools, chamada HTTP direta, cliente
  externo, alteração de JS.
- Estado atual: regex "letras" já implementada no front (`lib/social.ts`); a validação
  no backend/banco/edge é **pendência formal** desta diretriz.

### 12.8 Painel administrativo — PRIORIDADE ALTA
- Obrigatório desde cedo (moderação de conteúdo). Não ficar para fase distante.
- Evoluir para: USUÁRIOS (listar/pesquisar/visualizar/bloquear/desbloquear/suspender/
  reativar/soft delete/histórico), PROFISSIONAIS (analisar/aprovar/rejeitar/suspender/
  bloquear), EMPRESAS (idem), PUBLICAÇÕES (visualizar/ocultar/remover/moderar/motivo),
  COMENTÁRIOS (visualizar/remover/motivo), DENÚNCIAS (post, comentário, perfil, empresa,
  produto, serviço), AUDITORIA/LOGS.
- Estruturas esperadas: `reports`, `report_reasons`, `moderation_actions`,
  `moderation_logs`.
- **NUNCA** autorização admin por e-mail hardcoded (usar `admin_users` + backend/db).
  ⚠ Pendência: `pages/Auth.tsx` ainda tem redirecionamento admin por e-mail fixo
  (`jamesribeiro413@gmail.com`/`sacadm1001@gmail.com` e trecho na 3.2 mapeado) — remover
  no âmbito do painel.

### 12.9 Descoberta — "Anunciar meu negócio GRÁTIS"
- Buscar profissionais (nome, profissão, categoria, localização, atividade) e preparar
  empresas/produtos/serviços. Categorias **não hardcoded no frontend**.
- Onboarding/perfil com **"ANUNCIAR MEU NEGÓCIO GRÁTIS"**: 1. PERFIL PROFISSIONAL,
  2. PERFIL EMPRESA — cadastro, validação, aprovação, publicação, edição, suspensão,
  bloqueio.

### 12.10 Leads
- Fluxo: USUÁRIO → SOLICITA ORÇAMENTO → QUOTE REQUEST → ADMINISTRAÇÃO → LEAD →
  PROFISSIONAL/EMPRESA → PAGAMENTO → DESBLOQUEIO → CONTATO.
- Separar: quote request / lead / pagamento / desbloqueio / contato revelado.
- **Nunca expor PII antes de autorização.** Preço de desbloqueio base **R$ 19,90
  configurável (admin/sistema), NÃO hardcoded.** Estado atual: quote_requests/leads já
  existem (007); fluxo de pagamento→desbloqueio a validar nesta fase futura.

### 12.11 Impulsionamento
- Sistema ÚNICO para perfil profissional, empresa, produto e publicação (não 4 sistemas).
- Preparar: campanha, objeto promovido, orçamento, período, status, pagamento,
  impressões, cliques, métricas.

### 12.12 Publicidade
- Motor publicitário único, parte da arquitetura desde já. Anúncios: FEED, BUSCA,
  ENTRE CONTEÚDOS, PRODUTO, SERVIÇO — placements `FEED`, `SEARCH`, `BETWEEN_CONTENT`,
  `PRODUCT`, `SERVICE`.
- Arquitetura: ADVERTISER → CAMPAIGN → AD → CREATIVE → PLACEMENT →
  IMPRESSION/CLICK/CONVERSION. Anúncios sempre identificados como patrocinados.
- Venda de publicidade pode ficar desativada até admin/pagamento/campanhas/moderação/
  métricas prontos.

### 12.13 Produtos e Serviços
- `products` (nome, descrição, categoria, imagens, empresa, localização, preço,
  disponibilidade, contato, promoção, publicidade) — pasta futura; serviços: idem,
  com lead/promoção/publicidade.

### 12.14 Indicação
- Referral code/link por usuário; `referrer_user_id`, `referred_user_id`, status,
  conversão, métricas. **Antifraude**: sem autoindicação, ciclos artificiais, contas
  múltiplas para manipular, duplicação de conversões. **NÃO ativar remuneração
  financeira automaticamente** (regra comercial/jurídica + antifraude se um dia criar).

### 12.15 Compartilhamento externo + crescimento orgânico
- Todo post público com COMPARTILHAR (WhatsApp, Facebook, Instagram-viável, X, Telegram,
  copiar link, Web Share API, nativo do app). Aponta para o post ORIGINAL no Samej
  (`samej.site/post/123`), sem duplicar conteúdo. Preparar Open Graph (título, descrição,
  imagem, URL canônica, preview).
- Eventos: `share_clicked`, `share_link_copied`, `share_external`, `referral_link_created`,
  `referral_link_opened`, `referral_signup`, `referral_converted`, `signup_from_shared_post`.

### 12.16 Métricas
- Base simples e escalável de eventos: `search_performed`, `post_viewed`,
  `profile_viewed`, `professional_viewed`, `company_viewed`, `product_viewed`,
  `service_viewed`, `post_liked`, `post_shared`, `content_saved`, `follow_created`,
  `lead_created`, `lead_opened`, `lead_paid`, `lead_unlocked`, `promotion_viewed`,
  `promotion_clicked`, `ad_impression`, `ad_click`, `ad_conversion`. Futura
  recomendação por intenção (LEARN/HIRE/BUY/RESEARCH/OFFER_SERVICE/PROPERTY_SEARCH) —
  arquitetura deve permitir, sem IA complexa agora.

### 12.17 Interface web e mobile
- Web: familiar, simples, image-first — navegação lateral, feed central, descoberta
  lateral, perfil, busca, publicação, anúncios, profissionais, empresas; **sem copiar
  identidade visual de Facebook/Instagram/LinkedIn** (só padrões de usabilidade). Desktop
  estilo rede social moderna; mobile responsivo.
- Mobile futuro: **React Native / Expo**, **sem backend independente** (compartilha
  Supabase/auth/DB/RLS/R2/mídia/leads/publicidade/notificações).

### 12.18 Segurança / LGPD / Pagamentos
- Regras críticas protegidas no backend/database (nunca só frontend). Service role nunca
  no frontend; secrets fora de código/git/logs/bundle/respostas públicas. Proteger auth,
  autorização, RLS, PII, uploads, comentários, leads, pagamentos, admin, publicidade,
  promoção.
- PII (telefone, WhatsApp, e-mail, CPF, CNPJ, endereço, dados de lead) com controle;
  contato de lead NUNCA público; desbloqueio só após autorização/pagamento.
- Pagamentos: **Mercado Pago mantido**; preparar para lead/impulsionamento/publicidade;
  identificar, status, idempotência, validação server-side, histórico, auditoria; nunca
  confiar em status do frontend.

### 12.19 Ordem de execução oficial (roadmap)
1. **FASE 4.1 — SOCIAL + R2** (finish R2 staging, upload real, compressor, media, feed,
   publicação, perfil, comentários, likes, follows, revisão visual desktop+mobile,
   testes de segurança).
2. **FASE ADMIN/MODERAÇÃO** (painel: usuários, profissionais, empresas, publicações,
   comentários, denúncias, logs, auditoria).
3. **FASE DESCOBERTA** (buscar profissionais, categorias, localização, perfis, "Anunciar
   meu negócio grátis").
4. **FASE LEADS** (solicitação → administração → lead → pagamento → desbloqueio).
5. **FASE IMPULSIONAMENTO** (perfil/empresa/produto/publicação + pagamento + métricas).
6. **FASE PUBLICIDADE** (campanhas, anúncios, placements, segmentação, pagamento, métricas).
7. **FASE CRESCIMENTO** (indicação, compartilhamento, tracking, métricas).
8. **FASE MOBILE** (React Native/Expo).
> ⚠ Isto **substitui** a antiga "FASE 4.2 Marketplace/Leads" como próximo alvo: agora vem
> ADMIN/MODERAÇÃO antes de LEADS.

### 12.20 Não fazer (resumo)
Não apagar marketplace; não reconstruir do zero; não criar backend/banco/tabelas/sistemas
duplicados; não alterar produção; não executar 911 sem autorização; não expor secrets;
não pedir R2 credentials de novo; não confiar só em validação frontend; não permitir
comentários com números/contatos; não permitir bypass de RLS; não dar admin para usuário
comum; não usar e-mail hardcoded p/ admin; não criar arquitetura descartável; não
implementar IA complexa sem necessidade; não instalar dependências desnecessárias.

### 12.21 Testes obrigatórios (cada etapa)
TypeScript, build, testes funcionais, RLS, autorização, segurança, upload, permissões,
ownership, bypass. Suíte obrigatória de comentários: "Excelente trabalho"/"Bom
profissional" → PASS; "123456", "WhatsApp 21999999999", "21999999999", "www.site.com",
"email@email.com", "@usuario", "#obra", emoji → FAIL; incluir envio direto à API.

### 12.22 Próximo passo imediato (registrado)
1. Inspecionar estado REAL atual; confirmar R2 STAGING, painel admin atual, comentários,
   Social Core, migrations, RLS; identificar regressões/lacunas.
2. Apresentar **matriz** `FUNCIONALIDADE | EXISTE | PARCIAL | FALTA | ARQUIVOS/TABELAS | RISCO`.
3. Apresentar plano de execução incremental e executar a próxima etapa segura (após
   revisão visual F4.1 e aprovação).
4. **AGUARDANDO: 2ª parte do prompt de continuidade do dono.** → **RECEBIDA** (ver §12.24).

### 12.24 INTERFACE WEB — EXPERIÊNCIA SEMELHANTE AO FACEBOOK (2ª parte do prompt, 2026-09-29)
> Registro da 2ª parte do prompt (seção "23. INTERFACE WEB — EXPERIÊNCIA SEMELHANTE
> AO FACEBOOK"). Refina a §12.17 e orienta a UI de F4.1 em diante.

- **Referência de EXPERIÊNCIA**: a interface usa o **Facebook como referência de
  UX/UI e organização da informação**. **NÃO copiar** marca, logotipo, identidade
  visual, código ou elementos proprietários. O usuário deve entrar e entender o Samej
  imediatamente.
- **Estrutura conceitual DESKTOP (3 áreas, quando houver espaço)**:
  - Barra superior: `LOGO SAMEJ | BUSCA | NAVEGAÇÃO | NOTIFICAÇÕES | PERFIL`.
  - **Menu esquerdo**: Início, Meu perfil, Buscar, Profissionais, Empresas, Negócios.
  - **Feed central**: criar publicação; publicações (imagem → curtir → comentar →
    compartilhar); anúncios entre publicações; conteúdo recomendado.
  - **Coluna direita (descoberta)**: Profissionais, Empresas, Produtos, Serviços,
    Anúncios, Descobertas/Sugestões.
- **Prioridade visual**: PUBLICAÇÃO → IMAGEM → INTERAÇÃO → COMENTÁRIO →
  COMPARTILHAMENTO. **IMAGE-FIRST**; **NÃO** usar interface baseada em Reels/TikTok
  como estrutura principal.
- **MOBILE WEB**: adaptar (não comprimir as 3 colunas): navegação inferior ou menu
  adequado; feed em largura total; publicação otimizada para celular; imagens
  responsivas; curtir/comentar/compartilhar facilmente acessíveis; busca, perfil,
  notificações.
- **APLICATIVO MOBILE** (futuro RN/Expo): mesma lógica de navegação e experiência do
  web — web e app devem parecer o mesmo ecossistema.
- **Objetivo de UX**: familiar, simples, rápida, limpa, intuitiva, image-first,
  responsiva; **identidade visual própria do Samej**; Facebook é só referência de
  experiência e organização, NUNCA cópia visual.
- **Impacto no código atual**: o front F4.1 usará este modelo no próximo ciclo de UI —
  reorganizar Navbar/rotas para barra superior + menu esquerdo + feed central + coluna
  direita de descoberta (desktop) e navegação inferior (mobile). [A definir na próxima
  etapa de implementação; não iniciar antes da revisão visual/aprovação da F4.1.]

### 12.25 UI/UX DO NÚCLEO SOCIAL — IMPLEMENTAÇÃO F4.1 (2026-09-29)
> Implementação da experiência descrita na §12.24 na árvore social do front
> (ramo separado do legado; as 22 rotas antigas permanecem intactas).

- **Layout**: `<SocialShell>` com Barra superior (`LOGO | busca | navegação |
  notificações | perfil`), **menu esquerdo** (Início, Meu perfil, Buscar, Profissionais,
  Empresas, Configurações + destaque "Anunciar meu negócio grátis"), **feed central**
  (máx. 680px, image-first) e **coluna direita de descoberta** (Profissionais, Empresas,
  Produtos/serviços, sugestões). **Mobile**: navegação inferior fixa + feed em largura
  total (SocialShell/BottomNav).
- **Feed** (`/feed`): composer no topo quando apto a publicar; cards completos.
- **Publicação** (`/publicar` + composer no feed): imagem-first, max. ações
  Curtir → Comentar → Compartilhar (modal: nativo/WhatsApp/Facebook/X/Telegram/
  LinkedIn/copiar; registra `shares`); permissão respeitando `canPublishProfile`,
  `get_plan_limit` (máx. imagens) e fluxo de aprovação (perfil incompleto → bloqueio
  com CTAs para `/negocios`).
- **PostCard**: avatar + nome + badge de tipo (CLIENTE/PROFISSIONAL/EMPRESA/ADMIN) +
  tempo relativo + localização; contadores formatados (1.2K); excluir só do dono (com
  confirmação); galeria image-first.
- **PostDetail** (`/post/:id`): cabeçalho FB-like, galeria completa, barra de ações com
  contadores, compartilhar com registro.
- **Perfil social** (`/social/:id`): capa + avatar 116px, badge/verified, stats
  (seguidores/seguindo/publicações), botões Seguir/Editar/Pedir orçamento, card Sobre
  com dados profissionais/empresa/categorias; dono vê chips de plano/aprovação/completo.
- **Descoberta**: `/professionals`, `/companies` (busca + filtros por cidade/categoria
  via `service_categories`/`professional_services`); `/negocios` (anúncio grátis +
  criação de perfil profissional/empresa com dados obrigatórios e aprovação admin);
  `/busca` (abas Tudo/Profissionais/Empresas/Serviços, agrupa `public_profiles` +
  views + categorias); `/profile` → redirect para `/social/:id` (logout → `/auth`).
- **Arquitetura**: App.tsx dividido por `isSocialPath()` — rotas sociais renderizam
  dentro de `<SocialShell>`; demais continuam com Navbar/Footer legados.
- **Arquivos**: novos `lib/format.ts`, `lib/discovery.ts`, `components/Avatar.tsx`,
  `components/social/{SocialShell,Topbar,LeftMenu,RightPanel,BottomNav}.tsx`,
  `components/PostComposer.tsx`, `pages/{Professionals,Companies,Business,SearchPage,
  ProfileRedirect}.tsx`; alterados `types.ts`, `lib/social.ts`, `App.tsx`,
  `components/PostCard.tsx`, `pages/{Feed,CreatePost,PostDetail,SocialProfile}.tsx`.
- **Verificação**: `npx tsc --noEmit` limpo e `npm run build` OK (vite 6.4.1, 1673 módulos).
- **Ajustes no perfil (feedback do dono)**: botões de câmera no próprio perfil social
  (overlay na capa "Editar foto de capa" e no avatar) com upload direto via `r2-upload`
  (mesma função de post) + grava `avatars_url`/`cover_url` em `profiles` e força refresh
  do `user` do App via `updateUser({data:{avatar_ts}})`; removido o badge "Este é você"
  (mantido apenas "Editar perfil" → `/configuracoes`); CTAs de convidado do shell social
  (LeftMenu/Topbar/BottomNav/Business) corrigidos para `/criar-conta` em vez da página
  antiga `/auth`.
- **Correção upload de avatar/capa (STORAGE, não R2)**: ao testar no navegador o upload
  falhava; diagnóstico no staging mostrou `R2_PUBLIC_URL` **vazio** → `r2-upload` devolve
  `publicUrl = uploadUrl` (presigned, expira em 1h) e o endpoint `.r2.cloudflarestorage.com`
  não responde CORS de preflight → PUT bloqueado no navegador. Solução definitiva:
  buckets **Supabase Storage `avatars`, `covers`, `portfolio`** (públicos, criados via
  API REST) + políticas em `storage.objects` (`sd_public_leitura` SELECT anon/authenticated;
  `sd_auth_envio` INSERT com `(storage.foldername(name))[1] = auth.uid()::text`;
  `sd_auth_atualiza`/`sd_auth_remove` por `owner`). Front `SocialProfile` agora envia
  avatar/cover pelos buckets com URL pública permanente; vale para usuário, profissional
  e empresa. E2E validado: upload 200 → GET público 200 → delete ok (usuário de teste
  removido). [PEND.DONO: `R2_PUBLIC_URL` vazio também afeta imagens de POSTS via R2 —
  URLs expiram em 1h; avaliar migrar mídia de posts para storage também.]
- **Pendências visuais**: aguardando revisão/aprovação do dono antes de FASE
  ADMIN/MODERAÇÃO (próxima).

### 12.26 LANDING + CADASTRO NOVO (FLUXO EMAIL-LINK, 2026-09-29)
> Implementação da 1ª parte do prompt (§12.23/§12.24): substituir página inicial e
> cadastro antigos pelo fluxo novo, com confirmação de e-mail por **link** (decisão
> do dono via questionário — plano gratuito bloqueia template customizado; OTP por
> código não é exibido no e-mail de confirmação padrão).

- **Estrutura de confirmação (decisão)**: `mailer` padrão (confirmation → link
  `{{ .ConfirmationURL }}`, `mailer_otp_length=8`). Teste `verifyOtp('signup')`
  respondeu `otp_expired`; fluxo OTP existe no código apenas como reserva. Nenhuma
  alteração no template do e-mail (PATCH de template foi rejeitado/bloqueado pelo
  plano gratuito e NÃO foi aplicado — staging intacto).
- **`pages/Landing.tsx`** (raiz `/`): estilo FB — logo no alto à esquerda (sem faixa
  branca), `public/images/imagem.png` à direita, frase centralizada "Encontre os
  Melhores Profissionais", card de login já logado/botão entrar, footer; link
  "Criar nova conta" → `/criar-conta`. Imagens copiadas de
  `C:\...\Rede social\image\{logo,imagem}.png` para `public/images/`.
- **`pages/Signup.tsx`** (`/criar-conta`): passos `form` (nome/sobrenome/data de
  nascimento/gênero/celular/e-mail/senha → `user_metadata` `first_name/last_name/
  birth_date/gender/phone/signup_pending:'role'`) → `confirm` (aviso "verifique seu
  e-mail", reenvio de link, auto-detecção de sessão a cada 3s) → `role`
  (3 botões: Usuário → `/profile`; Profissional/Empresa → `/negocios`; Sair).
- **`pages/RoleChoice.tsx`** (`/escolher-perfil`): para quem confirmou em outra aba/
  navegador e volta logado com `signup_pending:'role'` no metadata; lê nome do metadata,
  limpa flag via `updateUser({data:{signup_pending:'done'}})` e encaminha
  Usuário → `/profile` ou Profissional/Empresa → `/negocios`.
- **Virada de chave no App.tsx**: estado `pendingRole`; em `handleAuth`, se o usuário
  logado não possui linha em `profiles` (ex.: confirmou por link sem passar pelo
  `ensureProfile` do cadastro), o App **auto-cria** o perfil (upsert `role:'USER'`)
  — evita loop de "convidado" pós-confirmação; se `signup_pending==='role'` →
  `<Navigate to="/escolher-perfil">`. Rota `/escolher-perfil` renderiza `RoleChoice`
  (sem sessão → `/criar-conta`).
- **`/negocios` com CPF/CNPJ**: formulário do `Business.tsx` agora exige documento
  (CPF 11 díg. p/ profissional no campo `professional_profiles.cpf`; CNPJ 14 díg. p/
  empresa no `company_profiles.cnpj`; máscara de digitação), válida comprimento e
  grava apenas dígitos. Após criação: view de sucesso com "Ver meu perfil"
  (`/social/:id`) e "Ir para o feed".
- **Link antigo redirecionado**: `/auth?tab=register` e CTAs de convidado nos cards de
  negócio → `/criar-conta`.
- **Arquivos**: novos `pages/Landing.tsx`, `pages/Signup.tsx`, `pages/RoleChoice.tsx`;
  alterados `App.tsx`, `pages/Business.tsx` (form CPF/CNPJ + CTAs), `public/images/`.
- **Verificação**: `npx tsc --noEmit` limpo e `npm run build` OK (bundle ~528 kB, gz
  ~102 kB).
- **Pendência visual**: modelo não visualiza imagens — posições de logo/imagem/frase
  seguem instrução do dono; revisão visual pendente de aprovação.

### 12.27 FOTOS DE PERFIL/CAPA (STORAGE, 2026-09-29) + REMOÇÃO DO SISTEMA ANTIGO
> Fotos de perfil/capa funcionais para todos os papéis via Supabase Storage, telefone
> visível em `/configuracoes`, nome reduzido e **remoção dos links/páginas legados**.

- **Avatar/capa via Supabase Storage (não R2)**: buckets públicos `avatars`, `covers`,
  `portfolio` + políticas em `storage.objects` (`sd_public_leitura`, `sd_auth_envio`,
  `sd_auth_atualiza`, `sd_auth_remove` — com `(storage.foldername(name))[1] =
  auth.uid()::text` para isolar por usuário); path `{userId}/{timestamp}_{nome}`;
  E2E validado no staging (upload 200 → GET público 200 → delete ok; usuário de teste
  removido).
- **R2_PUBLIC_URL corrigido (2026-09-30)**: secret apontava p/ r2.dev/estava vazio → posts
  usavam URLs expiráveis (1h). **Corrigido**: secret setado p/ `https://media-staging.samej.site`
  (custom domain nº STAGING, ativo) e function redeployada (v7, verify_jwt=true). E2E real:
  presigned PUT 200 → GET via `https://media-staging.samej.site/<key>` **200** (usuário e2e
  criado/removido via admin API).
- **DELETE autenticado na `r2-upload` (v8, 2026-09-30, a pedido do dono)**: a function agora
  aceita `DELETE` com `{ "key": "<userId>/..." }` e apaga server-side via presigned DELETE.
  Segurança: só permite apagar arquivos do PRÓPRIO usuário (`key.startsWith(userId + '/')`),
  bloqueia path traversal (`..`) e chaves >512 chars; sem JWT → 401; chave alheia → 403.
  E2E real: PUT 200 → DELETE 204 → GET 404 → DELETE de chave de outro usuário **403**.
  CORS atualizado p/ `POST, DELETE, OPTIONS`.
- **Limpeza concluída (2026-09-30)**: o objeto de teste (1 byte) foi **removido pelo dono
  no painel Cloudflare** (`292a3f15-.../1790737180280_e2e-media-staging.jpg`). Verificado:
  GET sem cache (`?nocache=`) via `media-staging.samej.site` → **404**. Legacy: um primeiro
  GET retornou 200 por cache da borda Cloudflare (CDN) — normal, expira sozinho.
- **`SocialProfile.tsx`**: botões de câmera na capa e no avatar (só `isMe`), upload,
  grava `avatar_url`/`cover_url` e força refresh via `updateUser({data:{avatar_ts}});
  removido badge "Este é você"; nome `text-2xl` → `text-xl` (~20% menor).
- **`ProfileSettings.tsx`**: busca a linha de `profiles` no banco ao montar e preenche
  o form — **telefone** (gravado no cadastro) e demais campos passam a aparecer em
  `/configuracoes` para qualquer papel.
- **Remoção do sistema antigo (a pedido do dono)**: deletados os links e as páginas
  **Serviços**, **Encontrar Profissionais** e **Ofertas de Trabalho**:
  - `components/Navbar.tsx`: removidos dropdown "Serviços" (desktop+mobile com ~14 itens),
    "Encontrar Profissionais" e "Ofertas de Trabalho"; limpos `services`/`isServicesOpen`/
    `ChevronDown`/`Briefcase`.
  - `components/Footer.tsx`: removido link "Diretório de Profissionais".
  - `App.tsx`: removidas rotas `/trabalhos`, `/trabalhos/:id`, `/servico/:slug` e
    `/perfil/:id` (+ imports e estado/função `professionals`/`fetchProfessionals`).
  - `pages/NewRequest.tsx`: categorias "especiais" que pulavam para `/servico/:id`
    agora seguem o fluxo normal (Passo 2).
  - **Arquivos excluídos**: `pages/ServicePage.tsx`, `pages/JobOffers.tsx`,
    `pages/JobDetails.tsx`, `pages/PublicProfile.tsx`, `pages/ProfessionalDirectory.tsx`.
- **Verificação**: `npx tsc --noEmit` limpo + `npm run build` OK (main 303 kB + vendor
  497 kB, gz 64+148 kB).

### 12.28 PUBLICAÇÃO ABERTA A TODOS (FASE 42, 2026-09-30)
> Qualquer perfil publica imagens no feed; Usuário comum passa por **aprovação
> administrativa** (igual pro/empresa); limites por papel (90/140); nova regra de
> conteúdo para comentários a descrições; avatar/capa migrados para **R2 + CDN**.

- **Migration `012_fase42_publicacao_aberta.sql` (aplicada ao STAGING em 4 partes)**:
  - `get_post_image_limit(uuid)` → **90** imagens para USER/CLIENT, **140** para
    PROFESSIONAL/COMPANY/ADMIN (independente do plano; SECURITY DEFINER; grant
    anon+authenticated).
  - `can_publish_profile`: USER/CLIENT publicam **apenas se `publishing_approved` +
    conta ativa + plano**; pro/empresa mantêm active+profile_complete.
  - `admin_set_publishing_approved(target, approved)` — RPC só de admin (grava
    `admin_logs`, só USER/CLIENT; guard validado: superuser sem JWT → 400).
  - `protect_profile_privileges`: protege `publishing_approved`; INSERT de não
    privilegiado cria perfil com `publishing_approved=false` e **plano FREE** (fix
    para signup que não setava plan_id — sem isso ninguém publicava).
  - Comentários: CHECK `comments_content_safe` substitui `comments_content_letters_only`
    (aceita letras/espaços/**emojis**/pontuação/números ≤5 dígitos seguidos; bloqueia
    telefone 6+ dígitos, URLs, e-mails, `<`/`>`; máx. 280).
  - Backfill: perfis com plan_id NULL → plano FREE.
- **Verificado no staging**: USER `c3d36d35...` (aprovado) → `can_publish_profile`
  true + limite 90; simulação role PROFESSIONAL → 140; comentários aceitos
  (`gostei muito 😀 2026`, `oi 123`) e rejeitados (telefone, URL, email, HTML, vazio);
  RPC admin por superuser → 400 "acesso negado".
- **Frontend (tsc limpo + build OK)**:
  - `lib/social.ts`: `isSafeText`/`isValidComment`/`isSafeCaption` compartilhados
    (padrão da migration; mensagem + regras); novo `getPostImageLimit(meId)`.
  - `PostComposer.tsx`: usa `getPostImageLimit` (90/140), valida a descrição antes de
    publicar; usuário comum em análise vê "Aguarde a aprovação administrativa"
    (composer e tela `/publicar`).
  - `SocialProfile.tsx`: botão **Publicar** (próprio perfil) + composer acima de
    Publicações com refresh; chip de aprovação para USER; avatar/capa agora sobem
    para **R2** (`uploadPostImage`, URL imutável).
  - `UserManagement.tsx`: botão ✔ **Aprovar/Revogar publicação** (RPC
    `admin_set_publishing_approved`) + selo "Publicando/Em análise" nas linhas de
    USER/CLIENT.
  - `lib/uploads.ts`: `Cache-Control: public, max-age=31536000, immutable` no PUT
    (URL única por timestamp → imutável; alta taxa de hit na CDN).
- **Pendências**: revisão visual pelo dono (aprovação de USER no Admin, publicar no próprio perfil).
- **Bug de publicação no navegador — CORRIGIDO (2026-09-30)**: posts com imagens falhavam com
  "Failed to fetch" porque o **bucket R2 `samej-staging-media` não tinha CORS** (preflight OPTIONS
  do PUT direto retornava 403 sem `Access-Control-*`). Política adicionada via dashboard:
  `AllowedOrigins ["*"]`, `AllowedMethods ["PUT","GET","HEAD"]`, `AllowedHeaders
  ["Content-Type","Cache-Control"]`, `ExposeHeaders ["ETag"]`, `MaxAgeSeconds 3600`
  (atenção: `OPTIONS` NÃO é método válido na política do R2). Verificado E2E do navegador
  virtualizado: OPTIONS preflight → **204** com `Access-Control-Allow-Origin:*` ≠ não-nulo;
  PUT (presigned R2) → **200**; objeto/usuário de teste removidos. CDN segue funcional
  (CA-ID: `*` também retornado no PUT; cache imutável confirmado antes).

### 12.29 LIGHTBOX DE POSTAGEM (MODAL INTERNO, 2026-09-30)
> Clicar na publicação abre um **popup (lightbox) por cima da própria página** — estilo
> Facebook — com a imagem completa, descrição e navegação lateral entre todas as
> postagens do perfil, **sem sair da rede social**.

- **`components/PostViewerModal.tsx`** (nova): overlay fixo escuro com a foto
  **sem corte** (`object-contain`), coluna ao lado (ou abaixo no mobile) com autor,
  papel, data, local, **descrição (legenda)**, curtidas/comentários/compartilhamentos
  e botão "Ver publicação completa" (`/post/:id`) + "Ver perfil".
  Navegação **lateral pelas postagens do perfil**: setas ‹ › sobre a imagem, teclado
  ←/→, **swipe** no toque (delta > 50px) e contador "Postagem X de Y · Foto A de B";
  Esc ou X (ou clique fora) fecha; trava o scroll do fundo enquanto aberto.
- **`PostCard.tsx`**: clique na imagem (ou menu → "Ver publicação") abre o **modal
  interno**; removido o `window.open('/ver/:id')`. Botão "Comentar" segue para
  `/post/:id`.
- **Rota `/ver/:id` e página `PostViewer.tsx` removidas** (não levam mais o usuário
  para fora da rede).
- **Imagem sem corte**: publicação com **1 foto** aparece inteira no feed
  (`object-contain`, largura total, máx. 72vh) em vez de `aspect-[4/3] + object-cover`;
  2+ fotos mantêm a grade quadrada própria de feed.
- **Verificação**: `npx tsc --noEmit` limpo + `npm run build` OK.

### 12.30 BUG AVATAR/CAPA — OBJETO GRAVADO NO LUGAR DA URL (2026-09-30)
> Avatar e capa "sumiam" após a troca: `uploadPostImage` retorna um objeto
> `{url,size_bytes,width,height}` e o handler gravava o **objeto** em
> `avatar_url`/`cover_url` (colunas que guardam string) → `<img src={objeto}>`
> quebrava e a foto não exibia (posts não foram afetados — usam `url` corretamente).

- **Fix `SocialProfile.tsx`**: `uploaded.url` (`.url`) nos dois handlers (avatar e capa).
- **Sanitização no staging**: `UPDATE profiles` extraindo `(coluna::json ->> 'url')`
  das linhas que pareciam `{"url":...}` (afetou o perfil `c3d36d35...`); valores
  voltaram a ser URL simples (200 na CDN, cf=MISS→HIT).
- **Padrão uniforme em todos os papéis**: `ProfileSettings.tsx` (`/configuracoes`) e
  `ProfessionalDashboard.tsx` (`/dashboard`) passaram a usar o **mesmo** upload de
  avatar via R2 (`uploadPostImage(...).url`), deixando o bucket Storage `avatars`
  de lado — USER, PROFESSIONAL, COMPANY e ADMIN ficam idênticos (avatar/capa,
  hint "Capa ideal", lightbox são compartilhados).
- **Verificação**: `npx tsc --noEmit` limpo + `npm run build` OK.

### 12.31 ARQUITETURA "SOMENTE R2" — TODA MÍDIA NO R2/CDN + VÍDEOS (2026-09-30)
> Objetivo do dono: **todas as imagens e vídeos vivem no Cloudflare R2** e a entrega
> é feita pela CDN; o Supabase fica só com dados/metadados (usuários, posts,
> comentários, curtidas, seguidores, mensagens). Zero uploads pelo Storage.

- **`r2-upload` v9 (deploy via Management API `functions/deploy?slug=r2-upload`,
  multipart `metadata` + `index.ts`)**: passou a aceitar `content-type: video/*`
  além de `image/*`. PUT gravado pelo navegador com header `Content-Type`
  (mime correto no objeto) + `Cache-Control: public, max-age=31536000, immutable`.
- **`lib/uploads.ts`**: novo `uploadMedia(file, preferredName?)` — imagem é
  comprimida (máx. 8 MB); vídeo vai direto (máx. 100 MB, sem compressão), sempre
  enviando `Content-Type` no PUT. `uploadPostImage` continua para avatar/capa/portfólio.
- **Migration `013_somente_r2.sql`** (aplicada no staging e verificada):
  `enforce_post_media_rules` agora aceita `kind='video'` — **1 vídeo por publicação,
  sem misturar com fotos, máx. 100 MB** (`size_bytes <= 104857600`); fotos continuam
  com o limite por papel (90/140). Items de mídia levam `kind`.
- **E2E vídeo no staging**: usuário temporário → presigned PUT (video/mp4) →
  GET 200 com `content-type: video/mp4` → DELETE 204 → cleanup. OK.
- **Front**: `types.ts`/`lib/social.ts` incluem `kind` na mídia; `PostComposer`
  aceita fotos E **1 vídeo** (válida 100 MB, preview `<video controls>`, hides
  "Adicionar" com vídeo); `PostCard`/`PostViewerModal` renderizam `<video controls>`
  (contador "Mídia"); textos atualizados ("Fotos e vídeos").
- **Migração Storage → R2 (fim)**: portfólio (`ProfileSettings` + `ProfessionalDashboard`)
  e imagem de pedido (`NewRequest`, bucket `order-images` inexistente no staging)
  agora sobem via R2. Grep final: **0 usos de `storage.*`/`getStoragePath` no front**.
- **`014_portfolio_urls.sql`**: coluna `profiles.portfolio_urls text[]` criada —
  o front sempre a usou (`App.tsx`, `ProfileSettings`, `ProfessionalDashboard`,
  `UserManagement`), mas ela **não existia** nas migrations → o portfólio nunca
  salvava. Aplicada no staging e testada (escrita + leitura com URL R2 OK).
- **Verificação**: `npx tsc --noEmit` limpo + `npm run build` OK.
- Pendências p/ produção: aplicar a migration `013` e deployar a function `r2-upload`
  v9 no projeto de produção (mesma assinatura, mudança ADD-ONLY sem breaking).

### 12.32 VÍDEOS EM STAND-BY — INFRA PRONTA, PUBLICAÇÃO BLOQUEADA (2026-09-30)
> Dono: "deixe tudo pronto, mas não quero autorizar postagens de vídeo agora"
> (plano **free** da R2). A pipeline fica PRONTA; o vídeo fica bloqueado no banco
> e o picker volta a só aceitar imagens. Reativar = 1 linha no DB + aceitar no composer.

- **Migration `015_videos_standby.sql`** (aplicada no staging, verificada): voltou
  `enforce_post_media_rules` a **rejeitar `kind='video'`** com a mensagem
  "vídeos ainda não liberados — somente imagens por enquanto". Teste de inserção
  de vídeo confirmou o bloqueio.
- **`PostComposer.tsx`**: picker volta a `accept="image/*"` apenas (imagens);
  textos "Somente imagens", botão "Foto"; `uploadPostImages` de novo no fluxo.
- **O que fica PRONTO para liberar depois**: `r2-upload` v9 (aceita `video/*`),
  `lib/uploads.uploadMedia` (imagem comprime / vídeo direto ≤100 MB com
  `Content-Type` no PUT), `kind` em `types`/`social.ts`, render `<video controls>`
  em `PostCard`/`PostViewerModal`, e a regra "1 vídeo por post" do 013 no repo.
- **Verificação**: `npx tsc --noEmit` limpo + `npm run build` OK.

### 12.33 CAPA — EXCLUIR + REPOSICIONAR (PADRÃO PARA TODOS OS PERFIS, 2026-09-30)
> A pedido do dono: no menu de edição da capa ("Editar foto de capa") entraram os
> botões **Excluir** e **Reposicionar** — comportamento idêntico para usuário,
> profissional e empresa (a página de perfil é a mesma para todos os papéis).

- **Migration `016_cover_position.sql`** (aplicada no staging e verificada):
  `profiles.cover_position text NOT NULL DEFAULT '50% 50%'` + `public_profiles`
  view recriada expondo a coluna. Posição é persistida no banco → TODOS os
  visitantes do perfil veem o mesmo enquadramento (não só o dono). Coluna é livre
  (não é protegida pelo `protect_profile_privileges`).
- **`lib/uploads.ts`**: novo `deleteMedia(publicUrlOrKey)` — extrai a chave do
  pathname da URL (funciona para CDN ou host R2) e chama a `r2-upload` com
  `method: 'DELETE'` (a function já valida `key.startsWith(userId + '/')`, 403 p/
  chave de terceiro).
- **`SocialProfile.tsx`** (overlay `isMe` na capa):
  - Botão **Reposicionar** → modal com a capa (`h-40 md:h-52`, igual ao header) com
    **arrastar** (`pointer capture`; proporcional ao container, `objectPosition`
    `"<x>% <y>%"` clampado em 0–100); Salvar grava `cover_position`, Cancelar/`X`
    descarta; prévia já aplicada em `object-position`.
  - Botão **Excluir** → vira "Tem certeza?" (auto-reverte em 6s) → apaga o objeto
    no R2 (`deleteMedia`, tolera falha da CDN) + `cover_url=null`; cai no gradiente
    padrão quando não há capa.
  - `object-position` da capa no header passa a usar `cover_position` para todos
    os papéis.
- **Verificação**: `npx tsc --noEmit` limpo + `npm run build` OK.
- Pendências p/ produção (aguardando dono): migrations **013/014/015/016** + deploy
  da function `r2-upload` v9 no projeto de produção.

### 12.34 STATS CLICÁVEIS — PUBLICAÇÕES / SEGUIDORES / SEGUINDO (2026-09-30)
> A pedido do dono: a linha de contadores do perfil ("X publicações · Y seguidores
> · Z seguindo") virou **clicável** e abre uma janela com o conteúdo de cada um.
> Comportamento idêntico para todos os papéis (mesma página de perfil).

- **`lib/social.ts`**: novos `getFollowers(profileId)` e `getFollowing(profileId)`
  (buscam em `follows` + resolvem perfis via `public_profiles` com o helper
  `fetchProfilesByIds`, chunks de 100, `mapAuthor`). Já prontos desde a etapa
  anterior, agora usados no front.
- **`SocialProfile.tsx`**:
  - Contadores viram `<button>` (hover blue) → abrem modal `statsModal`
    (`'posts' | 'followers' | 'following'`).
  - **Publicações**: lista posts do estado `posts` (thumbnail da 1ª mídia,
    legenda/“Sem descrição”, `formatRelative` + nº de mídias) → link `/post/:id`.
  - **Seguidores/Seguindo**: lista resolvida na hora (`getFollowers/getFollowing`;
    `Avatar` + nome + `roleLabel` + seta) → link `/social/:id`.
  - Estados de carregamento (spinner), erro e vazio ("Ninguém segue este perfil
    ainda." / "Este perfil não segue ninguém ainda." / "Nenhuma publicação ainda.");
    fecha por `X`, clique no fundo ou ao navegar.
- **Verificação**: `npx tsc --noEmit` limpo + `npm run build` OK.
- Obs.: p/ evitar confusão, removida a pasta fantasma `plataforma-leiras-1-main`
  (esqueleto de diretórios vazios criado acidentalmente antes; a pasta real é
  `plataforma-learis-1-main`).

### 12.35 CONFIGURAÇÕES — E-MAIL PARA TODOS + BLOCO COMPLETO PARA EMPRESA (2026-09-30)
> A pedido do dono: "em editar perfil/configurações aparece só nome e telefone".
> Correção: e-mail passa a aparecer para todos os papéis, e o bloco completo
> (já existente para profissional) passa a valer também para empresa.

- **`pages/ProfileSettings.tsx`**:
  - Campo **E-mail de Login** (readonly — e-mail da conta, usado para login; nota
    explicativa + ícone `Mail`) exibido para **todos os papéis**, logo após Telefone.
  - Novo `isProOrCompany` (`PROFESSIONAL` ou `COMPANY`) → o bloco de perfil com
    Descrição, Região, CPF/CNPJ, CEP/Endereço, Cidade/UF, Profissão, Experiência e
    Portfólio passou a aparecer também para **COMPANY** (antes só PROFESSIONAL).
  - Rótulos dinâmicos p/ empresa: **"CNPJ"** (vs "CPF ou CNPJ"), **"Ramo
    Empresarial"** (vs "Profissão Atual"), **"Descrição da Empresa"** (vs
    "Descrição dos Serviços"). Cidade/Estado já constavam no bloco (campo
    combinado "Cidade / UF").
  - Badge "Conta Verificada" continua só para PROFESSIONAL (fora do escopo).
- **Usuários comuns (USER/CLIENT)**: passam a ver Nome + Telefone + E-mail.
- **Verificação**: `npx tsc --noEmit` limpo + `npm run build` OK.

### 12.36 E-MAILS DE CONFIRMAÇÃO — REMETENTE "SAMEJ CONFIRMAÇÃO" VIA RESEND (2026-09-30)
> A pedido do dono: o e-mail de confirmação de cadastro chegava como "Supabase
> Auth". O Supabase **não permite** customizar o nome do remetente no mailer
> nativo (erro "Custom SMTP required to configure SMTP_SENDER_NAME") — foi
> necessário configurar um **SMTP customizado** (Resend, conta do dono).

- **Staging** (`rkeirrjseieecgbtaqju`) via Management API `PATCH /config/auth`:
  - `smtp_host: smtp.resend.com`, `smtp_port: 465`, `smtp_user: resend`
  - `smtp_admin_email: samej@lotobotai.com.br` (domínio verificado do Resend)
  - `smtp_sender_name: Samej Confirmação` → e-mails agora dizem
    **"Samej Confirmação"** em vez de "Supabase Auth".
  - `smtp_max_frequency: 60` (rate limit inicial de 30msg/h imposto pela Supabase).
- **Resend**: 1 domínio verificado (`lotobotai.com.br`); plano Free = 3.000 e-mails/mês,
  100/dia, até 3 domínios. Recomenda-se depois verificar domínio próprio da Samej
  (ex.: `auth.samej.com.br`) para produção.
- **Pendências**: aplicar o mesmo SMTP no projeto de **produção**; opcional:
  traduzir subjects/templates de confirmação para PT-BR.

### 12.37 "ESQUECEU A SENHA?" — FIM DO REDIRECIONAMENTO PARA A PÁGINA ANTIGA (2026-09-30)
> Dono reportou: ao clicar em "Esqueceu a senha?" na Landing da rede social,
> caía na página antiga do sistema. Causa: o link apontava para `/auth`
> (página legada, App.tsx rota `/auth`), que faz redirect para
> `/profissional/dashboard`, `/cliente/dashboard`, `/admin`.

- **Landing.tsx**: "Esqueceu a senha?" agora é um botão que abre um **modo
  Recupere sua senha inline no próprio card**: campo de e-mail (reaproveita o
  estado `email`), chamada `supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin })`,
  estado de sucesso ("Enviamos um link de recuperação para o seu e-mail."),
  botão "Voltar para o login" e esconde os campos de senha/criar-conta só no modo reset.
- **ResetPassword.tsx**: ao concluir a redefinição, redireciona para `/feed`
  (sistema novo) em vez de `/auth` (página antiga).
- Fluxo completo do e-mail de recuperação segue: link do e-mail → App.tsx
  (`PASSWORD_RECOVERY` → `/redefinir-senha`) → formulário de nova senha → `/feed`.
- **Verificação**: `tsc --noEmit` limpo + `npm run build` OK (1670 módulos).

### 12.38 EXCLUSÃO DA PÁGINA LEGADA `/auth` (2026-09-30)
> A pedido do dono, a página `Auth.tsx` do sistema antigo foi **deletada**
> (login/cadastro legado que redirecionava para `/profissional/dashboard`,
> `/cliente/dashboard` e `/admin`).

- **Removidos**: `pages/Auth.tsx` (arquivo), import no `App.tsx` e a rota
  `<Route path="/auth" ...>`).
- **Guard de rotas protegidas** (`ProtectedRoute` no App.tsx): sem login →
  `/` (Landing) em vez de `/auth`.
- **Links redirecionados**:
  - Login/"Entrar"/"Painel do Profissional" → `/` (Landing tem o card de login).
  - Cadastro/"Criar nova conta"/"Junte-se à Samej"/"Sou Profissional" → `/criar-conta`.
  - Arquivos: `Navbar.tsx`, `Footer.tsx`, `ProfessionalSignupPopup.tsx`,
    `PostComposer.tsx`, `Topbar.tsx`, `PostDetail.tsx`, `Home.tsx`, `ProfileRedirect.tsx`.
- **Links legados `/auth?tab=register`**: continua interceptado no App.tsx →
  `/criar-conta`. `/auth` puro cai no catch-all → `/`.
- **sitemap.xml**: entrada `https://samej.site/auth` removida.
- **Verificação**: `tsc --noEmit` limpo + `npm run build` OK (1669 módulos).

### 12.39 OLHINHO DE VISUALIZAÇÃO DE SENHA (2026-09-30)
> A pedido do dono: botão "olhinho" (ícone Eye/EyeOff) para mostrar/ocultar a senha
> na página inicial e no cadastro.

- **`pages/Landing.tsx`** (login da página inicial): campo Senha agora tem o
  botão Eye/EyeOff à direita; alterna `type="password"`/`type="text"` via estado
  `showPassword` (input com `pl-4 pr-11`).
- **`pages/Signup.tsx`** (criação de conta — "/criar-conta"): mesmo padrão no
  campo Senha (`inputCls` com `pl-4 pr-11`).
- **Verificação**: `tsc --noEmit` limpo + `npm run build` OK (1669 módulos).

### 12.40 AVISO DE SPAM + DIAGNÓSTICO DO E-MAIL DE RECUPERAÇÃO (2026-09-30)
> E-mails de recuperação **chegavam**, mas caíam na caixa de spam. O envio
> estava correto (logs do Resend: `from: "Samej Confirmação"
> <samej@lotobotai.com.br>`, `subject: Reset your password`, `last_event: delivered`).

- **Landing.tsx**: mensagem de sucesso do "Enviar link" agora avisa
  "Verifique também a caixa de spam ou lixo eletrônico".
- **Diagnóstico**: a chave Resend é válida (API + SMTP OK); o problema era só
  a entrega em spam. Testado com `curl.exe` (o `Invoke-RestMethod` falhava por
  escaping do header `Authorization` — **usar curl.exe** para API Resend).
- **site_url**: investigated. `https://www.samej.site` **ainda serve o sistema
  antigo** (o novo front tem `vercel.json` mas **não está publicado/vinculado**;
  testes rodam em `localhost:3000` contra staging). Portanto:
  - `site_url` = `http://localhost:3000` (mantido);
  - `uri_allow_list` = apenas localhost (removido `samej.site` para não enviar
    token de recuperação para o site legado).
  - Ao publicar a rede social, ajustar `site_url`/`uri_allow_list` para a URL real.
- Nota: `uri_allow_list` na Management API é **string separada por vírgulas**
  (array retorna HTTP 400).

### 12.41 MONETIZAÇÃO — PRESERVAÇÃO DO MERCADO PAGO DO SISTEMA ANTIGO (2026-09-30)
> Durante a remoção do sistema antigo (12.42) o arquivo `lib/mercadopago.ts` foi
> apagado junto com `pages/RechargeCredits.tsx`. **A pedido do dono**, todo o
> material de monetização foi levantado e registrado aqui para ser reaproveitado
> na fase de monetização da **rede social Samej**. Nada foi perdido: o código está
> no git (commit `d6cc54f`) e as **Edge Functions continuam no repo**.

#### O que EXISTE hoje no repo (preservado)
| Peça | Caminho | Estado |
|---|---|---|
| Edge Function cria PIX | `supabase/functions/mercadopago-pix/index.ts` | ✅ no repo (69 linhas) |
| Edge Function webhook | `supabase/functions/mercadopago-webhook/index.ts` | ✅ no repo (92 linhas) |
| Migration monetização | `supabase/migrations/008_monetization.sql` | ✅ no repo (162 linhas) |
| RLS de pagamentos | `supabase/migrations/010_security.sql` (L528–545) | ✅ no repo |
| Helper do front | `lib/mercadopago.ts` | ❌ removido em 12.42 (recuperar: `git checkout d6cc54f -- lib/mercadopago.ts`) |
| Tela de recarga | `pages/RechargeCredits.tsx` | ❌ removido em 12.42 (recuperar do mesmo commit) |

#### Segredos / variáveis necessários (NÃO versionar)
| Nome | Onde | Observação |
|---|---|---|
| `MP_ACCESS_TOKEN` | **secret** da Edge Function (`mercadopago-pix` e `mercadopago-webhook`) | nunca no front |
| `VITE_MERCADOPAGO_PUBLIC_KEY` | `.env` / Vercel (build) | já previsto no `.env.example` |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | secrets da função | injetados pelo Supabase |

> No `.env` local atual **não há** chave `VITE_MERCADOPAGO_PUBLIC_KEY` (só o
> placeholder existe no `.env.example`). O `MP_ACCESS_TOKEN` precisa ser
> recuperado do painel do Mercado Pago (ou do arquivo de chaves) antes de
> reativar os pagamentos.

#### Objetos de banco (migration 008) — reaproveitar na monetização social
- `payments` — evoluída com `plan_id`, `subscription_id`, `gateway`,
  `gateway_payment_id`, `payment_method`, `period_start`, `period_end`,
  `metadata`; CHECK de status ampliada para
  `approved|pending|cancelled|refunded|expired|failed|charged_back`;
  índice único `(gateway, gateway_payment_id)`.
- `subscriptions` — `profile_id`, `plan_id`, `status`
  (`active|trial|past_due|suspended|cancelled|expired`), `starts_at`, `ends_at`,
  `next_billing_at`, `amount`, `gateway`, `gateway_subscription_id`.
- `credits_ledger` — trilha de saldo: `profile_id`, `type`
  (`purchase|lead_spend|boost|refund|admin_adjust|expiry`), `amount`
  (positivo=entrada, negativo=débito), `balance_after`, `reference_type`,
  `reference_id`, `reason`, `created_by`, `created_at`.
- `plans` (pré-existente) — catálogo de planos.
- Funções `SECURITY DEFINER` **`add_credits()`** e **`spend_credits()`** — única
  forma autorizada de mexer no saldo (`profiles.credits`); `EXECUTE` revogado de
  `PUBLIC`/`anon`/`authenticated` e liberado só para `service_role`.
- `profiles.credits` — saldo corrente (inteiro).
- RLS: usuário lê apenas os próprios `payments`/`subscriptions`/`credits_ledger`;
  escrita só via `service_role`.

#### Fluxo PIX (como funcionava)
1. Front chama `createPixPayment(amount, description, email, userId, credits)`
   → `supabase.functions.invoke('mercadopago-pix')`.
2. `mercadopago-pix` cria o pagamento em
   `POST https://api.mercadopago.com/v1/payments` com
   `payment_method_id: "pix"`, `X-Idempotency-Key: crypto.randomUUID()`,
   `external_reference: userId` e
   `description: "<descrição> | CREDITS:<n>"`.
   `notification_url` está **fixa em produção**:
   `https://vhtbnptfxilcukytuoba.supabase.co/functions/v1/mercadopago-webhook`.
   Retorna `id`, `status`, `qr_code`, `qr_code_base64`, `external_resource_url`.
3. `mercadopago-webhook` (POST) recebe `{type:'payment', data:{id}}`, **consulta o
   Mercado Pago** para confirmar (`GET /v1/payments/{id}`) e, se `status ===
   'approved'`, lê `external_reference` (usuário) e extrai os créditos da
   descrição via regex `/CREDITS:(\d+)/` → soma em `profiles.credits`.

#### Pontos frágeis a corrigir na monetização da rede social
1. **Sem validação de assinatura do webhook** — o Mercado Pago envia os headers
   `x-signature`/`x-request-id` e o segredo do webhook; sem conference, qualquer
   POST forjado pode "aprovar" um pagamento. Implementar o
   `ts`+HMAC-SHA256(`id:{data.id};ts:{ts};`) antes de creditar.
2. **Credita `profiles.credits` direto, ignorando o ledger** — o webhook deveria
   chamar `add_credits(userId, n, 'purchase', ...)` para gerar linha em
   `credits_ledger` (hoje o saldo fica sem rastro contábil).
3. **Créditos trafegam dentro da descrição** (`CREDITS:<n>`) — frágil; gravar em
   `payments.metadata` / `external_reference` estruturado.
4. **`notification_url` hardcoded** no projeto de produção — ao migrar para
   produção/substituir o backend, parametrizar (ou usar
   `SUPABASE_URL` do próprio ambiente).
5. **Sem idempotência no crédito** — webhook repetido creditaria duas vezes
   (o índice único em `payments(gateway, gateway_payment_id)` ajuda se o
   pagamento for registrado na tabela antes de creditar).
6. Sem tela de "packs"/planos no front novo — `RechargeCredits.tsx` removido e
   nada o substituiu ainda; `/profissional/recarregar` não existe mais.

### 12.42 REMOÇÃO DO SISTEMA ANTIGO (MARKETPLACE) — SÓ A REDE SOCIAL (2026-09-30)
> A pedido do dono: apagado o sistema antigo (marketplace de orçamentos/créditos)
> do front. O domínio `samej.site` passará a servir **apenas a rede social**.
> Registrado em git (commit `d6cc54f` = último estado com o sistema antigo).

#### Arquivos deletados
- **Páginas**: `CustomerDashboard.tsx`, `ProfessionalDashboard.tsx`,
  `AdminDashboard.tsx`, `UserManagement.tsx`, `OrderManagement.tsx`,
  `NewRequest.tsx`, `ProfessionalLeads.tsx`, `RechargeCredits.tsx`, `Home.tsx`
  (a landing antiga, sem uso) — 9 arquivos.
- **Componentes**: `Navbar.tsx`, `Footer.tsx`, `TermsBanner.tsx`,
  `ProfessionalSignupPopup.tsx`, `ServiceCarousel.tsx`, `AIChatbot.tsx`
  (nunca usado) — 6 arquivos.
- **Lib**: `mercadopago.ts` (helper do front; preservado em 12.41 + git).

#### `App.tsx`
- Removidos imports das 9 páginas + `Navbar`/`Footer`/`TermsBanner`;
  `OrderRequest`/`OrderStatus` dos types.
- Removido o estado `orders` e a função `fetchOrders()` (era query na tabela
  `orders`, desativada em todo app).
- Removidas as 9 rotas legadas: `/pedir-orcamento`, `/cliente/dashboard`,
  `/profissional/dashboard`, `/profissional/leads`, `/profissional/recarregar`,
  `/admin`, `/admin/usuarios`, `/admin/pedidos`, `/meus-leads`.
- **Layout não-social simplificado**: saiu o wrapper `Navbar` + `TermsBanner` +
  `<main>` + `Footer`. Hoje restam só 3 rotas fora do `SocialShell`:
  - `/configuracoes` → **agora dentro do `SocialShell`** (mantém o visual da rede
    social; o Topbar já apontava para cá);
  - `/termos` e `/redefinir-senha` → páginas públicas/autônomas (sem login);
  - qualquer outra rota desconhecida → `Navigate to="/"`.

#### Links da rede social ajustados
- **`components/social/Topbar.tsx`**: removida a função `rolePath()` e o item
  **"Painel principal"** do menu do perfil (apontavam para
  `/profissional/dashboard`, `/admin`, `/cliente/dashboard`). Na rede social o
  feed é a tela principal — sobraram "Meu perfil" e "Configurações".
  Imports `LayoutDashboard`/`UserRole` removidos.
- **CTA "Pedir orçamento"** (recurso exclusivo do marketplace) removido de
  `pages/Professionals.tsx`, `pages/Companies.tsx` e `pages/SocialProfile.tsx`
  (+ import `MessageSquarePlus`). O contato passa a ser pelo bloco de contato do
  próprio perfil (respeitando a visibilidade FREE/PRO/admin) e as mensagens
  entram na próxima fase — o Topbar já anuncia isso.

#### Outros
- **`public/sitemap.xml`**: reescrito — removidas `/pedir-orcamento` e
  `/trabalhos` (rota inexistente); ficaram `/`, `/professionals`, `/companies`,
  `/termos`.
- `types.ts` **mantido** como está (ainda há enums/interfaces do modelo antigo,
  p.ex. `UserRole.CLIENT`); limpeza pode ser feita depois, com careca.
- **Banco não foi tocado**: tabelas do sistema antigo (`orders`, `plans`,
  `payments`, `subscriptions`, `credits_ledger`, colunas `credits`/`categories`)
  continuam existindo no Supabase. Limpar isso é destrutivo e depende de
  decisão do dono (opcional, depois).
- **Verificação**: `tsc --noEmit` limpo + `npm run build` OK (**1656 módulos**,
  antes 1669).
- **Recuperação**: `git checkout d6cc54f -- <arquivo>` traz qualquer página
  removida de volta.