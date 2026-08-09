---
name: figma-atlas
description: >
  Maintain the Sub Timer UI Atlas in Figma — re-shoot screenshots after a visual
  change, add a new screen, keep the board aligned (sections A–J, frame order,
  legend), and keep the prototype walkthroughs wired. Use whenever the ask is
  "re-shoot the atlas", "update the figma atlas", "add this screen to the
  atlas", "align the board", "fix the prototype links", or after any merged UI
  change that alters what a captured screen looks like.
---

# Figma UI Atlas — maintenance skill

The atlas is the owner's review surface: every app screen at three sizes,
screenshot fills on stable Figma frames, walkable in Present mode. This skill
is the single source of truth for its structure and upkeep.

**Figma file:** `qh2yjSJ10gSWBrpb4120qb` · single page `0:1`.

**Cardinal rule: swap fills, never re-place frames.** Frames keep their
nodeIds, positions, pinned comments, and prototype wiring. A re-shoot only
replaces each frame's image fill. Only a genuinely NEW screen gets a frame
placed once — then it joins the maps below forever.

## Board constitution

Sections lettered A–J in reading order, grouped by device size, all at x=0:

| § | Content | nodeId | y | height |
|---|---|---|---|---|
| — | ELEMENTS (control families) | `7:9` | -1550 | 900 |
| — | Board legend (text node `1:20`) | `1:18` | 0 (x=-1108) | 686 |
| A | PLAY phone | `1:16` | 0 | 940 |
| B | PLAN phone | `1:15` | 1050 | 940 |
| C | DRAWERS phone | `1:17` | 2100 | 940 |
| D | SETUP STEPS + SETTINGS phone | `58:33` | 3150 | 940 |
| E | PLAY iPad | `3:16` | 4300 | 1160 |
| F | PLAN iPad | `3:15` | 5600 | 1160 |
| G | DRAWERS iPad | `3:17` | 6900 | 1160 |
| H | PLAY web | `5:16` | 8200 | 940 |
| I | PLAN web | `5:15` | 9200 | 940 |
| J | DRAWERS web | `5:17` | 10200 | 940 |
| L | SETUP STEPS + SETTINGS iPad | `78:3` | 12300 | 1160 |

(K is reserved for temporary proposal sections — currently the nav-strategy
mocks at y=11250; L sits below it and moves up into the grid when K dies.)

Frames inside a section sit at y=70, x=60 + n·pitch — pitch 435 (phone),
830 (iPad), 1345 (web) — **in ascending state-number order left to right**.

## State → nodeId swap map

State numbers are the shoot-journey states (see `shoot-atlas.mjs` beside this
file). Phone and iPad shoot all 17; web shoots 01–13 (no announce, no setup
pages).

| State | Screen | phone | iPad | web |
|---|---|---|---|---|
| 01 | Landing (first run) | `1:2` | `3:2` | `5:2` |
| 02 | Sport picker | `1:3` | `3:3` | `5:3` |
| 03 | Format picker | `1:4` | `3:4` | `5:4` |
| 04 | Team editor | `1:5` | `3:5` | `5:5` |
| 05 | Home — My Teams | `1:6` | `3:6` | `5:6` |
| 06 | Squad select | `1:7` | `3:7` | `5:7` |
| 07 | Live game | `1:8` | `3:8` | `5:8` |
| 08 | Plan page | `1:9` | `3:9` | `5:9` |
| 09 | Plan drawer | `1:10` | `3:10` | `5:10` |
| 10 | Game drawer | `1:11` | `3:11` | `5:11` |
| 11 | Summary | `1:12` | `3:12` | `5:12` |
| 12 | Match history | `1:13` | `3:13` | `5:13` |
| 13 | Home drawer | `1:14` | `3:14` | `5:14` |
| 14 | Announce view | `39:30` | `78:2` | — |
| 15 | Keeper page | `58:30` | `78:4` | — |
| 16 | Shape page | `58:31` | `78:5` | — |
| 17 | Team settings | `58:32` | `78:6` | — |

## Prototype walkthroughs

Three flows (page `flowStartingPoints`): **Phone walkthrough** starts `1:6`,
**iPad walkthrough** `3:6`, **Web walkthrough** `5:6`. Each frame carries one
ON_CLICK → NAVIGATE reaction (instant transition), chained in board reading
order (Play row → Plan row → Drawers row → phone-only Setup row):

- phone: `1:6→1:7→1:8→1:12→39:30→1:2→1:3→1:4→1:5→1:9→1:13→1:10→1:11→1:14→58:30→58:31→58:32`
- iPad: `3:6→3:7→3:8→3:12→78:2→3:2→3:3→3:4→3:5→3:9→3:13→3:10→3:11→3:14→78:4→78:5→78:6`
- web: `5:6→5:7→5:8→5:12→5:2→5:3→5:4→5:5→5:9→5:13→5:10→5:11→5:14`

Reactions live on the frames, so fill swaps never disturb them.

## Workflow 1 — re-shoot after a visual change

1. `node .claude/skills/figma-atlas/shoot-atlas.mjs` — shoots all three
   viewports at deviceScaleFactor 2 into `atlas-shots/` (gitignored output;
   run from repo root). Writes `manifest.json` mapping file → state.
2. For each shot: call the Figma MCP `upload_assets(fileKey, nodeId)` (count
   must be 1 when nodeId is given) → POST the PNG multipart to the returned
   `submitUrl` (`curl -F "file=@NN.png;type=image/png"`). URLs are single-use
   with ~10-min expiry — upload promptly, one at a time.
3. Update the legend (`1:20`): bump the "captured from the vX.Y.Z build" text
   and the "All frames re-shot at …" line. Single Inter Regular 15 segment —
   `loadFontAsync({family:'Inter',style:'Regular'})` then replace
   `characters` wholesale is safe while it stays one segment.
4. Verify with `get_screenshot` on one section per size (e.g. `1:16`, `3:16`,
   `5:16`).

Partial re-shoots are fine: only swap the frames whose screens changed.

## Workflow 2 — add a new screen

1. Add a shoot state to `shoot-atlas.mjs` (next number; drive with real app
   functions — verify names in `index.html` first, mirror
   `test/screen-audit.mjs`).
2. Place the frame ONCE in the correct section, keeping ascending state order
   and the section's pitch; extend the section width if the row is full.
3. Add the nodeId to the swap map table above (edit this file).
4. Splice the frame into that size's prototype chain (rewire the neighbour's
   reaction, add the new frame's own) and update the chain listing above.
5. Update the legend's section notes if a new section was created; new
   sections continue the A–J lettering and the y-grid (940/1160 heights,
   ~110–210 gaps, 1050/1300/1000 group pitch).

## Workflow 3 — alignment audit

Run when the board looks drifted. Check, in order:

1. Section names/letters match the constitution table (no duplicates, reading
   order top to bottom).
2. Section y-positions match the table.
3. Frames within each section ascend by state number left to right.
4. Every frame's ON_CLICK reaction resolves to the next frame in its chain;
   three flowStartingPoints exist.
5. Legend version text matches the app version the fills were shot from.

Fix by renaming/moving sections and swapping frame x-positions — never by
recreating frames.

## Conventions

- All writes go through the Figma MCP `use_figma` (load the `figma-use` skill
  first). Work in ≤10 mutations per call; read back after each step.
- **One-off / mock shots** (proposal frames, DOM-tweaked states): bootstrap +
  act in ONE `page.evaluate` (the LESSONS.md cross-evaluate hazard), and
  `document.getElementById('launchSplash')?.remove()` before any capture in
  the first ~2s — the boot splash fades on a 1.6s CSS timer and photobombs
  early screenshots. Proposal frames live in their own clearly-labeled
  section (never the swap map) and are deleted once stamped or rejected.
- The companion project memory `figma-atlas-reshoot` mirrors the nodeId maps —
  keep it pointing at this skill rather than duplicating detail.
- Atlas updates are logged in `SESSION-LOG.md` session entries, not here.
