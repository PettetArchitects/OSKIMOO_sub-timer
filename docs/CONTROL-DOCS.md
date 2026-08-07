# Control Documents — register and gap audit

> **Audited at v2.9.4-beta.** Companion to `PROCESS.md`, which describes the
> Map → Gate → Hunt → Replay method. This file answers a narrower question:
> *which documents govern this app, which of them actually govern anything, and
> what is missing.*

---

## The one idea

**A document is only a control if something fails when it is violated.**

Everything else is a description — useful, but it drifts, and it drifts
silently. This repo has proof of that on both sides of the line.

**Enforced, stayed true.** `FEATURES.md`, `docs/UIMAP.md` and
`docs/UX-PATHWAYS.md` are checked by `test/docs-check.mjs` on every PR. They
have never been more than one commit out of date.

**Unenforced, rotted.** `design.md` declares itself *"the canonical reference for
every design token"* and instructs, in §10, *"update this document first, then
implement against the spec."* Nothing checked it. By v2.8.9 it still said
**v2.7.83** — 26 versions stale — and a whole panel had shipped using three
invented purples when `--accent-purple` already existed and already meant
exactly that. The rule was written down, prominently, and was still broken by
the next person to touch the code, because nothing objected.

**A worse failure mode: a control that is confidently false.** `design.md` §8
states *"Hit targets ≥ 44×44pt (iOS HIG minimum)"*. Measured against the running
app on the game screen:

| §8 claim | Measured |
| --- | --- |
| Every interactive element has an accessible name | ✅ 0 of 25 missing |
| Hit targets ≥ 44×44pt | ❌ **18 of 25 below** — the −/+ steppers are 18×18 |

An unverified control doesn't merely go stale; it can assert the opposite of
reality while everyone cites it. That is worse than having no document, because
it stops people looking.

---

## The register

| # | Category | Document | Enforced by | Status |
|---|---|---|---|---|
| 1 | Design system / tokens | `design.md` §2 | `test/design-check.mjs` (ratcheted) | ✅ enforced |
| 2 | Component inventory | `design.md` §3–4 | `test/ui-check.mjs` (type/radius/button ratchets) | 🟡 counted, not yet governed |
| 3 | Information architecture | `docs/UIMAP.md`, `architecture.md` §2 | `docs-check` (every wired control listed) | ✅ enforced |
| 4 | UX journeys | `docs/UX-PATHWAYS.md` | `docs-check` (test tags must resolve) | 🟡 partial — see below |
| 5 | State & data model | `architecture.md` §3 | — | 🟡 described |
| 6 | Interaction & motion | `design.md` §2.6, §5.1 | — | 🟡 described |
| 7 | Feature catalogue | `FEATURES.md` | `docs-check` (version) | ✅ enforced |
| 8 | Accessibility | `design.md` §8 | `test/a11y-check.mjs` (names hard-fail, size ratchet) | ✅ enforced |
| 9 | Error / empty / loading states | `design.md` §6 | — | 🔴 a colour table, not a state catalogue |
| 10 | Content, voice & tone | — | — | 🔴 **absent** |
| 11 | Privacy & data handling | `docs/PRIVACY.md` | `test/privacy-check.mjs` (storage inventory) | ✅ enforced |
| 12 | Security (auth, RLS, share links) | `DEPLOY.md` (deploy only) | — | 🔴 **absent** |
| 13 | Performance budget | — | — | 🔴 absent |
| 14 | Telemetry / analytics | — | — | 🔴 absent |
| 15 | Localisation | passing mention | — | 🔴 absent |
| 16 | Process | `PROCESS.md`, `DEPLOY.md`, `LESSONS.md` | branch protection | ✅ enforced |

### Where category 4 is thin

`UX-PATHWAYS.md` defines seven pathways. **P5 Post-game & record** still contains
**no ✓ invariants at all** — it describes steps but asserts nothing, so nothing
about it can be enforced or contradicted. Saving a match is outside the oracle.

**P7 Account & cloud sync was in the same state until v2.9.4, and a real bug was
living in exactly that gap.** Sign-in was reachable only from the landing hero,
which renders when `teams.length===0 && !cloudUser` — so it vanished the moment a
coach saved their first team, and there was no way back. `#authChip` was never in
the markup, nothing opened `#appSettingsOv`, and the drawer's Sign in item was
promised in a comment and never written. Cloud sync had been unreachable for
every existing user, on production, for roughly 40 versions. Nobody noticed
because nothing asserted it.

That is the argument of this document in one incident: the empty pathway was not
a documentation chore, it was the bug's hiding place. P7 now has its first
assertion and is 🟡.

---

## Gaps, in the order worth closing

### 1. Privacy & data handling — ✅ CLOSED at v2.9.0 (`docs/PRIVACY.md`)

Written up with a full data inventory and enforced by `test/privacy-check.mjs`,
which fails if a `localStorage` key appears with no row in the document. Writing
it surfaced two things bigger than the share link that started the discussion:
**photo roster import** uploads an arbitrary photograph to a server-side vision
model (a club team sheet carries far more than first names), and **match history
has no delete path**. Both are recorded there with the open decisions marked.

The original framing, kept because the reasoning still holds:

This app holds **children's first names**. It syncs them to Supabase, and its
share links carry an entire roster — names, jersey numbers, positions — encoded
in a URL that gets pasted into group chats.

There is no document stating what is collected, what leaves the device, what is
retained, or what is acceptable to add. The absence is not theoretical: while
building the game-flow recorder, a decision was taken to pseudonymise player
names before export. That call happened to be right, but it was made with
nothing to check it against, and the next such call may not be.

**What would close it:** a `docs/PRIVACY.md` stating the data inventory (what is
stored, where, for how long), the rules for anything leaving the device, and the
default for new features. Enforceable parts: assert that exports contain no raw
player names (the game-flow suite already does this), and that no new
`localStorage` key or cloud table appears without a row in the inventory.

### 2. Accessibility — ✅ CLOSED at v2.9.1 (`test/a11y-check.mjs`)

Walks eight screens in a real browser at 390×844. Accessible names are a **hard
fail** (114 controls, all named). Hit targets are **ratcheted at 34** below
44×44 — the standard is now stated as a target with the real number beside it,
because §8 previously asserted the minimum flatly and was false.

Checking all eight screens rather than just the game screen roughly doubled the
count (18 → 34) and turned up a genuine bug the a11y lens found first: an
**unlabelled 4×4 button on the home screen**. `#historyBtn` was left behind when
Match History moved into the team-action menu — its label stripped, but
`renderHome` still un-hiding it. Removed.

Remaining: the clock steppers (18×18) and tip arrows (24×24) are the worst
offenders, and sizing them is a **layout** decision — the steppers are small so
two clock anchors fit side by side on a phone. Focus rings are still effectively
absent and reported on every run.

### 3. Error / empty / loading states — a colour table, not a catalogue

`design.md` §6 lists how a state *looks*, not which states *exist*. There is no
inventory of what the coach sees when the roster is empty, the cloud is
unreachable, a share code is malformed, or the 3D pitch fails to initialise —
all of which the app handles, none of which are specified. `LESSONS.md` records
some of these as war stories after the fact.

### 4. Content, voice & tone — absent

The app speaks to volunteer parents mid-match. Copy is currently consistent by
luck, not by rule, and it is written by several hands (including agents). One
page of rules — sentence case, no jargon, second person, what to call a
substitution — would make that reproducible.

### 5. Security — only deployment is covered

`DEPLOY.md` covers branch protection and the deploy path well. Nothing covers
the Supabase RLS posture, what the anon key can reach, or the threat model of a
share link (it is an unauthenticated bearer token for a roster).

---

## Adding a control document

The pattern this repo has converged on, in order:

1. **Write the intent** in its own file, separate from the code, in observable
   terms — see the precision standard at the top of `UX-PATHWAYS.md`.
2. **Measure reality** before prescribing. `design-check` opened at 64 off-token
   colours; most were not drift but two real systems nobody had written down (a
   neutral grey ramp, the position-tag palette). Documenting them took it to 43
   with no repaint. Had we "fixed" all 64, we would have recoloured the app to
   match a doc that was itself incomplete.
3. **Ratchet, don't gate red.** A check that fails on arrival gets ignored.
   Record today's count as a budget that may fall and never rise, so the *next*
   violation fails the build while the existing backlog is worked down.
4. **Wire it into `npm run gate` and CI**, or it is not a control.
5. **Record the backlog in the document itself**, with counts, so the size of
   the debt is visible rather than folk knowledge.

---

## Current enforcement surface

`npm run gate` runs: `sanity` · `docs-check` · `design-check` · `smoke` (49) ·
`sports` (220) · `edge` (63) · `secondhalf` (68) · `flow` (10) · `replay`.
Exploratory, not gated: `hunt`, `loop`. Generators: `uimap`.
