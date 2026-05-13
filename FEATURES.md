# Sub Timer — Feature Catalogue & Review

**Version:** v1.4-beta · **Last reviewed:** 2026-05-11
**Source:** `sub-timer.html` (single-file HTML/CSS/JS) · **Live:** https://sub-timer.vercel.app

This document catalogues every user-facing feature, what it does, and any known edge cases or gotchas. Use it as a regression-test checklist before each release.

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

| Sport | Formats supported |
|---|---|
| **Soccer** | 4v4 (U6), 5v5 (Futsal / 5-aside), 6v6 (Summer 6-aside), 7v7 (U8–9), 9v9 (U10–11), 11v11 (U12+) |
| **Netball** | Set (U8), GO (U10), Junior (U13), Open (Senior 14+) |

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
| AI roster import from photo | OpenAI `gpt-4o-mini` with vision via Supabase Edge Function `extract-roster`. Names ≤ 30 chars, max ~25 players. |
| Delete team | Confirm dialog → removes locally + on cloud. |
| Set up incomplete teams | If team has no format or too few players, the home card shows a yellow "Set up" button instead of green "Start". |

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
- **Sub Frequency** stepper (2–15 min). *Continuous across both halves* — cadence doesn't restart at HT.
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
| Game log | Subs, goals (with scorer), period boundaries. |
| Opponent + location fields | Free text, saved with match. |
| **Save Match ✓** | Writes to localStorage + pushes to cloud. Active game cleared. |
| Buy me a coffee CTA | Visible above the fold on summary. |
| Match History (S6) | List of saved matches, most recent first. |
| Match detail view | Read-only summary of a past match. |

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

**AI:** OpenAI `gpt-4o-mini` via Supabase Edge Function `extract-roster`.
