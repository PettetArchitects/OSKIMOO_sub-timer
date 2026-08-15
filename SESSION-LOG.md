# Session Log & Persistent Memory

> **Read this first when starting a fresh session on this repo.** It's the
> git-native memory: where things stand, what's been decided, and what's next —
> so a new session picks up without re-deriving context. Append, don't rewrite;
> newest entry on top. Keep it short — link to PRs/docs for detail.
>
> Companion docs: `PROCESS.md` (the method), `FEATURES.md` (what exists +
> coverage), `docs/UX-PATHWAYS.md` (intended behaviour = the oracle),
> `docs/UIMAP.md` (actual UI). This file is the *narrative + backlog*; those are
> the *reference*.

---

## 2026-08-15 (Session 8) — THE GLANCEABLE GAME SCREEN: bench urgency + drawer + table, chrome purge, landscape rebuilt; the gallery grows compare mode

**State:** branch `session-8-glanceable-bench` = **v2.9.42-beta**, all green (full gate at every version v2.9.38→42). NOT deployed; v2.9.32→42 all local — sync-first per DEPLOY.md.

### How this session worked (worth repeating)
The owner iterated LIVE in the dev gallery, firing ideas mid-build; each was tested against SCREEN-BRIEFS s4 / design.md §5.0 BEFORE building. Some passed straight (bench escalation, drawer, ON|OFF|AT table), some got reshaped by the brief (takeover at ≤10s not ≤30s; window-scoped chip, not a standing toggle; nav rail LEFT not right), one was refused and redirected (score → popup behind a button: collides with the 2026-08-08 one-tap standing exception — compacted the display instead).

### Shipped (one version per decision, records in docs/records/)
| Ver | What |
|---|---|
| v2.9.38 | Bench escalates on the countdown's thresholds (amber ≤30s "get ready", red pulse ≤10s); portrait-phone bottom-DRAWER takeover ≤10s (overlay grammar, Field/Bench escape chip); next-on wave = ONE §5.0 card as a table ↑COMING ON \| ↓OFF \| AT; `#pitchMid` isolation contains token z-indexes; countdown digits actually go amber now (inline-colour bug); timing strip retired |
| v2.9.39 | Score band → one slim row (84→52px), entry untouched (standing exception honoured) |
| v2.9.40 | Pre-kickoff "announce the line-up" link retired (break-time door survives — the ritual's real home) |
| v2.9.41 | Landscape rebuilt: `.app` was still pinned to the 430px portrait column (score under the bench rail, clocks painted off-canvas); full-width now, in-flow compact clocks, rails clear both fixed bars, rail-compact pills. Real bug: takeover class was orientation-blind → bench rendered into the hidden drawer = empty rail at ≤10s; portrait gate now in JS too |
| v2.9.42 | Bottom nav → 64px LEFT side rail in landscape (right edge kept for SUB/START thumb zone); `body.has-tabbar` clears content, landing/wizard screens keep full width |

### Dev tooling (uncommitted-workflow upgrades)
CLAUDE.md born (session startup context) · `gallery-server.py` + "dev gallery" launch config (one-step, serves its own dir, / → gallery) · gallery COMPARE mode (`?compare=app-main.html`, `npm run baseline` from main's committed index.html — every tile main-vs-working, same driven state) · landscape live-game tile (740×360) · 11-player fixture (4-deep bench) · elements strip → own page (`?elements`, top-right switch) · iframed app instances skip the What's New modal.

### Next session — pick up here
1. **Merge the PR**, deploy per DEPLOY.md (production is at v2.9.31 — eleven versions behind).
2. **Atlas re-shoot** — the game screen changed shape (table, drawer, slim score, no strip/announce, landscape). figma-atlas skill.
3. **Real-device pass** on the drawer thresholds + landscape rails (gallery-tuned only).
4. Backlog unchanged from Session 7: palette Option C stamp · Plan page benchmark pass · migration steps 4–5 · nav audit A3/A5 · `.sec-label`/`card`/`info` sweeps.

---

## 2026-08-14/15 (Session 7) — THE BENCHMARK ERA: §5.0 stamped and rolled out, flat controls, nav audit lands, atlas re-shot

**State:** `main` = **v2.9.37-beta**, all green (full gate at every version), eleven commits `a68d2f1…6ea7a7c`, working tree clean. NOT yet deployed to production — deploy per DEPLOY.md when ready.

### The big stamp
**design.md §5.0 — the Team settings page is THE BENCHMARK** every screen is measured against (owner, 2026-08-14): TWO COLOURS USED (neutrals + one accent; red/amber only when their meaning is on screen) · three surfaces max (`.set-group` hairline cards, `.opt-row` choices) · selection = SOLID accent fill, ✓ ticks deleted app-wide · one component per family · quiet sub-line labels · FLAT (§5.0.7 — no shadows/gradients on controls, press = scale) · 600px measure. ui-check now **defends** it: no `.sel::after` rule, no red `.btn-o`/`.back-btn`, no press-lip shadows, no gradient fills — regressions fail CI.

### Shipped (one version per decision, records in docs/records/)
| Ver | What |
|---|---|
| v2.9.32 | Benchmark page (grouped cards, no ticks, ONE `renderFormationTiles()` for settings/shape/s2 — was three treatments); `docs/COMPONENT-CENSUS.md` born (14 families); palette proposal §2.1.1 (B + C, **unstamped**) |
| v2.9.33 | Rollout: s2/s1/keeper/shape/summary; red exits navigation; stale s2 cadence copy fixed (subs RESTART each period, P3.8) |
| v2.9.34 | FLAT — `.btn` gradients/shadows gone, ui- 3px press lip gone, dash tiles flat; off-token ratchet 43→31 |
| v2.9.35 | Nav audit A1 (tab bar leaves keeper/shape; ghost option REJECTED + K sections retired) · A2 (s2 = "Today's game") · A4 (backs name places); Plan page lite pass |
| v2.9.36 | Game dash STABLE slots (SUB never morphs into RESET; Reset half → menu w/ confirm; SUB works paused); bench later-waves legible |
| v2.9.37 | Next-on steps up a tier (owner: most important info on the live game); 4-bench test exposed pitch-starvation → later waves wrap as pills, 30dvh cap; team editor benchmark pass; atlas fixture now 11 players |

Dev gallery: UX-flow-grouped 16-tile spread (~0.7s boot), continuous zoom, `?app=` alternate builds, benchmark specimens in the strip. Atlas: **all 47 fills re-shot at v2.9.37**, K/K2/K3/K4 proposal sections deleted, L moved into grid, legend rewritten.

### Next session — pick up here
1. **Palette Option C awaits the owner's stamp** (§2.1.1): 9 accent hue families → 3 (green/red/amber). Mock: `node build-palette-mock.mjs` → browse `dev-gallery.html?app=palette-mock.html`. Implementing it clears most remaining purples (`.is-plan`), the Plan page's colour debt, and the neutral-ramp collapse.
2. **Plan page full benchmark pass** — worst choice budget (+4); red KEEPER select / red mini-steppers / EQUAL-TIME IDEAL block (§11 #4) visible in `docs/records/v2.9.35-navigation/plan-top-band.png`.
3. **Migration steps 4–5** (census #3/#4, the last 🔴): legacy `.btn` sites → ui- classes. Flat pass already unified their look; this is the class swap.
4. **Nav audit remainder**: A3 (Roster tab lands on a PLAY screen) · A5 (Plan page labeled back — unblocked now A1 landed).
5. Smaller: `.sec-label` sweep on record/history screens · flat `.card`s · `.info` variants · tab-icon contrast on device · S-sandbox ghost symbol removal (owner call).
6. **Deploy**: v2.9.31→37 are local-only; sync-first per DEPLOY.md + deploy-guard.

---

## 2026-08-11 (Session 6) — The stamped control standard lands: Arial fallback killed, steppers + chips migrate

**State:** `main` = **v2.9.31-beta**, all green, three merges (PRs #68–#70), production current.
**Migration step 3 (design.md §11.1b) is COMPLETE.** Owner picked "button migration step 3" over the
feature backlog when offered the choice.

### Shipped
| Ver | PR | What |
|---|---|---|
| v2.9.29 | #68 | **§11.0 immediate fix** — `font-family:inherit` on legacy `.btn`/`.back-btn`/`.st-btn`/`.chip` (they declared no font stack; buttons don't inherit, so they rendered Arial on-device). New ui-check gate item: every legacy control class must declare a font-family. |
| v2.9.30 | #69 | **Step 3a** — all 14 `.st-btn` steppers → `.ui-step` (48×48, class deleted); `.hit44` pattern (transparent ≥44×44 button, visual on inner span, negative margin keeps footprint) for the stamp's hit-area offenders: score ± (28px visual), AFL GOAL/BEH/undo, squad Build → chip. Ratchets lowered: a11y 31→27, inline-button sigs 52→49. |
| v2.9.31 | #70 | **Step 3b** — all 16 `.chip` sites → `.ui-chip` (`.chip` + dead `.gk-sel` deleted); `.sel` ✓ tick moved to `.ui-chip.sel::after` (one affordance everywhere, POTM/scorer included); base gains centering for grid tiles. ui-check legacy list is down to `.btn` + `.back-btn`. |

Before/after comparisons (settings tab, squad, keeper page, shape page, score header) shared with the
owner at each step. Note: the intervening #56–#67 stretch (navigation constitution, dev gallery v1–v5,
§11.0 stamp, deploy guard) predates this entry and has no session-log entry of its own — the commit
messages carry the detail.

### Next session — pick up here
1. **Migration steps 4–5** (§11.1b): outline actions → `.ui-btn--secondary` + tones (27), then
   primary/destructive + judge the rest. Step 5 also owes the 16/800 action-label stamp (§11.0).
2. **Feature backlog** (unchanged): opposition log (s6 gap) · scenario smart-offer (subOrderOv) ·
   ranked player strengths (editTeam gap) · cognitive-check ratchets · flow-walker + tree-path coverage.
3. **Atlas is stale at v2.9.27 frames** — steppers + every chip surface restyled (squad, keeper, shape,
   settings, S2, scorer, sound packs); re-shoot per the `figma-atlas` skill once the run settles.
4. Owner's open calls: borderless on iPad fresh look · real-iPad screenshot into the atlas slot.
5. Watch (unchanged): `swapFieldPositions` pair-membership remap on slot swaps · 3D pitch first-paint race.

---

## 2026-08-09 (Session 5, final) — The first real game closes the loop: report → replay → rules → fixes

**State:** `main` = **v2.9.27-beta**, all green, twelve merges this stretch (PRs #43–#54), production current.
Atlas current to v2.9.27 (incl. new section H). **Pick up at the feature backlog** (below).

### The event of the session: the owner's real game (Dragonflies vs Curl Curl, 11–0)
Played on v2.9.19, reported "sub allocation was off and not even" through the **new in-app bug report
button** (v2.9.20 — history detail → one tap posts match + replay flow to `bug_reports`, insert-only RLS).
Replaying it action-by-action: **no engine error** — every rotation followed the rules — but two design
gaps: a half-time gloves handover made BOTH keepers unrotatable (ex-keeper zero outfield secs; new keeper
by role), squeezing rotation onto 5 slots → churn + a kid sitting the last 10 minutes. **Owner rule
stamped: "back into the normal cycle as if the keeper played their allotted time"** → `G.rotCredit`
(v2.9.21). Positions audit of the same flow → strengths adherence + position-time tracking (v2.9.22/24).

### Shipped (each gated + CI-green; Codex review threads fixed/replied/resolved on #49–#51)
| Ver | PR | What |
|---|---|---|
| v2.9.16 | #43 | Keeper door (GK pill) — regression from Play mode 4 caught by owner |
| v2.9.17 | #44 | **Setup step pages** (owner directive): squad → keeper page → shape page → field |
| v2.9.18 | #45 | Summary scorer picker — name a skipped goal at full time |
| v2.9.19 | #46 | **END HALF next to PAUSE** (owner placement after label affordance flopped) |
| v2.9.20 | #47 | Bug report button + `bug_reports` table (migration applied, e2e verified) |
| v2.9.21 | #48 | **Keeper handover credit** (owner rule, from the real game) |
| v2.9.22 | #50 | Position-time tracking + strengths seating repair + clock steppers removed |
| v2.9.23 | #49 | **Settings tab** (worktree agent build): Game·Team·Settings·Roster; header back-links dropped; brand-bar logo = Home |
| v2.9.24 | #51 | Position-ledger alignment (Codex P1s: rendered outfield-ordinal mapping is canonical) |
| v2.9.25 | #52 | Bench next-on hierarchy bump + **Team tab renamed Positions** |
| v2.9.26 | #53 | Whole bench on screen (next-on full-width; later waves side-by-side compact; 36dvh) |
| v2.9.27 | #54 | Even-time split suggestion in Settings timing (roster-based, one-tap USE) |

### Also this stretch
iPad "right side clipped" = iOS input focus auto-zoom (16px fix + gate check, v2.9.14, prior entry) held.
Magic link verified working (localhost redirect explained). LESSONS.md: the cross-evaluate mutation
hazard (smoke scenarios needing precise game state must bootstrap+act+assert in ONE evaluate).
Atlas re-shot at v2.9.27: 40 fills swapped + **new section H** (phone frames 15 keeper page ·
16 shape page · 17 team settings, nodes 58:30–32); legend updated; procedure in Claude's project memory.

### Next session — pick up here
1. Backlog: **opposition log** (s6 gap) · scenario smart-offer (subOrderOv) · ranked player strengths
   (editTeam gap) · cognitive-check ratchets · flow-walker + tree-path coverage.
2. Test infra: the **netball `page.reload` CI flake** (twice today — replace reload with goto+wait or retry).
3. Owner's open calls: borderless on iPad (fresh look post-zoom-fix) · real-iPad screenshot into the
   atlas slot · ui-rounded check.
4. Watch: `swapFieldPositions` remaps pair MEMBERSHIP on a slot swap (suspect — slot swaps shouldn't
   change who's paired; spotted during seating work, not user-visible yet).

**Standing directive unchanged: flow first on the current UI.**

---

## 2026-08-08 (Session 5, continued) — The whistle ritual completes; the iPad mystery solved

**State:** `main` = **v2.9.15-beta**, all green, three more merges (PRs #38–#40), production current.

### Shipped
| Ver | PR | What |
|---|---|---|
| v2.9.13 | #38 | **Player of the match** (s5 gap ①) — huddle-fast chip row on the summary (playing-time order, one tap, 44px targets). `match.potm` + a `{type:'potm'}` log event for cloud transport (no schema change; `_matchPotm()` reads either shape); star line in history detail. First automated coverage on the save-match path. |
| v2.9.14 | #39 | **iPad "right side clipped" fix** (owner report, mid-session) — not a layout bug: iOS Safari's input focus auto-zoom (15px `.input`) + `user-scalable=no` left the page stuck zoomed. All text fields → 16px; new a11y gate check (every focusable text field ≥16px, full-DOM). A stuck iPad clears with one pinch-out or reload. |
| v2.9.15 | #40 | **Edit-from-history** (s5 gap ②) — history detail's Edit details door: opponent, location, per-goal scorer (inline chip strip), potm. FACTS stay read-only (P5.4 tension resolved in the s6 brief). `updateCloudMatch()` UPDATE path; edits on a deep copy, land on Save. |

### Diagnosis worth remembering
The iPad clipping reproduced at NO emulated geometry (768/1024/1366, viewport + `.app`-edge overflow
scans all clean) — the tell that it was a real-Safari behaviour, not layout. Sub-16px inputs are now
gate-guarded so the class of bug is closed.

### Next session — pick up here
1. Rest of the rehearsal backlog: **opposition log** (s6 gap — opponents as entities: shape, notes,
   record, surfaced as pre-game intel), scenario smart-offer (subOrderOv), ranked player strengths
   (editTeam gap), cognitive-check ratchets (budgets + dominance + taps-to-kickoff), flow-walker.
2. Owner's open calls: borderless look OK on iPad (now that the zoom fix landed, worth a fresh look) ·
   real-iPad screenshot into the atlas slot · ui-rounded check.
3. Atlas: frames are at v2.9.12 — re-shoot when the current run of small versions settles (summary +
   history changed in v2.9.13/15; procedure in Claude's project memory `figma-atlas-reshoot`).

---

## 2026-08-08 (Session 5) — Play modes 4+5 land; the atlas current twice over

**State:** `main` = **v2.9.12-beta**, all green, two merges (PRs #35, #36), production current.
Session 4's pickup list is fully worked. **Pick up at the feature backlog** (below).

### Shipped
| Ver | PR | What |
|---|---|---|
| v2.9.11 | #35 | **Play mode 4** — the Plan tab leaves the live game. Removed: Plan tab, game-drawer Sub Plan row, break-hint "set next line-up" link, dead `subOrderBtn`. Plan page's one door = team card → Plan ahead. `switchToView('plan')` kept as the programmatic route. Smoke's break-hint check now asserts the announce door + the absence of the Plan detour. |
| v2.9.12 | #36 | **Play mode 5** — Home is the Plan/Play fork. Card tap → squad select (resume when live); quiet 44×44 clipboard button = the PLAN door (sheet: Plan ahead / Past games / Edit / Share — "Play now" removed); + New Team → `ui-btn--secondary is-plan` (matchday red gone — the screen-audit "dominance on the wrong action" headline addressed). |

### Decision resolved (recorded in SCREEN-BRIEFS Plan page + s4, UX-PATHWAYS P4)
**Break line-up editing lives on the game screen's break state, on the field** — tap-swap, keeper pick,
formation change, ending in the announce view — NOT on the Plan page. Follows the owner-stamped s4 break
ritual; the field at a break already shows the proposed next-period line-up as reviewable defaults.
P4.4b's engine guarantee (plan-at-break describes only the upcoming period) stays gated.

### Figma atlas
Re-shot **twice**: all 40 frames at v2.9.10 (borderless), then again at v2.9.12 after the tab-bar/home/drawer
changes. Legend (node 1:20) updated both times. Procedure re-codified in Claude's project memory
(`figma-atlas-reshoot`) — the prior "figma memory" hadn't persisted; the log's summary + `test/screen-audit.mjs`
were enough to rebuild it. Shoot script pattern: screen-audit journey × 3 viewports, `upload_assets` with
nodeId per frame (fills swapped, frames never re-placed).

### Next session — pick up here
1. Feature backlog from the rehearsal: player of the match + edit-from-history (s5 gaps ① ②),
   opposition log (s6 gap), scenario smart-offer (subOrderOv), ranked player strengths (editTeam gap),
   cognitive-check ratchets (budgets + dominance + taps-to-kickoff), flow-walker + tree-path coverage.
2. Owner's open calls: borderless look OK on iPad? · real-iPad screenshot into the atlas slot ·
   ui-rounded check (only matters if/when the ui- font ships beyond drawers).
3. Watch item: returning to the game view from the Plan page with the top-h field view can transiently
   cluster the jerseys top-left for a frame (pre-existing render timing, seen while verifying #35 — not gated).

**Standing directive unchanged: flow first on the current UI — restyle decisions (incl. the lime
reference language) wait until the flow work is done.**

---

## 2026-08-08 (Session 4) — The constitution session: Plan/Play modes, the Saturday rehearsal, and five shipped builds

**State:** `main` = **v2.9.10-beta**, all green, six merges today (PRs #28–#33), production current.
Gate ~460 checks / 14 suites (brief-check + screen-audit joined). **Pick up at Play mode 4.**

### The design constitution (merged, gate-enforced — read these before touching UI)
- **`docs/SCREEN-BRIEFS.md`** — per-screen contract: purpose, pathways, ONE primary action, must-show,
  boundaries, choice budget, **Mode: PLAN|PLAY|BOTH** (required field). Enforced by `test/brief-check.mjs`
  in the gate: actions must exist in code, P# refs must resolve, every runtime screen briefed.
- **The governing split (owner-stamped): PLAN mode / PLAY mode.** Play = matchday, sparse & loud
  (squad → line-up review + announce → game → whistle ritual). Plan = midweek, dense & calm (teams,
  roster/strengths, sub-plan scenarios, history + opposition notes, sharing, seasonal settings).
  The grammar of every PLAY surface: **engine proposes → coach reviews → coach announces to children.**
- **`docs/FLOW.md`** — screen map + the coach's workflow tree v3 (stamped) + service blueprint.
  FigJam mirror: https://www.figma.com/board/ZAF9tiQaaylLSszKzdafkH (tree v3 is authoritative; delete v1/v2 there).
- **`test/screen-audit.mjs`** (`npm run screen-audit`) — per-screen tappables/objects/<44px/fonts/colours/
  anims/dominance. Headlines: live game 25 tappables + dominance 1.0 (no visual primary); Home-with-teams
  dominance 13.2 *on the wrong action* (New Team); team editor = worst a11y (23 sub-44px).

### The Saturday rehearsal (the session's engine — ~15 owner decisions, all in the briefs)
Walking the owner's real matchday produced, among others: **timing is seasonal** (settings leave the
matchday path) · **announce views** (the screen scripts what the coach reads to the huddle, at kickoff
and every break) · **the relay card** (sub = a shout: who on, for whom, at which position; outgoing name
is the kid's wayfinding) · break ritual = keeper → shape → positions → announce · score = standing
one-tap interrupt · full-time = confirm score + **player of the match** (new feature) · plan page does
NOT live on the game view · **Home is the Plan/Play fork** · plan-ahead = named **game-day scenarios**
pulled up in Play mode (smart-offer by headcount/opponent = gap) · **opposition log** (new feature domain).

### Shipped today (each gated, each traceable to a rehearsal decision)
| Ver | PR | What |
|---|---|---|
| v2.9.5 | #28 | Keeper-time rule + fairness hunt (from prior session, merged today) |
| v2.9.6 | #29 | Drawer rows → `.ui-btn--ghost` (migration step 02) + ghost tones |
| — | #30 | The constitution: briefs + brief-check + FLOW.md + screen-audit |
| v2.9.7 | #31 | **Play mode 1** — timing confirm strip; s2 formally out of the matchday path |
| v2.9.8 | #32 | **Play mode 2** — announce views (pre-kickoff door + break door) |
| v2.9.9 | direct | **Play mode 3a** — the relay card (⚠️ committed straight to main by mistake; gate was green locally; CI doesn't run on main pushes) |
| v2.9.10 | #33 | **De-outline** (owner directive): borders off all buttons/panels; selection = tinted fills. Kept: shell hairlines, inputs, pos-tags |

### Figma (all under the UI Atlas file qh2yjSJ10gSWBrpb4120qb + flows board)
Atlas sections regrouped **by mode** (PLAY rows / PLAN rows × phone/iPad/web), 07 frames current to
v2.9.8, announce view added as frame 14. **Needs: v2.9.10 re-shoot of most frames (borderless look).**
UI Kit page: variables (Primitives + Semantic w/ Light/Dark modes), ui- component sets, WCAG audit
(dark passes AA everywhere; AAA table + fixes computed). Control Styles page: A/B/C tiles + type-scale
(20→8 roles) + spacing audit (**102 padding combos**, no grid → 9-step scale proposed) + AAA contrast.
Look Explorations: direction tiles + owner's reference mocks (RING/TAKEOVER/WHISTLE, lime-on-ink) —
**parked by owner: "flow first, current UI".** Real-iPad screenshot slot still empty (owner task).

### Next session — pick up here
1. **Re-shoot the atlas for v2.9.10** (borderless) — all sections, three sizes (procedure in the
   figma memory / prior session pattern; swap fills by nodeId, never re-place).
2. **Play mode 4** — Plan tab leaves the live game's tab bar/view cycle (brief: subOrderOv). Careful:
   `switchToView('plan')`, `renderViewSwitcher()` (~line 3809), break-hint link now points at announce
   + plan; the Plan page stays reachable from team context (teamActionPlanAhead) + break line-up editing
   (which currently lives on the Plan page — needs a home decision before the tab goes).
3. **Play mode 5** — Home as the Plan/Play fork (resume-primary-when-live · team card → Play ·
   quiet PLAN door; New Team loses red + matchday prominence).
4. Then: feature backlog born today — player of the match + edit-from-history (s5 gaps ① ②),
   opposition log (s6 gap), scenario smart-offer (subOrderOv), ranked player strengths (editTeam gap),
   cognitive-check ratchets (budgets + dominance + taps-to-kickoff), flow-walker + tree-path coverage.
5. Owner's open calls: borderless look OK on iPad? · real-iPad screenshot into the atlas slot ·
   ui-rounded check (only matters if/when the ui- font ships beyond drawers).

**Standing directive: flow first on the current UI — restyle decisions (incl. the lime reference
language) wait until the flow work is done.**

---

## 2026-08-08 — Two marathon sessions: flows, gates, fairness — and a UI system awaiting migration

**State:** [PR #28](https://github.com/PettetArchitects/OSKIMOO_sub-timer/pull/28) **merged 2026-08-08** — `main` = v2.9.5-beta.
UI migration step 02 (drawer rows → `.ui-btn--ghost`, v2.9.6-beta) is on branch
`claude/ui-step02-drawer-ghost` awaiting the owner's explicit go on the before/after
screenshots — first step that changes how the app looks. Gate is ~590 checks across 12 suites.

### Shipped (PR #27, merged → production)
- **Game-flow recorder** — every game records as a replayable flow; menu → *Send game flow*;
  `test/replay.mjs` reproduces a sent game exactly. `flows/README.md`.
- **Second-half fixes** — 2nd Half GK setting was never wired (now explicit-pick only, `gk2Explicit`);
  Plan page at a break simulated the finished period; match-log HT ordering; injury rows rendering blank.
- **Dev mode** — `?dev=1`: seed a game, jump the clock (real `tickSecond`), replay a flow on screen, state inspector.
- **Offline** — DSEG clock font inlined (was CDN-only → plain monospace at grounds with no signal);
  service worker, network-first, no `skipWaiting`. Cold-start offline verified.
- **Sign-in fix** — was unreachable for anyone with a team (~40 versions on production). Now in the drawer.
- **Five doc gates** — `design-check` (colour tokens, ratchet 43), `privacy-check` (storage inventory),
  `a11y-check` (names hard-fail; hit-target ratchet 34), `ui-check` (type/radius/button ratchets),
  plus `docs-check` grew teeth. `docs/CONTROL-DOCS.md` is the register; `docs/PRIVACY.md` the policy.

### Pending in PR #28
- **Owner's rule: time in goal ≠ game time for equal play** (`G.gkt`, `_rotSecs`) — fixes Molly
  (H1 keeper yanked off-on-off through H2). Trade-off, flagged: the H1 keeper now tends to play all of H2.
- **Fairness hunt** (`npm run fairness`) — seeded whole-game sims judged on player *experience*.
  Found + fixed on first sweep: paired rotation starved the leftover odd group (sum→per-member average);
  out-for-game injury replacement never seated in its pair. Both gated in `edge`.
- **Open findings** (owner judgement, changelog v2.9.5): greedy fair scheduler drifts ~3 intervals on
  quarter sports with sc=1; ~15% of random configs mathematically can't cycle their bench → a setup
  warning would be a nice small feature.

### ── UI WORK HANDOFF — resume here ─────────────────────────────
**Where it stands:** the `ui-` button system (six variants, "fun familiar approachable" —
GameChanger/TeamSnap/Spond/Duolingo references, NOT dev-tool aesthetics) is **defined on main and used by
nothing**. Step 01 of 5 done. Mockup artifact (before/after, press the buttons):
https://claude.ai/code/artifact/27175a1e-913d-4d88-bd19-d9f6cc8e73f9

**The system** (index.html, search `v2.9.3: button system`; documented `design.md` §4.1.0):
`.ui-btn--primary/--secondary/--ghost/--danger`, `.ui-chip`, `.ui-step` (48×48) + tone modifiers
`.is-go/.is-preview/.is-plan/.is-attention`. `ui-rounded` type, 3px colour "lip" that compresses on
press, 16px radii, solid fills. Zero new tokens (both ratchets caught the first draft trying).

**Migration order** (`design.md` §11 item 1b) — each step: migrate → before/after screenshots →
lower `UI_BUTTONS` budget in `test/ui-check.mjs` (now 54) → gate → commit:
1. ~~Define classes~~ ✅ shipped, inert
2. Drawer/menu rows → `.ui-btn--ghost` (46 buttons — biggest, near-identical already)
3. Steppers + chips → `.ui-step`/`.ui-chip` (21; **closes 9 of the 34 a11y hit-target failures**)
4. Outline actions → `.ui-btn--secondary` + tones (27)
5. Primary/danger; judge the rest (singular things may stay inline)

**Blockers/decisions before step 02:**
- ⚠️ **`ui-rounded` unverified on a real iPhone** — headless has no SF Pro Rounded. 30-second check
  (`?dev=1`, look at the DEV panel labels). If it doesn't land, pick the face before migrating 46 rows.
- This step **changes how the app looks** (everything before it moved no pixels). Owner has been
  rightly wary of behaviour changes — get an explicit go on the drawer screenshots.

**Related open UI threads (don't re-litigate the decided ones):**
- **DECIDED, do not re-attempt:** pitch-chip sizes stay as-is (`design.md` §11 1a); the dynamic
  chip-scale experiment is stashed on `claude/game-flow-recorder` (`stash@{0}: dynamic-chip-scale`).
- Soccer pitch: LB/RB labels overlap the keeper's shirt — pre-existing, unfixed, noted in §11 1a.
- `design.md` §1 principle 5 justifies dark-only with "reads better in glare" — research says the
  opposite (NN/G etc.); the *reason* needs rewriting even if dark stays. Never done.
- Neutral ramp: 9 greys → target ~4 (§11 item 1). Gradient stop pairs still undocumented (§11 item 0).
- a11y focus-ring gap: one `:focus-visible` rule exists on `ui-` classes only; app-wide once migrated.
### ──────────────────────────────────────────────────────────

**Ratchet dashboard** (lower deliberately, never raise): colours 43 · hit targets 34 · sub-9px 11 ·
font sizes 20 · radii 13 · button styles 54.

**Also useful:** `npm run fairness` (FAIR_SEED replays one game) · `?dev=1` dev panel ·
flows corpus empty until a real game is sent in.

---

## Current state (top of tree)

- **Version:** v2.9.4-beta on main (v2.9.5 in PR #28) · **main:** green, docs in sync.
- **Gate:** `npm run gate` = sanity → docs-check → smoke → sports → edge, enforced
  in CI on protected `main`. ~315 checks. Plus `hunt` / `loop` (discovery, not gated)
  and `uimap` (regenerate the UI map).
- **Deep hunt:** Plan page is clean under heavy fuzzing (~21,600 move-checks, 0
  violations across all 6 formats). The hunter is now deep-runnable
  (`HUNT_ONLY=<fmt>`, `HUNT_BUDGET_MS=…`).

---

## Backlog — where to go next (ranked by user-facing risk)

These are the audit's untested areas. The hunter scales now, so the highest-value
move is to **extend the hunt/tests into one new area** rather than re-fuzz the
Plan page. Each is a clean, self-contained session: extend hunt → reproduce →
fix → regression-test → merge.

1. **Matched multiples (sub group size `cfg.sc` = 3, 4).** Rotation math is only
   ever exercised at sc=2 (pairs). This is where the worst bugs lived
   (uneven minutes, churn) — highest yield. Add a hunt invariant that minutes
   stay even + field count exact under group rotation.
2. **Quarter-break keeper (Q1 / Q3).** The half-time keeper fix (#14) was only
   verified for soccer's single break. Quarter sports (netball/AFL/basketball/
   water polo) have 3 breaks — keeper picker + line-up carry-over unverified there.
3. **Team-setup parsing.** Inline "Name POS" parsing (`cleanupPlayerNames`,
   `stripTrailingPosition`), bulk tag (`applyBulkTag`). Parsing user input is a
   classic bug magnet and is entirely unhunted.
4. **Scoring scorer/assist + match save/history.** `promptScorer`, `saveMatch`,
   `showHistory` — user-facing record-keeping, no automated coverage.
5. **Cloud login + sync.** `sendMagicLink`, `pushCloudTeam`, `pullCloudMatches` —
   needs a cloud env to test; highest-value data flow but hardest to cover.

See `docs/UX-PATHWAYS.md` 🔴-tagged lines and `FEATURES.md` §14 for the full
untested surface.

---

## Decisions on record (the human-owned intent)

Things the coach/owner decided that the code alone wouldn't tell you — these are
the oracle. Don't "fix" the app away from these without checking.

- **Squad select = deselect the no-shows.** Everyone is selected by default; you
  tap to *remove* absentees (not "pick who's playing"). (UX-PATHWAYS P2)
- **Sub timing matches the plan.** Subs restart each period (sf, 2·sf, …) so the
  live game fires at exactly the times the Plan page shows — even when the
  frequency doesn't divide evenly into the period. Chose per-period over
  continuous-across-breaks. (#20)
- **Keeper is always a manual pick.** Auto-fill must never shuffle keepers; a
  pure-GK displaced by a keeper change goes to the bench, not an outfield slot. (#13)
- **Keeper changeable at every break**, and the previous-period keeper stays on
  the field next period (youth rotation). (#14)
- **Save a plan, reuse it, and tweak it on game day** — applied plans load into
  the live game and stay editable; edits must not corrupt the saved profile.
  "Save plan" is available in any mode, not just Custom. (#22, #24-era)
- **Persistent memory lives in git** (this file), not Supabase — Supabase is the
  app's production data store, not a scratchpad.

---

## How we work here (quick reference — full detail in PROCESS.md)

- **Map → Gate → Hunt.** Human owns intent, machine owns enforcement. A bug =
  divergence from written intent.
- **Every fix ships with a regression test.** The gate then guards it forever.
- **Docs can't drift** — `docs-check` fails CI on version/UIMAP/link staleness.
  After any change: update the relevant doc (and run `npm run uimap` if UI wired
  controls changed). The gate enforces this.
- **Merge-on-green** (current standing instruction): merge a PR once its CI is
  green without asking; only stop for failures or ambiguity.
- **Branches off `main`, PR to protected `main`.** `git config http.postBuffer
  524288000` before pushing (the 549KB index.html trips the proxy otherwise).

---

## Session history (newest first)

### Session 3 — team share link (access code for parents)
Owner ask: "a team access code I can send that has the Dragonflies already set
up — the parents just run the game." Shipped **Share team** (team-action menu):
a self-contained link (`#team=ST1.<base64url JSON>`) carrying roster, positions,
numbers, sides/feet, format + game-settings prefs. Recipient opens it → team
imports before first paint → "TEAM IS READY — Play now" welcome → squad picker.
No account needed. Paste-a-code fallback on the landing page; re-sent codes
refresh in place (dedupe by `sharedFrom`), own-link never clones. Edge-suite
round-trip test onto a wiped device. v2.8.5-beta.

### Session 2 — bug-fix blitz + QA system + this memory doc
Started from "a parent said something broke." Shipped **11 bug fixes** (phantom
players, dropped player on Next/Prev, wrong keeper minutes, uneven rotation +
keeper auto-fill, half-time keeper picker vanishing, game-didn't-save on
backgrounding, sub timing vs plan, saved-plan null-crash, save-plan
discoverability). Built the full QA infrastructure: smoke/sports/edge suites,
the hunt + loop discovery engine, uimap generator, docs-drift gate. Reconciled
FEATURES.md from 50 versions stale; authored UX-PATHWAYS (the oracle) + UIMAP;
wrote PROCESS.md (portable method). Verified save→reuse→modify plans; made the
deep hunt runnable. PRs #10–#24. Ended at v2.8.4-beta, all green.

### Session 1 — earlier
Plan-page keeper + pick-starters, smoke harness + CI + SessionStart hook, sports/
edge suites, and earlier fixes (live squad edit, clock-during-edit, sub-cadence
groundwork). PRs #3–#8.

---

_Maintenance: at the end of a working session, add a one-paragraph entry on top
of "Session history", refresh "Current state" + "Backlog", and record any new
owner decisions. Keep it tight — this is a map, not a transcript._
