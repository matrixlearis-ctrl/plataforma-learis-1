# SAMEJ SOCIAL — Matriz RLS V2.1

> Status: proposta a validar em staging (nunca aplicar em produção sem aprovação).
> Convenção: **DENIED** = sem política de escrita = acesso barrado por padrão.
> Backend/Edge (service_role) ignora RLS por design — toda escrita financeira/leads/notificações
> É backend. Client (anon/authenticated via JS SDK) segue estritamente esta matriz.

## Legenda de papéis
| Papel | Descrição |
|---|---|
| anon | Visitante não logado |
| USER | Pessoa comum (ex-Leads/clients), plano FREE |
| PROF | Profissional / Empresa, plano FREE (limites por `effective_permission`) |
| PRO | Assinante PRO (permissões liberadas) |
| ADMIN | is_admin() = true (admin_users ativo ou SUPER_ADMIN) |
| backend | service_role (Edge Functions / webhooks) — ignora RLS |

## Tabelas legadas (001)
| Tabela | SELECT | INSERT | UPDATE | DELETE | Observação |
|---|---|---|---|---|---|
| auth.users | backend | backend | backend | backend | gerenciado pelo Auth |
| profiles | somente próprio ou ADMIN (vista pública = `public_profiles`) | auth.uid()=id | auth.uid()=id (WITH CHECK) | — | trigger bloqueia role/plan/credits/status fora de admin |
| orders | card público OU dono (V2); hoje legada | dono (V2) | dono/ADMIN (V2) | ADMIN | política atual permanece até `911` |
| reviews | aprovadas/dono/ADMIN | dono | ADMIN | ADMIN | perfil receptor conferido por `protect_profile_privileges` |
| payments | dono/ADMIN | back end | back end | — | V2 |

## Tabelas novas (002–009)
| Tabela | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| plans | público (active) | ADMIN | ADMIN | ADMIN |
| plan_permissions | público | ADMIN | ADMIN | ADMIN |
| system_settings | público | — | ADMIN | — |
| professional_profiles | próprio/ADMIN (público SEM PII via `public_professionals`) | próprio | próprio | ADMIN/preservação |
| company_profiles | próprio/ADMIN (público SEM PII via `public_companies`) | próprio | próprio | ADMIN/preservação |
| profile_contacts | próprio/ADMIN/visível (`is_contact_visible`) | próprio | próprio | próprio/ADMIN |
| profile_contact_visibility | próprio/ADMIN | próprio | próprio | ADMIN |
| posts | published/não-deletado OU autor OU ADMIN | autor (can_publish) | autor/ADMIN | autor/ADMIN |
| post_media | via post | via post do autor | — | autor/ADMIN |
| comments | published/ADMIN | autor | autor/ADMIN | autor/ADMIN |
| likes | público | próprio | — | próprio/ADMIN |
| shares | público | próprio | — | próprio/ADMIN |
| saves | público | próprio | — | próprio/ADMIN |
| follows | público | próprio | — | próprio/ADMIN |
| hashtags | público | backend | backend | backend |
| post_hashtags | público | via post do autor | — | via post do autor |
| stories | own/publicado/não-expirado/ADMIN | autor | autor/ADMIN | autor/ADMIN |
| story_media | via story | via story do autor | — | — |
| story_views | autor da story/ADMIN | própria | — | — |
| reels | published/author/ADMIN | autor | autor/ADMIN | autor/ADMIN |
| reel_media | via reel | via reel do autor | — | — |
| reel_views | autor do reel/ADMIN | própria | — | — |
| notifications | próprio/ADMIN | próprio/ADMIN | marca-lido próprio | ADMIN |
| blocks | envolvidos/ADMIN | próprio (bloqueador) | — | próprio/ADMIN |
| conversations | participantes | criador | — | ADMIN |
| conversation_participants | participantes | é participante (self) | self | ADMIN |
| messages | participantes | remetente (can_send_messages + não-bloqueado p/ todos os outros participantes) | — | remetente/ADMIN |
| service_categories | público (active) | ADMIN | ADMIN | ADMIN |
| services | público (active) | ADMIN | ADMIN | ADMIN |
| professional_services | público | próprio | próprio | próprio/ADMIN |
| company_services | público | via company do próprio | via company | via company |
| portfolio_items | published/proprietário/ADMIN | próprio | próprio/ADMIN | próprio/ADMIN |
| quote_requests | aberto(público, sem PII) OU dono OU ADMIN | dono (can_request_quote) | dono/ADMIN | ADMIN |
| quotes | profissional/comprador/ADMIN | profissional (can_receive_leads) | backend/ADMIN | ADMIN |
| leads | profissional/comprador/ADMIN | **backend** | **backend** | ADMIN |
| subscriptions | próprio/ADMIN | backend | backend | backend |
| credits_ledger | próprio/ADMIN | backend/`add_credits` (definer) | — | — |
| admin_users | ADMIN | ADMIN | ADMIN | ADMIN |
| admin_logs | ADMIN | backend | backend | ADMIN |
| reports | ADMIN | repórter | ADMIN | ADMIN |
| public_profiles | público (sem PII) | — | — | — |
| public_professionals | público (sem PII) | — | — | — |
| public_companies | público (sem PII) | — | — | — |
| public_quote_requests | público (cards sem PII) | — | — | — |

## Funções/segurança
| Função | Executor | Escopo |
|---|---|---|
| `is_admin(uuid)` | SECURITY DEFINER | fonte única de verdade para admin |
| `has_admin_permission(uuid, text)` | SECURITY DEFINER | permissões granulares |
| `effective_permission(uuid, text)` | SECURITY DEFINER | capacidade de plano (can_*) |
| `add_credits` / `spend_credits` | SECURITY DEFINER | ledger, chamável só por backend |
| `is_contact_visible(uuid)` | SECURITY DEFINER | oculta contato conforme plano |
| `protect_profile_privileges` | trigger antes modifica | bloqueia auto-privilégio |
| `set_updated_at` | trigger genérico | updated_at automático |

## Anti-padrões ELIMINADOS por esta matriz
1. `SELECT`/`INSERT`/`UPDATE` público em `orders` com PII do cliente (era anon-key) — **corrigido**.
2. `UPDATE profiles` sem `WITH CHECK` — agora `USING auth.uid()=id WITH CHECK auth.uid()=id`.
3. Admin decidido por e-mail hardcoded (`Auth.tsx`) — agora `is_admin()`.
4. Créditos editáveis pelo front (`App.tsx`) — agora bloqueados por trigger.
5. Mock PIX em produção — será substituído por backend real (Fase 4).
6. Edge functions sem JWT — exigência de `Authorization` + validação de claims na Fase 4.
7. Webhook MP sem idempotência — exigência de `gateway_payment_id` unique/processed (Fase 4).

## Validação
Rodar `tests/rls_matrix_v21.sql` e `tests/attack_tests_v21.sql` em **staging** e marcar o resultado
nesta tabela. Só depois aprovar execução coordenada (DB + front v2) em produção.