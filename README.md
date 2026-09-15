# Aries — Solana Token Research

Paste a Solana mint, get a multi-agent research report: 4 analysts, bull-vs-bear
debate, risk review, final rating. Research tool, not financial advice.

Research background: "TradingAgents: Multi-Agents LLM Financial Trading Framework" (arXiv 2412.20138).

## Setup

Requires Node 18+, an OpenRouter API key (or any OpenAI-compatible LLM endpoint), and a Neon Postgres database.

```bash
npm install
```

Create `.env.local` in the repo root (see `.env.example` for all vars):

```bash
cp .env.example .env.local
```

```bash
LLM_API_URL=https://openrouter.ai/api/v1/chat/completions
LLM_API_KEY=<your-openrouter-key>
LLM_MODEL=<openrouter-model-slug, e.g. anthropic/claude-sonnet-4.5>
DATABASE_URL=<your-neon-connection-string>   # from the Neon console (neon.tech)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
CHAIN_SECRET=<random-32-chars>               # layer chain HMAC (any secret works locally)
# Hold-gate: empty = fee mode. Set mainnet $ARIES to enable.
ARIES_TOKEN_ADDRESS=                         # mainnet $ARIES, plus HOOD_MAINNET_RPC
```

Run `migrations/0001_init.sql` once against your Neon database (Neon SQL editor
or `psql "$DATABASE_URL" -f migrations/0001_init.sql`) to create the `reports`,
`events`, `usage`, and `payments` tables.

Then start the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) (landing) or
[http://localhost:3000/analyze](http://localhost:3000/analyze) (terminal),
paste a Solana mint (32-44 base58 characters), and run.

## Architecture

One run flows left to right:

```text
mint → token summary (DexScreener)
  → L1: 4 analysts in parallel: onchain | technical | sentiment | news
  → L2: bull vs bear debate (2 rounds)
  → L3: risk review (liquidity | rugpath | concentration, parallel)
  → L4: decider → final decision (RATING / CONFIDENCE / KEY RISKS / ...)
  → saved to Neon, share link /r/<id>
```

Each layer is one SSE endpoint (`POST /api/l1` … `POST /api/l4`), chained by
the browser with an HMAC chain token (`CHAIN_SECRET`) so layers cannot be
called out of order or forged — this also inherits the L1 rate limit
(10 runs/hour/IP via Upstash, fail-open without env). Every step streams
progress events plus a final `result` event. Soft budgets: L1 <90s, L2 <180s,
L3 <120s, L4 <60s — each under the Vercel Hobby 300s ceiling.

Key files: `lib/layered/` (L1-L4 flow, chain, SSE, Neon db, reducer),
`lib/agents/` (`runAnalyst` runtime + shared types), `lib/tools/`
(dexscreener, rugcheck, coingecko fetchers + analyst tool lists),
`app/api/l1-l4/route.ts`, `app/api/history/route.ts`,
`app/analyze/page.tsx` + `components/layered/` + `hooks/` (terminal UI, one
file per step), `app/page.tsx` + `components/landing/` (landing).
Old `runs/*.json` archives still render via file fallback on `/r/[id]`.

## Tests

```bash
npm test   # unit tests only (seconds, mocked LLM)
```

Live end-to-end runs against `npm run dev` manually (burns real model
tokens, ~2 minutes for BONK).

## Known Limits

- **Vercel Hobby 300s ceiling:** every layer is far under it; the browser
  chains them so total wall time can exceed it safely.
- **CoinGecko public-tier rate limits:** unauthenticated calls throttle
  (HTTP 429); fetchers degrade to error strings analysts handle honestly.
- **Reasoning-model latency:** Vercel runs use a fast model; the pro
  reasoning model stays local-only.
- **Thin data for new tokens:** low liquidity and short history make signals
  unreliable. Gaps render as MISSING with lower confidence.
- **Wallet is demo-grade:** address from localStorage, history endpoint trusts
  the query param. No signature auth — do not treat as identity.

## Vercel Deploy

1. Connect the repo (framework preset Next.js, defaults).
2. Add env vars: `LLM_API_URL`, `LLM_API_KEY`, `LLM_MODEL`,
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SITE_URL=https://<domain>`,
   `CHAIN_SECRET=<random-32-chars>`, plus `ARIES_TOKEN_ADDRESS=<mainnet-0x>`
   to enable hold-gate (empty = fee mode). Upstash vars optional (rate limit).
3. Every push rebuilds and publishes.
