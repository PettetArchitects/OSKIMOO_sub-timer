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
