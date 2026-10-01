# SAMEJ SOCIAL — RESULTS V2.1 (modelo a preencher no STAGING)

> Data de execução no staging: 2026-09-07
> Responsável: automação (psql 16.8, runner `scripts/run_staging_tests.ps1` com BOM)
> Staging ref/URL (sem credenciais): https://rkeirrjseieecgbtaqju.supabase.co (pooler aws-0-us-east-1, porta 5432)
> Comando: `.\scripts\run_staging_tests.ps1 -DbUrl $env:STAGING_DB_URL` (runner UTF-8 BOM p/ PowerShell 5.1; psql por env vars)
> Regra: FAIL não pode ficar em aberto — todo FAIL tem causa + correção + reteste.

## 1. Migrations (dois últimos: log docs/mig_XXX.log)

Base legada `supabase_schema.sql` instalada primeiro (staging veio vazio); migrations 001→010 aplicadas como add-only sobre essa base. **911 NÃO executada** (fase 3.2).

| Migration | Início | Fim | Status | Objetos (major) | Warn |
|---|---|---|---|---|---|
| 001 profiles | ✓ | ✓ | ✔ aplicada (exit 0) | email/username/verified/featured/plan_id/account_status/role CHECK | |
| 002 plans_rls | ✓ | ✓ | ✔ aplicada (exit 0) | plans, plan_permissions, effective_permission, FK plan_id, seed | |
| 003 prof/co profiles | ✓ | ✓ | ✔ aplicada (exit 0) | 2 tabelas + policies admin | |
| 004 contacts | ✓ | ✓ | ✔ aplicada (exit 0) | contacts + visibility + is_contact_visible | |
| 005 social | ✓ | ✓ | ✔ aplicada (exit 0) | 17 tabelas | |
| 006 messaging | ✓ | ✓ | ✔ aplicada (exit 0) | conversations/pcs/messages | |
| 007 commercial | ✓ | ✓ | ✔ aplicada (exit 0) | cats/serviços/portfolio/quotes/leads/reviews add-only | |
| 008 monetização | ✓ | ✓ | ✔ aplicada (exit 0) | payments add-only, subscriptions, credits_ledger, add/spend | |
| 009 admin | ✓ | ✓ | ✔ aplicada (exit 0) | admin_users/admin_logs/reports/is_admin/has_admin_permission | |
| 010 security | ✓ | ✓ | ✔ aplicada (exit 0) + **2 correções** | RLS matriz, views públicas, triggers | ver §9 |
| 911 orders | — | — | **NÃO EXECUTAR NESTA FASE** | — | |

## 2. Fixture sanitizada

| Check | Esperado | Observado | OK? |
|---|---|---|---|
| auth.users | 6 | 6 | ✔ |
| profiles | 6 | 6 | ✔ |
| orders | card + clientes | 2 (falha_esperada_ate_911) | ✔ |
| profile_contacts | 7 | 7 (FREE phone oculto, PRO phone) | ✔ |
| professional_profiles | 2 | 2 | ✔ |
| reviews | 1 | 1 | ✔ |
| FREE credits inicial | 0 (bug) → 3 | 3 | ✔ |
| ledger seed FREE | 1 (admin_adjust, 3, balance_after 3) | 1 | ✔ |
| PII mask (regex) | nenhum email real | ✔ | ✔ |

## 3. RLS / segurança — 18 cenários (runner)

Resultado runner `docs\RUN_RESULTS_20260907_162113.{log,csv}`: **RLS 01–18: 18/18 PASS** (25/26, único FAIL = ORD-1 esperado).

| Id | Cenário | Esperado | Resultado | Nota |
|---|---|---|---|---|
| 01 | anon lê tabelas públicas (plans) | ALLOW | PASS | |
| 02 | anon/other lê privadas (profiles/PII) | DENY | PASS | |
| 03 | alterar role | DENY | PASS | |
| 04 | alterar plan_id | DENY | PASS | |
| 05 | alterar credits | DENY | PASS | |
| 06 | alterar verified | DENY | PASS | |
| 07 | alterar featured | DENY | PASS | |
| 08 | alterar account_status | DENY | PASS | |
| 09 | dados de outro usuário | DENY | PASS | |
| 10 | fabricar créditos (add_credits) | DENY | PASS | |
| 11 | gastar sem saldo | bloqueado | PASS | |
| 12 | contatos FREE p/ terceiro | DENY | PASS | |
| 13 | contatos PRO | ALLOW | PASS | |
| 14 | exceção administrativa | ALLOW | PASS | |
| 15 | mensagem em conversa sem participação | DENY | PASS | após correção da recursion (ver §9) |
| 16 | PII de professional/company | DENY | PASS | |
| 17 | manipular payments | DENY | PASS | |
| 18 | criar subscriptions | DENY | PASS | |

## 4. SECURITY DEFINER (PARTE 7 — suite security_definer_v21.sql PASS)

| Função | definer | search_path | grants (PUBLIC/anon negado p/ sensíveis) | cliente não executa add/spend | lógica OK |
|---|---|---|---|---|---|
| is_admin | ✔ | ✔ public, STABLE | EXECUTE: authenticated (+ anon — correção §9) | — | ✔ (null-safe) |
| has_admin_permission | ✔ | ✔ | admin/service | — | ✔ |
| effective_permission | ✔ | ✔ | SELECT plans/plan_permissions p/ anon+auth | — | ✔ |
| is_contact_visible | ✔ | ✔ | REVOKE PUBLIC/anon, EXECUTE authenticated | — | ✔ |
| add_credits | ✔ | ✔ | service_role/admin | **✔ bloqueado** (DB-1 PASS) | ✔ |
| spend_credits | ✔ | ✔ | service_role/admin | **✔ bloqueado** (DB-1 PASS) | ✔ |

## 5. Credits ledger (PARTE 8 — suite credits_ledger_v21.sql PASS)

Fonte da verdade: `credits_ledger`; saldo em `profiles.credits` igual ao `balance_after` do último lançamento.

| Invariante | PASS/FAIL | Observação |
|---|---|---|
| saldo inicial = fixture | PASS | seed 3 |
| purchase credita + lança ledger | PASS | |
| lead_spend debita + lança | PASS | |
| refund credita tipo refund | PASS | |
| boost debita tipo boost | PASS | |
| insuficiente: bloqueia + sem lançamento | PASS | 8.6, sem lançamento falso |
| encadeamento balance_after (≥0) | PASS | 8.7 reescrito **order-independent** (PK uuid aleatória quebra ORDER BY id) |
| corrida real (2 sessões) | NOT TESTABLE | pedir execução em 2 terminais psql |
| rollback sem resíduo | PASS | |
| unique(gateway, gateway_payment_id) | PASS | DB-7 |

## 6. Contatos (PARTE 9 — suite contact_visibility_v21.sql exit 0)

| Regra | Esperado | Resultado |
|---|---|---|
| FREE oculto p/ terceiros (phone/whatsapp/email) | DENY | PASS |
| PRO visível | ALLOW | PASS |
| admin_exception (contact_type via JOIN) | ALLOW | PASS |
| burla UPDATE do visibility de terceiro | DENY | PASS |
| INSERT contato em nome de terceiro | DENY | PASS |

## 7. Migração CLIENT→USER (PARTE 10 — suite migrate_client_user_v21.sql PASS)

| Check | Esperado | Resultado |
|---|---|---|
| UUID preservado | ✔ | ✔ |
| email preservado | ✔ | ✔ (lido de auth.users; profiles não tem coluna email) |
| orders/reviews/payments preservados | ✔ | ✔ |
| role vira USER | ✔ | ✔ |
| ROLLBACK aplicado (staging intacto) | ✔ | ✔ |
| incompatibilidades detectadas no staging real | — | (coluna/valor que divergir em prod — conferir na transição) |

## 8. Orders / PII (PARTE 11, SEM 911 permanente — suite orders_pii_v21.sql PASS)

| Cenário | Esperado (pós-911) | Hoje | Resultado provado (tx revertida) |
|---|---|---|---|
| anon lê card OPEN | ver card | ver card | PII: anon_vê_card = 0 (não expõe por anon em bloco 911? validar pós-911) |
| anon lê PII de clientes | NÃO | SIM (vuln legada) | **registrado**: fallhas `nao_deve_ver_cliente = 2` — anon leu PII |
| usuário lê dados de outro | NÃO | NÃO | `outro_nao_vê_free = 0` ✔ RLS trava |
| admin exceção | SIM | SIM | `admin_vê_tudo = 2` ✔ |
| 911 executada? | NÃO nesta fase | | **NÃO** (efeito provado dentro de transação revertida) |

ORD-1 (runner test 26) permanece **FAIL por design** até a 911 ser promovida — documenta a vulnerabilidade legada.

## 9. Observações / divergências com o schema real

1. `profiles` **não tem coluna email** — ler de auth.users (tests e migração CLIENT→USER ajustados).
2. Vocabulário de permissões é `can_show_phone/email/whatsapp` (e `can_send_messages`), **não** `view_contacts` — todos os testes alinhados.
3. `profile_contact_visibility` tem `profile_contact_id` (não `profile_id`/`contact_type`) — consultas corrigidas p/ JOIN com `profile_contacts`.
4. **Correções em 010 (aplicadas no staging + no arquivo)**:
   - `GRANT EXECUTE ON is_admin(uuid) TO anon` — policies que avaliam `is_admin(auth.uid())` explodiam com `permission denied` para visitantes (função é null-safe).
   - Policy `conv_participants_select` recursava infinitamente (subquery na própria tabela) — substituída por helper `is_conversation_participant(uuid)` SECURITY DEFINER (owner dono da tabela, sem re-avaliar RLS).
5. **Testes corrigidos**: F1 7.7 (`can_show_phone`), F1/F2/F3/F4 `RAISE NOTICE` de topo → `SELECT`, F2 8.7 order-independent, runner deny-tests (3–8,10,15,17,18) reescritos p/ padrão DO (engole negação correta, RAISE só em efeito indevido).
6. **Runner**: PS 5.1 corrompe aspas duplas embutidas via `-c` → `Invoke-Psql` grava SQL em arquivo temporário e usa `-f`; precheck com retry (ENOIDENTIFIER transitório de primeira conexão no pooler).
7. `fake_uid` não é usado; fixture usa UUIDs fixos (FREE `1111…`, PRO `2222…`, OTHER `3333…`, PROF `4444…`, ADMIN `5555…`, COMPANY `6666…`).

## 10. Assinatura
- Aprovação para coord screening da FASE 4: ☐ aguardo resultado desta execução.