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

## Current state (top of tree)

- **Version:** v2.8.4-beta · **main:** green, docs in sync, **0 open PRs**.
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
