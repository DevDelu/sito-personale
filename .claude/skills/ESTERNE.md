# Skill esterne

Skill di terze parti copiate nel repo il 24/10/2026, lette per intero prima dell'installazione.
Gli aggiornamenti si fanno a mano, rileggendo il diff: mai scaricare skill in automatico.

| Skill | Fonte (commit) | Licenza | Modifiche locali | Chi la usa |
|---|---|---|---|---|
| `react-best-practices` | vercel-labs/agent-skills (063bee9) | MIT | nessuna | sviluppatori, revisore, prestazioni |
| `react-view-transitions` | vercel-labs/agent-skills (063bee9) | MIT | nessuna | designer, sviluppatori (animazioni da app su iPhone) |
| `web-design-guidelines` | vercel-labs/agent-skills (063bee9) + web-interface-guidelines `command.md` | MIT | regole salvate in `guidelines.md`, niente download a ogni uso | designer, revisore |
| `supabase` | supabase/agent-skills (c9be0e9) | MIT | avviso in testa: niente migration/CLI/MCP su produzione | revisore, sviluppatori |
| `supabase-postgres-best-practices` | supabase/agent-skills (c9be0e9) | MIT | nessuna | revisore, prestazioni |
| `frontend-design` | anthropics/skills (dbd4588) | Apache-2.0 | nessuna | designer (portfolio pubblico) |

Scartate: `vercel-optimize` (script e token Vercel, pensata per i costi), `webapp-testing`
(Python; c'è già Playwright), `deploy-to-vercel`/`vercel-cli-with-tokens` (deploy già automatico).
