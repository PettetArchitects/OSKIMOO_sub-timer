# Sub Timer — Desired UX Pathways

> **The intended experience — the source of truth for "is this a bug?"**
>
> `docs/UIMAP.md` records what the app *actually* wires up (auto-generated).
> This file records what the experience *should* be: the journeys a coach takes
> and what must be true at each step. **A bug is where the actual behaviour
> diverges from a pathway here.** Hand-authored; this is the oracle, so keep it
> describing intent, not current implementation.
>
> Format: each pathway is a sequence of **steps**. Each step has the coach's
> **goal**, the **action**, and the **expected result** (✓ invariants). The
> expectations are what tests/hunts should assert. A ⚠️ marks a known risk area
> (where bugs have lived) worth extra coverage.

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

✓ A saved team round-trips (positions, numbers, side/foot) through edit → save → reopen.
⚠️ Renaming player A to player B's existing name must **not** silently overwrite B's tags. *(known limitation)*

---

## P2 — Pre-game setup 🟢

**Goal:** choose who's here and how subs will run, then kick off.

| # | Action | Expected result |
| --- | --- | --- |
| 1 | Team card → Play now | Squad-select screen; all players selectable |
| 2 | Toggle who's available | Footer shows playing / out / subs count; can't proceed below the format's onField |
| 3 | (Optional) Settings: period length, sub frequency, **players-per-sub (1–4)**, strategy | Values clamp to valid ranges; strategy applies ⚠️ matched multiples (3–4) |
| 4 | Pick starting line-up + keeper (or auto-fill) | Field fills to onField; keeper on field; a pure-GK is never auto-placed outfield ⚠️ |
| 5 | Kick off | Live game screen; clock at 0; correct XI on the pitch |

✓ Auto-fill respects each player's position tags; keeper is the coach's manual pick.
✓ Projected minutes reflect the chosen keeper + line-up (keeper = full game).

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

✓ The field count stays at onField through every sub; keeper stays on field.

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

✓ Backgrounding (visibilitychange/pagehide) persists the live state, not just the 5s checkpoint.

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

## P6 — Plan-ahead & saved plans 🔴

**Goal:** pre-build a sub plan before game day, reuse it.

| # | Action | Expected result |
| --- | --- | --- |
| 1 | Team → Plan ahead | Plan page in build mode; set format, formation, sub plan |
| 2 | Build / preview the sub plan (Next / Prev / Live) | Pitch + chips + projected minutes stay in sync; preview never contradicts the live line-up ⚠️ |
| 3 | Save the plan as a profile; rename / delete | Profile persists per team; applies on a future game |
| 4 | Start from a saved plan | Game begins with that plan's line-up + schedule |

🔴 Saved-plan profiles (apply/rename/delete) not yet covered.

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
