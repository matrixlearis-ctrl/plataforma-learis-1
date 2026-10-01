# SAMEJ SOCIAL — PRODUCTION BACKUP CHECKLIST V2.1 (PLANEJADO × REALIZADO)

> FASE 3.2. Nenhum item é marcado como "realizado" sem evidência.
> "Planejado" = documentado; "Realizado" = executado e verificado (data + artefato).
> Antes de QUALQUER deploy da V2.1 em produção, TODOS os itens abaixo precisam estar REALIZADOS.

## A. Plano de recuperação (desenho)
| # | Ação | Status |
|---|---|---|
| A1 | PITR ativo no projeto Supabase (RPO/RTO documentados) | ☐ planejado |
| A2 | Plano de rollback por migration (está no cabeçalho de cada 0XX) | ☐ planejado |
| A3 | Estratégia: migration NÃO destrutiva ⇒ rollback = reversão nas 0XX | ☐ planejado |
| A4 | Quem autoriza rollback em prod e janela (combined com a Fase 4) | ☐ planejado |
| A5 | Checklist de elevação: caso o banco fique corrompido → restaurar PITR + reexecutar 0XX + dados de negócio via ETL | ☐ planejado |

## B. Dados PostgreSQL (produção)
| # | Item | Como | Planejado | Realizado |
|---|---|---|---|---|
| B1 | pg_dump lógico completo (schema + dados) | SQL editor→esquema, ou `pg_dump --schema-only` + `pg_dump --data-only` (roles: `pg_roles`; no Supabase não há ferramenta idêntica p/ roles via dump) | ☐ | ☐ (data) |
| B2 | Backup de `auth.users` (CRUCIAL — FK orders/payments/reviews) | `pg_dump -t auth.users` | ☐ | ☐ |
| B3 | Backup de `storage.objects` (avatares/mídias) | Supabase dashboard → Storage → Export / CLI | ☐ | ☐ |
| B4 | Cópias das tabelas legadas COM PII (orders, prof_profiles, etc.) | dump dedicado (não perder histórico antes do hardening) | ☐ | ☐ |
| B5 | Teste de restauração em banco DESOCADO (uma vez) | restaurar dump num projeto/stack fora de prod e conferir contagem de linhas | ☐ | ☐ |
| B6 | Checksum/tamper: anotar contagens pré e pós dump | | ☐ | ☐ |

## C. Storage / Assets
| # | Item | Planejado | Realizado |
|---|---|---|---|
| C1 | Bucket público de avatares/portfólio | ☐ | ☐ |
| C2 | Bucket privado (se houver) | ☐ | ☐ |
| C3 | Mídia que a V2.1 referencia (`cover_url`, `logo_url`, posts) | ☐ | ☐ |
| C4 | (Futuro) R2: origem a configurar no WHATS na Fase 5 | ☐ | N/A |

## D. Configuração / Funções
| # | Item | Planejado | Realizado |
|---|---|---|---|
| D1 | `lib/supabase.ts` URL + anon key (versão de código correta) | ☐ | ☐ |
| D2 | Edge Functions (mercadopago-pix, webhook) — código + segredos | ☐ | ☐ |
| D3 | Próximo: `supabase/config.toml` atualizado c/ o que o backend precisa | ☐ | ☐ |
| D4 | Variáveis de ambiente Vercel (URL/anon/service_role/MP) | ☐ | ☐ (nunca no Git) |
| D5 | auth settings (URLs de callback, templates de email) | ☐ | ☐ |

## E. Git / Código
| # | Item | Planejado | Realizado |
|---|---|---|---|
| E1 | Tag `pre-v21` existente (snapshot antes das 0XX) | ☐ | ☐ feito: `pre-v21`→`ee7c023` |
| E2 | Tag de release da V2.1 criada após aprovação | ☐ | ☐ |
| E3 | Branch de release separada se o processo pedir | ☐ | ☐ |
| E4 | Chave `service_role` no vault (nunca no repositório) | ☐ | ☐ (vault) |

## F. Recuperação de testes
| # | Item | Planejado | Realizado |
|---|---|---|---|
| F1 | Staging recriável do zero (001→010 + {% sanitize %} + RESULTS) | ☐ | ☐ |
| F2 | Teste de deploy em staging IMEDIATAMENTE antes da janela | ☐ | ☐ |

## G. Checklist zero-hora (momento do deploy)
- [ ] Aprovado pelo dono (checklist assinado).
- [ ] Último backup REALIZADO com timestamp < 24h (B4/B5 verificado).
- [ ] Plano rápido de rollback por migration PRONTO (mig_XXX.sql).
- [ ] Janela combinada; monitor de latência/queries ligado (Supabase observability/Postgres logs).
- [ ] Plano de comunicação em caso de incidente.
- [ ] 911 permanece NÃO executada.

## H. Conclusão
> Este checklist só fecha quando TODOS os itens "Realizado" tiverem data+evidência.
> Não assinar "backup verificado" sem restaurar num ambiente desocupado.