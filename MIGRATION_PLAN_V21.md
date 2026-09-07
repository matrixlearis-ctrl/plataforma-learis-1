# SAMEJ SOCIAL — MIGRATION_PLAN_V21 (ESTADO → FUTURO)

> Fase 3, preparação controlada. Nada é executado em produção.
> Objetivo: transformar a marketplace `samej` atual (React/Vite encontrado) na social
> profissional **SAMEJ SOCIAL** sem quebra de dados, com rollback completo e RLS blindado.

## 1. Estado atual (auditoria real — 2026-09-06)
- **Front:** React 19.2.3, react-router 7.12.0, supabase-js 2.90.1, Vite 6.4.1, TS 5.9.3,
  Tailwind via CDN; deploy **Vercel (samej.site)**; PIX via Mercado Pago (mock no front em produção).
- **Banco:** `profiles` (9: 2 ADMIN, 6 PROFESSIONAL, 1 CLIENT), `orders` (9, com PII: phone/address),
  `reviews`=0, `payments`=0; `plans`/`posts`/`admin_logs` **inexistentes**.
- **Segurança:** RLS aberto em `orders`; `profiles.UPDATE` sem WITH CHECK; admin por e-mail
  hardcoded (`Auth.tsx:122`); créditos editáveis no front (`App.tsx:331`); webhook sem
  idempotência; edge functions sem validação de claims.

## 2. Tabelas → destino
| Tabela atual | Destino V2 | Migration |
|---|---|---|
| profiles | **evolui**: username, cover_url, verified, featured, account_status, deleted_at, plan_id, updated_at; CHECK de role ampliado | 001 |
| plans (nova) | planos FREE/PRO/COMPANY + plan_permissions + system_settings | 002 |
| professional_profiles | cadastro profissional completo | 003 |
| company_profiles | cadastro de empresa | 003 |
| profile_contacts | contatos do usuário + visibilidade por plano (liga → is_contact_visible) | 004 |
| — | posts/comments/likes/shares/saves/follows/hashtags/stories/reels/notifications/blocks | 005 |
| — | conversas/mensagens | 006 |
| — | service_categories/services/professional_services/company_services/portfolio/quote_requests/quotes/leads | 007 |
| payments/reviews | **evoluem add-only** (gateway_payment_id, new cols sem DROP) | 008 |
| subscriptions/credits_ledger (nova) | assinaturas + ledger de créditos | 008 |
| — | admin_users/admin_logs/reports + is_admin() | 009 |
| — | RLS completo + triggers + views públicas | 010 |
| orders (legada) | mantida; hardening separado para o front v2 | 911 (opcional, NÃO roda agora) |

## 3. Especializações/transformações-chave
- **CLIENT → USER**: livros de papeis mantêm `CLIENT` no CHECK (zero quebra); novos usos usam USER/PROF.
- **Leads (orders) → quote_requests/leads**: `orders` é destacada como legada; novo fluxo nasce em
  `quote_requests` (sem PII pública via view `public_quote_requests`) e `leads` (backend-only).
- **Créditos → credits_ledger**: pack hardcoded de `constants.tsx` vira plano/backed;
  `add_credits`/`spend_credits` são SECURITY DEFINER e o front **nunca** toca `profiles.credits`.
- **Admin**: `is_admin()` substitui e-mail hardcoded; `admin_users` registra operadores.
- **PIX real**: webhook com idempotência (`gateway_payment_id` UNIQUE) + edge functions com JWT (Fase 4).

## 4. Ordem de execução (quando aprovada — ambiente staging primeiro)
0. Backup completo (ver `BACKUP_PLAN.md`).
1. MIGRATION 001 → 010 em um único pacote no **staging**, rode `tests/rls_matrix_v21.sql` +
   `tests/attack_tests_v21.sql` e registre SUCCESS/FAIL nesta seção.
2. Homologue dados (contagens 9/9/0/0; login admin + profissional; PIX de teste).
3. Deploy coordenado: front v2 (branch nova) + migrations 001-010.
4. **911** separadamente, apenas quando o front v2 parou de usar `orders`.
5. Rotação da anon key após tudo.

Se falhar em staging: reverter DB (backup), reverter frente e reanalisar esta planilha.
Não existe meio termo — migração NUNCA roda "sozinha" em produção.

## 5. Impacto/riscos
| Risco | Mitigação |
|---|---|
| Política nova de `profiles` quebra front v1 (`SELECT` restrito a autenticado) | deploy coordenado → front v2 no mesmo instante; view `public_profiles` para leitura pública |
| CHOKE: trigger `protect_profile_privileges` bloqueia fluxo legado de créditos | executar 001-010 com front v2 só; teste de crédito/ledger antes |
| `orders` legada segue aberta até 911 | 911 isolada; sem exposição extra de PII novo |
| webhook/pix ainda mock | Fase 4 — fora do escopo desta migração |

## 6. Rollback
- **Dados:** restauração PITR/dump (ver BACKUP_PLAN).
- **Schema:** migrations são reversíveis (convenção `-- Rollback:` no cabeçalho), sem DROP de colunas com dados.
- **Front:** rollback de deploy Vercel para tag `pre-v21`.

## 7. Critérios de aceite da Fase 3
- [ ] `pg_dump` executado e verificável (ou pendência registrada)
- [ ] 001 → 010 + 911 aplicadas em staging sem erro
- [ ] Matriz RLS V2.1 validada (tests verdes)
- [ ] Todos os 15 cenários de ataque DENIED
- [ ] Relatório final entregue e **aprovado pelo dono**