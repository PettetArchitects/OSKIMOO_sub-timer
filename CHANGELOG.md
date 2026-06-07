# Sub Timer — Changelog

All notable changes to the app, by version. The in-app "What's New" modal pulls the same data from `CHANGELOG_DATA` in `sub-timer.html`.

---

## v2.7.95-beta — Fix: 2nd-half subs now fire when the Plan says they will

- 🔧 **Sub schedule bug.** The live sub timer (`subTs`) ran a *continuous whole-game* schedule while the Plan page (`renderSubPlan`), the Settings preview (`updPrev`) and the Full-Control auto plan (`generateAutoPlan`) used a *per-half* one. When the sub frequency didn't divide evenly into the half length (e.g. 7-minute subs in a 20-minute half), the 2nd-half subs fired at **shifted times** — so the actual swaps, the playing-time balance, the "next sub" countdown and the printed plan all disagreed. This surfaced as wrong 2nd-half timing, uneven minutes, a desynced countdown, and subs "firing wrong."
- ✅ **Fix.** The game now uses one **per-half cadence** everywhere: rolling subs restart every `cfg.sf` minutes at the top of each half, exactly as shown in Settings and on the Plan page. `generateAutoPlan` was aligned to the same cadence so planned 2nd-half events land on the minutes the live game checks. No behaviour change when the frequency already divides evenly (e.g. the default 5-min subs in a 20-min half).
- 🧪 Added a smoke regression check (`hm=20, sf=7`) asserting both halves return the same per-half sub times.

---

## v2.2.0-beta — 3D pitch for soccer & netball too

- ⚽ **Soccer** and 🥅 **netball** now use the same real 3D playing surface as AFL — drag to rotate, pinch to zoom, tap a player. Same Behind / Side / Top presets, lock toggle, and auto-zoom-to-fit.
- ⚽ **Soccer pitch** renders the full kit: touch/goal lines, halfway line, centre circle + spot, penalty boxes, 6-yard boxes, penalty arcs (the "D"), corner arcs, and goal frames (posts + crossbar) at each end.
- 🥅 **Netball court** renders the thirds (two transverse lines), centre circle, both goal-circle semicircles, and a standing goal post with ring at each goal line.

### Architecture notes
- `afl3d` generalised into a sport-aware viewer. New `DIMS` map (`afl` oval 135×165, `soccer` rect 104×160, `netball` rect 76.5×153, each with a `goalH`); `setSport(key)` swaps `FIELD_W/L`, rebuilds the ground group in place (no renderer teardown), regenerates fit points, and re-runs `setView`. `buildGround()` dispatches to `_buildAfl` / `_buildSoccer` / `_buildNetball`; shared helpers `_grass(oval)`, `_post`, `_bar`. `_buildFitPts()` samples an ellipse ring (AFL) or rectangle perimeter (soccer/netball) plus goal-height points so `autoFit` frames any surface. `update(container, buildPill, sport)` sets dims before a fresh `init` and calls `setSport` on a switch. `renderRoster` routes all three sports to the 3D viewer when `afl3d.ready()` and passes the sport key; the 2D pitch remains the fallback when Three.js is unavailable.

---

## v2.1.0-beta — AFL oval is now a real 3D model

- 🏉 **True 3D AFL ground** built with Three.js (WebGL). Drag to rotate, pinch to zoom, tap a player exactly like before. The oval, goal posts, centre square, centre circles and 50m arcs all render in real 3D space.
- 🎥 **Three locked camera presets** — **Behind** the goals (default), **Side** on, and **Top** down. One tap each; the active preset is highlighted until you drag away.
- 🔒 **Lock toggle** (🔓/🔒) freezes the camera so you can't nudge it mid-game.
- 🧩 Players are HTML pills projected over the 3D canvas, so they stay upright, readable and tappable at any angle. The pitch lives in its own isolated zone — no clipping over the rest of the UI.

### Architecture notes
- New `afl3d` object owns a `THREE.WebGLRenderer` + `OrbitControls` (rotate/zoom, `enablePan:false`, damping, `minDistance 130`/`maxDistance 520`, polar clamp `0.04–1.46`). `buildGround()` draws the oval (filled `ShapeGeometry` ellipse + boundary `LineLoop`), centre square 50×50, centre circles r5/r1.5, 50m arcs, goal squares and 4 standing posts per end. `worldOf(px,py,h)` maps formation %→world (`FIELD_W 135 × FIELD_L 165`). `projectPills()` runs each rAF frame: `worldOf(...).project(camera)` → overlay `left/top`. `setView(name)` hard-resets the orbit frame (`camera.up=(0,1,0)` + `lookAt`) so presets never end up rotated; the `top` preset is nudged off the exact zenith (`z=55`) to keep the length axis vertical (no gimbal flip). `controls 'start'` clears the preset highlight. `afl3d.update(container, buildPill)` re-inits if the canvas was wiped and resizes the renderer to the settled zone each `renderG`. Falls back to the 2D AFL views (`v2.0.4–2.0.9`) when Three.js is unavailable.
- `renderRoster` routes AFL teams to the 3D viewer when `afl3d.ready()`; `renderG` hides the old 2D view/tilt controls (`#aflViewBtn`/`#aflTiltCtrl`) when 3D is active.

---

## v2.0.5-beta — AFL scoring (goals & behinds)

- 🏉 **Proper AFL scoring** — the score header is sport-aware. AFL teams get separate **GOAL (6)** and **BEHIND (1)** buttons per side; score shows the footy way **goals.behinds (total)** — e.g. `5.3 (33)`. **−** undoes the last score. Goals fire the scorer + assist picker; behinds don't. Match log + full-time summary distinguish goals from behinds. Soccer/netball keep the simple −/＋ tally.

### Architecture notes
- `G.glUs/bhUs/glThem/bhThem` track goals/behinds; `G.scoreUs/scoreThem` stay point totals (cloud save/history unchanged). `renderScore()` renders the score area per-sport from `renderG`. `aflScore(who,type)` logs `{type:'goal', afl:'goal'|'behind'}`; `aflUndo(who)` reverses the last.

---

## v2.0.4-beta — AFL isometric oval + tidy-ups

- 🏉 AFL oval shown in **portrait isometric** (foreshortened tilted-ground look, cabinet projection — no egg), 18 players spaced cleanly with no overlap, smaller AFL tokens.
- 🔢 Period call-out (Q1 / 1ST HALF / HALFTIME) moved to the **left of the score**.
- 🧹 **Opponent-shape overlay removed** (parked until it's properly tested/useful).
- ⏸️ Youngest AFL grades (Auskick/U9/U10) default to **subs-at-breaks**; toggle hint is now sport-aware.

### Architecture notes
- `.lu-pitch.np-afl` aspect `135/118` (length foreshortened ≈ ×0.72) does the uniform cabinet squash; `aflProject` identity, top-down SVG, %-tokens squash with the box. AFL formations portrait (length=y). Opp-marker block + `#oppFmtLbl`/`#oppFmtPicker` removed.

---

## v2.0.3-beta — Subs at breaks only (netball rule)

Requested by a netball coach: many netball comps only allow substitutions at the quarter/half breaks, not rolling mid-play.

- ⏸️ **"Subs at breaks only"** toggle in Edit Team → Game Settings. When on, there are **no rolling mid-play subs** — the game screen shows "Subs at quarter break" instead of a countdown, and the recommended rotation is applied when you tap Start (next period). **Default ON for netball**, off for soccer/AFL.
- The manual **SUB** and **Injury** buttons still work mid-play (for injuries etc.) — only the automatic prompts are suppressed.
- The squad-screen equal-time helper adapts: in breaks-only mode it says "rotate at each break for fair time" instead of suggesting an interval.

### Architecture notes
- `team.prefs.breaksOnly` (seeded `true` for netball in `getTeamPrefs`), loaded into `cfg.breaksOnly` in `selectTeam`. Toggle rendered in `renderEditTeamPrefs()`.
- `tickLoop` skips the auto-sub trigger and the clock warn/alert colouring when `cfg.breaksOnly`. `renderG()` shows a "Subs at the break" line. Break rotation is handled by the existing `advH()` (applies the recommended swap at the period boundary for fair/paired).

---

## v2.0.2-beta — Equal game-time helper

Inspired by the grassroots rule of thumb ("divide the total game time by the number of players and sub that often" — Just Play's substitutions guide).

- ⚖️ **Equal game-time suggestion** on the squad screen — once you've marked who's here, it calculates the sub interval that shares minutes evenly across the squad that turned up, and shows it with a one-tap **"USE"** button. Recalculates live as you toggle availability.
- ⏱️ **Projected minutes per player** ("~X min each over Y min") so a coach can see the fair-play split before kickoff.

### Architecture notes
- `renderEqualTimeHint(n, onField)` in `renderS1()`: `totalGame = cfg.hm × periodCount`; `suggested = round(totalGame × cfg.sc / n)` (matches the guide's example: 6 players, 36 min → 6 min); `perPlayer = round(onField × totalGame / n)`. Shown only when `n > onField` (i.e. there are subs). `applyEqualTime(i)` sets `cfg.sf` for this match (per-game, not a saved team pref). Confirms with a ✓ once the interval matches.

---

## v2.0.1-beta — Sample squad + AFL isometric pitch

- 👥 **Fill a sample squad** — a button in the team editor drops in a generic roster sized to the format (on-field + ~30% bench) with names, jersey numbers and a spread of position tags, so a brand-new team can start a game and try the app immediately. Won't overwrite real players (tops up to a playable count); names a still-unnamed team automatically.
- 🏉 **AFL oval is now isometric** — rendered as a foreshortened (tilted-back) ground rather than flat top-down, matching the cabinet-projection look from the design prototype. Achieved by foreshortening the oval's box vertically (`.lu-pitch.np-afl` aspect 135/140 ≈ 165 m length × sin 58°) — a uniform squash (no "egg"); markings and %-positioned tokens foreshorten together while shirts stay upright.

### Architecture notes
- `fillSampleSquad()` + `SAMPLE_NAMES`; button `#sampleSquadBtn` under the photo-import in the team editor. Appends unique generic players (with `numbers` + cycled non-GK `positions`) up to `onField + round(onField*0.3)`.
- AFL pitch kept top-down in `aflPitchSvg()`; the isometric foreshortening is the box aspect-ratio (135/140) so tokens (positioned by %) and SVG markings (preserveAspectRatio=none) squash uniformly — same visual result as the prototype's cabinet projection, far simpler than baking the tilt into every coordinate.

---

## v2.0-beta — AFL mode

Australian Rules Football is now a third sport, alongside Soccer and Netball. Shipped but unannounced.

- 🏉 **AFL sport** — pick it from New Team. Age formats from **Auskick → Senior** (Auskick 6, U9–U10 12, U11–U12 15, U13+ & Senior 18 a-side).
- 🟢 **Oval pitch** — proper Aussie-rules oval with centre square, centre circles, **50m arcs**, goal squares and goal/behind posts. Rendered top-down with the real 135×165 m field proportions (adapted from the cabinet-projection geometry — no "egg"). No GK.
- 🕐 **4 quarters** reuse the netball period engine, with the new **inline break** showing Quarter / Half / Three-Quarter Time.
- ♻️ Everything else is sport-agnostic and works as-is: sub strategies, set-line-up-on-the-pitch, injury subs, undo, team-level Game Settings, jersey numbers, cloud sync, match history.
- 🏐 Custom **Sherrin** ball icon for the sport picker / team cards.

### Architecture notes
- `SPORTS.afl` (periodCount 4, quarter labels, simplified position tags, `formats`). `FORMATS['afl-*']` (10 presets, `hasGk:false`). `FORMATIONS` gets shared 6/12/15/18-player oval layouts (`AFL_F6/F12/F15/F18`).
- `aflPitchSvg()` builds the oval + markings in a 100×100 viewBox (TILT=90 → identity projection, portrait/`DEPTH_AXIS='x'`); `.lu-pitch.np-afl` carries the 135/165 aspect so the unit circle displays as a correct oval and metre-squares stay square.
- `renderRoster()` branches: `_topDown = netball || afl` → tokens use raw x/y% (no `pitchPt` perspective, no plane), skips the dims read. `adjustY()` returns identity for AFL. Formation button hidden for AFL (single formation per format).
- **Known gaps (follow-ups):** scoring is still a single counter (no goals/behinds split yet); senior 75-rotation cap not implemented; only the default formation per age format. See `AFL-MODE-SPEC.md` §7–8.

---

## v1.11.3-beta — Formation button

- 🧩 **Formation moved into the bottom control bar** — it's now a button showing the current shape (e.g. "2-3-1") next to START / SUB, big and easy to hit. Tapping opens the formation picker just above the bar. Removed the small formation pill from the chrome row. Hidden for netball (fixed positions).

### Architecture notes
- New `#gdFormation` button in `#gameDash` (→ `toggleGameFormation()`); `renderGameDash()` paints it with `curFormation` + a `layout-grid` icon and an `active` state while the picker is open. `#gameFmtPicker` relocated to just above the control bar. `renderG()` no longer touches `#fmtLbl`/`#fmtVs` (removed from the chrome row).

---

## v1.11.2-beta — 2nd-half line-up ready

- 🔄 **Line-up ready at the break** — when the period ends, the recommended rotation is applied automatically so the pitch already shows your **2nd-half starting line-up**. Tap **Start 2nd Half** and go.
- ✋ Tweak it during the break with **Swap**, or **Undo** to revert the auto-rotation.
- Applies to **Equal time** and **Paired rotation** (the auto-rotating strategies). **Manual** and **Full control** leave the break subs entirely to the coach.

### Architecture notes
- `advH()` calls `trigSub()` then `confSub()` for `fair`/`paired` when the bench is non-empty, applying one recommended rotation before showing the break state. The sub is `G.lastSub` (undoable during the break); `startNextPeriod()` then clears it at the boundary as before.

---

## v1.11.1-beta — Inline halftime

- ⏸️ **No more halftime popup** — at the end of a period the game screen itself switches to a break state: the period label reads **HALF TIME** (or QUARTER/THREE-QUARTER TIME for netball), the clock goes amber, and the primary button becomes **Start 2nd Half** (one tap to begin).
- 🔁 **Prep during the break** — swap or sub right on the pitch before starting the next period; changes carry into the new half.
- 🥅 **Keeper at the break** is just a normal Swap (tap the GK) — the separate halftime keeper picker is gone.

### Architecture notes
- `advH()` now sets `G.atBreak=true` + re-renders (was: populate + show `#htOv`). `renderG()` has a break branch (clock label, amber clock, "Start 2nd Half" button, hint in `#nsi`). `startNextPeriod()` logs `period_end`, increments `G.half`, resets, clears `atBreak` and starts the clock. `tog()` delegates to it when `G.atBreak`.
- Removed the `#htOv` overlay and `confHT()` / `renderHtMsg()` / `updateHtGk()`. No automatic halftime GK swap — keeper continues unless swapped on the pitch. (`gk2` still exists for the optional per-game options screen + the Full-control plan simulation.)

---

## v1.11-beta — Straight to the pitch

The pre-game flow used to be: squad → a big settings screen → game. Most of those settings rarely change, so they're now **team-level preferences** and the settings screen is no longer a required step.

- ⚡ **Faster start** — tap **Start** → pick who's here → **Start Game** drops you straight onto the pitch, using the team's saved settings.
- 🎛️ **Game Settings live on the team** — formation, sub strategy, half/quarter length, sub interval and players-per-sub are now edited under **Edit Team → Game Settings** and remembered for every game.
- 🗓️ **Per-game override** — a **"Game options for today"** link on the squad screen still opens the full settings screen (incl. the Full-control game plan / photo import) when you need to change something just for one match.
- ✏️ **Mid-game** — the dashboard **Edit Team** button (was "Edit Players") opens the same editor, so you can adjust settings without leaving the game.

### Architecture notes
- `team.prefs = { formation, subStrategy, hm, sf, sc }`, lazily seeded from the format defaults via `getTeamPrefs(team)`. Rendered/edited by `renderEditTeamPrefs()` in the team editor; persisted with the team via `saveAndBack()` (localStorage + cloud).
- `selectTeam()` loads `team.prefs` into the live `cfg` + `curFormation` (falling back to `FORMATS[fmt]` defaults), so the fast path needs no settings screen.
- New `startFromSquad()` (squad screen primary button) sets `avail` and calls `quickStart()` → `smartAssign()` → `startGame()`. `goSettings()` (s2) kept intact as the optional per-game override.
- `planned` strategy with no plan still falls back to Equal-time logic at runtime; use "Game options for today" to build/snap a plan for a specific match.

---

## v1.10.3-beta — Settings page

- ⚙️ **Settings page** — added a gear button (top-right of the home header) that opens an app **Settings** overlay. The **sub-alert sound** picker now lives here instead of as a pill on the game screen, since it's an app-level preference you set once, not something to change mid-game.
- 🧹 One less pill in the in-game chrome row.

### Architecture notes
- Removed `#soundPackLbl` from `#fmtRow` (`renderSoundPicker()` already guards `if(lbl)` so the missing element is fine). Repurposed the `#soundOv` overlay into a titled "Settings" page with a "Sub-alert sound" section. `openSettings()` (home gear) → `openSoundPicker()` renders the grid and shows the overlay.

---

## v1.10.2-beta — Tidier game screen

- 🧩 **One combined chrome row** — the formation, opponent, sub-strategy and sound pills now sit in the **same row as the tap-tip**, in a single band just above the bench (`#modeHint` is now an inline tinted chip inside `#fmtRow`).
- ⬆️ **Pills cleared off the top** — the top of the screen is now just the score + clock + "next sub", so the pitch gets more vertical room. Formation pickers open below the pill row, above the bench.
- ✂️ **Shorter tap-tip** — "Tap two to swap (incl. keeper)".

### Architecture notes
- `#fmtRow` (+ `#gameFmtPicker` / `#oppFmtPicker`) moved from below the clock to between `#pitchMid` and `#benchTop`. `#modeHint` is now a `<span>` child of `#fmtRow`; `renderRoster()` writes the tip into it as an inline chip (was a full-width banner). Render order still populates bench + hint before reading pitch dims.

---

## v1.10.1-beta — Assists + bench placement

- 🅰️ **Assists on goals** — tagging a goal is now a two-step picker: who scored, then who assisted (or "No assist"). The assist list is **on-field players only** (a benched player can't set up a goal) with the scorer excluded; the step is skipped automatically if no one else is on the field. Assists show in both the live timeline and the saved match-history log (`X scored · assist Y`).
- 🪑 **Bench moved above the control bar** — the subs-coming-on strip now sits just above the bottom buttons instead of at the very top, so it no longer overlaps the pitch / forward line. Game-screen order is now: header → clock → formation → **pitch** → mode hint → **bench** → sub banner → bottom bar.

### Architecture notes
- Goal picker: `_goalStep` ('scorer'|'assist') + `_goalScorer` drive `renderGoalPicker()`, which repaints the shared `#scorerOv` grid per step. `chooseScorer()` records `log[idx].scorer` then advances to the assist step; `chooseAssist()` records `log[idx].assist`. `skipGoalStep()`/`closeGoalPicker()` reset state. `skipScorer()` kept as a back-compat alias.
- Both log renderers append `· assist <name>` when `e.assist` is set on a `who==='us'` goal.
- `#benchTop` relocated in the DOM below `#pitchMid`/`#modeHint`. `renderRoster()` still populates bench + hint before reading the pitch dimensions (they remain flex-shrink:0 siblings), so token projection is unaffected.

---

## v1.10-beta — Thumb-zone game screen

A layout overhaul for two-handed iPad use: controls drop to the thumb zone, the subs-coming-on move up top.

- 🎮 **All controls in one bottom bar** — `START · SUB · Swap · Injury · Edit Players · Undo` in a single row at the bottom of the game screen, where thumbs naturally rest. START + SUB are colour-emphasised (green / amber) and slightly wider so the primary actions stand out from the soft-UI secondary buttons.
- ⬆️ **Subs coming on moved to the top** — the bench (next-on / wave grid) now sits above the pitch so the players coming on are glanceable at the top of the screen.
- ⚽ **Pitch fills the middle** — flexes to whatever vertical space is left between the top strip and the bottom bar; aspect-correct in both portrait and landscape, no clipping.
- 🧹 **Removed the duplicate Undo** — the in-bench "UNDO LAST SUB" pill is gone; Undo now lives only in the bottom bar.

### Architecture notes
- Game screen (`#s4`) is now: header (score) → clock → formation row → `#benchTop` (flex-shrink:0, subs at top) → `#pitchMid` (flex:1, pitch) → `#modeHint` → `#subBanner` → `#gameDash` (bottom bar). The `gameDash` id is kept so `renderGameDash()` still resolves.
- `renderRoster()` reordered: it populates `#benchTop` (via the extracted `renderBenchInto(container, swapMap, posForPlayer)`) and `#modeHint` **before** appending the pitch and reading `pitch.clientWidth/Height` — so the flex pitch height is final when `pitchPt()` projects the tokens (avoids stale-dimension mis-placement).
- Bottom-bar buttons share `.gd-btn` (stacked icon+label, `min-height:56px`). Primary variants `.gd-go` (START), `.gd-pause` (running), `.gd-sub` (SUB) add colour + `flex:1.5`. `renderG()` swaps ppB between `gd-go`/`gd-pause`; `renderGameDash()` paints the SUB label once.
- Bottom bar uses `padding-bottom: calc(8px + env(safe-area-inset-bottom))` to clear the iPad home indicator.

---

## v1.9.2-beta — Edit button + clearer sub mode

- ✏️ **Edit** added to the in-game dashboard — opens the player positions / preferences editor and returns straight to the live game (`editTeamFromGame()` + `_editingFromGame`). Removed the duplicate "Edit" chip from the formation row so there's a single, discoverable Swap / Injury / Edit / Undo bar.
- 🔁 **Sub strategy mode shown clearly** — the game screen chip now reads **"SUBS · Equal time / Paired / Manual / Full control"** with the strategy's own colour + icon and a faint tinted fill. Tap it to change. Added the missing **Full control** (`planned`) case to the badge map so every strategy renders.

### Architecture notes
- `renderGameDash()` now also paints `#gdEdit` (pencil icon, "Edit" label) — it's an action button, never carries the active-mode highlight since it navigates away rather than arming a tap-mode.
- `subStratLbl` badge in `renderG()`: `stratMap` extended with `planned → {clipboard, 'Full control', #a78bfa}`; chip gains a "SUBS" prefix label and a `color+'1a'` background tint for prominence.

---

## v1.9.1-beta — In-game control dashboard

- 🎛️ **Action dashboard** under the timer — **Swap / Injury / Undo** in one persistent control bar, instead of hidden tap-gestures.
- ↔️ **Swap** — tap two players to exchange positions. Sets the starting line-up before kickoff and reshuffles mid-game. **Tap the keeper** in a swap to change who's in goal (role transfers automatically) — no separate keeper button needed.
- 🚑 **Injury** — tap the injured player, the bench lights up, tap exactly who comes on (no longer forced to the front of the queue). "Out for game" option preserved.
- ↩️ **Undo** surfaced as a dashboard button (disabled when there's nothing to revert).
- ✨ **Subtle soft-UI pass** — consistent corner radii, soft drop shadows + faint top highlight, gentle gradients and tactile press states across buttons, chips and cards. Reads premium without heavy neumorphism.

### Architecture notes
- `gameMode` ('swap' | 'keeper' | 'injury') drives what tapping a player does; `setGameMode()` toggles it (tapping the active mode returns to the safe Swap default).
- `tapFieldPlayer()` branches on mode; `tapBenchForInjury()` completes the injury flow with the chosen replacement; `makeKeeper()` reuses `swapFieldPositions()` for the role transfer.
- `injurySub(pIdx, replacementIdx)` now takes an optional chosen replacement, defaulting to `bench[0]`.
- Soft-UI tokens: `--r-btn/--r-chip/--r-sm` radii, `--sh-raise/--sh-raise-lg/--sh-press` shadows. Applied to `.btn*`, `.chip*`, `.card`, `.gd-btn`.

---

## v1.9-beta — 3D pitch + jersey pills

- 🎯 **Soccer pitch in 3D perspective** — bottom-pivoted 45° tilt with depth foreshortening (broadcast-cam feel). Near edge anchors the layout so the far end tapers inward without clipping.
- 👕 **Jersey-shirt player pills** — each player is an outlined shirt (light fill) with their number ON the shirt; position chip + name on a pill below. GK shirt is **pink** (distinct from amber "about to sub").
- ✋ **Set the line-up on the pitch** — before kickoff, tap two players to swap their starting positions. Works for outfield players and the GK (role transfers). After kickoff, tapping a player is an injury sub as before.
- 🪑 **Bench as a wave grid** — Next on / +5′ / +10′ columns (sized off sub interval × players-per-sub). Auto-fits more columns for big benches (AFL-ready).
- ↩️ **Undo Last Sub** surfaced in the bench header — instantly reverts a mistaken swap.
- ✏️ **Heavier line work** + removed the distracting centre/penalty dots.
- 📐 FIFA-correct dimensions preserved — penalty area 40.32×16.5m, goal area 18.32×5.5m, centre circle r=9.15m, penalty spot 11m, corner arc r=1m, goal mouth 7.32m.

### Architecture notes
- `.pitch-flex` (flex:1) holds `.lu-pitch` absolutely-centred (`inset:0; margin:auto; aspect-ratio:105/80; max-width/height:100%`) — fits the largest aspect-correct box in the available space, no scroll.
- `.lu-plane` is the tilted ground (`rotateX(45deg)`, `transform-origin:50% 100%`, `height:240%`) containing the SVG; calibrated so the perspective-projected plane fills the container.
- `pitchPt(px, py)` mirrors the CSS bottom-pivot + perspective matrix in JS; falls back to identity (raw px/py) if `_pitchDims` is unset OR has zero width/height — guarantees tokens never disappear on first paint.
- `tapFieldPlayer()` branches on `G.secs===0 && !G.running` → position swap, else injury sub. `swapFieldPositions()` swaps slots in `G.on`, transfers the GK role, and keeps paired-rotation groups consistent.
- Netball stays top-down (existing CSS-based markings); identity fallback in `pitchPt` when `_pitchDims` is null.

---

## v1.8-beta — Full Control mode + Game Plan view

- 📋 **New "Full control" sub strategy** — coach plans every sub before kickoff
- 🪄 **Auto-suggested plan** using Equal-time fairness — coach starts with a sensible default rather than a blank slate
- ✏️ **Tap any swap to override** — modal picks alternate off/on players from those on field / bench at that moment
- 📷 **Snap a photo of your handwritten plan** — `extract-roster` edge function extended with a `plan` mode that returns structured `{start, events, gk}` JSON. Fuzzy-matches handwritten names to the roster.
- 🧠 **Strategy descriptions lead with the coach archetype** — stance lines ("I just want everyone to play", "Keep my pairs together", "I'll call them as I see them", "I plan every sub before kickoff") above the algorithm description
- ⚙️ At runtime, `trigSub` honours the plan's off/on for the current half + time; falls back to Equal-time logic when no planned event matches (e.g. mid-cycle manual SUB)
- ☁️ Plan is copied from `cfg.subPlan` to `G.subPlan` at game start and snapshotted with the active-game save
- 📷 **Roster photo import now also captures position labels + jersey numbers** — handwritten "Lucy D" / "Maya CD" / "Tilly M" type entries auto-tag the player on save. C-prefix maps to `side='B'`; L/R prefix maps to side. Falls back to name-only if no labels are visible.
- 🔤 New `translateRosterPosition()` helper handles the abbreviations: D/CD/LB/RB/CB → DEF, M/CM/LM/RM → MID, W/LW/RW/WNG → WNG, S/F/FW/ST/FWD → FWD, GK → GK

### Architecture notes
- `generateAutoPlan()` simulates whole-game timeline minute-by-minute crediting minutes, picking highest-min on-field to come off and lowest-min benched to come on at each scheduled sub time
- Edge function `extract-roster` accepts `mode: 'plan'` with optional `roster` hint for name matching; `high` image detail used in plan mode for handwriting recognition
- Plan stale flag (`cfg.subPlanStale`) triggers regeneration when Sub Strategy or interval settings change

---

## v1.7-beta — Jersey numbers

- 🔢 **Per-player jersey number** — small input on each row in the team editor (all sports)
- 🔢 **Displayed on pitch cards + bench rows** at runtime so coaches can call players by number
- 🔢 **Optional** — leave blank for kids without fixed jerseys, no impact
- ☁ New `numbers` JSONB column on cloud `teams` table; merge logic preserves the richer side, same pattern as positions / sides / foots
- 📝 Rename + delete handlers migrate the numbers key alongside everything else

---

## v1.6-beta — Player side + foot preferences

- 🦶 **Per-player side preference** (L / R / Both) — captured in the team editor for soccer teams
- 🦶 **Per-player dominant foot** (L / R / Both) — a right-footer often prefers playing left to cut inside, so we keep these as separate fields
- 🆕 Open any existing team's editor to fill these in — defaults are "Both" so old teams aren't broken
- 🏐 Soccer only — netball positions are fixed by rule, no side concept
- ☁ New `sides` + `foots` JSONB columns on the cloud `teams` table; merge logic preserves the richer side
- 📝 Rename + delete handlers migrate side/foot keys alongside positions

---

## v1.5-beta — Sync hardening + smarter score handling

- 🛡 **Position tags no longer get wiped when syncing across devices** — the cloud merge now preserves whichever side has data
- 🛡 **Players added offline are preserved** on sync — the longer list wins
- 🎯 **Sub strategy + GK settings** are correctly preserved across sync
- ✓ **Tap −1 on the score** to correct a fat-finger goal — match log stays clean (no phantom goals)
- 🏐 **Sport-aware text** on Settings — netball shows "quarters", soccer shows "halves"
- 🏐 **Legacy netball teams** now correctly identified by format (no more soccer ball icon on netball cards)
- 🏷 **Version tag** visible next to the BETA pill (header + landing hero)
- 📐 "Next sub at" time on the game screen — slightly bigger so it's easier to glance
- ✨ **What's New modal** introduced — you're looking at it

---

## v1.4-beta — Undo + reorder + futsal

- ↶ **Undo Last Sub** — instantly reverts a swap, restoring players, minutes, and the match log
- ↕ **Bench reorder chevrons** — promote or demote players in the sub queue (Manual + Equal-time modes)
- ⏱ **Sub strategy chooser moved to Settings** — pick Equal-time, Paired rotation, or Manual before kickoff, not as a post-Start popup
- 🔄 **Paired rotation now balances minutes** — the pair with the most game time goes off, keeping groups together AND minutes fair
- 🕐 **Whole-game continuous sub schedule** — sub cadence flows continuously across both halves rather than restarting each period
- 🥅 **Custom soccer ball icon** with proper pentagon-centre geometry
- 🏐 **Custom netball icon** with proper volleyball-style seam pattern
- ⚽ **Futsal 5v5 format** — 4 outfield + 1 GK, 2-minute hockey-style line rotations, 1-2-1 diamond default
- ☀ **Summer 6v6 format** — 5 outfield + 1 GK, classic 2-2-1 default
- 🎨 **Lucide icon library** replaces all emoji throughout the app
- 🏠 **Tighter home screen** — Start/Edit buttons on every team card, side-by-side New Team + Match History row, floating logo banished
- 🏃 **11v11 default half = 45 minutes** (was 30)

---

## v1.3-beta — Beta release + feedback channel

- 🆕 **BETA badge** + version tag in the header
- 💬 **In-app feedback** channel — writes to a Supabase `feedback` table
- 💡 **Home tips carousel** — feature reminders for returning users
- 🎯 **Tactical tips** per formation
- ☕ **Buy Me a Coffee** tip jar (home + match summary)
- 📲 **PWA home-screen icons** (PNG)
- ⚽ **Scorer picker** when you tag a goal for your team
- 🔔 **Sound-pack picker** — 6 alert sounds (Classic, Whistle, Air Horn, Bell, Retro, Silent)
- ☁ **Match history cloud sync** with sync-state indicator
- 📐 **Sticky header fix** — no more "hanging heading" mid-page
- 📐 **iPad scaling** — app widens to 560/640px on larger screens
- 📋 **Scannable formation pills** with short descriptors

---

## v1.2-beta — Multi-sport core (Netball)

- 🏐 **Netball** added as a second sport (Set, GO, Junior, Open formats)
- 🏐 **Netball court** rendered with thirds + semicircular goal circles
- ⏱ **Quarter Length** / "Minutes per quarter" labels for netball
- 🌅 **Animated 2-3-1 dot logo** — represents subs flowing on/off
- 🆕 **New-user signup hardened** against Supabase duplicate-email race
- ✕ **Abandon-game** button on the game screen
- 🌗 **Light mode** added, then removed (contrast issues)

---

## v1.1-beta — Auth + sync + position tags

- 🔐 **Magic-link sign-in** via Supabase + Resend SMTP
- ☁ **Teams sync** across devices via Supabase Postgres
- 🎯 **Position tags** per player (GK/DEF/MID/WNG/FWD)
- 📷 **AI roster import** via photo (OpenAI gpt-4o-mini vision)
- ⚽ **Same-first-name** disambiguation with last-name initial

---

## v1.0-beta — First public version

- ⏱ Live game clock with sub alerts at scheduled times
- 🔄 Paired-rotation substitution model
- 📊 Per-player playing-time tracking
- 🏃 Manual SUB button + automatic prompts
- 🥅 Goalkeeper choice (1H + 2H)
- 📝 Match log with subs / goals / period boundaries
- 💾 Match history with score, opponent, location

---

## How to update this file

Append a new section at the top when bumping `APP_VERSION` in `sub-timer.html`. Mirror the change list into `CHANGELOG_DATA` near the top of the JS so the in-app **What's New** modal shows the same entries when users open the app on the new version.
