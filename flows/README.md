# Game flows — real games, replayable

A **game flow** is a recording of one game: the setup it started from, plus
every action the coach took, in order, each stamped with the game clock and the
state it produced. The app records every game automatically (last 12 kept).

This folder is the **regression corpus**. Every flow committed here is replayed
by CI on every PR, so a bug that happened once in a real game can never come
back silently.

## Sending a flow in from the sideline

In the app: **menu (☰) → Send game flow** → pick the game → it opens the share
sheet (phone) or downloads a `.json` (desktop).

Player names are replaced with `Player 1`, `Player 2`, … before the file leaves
the device. The pseudonyms are consistent within a game, and duplicates stay
duplicated, so the roster's *shape* — including the two-players-same-name case —
is preserved exactly. Jersey numbers and position tags are kept; they steer
auto-fill and rotation, so a replay without them wouldn't be the same game.

## Replaying one

```bash
node test/replay.mjs flows/the-file-you-sent.json
```

The replayer rebuilds the exact game and applies every recorded action, driving
the clock through `tickSecond()` — the same per-second logic the live game runs.
It reports two kinds of finding:

- **DIVERGENCE** — this build produced a different line-up than the phone did at
  a specific step. That step is the bug, with the phone's state and this build's
  state side by side. (Only the *first* divergence matters; after that the two
  games have different state and everything downstream disagrees for free.)
- **INVARIANT** — a structural rule broke: a duplicate player on the pitch, the
  keeper not on the field, the squad not conserved, a keeper inside a rotation
  pair. These fire even when the replay faithfully reproduces the recording, so
  a flow recorded on a *buggy* build still tells you what's wrong.

Watch it happen with `REPLAY_HEADED=1`.

## Adding a flow to the corpus

1. Replay it and confirm it reproduces the problem.
2. Fix the bug.
3. Drop the `.json` in this folder and commit it — `npm run replay` now guards
   that fix forever.

Name it for the bug, not the date: `halftime-keeper-lost-on-resume.json` beats
`sub-timer-flow-2026-08-02.json`.

## Generated flows

`npm run flow` plays ten scripted games (concentrated on the second-half setup
path), records each one the way the app does, and replays it. That suite proves
the recorder and the app agree — which is what makes a sent-in flow trustworthy.
`FLOW_WRITE=1 npm run flow` also writes those games into `flows/generated/`;
that folder is throwaway and git-ignored.
