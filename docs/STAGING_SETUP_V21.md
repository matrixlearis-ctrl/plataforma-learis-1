# SAMEJ SOCIAL — STAGING SETUP V2.1

> **PROJETO STAGING CONECTADO** (FASE 3.3): ref `rkeirrjseieecgbtaqju` ·
> `https://rkeirrjseieecgbtaqju.supabase.co`. Schema ainda vazio (GoTrue v2.196.0 OK;
> PostgREST OK; `profiles`/`plans` = 404).
> Credenciais: **somente local**. Chave publishable via variável de ambiente em comandos
> pontuais; senha do banco em arquivo local fora do repo (`%TEMP%\opencode\staging_db_url.txt`);
> nada disso entra em arquivos versionados nem no chat.

> Guia passo a passo para criar o Supabase **STAGING** e executar a validação
> dinâmica da SAMEJ SOCIAL V2.1.
>
> REGRAS:
> - **NUNCA** rodar estes passos contra o projeto de produção.
> - **NUNCA** executar a migration `911_orders_hardening.sql` nesta fase.
> - **NUNCA** coletar/registrar/versionar credenciais (senha de banco,
>   service_role key, access token, secrets do Mercado Pago).
> - Credenciais somente via variáveis de ambiente / vault local, fora do repositório.

## 0. Pré-requisitos
| Ferramenta | Uso | Instalação (Windows) |
|---|---|---|
| Node.js ≥ 18 | CLI supabase | `winget install OpenJS.NodeJS.LTS` |
| Supabase CLI ≥ 2.x | db pull / db push / login | `npm i -g supabase` |
| psql (opcional) | execução manual dos testes | `winget install PostgreSQL.PostgreSQL.16` |

## 1. Criar novo projeto Supabase (STAGING)
1. Dashboard → **New project**.
2. Nome: `samej-social-staging`.
3. **Database region:** escolher uma **região do Brasil/South America** (ex.: `South America (São Paulo)`;
   se indisponível, a região AWS mais próxima). Confere la latência + residência de dados.
4. **Database password:** gerar e guardar no seu vault/env local (`SGBD_STAGING_PASSWORD`).
   Não colocar em arquivo versionado.
5. Plano: Free ou Pro para testes (RLS/functions funcionam em ambos; PITR exige Pro).
6. Anotar **Project Ref** (ex.: `abcdefghijklmnopqrst`).

## 2. Obter project-ref e project url
- Report → **Project Settings → General**. Copiar **Project Ref** e **Project URL**.
- Report-config para backup mental (sem secrets):
  ```
  STAGING_REF=<ref>
  STAGING_URL=https://<ref>.supabase.co
  STAGING_DB_URL=postgresql://postgres.<ref>:<SENHA>@aws-0-<reg>.pooler.supabase.com:5432/postgres
  ```

## 3. Login no Supabase CLI
```powershell
# Gerar token em: Dashboard -> Account -> Access Tokens
$env:SUPABASE_ACCESS_TOKEN = "<colar aqui, apenas na sessão>"
supabase login
```
O token fica na sessão shell e no cache do CLI — **não** em arquivo do projeto.

## 4. Vincular o repositório ao staging
Na raiz `Rede social/`:
```powershell
supabase link --project-ref <STAGING_REF>
supabase projects list          # conferir ref/região
```

## 5. Obter o schema REAL (obrigatório ANTES de qualquer migration)
```powershell
# Dump do schema atual do staging (vem pronto/default do Supabase)
supabase db pull --schema public   # gera supabase_public.sql (revisar!)

# Comparar com o schema legado + auditoria conhecida:
#   supabase_schema.sql  (defasado — NÃO é a verdade)
#   docs/SCHEMA_REAL_V21.md
```
> A coluna real `profiles.email`, `orders.image_url` e a constraint
> `profiles_role_check` **podem divergir** do `supabase_schema.sql`. Sempre
> instalar o schema REAL primeiro (ver `docs/SCHEMA_REAL_V21.md`).

## 6. Aplicar migrations 001–010 SOMENTE no staging
```powershell
# Na ordem EXATA. NÃO rodar 911.
supabase db push --db-url $env:STAGING_DB_URL   # aplica 001..010 (sem o 911)
# OU manualmente, um por um (ver docs/RUN_MIGRATIONS_V21.md)
psql $env:STAGING_DB_URL -v ON_ERROR_STOP=1 -f supabase/migrations/001_profiles_v21.sql
psql $env:STAGING_DB_URL -v ON_ERROR_STOP=1 -f supabase/migrations/002_plans_permissions.sql
# ... 003 .. 010
```
> `supabase db push` aplica por ordem alfanumérica; como `911` existe com nome
> de prefixo, **manter a pasta de migrations SEM o 911** durante `db push`
> (ou mover o 911 temporariamente para `supabase/migrations-hold/`).
> **Em caso de falha: PARAR. Não continuar silenciosamente.**

## 7. Preparar dados sanitizados de teste (APÓS as migrations)
```sql
-- staging já com 001–010 aplicados: carregar fixtures sintéticas
\i scripts/staging_sanitize.sql
```
Cria usuários **sintéticos** (`*.test.local`) + perfis/contatos/orders fictícios
com PII mascarada e **UUIDs fixos** (usados diretamente pelos testes).
NUNCA copia produção.

## 8. Executar os testes de segurança/RLS/functions
Ver `docs/RUN_MIGRATIONS_V21.md` → seção Testes. Driver automatizado:
```powershell
$env:STAGING_DB_URL = "..."
$env:FREE_ID = "<uuid fixture free@test.local>"
$env:PRO_ID  = "<uuid fixture pro@test.local>"
$env:OTHER_ID = "<uuid fixture user@test.local>"
$env:ADMIN_ID = "<uuid fixture admin@test.local>"
.\scripts\run_staging_tests.ps1 -DbUrl $env:STAGING_DB_URL
```
Cada teste termina como `PASS`|`FAIL`|`NOT TESTABLE`. **FAIL nunca é ignorado.**

## 9. Registrar resultados
- Preencher `supabase/migrations/tests/RESULTS_V21.md` (template).
- Salvar o log gerado pelo driver em `docs/` (ex.: `docs/RUN_RESULTS_YYYYMMDD.log`).
- Somente seguir para produção com **todos os testes sem FAIL** e **aprovação
  explícita do dono**.

## 10. Checklist de encerramento do setup
- [ ] Projeto criado em região BR
- [ ] Ref/URL/Db URL anotados (sem secrets)
- [ ] CLI vinculado (supabase link)
- [ ] Schema real capturado e comparado (SCHEMA_REAL_V21.md)
- [ ] Fixture sanitizada aplicada (não-produção)
- [ ] 001→010 aplicadas em ordem, com log
- [ ] Tests rodados: PASS/FAIL/NOT TESTABLE registrados
- [ ] 911 NÃO executada
- [ ] Resultados commitados (documentos/logs — sem credenciais)