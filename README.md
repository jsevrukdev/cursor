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

## Host on Vercel

The frontend is a Vite SPA. `vercel.json` builds `dist/` and rewrites `/p/:id` to `index.html`.

```bash
npx vercel --prod
```

In the Vercel project, set:

| Name | Environment | Purpose |
|---|---|---|
| `CONVEX_DEPLOY_KEY` | Production | Production deploy key from the Convex dashboard (needs `deployment:deploy`) |
| `CONVEX_DEPLOY_KEY` | Preview | Separate **preview** deploy key (do not reuse prod) |

The build command is `bash scripts/vercel-build.sh`. When the deploy key is present it runs:

```bash
npx convex deploy --cmd "npm run build" --cmd-url-env-var-name VITE_CONVEX_URL
```

That pushes Convex functions and bakes `VITE_CONVEX_URL` into the client. Also set `XAI_API_KEY` and `FAL_KEY` on the **Convex** deployment, not in Vercel.

A claimable deploy without a Convex key (`npx vercel deploy --temporary`) publishes the UI only; Board it needs a cloud Convex URL.

## Render (optional)

`render.yaml` remains if you prefer Render: static `dist`, `VITE_CONVEX_URL` at build time, SPA rewrite to `/index.html`.
