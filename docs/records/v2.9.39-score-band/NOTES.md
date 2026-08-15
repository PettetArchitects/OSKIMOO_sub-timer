# v2.9.39 — A slimmer scoreboard

Owner (2026-08-15, continuing the v2.9.38 gallery session): the score "takes up
a lot of screen space… it should be a pop up from a bottom button" — then,
after the standing exception was cited (2026-08-08: score entry one tap away in
ALL states; goals arrive at random moments): "if it's going to be persistent,
can we tighten it up."

So the DISPLAY compacted; the ENTRY didn't move:

- One row: label beside its − score + cluster, mirrored so both scores hug the
  colon (`GALLERY − 0 + : − 0 + THEM`), labels ellipsized at 76px.
- Digits 34 → 26px; band min-height 84 → 52px, padding trimmed. The 84px was a
  v2.7.69 height-match with the Plan header — moot since the Plan page left
  the game view (v2.9.11).
- +/− keep their .hit44 one-tap targets in the same positions. AFL's
  goals/behinds band untouched. ≤480px small-phone rules unchanged.

`game-ambient.png` — the resulting game screen: slim scoreboard, full pitch,
full next-on table (with the v2.9.38 bench work) on a 375×812 phone.
