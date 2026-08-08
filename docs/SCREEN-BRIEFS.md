# Sub Timer — Screen Briefs (the per-page contract)

> **What each screen exists to do — the designer's contract, codified.**
>
> One section per screen. Every section states: why the screen exists, which
> `UX-PATHWAYS.md` journeys land here, the ONE primary action, the secondary
> actions, what information must be visible, the boundaries that must hold, and
> a **choice budget** — the maximum number of simultaneous visible choices the
> screen is allowed (the cognitive-load target, not the current count).
>
> **Enforced by `test/brief-check.mjs`** (gate): every screen in UIMAP has a
> brief; every `action()` named here exists in `index.html`; every `P#` ref
> exists in UX-PATHWAYS; every brief has a purpose, one primary action, and a
> numeric budget. Restyle work (Figma direction tiles, migration steps) must
> not add or remove a screen's actions without updating its brief first.
>
> Format rules (parsed by the check — keep them):
> section = `## Name · \`screenId\``; fields = bold labels below; actions in
> backticks with `()`; pathway refs as `P1`–`P7` (optionally `P2.3`).

---

## The governing split: PLAN mode and PLAY mode

**Stamped by the owner 2026-08-08.** The app has two modes for two mental
states, and every screen belongs to exactly one:

| | PLAY mode | PLAN mode |
|---|---|---|
| When | Matchday | Midweek |
| Context | One hand, sunlight, kids | Couch, two hands, calm |
| Density | Sparse and loud | Rich and dense |
| Screens | Squad select → line-up review + announce → live game → summary ritual | Teams, roster editor, sub-plan builder, match history, opposition notes, sharing, seasonal settings |
| Decisions | Who's here · keeper · shape confirm · confirm subs · score · player of the match | Everything else — made calmly, in advance |

The grammar shared by every PLAY surface: **the engine proposes → the coach
reviews → the coach announces to children.** The Plan page does not live on
the game view; settings are seasonal; the tab bar's job is mode-appropriate
navigation, not everything-everywhere. Prominence disputes are settled by
one question: *which mode does this belong to?*

---

## Home · `home`

**Mode:** PLAY
**Purpose:** The mode fork (owner, 2026-08-08: the Plan/Play split IS the start screen). **PLAY** — get to today's game: resume banner when live (primary-when-present), then team card → squad select. **PLAN** — the midweek door: new/edit team, sub plans, history + opposition notes, share; clearly there, never shouting on a Saturday.
**Serves:** P1.1, P2.1, P7.1
**Primary action:** tap a team card `selectTeam()` — straight into squad select. (First run: `newTeam()` is primary until a team exists; game live: Resume outranks everything.)
**Secondary:** `newTeam()`, `openTeamCodeEntry()` (shared-team code), `resumeActiveGame()` / `discardActiveGame()` (only when a game is in progress), `toggleGlobalMenu()`
**Must show:** each team's readiness (ready vs "Set up"), the resume banner when a live game exists, sign-in state (drawer).
**Boundaries:** resume banner restores the exact in-progress state (P4); teams list never blocks the resume path.
**Choice budget:** 5

## Sport picker · `sportPicker`

**Mode:** PLAN
**Purpose:** Pick the sport — one decision, nothing else.
**Serves:** P1.2
**Primary action:** `pickSport()` on a sport tile.
**Secondary:** `showScr()` (back), `toggleGlobalMenu()`
**Must show:** the supported sports; which are coming soon.
**Boundaries:** picking scopes the format list to that sport (P1.2→P1.3).
**Choice budget:** 7

## Format picker · `gradePicker`

**Mode:** PLAN
**Purpose:** Pick the on-field size for the team's grade — one decision.
**Serves:** P1.3
**Primary action:** `pickFormat()` on a format tile.
**Secondary:** `showScr()` (back), `toggleGlobalMenu()`
**Must show:** each format's on-field count and typical age grade.
**Boundaries:** format + sport are stamped on the team and drive onField everywhere downstream.
**Choice budget:** 8

## Team editor · `editTeam`

**Mode:** PLAN
**Purpose:** Get the roster in and **set each player's default strengths** — the positions they play, side, foot — the data every Play-mode proposal (auto-fill, rotation, relay cards) draws from (owner, 2026-08-08: Plan mode teaches the engine; Play mode watches it propose). A midweek surface — density welcome here, and team creation belongs to midweek prominence, never matchday prominence.
**Feature gap (owner-implied):** strengths are currently unranked tags — a *primary* position vs positions a player can cover would sharpen every auto-fill proposal.
**Serves:** P1.4, P1.5, P1.6
**Primary action:** `saveAndBack()` once the squad is entered.
**Secondary:** `addPlayerField()`, `removePlayerField()`, `fillSampleSquad()`, `openBulkTag()` / `applyBulkTag()`, photo import, `toggleGlobalMenu()`
**Must show:** every player row with position tags; inline "Name POS" parsing feedback; player count vs format minimum.
**Boundaries:** tags survive rename, are removed on delete (P1.5); saved team round-trips through edit→save→reopen (P1 ✓).
**Choice budget:** 8

## Squad select · `s1`

**Mode:** PLAY
**Purpose:** Mark who turned up. Everyone starts selected; the coach *deselects* the no-shows. **For a planning coach this is where the preset plan meets reality** (owner, 2026-08-08: the sub plan is decided midweek or preset — matchday reconciles it with attendance): applying the saved plan is the expected path, not the detour, and the plan must adapt gracefully when attendance differs from what it assumed.
**Serves:** P2.1, P2.2, P6.4
**Primary action:** `startFromSquad()` (Next → line-up).
**Secondary:** tap players to toggle presence, `planAheadFromSquad()`, `pickSquadPlan()` (apply a saved plan), `showScr()` (back)
**Must show:** playing / out / subs counts; per-player selected state; can't-proceed state below onField.
**Boundaries:** deselect-the-no-shows is the decided model — never invert to "pick who's playing" (owner decision on record); cannot proceed below the format's onField (P2 ✓).
**Choice budget:** 5

## Game settings · `s2`

**Mode:** PLAN
**Purpose:** Confirm how subs will run — period length, cadence, group size, strategy. Defaults should already be right. **Reached on demand only** (v2.9.7): the pre-kickoff timing strip's Change button is its production door.
**Serves:** P2.3
**Primary action:** `quickStart()` — Apply settings, back to the pre-kickoff review.
**Secondary:** `ssAdj()` steppers (period length, sub frequency, players-per-sub), `ssSetStrat()` strategy, 2nd-half GK nomination
**Must show:** current values for every setting; what the strategy means in one line.
**Boundaries:** values clamp to valid ranges (P2.3); players-per-sub 1–4; an untouched 2nd Half GK changes nobody (P4 ✓).
**DECIDED (owner, 2026-08-08): timing is seasonal, not matchday.** Period
length and format are set once for the season (team-level config); the only
week-to-week variable is sub cadence, which depends on who turned up (the
suggested-cadence calc already keys off squad size). This screen therefore
LEAVES the default matchday path: line-up (`s3`) carries a one-line timing
confirm strip ("20 min halves · subs every 5 · pairs — change"), and this
screen opens only from that strip or from team setup. Matchday becomes
squad → line-up/keeper (+ glance) → announce → kick off.
**Choice budget:** 8

## Line-up + keeper · `s3`

**Mode:** PLAY
**Purpose:** Put the starting XI on the pitch and give one of them the gloves.
**Serves:** P2.4, P2.5
**Primary action:** `startGame()` — kick off.
**Secondary:** tap players to place/swap, keeper pick, auto-fill, `showScr()` (back)
**Must show:** the pitch with placed players; **the formation, confirmable at a glance** (owner, 2026-08-08: the shape is confirmed at the start of every game, same as at breaks); who is keeper; bench remainder; projected minutes; **an announceable starters/bench split** — the coach reads this screen ALOUD to the team (owner rehearsal, 2026-08-08): big names, two unmistakable groups. The pitch graphic serves the coach; the announcement serves the huddle. The full setup review: keeper → shape → positions → timing glance → announce.
**Boundaries:** field fills to onField, keeper on field, a pure-GK never auto-placed outfield (P2 ✓); keeper is always the coach's manual pick (owner decision on record).
**Choice budget:** 6

## Live game · `s4`

**Mode:** PLAY
**Purpose:** Run the match: clock, next sub, score — glanceable from three metres in sunlight.
**Serves:** P3 (all), P4.1, P4.5
**Primary action:** `tog()` — start/pause the clock (and the sub-confirm banner when a sub is due).
**Secondary:** `confSub()`, `undoLastSub()`, `adjScore()`, `injurySub()` (long-press), `cycleView()` / `toggleGameFormation()`, bench reorder, `clkAdj()`, game drawer
**Must show:** period clock + next-sub countdown (the pair), score, on-field XI with positions, bench with rest times, whose sub is next; **pre-kickoff only: the timing confirm strip** (v2.9.7) **+ the announce door** (v2.9.8); **at every sub: the relay card** (v2.9.9 — who on, for whom, at which position, in speaking order; tap or 12 s to dismiss; undo withdraws it; break rotations defer to the announce view) — and when a sub is due, **the swap as a relay card**: incoming name, outgoing name, POSITION, in speaking order, readable at arm's length (owner rehearsal, 2026-08-08: mid-play the coach's job is warning kids and giving clear position instructions — the screen scripts what the coach shouts).
**Hierarchy (three states, three kings):** ambient — the countdown dominates (the screen answers "when"); sub-due — the relay card dominates and everything else recedes (the screen answers "who, where, say it"); break — keeper picker + the proposed next-period line-up as reviewable defaults dominate, ending in the announce view (owner, 2026-08-08: half-time = choose the new keeper → adjust formation if the game demands it → review/adjust default positions → tell everyone the new line-up — the setup ritual in miniature, with formation change as a first-class break action, not buried). The current screen's dominance-1.0 failure is trying to be all of these at once. **Score keeping is the standing exception** (owner, 2026-08-08): goals arrive at random moments — score entry stays one tap away in ALL states, never dominant, always undoable, attribution deferred to the summary.
**Boundaries:** time accrues only while running; undo restores exactly; field size preserved through every sub type; sub times match the Plan page (P3 ✓ block); backgrounding saves immediately (P4.5).
**Choice budget:** 8 *(current UIMAP count: 12 — the declutter target)*

## Plan page · `subOrderOv`

**Mode:** PLAN
**Purpose:** See and shape the whole game's sub schedule — **a midweek planning tool, full stop** (owner, 2026-08-08: planning happens during the week or is preset; and the Plan page does NOT live on the game view — a second cockpit inside the live game complicates it). Mid-game doubt is answered by the game screen's own ambient info (countdown, coming swaps, bench rest) — never by dropping the coach into build mode. Preview never lies about the live game.
**Flow change this creates (build work):** the Plan tab leaves the live game's tab bar / view cycle; the Plan page is reached from the team context (midweek) instead.
**Scenarios (owner, 2026-08-08):** the Plan-mode object is the **game-day scenario** — multiple named plans per team ("full squad", "only 9", "vs Wanderers"), built midweek, pulled up in Play mode. The saved-profile machinery (P6) already does the storage/apply; the gaps are identity (name plans as scenarios, not profiles) and **smart offer** — squad select knows the headcount (and, with the opposition log, the opponent) and should propose the matching scenario rather than make the coach browse.
**Serves:** P6 (all), P4.4b
**Primary action:** `subOrderApply()` — apply the plan to the game.
**Secondary:** `planScrubStep()` / `planScrubLive()` preview, `setPlanFormation()`, `planClearField()` / pick starters, `soAdj()` steppers, `saveCurrentPlanPrompt()` (menu), `applyPlanProfile()` / `pickSquadPlan()`, plan drawer
**Must show:** the timeline of swaps at their real times, projected minutes per player, LIVE vs preview state, which period is being described.
**Boundaries:** pitch + chips + minutes stay in sync (P6.2); at a break it describes the upcoming period only (P4.4b ✓); game-day edits never corrupt the saved profile (P6.5 ✓).
**Choice budget:** 9 *(current UIMAP count: 12)*

## Summary · `s5`

**Mode:** PLAY
**Purpose:** The whistle ritual: **confirm the score, name player of the match** — then pocket the phone. Enrichment (opponent, location, scorers) is car-park work, not huddle work (owner rehearsal, 2026-08-08).
**Serves:** P5.1, P5.2, P5.3
**Primary action:** `saveMatch()`
**Secondary:** score confirm, player-of-the-match pick, opponent/location fields (deferred-friendly), scorer picker (deferred-friendly), `showScr()` (skip/home)
**Must show:** final score front and centre for confirmation; per-player minutes (true totals, including keeper time); the game log.
**Boundaries:** displayed minutes are true totals even though rotation used outfield-only seconds (v2.9.5 rule); saving clears the active game (P5.3).
**Feature gaps this brief creates (owner-requested, not yet built):** ① player of the match — no concept in the data model or UI; announced to the huddle, so the picker must be huddle-fast. ② enrich-later — history detail is read-only (P5.4), so deferred fields currently have nowhere to be filled in afterwards; deciding scorers in the car park needs edit-from-history.
**Choice budget:** 5

## Match history · `s6`

**Mode:** PLAN
**Purpose:** Find a past game and reread it. A midweek surface — calm, two-handed, density welcome (owner, 2026-08-08: midweek screens may be information-rich; matchday screens may not).
**Serves:** P5.4
**Primary action:** `showMatchDetail()` on a match row.
**Secondary:** `showScr()` (back), `toggleGlobalMenu()`
**Must show:** matches newest-first with result and date; empty state that says how history gets here.
**Boundaries:** detail view is read-only (P5.4) — in tension with the enrich-later decision (see `s5` gap ②).
**Feature gap (owner-requested, 2026-08-08): the opposition log.** Opponents become entities that accumulate across matches — formation they played, notes for next time, results record — and surface as pre-game intel during setup when the same opponent is picked again ("last met: their shape, your notes, the result"). History is where the log is browsed; setup is where it pays off.
**Choice budget:** 5

## App drawer (all screens) · `drawer`

**Mode:** BOTH
**Purpose:** Everything that is not the game: settings, help, account, feedback — one predictable place, same shape on every screen.
**Serves:** P7.1, P7.4
**Primary action:** context row for the current screen (Edit Team / Sub Plan / End game).
**Secondary:** `openSoundPicker()`, `openHelp()`, sign in/out (`sendMagicLink()` / `signOutCloud()`), `openFeedback()`, `openFlowExport()`, Donate
**Must show:** screen-specific rows first, universal rows after, sign-in state truthfully (P7 ✓ — reachable with a team saved).
**Boundaries:** End game is the only destructive row and must read as such; drawer never holds game-critical controls (everything mid-game must be reachable without it).
**Choice budget:** 9
