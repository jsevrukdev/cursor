# Shotline — Product Requirements Document

**Working name:** Shotline  
**One-liner:** Type a 30-second story. Get a shot list, stills, voiceover, and a playable cut.  
**Context:** Hackathon demo. Build in Grok Bot (Cursor also fine). Ship a public URL on Vercel.  
**Status:** Draft for implementation  
**Last updated:** 2026-09-12

---

## 1. Problem

Creators, PMs, and founders can describe a short scene in a paragraph. They cannot cheaply turn that paragraph into something judges, clients, or teammates can *watch*.

Today that path is:

1. Write a script in a doc.
2. Break it into shots by hand.
3. Mock frames in a design tool.
4. Generate images/video in a separate playground.
5. Record or generate VO elsewhere.
6. Stitch in a timeline editor.
7. Export a file nobody can comment on live.

By the time the cut exists, the idea has already changed. The demo we want is one prompt → one living storyboard → one shareable cut.

## 2. Solution

Shotline is a single web app:

- User types a story (target length: ~15–45 seconds of finished video).
- **x.ai** turns the story into a beat sheet and a numbered shot list (camera, duration, dialogue, visual prompt).
- **Fal.ai** generates each shot’s still (and optional motion clip) plus soundtrack / VO.
- **Convex** is the source of truth: projects, shots, job status. The timeline fills in live as assets complete.
- **Wonder** is the UI: production React + Tailwind, not a mockup handoff.
- **Vercel** hosts a public URL so a judge can open the cut on a phone.

Wispr Flow is **not** in the product. It is only a personal input tool for the builder’s chat with Grok Bot / Cursor.

## 3. Who it is for

**Primary (hackathon judges / demo):** A founder or creator who can type “30 seconds of a founder walking into a café, sitting down, opening a laptop that shows a dashboard lighting up” and wants a cut in minutes.

**Secondary:** UGC / short-form planners who need a pre-viz before a shoot (storyboard + VO scratch track).

**Not for v1:** Feature-film previz, multi-user editorial, licensed stock replacement, or a full NLE.

## 4. Demo narrative (success for judging)

1. Open the Vercel URL. Empty project. Prompt box.
2. Paste a 30-second story (example in §11).
3. Hit **Board it**.
4. Within seconds, a beat sheet and 5–8 shots appear on a horizontal timeline (Wonder UI, Convex live query).
5. Shot cards flip from `queued` → `still ready` → `vo ready` → `clip ready` without a refresh.
6. User clicks a shot, edits the visual prompt, regenerates that still only.
7. **Play cut** concatenates stills (or short clips) with VO + bed. Judge hears and sees a story, not a grid of unrelated images.
8. **Share** copies a public project URL. Second device sees the same live board.

If generation is slow, the live state *is* the demo: judges watch cards fill in.

## 5. Goals and non-goals

### Goals (MVP)

- One prompt → structured shot list with durations that sum to ~30s.
- Per-shot still + spoken VO (or on-screen line) + optional motion clip.
- Live timeline that does not require polling in the client.
- Playable assembly of the current assets.
- Public share link.
- Explicit partner usage that is visible in the UI (“Powered by …” is optional; the *behavior* should make each partner obvious).

### Non-goals (v1)

- Wispr Flow / in-app dictation.
- Multiplayer presence and comments (nice-to-have only if time).
- Frame-accurate NLE (trim, transitions beyond a cut, color grade).
- Character consistency across 20+ shots (best-effort via a locked style bible; not guaranteed).
- Exa / Firecrawl research ingest (out of MVP; see stretch).
- Daytona sandboxes (no untrusted user code to run).
- Accounts beyond a shareable project id (Convex anonymous projects are fine for the hackathon).
- Mobile-native app (responsive web is required).

## 6. Partner map (what to use for what)

| Job in the product | Partner | Why |
|---|---|---|
| Editor / host for building | Grok Bot (Cursor OK) | Hackathon host. Not a runtime dependency. |
| Design / UI | Wonder | Canvas already ships as React + Tailwind. |
| Backend / state | Convex | Projects, shots, generation jobs, live timeline. Skip Postgres + sockets. |
| Script → beats → shot list | x.ai Chat (Console API) | Structured JSON shot list, rewrites, prompt expansion. |
| Optional stills / Imagine | x.ai Imagine | Alternative or A/B stills if Fal is slow. Primary stills: Fal. |
| Stills, motion, VO, music | Fal.ai | One API for image, video, audio. Queue jobs in parallel. |
| Public URL | Vercel | Git → public Vite SPA. |
| Personal idea capture (builder only) | Wispr Flow | **Exclude from product.** |

**x.ai vs Grok Bot:** Runtime calls use a Console API key (Chat / Imagine). Grok Bot is the *editor*, not the production model endpoint.

## 7. User experience

### 7.1 Screens

1. **Home / New project** — Prompt textarea, duration target (15 / 30 / 45s), aspect ratio (9:16, 16:9, 1:1), tone (UGC, cinematic, explainer). CTA: Board it.
2. **Board** — Three stacked regions:
   - **Beat sheet** (collapsed by default after first generate).
   - **Timeline** of shot cards: thumbnail, duration, status chips, VO waveform or text.
   - **Inspector** (selected shot): visual prompt, camera, dialogue, regenerate buttons, asset previews.
3. **Player** — Full-width preview. Plays assembly. Scrubber maps to shots.
4. **Share view** — Same board + player, inspector read-only unless `?edit=` token.

Wonder should produce these as real components (timeline, cards, player), not static frames.

### 7.2 Shot card states

`planning` → `queued` → `generating_still` → `still_ready` → `generating_audio` → `audio_ready` → `generating_motion` (optional) → `complete` | `failed`

Failed shots show retry. The rest of the timeline keeps playing.

### 7.3 Empty, loading, error

- Empty: one example prompt, one sample board (seed data) behind “Load demo story.”
- Loading: skeleton cards with duration placeholders from the shot list (do not wait for media to show structure).
- Error: human message (`Fal queue timeout`, `x.ai JSON parse failed`) + retry that shot or re-board.

## 8. Functional requirements

### P0 — must demo

| ID | Requirement |
|---|---|
| P0-1 | User submits story text (max 4,000 chars) + duration + aspect + tone. |
| P0-2 | System calls x.ai Chat and persists a beat sheet + 4–8 shots with `durationMs` summing to the target ±2s. |
| P0-3 | Each shot has: `title`, `action`, `camera`, `dialogue` (nullable), `visualPrompt`, `negativePrompt`, `durationMs`. |
| P0-4 | Fal generates a still per shot from `visualPrompt` + global style bible. |
| P0-5 | Fal (or x.ai TTS if easier) generates VO for shots with dialogue; otherwise a short ambient bed or silence. |
| P0-6 | Convex mutations update shot documents as URLs arrive; the board UI uses `useQuery` and updates live. |
| P0-7 | Player plays shots in order: still (Ken Burns or hold) or motion clip, with VO mixed over a looped bed. |
| P0-8 | User can regenerate one shot’s still without re-boarding the whole story. |
| P0-9 | User can edit dialogue / visual prompt and save; next regenerate uses the edit. |
| P0-10 | Shareable URL `/p/:projectId` loads the board without auth for the hackathon. |
| P0-11 | Vercel deploy of the web app. |

### P1 — should have if time

| ID | Requirement |
|---|---|
| P1-1 | Image-to-video clip per shot (2–5s) via Fal; player prefers clip over still. |
| P1-2 | Global style bible (palette, lens, era) extracted by x.ai and injected into every Fal prompt. |
| P1-3 | “Rewrite shot” via x.ai (same duration, new blocking). |
| P1-4 | Download assembly (client-side MediaRecorder or server stitch). File download is enough; no YouTube export. |
| P1-5 | Aspect-ratio switch regenerates stills, keeps shot list. |
| P1-6 | Seeded demo project so the booth works offline of a slow first generate. |

### P2 — stretch (only after P0)

| ID | Requirement |
|---|---|
| P2-1 | Paste a reference URL → Firecrawl extract → x.ai “match this look” (style only). |
| P2-2 | Exa: “find 3 films with this vibe” as mood references (links, not scraped video). |
| P2-3 | Daytona: FFmpeg concat of clips to a real MP4 when client-side assemble is too weak. |
| P2-4 | x.ai Imagine as fallback still provider if Fal errors. |
| P2-5 | Simple comments on shots (Convex). |

## 9. Generation pipeline

```
User prompt
    → Convex mutation: create project (status: planning)
    → Convex action: x.ai Chat (JSON shot list + style bible)
    → Convex mutation: insert shots (status: queued)
    → For each shot, in parallel (bounded concurrency, e.g. 3):
          Fal text-to-image → patch stillUrl
          Fal TTS / audio → patch audioUrl
          [P1] Fal image-to-video(stillUrl) → patch clipUrl
    → Project status: ready when all P0 assets exist or failed
```

**Rules**

- All Fal / x.ai calls live in Convex **actions** (`"use node"` where required). Mutations only write DB.
- Schedule **internal** functions only (`ctx.scheduler.runAfter` → `internal.*`). Never schedule public `api` functions.
- Do not use `Date.now()` inside queries to filter jobs; store `status` and `updatedAt` on write.
- Persist Fal request ids so retries do not duplicate spend blindly; show cost/latency in a debug panel for the team.
- Media URLs from Fal expire. For the demo, copy into Convex file storage when the result returns so the share link survives the weekend.

**Suggested model roles (swap to whatever is live on Fal / x.ai at hack time)**

- Shot list: x.ai Chat, JSON mode / strict schema in the prompt.
- Stills: Fal text-to-image (fast model first, e.g. Flux-class; upgrade one hero shot if time).
- Motion: Fal image-to-video, 3–5s, start frame = still.
- VO: Fal TTS from `dialogue`. If no dialogue, skip TTS.
- Music: one Fal music/ambient clip for the whole project, not per shot.
- Fallback stills: x.ai Imagine.

**Prompt contract (x.ai → app)**

Return JSON only:

```json
{
  "title": "string",
  "logline": "string",
  "styleBible": {
    "look": "string",
    "palette": "string",
    "camera": "string",
    "references": ["string"]
  },
  "beats": [{ "t": "0-5s", "summary": "string" }],
  "shots": [
    {
      "index": 1,
      "title": "string",
      "durationMs": 4000,
      "camera": "string",
      "action": "string",
      "dialogue": "string | null",
      "visualPrompt": "string",
      "negativePrompt": "string"
    }
  ]
}
```

Validate with Convex `v` validators. If parse fails, one retry with a repair prompt; then surface `failed`.

## 10. Data model (Convex)

Keep documents flat. IDs for relations. Index foreign keys.

**projects**

- `title: string`
- `sourcePrompt: string`
- `targetDurationMs: number`
- `aspect: "9:16" | "16:9" | "1:1"`
- `tone: string`
- `styleBible: { look, palette, camera, references }`
- `status: "planning" | "boarding" | "generating" | "ready" | "failed"`
- `bedAudioUrl?: string`
- `shareToken: string` (unguessable)
- `createdAt: number` (set in mutation, not in queries)

Indexes: `by_shareToken` (`shareToken`)

**shots**

- `projectId: Id<"projects">`
- `index: number`
- `title, camera, action, dialogue?, visualPrompt, negativePrompt`
- `durationMs: number`
- `status: string` (see §7.2)
- `stillStorageId?: Id<"_storage">`
- `audioStorageId?: Id<"_storage">`
- `clipStorageId?: Id<"_storage">`
- `falStillRequestId?: string`
- `error?: string`

Indexes: `by_project` (`projectId`), `by_project_and_index` (`projectId`, `index`)

**jobs** (optional but useful)

- `projectId`, `shotId?`, `kind: "board" | "still" | "audio" | "motion" | "bed"`
- `provider: "xai" | "fal"`
- `status`, `externalId?`, `error?`

Index: `by_project` (`projectId`)

Public queries return only projects matching `shareToken` / id the client already has. Do not list all projects. Hackathon may skip auth; still do not expose a global `collect()` of projects.

## 11. Example prompt (seed + booth)

> 30 seconds, 9:16, UGC. A product designer in a Berlin kitchen at 7am. She pours coffee, opens a laptop on the counter, and the screen shows a messy Figma file snapping into a clean design system. She looks at the camera, slightly unimpressed, and says: “That used to take my whole Monday.” Cut to the same screen, now a customer dashboard with one big green ‘shipped’ badge. Soft morning light, handheld, no logo until the last second.

Expected board: 6 shots, one line of VO, a still-to-motion hero on the laptop screen, hold on the badge.

## 12. UX copy (product, not marketing site)

- CTA: **Board it**
- Player: **Play cut**
- Per shot: **Regen still** / **Regen VO** / **Rewrite**
- Share: **Copy link**
- Fail: **This shot failed. Retry still.** (never “Something went wrong.”)

## 13. Technical architecture

```
Wonder (React + Tailwind)
  → ConvexClientProvider
      queries: getProject, listShots
      mutations: createProject, updateShotCopy, retryShot
      actions: boardStory, generateShotAssets
Vercel
  → static Vite SPA for the frontend
Convex cloud
  → DB + file storage + scheduled internal retries
x.ai Console API
Fal.ai queue (subscribe / webhook)
```

**Auth:** none required for MVP. Unpredictable `projectId` + optional `shareToken`. If Convex auth is already wired, keep projects per user *and* still allow token share.

**Env:** `CONVEX_*`, `XAI_API_KEY`, `FAL_KEY`. Never expose keys to the client. For cloud agents, `CONVEX_AGENT_MODE=anonymous` during *development* so `npx convex dev` does not collide with a personal deployment. Production is Vercel + Convex prod (`npx convex deploy` only as part of the Vercel build, via `CONVEX_DEPLOY_KEY`).

**ESLint:** `@convex-dev/eslint-plugin`. Args + returns validators on every public function. Await all Convex writes and schedulers.

## 14. Player spec (P0)

Hackathon-quality, not Premiere:

- HTML `<video>` if `clipUrl` exists; else `<img>` with CSS Ken Burns (slow scale 1.0 → 1.06).
- Web Audio or `<audio>` for VO; duck the bed ~8 dB while VO plays.
- Cut on shot boundaries only (hard cut).
- Preload next shot still.
- If a shot is not `still_ready`, skip it in playback and show a toast: “Skipped 1 generating shot.”

P2/Daytona: server FFmpeg concat to `assembly.mp4` stored on Convex.

## 15. Success metrics (hackathon)

**Must hit**

- Time from submit to *visible shot list*: < 15s.
- Time to *first still on timeline*: < 45s under normal Fal load.
- A judge can understand the story from Play cut with no narration from the team.
- At least 3 partners are load-bearing (Convex live board, Fal media, x.ai structure, Wonder UI, Vercel URL).

**Nice**

- One regenerated shot visibly replaces its thumbnail without a full page reload.
- Share link opened on a second device updates when a clip finishes.

## 16. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Fal queue too slow for a 3-minute pitch | Seed demo project; generate stills first; motion is P1; show live statuses as the feature. |
| x.ai returns invalid JSON | Strict schema + repair retry + fallback template shot list from the raw prompt. |
| Character / kitchen drift across shots | Style bible + repeat locked phrases in every `visualPrompt` (“same woman, same kitchen, morning light”). |
| Fal media URLs expire | Copy to Convex storage immediately. |
| Assembly looks like a slideshow | Ken Burns + VO + one motion hero shot is enough; do not wait for all clips. |
| Scope creep (research, multiplayer, NLE) | P0 list is the contract. Stretch only after Play cut works. |
| Accidental production Convex deploy | `npx convex dev` only while building. |

## 17. Build order

1. Convex schema + `createProject` / `listShots` / dummy shots (no AI). Wonder timeline bound to Convex. Vercel hello-world.
2. x.ai `boardStory` → real shot documents. Inspector edits.
3. Fal stills + Convex storage + live status chips.
4. VO + bed + Play cut.
5. Share route. Seed demo story.
6. P1: motion clips, rewrite, download.
7. Polish copy, empty/error states, partner labels in a footer.

Do not start P2 until a stranger can play a cut.

## 18. Open questions (decide in the first hour)

1. Default aspect: 9:16 (TikTok/Reels judges on phones) vs 16:9 (stage projector). **Recommendation:** 9:16 default, 16:9 toggle.
2. VO voice: one global voice vs per-character. **Recommendation:** one voice for v1.
3. Watermark / partner badges: required by hackathon rules? Add a footer if yes.
4. Content policy: block violent / sexual prompts in the action before calling Fal.

## 19. Appendix — out of product

- **Wispr Flow:** builder dictation into Grok Bot / Cursor only. No microphone button in Shotline.
- **Grok Bot:** development host, not the deployed inference path.
- **Cursor $20 / $50 credits:** claim at check-in; irrelevant to runtime.
