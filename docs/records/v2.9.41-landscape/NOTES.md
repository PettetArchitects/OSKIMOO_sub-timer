# v2.9.41 — Landscape earns its keep

Owner (2026-08-15, from the compare view): "next thing to fix is landscape
view its a mess."

| Capture | State |
|---|---|
| `before-broken.png` | The mess: app pinned to the 430px portrait column mid-viewport, score under the bench rail, clocks invisible (absolute `right:8px` painted them behind the brand bar), pitch clipped by the tab bar |
| `ambient.png` | After: full-width layout — header row (menu \| score), in-flow clock pair, pitch across the free width, 170px bench rail + 92px dash rail clear of both fixed bars |
| `sub-now-rail.png` | ≤10s in landscape: red digits + red rail pills; the takeover drawer stays inert (portrait-only), pills stay in the rail |

Decisions / findings:
- Root cause measured, not eyeballed: `.app` max-width never released in
  landscape. One line (`max-width:none`) reclaimed 42% of the viewport.
- Lesson written into the CSS comment: never absolute-position into a padding
  zone you don't control — the clock hoist broke silently when the rail
  padding was added later.
- Real bug: the takeover class was orientation-blind; renderRoster rendered
  the bench into the display:none drawer in landscape → empty rail at ≤10s.
  The portrait gate now exists in `_setBenchUrgency` (JS), matching the CSS.
- Rail pills: compact tier in the 170px rail (26px badge, 15px name, 11px
  instruction, minutes dropped). Reorder chevrons kept.
- Rides along: embedded app instances (iframes — i.e. dev-gallery tiles) skip
  the What's New modal.
