# v2.9.49 — Tap, tap, confirm

Owner brainstorm, 2026-08-15, from the sideline after four field reports in one
session (a phantom next-on row, a sub interval that didn't take, a silent
position move, an injured keeper with no way off):

> "the long press is a bit subtle — I think we need a better way to make these
> manual changes that is clear"
> "tap player and then tap the player you want to do a swap with and then a
> confirm the move?"
> "usually if it's an injury it is a swap with someone on the bench so a tap of
> the onfield player and the bench player should solve it?"
> "then once the interchange has been done we can mark the player on the bench
> as to be not in the queue"

Mapped first — `docs/UX-PATHWAYS.md` **P3b — Manual changes on the game
screen** — then built to the map. Every ✓ line is edge-tagged; the section is 🟢.

## The grammar

| Tap | Tap | Card |
|---|---|---|
| Field | Field | Swap positions (gloves line if a keeper is involved) |
| Field ↔ Bench (either order) | | **↑ on · ↓ off · AT** — an interchange, indistinguishable from an engine sub afterwards |
| Bench | Bench | Swap queue places |

Plus one visible toggle on every bench row: **out of the queue**. Nothing applies
before Confirm.

## Screenshots (390×844)

- `confirm-position-swap.png` — field+field proposal
- `confirm-keeper-interchange.png` — bench→keeper proposal, "Harper takes the gloves"
- `out-of-queue.png` — a kid marked out: greyed, dashed, at the bottom, one tap back in

## Retired

- Long-press → injury (still arms the flow as a shortcut; nothing depends on it)
- Instant two-tap position swap (now confirmed — owner: yes)
- The red "tap a bench player" injury-pick mode (unreachable; functions kept for the harness)
