# SAMEJ SOCIAL — FASE 3.2 · STAGING KIT

> **STATUS: STAGING CONECTADO (FASE 3.3)** — ref `rkeirrjseieecgbtaqju`,
> `https://rkeirrjseieecgbtaqju.supabase.co`. VALIDAÇÃO: schema ainda vazio
> (migrations 001–010 aguardando aplicação via canal SQL — REST não executa DDL).
> Credenciais: **somente locais** em `C:\Users\<user>\AppData\Local\Temp\opencode\staging_credentials.json`
> (fora do repositório); nada versionado; nada impresso no chat.
> Nenhuma credencial real aparece neste documento nem nos scripts. Apenas placeholders/variáveis.

---

## 1. Estado do Git
- Repositório: `samej rede social\Rede social` (branch `master`).
- Commits: `ee7c023` **Snapshot pre-v21** · `d6cc54f` **FASE 3.1 validacao: corrigir 8 falhas**.
- Tag: `pre-v21` → `ee7c023` (protegida; não foi alterada nesta fase).
- Árvore de trabalho: com artefatos da 3.2 (ABAixo); **sem commit novo** nesta fase (não solicitado).

## 2. Migrations da V2.1 (somente staging)
`supabase/migrations/001…010` (FASE 1–3, corrigidas na 3.1). A `911_orders_hardening.sql`:
**NÃO EXECUTAR NESTA FASE** (ver §11). Sincronizar o schema real via `SCHEMA_REAL_V21.md`
antes de rodar (divergências conhecidas: `profiles.email`, `orders.image_url`, `profiles_role_check`).

## 3. Procedimento de execução no staging
- `docs/STAGING_SETUP_V21.md` — passo a passo completo.
- `docs/RUN_MIGRATIONS_V21.md` — ordem 001→010, log por migration, PARAR em falha.

## 4. Captura do schema real
- `docs/SCHEMA_REAL_V21.md` — queries de comparação (constraints, FKs, funções, policies, triggers,
  storage, auth) para detectar divergências entre produção e as migrations.

## 5. Dados sanitizados (fixture)
- `scripts/staging_sanitize.sql` — dataset **sintético** (emails `*.test.local`, PII mascarada,
  senha fake, UUIDs fixos). **Executar DEPOIS das migrations 001–010**, UMA vez.
  - FREE `1111…1111`, PRO `2222…2222`, OTHER `3333…3333`, PROF `4444…4444`,
    ADMIN `5555…5555`, COMPANY `6666…6666`.

## 6. Testes de segurança/RLS
- `supabase/migrations/tests/security_tests_v21.sql` (18 cenários, auditável).
- `scripts/run_staging_tests.ps1` (runner: `SET ROLE anon/authenticated` + classificação
  **PASS | FAIL | NOT TESTABLE**; saída em `docs/RUN_RESULTS_*.log/.csv`).
- `supabase/migrations/tests/RESULTS_V21.md` (modelo de preenchimento; FAIL nunca fica aberto).
- Observação: run via SQL Editor roda como postgres ⇒ bypass de RLS; **contagem real de acesso
  exige o runner/psql** (SET ROLE) — sem isso, marque os cenários 01–18 NOT TESTABLE.

## 7. Security definer
- `supabase/migrations/tests/security_definer_v21.sql` — is_admin, has_admin_permission,
  effective_permission, is_contact_visible, add_credits, spend_credits; definer/search_path/grants/
  uso por papel; escalonamento. (add/spend: EXECUTE só service_role, provado no runner).

## 8. Credits ledger
- `supabase/migrations/tests/credits_ledger_v21.sql` — inicial, purchase, spend, refund, boost,
  insuficiente, invariante monotônico, rollback, duplicidade (unique gateway_payment_id).
  `credits_ledger` = fonte da verdade. Corrida real (2 sessões) = passo manual documentado.

## 9. Contatos
- `supabase/migrations/tests/contact_visibility_v21.sql` — FREE oculto, PRO visível,
  exceção administrativa, tentativas de burla (UPDATE/INSERT em nome de terceiro).

## 10. Migração CLIENT → USER
- `supabase/migrations/tests/migrate_client_user_v21.sql` — transação com **ROLLBACK**:
  preserva UUID/email/orders(legadas)/reviews/payments; registra incompatibilidades reais.

## 11. Orders / PII — sem 911
- `supabase/migrations/tests/orders_pii_v21.sql` — documenta a vulnerabilidade LEGADA (orders
  permissiva hoje) e prova o efeito da 911 em transação **revertida** (nunca promove).
  Conclusão honesta: a 911 protege por linha (card público) e a proteção total exige que o front v2
  deixe de usar `orders` (fluxo quote_requests/leads).

## 12. Backup de produção
- `docs/PRODUCTION_BACKUP_CHECKLIST_V21.md` — separa **PLANEJADO** × **REALIZADO**.
  Nada é marcado realizado sem evidência.

## 13. Critérios de APROVAÇÃO da V2.1 (após staging rodar)
1. 001–010 aplicadas com log OK (migration × linha × objetos).
2. Fixture carregada (auth.users=6, profiles=6) e PII mask validada.
3. Testes de RLS 01–18: todos PASS ou NOT TESTABLE **justificado** (nunca o contrário).
4. inicial/ledger: invariantes PASS.
5. Contatos: regras FREE/PRO/admin_exception PASS + burlas DENY.
6. CLIENT→USER simulado: preservação comprovada (ROLLBACK).
7. 911: NÃO executada; PARTE 11 em ROLLBACK; gap de orders registrado.
8. Backup: checklist Realizado preenchido com evidências (ou APROVAÇÃO CONDICIONADA ao backup).

## 14. Critérios de REPROVAÇÃO
1. Qualquer 0XX falhando no staging (fora rollback previsto).
2. Vazamento de PII (cenários 02/09/12/16/17) com acesso indevido REAL.
3. Fabricação de créditos (10) ou gasto sem saldo (11) possível por cliente autenticado.
4. Burlas de contatos (parte 9) que passem.
5. Migração CLIENT→USER com perda/duplicação de UUID/email/orders/reviews/payments.
6. Presença de segredo (service_role/MP) em arquivo/script/chat.

## 15. Próximos passos
1. **Dono cria o projeto Supabase STAGING** e compartilha ref/URL (sem senha no chat).
2. `docs/SCHEMA_REAL_V21.md` → aplicadas correções de divergência.
3. `RUN_MIGRATIONS_V21.md` → 001–010 com logs.
4. `staging_sanitize.sql` → fixture.
5. `run_staging_tests.ps1` → planilha de resultados → preencher `RESULTS_V21.md`.
6. Backup checklist (produção) executado com evidências.
7. Retorno para aprovação da V2.1 e coordenação da FASE 4 (MP + R2 + front v2,
   sem nunca tocar o assunto daqui sem sinal verde).

---

## Arquivos criados/modificados nesta fase
**Criados**
- `docs/STAGING_SETUP_V21.md`
- `docs/SCHEMA_REAL_V21.md`
- `docs/RUN_MIGRATIONS_V21.md`
- `docs/PRODUCTION_BACKUP_CHECKLIST_V21.md`
- `scripts/staging_sanitize.sql`
- `scripts/run_staging_tests.ps1`
- `supabase/migrations/tests/security_tests_v21.sql`
- `supabase/migrations/tests/security_definer_v21.sql`
- `supabase/migrations/tests/credits_ledger_v21.sql`
- `supabase/migrations/tests/contact_visibility_v21.sql`
- `supabase/migrations/tests/migrate_client_user_v21.sql`
- `supabase/migrations/tests/orders_pii_v21.sql`
- `supabase/migrations/tests/RESULTS_V21.md`
- `SAMEJ_SOCIAL_FASE_3_2_STAGING_KIT.md` (este arquivo)

**Modificados**
- `supabase/migrations/008_monetization.sql` — `spend_credits` ganha `p_type`
  (`lead_spend|boost|refund|expiry|admin_adjust`); grants atualizados para a assinatura de 6 args.
- `supabase/migrations/010_security.sql` — `messages_insert_sender` exige participação na
  conversa (fechava injeção de mensagens em conversas alheias descoberta durante a enumeração dos 18 testes).
- `docs/STAGING_SETUP_V21.md` (ajuste intrínseco da ordem: sanitize após 001–010).