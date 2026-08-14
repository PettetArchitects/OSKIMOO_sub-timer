# Sub Timer — Feature Catalogue & Review

**Version:** v2.9.37-beta · **Last reconciled:** see git history for this file
**Source:** `index.html` (single-file HTML/CSS/JS) · **Live:** https://sub-timer.vercel.app

This document catalogues every user-facing feature, what it does, and its
automated-test status. Use it as the map for testing and as a regression
checklist before each release.

> **Reconciliation note (v2.8.0 audit).** This catalogue was last written at
> v1.4–v1.6 and had drifted ~50 versions. It has been reconciled against the
> current `index.html`, verifying each claim exists in code (and, where
> feasible, that it behaves). Headline corrections from the audit:
> - **5 sports now, not 2:** soccer, netball, **AFL, basketball, water polo**
>   (23 formats total). Earlier copy listing only soccer + netball is updated
>   in §2.
> - **Source file renamed** `sub-timer.html` → `index.html`.
> - **Sub-strategy UI collapsed.** The data model still defines three strategies
>   (`fair`=Equal time, `paired`=Matched, `planned`=Custom — see §10), but the
>   **UI only exposes a 2-way Auto / Custom toggle** (`renderSubOrderTabs`,
>   `renderSsStratGrid`). "Auto" silently resolves to fair-or-paired. This
>   doc/UI mismatch is itself a known source of coach confusion.
> - **Group size (`cfg.sc`) is 1–4** — matched **multiples**, not just pairs.
> - **Test status added** per area (✅ tested / 🟡 partial / ❌ untested) against
>   the suites in `test/` (smoke, sports, edge; hunt is exploratory only).
> - Confirmed still-present (I'd earlier under-counted these): AI roster import
>   (now also an AI **plan** mode), sound packs, bench-reorder chevrons,
>   side/foot pickers, opposition-formation logging.

Legend: ✅ tested · 🟡 partial · ❌ untested (automated coverage in `test/`).

---

## 1. Authentication & Cloud Sync

| Feature | Behaviour | Status |
|---|---|---|
| Magic-link email sign-in | Email → Supabase OTP via Resend SMTP. JWT stored, auto-refresh handled by Supabase JS. | ✅ |
| Auto sign-in on launch | Refresh token rehydrates `cloudUser` on page load. | ✅ |
| Sign out | Clears local session, returns to anonymous mode. Local teams + matches stay. | ✅ |
| Initial sync after sign-in | `doInitialSync` pulls cloud teams + matches, merges with local. | ✅ |
| Push on team edit | `saveAndBack` fires `pushCloudTeam`, sends `{name, sport, format, players, positions}`. | ✅ |
| Push on team delete | `deleteCloudTeam` removes the row by `cloud_id`. | ✅ |
| Push on match save | `saveMatch` fires `pushCloudMatch` (insert-only). | ✅ |
| Positions smart-merge | Cloud non-empty wins; else local non-empty preserved. Recovered locals get re-pushed. | ✅ (fixed Apr 2026) |
| Players smart-merge | If local has more players than cloud, local wins and is re-pushed. | ✅ (fixed Apr 2026) |
| Sync indicator on auth chip | Dot turns amber while syncing, red on sync error. | ✅ |

**Known limitations:**
- Name / format edits during a failed-push + sync window can be overwritten (needs per-field timestamps).
- Active game state (`G`) is **local-only** — no cross-device resume.

---

## 2. Multi-sport Core

| Sport | Periods | Keeper | Formats | Test |
|---|---|---|---|---|
| **Soccer** | 2 halves | 5v5+ | 4v4, 5v5, 6v6, 7v7, 9v9, 11v11 | ✅ |
| **Netball** | 4 quarters | no | Set (U8), GO (U10), Junior (U13), Open (14+) | ✅ |
| **AFL** | 4 quarters | no | Auskick, U9–U16, Senior (10 formats) | ✅ |
| **Basketball** | 4 quarters | no | 5v5 | ✅ |
| **Water polo** | 4 quarters | yes | Junior 25m, Senior 30m | ✅ |

_All 23 formats run a full game to summary in `test/sports.mjs` (220 checks)._
_AFL adds goals+behinds scoring; quarter sports have 3 breaks (Q1/HT/Q3)._

- Sport stamped on team at creation (`pickSport` → `pickFormat`).
- Legacy teams missing `sport` are migrated on load from the format key (e.g. `nb-go` → `netball`).
- `SPORTS` config drives period labels (halves vs quarters), positions, pitch graphics.

**Edge cases tested:**
- Loading a pre-multi-sport team correctly resolves to soccer.
- Switching a team's format to a different sport's format is **not possible via UI** (format picker is scoped to the team's sport).

---

## 3. Team Management

| Feature | Notes |
|---|---|
| Create team via sport → format → editor flow | New team gets a unique `id`, blank players array. |
| Edit team name | Free text, falls back to "Untitled Team" if blank. |
| Add / remove players | `addPlayerField` / `removePlayerField`. Empty rows filtered on save. |
| Position tag assignment | Tag any player with any combination of position labels (GK/DEF/MID/WNG/FWD for soccer; GS/GA/WA/C/WD/GD/GK for netball). |
| Position tags survive rename | `onPlayerNameChange` migrates the position-map key when a name changes. |
| Position tags removed on delete | `removePlayerField` deletes the player's entry from positions map. |
| AI roster import from photo | `sb.functions.invoke('extract-roster', {imageBase64})` — vision model via Supabase Edge Function. ❌ untested (server-side; needs cloud). |
| **AI sub-plan from photo** (newer, not in v1.x doc) | `extract-roster` with `mode:'plan'` — reads a roster/plan image and builds the sub plan. ❌ untested. |
| Delete team | Confirm dialog → removes locally + on cloud. |
| Set up incomplete teams | If team has no format or too few players, the home card shows a yellow "Set up" button instead of green "Start". |
| **Team share link / access code** (v2.8.5) | **Share team** in the team-action menu builds a self-contained link (`#team=ST1.<base64url JSON>`) carrying name, sport, format, roster, positions, sides/feet, numbers and game-settings prefs (`buildTeamShareCode` / `buildTeamShareLink`). Copy button + native share sheet where available. ✅ tested (edge) |
| Team share import | Opening a share link imports the team before first paint (`importTeamFromUrl` → `importSharedTeam`), strips the code from the URL, and shows a "TEAM IS READY — Play now" welcome that jumps straight to the squad picker. Paste-a-code fallback (`openTeamCodeEntry`) on the landing page. Re-importing the same code refreshes the copy in place (dedupe by `sharedFrom`); opening your own link never clones your team. Recipient needs no account. ✅ tested (edge) |

**Edge cases:**
- ⚠️ Renaming player A to player B's existing name **overwrites** B's positions (silent data loss, edge case). Not yet fixed.
- AI import skips lines that don't look like names; coach can manually correct.

---

## 4. Home Screen

| Element | Behaviour |
|---|---|
| Resume banner | Shows if `subTimerActive` localStorage key exists. Tap **Resume ▶** to jump back to game screen; **Discard** to wipe and start fresh. |
| Tips carousel | Six tips, dismissable. Index persisted to `subTimerTipIdx`; once dismissed, `subTimerTipsDismissed=1` hides forever. |
| Team cards | Sport icon + name + player count + format. Ready teams show **Edit ✏** + **▶ Start** buttons. Incomplete teams show **Set up** (yellow). Card-tap routes appropriately. |
| New Team / Match History | Side-by-side row (1:1 flex). |
| Buy me a coffee | Opens `https://buymeacoffee.com/spettet` in new tab. |
| Send feedback | Opens modal → writes to Supabase `feedback` table (anyone can INSERT). |
| BETA badge + version | Header shows `SUB TIMER [BETA] v1.4`. Landing hero matches. |

**Layout:**
- iPhone (<768px): app pinned to 430px, single column.
- iPad (768–1023px): app widens to 560px.
- iPad full / large (≥1024px): 640px.
- Format pills wrap to 3×2 grid.

---

## 5. Pre-game Setup Flow

### S1 — Squad selection
- Toggle players on/off for this match.
- Count footer shows `N playing · M out · K subs (need X+)`.
- "Next" disabled until enough players for the format's `onField`.

### S2 — Settings
- **Game Format pills** — switch on the fly (resets formation / GK to format defaults).
- **Formation pills** — short descriptors in-pill ("Balanced", "Possession diamond", etc.) for quick scanning.
- **Half Length** stepper (5–30 min).
- **Sub Frequency** stepper (2–15 min). *Per-period cadence* (v2.8.2) — subs restart at the top of each half/quarter (sf, 2·sf, …), matching what the Plan page + preview show, in every period.
- **Players per Sub** stepper (1–4).
- **Goalkeepers** dropdown (1H + 2H) — only shown for `hasGk` formats.
- **Sub Strategy** cards:
  - **Equal time** (default) — fair-play minute balancing.
  - **Paired rotation** — pre-grouped pairs swap together; pair with most game-time goes off.
  - **I'll call them** — manual, no auto-prompts.
- **Sub preview** — simulates the half's swap pattern.

### S3 — Lineup + GK
- Tap-to-arrange visual pitch (drag players into formation slots).
- 1st-half GK + 2nd-half GK pickers (for `hasGk` formats only).
- Pair groups shown beneath (rotation rotation order).
- "Start Game" launches S4.

**Edge cases:**
- Changing format on S2 resets formation if the old one doesn't exist in the new format's set.
- GK can be reassigned by tapping the goal area on S3 pitch.

---

## 6. In-game (S4)

### Clock + score
| Feature | Behaviour |
|---|---|
| Live clock | Centiseconds during play. Colour flashes amber 30s before sub, red 10s before. |
| "Next sub at" | Shows scheduled time of next sub; "No subs available" if bench is empty. |
| Score adjust ± | Tap +1 / -1 per team. Goal logged on increment; **last goal entry removed on decrement** (corrects fat-finger). Score clamps to 0. |
| Goal horn + scorer picker | Fires only for our team. Coach picks scorer from on-field players or skips. |
| Pause / Start | Toggles clock without losing position. |

### Sub flow
| Feature | Behaviour |
|---|---|
| Automatic sub prompt | At scheduled times — banner appears with off/on suggestions per strategy. Skipped in **Manual** mode. |
| Manual SUB button | Always available; opens the prompt on demand. |
| SUBS DONE confirms | Swap applies; pair index advances; log entry written. |
| **Undo last sub** | Yellow pill appears next to BENCH header after every confirmed sub. Restores on-field order, bench order, pair compositions, minutes accrued in the meantime, and removes the log entry. Cleared at halftime / period end. |
| Injury sub | Tap any on-field player → swap with longest-benched. Choice of "Back to bench" (normal sub) or "Out for game" (no return). |

### Bench
| Feature | Behaviour |
|---|---|
| Bench list | All players not on-field, in queue order. |
| Next-on highlight | Green border + ↑ icon + "for X at POS" hint shown on the player(s) up next. |
| **Reorder chevrons** | ↑/↓ buttons per row (hidden in Paired mode). Tap to promote/demote in queue. Persists immediately. |
| Mins display | Per-player playing minutes, updates each second. |

### Formation chips (above pitch)
- Our formation (green) — tap to switch mid-game.
- "vs" + opposition formation (red dashed) — tap to log what they're playing.
- Sub strategy chip — tap to change strategy mid-game (opens modal).
- Sound pack chip — tap to change alert sound mid-game (opens modal).

### Halftime overlay
- Auto-fires when clock reaches `cfg.hm * 60`.
- GK swap UI (if 2H GK differs from 1H).
- Period-aware label ("HALFTIME" for soccer, "QUARTER TIME" / "HALF TIME" / "THREE-QUARTER TIME" for netball).
- "Start 2nd Half ▶" continues.

**Known behaviours:**
- Undo snapshot **does not cross** halftime (sub-state can't be cleanly rolled across period boundaries).
- Game timer continues regardless of bench reorder.

---

## 7. Post-game (S5 + Match History)

| Feature | Behaviour |
|---|---|
| Match summary card | Score, formation, half-time GK change. |
| Playing time per player | Sorted by minutes desc. |
| Game log | Subs, goals (with scorer), period boundaries, injury subs, half resets, opposition-shape changes. Rows are built via shared `_logTimeLabel()` / `_logRenders()` so the summary and match-history renderers can't drift. |
| Break rotation attribution (v2.8.9) | The rotation `advH()` pre-applies at a break is tagged `atBreak` by `confSub()` and rendered as **HT** / **Q3**, below the break row — not as a substitution at the last second of the period that just ended. `period_end` is logged by `advH()` (when the break starts) rather than `startNextPeriod()`, so the break marker precedes the change. |
| Silent log types | `LOG_SILENT_TYPES` filters bookkeeping entries (`sub_strategy`) that previously drew a blank timestamped row at the top of every log. |
| Opponent + location fields | Free text, saved with match. |
| **Save Match ✓** | Writes to localStorage + pushes to cloud. Active game cleared. |
| Buy me a coffee CTA | Visible above the fold on summary. |
| Match History (S6) | List of saved matches, most recent first. |
| Match detail view | Read-only summary of a past match. |

---

## 6b. Period boundary / second-half setup (v2.8.7)

| Feature | Behaviour |
|---|---|
| 2nd-half keeper | `applySecondHalfKeeper()` runs from `startNextPeriod()` before `snapshotHalfStart()`. Puts the nominated `gk2` in goal at the start of the second half, bringing them on from the bench (displacing the outgoing keeper) if needed, remapping `G.pairs` so the new keeper leaves the outfield rotation and the old one rejoins, and logging a `gk` event. |
| Explicit-pick only | `gk2Explicit` gates the swap. `gk2` auto-defaults to a different player than `gk1`, so honouring the default would swap keepers in every keeper-format game. Set by the two GK `<select>`s and by `setPlanKeeper()` for a later period; cleared wherever `gk2` is defaulted/nulled and on `selectTeam()` (indices belong to one squad). Persisted through save/resume, plan profiles and game flows. |
| Scope | Two-period sports only, matching the setting's label and the plan's soccer-only `gk_swap` event. Quarter sports change the keeper by tapping at the break. |
| Break-aware Plan page | At a break `G.half` is still the *finished* period. `buildPlanTimeline()`, `computeProjectedMinutes()`, `getPlanScrubState()` and the period-column render all use `curP = G.atBreak ? G.half+1 : G.half` (and `curSecs = G.atBreak ? 0 : G.secs`) so the preview, the "NOW" tag and the projected minutes describe the period about to be played. |
| Guarded by | `test/secondhalf.mjs` — 68 checks, in the merge gate. |

---

## 7c. Dev mode (v2.8.8) — the test harness, inside the app

Hidden unless `?dev=1` has been visited on this device. Exists because every
test script used to hand-roll its own "jump the game to state X" helper, and
they drifted from the app: advancing `G.secs` without `G.elapsedMs` produced
screenshots reading `00:01` six minutes into a half. This is **one**
implementation of time travel, and it runs through `tickSecond()` — the same
per-second logic `tickLoop` runs — so a dev jump cannot diverge from a real game.

| Feature | Behaviour |
|---|---|
| Gating | `?dev=1` sets `subTimerDevMode` in localStorage and the flag is stripped from the URL (so a shared link never carries it). `?dev=0` or the in-panel button clears it. Nothing renders or wires when off. |
| Launcher | A `DEV` pill, bottom-right, `display:none` unless enabled. |
| Seed a game | `devSeedGame()` builds team → squad → format and lands on the pitch, for any of the 23 formats. |
| Jump the clock | `devAdvanceTo(period, secs)` simulates forward through `tickSecond()`, so subs fire and minutes accrue exactly as live. Skip-to-break and skip-to-full-time included. |
| Rewind | Supported **within the current period** by restoring `G._halfStart` and re-simulating; at a break the game is treated as sitting at the end of `G.half`. Rewinding across periods returns `false` (nothing records enough history to rebuild an earlier period faithfully) rather than silently doing nothing. |
| Clock coherence | `devFreezeClock()` stops the loop and sets `G.elapsedMs = G.secs*1000`. `renderG` paints from `elapsedMs` while `tickSecond` moves `secs`; skipping this reconciliation is the exact bug that made hand-rolled harnesses display the wrong time. |
| Replay a flow in-app | Paste an exported flow, `devFlowLoad()` rebuilds the game from `setup`, then Step/Play walk the actions. `auto` actions are reproduced by the clock advance, never re-applied. |
| State inspector | Live readout (400ms) of period, clock, on/bench, `gk` and `gk2` (flagged explicit vs default), pairs, `pairIdx`, subs done, settings and per-player minutes. |

---

## 7b. Game flow recording (v2.8.6)

Every game is recorded as a replayable **flow** so a bug seen on the sideline can
be reproduced exactly on a laptop, instead of being guessed at from a
description. The library of recorded games doubles as a regression corpus.

| Feature | Behaviour |
|---|---|
| Automatic recording | `flowBegin()` at kickoff captures the setup (squad, numbers, position tags, `cfg`, opening XI, keeper, rotation pairs, sub strategy/plan). Wrappers installed by `flowInstall()` then record every top-level coach action with the game clock and the state it produced. |
| Top-level only | A `_flowDepth` guard records only the outermost call — `trigSub()` calls `confSub()` internally, and recording both would double-apply on replay. |
| Auto vs tapped | Actions fired from inside `tickSecond()` (the timer's auto-sub, end of period) are flagged `auto:true`. The replayer reproduces those by running the clock, never by re-applying them. |
| Survives a refresh | `flowResume()` re-attaches to the stored flow via `G.startTime`, so a game interrupted at half-time stays one continuous recording. |
| Pseudonymised | Player names become `Player 1, 2, 3…` before anything is stored — consistently, and with duplicates preserved, so the two-players-same-name case still replays. Numbers and position tags are kept (they steer auto-fill and rotation). |
| Bounded | Last 12 games, 4000 actions each; a quota failure sheds the oldest games rather than throwing mid-match. |
| **Send game flow** | Menu (☰) → share sheet on mobile, file download on desktop, clipboard as fallback. Lists each recorded game with format, score and action count. |
| Replay | `node test/replay.mjs flows/<file>.json` rebuilds the game and reports **DIVERGENCE** (this build differs from the phone, localised to one step) and **INVARIANT** violations (duplicate player, keeper off field, squad not conserved, keeper inside a rotation pair). |
| Round-trip gate | `npm run flow` plays 10 scripted games — weighted to the second-half setup path — records each the way the app does, and replays it. That proves the recorder and the app agree, which is what makes a sent-in flow trustworthy. |

`tickLoop()`'s per-second body is factored out as `tickSecond()` so the live game
and the replayer run identical logic — the replay exercises the real code path,
not a model of it.

---

## 8. Visual / Polish

| Element | Notes |
|---|---|
| **Animated 2-3-1 dot logo** | Two dots flow in/out representing subs. Shown on empty home state and AI roster loading. |
| **Lucide icon library** | Via CDN. `<i data-lucide="X">` placeholders materialised by `lucide.createIcons()`. |
| **Custom soccer ball icon** | Tabler `ball-football` geometry inline (Lucide doesn't have one). |
| **Custom netball icon** | Lucide volleyball geometry inlined to ICON_CUSTOM so it renders without depending on the CDN bundle. |
| **BETA badge + version** | Header + landing hero. |
| **Dark theme only** | Light mode was tried then removed due to contrast issues. |

---

## 9. Sound Packs

Web Audio API synthesises six packs:
- **Classic** — quick beeps
- **Whistle** — coach's whistle
- **Air Horn** — stadium vibes
- **Bell** — gentle chimes
- **Retro** — 8-bit arcade
- **Silent** — vibrate only

Chosen on game screen via the bell chip. Stored globally in localStorage (`subTimerSoundPack`).

---

## 10. Sub Strategy — How Each One Picks

### Equal time (`fair`)
- **Off:** sort on-field (excluding GK) by minutes descending — take the top N (where N = `cfg.sc`).
- **On:** sort bench by minutes ascending — take the top N.
- Best for fair-play rules.

### Paired rotation (`paired`) — *grouped + equal time combined*
- **Off:** for each pre-grouped pair, compute total cumulative on-field minutes; pick the pair with the highest total still on field.
- **On:** sort bench by minutes ascending — take N (matching pair size).
- Result: pairs stay together AND minutes balance.

### Manual (`manual`)
- No auto-prompts at sub intervals.
- Tap SUB to fire; app suggests the same picks as Equal time as a default.
- Bench reorder chevrons let coach pre-arrange who comes on next.

---

## 11. Known Limitations / Future Work

| Area | Issue | Priority |
|---|---|---|
| Active game sync | `G` is local-only — can't resume on different device. | Future |
| Per-field sync timestamps | Name/format renames during failed-push + sync can be overwritten. | Future |
| Same-name positions | Renaming player A to player B's name overwrites B's tags (silent). | Low |
| Service worker | Not yet registered — no full offline support after first load. | Future |
| Senior / NPL competition mode | No 5-subs / 3-windows cap or no-re-entry mode. | Future (App Store) |
| Concussion sub helper | Not yet implemented. | Future |
| Mid-game team edits | Editing player roster while a game is in progress could leave dangling references in active-game snapshot. | Low |
| LocalStorage quota errors | `try/catch{}` swallows them silently — coach loses progress without warning. | Low |

### Player side + foot preferences (shipped in v1.6)

The data model and UI for capturing **side** + **foot** are live:

- `team.sides[playerName] = 'L' | 'R' | 'B'` (default `'B'`)
- `team.foots[playerName] = 'L' | 'R' | 'B'` (default `'B'`)
- Editor shows two segmented pickers under each player's position-tag row
- Soccer only — netball editor hides the pickers
- Both fields sync to cloud (new `sides` + `foots` JSONB columns); merge
  preserves the richer side, same pattern as positions
- Rename + delete handlers migrate side/foot keys alongside positions

**Still to do:** integrate these signals into `smartAssign` so the lineup
builder picks Hannah for LB over Bobby when Hannah is tagged side=L and
Bobby is tagged side=R. Currently the data exists but isn't yet read by
the lineup-assignment algorithm.

---

## 12. Smoke-test Checklist (run before any release)

- [ ] Create a new soccer team (e.g. 7v7), add 13 players, tag positions for half of them
- [ ] Sign in via magic link — confirm Resend email arrives, click link, see "signed in" chip
- [ ] Sign out, sign back in — confirm team + positions persist across the round-trip
- [ ] Start a game, run through to halftime, swap GK, finish 2nd half
- [ ] During play: trigger a sub, then **Undo Last Sub** — confirm everything reverts
- [ ] During play: reorder bench (move someone up), confirm "next on" highlight follows
- [ ] During play: tap +1 goal then -1 goal — confirm match log doesn't carry a phantom goal
- [ ] During play: try injury-sub on a starter, confirm bench swap + "out for game" tag
- [ ] Save match — open Match History, confirm entry appears with correct score
- [ ] Create a netball team — confirm netball icon (volleyball-style) shows, quarter labels in pitch
- [ ] Create a futsal 5v5 team — confirm 4 outfield + 1 GK, 1-2-1 default formation
- [ ] Hard-refresh app — confirm Resume banner restores game-in-progress if started
- [ ] Test on iPhone Safari + iPad Safari side-by-side — confirm scaling, sticky header stays at top

---

## 13. Quick Architecture Note

**Single-file HTML at `sub-timer.html`** → copied to `/tmp/dragonflies-sub-timer/index.html` on each push → Vercel auto-deploys to `sub-timer.vercel.app`.

**Storage:**
- `localStorage.subTimerTeams` — array of team objects
- `localStorage.subTimerMatches` — array of saved matches
- `localStorage.subTimerActive` — in-progress game snapshot
- `localStorage.subTimerSoundPack` — chosen sound pack
- `localStorage.subTimerTipIdx` / `subTimerTipsDismissed` — tips state
- Supabase tables: `teams` (with new `sport` column), `matches`, `feedback`

**Auth:** Supabase JS client → Resend SMTP for magic-link emails.

**AI:** vision model via Supabase Edge Function `extract-roster` (roster import
+ `mode:'plan'` sub-plan import). Edge function is server-side, not in this repo.

---

## 14. Test-coverage audit (v2.8.0)

Surface: **11 screens · 81 distinct user actions · 259 functions.** Of the 81
user actions, ~44 are exercised by an automated suite; **~37 have no automated
coverage.** The hunt (`test/hunt.mjs`) fuzzes the Plan page but does not count
as coverage.

### Covered ✅ (asserted by smoke / sports / edge)
Team create/edit/delete, add/remove players, sample squad, sport + **all 23
format** full games, clock start/pause, auto-sub + confirm, manual sub, undo,
injury sub (both modes), reset-half, equal-time rotation evenness, matched
**pairs**, projected minutes + keeper credit, pick-starters, keeper picker
(incl. bench pick + half-time), smart position auto-fill (incl. pure-GK
benching), save/resume/discard, live player removal.

### Not covered ❌ (prioritised by mid-game risk to a youth coach)
1. **Save-on-backgrounding** — *reported broken*; in-progress games can vanish
   when the phone backgrounds the tab. No `visibilitychange`/`pagehide` save.
2. **Matched multiples (`cfg.sc` = 3, 4)** — rotation tested only at pairs.
3. **Keeper + line-up at quarter breaks (Q1/Q3)** — half-time fix verified for
   soccer's single break only.
4. **Quick team setup parsing** — inline-position parse (`cleanupPlayerNames`,
   `stripTrailingPosition`) + **bulk tag** (`applyBulkTag`): parse user input,
   zero coverage.
5. **Scoring scorer/assist + match save/history** — `promptScorer`,
   `saveMatch`, `showHistory`.
6. **Cloud login + sync** — `sendMagicLink`, `pushCloudTeam`, `pullCloudMatches`
   (needs a cloud env to test).
7. **AI roster / plan import** — server-side; needs cloud.
8. **3D pitch (`afl3d`) + camera views** — large subsystem, view-only.
9. **Saved sub-plan profiles** — `applyPlanProfile`, `pickSquadPlan`,
   rename/delete profile.
10. **Sound packs, bench reorder, side/foot pickers, opposition formation** —
    present, untested.

### Stale claims corrected in this audit
- 2 sports → **5 sports / 23 formats**.
- `sub-timer.html` → **`index.html`**.
- 3-button strategy chooser (Equal/Paired/Manual) → **2-button Auto/Custom UI**
  over a 3-strategy model (fair/paired/planned).
- "Half Length 5–30" — soccer halves; quarter sports use per-quarter lengths.
- Side/foot data model exists but is **still not read by `smartAssign`** (the
  v1.6 "still to do" remains true at v2.8.0 — verified).

_Maintenance: update an area's ✅/🟡/❌ when its coverage changes; re-run the
existence sweep after large refactors to catch new drift._
