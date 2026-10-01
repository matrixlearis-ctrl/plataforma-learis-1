# SAMEJ SOCIAL — PLANO DE EXECUÇÃO NO STAGING (MIGRATIONS + TESTES)

> FASE 3.2 — Execução exclusivamente no ambiente de **STAGING**.
> Produção: NUNCA. 911: **NÃO EXECUTAR NESTA FASE** (arquivo mantido separado).

## 1. Ordem de execução (obrigatória em sequência)
```powershell
$env:STAGING_DB_URL = "postgresql://postgres.<REF>:<SENHA>@aws-0-<REGIAO>.pooler.supabase.com:5432/postgres"  # só na sessão
$d = "supabase\migrations"
$files = @(
  "001_profiles_v21.sql","002_plans_permissions.sql","003_professional_company_profiles.sql",
  "004_contacts.sql","005_social_core.sql","006_messaging.sql","007_commercial.sql",
  "008_monetization.sql","009_admin.sql","010_security.sql"
)
foreach ($f in $files) {
  $start = Get-Date
  Write-Host "==> MIGRANDO $f (inicio $start)"
  psql $env:STAGING_DB_URL -v ON_ERROR_STOP=1 -f "$d\$f" 2>&1 | Tee-Object -FilePath "docs\mig_$f.log"
  if ($LASTEXITCODE -ne 0) {
    Write-Host "FALHA em $f. VER docs\mig_$f.log. PARAR. Não corrigir silenciosamente."
    exit 1
  }
  Write-Host "OK $f (fim $(Get-Date))"
}
```
> Regra de falha: **PARAR e registrar** — migration, erro, causa, arquivo, linha,
> correção proposta (não improvisar).

## 2. Log por migration (registrar no RESULTS_V21.md → linha correspondente)
| Migration | Início | Fim | Status | Objetos criados/alterados | Warnings |
|---|---|---|---|---|---|
| 001 | | | ⬜ | profiles+11 cols, CHECK role, índices | — |
| 002 | | | ⬜ | plans, plan_permissions, system_settings, effective_permission, FK plan_id, seed | — |
| 003 | | | ⬜ | professional_profiles, company_profiles | — |
| 004 | | | ⬜ | profile_contacts, profile_contact_visibility, is_contact_visible | — |
| 005 | | | ⬜ | posts..blocks (17 tabelas) | — |
| 006 | | | ⬜ | conversations/pcs/messages | — |
| 007 | | | ⬜ | categorias/serviços/portfolio/quote_requests/quotes/leads + reviews add-only | — |
| 008 | | | ⬜ | payments add-only, subscriptions, credits_ledger, add/spend_credits | — |
| 009 | | | ⬜ | admin_users, admin_logs, reports, is_admin, has_admin_permission | — |
| 010 | | | ⬜ | RLS (toda a matriz), views públicas, triggers | — |
| 911 | — | — | **NÃO EXECUTAR** | — | — |

## 3. Depois das migrations: fixture sanitizada
```sql
-- staging já migrado (001–010); carregar dataset sintético UMA vez:
\i scripts/staging_sanitize.sql
```
Guarda: `docs/staging_sanitize_YYYYMMDD.log`.

## 4. Rodar os testes (driver automatizado)
```powershell
$env:FREE_ID   = "11111111-1111-4111-8111-111111111111"
$env:PRO_ID    = "22222222-2222-4222-8222-222222222222"
$env:OTHER_ID  = "33333333-3333-4333-8333-333333333333"
$env:PROF_ID   = "44444444-4444-4444-8444-444444444444"
$env:ADMIN_ID  = "55555555-5555-4555-8555-555555555555"
$env:COMPANY_ID= "66666666-6666-4666-8666-666666666666"
.\scripts\run_staging_tests.ps1 -DbUrl $env:STAGING_DB_URL
```
O driver executa os arquivos em `supabase/migrations/tests/` e imprime, para cada teste:
`TEST <n>: PASS | FAIL | NOT TESTABLE`.
Todo output é salvo em `docs/RUN_RESULTS_YYYYMMDD_HHMMSS.log` + `docs/RUN_RESULTS_YYYYMMDD_HHMMSS.csv`.

## 5. Registro de resultados (template)
`supabase/migrations/tests/RESULTS_V21.md` — preencher com o status por teste e
por migration (evidência = log de execução). **NENHUM FAIL pode ficar aberto.**

## 6. Encerramento
1. Todos migrations: OK, com log.
2. Todos os testes: PASS ou NOT TESTABLE *justificado* (nunca PASS implícito).
3. Contagem de linhas ≈ fixture (auth.users=6, profiles=6).
4. Backup planejado ≠ realizado: marcar no PRODUCTION_BACKUP_CHECKLIST_V21.md.
5. Commit dos resultados (docs/logs — nunca credenciais).