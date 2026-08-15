# v2.9.45 — full bleed on iPhone + the clipped dash

Owner report, from the installed PWA on their phone (screenshot in the session
thread): *"the full bleed isn't really working if intended and there is some
clipping of buttons"*.

## Three bugs, one photograph

### 1. `viewport-fit=cover` was never in the viewport meta

```html
<!-- before -->
<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
```

Without it iOS insets the web view *below* the status bar and *above* the home
indicator — the app is letterboxed in the page background, which is the
mismatched strip above the brand bar in the owner's photo — **and every
`env(safe-area-inset-*)` resolves to 0**. Every safe-area calc in the file (the
brand bar, `.scr`, the drawers, the tab bar, both landscape rails) had been dead
since it was written. One attribute turns them all on at once.

### 2. Turning them on would have crushed the brand bar

`*{box-sizing:border-box}` (index.html line 37) applies to the bar, so

```css
#appBrandBar{height:44px;padding:env(safe-area-inset-top) 8px 0}
```

keeps the element at 44px total and squeezes the content row to `44 - inset` —
**zero, or negative, at a real 59px inset**. Height now includes the inset. The
landscape rails had the identical bug against `inset-left` / `inset-right`
(~59px notch): the 64px nav rail and 92px dash column padded their content away
instead of widening. Rule, now in design.md §3.0: **a fixed-height bar grows by
its inset; it never pads its content away.**

### 3. The clipped buttons: a hard-coded tab-bar height

`#bottomTabBar` has no fixed height — it is icon + label + padding + inset.
Measured at 390×844 in Chromium: **67px**. Screens reserved **58px**. The game
dash's SUB / START sat 9px under the bar, and so did the lowest control on
`editTeam` (761 vs a 770 reservation edge). Under iOS Dynamic Type the gap is
wider still, which is why the phone looked worse than any desktop test.

Replaced with `--tabbar-h`, published by `syncTabBarHeight()` from the bar's real
`offsetHeight` on every `renderViewSwitcher` / resize / orientation change, and 0
when the bar is hidden (landing/wizard screens) or rotated into the landscape
rail.

## Verification (390×844)

| | before | after |
|---|---|---|
| `--tabbar-h` | — (58px hard-coded) | 67px measured |
| dash button bottom vs tab-bar top | 778 vs 778 — **flush/behind** | 769 vs 778 — **9px clear** |
| `.scr` bottom reservation | 58px | 67px |

With simulated iPhone insets (59 top / 34 bottom) injected —
`after-game-simulated-insets.png`:

| | value |
|---|---|
| brand bar | 103px tall, content row intact at y=59 (i.e. it paints the status bar) |
| `--tabbar-h` | 101px, re-measured automatically |
| dash clearance | still 9px |

Landscape 844×390: `--tabbar-h` → 0, rail 64px at x=0, bench 170px, dash 92px —
no overlap.

## Also in this version

Owner, same message: *"remove the drop fill behind the scoring line"*. The
`#16213e` band behind the score row is gone; the score sits on the page ground
divided by the hairline alone (§5.0 — three surfaces, structure by rule not by
fill). One off-token colour use retired with it.

## Screenshots

- `after-game-portrait.png` — game screen, 390×844
- `after-game-simulated-insets.png` — same, with iPhone insets simulated

## Still owner-side

The Figma atlas frames for the game screen show the old score band — re-shoot via
the **figma-atlas** skill.
