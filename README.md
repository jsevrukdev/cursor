# Shotline

Type a 30-second story. Get a shot list, stills, voiceover, and a playable cut.

Product requirements: [docs/PRD.md](docs/PRD.md)

## Run locally

```bash
npm install
npx convex dev
```

In another terminal:

```bash
npm run dev
```

`npx convex dev` writes `VITE_CONVEX_URL` into `.env.local`. For cloud agents use `CONVEX_AGENT_MODE=anonymous npx convex dev`.

Optional Convex dashboard env vars (never commit them):

- `XAI_API_KEY` — Chat shot lists (falls back to a local boarder)
- `XAI_MODEL` — defaults to `grok-4-fast-non-reasoning`
- `FAL_KEY` — Flux stills + Kokoro TTS (falls back to SVG stills)

## Scripts

- `npm run dev` — Vite
- `npm run test` — boarder + content-policy tests
- `npm run build` — production frontend
- `npm run lint` / `npm run typecheck`

## Render

Static site: build `npm ci && npm run build`, publish `dist`. Set `VITE_CONVEX_URL` at build time. SPA rewrite: `/*` → `/index.html`.
