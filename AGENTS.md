<!-- BEGIN:nextjs-agent-rules -->
# Next.js 16 in this repo

This project runs Next.js 16.2.11. The concrete convention change to know: routing/auth
middleware lives in `proxy.ts` (exporting `proxy()`), not `middleware.ts`/`middleware()` — see
`CLAUDE.md` for how it's wired up. There is no `node_modules/next/dist/docs/` in this repo or
in any Next.js release; don't look for one.
<!-- END:nextjs-agent-rules -->
