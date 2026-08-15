# v2.9.38 — Bench urgency escalation + takeover drawer + next-on table

Owner session (2026-08-15, live in the dev gallery): "the pills need to be
glanceable — who's coming on and off — and maybe pop up as sub time nears…
it has to work when we sub on more than two at a time… at least on the phone,
space is at a premium… the bench should feel like a bottom drawer… the bench
could be two columns — who's coming on, who's going off, the third is the
position… the timing strip is just taking up space."

Ideas were tested against SCREEN-BRIEFS s4 (three states, three kings) before
building — see design.md §5.8 for the resulting pattern.

| Capture | State |
|---|---|
| `ambient.png` | Quiet bench, countdown dominates (sc=3, 4-deep bench fixture) |
| `sub-soon-30s.png` | Colour-only warm-up: amber digits + label + pill borders, "· get ready" tag, field untouched |
| `sub-now-drawer.png` | ≤10s portrait phone: bottom drawer over the field, red pulse, Field/Bench escape chip |
| `landscape-rail-8s.png` | Landscape keeps the 170px right-rail bench; drawer inert |

Decisions on the way through:
- Takeover at ≤10s, NOT ≤30s — the brief puts "everything else recedes" at
  sub-due; the field is an ambient Must-show.
- Drawer over layout-swap — overlay grammar (v2.9.34 elevation rule), pitch
  never re-lays-out; `#pitchMid` gets `isolation:isolate` so token depth-sort
  z-indexes (~1800) stay under the drawer.
- 44dvh sub-soon bench expansion tried and REJECTED — starved the pitch at
  sc=3 (`git` history has the interim state; ambient capture shows why).
- Standing field/list toggle REJECTED — s4 choice budget is 8, UIMAP counts 12;
  the chip exists only inside the takeover window.
- Next-on wave rebuilt as ONE benchmark-grammar card laid out as a table
  (↑ COMING ON | ↓ OFF | AT + minutes + chevrons) — owner's columns idea,
  MORE §5.0-aligned than N bordered pills. Injury-pick + landscape rail keep
  pills (tap targets / 170px width).
- v2.9.7 timing confirm strip retired (owner: space) — s2 "Today's game"
  confirms timing one step earlier; `openMatchSettings` + `.strip-link` removed.
- Owner idea NOT implemented — score → popup behind a bottom button: conflicts
  with the stamped standing exception (2026-08-08: score entry one tap away in
  ALL states) and v2.9.36 stable slots. Alternative offered: compact the score
  band's display instead. Awaiting the owner's call.
- Bug found on the way: `#clkSub`'s inline `color` + rule order meant the
  countdown DIGITS never went amber at 30s (label only). Fixed.
- Dev gallery: fixture topped to 11 players (4-deep bench), landscape live-game
  tile added, `gallery-server.py` one-step launch.
