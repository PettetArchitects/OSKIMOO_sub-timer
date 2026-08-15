# v2.9.53 — the tab bar written to Apple's HIG spec

Owner: "the bottom nav I want as a modern iOS nav bar" · "isn't there some off
the shelf standard for this?" — there is: the HIG tab-bar spec, and the bar now
follows it number for number (design.md §3.2 is the contract).

- `classic-hig.png` — **default**: 49pt, full width, evenly distributed, filled
  tinted active glyph, no pill, glass material.
- `floating-ios26.png` — `body.tabbar-float`: the iOS-26 floating inset pill.
  **Unstamped** — owner to pick.

Same fix set: the closed side drawer's shadow no longer bleeds onto the page's
left edge ("a weird gradient colour on the left hand side").
