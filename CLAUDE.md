# Sub Timer — session startup context

Single-file PWA: the entire app (HTML + CSS + JS, ~7.5k lines) lives in
**`index.html`**. No build step. Deployed to Vercel at https://sub-timer.vercel.app.

## Read first, in this order
1. **`SESSION-LOG.md`** — git-native persistent memory: current state, backlog,
   owner decisions, what the next session should pick up. Newest entry on top.
2. **`design.md` §5.0** — the Team settings page is THE BENCHMARK every screen
   is measured against (two colours, three surfaces, solid-fill selection, flat
   controls). ui-check enforces it in CI; don't reintroduce ticks/gradients/shadows.
3. **`architecture.md`** — screen map (`.scr` ids: home, s1 squad, s3 lineup,
   s4 live game, subOrderOv sub plan…), where state lives.
4. **`PROCESS.md`** — the Map→Gate→Hunt method. Intent lives in
   `docs/UX-PATHWAYS.md` (the oracle); actual wiring in `docs/UIMAP.md`
   (generated); coverage in `FEATURES.md`.

## Running the app
- Two launch configs in `.claude/launch.json` (use preview_start, never Bash):
  **"sub-timer (real app)"** → app at `http://localhost:8001`;
  **"dev gallery"** → one step, `gallery-server.py` serves the gallery at
  `http://localhost:8002/` directly.
- **Dev gallery** — 16 live tiles
  (each tile IS the real app, driven to a screen), grouped by UX flow, plus a
  live elements strip rendered by the app's own CSS. `?app=<file>.html` loads an
  alternate build (e.g. `palette-mock.html` from `node build-palette-mock.mjs`).

## Tests / gate
- `npm run gate` = the full merge gate (sanity, smoke, sports, edge, docs,
  design, privacy, flow, replay, a11y, ui — see `package.json`).
- Quick checks: `npm run sanity`, `npm run smoke`, `npm run ui`.
- The `smoke-tester` agent runs the harness + debugs failures.

## Versioning & shipping (see DEPLOY.md — read before editing)
- **One version per owner decision**: bump `v2.x.y-beta` in index.html, log in
  `CHANGELOG.md`, evidence in `docs/records/<version>-<topic>/`.
- `main` is protected — everything lands by PR with the `smoke` check green.
  Deployed `main` is the source of truth; **sync before editing**
  (`deploy-guard.sh`). Work on `dev` or `feature/*`.
- The owner (Sean) stamps design decisions; proposals stay unstamped until then.

## After UI changes
- Re-shoot affected Figma atlas frames — use the **figma-atlas** skill
  (swap fills by nodeId, never re-place; procedure in auto-memory).
