# Sub Timer — Changelog

All notable changes to the app, by version. The in-app "What's New" modal pulls the same data from `CHANGELOG_DATA` in `sub-timer.html`.

---

## v2.9.23-beta — Game settings get their own tab (owner directive)

The Game Settings block (formation tiles, sub-strategy cards, timing steppers, breaks-only toggle) leaves the team editor for a new **Settings** tab on the bottom bar — a PLAN-mode surface of its own (`teamSettings`), sitting next to Team; Game stays first, Roster stays last, visual weight unchanged. The editor is roster-only now. The controls are the same ones (`renderTeamSettings`, formerly `renderEditTeamPrefs`) but they operate directly on `currentTeam` and **live-save on every change** (`saveTeamSettings`: `saveTeams()` + debounced cloud push + a quiet Saved tick) — no Save button to forget. With no game underway a change also refreshes the working `cfg` immediately (`applyTeamPrefsToCfg`, extracted from `selectTeam`), so Settings → Roster → kick off uses the new defaults without a re-select; mid-game the live cfg is untouched and the next game picks the changes up. Smoke: tab presence, navigation + highlight, formation tap and stepper change persisting to the stored team, editor asserted clean of the old block.

## v2.9.22-beta — Position time + strengths adherence + quieter clocks (owner asks ×3)

Three from the Dragonflies review session. **① Position-time tracking:** `G.ppt` accrues seconds per formation-slot label every tick (keeper always GK, wherever her slot index sits); saved into each `playingTime` entry (`pos:{LB:1200,…}` — rides the existing jsonb, no schema change); summary + history rows show "LB 20′ · FW 10′" (sub-minute stints folded). **② Strengths adherence** (verified gap: an untagged kid at RB at kickoff via stale `luOrd`; rotations inherit slots tag-blind): new `repairSeating()` re-seats the on-field XI by swapping slots while mismatches strictly decrease — never changes who plays, untagged players fit anywhere, keeper untouched; runs at kickoff (after saved-plan apply, before the review pages) and after every engine sub before the relay card reads the slots; never in Plan-ahead build mode, never on coach tap-swaps. **③ Clock steppers removed** (min-half / min-subs under the clocks) — timing is seasonal (team settings) with the strip's Change link for exceptions; also deletes 4 of the worst a11y hit-target offenders (`clkAdj` retired; the Plan page's `planClkAdj` unaffected).

## v2.9.21-beta — Keeper handover credit (owner rule, from the first real bug report)

The Dragonflies vs Curl Curl review (sent via the new v2.9.20 button) found no engine error — every rotation followed "longest-on off, least-played on" exactly — but exposed a design gap in the v2.9.5 keeper rule: after a mid-game gloves handover, the ex-keeper's zero outfield seconds made her unrotatable (she played all of H2), the new keeper was locked on by role, and the remaining kids churned through 5 slots (one sat the entire last 10 minutes; another was benched at the rotation right after coming on, three times). **Owner rule:** the ex-keeper goes *"back into the normal cycle as if the keeper played their allotted time"* — on handover her rotation clock is credited up to the group average, held in a new `G.rotCredit` ledger feeding `_rotSecs()` only (pt untouched — displayed minutes stay true; `gkt` keeps meaning goal-seconds). Credit fires at every mid-game handover path (field tap-swap, break/live keeper pick, explicit 2nd-half keeper); pre-kick picks are no-ops. Plan-page projections read the same ledger so preview and engine agree. Snapshot/reset/resume all carry the ledger. Smoke: reproduces the Dragonflies shape (10 players, 7v7, 5′ subs, HT gloves swap) and asserts the ex-keeper rotates in H2 and the outfield spread tightens.

## v2.9.20-beta — The bug report button (owner request)

"Can you code a button so I can send game for bug review?" History detail grows **Send this game for review**: one tap posts the saved match record + the matching replay flow (time-matched from the recorder, scores as tie-breaker) + an optional note/email to a new `bug_reports` table — insert-only RLS mirroring the feedback table, readable only via the service role. No files, no share sheets — the existing "Send game flow" share-sheet route stays for manual exports, but the car-park path is now one tap. Reports carry app version + user agent for triage.

## v2.9.19-beta — The half-time override (owner request)

"We need something to override it and say it's already half time." An **END HALF** button (amber, flag icon — FULL TIME on the last period, END Q2 on quarter sports) sits in the game dashboard **next to PAUSE** — the owner's placement call after a first pass on the period label proved too subtle. Shown only while a period is genuinely underway (never pre-kick, never at a break — the same window `endPeriodNow()` accepts); tap → sport-aware confirm → the period ends at the current clock through the exact same `advH()` path as the natural expiry: break state, true-order period_end log with the clock where it actually stopped, auto break-rotation, summary on the final period.

## v2.9.18-beta — The summary scorer picker (owner report)

"The note who scored the goal didn't work after logging it." The at-goal picker works (verified live) — the hole was the gap between the moments: a skipped "Who scored?" had NO affordance on the full-time summary; scorer editing only existed after saving (edit-from-history, v2.9.15). The summary's game log now gives our goals the same "name the scorer / change scorer" button, routed through the existing live picker (`promptScorer` — scorer + assist, writes `G.log`). `showSum`'s log block factored into `renderSumLog()`; `closeGoalPicker` repaints just that card so typed opponent/location text survives. The scorer is now nameable at all three moments: at the goal, at full time, and from history.

## v2.9.17-beta — The setup step pages (owner directive)

Keeper and shape become explicit pages BEFORE the game screen: squad → **keeper page** (`gkStep`) → **shape page** (`shapeStep`) → line-up review (s4) → announce → kick off. The game is built first (`quickStart` — engine proposes), so each page is a one-tap review with the proposal marked; picks route through the existing `setPlanKeeper()` / `selectGameFormation()`. Keeperless sports skip the keeper page, fixed-formation sports skip the shape page (`routeSetupSteps()`); the v2.9.16 GK/formation pills stay as re-entry + break doors. `finishSetupSteps()` is the programmatic walk-through used by the test harness and every direct `startFromSquad()` caller (13 sites). New briefs for both screens; screen-audit + a11y audit them; FLOW.md map updated.

## v2.9.16-beta — The keeper door (owner report: "where is the keeper workflow?")

Play mode 4 removed the live game's doors to the Plan page — and the keeper picker lived there, so choosing the keeper silently lost its only discoverable path (field tap-swap transfers the gloves, but nobody would find it). The game screen now owns the gloves: a **GK pill on the pitch** (top-right, 44px, shows the current keeper's name) appears exactly in the ritual window (`planSetupPhase()` — pre-kickoff + breaks, never mid-play) and opens a chip picker (on-field first, bench under a separator). Taps route through the existing `setPlanKeeper()`, so all the established behaviour holds: a benched pick swaps onto the field and displaces the old keeper; a break pick is an explicit 2nd-half keeper (`gk2Explicit`); the keeper stays out of the rotation pairs. Smoke: setup pick, benched pick (displacement asserted), break pick (gk2Explicit asserted), and mid-play hiding.

## v2.9.15-beta — Edit-from-history (s5 gap ②)

The enrich-later half of the whistle ritual: history detail grows an **Edit details** door. Editable: opponent, location, per-goal scorer (one tap per goal, inline chip strip; clearing a scorer clears its assist; a scorer can't assist their own goal), and player of the match. **The record's facts stay read-only** — score, minutes, event times are never editable, resolving the P5.4 tension flagged in the s6 brief. Edits work on a deep copy and land on Save: local matches store updated in place; signed-in edits sync via a new `updateCloudMatch()` UPDATE path (only the deferred fields travel — opponent, location, log). The log-borne potm event is kept in step with the field on every save. Smoke: scenario covers the full edit round-trip including cancel-discards.

## v2.9.14-beta — iPad fix: input focus auto-zoom (right side clipped)

Owner report: the right side of the app was clipped on the iPad. Cause: iOS Safari zooms the page when a focused text field is under 16px, and with `user-scalable=no` the zoom can stick after blur — the app then sits zoomed with its right edge off-screen. Every text field (`.input` was 15px; share-link 11px; team-code 12px; dev flow-JSON 11px) is now 16px — the documented iOS fix; pinch zoom untouched, no layout change otherwise. New a11y gate check: every focusable text field must be ≥16px, full-DOM, so the trap can't be reintroduced. (A stuck iPad clears with one pinch-out or a reload.)

## v2.9.13-beta — Player of the match (s5 gap ①)

First feature from the rehearsal backlog. The summary grows a huddle-fast picker: one row of name chips under a star heading, playing-time order (likely candidates float up), one tap picks, tap again clears — no overlay, no extra screen. `G.potm` persists through backgrounding via the active-game save; `saveMatch()` writes `match.potm` **and** a `{type:'potm'}` log event so the pick survives the cloud round-trip without a schema change (the `matches` table has no potm column; `log` is jsonb — `_matchPotm()` reads either shape). History detail shows the star line. The log renderer silences the potm event (the star line is its display). Smoke: new scenario covers pick → save → reread from history — the first automated coverage on the save-match path.

## v2.9.12-beta — Play mode 5: Home is the Plan/Play fork

The start screen now IS the mode split (owner-stamped brief). PLAY: the team card tap goes straight into squad select — no action menu in between — and when a game is live the card resumes it (resume outranks everything). PLAN: the card's quiet purple clipboard button opens the midweek sheet (Plan ahead / Past games / Edit / Share — "Play now" left the sheet since the card does it), and **+ New Team** loses its matchday red for the quiet plan tone (`ui-btn--secondary is-plan`). First-run landing keeps its own primary CTA. Share copy updated ("tap the team to play"). `teamActionPlayNow()` removed.

## v2.9.11-beta — Play mode 4: the Plan tab leaves the live game

The constitution's split lands in the tab bar: the Plan page is midweek-only. The Plan tab, the game drawer's Sub Plan row, the break-hint's "set next line-up" link, and the dead `subOrderBtn` are removed from the live game — its only door is now the team card's **Plan ahead**. Mid-game doubt is answered by the game screen's ambient info (countdown, coming swaps, bench rest), never by dropping the coach into build mode.

**Decision recorded (follows the owner-stamped s4 break ritual):** break line-up editing lives on the game screen's break state, on the field — tap-swap positions, keeper pick, formation change — ending in the announce view. The P4.4b engine guarantee (plan-at-break describes only the upcoming period) stays gated for the programmatic/midweek route. `switchToView('plan')` survives as the programmatic route (tests, replay flows). While the Plan page is open, no tab highlights; exit via Game/Team/Roster.

## v2.9.10-beta — De-outline: the first visual clean-up (owner directive)

Outlines removed from buttons and panels app-wide — chips, dashboard buttons, outline buttons, steppers, modals (the 3px red frame), drawers, pop-up menus, tip cards, banners, and the JS-rendered pickers (squad-plan, strategy, formation, plan tabs). Fills and colour now carry hierarchy and selection; selected states switched from coloured rings to tinted fills. Kept: the two structural shell hairlines (brand bar, tab bar), form inputs, and the position-tag pairs (colour-coded identity). Zero behaviour changes.

## v2.9.9-beta — Play mode 3a: the relay card

At every fired sub the screen scripts the shout in speaking order — who comes on, for whom, at which position (slot mapping computed post-swap so the position is where the kid runs to). Tap or 12 s dismisses; undo withdraws it; break rotations defer to the announce view. Edge-gated ×4.

## v2.9.8-beta — Play mode 2: the announce views

The huddle script: a read-aloud line-up view (starters with position codes, keeper marked, bench grouped) reachable pre-kickoff ("announce the line-up") and at every break ("announce it", titled with the upcoming period). Edge-gated ×5.

## v2.9.7-beta — Play mode 1: the timing confirm strip (game-day setup simplifies)

First code to land from the owner's Saturday rehearsal (docs/SCREEN-BRIEFS.md): **timing is seasonal, not matchday** — period length, cadence, group size and strategy are per-team config, set once. The pre-kickoff review now carries a one-line **timing confirm strip** ("20′ halves · subs every 5′ · 2 per sub · Equal time — *Change*"); Change opens the settings screen on demand, Apply returns to the review.

- 🧭 The settings screen (`s2`) formally leaves the matchday path — code archaeology showed it had already fallen out (`goSettings()` had no live callers since squad-select started routing straight to the game); the strip gives it a deliberate on-demand door instead of none, and its button now reads **Apply settings**.
- 📜 UX-PATHWAYS P2.3 rewritten to match intent; new invariant gated in `edge`: the strip shows pre-kickoff with the seasonal values and vanishes once the game is genuinely underway.
- 🧱 Zero new colours; the strip wears existing tokens.

Matchday is now: squad → pre-kickoff review (+ glance) → kick off.

## v2.9.6-beta — Drawer rows move onto the `ui-` button system (migration step 02)

First step of the button-system migration that changes pixels (step 01 defined the classes and touched nothing). The 12 drawer/menu rows — game menu (Edit Team, Sub Plan, End game), plan menu (Edit Team, Save plan profile, Edit Lineup, End game) and the rows `openDrawer()` injects into every drawer (Sub-alert sound, Help & gestures, Sign in, Send feedback, Send game flow) — are now `.ui-btn--ghost` instead of twelve near-identical inline style strings.

- 🎨 Two colour-only ghost tones added: `.is-plan` (purple rows on the plan menu) and `.is-danger` (End game), following the `.ui-step.is-danger` precedent. Zero new colours.
- 📏 Rows get the system's 50px min-height (was ~46px), 14px radius, `ui-rounded` type at 700 — the "fun familiar approachable" treatment from design.md §4.1.0.
- 🧹 The amber Donate row keeps its deliberate one-off treatment.
- 🔒 `UI_BUTTONS` ratchet lowered 54 → the post-migration count; the budget can keep falling, never rise.

Behaviour untouched: same items, same order, same handlers.

## v2.9.5-beta — Time in goal doesn't count as game time for equal play

From a real game, better described the second time: **Molly kept the whole first half, handed over the gloves at the break, and was then subbed off "way too many times" in the second half.**

Reproduced exactly (9-player 7v7, subs every 5): the keeper never rotates, so Molly reached HT on 20 minutes when nobody else had more than 15. Equal-time always pulls the highest-minutes player off — so as an outfielder she became the permanent target: **off at 5', forced back on at 10' by the two-deep bench, off again at 15'.** Two yanks in a half, 5-minute stints, worst of any player.

**The owner's rule, now implemented: keeper time is not game time for equal play.**

- ⏱ `G.gkt` tracks seconds in goal per player. All rotation *selection* — live engine (`trigSub`, every strategy), the on-pitch next-sub preview (`getNextSwap`), the Plan-page simulation (`buildPlanTimeline`) and the Full-Control plan generator (`generateAutoPlan`) — sorts on **outfield seconds** (`pt − gkt`). Plan and live stay in agreement, per the v2.8.2 principle.
- 🖥 **Displayed minutes are unchanged everywhere** — pitch chips, summary, history show true total time. Only the fairness ledger changed.
- 🎿 When the keeper never changes, `gkt` cancels out of every comparison — behaviour is provably identical. The rule only bites at a handover.
- 🔁 Survives refresh (snapshot + reset-half carry `gkt`; old saves backfill empty and start tracking).
- 🐛 Fixed in passing: `generateAutoPlan`'s keeper was constant, so after its HT `gk_swap` the plan kept excluding the **ex**-keeper from rotation — pinning them on the pitch for the entire second half. `simGk` now follows the gloves.

**The stated trade-off:** the H1 keeper now tends to play the whole second half (Molly: 40 total vs ~30 for others — but 20 *outfield* vs their ~28, which is what the rule says matters). Flagged for real-game judgement.

Guarded by `secondhalf: H1 keeper is not rotation-targeted after handing over the gloves` (5 checks, red against v2.9.4).

### The fairness hunt (`npm run fairness`) — and what it found in its first hour

Molly's bug passed every structural gate; nothing was in a wrong *state* — one player's *experience over time* was absurd. `test/fairness.mjs` hunts that class: ~150 seeded games through the real engine (randomised squad, cadence, group size, strategy, keeper handovers, injuries), judging each player's stints, waits, off-counts and outfield spread. Exploratory like the hunt — findings are judgements, not merge blockers. Every game replays from its seed; the Molly game is pinned as game zero.

**Two engine bugs found on the first sweep, both fixed and gated (`edge`):**

- 🥇 **The odd pair never rotated.** Paired rotation compared pairs by minute **sum** — so the leftover pair from an uneven split (7 outfielders in 3s → `[3,3,1]`) could never outweigh a full triple, and its occupant played the whole game: **96 of 100 minutes while teammates averaged 55**. Affected every paired game whose outfield doesn't divide by the group size, including 11v11 in 3s. Pairs now compare per-member **averages** — live engine and Plan sim identically.
- 🩹 **An out-for-game injury made the replacement invisible.** The victim was dropped from their pair without seating the replacement — and paired rotation only ever subs off pair members, so the replacement stayed on untouched. The replacement now takes the vacated pair seat.

**Left open, deliberately — judgement calls, not bug fixes:** the greedy equal-time scheduler drifts up to ~3 intervals of spread with single-player swaps on quarter sports (a smarter scheduler is a product decision); and 22 of 151 random configs **mathematically cannot** cycle their bench (16 players, subs every 8, 30-minute game) — the engine can't fix arithmetic, but the app could warn at setup and today it doesn't.

---

## v2.9.4-beta — Fixed: sign-in was unreachable for anyone with a team

Reported as "there is no login", and it was right — on production, for about 40 versions.

**Sign-in had three routes and two were dead:**

- `renderAuthChip()` writes into `#authChip` — **an element that has never existed in the markup**, so the function returns at its own guard and paints nothing.
- The app-settings modal (`#appSettingsOv`) contains a working sign-in row, but **nothing anywhere opens that modal**.
- The drawer's settings block — whose v2.7.85 comment explicitly promises "Sub-alert sound + Help & gestures + **Sign in if not already on home**" — only ever contained the first two.

That left the landing hero, which renders only when `teams.length === 0 && !cloudUser`. **The moment a coach saved their first team, sign-in vanished** — and if they were already signed in, sign-out went with it. Cloud sync was unreachable for every existing user.

- ✅ **Sign in / Sign out now lives in the menu**, on every screen, where the comment always said it should. The row refreshes each time the drawer opens, so it reflects the current session rather than being baked once.
- 📴 **Honest when offline** — Supabase loads from a CDN, so with no connection there is no auth client at all. The row now says "Sign in — needs a connection" and disables itself, rather than opening a form that can only fail. That case became reachable in v2.9.3, when the service worker made the app open offline.

### Notes
This bug lived in **UX-PATHWAYS P7 (account & cloud sync)** — the pathway `docs/CONTROL-DOCS.md` flagged as having **no invariants at all**. The audit predicted the gap; the bug was sitting in it. P7 now has its first assertion and moves 🔴 → 🟡, guarded by `edge: sign-in reachable from the menu with a team saved`.

---

## v2.9.3-beta — Works at a ground with no signal

Prompted by a simple question — "fonts correct as well?" — applied with the same skepticism as the design and accessibility claims. The stack was fine. The delivery wasn't.

- 🔤 **The clock font is inlined, not fetched.** DSEG-7 Classic came from `cdn.jsdelivr.net` with no service worker, so `document.fonts.check()` returned **false** offline and the clock fell back to plain monospace — the scoreboard identity simply absent, in the exact place the app is used. Now a base64 data URI: 5KB raw, 6.7KB inlined, on a 612KB file. Verified by loading with the CDN blocked.
- 📴 **Service worker — the app opens with no reception.** `manifest.json` declared `display:standalone`, so it installed to the home screen looking native, and then needed a network to render its own clock. A cold start offline previously showed the browser's offline page. Verified: network fully down, cold start, full app with the DSEG clock.
- 🌐 **Network-first, deliberately.** The obvious choice for an offline app is cache-first, but this app ships often and cache-first is how PWAs strand users on a three-week-old build. Network-first gives current-when-online, last-good-when-offline. Also **no `skipWaiting()`** — a worker taking over mid-match could reload the page during a game; new versions activate on the next cold start instead.
- 🎨 **Three.js stays on the CDN.** 600KB isn't worth inlining and the 2D pitch fallback renders correctly without it. Cloud sync failing offline is also correct. The clock was the only cosmetic dependency, and it was the app's identity.

### Notes
- `docs/PRIVACY.md` gains a Cache Storage row. It holds no personal data — shell and icons only — but rule 1 says a new place to put data gets a row *before* it ships, not after. The rule is about the place, not the contents.
- `design.md` §2.2 now documents delivery, not just the stack.

---

## v2.9.2-beta — UI consistency check, and the pitch-legibility finding

- 🔎 **`test/ui-check.mjs`** — in the gate and CI. Ratchets four counts so the gap between `design.md` and the code can shrink but never grow: sub-9px text (11), distinct font sizes (20), distinct radii (11), distinct inline button treatments (54).
- 🎯 **Radius sprawl measured, not changed** — 13 distinct corner radii against a 7-step scale. Three were briefly snapped onto the scale and then reverted: they were only changed to satisfy a metric introduced the same day, and the pixels they altered were working. The ratchet holds at 13, which is what stops NEW ones appearing.
- 📉 **The pitch carries the smallest text in the app.** All 11 sub-9px declarations are on the 3D player chips, and AFL is worst: 18 players force position labels to **7px** and names to 8px. That is in direct tension with design principle #1 — *"the coach is on a sideline in sunlight… readable in one glance"* — because the pitch is precisely the surface read at a glance mid-game. **Recorded, not silently changed:** fixing it is a density trade-off (18 chips have to fit), so it needs a decision, not a token edit.
- 📐 **One Button, 54 treatments.** `design.md` §4.1 documents a single Button component, but **121 of 158 buttons are inline-styled** across 54 distinct padding/size/radius/weight combinations. A document can't govern a component the code doesn't use. Ratcheted, with convergence (promoting the common signatures to classes — the top 8 cover ~65 buttons) recorded as backlog.
- 📝 `design.md` §2.2 now states the real count next to the eight documented roles, rather than implying the roles are the whole story.

---

## v2.9.1-beta — Accessibility check, and the stray button it found

- 🐛 **Removed an invisible 4×4 pixel button from the Home screen.** `#historyBtn` was left behind when Match History moved into the team-action menu — its label stripped, but `renderHome` still un-hiding it. Tappable, unlabelled, doing nothing a coach could see. The accessibility lens found it before any functional test did, because it was invisible rather than broken.
- 🔎 **`test/a11y-check.mjs`** — walks eight screens in a real browser at 390×844, in the gate and CI.
  - **Accessible names: hard fail.** All 114 controls pass. A control with no name a screen reader can announce now fails the build.
  - **Hit targets: ratcheted at 34.** 34 controls sit below the 44×44pt minimum `design.md` §8 requires; the count can fall, never rise.
  - **Focus rings:** reported every run until closed.
- 📝 **`design.md` §8 now states what's true.** It asserted the 44pt minimum flatly while most controls failed it — and being written down is exactly what stopped anyone checking. It now reads as a target with the real number beside it, per `docs/CONTROL-DOCS.md`: a control that asserts the opposite of reality is worse than no control.
- 🔇 The drawer scrim is `aria-hidden` — a decorative click-catcher shouldn't appear to a screen reader as an unnamed full-screen control when the drawer already has labelled close affordances.

Checking all eight screens rather than only the game screen roughly doubled the count (18 → 34). The worst offenders are the clock steppers (18×18) and tip-carousel arrows (24×24); sizing those is a layout decision, since the steppers are deliberately small so two clock anchors fit side by side on a phone.

---

## v2.9.0-beta — Data & privacy policy (no functional change)

No change to how the app works. `docs/PRIVACY.md` records what Sub Timer stores, what leaves the device, and the rule for the next feature; `test/privacy-check.mjs` fails the build if a `localStorage` key appears with no row in it.

The policy is deliberately proportionate — a junior roster of first names and jersey numbers is low-sensitivity, and treating it as a compliance exercise would be silly. It exists because the app gained cloud sync, share links, photo import and flow export across ten versions, each reasonable alone, with nothing tracking the cumulative picture.

Writing the inventory surfaced three things worth knowing, none of which was the share link that prompted the discussion:

- **Photo roster import is the widest egress.** `extract-roster` uploads an arbitrary photograph to a server-side vision model. The intended subject is a team list, but a photographed club team sheet routinely carries surnames, parent phone numbers and dates of birth. Everything else the app sends is structured data whose shape we chose; this is the only path that can send data the app has never seen.
- **Names are full names by design.** The screen shows first names, which makes it easy to assume that is all we hold. `fn()` splits on whitespace and renders the last word as an initial ("Sarah B") — so any coach with two Sarahs is pushed into entering surnames, and the raw string is what is stored, synced and shared.
- **Match history has no delete path.** `matches` is insert-and-select only, so saved matches — names, minutes, location — can't be removed.

Also adds `docs/CONTROL-DOCS.md`, a register of which documents govern this app and which of them actually enforce anything.

---

## v2.8.9-beta — The match log reads the way the game happened

- 🕐 **The half-time change is no longer filed under the first half.** `advH()` pre-applies the recommended rotation at the break, and `confSub()` stamped those swaps with the clock as it stood when the half ended — so the log read `1H 20:00 Quinn → Sam` / `1H 20:00 Taylor → Jordan`, *above* the Halftime line, for two players who never took the field in the first half. It also made the halves look asymmetric: 1H showed subs at 5/10/15/**20**, 2H only 5/10/15. Those rows now read **HT** and sit under Halftime.
- 🧹 **Removed the blank row at the top of every match log** — the `sub_strategy` entry recorded at kickoff, which no renderer handled and so drew an empty line stamped `1H 00:00`.
- 🩹 **Injury subs, half resets and opposition-shape changes now render** instead of silently drawing empty rows for the same reason.

### Architecture notes
- `period_end` is now pushed by `advH()` when the break begins, not by `startNextPeriod()`. It has to be logged *before* the rotation is applied, or the break marker lands after the change it precedes.
- `_breakRotation` is set around the `trigSub()`/`confSub()` call in `advH()`; `confSub()` tags the resulting entries `atBreak:true`.
- New shared `_logTimeLabel(e)` (break rows and `atBreak` rows read "HT"/"Q3") and `_logRenders(e)` (filters `LOG_SILENT_TYPES`), used by both the summary and the match-history renderers so the two can't drift.

---

## v2.8.8-beta — Dev mode: the test harness, inside the app

Built after a run of screenshots showed `00:01` on the clock six minutes into a half. That was **not** the app — it was the throwaway fast-forward helper in the screenshot script, which advanced `G.secs` without `G.elapsedMs`. Every test script had been re-inventing that helper, and getting it subtly wrong. Now there is one implementation, in the app, that testing and debugging both use.

- 🧪 **Hidden dev panel**, gated on visiting the app with **`?dev=1`**. The flag is stripped from the URL immediately (so a shared or bookmarked link never carries it) and the choice is remembered on that device. Turn it off from inside the panel or with `?dev=0`. Nothing renders or wires when it's off — coaches will never see it.
- ⏱ **Jump the clock** to any period and minute. Runs the **real** per-second logic (`tickSecond()`), so auto-subs fire and playing minutes accrue exactly as in a live game — a jumped-to state is indistinguishable from a played-to one. Plus skip-to-break and skip-to-full-time.
- ⏪ **Rewind within the current period** by restoring the kickoff snapshot and re-simulating. Rewinding *across* periods is refused outright rather than silently doing nothing — nothing records enough history to rebuild an earlier period faithfully.
- 🌱 **Seed a game** in one tap for any of the 23 formats — team, squad, settings, straight onto the pitch. No more clicking through setup to test a half-time behaviour.
- 🎞 **Replay a game flow on screen.** Paste an exported flow and step or play through it in the real app, watching the bug happen, instead of only headlessly via `test/replay.mjs`.
- 🔍 **State inspector** — live readout of period, clock, on-field, bench, keeper (and whether `gk2` is an explicit pick or the default), rotation pairs, subs done and per-player minutes.

### Architecture notes
- `devFreezeClock()` stops the loop and reconciles `G.elapsedMs = G.secs*1000`. `renderG` paints the clock from `elapsedMs` while `tickSecond` only advances `secs` (the live rAF loop is what normally reconciles them) — every ad-hoc harness that skipped this displayed the wrong time.
- `devAdvanceTo(period, secs)` drives `tickSecond()` in a loop and calls `startNextPeriod()` across breaks. At a break the current position is taken as the *end* of `G.half`, since `G.half` is still the finished period; treating it as `G.secs` made a rewind request from half-time neither happen nor get refused.
- In-app flow replay mirrors `test/replay.mjs`: rebuild from `flow.setup`, advance the clock to each action, and skip `auto` actions (they are reproduced by the clock, and re-applying them would double-substitute).

---

## v2.8.7-beta — Second-half setup fixes (the 2nd-half keeper, and the Plan page at a break)

Both found by a targeted sweep of the period boundary after a coach reported "an issue with player setup in the second half".

- 🧤 **The "2nd Half GK" setting now actually works.** It had never been wired to anything: it was stored, persisted, and rendered on the Plan page as **"HALFTIME GK SWAP"**, but nothing ever assigned it to the live keeper — so the first-half keeper played the whole match. The nominated player now takes the gloves at the break, and is brought on from the bench (displacing the outgoing keeper) if that's where they were.
- 🎯 **Only an explicit pick swaps.** `gk2` auto-defaults to a *different* player than `gk1`, so every keeper-format game was silently displaying a halftime keeper change that never fired. A new `gk2Explicit` flag means the swap happens only when the coach actually chose someone — leaving the setting untouched changes nothing, and the Plan page no longer promises a swap it won't perform.
- 🔒 **A defaulted 2nd-half keeper is no longer locked out of the rotation.** The plan generator excluded `gk2` from outfield rotation for the whole game on the assumption it would become the keeper; with the swap never firing, that pinned an outfielder on the pitch, never rotated, for 90 minutes.
- 🧹 **The keeper choice no longer leaks between teams.** `gk1`/`gk2` are indices into a *specific* squad, and `selectTeam()` never reset them — so an explicit pick could have handed the gloves to whoever sat at that index in the next team. Cleared on team switch.
- 📋 **The Plan page at a period break showed the wrong half.** At a break `G.half` is still the period that just *finished* (`startNextPeriod()` is what increments it), so the timeline regenerated the finished half's sub slots as upcoming: stepping the sub preview forward at half-time showed sub points that had already happened, the "NOW" tag sat on the wrong column, and the entire second-half projection — including projected minutes — was computed from a line-up that never existed. Display-only; it never corrupted the live game.

### Architecture notes
- New `applySecondHalfKeeper(upcoming)` runs from `startNextPeriod()` *before* `snapshotHalfStart()`, so RESET restores the correct keeper. Scoped to two-period sports (matching the setting's label and the plan's soccer-only `gk_swap` event); quarter sports change the keeper by tapping at the break, which already worked. Remaps `G.pairs` the same way `swapFieldPositions()` does, and logs a `gk` event.
- `gk2Explicit` is set by the two GK `<select>` controls and by `setPlanKeeper()` for a later period; cleared wherever `gk2` is auto-defaulted or nulled, and in `selectTeam()`. Persisted through `saveActiveGame`/`resumeActiveGame`, plan profiles, and game flows.
- `buildPlanTimeline()`, `computeProjectedMinutes()`, `getPlanScrubState()` and the period-column render all derive an effective current period `curP = G.atBreak ? G.half+1 : G.half` (and `curSecs = G.atBreak ? 0 : G.secs`) instead of using `G.half` directly.
- New `test/secondhalf.mjs` (68 checks) added to the merge gate, covering both defects plus the must-NOT-swap default case, a benched pick, a break-time tap winning over an older setting, and survival across a refresh at the break.

---

## v2.8.6-beta — Game flow recording (send a bug, don't describe it)

- 🎞 **Every game is recorded as a replayable "flow"** — the setup it started from plus every tap you made, in order, stamped with the game clock and the line-up it produced. The last 12 games are kept.
- 📤 **Send game flow** — new item in the menu (☰). Pick a game, and it goes out via the share sheet on a phone or downloads as a `.json` on desktop. A bug seen on the sideline can then be replayed exactly on a laptop instead of being guessed at from a description.
- 🕶 **Names never leave the phone** — players become `Player 1, 2, 3…` before anything is stored, mapped consistently, with duplicates preserved so the two-players-with-the-same-name case still reproduces. Jersey numbers and position tags are kept, because they steer auto-fill and rotation.
- ♻️ **Survives a refresh** — a game interrupted at half-time (app backgrounded, phone locked, browser reloaded) stays one continuous recording rather than splitting in two.
- ✅ **Recorded games are now a test suite** — `npm run flow` plays ten scripted games, weighted to the second-half setup path, records each the way the app does and replays it; `npm run replay` re-runs every real game committed under `flows/`. Both are merge gates, so a game that once went wrong can never go wrong the same way again.

### Architecture notes
- `tickLoop()`'s per-second body factored out as `tickSecond()` so the live game and the replayer run **identical** logic — a replay exercises the real code path, not a model of it.
- `flowInstall()` wraps the user-facing action functions; `flowRecord()` opens an entry (call + args + clock) and `flowSeal()` closes it with the resulting state. A `_flowDepth` guard records only top-level calls — `trigSub()` calls `confSub()` internally, and recording both would double-apply on replay. A `_flowInTick` counter flags clock-fired actions `auto:true`; the replayer reproduces those by running the clock rather than re-applying them.
- `flowBegin()` at kickoff, `flowResume()` re-attaches after a reload via `G.startTime`. `_flowScrub()` walks both keys and values (playing time is keyed by player name). Storage is capped at 12 games / 4000 actions, and a quota failure sheds the oldest games instead of throwing mid-match.
- New: `test/replay.mjs` (exports its in-page engine), `test/flow.mjs`, `flows/`. See `PROCESS.md` for the REPLAY layer this adds to Map → Gate → Hunt.

---

## v2.8.5-beta — Team share link (access code for parents & co-coaches)

- 🔗 **Share team** — new item in the team-action menu. Builds a link that carries the whole team setup: roster, position tags, jersey numbers, preferred sides/feet, format and saved game settings. Send it to a parent or co-coach; opening it installs the team on their phone with a **"TEAM IS READY — Play now"** welcome that lands them one tap from kickoff. No account needed on either end of the receive.
- 📋 **Copy link** + native **share sheet** (mobile) from the share overlay.
- ⌨️ **Paste-a-code fallback** — "Got a team link from your coach? Add it here" on the welcome screen accepts the full link or the bare `ST1.` code, for messengers that mangle URLs.
- ♻️ **Safe to re-send** — re-opening a code for a team you already imported refreshes it in place (no duplicates), and opening your own link never clones your own team.

### Architecture notes
- Payload is self-contained base64url JSON in the URL hash (`#team=ST1.<payload>`): `{v, sid, n, s, f, p, pos, sd, ft, nm, pr}` — no server round-trip, works on preview deployments (link uses `location.origin`). `sid` (the sharer's team id) is stamped onto the import as `sharedFrom` and is the dedupe key. Import runs at boot **before** `renderHome()` (`importTeamFromUrl`), then `history.replaceState` strips the code so refreshes don't re-trigger; a bad/unknown-format payload (e.g. from a newer app) is rejected whole rather than half-imported. New edge-suite scenario round-trips a share code onto a wiped device.

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
