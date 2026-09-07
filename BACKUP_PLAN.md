# SAMEJ SOCIAL — PLANO DE BACKUP (FASE 3)

> Data de referência: 2026-09-06 (auditoria real via PostgREST: `profiles`=9, `orders`=9,
> `reviews`=0, `payments`=0; `plans`/`posts`/`admin_logs` inexistentes).
> Ação exigida ANTES de qualquer migração em produção e, idealmente, agora.

## 1. Backup do Banco (Supabase PostgreSQL)
Ferramenta oficial (via Dashboard **Database → Backups**):
- **Backup programado**: ativar **Schedule daily backups** (PITR em plano superior).
- **Backup manual imediato**: botão **Create a backup** no Dashboard.
- **Dump local (CLI)** — exige credenciais de `DB_PASSWORD` (proprietário `postgres`): documentar aqui quando concedidas.

```bash
# após obter senha do banco (Database > Connect > apenas credenciais?)
supabase db dump -p <projeto-ref> --db-url postgresql://postgres.<ref>:<senha>@aws-0-<reg>.pooler.supabase.com:5432/postgres
pg_dump "postgresql://postgres.<ref>:<senha>@aws-0-<reg>.pooler.supabase.com:5432/postgres" -Fc -f sgbd_samej_$(date +%Y-%m-%d).dump
# verificação (restaurável?):
pg_restore --list sgbd_samej_$(date +%Y-%m-%d).dump | head
```

> Ação manual pendente: obter senha do banco e executar o `pg_dump` acima
> (lista como pendência no relatório final, seção "Ações manuais").

## 2. Backup do Storage (imagens/produtos)
Hoje as imagens estão provavelmente no **Storage do Supabase** (`avatars`, `ordens`, etc.), migrando para **Cloudflare R2** (V2/R2 antecipado — Fase 2).
- Listar buckets: Dashboard → Storage.
- Backup: projetar cópia síncrona bucket → R2 (r2 anticonformidade sem custo de saída na rede).
- Exportar URLs de objetos como inventário (`supabase.storage.listObjects` via CLI/script).

## 3. Backup de Metadados (Auth)
`auth.users` NÃO entra em `pg_dump` padrão (pertencente ao schema `auth`): usar **export bckup de usuários** no Dashboard (Auth → Users → Export) ou script no painel Admin, preservando `id` (FK de `profiles.id`).

## 4. Backup do Front (Git)
- Repositório local NÃO é git (`git init` + commit da árvore atual), ou já existe branch; **recomendado:** dar `git init` agora e commitar o estado pré-migração (tag `pre-v21`).
- Vercel já mantém deploy anterior; reverter = rollback de deploy (sem perda).

## 5. Procedimento de Restauração
1. **PITR**: restaurar point-in-time para antes do início da migração (Dashboard).
2. **Dump**: recriar DB em nova instância `restore` e conferir contagens/RLS.
3. **Storage/R2**: repontar endpoints de mídia (variável de ambiente no Vercel).
4. **Auth**: reimportar usuários (mesmos UUIDs) para manter FKs.
5. **Front**: rollback Vercel para commit `pre-v21` + reverter envs.
6. **Verificação**: contagens (9/9/0/0), login de 1 admin + 1 profissional, PIX de teste.

## 6. Backups de migrations e RLS
- Arquivos `supabase/migrations/001…010/911` são o próprio "backup de schema" versionado.
- Manter backup do estado real do banco (`supabase_schema.sql` defasado + dump) antes de aplicar 001.

## 7. Cronograma mínimo (Fase 3)
| Ação | Quando | Quem |
|---|---|---|
| `git init` + tag `pre-v21` | imediato | dev (opencode) |
| Ativar backups diários + PITR no Dashboard | imediato | dono |
| `pg_dump` com senha do banco | assim que a senha estiver disponível | dono |
| Snapshot do Storage | antes da Fase 4 (R2) | dono |
| Dump pré-e-pós-migração 001-010 | dia da execução aprovada | dono |

## 8. Garantias
- Nenhuma migration destrói dados (`IF NOT EXISTS`, add-only, soft-delete).
- `911` (hardening de `orders`) só é aplicada junto com o front v2 (não quebra legado antes disso).
- Backup verificável: sempre testar `pg_restore --list` após o dump.