# The Map → Gate → Hunt Process

> A reusable **feature / UI-UX / bug-management system** for app development.
> Built and proven on Sub Timer; written here so you can stand it up on any
> other codebase. Read it as an **admin setup guide**: the principles are
> universal, the file names are this project's instance — swap them for yours.
>
> **Starting a fresh session on *this* repo?** Read **`SESSION-LOG.md`** first —
> it's the git-native persistent memory (current state, backlog, owner decisions,
> session history). This file (PROCESS.md) is the *method*; SESSION-LOG is the
> *running record*.

---

## The one idea

**The human owns *intent*. The machine owns *enforcement*.**

You (or your domain expert) decide what the app *should* do, in plain language.
Tooling makes sure the app can never silently diverge from that, and actively
hunts for places it already has. A "bug" has a precise definition:

> **A bug is where the app's actual behaviour diverges from written intent.**

Everything below exists to write intent down, enforce it, and discover the gaps.

---

## The three layers

```
        ┌─────────────────────────────────────────────┐
   MAP  │  What SHOULD happen (the source of truth)    │  ← human-owned
        ├─────────────────────────────────────────────┤
  GATE  │  What CAN'T break (enforced on every merge)  │  ← machine-owned
        ├─────────────────────────────────────────────┤
  HUNT  │  What we DIDN'T think to check (discovery)   │  ← machine-found,
        └─────────────────────────────────────────────┘     human-judged
```

### 1. MAP — write intent down, separate from the code

Three documents. The split matters: keep *intended* and *actual* in different
files so they can disagree — that disagreement is how you find bugs.

| Doc | Answers | Who writes it | This project |
| --- | --- | --- | --- |
| **Feature catalogue** | What exists + is it tested? | Human, audited from code | `FEATURES.md` |
| **UX pathways** | What *should* the experience be? | **Human (the oracle)** | `docs/UX-PATHWAYS.md` |
| **UI map** | What does the app *actually* wire up? | **Auto-generated** | `docs/UIMAP.md` |

**UX pathways is the keystone.** Write each user journey as steps, and for each
step state exactly three things — and nothing finer:

1. **Trigger** — what the user does, in their words.
2. **Observable result** — what they should see/can verify.
3. **Boundary** — what must stay true.

Do **not** write function names, CSS, or internal state — that's the UI map's
job. Too vague → tests assert the wrong thing. Too precise → the doc just
mirrors the code and can't catch its bugs. Bar: *"a user could check it by
looking."*

Tag each assertable line with what enforces it, so the doc is executable, not
prose: `✓ … [test: <name>]` or `✓ … [🔴 unguarded]`. Unguarded lines are your
backlog.

### 2. GATE — make breakage and drift un-mergeable

A merge gate that runs on every PR against a **protected main branch**, so
nothing reaches production unverified. Layers:

| Check | Stops | This project |
| --- | --- | --- |
| **Static/parse** | Syntax errors | `sanity` |
| **Smoke** | Core journeys breaking | `smoke` |
| **Breadth** | Edge/variant breakage | `sports`, `edge` |
| **Docs drift** | Docs lagging the code | `docs-check` |

Two rules that make it work:

- **Every bug fix ships with a regression test.** The test reproduces the bug
  (red), the fix makes it green. The gate then guards that bug forever.
- **Docs are gated too.** A version mismatch, an unmapped control, or a dangling
  test-link fails CI — so the map can't rot (the classic failure where docs go
  50 versions stale).

### 3. HUNT — actively look for what you didn't think to check

Tests assert what you *thought of*. The hunt finds what you didn't.

| Tool | Does | This project |
| --- | --- | --- |
| **Hunter** | Fuzzes interaction sequences against invariants | `hunt` |
| **Loop** | Runs gate + hunt on repeat, stops on a finding | `loop` |

An **invariant** is something that must *always* hold (e.g. "the on-field count
never exceeds the format size"; "what the chips show equals what the pitch
shows"). Each invariant typically maps to a class of bug you've already shipped
a fix for. The hunt is **discovery, not a gate** — a finding needs a human
judgment call, never an auto-merge.

**The flywheel:** bug found → reproduce → fix → *add a regression test* → the
gate is now stronger → the hunt moves to new ground. Coverage compounds.

---

## How the loop runs day-to-day

```
  user reports / hunt finds an issue
            │
            ▼
   reproduce it (red test)  ──►  is intent clear?  ──no──►  ASK THE HUMAN
            │                                                 (they own intent)
            ▼ yes
   fix it  ──►  test goes green  ──►  update the MAP if intent changed
            │
            ▼
   gate passes (incl. docs-check)  ──►  merge to protected main  ──►  ships
```

**The human is consulted at exactly one point: when intent is ambiguous.** Not
"how to fix" — "what *should* happen." That's the only thing tooling can't
decide. Everything else is mechanical.

---

## Admin setup: stand this up on a new app

Order matters — each step builds on the last. You don't need all of it on day
one; this is the order of highest leverage.

1. **Version control + a protected main.** No direct pushes; everything via PR.
   *(Without this, none of the gating is real.)*

2. **One smoke test + CI.** Pick the single most important user journey, write a
   test that drives the *real app* end-to-end, and run it in CI on every PR.
   This alone catches most regressions. (See `test/harness.mjs` for the pattern:
   serve the app, drive it headless, assert, screenshot.)

3. **The discipline: every fix gets a regression test.** Make it a rule. This is
   what turns a test suite from a snapshot into a ratchet.

4. **Write the UX pathways** for your core journeys (the MAP keystone). Even a
   first draft is worth it — it's the oracle. Have the domain expert review it;
   their corrections *are* the spec.

5. **Auto-generate the UI map** from the code, so "what the app does" is always
   current and you can diff it against intent. (See `test/uimap.mjs` — note it
   needed a *runtime* pass because the app was JS-rendered; expect to adapt the
   extraction to your stack.)

6. **Add the docs-drift check to the gate.** Now the map can't go stale. (See
   `test/docs-check.mjs`: version sync, control coverage, dangling-link checks.)

7. **Build the hunter.** Encode your invariants, fuzz the riskiest area first
   (wherever bugs have clustered). Add the loop runner once the hunter is
   trustworthy (tune out false positives — judge only *settled* states, require
   a violation to *persist*, respect real preconditions).

8. **Keep a prioritised gap list.** The 🔴-unguarded pathway lines + the feature
   audit's untested areas = your backlog, ranked by user-facing risk.

---

## Gotchas we hit (so you don't)

- **Tests that call functions directly are blind to UI bugs.** "The button
  exists but isn't wired / is hidden / goes to the wrong screen" sails through
  function-level tests. Drive the *real DOM* for anything UI-critical, and let
  the UX pathways + UI map tell you what to click.
- **A fix can re-break an older fix.** Only the regression suite catches this —
  it caught us trading one bug for another mid-session. Trust the gate over your
  own confidence.
- **"Done" can silently not be done.** We wired a check into a script CI didn't
  actually call. Verify enforcement *runs where you think it runs*, not just
  that it exists.
- **Wiring a check into the gate ≠ wiring it into CI.** Check what CI invokes.
- **The map will drift the instant it's manual.** Automate the staleness check
  or it *will* rot — ours started 50 versions out of date.
- **Async renders + rebuilt state = null-derefs.** Deferred renders that read
  state after it's been torn down throw. Guard re-entrantly.

---

## The names, for talking about it

- The whole system: **Map → Gate → Hunt** (or "spec-anchored, test-gated,
  fuzz-hunted" development).
- The principle: **human owns intent, machine owns enforcement.**
- The bug definition: **divergence from written intent.**
- The flywheel: **every fix becomes a permanent guard.**

---

_This file is the portable process. The Sub Timer artifacts that implement it:
`FEATURES.md`, `docs/UX-PATHWAYS.md`, `docs/UIMAP.md`, `test/` (sanity, smoke,
sports, edge, hunt, loop, uimap, docs-check), `.github/workflows/smoke.yml`,
and the protected `main` branch. Copy the shapes, not the specifics._
