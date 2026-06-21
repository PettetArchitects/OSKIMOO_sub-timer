# Sub Timer — Desired UX Pathways

> **The intended experience — the source of truth for "is this a bug?"**
>
> `docs/UIMAP.md` records what the app *actually* wires up (auto-generated).
> This file records what the experience *should* be: the journeys a coach takes
> and what must be true at each step. **A bug is where the actual behaviour
> diverges from a pathway here.** Hand-authored; this is the oracle, so keep it
> describing intent, not current implementation.

## Precision standard (write every step to this bar)

Each step is precise about **observable intent**, and silent about **mechanism**.
State exactly three things — and nothing finer:

1. **Trigger** — what the coach does, in their words ("tap a player who isn't here").
2. **Observable result** — what they should see/can verify ("that player greys
   out; the playing count drops by one").
3. **Boundary** — what must stay true ("can't drop below the format's onField").

**Do NOT** write function names, CSS classes, state variables, or render order —
that's the job of `UIMAP.md`. Keeping intent implementation-free is what lets
this doc *disagree with the code when the code is wrong* (the whole point of an
oracle). Too vague → tests assert the wrong thing; too precise → the doc just
mirrors the code and can't catch bugs. Aim for "a coach could check it by
looking."

## How a step becomes enforceable control

Each ✓ line is an **assertable invariant**. Tag it with what enforces it, so the
doc is an executable map, not just prose:

- `✓ …  [smoke: <check name>]` — guarded by an automated test
- `✓ …  [hunt: I#]` — guarded by a hunt invariant
- `✓ …  [🔴 unguarded]` — intended but nothing tests it yet (this is the backlog)

When you change an intended result here, the guarding test must change too — and
the app must comply. That loop (edit intent → test enforces → app conforms) is
the control. Untagged ✓ lines are the to-do list for the UI-driven hunt.

> Format: each pathway = a sequence of **steps** (Trigger → Observable result,
> per the standard above). ⚠️ marks a known risk area (where bugs have lived).

Status key: 🟢 fully covered by automated tests · 🟡 partially · 🔴 not yet.

---

## P1 — Team setup 🟡

**Goal:** get a squad into the app, ready to play.

| # | Action | Expected result |
| --- | --- | --- |
| 1 | Home → New Team | Sport picker appears |
| 2 | Pick a sport | Format/grade picker scoped to that sport |
| 3 | Pick a format | Team editor opens; format + sport stamped on the team |
| 4 | Add players (type, or **paste "Name POS"**, or sample squad, or photo import) | Each name becomes a player; an inline position (e.g. "Sofia DEF") is parsed into the name + a position tag ⚠️ |
| 5 | Tag positions (per-player or **bulk tag**) | Tags persist; survive rename; removed on delete ⚠️ |
| 6 | Name the team, Save | Team appears on Home; ready (green) if it has a format + enough players, else "Set up" (yellow) |

✓ A saved team round-trips (positions, numbers, side/foot) through edit → save → reopen.  [🔴 unguarded]
✓ Add / remove player changes the squad size.  [edit: add player grows the squad / remove player shrinks]
⚠️ Renaming player A to player B's existing name must **not** silently overwrite B's tags. *(known limitation, 🔴 unguarded)*

---

## P2 — Pre-game setup 🟢

**Goal:** choose who's here and how subs will run, then kick off.

| # | Action | Expected result |
| --- | --- | --- |
| 1 | Team card → Play now | Squad-select screen, **everyone selected by default** (the whole roster is assumed present) |
| 2 | **Deselect the no-shows** — tap any player who isn't here to take them out | Tapped players are removed (greyed/struck-through); footer shows playing / out / subs count; can't proceed below the format's onField |
| 3 | (Optional) Settings: period length, sub frequency, **players-per-sub (1–4)**, strategy | Values clamp to valid ranges; strategy applies ⚠️ matched multiples (3–4) |
| 4 | Pick starting line-up + keeper (or auto-fill) | Field fills to onField; keeper on field; a pure-GK is never auto-placed outfield ⚠️ |
| 5 | Kick off | Live game screen; clock at 0; correct XI on the pitch |

✓ Field fills to onField; keeper is on the field.  [smoke: pick-starters fills field to onField / keeper is on the field]
✓ A pure-GK is never auto-placed in an outfield slot (benched instead).  [smoke: displaced pure keeper is benched, not stranded outfield · hunt: I7]
✓ Keeper is the coach's manual pick; a benched pick swaps onto the field.  [smoke: benched player becomes keeper, on field]
✓ Projected minutes reflect the chosen keeper + line-up (keeper = full game).  [smoke: keeper is the top projected-minutes player / keeper is credited the full game]
✓ Squad-select can't proceed below onField; exactly-onField = no bench.  [edit: squad equals onField (no bench)]

---

## P3 — Live game 🟢

**Goal:** run the match — clock, subs, score — without surprises.

| # | Action | Expected result |
| --- | --- | --- |
| 1 | Start / pause clock | Time accrues only while running; pause holds position |
| 2 | Auto-sub fires at sub time | Banner suggests off/on per strategy; confirm applies it |
| 3 | Manual sub | Opens the same prompt on demand |
| 4 | Undo last sub | Restores on-field, bench, pairs, minutes; removes the log entry; doesn't cross a period break |
| 5 | Injury sub | Tap player → back-to-bench (re-enters queue) or out-for-game (removed from rotation) |
| 6 | Score +/- | Goal logged on +; most-recent goal removed on −; never negative |
| 7 | Equal-time rotation over the game | Minutes converge to even; nobody benched the interval after they came on ⚠️ |

✓ A sub changes the on-field set; undo restores it exactly.  [smoke: trigSub changed the on-field set / undoLastSub restores the line-up]
✓ Manual + injury subs preserve the field size.  [edit: manual sub changed the line-up · injury(minor/out): field size preserved]
✓ Equal-time rotation evens minutes (spread ≤ 5m), no on-then-off churn.  [smoke: outfield minutes are even / no player benched right after coming on · hunt: I5]
✓ Score increments log a goal; decrement removes the most recent; never negative.  [sports: score never negative / decrement removed a logged goal]
✓ Live sub times match the plan: subs restart each period (sf, 2·sf, …), so the live game fires at exactly the times the Plan page + preview show — even when the frequency doesn't divide evenly into the period.  [edit: half 2 restarts / live engine matches the Plan page]

---

## P4 — Breaks & resume 🟡

**Goal:** manage the gap between periods, and survive interruptions.

| # | Action | Expected result |
| --- | --- | --- |
| 1 | Reach a period break (HT, or **Q1/Q3 in quarter sports**) | Break state shown; clock stopped ⚠️ quarter breaks under-tested |
| 2 | Change the keeper for the next period | **Keeper picker is available throughout the break**, regardless of sub-preview position ⚠️ |
| 3 | Adjust / confirm the next-period line-up | Edits apply to the upcoming period; 1st-period keeper stays on field next period (youth rule) |
| 4 | Start the next period | Clock resets to 0; chosen keeper + line-up carry in |
| 5 | **Switch apps / lock phone mid-game** | Game is saved immediately; reopening offers Resume with clock + score intact ⚠️ |
| 6 | Resume from Home banner | Restores the exact in-progress state |
| 7 | Discard | Clears the saved game |

✓ Keeper picker stays available all through the break, even with the sub preview stepped.  [smoke: keeper picker STILL shown after stepping the sub preview · hunt: I8]
✓ Chosen 2nd-period keeper + line-up carry in; 1st-period keeper stays on field next period.  [smoke: 2nd-half keeper carried into period / 1st-half keeper stays on the field in the 2nd half]
✓ Reset-half restores the kickoff XI + clock.  [edit: reset restores the kickoff XI]
✓ Backgrounding the app saves the live clock + score immediately.  [edit: backgrounding (hidden) saves the game / saved snapshot preserves the live clock + score]
✓ Resume restores the exact in-progress state; discard clears it.  [edit: clock/score/line-up restored · discardActiveGame clears storage]
⚠️ Quarter-sport breaks (Q1/Q3) carry the same guarantees — only soccer half-time is tested.  [🔴 unguarded]

---

## P5 — Post-game & record 🔴

**Goal:** capture the result and review it later.

| # | Action | Expected result |
| --- | --- | --- |
| 1 | Final whistle | Summary: score, per-player minutes, game log |
| 2 | Add opponent / location, pick goal scorers | Fields + scorer tags saved with the match ⚠️ scorer picker untested |
| 3 | Save Match | Written locally (+ cloud if signed in); active game cleared |
| 4 | Match History → open a past game | Read-only summary of that match |

🔴 Scorer/assist picker, Save Match, and history view are not yet covered by automated tests.

---

## P6 — Plan-ahead & saved plans 🟡

**Goal:** pre-build a sub plan, reuse it, and tweak it on game day.

| # | Action | Expected result |
| --- | --- | --- |
| 1 | Team → Plan ahead | Plan page in build mode; set format, formation, sub plan |
| 2 | Build / preview the sub plan (Next / Prev / Live) | Pitch + chips + projected minutes stay in sync; preview never contradicts the live line-up ⚠️ |
| 3 | Save the plan as a profile; rename / delete | Profile persists per team (and syncs to cloud); applies on a future game. "Save plan" is in the Plan-page menu in **any** mode (v2.8.4 — was Custom-only) |
| 4 | Start a fresh game from a saved plan | Game begins with that plan's line-up, keeper, formation, timings + schedule |
| 5 | **Modify the applied plan on game day** | Plan-page edits (keeper, starters, settings) apply to the live game and **do not corrupt the saved profile** |

✓ Save → reuse restores the plan's line-up + keeper; game-day edits take effect and leave the saved profile intact.  [edit: reusing the plan restores its keeper / live edits do NOT corrupt the saved plan]
✓ Applying a plan (rebuilding the game) while the pitch is mid-render doesn't crash.  [edit: projected minutes still compute after modify]
✓ "Save plan" is reachable in Auto mode, not only Custom (Edit Lineup stays Custom-only).  [edit: Save plan button is shown in Auto mode / Edit Lineup stays Custom-only]
🔴 Rename / delete profile, and the AUTO-mode discoverability of "save plan", not yet covered.

---

## P7 — Account & cloud sync 🔴

**Goal:** keep teams + history across devices.

| # | Action | Expected result |
| --- | --- | --- |
| 1 | Sign in (email magic link) | Signed-in chip; initial sync merges cloud + local |
| 2 | Edit / delete a team | Change pushes to cloud |
| 3 | Save a match | Pushes to cloud (insert) |
| 4 | Sign out | Returns to anonymous; local data stays |
| 5 | Sign in on another device | Teams + match history appear |

🔴 Cloud flows need a cloud environment to test; currently unverified.

---

## How this drives bug-finding

1. **Each ⚠️ is a known risk** — prioritise hunt/test coverage there.
2. **Each ✓ is an assertable invariant** — it should map to a test in
   `smoke/sports/edge`, or a hunt invariant in `test/hunt.mjs`.
3. **Coverage gaps (🔴/🟡)** are the backlog: P5 (post-game record), P6 (saved
   plans), P7 (cloud) are unmapped to tests; P1/P4 are partial.
4. When the app's actual behaviour (per `UIMAP.md` / a real run) diverges from a
   step's expected result here, that divergence **is the bug** — file it.

_Maintenance: update a pathway's status as coverage lands; add new pathways as
features ship. This file describes intent — don't let it drift into describing
bugs as if they were intended._
