# Data & Privacy Policy

> **Written at v2.9.2-beta.** Internal engineering policy, not the public-facing
> privacy notice. Its job is to record what data exists, what leaves the device,
> and what the rule is for the next feature.

---

## Proportionality first

Sub Timer holds a junior sports roster. In normal use that is **first names and
jersey numbers** — low-sensitivity, and it would be silly to treat it as a
compliance exercise.

This document exists for a narrower reason. The app gained cloud sync, share
links, photo import and game-flow export across roughly ten versions, each a
reasonable step on its own, and nothing was tracking the cumulative picture. The
point is not that today's data is alarming. It is that **the next feature should
have something to check itself against** — which was missing when the
game-flow recorder's pseudonymisation decision was taken.

---

## What we actually hold

### On the device (`localStorage`)

| Key | Contents | Personal data? |
|---|---|---|
| `subTimerTeams` | Teams: name, sport, format, **player names**, positions, sides, feet, numbers, prefs | Yes — names |
| `subTimerMatches` | Saved matches: score, opponent, **location**, per-player minutes, full game log | Yes — names + place |
| `subTimerActive` | The in-progress game (full state) | Yes — names |
| `subTimerFlows` | Last 12 game recordings, **pseudonymised at write time** | No — "Player 1, 2, 3…" |
| `subTimerSoundPack`, `subTimerTheme`, `aflTilt`, `aflView` | Display preferences | No |
| `subTimerTipIdx`, `subTimerTipsDismissed`, `subTimerLastSeenVersion` | UI state | No |
| `subTimerDevMode` | Dev-panel flag | No |

### Cache Storage (v2.9.3)

The service worker caches the app shell so it opens without a network. It holds
`index.html`, `manifest.json` and the three icons — **no personal data**, and
nothing game- or team-related. Cache name is version-stamped, and old versions
are deleted on activate.

Recorded here because rule 1 says a new place to put data gets a row before it
ships, not after. This one holds none, but the rule is about the *place*.

### Leaving the device

| Destination | Payload | Notes |
|---|---|---|
| Supabase `teams` | owner id, team name, **player names**, positions, sides, feet, numbers | Signed-in users only |
| Supabase `matches` | owner id, team name, opponent, **location**, format, scores, **per-player minutes**, **full game log** (names, scorers) | Signed-in users only. **Insert/select only — there is no delete path.** |
| Supabase `feedback` | user id (if signed in), email, message, app version, user agent | Anyone may insert |
| Edge fn `extract-roster` | **A photograph**, base64 | See below — the widest egress in the app |
| Share link (`#team=ST1.…`) | The entire team payload, base64 in a URL | Unauthenticated. Anyone with the link has the roster |
| Game-flow export | Setup + actions + timings, **names replaced with "Player N"** | Safe to send by design |

---

## The two that deserve a decision

### 1. Photo roster import is the widest egress

`extract-roster` uploads **an arbitrary photograph** to a server-side vision
model. The intended subject is a team list — but a photographed club team sheet
routinely carries far more than first names: surnames, parent contact numbers,
dates of birth, medical notes. The coach frames the shot; the app sends whatever
is in it.

Everything else in this table is structured data we chose the shape of. This one
is unbounded, and it is the only place the app can send data it has never seen.

**Rule:** the capture UI must say what is being sent and where, before the
picker opens. Open question for the owner: whether the image should be discarded
server-side immediately after extraction, and whether that is currently
guaranteed (the edge function is outside this repo — **unverified**).

### 2. Names are more than first names by design

The screen shows first names, which makes it easy to assume that is all we hold.
It is not. `fn()` splits on whitespace and renders the last word as an initial —
`"Sarah B"` — so the app is *built* for full names, and any coach with two
Sarahs is pushed straight into entering surnames. The raw string is what is
stored, synced and shared.

**Open decision (owner):** whether the share link should carry the raw string or
strip to first name + initial. Stripping breaks nothing — the receiving app
renders through `fn()` regardless.

### 3. Match history has no delete path

`matches` is insert-and-select only. A coach can delete a team locally and in
the cloud, but saved matches — which contain names, minutes and a location —
cannot be removed. Worth closing whether or not anyone asks.

---

## Rules for new features

1. **Anything leaving the device is checked against the table above first.** If
   a new field, key or destination is not in it, add it in the same change.
2. **Default to pseudonymised for anything diagnostic.** Debug, telemetry and
   export paths carry `Player N`, not names. Game-flow export already does this;
   it is the standard, not an exception.
3. **Free-text fields are unbounded.** Team name, opponent, location and player
   name accept anything a coach types. Do not assume the shape of their contents
   when deciding where they can go.
4. **Anything unauthenticated is a bearer token.** A share link is a credential
   in a URL. New sharing features state their expiry and revocation, or state
   explicitly that they have neither.
5. **Never log personal data to the console or to error reports.**

---

## What is enforced

| Rule | Check |
|---|---|
| Exported game flows contain no raw player names | `test/flow.mjs` — asserts every `setup.avail` entry and every playing-time key matches `Player \d+` |
| Storage keys are inventoried | `test/privacy-check.mjs` — fails if `index.html` uses a `localStorage` key with no row in this document |

Not enforced, and deliberately so for now: cloud payload shape (the schema lives
in Supabase, not this repo) and the edge function's image retention (outside
this repo). Both are noted above as unverified rather than assumed safe.
