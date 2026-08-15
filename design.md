# Sub Timer — Design System

> Last updated: v2.9.51
> Sub Timer is a single-file PWA for grassroots youth-sports coaches. This document is the canonical reference for every design token and component used in the app. Inspired by Apple's Human Interface Guidelines + Figma's design-system examples.

---

## 1. Design principles

1. **Game day clarity over screen real-estate** — the coach is on a sideline in sunlight watching twelve seven-year-olds. Every screen must be readable in one glance. Big DSEG clocks, big sub buttons, no precious typography.
2. **One consistent app shell, many views** — two persistent anchors (top brand bar + bottom tab bar) wrap every screen so the coach never loses orientation. Per-page chrome lives inside that shell.
3. **Auto by default, custom by intent** — the app picks fair subs unless the coach explicitly builds a plan. The custom path is one tap deeper, not the default.
4. **Tactile, gestural** — tap to swap, long-press for injury sub, drag to reorder. Primary actions are large. 44×44pt is the hit-target *target*, not yet the floor — see §8 for the current count and the ratchet holding it.
5. **Dark by default** — coaches use this outdoors in glare; dark UI with high-contrast accent colors reads better than light, and matches the iOS PWA aesthetic.

---

## 2. Foundations

### 2.1 Color tokens

All colors are dark-theme. Light theme is not currently supported.

#### Surface

| Token | Hex | Usage |
|---|---|---|
| `--surface-app` | `#1a1a2e` | Body / outermost page background |
| `--surface-panel` | `#16213e` | Header band background |
| `--surface-card` | `#0a1628` | Content cards |
| `--surface-card-2` | `#0d1828` | Brand bar, tab bar, menus |
| `--surface-input` | `#13203a` | Input fields, default button background |
| `--surface-pitch` | `#06101c` | 3D pitch container |
| `--surface-overlay` | `rgba(0,0,0,.88)` | Modal scrim |

#### Border

| Token | Hex | Usage |
|---|---|---|
| `--border-subtle` | `#1e2a45` | Card borders, divider lines |
| `--border-emphasized` | `#2a3550` | Button borders, popup outlines |
| `--border-row` | `#16213e` | Internal row separators |
| `--border-section` | `#243049` | Dashboard / bottom-band top border |

#### Text

| Token | Hex | Usage |
|---|---|---|
| `--text-primary` | `#eee` | Headings, primary content |
| `--text-secondary` | `#9fb3c8` | Secondary labels |
| `--text-muted` | `#7d8a9c` | Inactive tab bar items, helper text |
| `--text-faint` | `#888` | Meta info, captions |
| `--text-inverse` | `#06231d` | Text on green primary buttons |

#### Neutral ramp

The blue-tinted text tokens above are the *preferred* greys. Alongside them the
app also uses a plain neutral ramp — mostly for de-emphasised text and hairlines
inside dense lists (match log, plan rows, bench chips), where a blue cast reads
as "interactive" and these read as "quiet".

This table **documents what is in use**; it is not a licence to add more. See
§11 backlog — nine greys for text is too many, and the target is to collapse
this to roughly four. It is written down so the drift is visible and countable
rather than invisible.

| Token | Hex | Usage |
|---|---|---|
| `--n-200` | `#ccc` | Dense-list body text |
| `--n-300` | `#bbb` | Modal body copy |
| `--n-400` | `#aaa` | Helper / explanatory copy under a control |
| `--n-500` | `#999` | Meta text in list rows |
| `--n-700` | `#666` | De-emphasised captions, empty-state text |
| `--n-800` | `#555` | Placeholder / disabled label |
| `--n-900` | `#444` | Hairline glyphs (the ⇄ between two names) |
| `--n-950` | `#333` | Dark separators on card backgrounds |
| `--n-1000` | `#222` | Match-log row dividers |

#### Accent — primary action

| Token | Hex | Usage |
|---|---|---|
| `--accent-green` | `#00d4aa` | Primary action color (Start, On-field chip, success state) |
| `--accent-green-light` | `#1ae0b8` | Primary button gradient top |
| `--accent-green-dark` | `#00c2a0` | Primary button gradient bottom |
| `--accent-green-deep` | `#0a9d83` | Primary button border |
| `--accent-green-tint` | `rgba(0,212,170,.14)` | Active tab background, success tint |

#### Accent — secondary

| Token | Hex | Usage |
|---|---|---|
| `--accent-cyan` | `#5bc0de` | Selected state, "next sub" emphasis, scrub bar |
| `--accent-cyan-tint` | `rgba(91,192,222,.14)` | Selected tab background |
| `--accent-red` | `#e94560` | Half-clock color, danger, score chip |
| `--accent-red-light` | `#ff7088` | Off-field chip, danger text |
| `--accent-amber` | `#f0a500` | Bench chip, warning, BETA badge |
| `--accent-purple` | `#a78bfa` | Custom plan profiles, Save action |
| `--accent-yellow` | `#ffc428` | Donate / heart action |

#### Position-tag palette

Every position label (`.pos-tag-*` / `.pos-mini-*`) is a **pair**: a dark tinted
background and a saturated foreground that also serves as the border. The hue
carries meaning down the pitch — red at the back, green/teal in defence, indigo
through the middle, sage on the wings, amber up front — so a coach can read a
line-up by colour without reading the letters.

Reuses `--accent-red`, `--accent-green`, `--accent-amber` and `--accent-cyan`
as foregrounds where the hue already exists; the four below are unique to this
family.

| Position | Background | Foreground | Token |
|---|---|---|---|
| GK | `#3a1525` | `#e94560` | `--accent-red` |
| DEF | `#0a2a2a` | `#00d4aa` | `--accent-green` |
| MID · GD | `#1a1a3e` | `#7b8cff` | `--pos-indigo` |
| WNG · WA | `#1a2a1a` | `#8dd68d` | `--pos-sage` |
| FWD · GS | `#2a1f0a` | `#f0a500` | `--accent-amber` |
| GA | `#2a1a14` | `#ff8c5a` | `--pos-coral` |
| C | `#3a2a14` | `#ffc14d` | `--pos-gold` |
| WD | `#1a2a2a` | `#5bc0de` | `--accent-cyan` |

Backgrounds are ~12% tints of their foreground on `--surface-card`. A new sport
adding positions must map onto this palette rather than introduce new hues.

### 2.1.1 Palette rationalisation — PROPOSAL (v2.9.32, awaiting owner stamp)

> Written from the owner's ask ("rationalise the colour palette with some
> colour theory"). Nothing below is implemented; hex values are deliberately
> not in token-table format so the design-check parser ignores them until
> stamped. Implementation order per §10: stamp → rewrite §2.1 → migrate →
> ratchet the off-token budget DOWN.

**What the audit shows** (40 tokens; design-check: 37 off-token colours / 61 uses):

1. **Surface hue wobble.** Every surface sits in a 213–223° blue cluster —
   except the app background #1a1a2e at 240°. Blue cards on a
   purple-cast ground is part of why busy screens read "noisy": two ambient
   hues compete. Six of the off-token colours (#0f1422, #141a2e, #1a2747,
   #141f3a…) are hand-mixed surfaces invented because no rule said how to
   make one.
2. **Elevation is undeclared.** The app actually runs a coherent model —
   bands and controls float ABOVE the background (panel L16%, input L15% vs
   bg L14%), content cards sink BELOW it as wells (card L10%, pitch L7%) —
   but it's written nowhere, so new surfaces guess.
3. **Thirteen greys.** Four blue-tinted text tokens + the nine-step plain
   neutral ramp. On a blue ground, pure greys shift perceptually warm — they
   read as a different material (why dense lists feel patchwork). §11
   backlog #1 already wants this collapsed.
4. **Accent duplicates.** Yellow 44° vs amber 41° are 3° apart — one
   meaning, two tokens. The stray #ff7bac (7 uses) is a pink drift off
   red-light. Green's tone family (light/dark/deep) is fine — that's a tone
   ladder, not a duplicate.
5. **Two tint alphas.** Selection tints use rgba(accent,.14) *and* .16.

**The proposed system (colour theory, stated as rules):**

- **Hue encodes meaning; lightness encodes elevation; never both.**
- **One surface hue** — anchor everything at ~218° (the current cluster
  median). Option A (conservative): keep #1a1a2e as a stamped "brand navy"
  exception. Option B (full): re-anchor the background to ~218° at the same
  lightness (≈ #161f33) — visibly calmer, but it touches the app's identity,
  so it needs its own before/after pass. **Recommend A now, B behind
  screenshots.**
- **Declare the elevation ladder** (all one hue, lightness only):
  overlay < pitch (deepest well) < card (well) < background (ground) <
  input/control (raised) < panel/band (highest). New surfaces pick a rung,
  never a new mix.
- **One grey family.** Text/de-emphasis uses the four blue-grey text tokens;
  the plain ramp keeps only its two darkest steps (true-black wells) and the
  other seven map onto the blue-greys. ~13 greys → 6.
- **Five semantic accents, positioned on the wheel relative to brand green
  (166°):** cyan 194° *analogous* = calm, related → preview/info · purple
  255° = plan/custom · red 349° *near-complement* = maximum tension → theirs
  / stop / danger · amber 41° *split-complement* = attention. Yellow merges
  into amber; #ff7bac snaps to red-light (red's tone pair, not a meaning).
- **One tint rule:** selected/tinted fills are rgba(accent, .16) — nothing
  else. Gradient stop pairs are ±5% lightness of the base token (the
  documented accent-green-light/dark precedent) — closing §11 backlog #0's
  biggest bucket.
- **Budget per screen (60-30-10):** surfaces ~60%, text ~30%, ONE accent
  family ~10% per region. A second accent on screen must be earning a
  semantic difference (e.g. green us / red them on the score), never variety.

**End state (Option B):** ~24 tokens (7 surfaces · 3 borders · 4 text + 2
deep neutrals · 5 accents + tone/tint rules + inverse), a written old→new
mapping for every retired token, and the design-check budget ratcheted from
43 toward ~10.

**Option C — three-accent discipline (owner follow-up: "reduce how many
colours we use").** B still speaks five accent hues — and the app today
actually speaks NINE hue families once the position-tag palette (periwinkle
#7b8cff, sage #8dd68d), GK pink #ff7bac and stray yellows are counted. C cuts
the accent vocabulary to THREE:

- **green** — ours / go / interactive / selected (cyan's preview-and-SUB
  duties fold in here: analogous hues, one family);
- **red** — theirs / stop / danger ONLY. **Red exits navigation**: the
  `.btn-o` secondary and `.back-btn` (red today) become neutral chrome —
  a red "Done" reads destructive when it's just a door;
- **amber** — attention: warnings, sub-due, player of the match, BETA.

Everything else goes neutral: purple's plan/custom marking is carried by the
mode label (`.is-plan` becomes a neutral tone), the GK pick's pink folds into
selection green (the IN GOAL label carries the role — the pitch shirt
palette, the app's identity layer, is untouched per §11 1a), and the
five-colour position-tag palette becomes ONE quiet neutral tag with a single
amber exception for GK (the one role-critical tag). End state: **~17 tokens,
3 accent hues.** Mock: `palette-mock.html` (built with C), browsable across
the whole app via `dev-gallery.html?app=palette-mock.html`.

### 2.2 Typography

| Role | Size | Weight | Letter-spacing | Notes |
|---|---|---|---|---|
| `.tmr-c` (DSEG clock) | `min(13vw, 56px)` | bold | 2px | DSEG-7 Classic Bold font, tabular-nums |
| Card title eyebrow | 10px | 800 | 1.2px | `text-transform:uppercase` |
| Section heading | 13px | 800 | 1.5px | |
| Body | 13-14px | 600-700 | — | |
| Button label | 11-13px | 800 | .3-.5px | |
| Pill label | 11-12px | 700 | .3px | |
| Meta / caption | 10-11px | 600 | .4px | |

Font stack: `-apple-system, BlinkMacSystemFont, sans-serif`. DSEG-7 Classic Bold
for the digital clocks, and `ui-rounded` for `ui-` button labels (§4.1.0).

**Delivery (v2.9.3).** DSEG is **inlined as a base64 data URI**, not fetched. It
used to come from `cdn.jsdelivr.net` with no service worker, so at a ground with
no signal `document.fonts.check()` returned false and the clock — the app's whole
identity — fell back to plain monospace. 5KB raw, 6.7KB base64, on a 612KB file.
Verified by loading with the CDN blocked.
Three.js still comes from a CDN and that is deliberate: 600KB is not worth
inlining, and the 2D pitch fallback renders correctly without it.
`ui-rounded` is a CSS generic family, so it needs no download at all — Apple
devices resolve SF Pro Rounded, everything else falls through the stack.

**Reality check (v2.9.2).** Those are eight *roles*; the code uses **20 distinct
font sizes**, including `7px`, `8px` and `12.5px`. `npm run ui` counts them and
ratchets, so the sprawl can shrink but not grow. See §11 backlog.

**Legibility floor.** `ui-check` flags any declaration below **9px**. There are
11, all on the 3D pitch player chips — worst on AFL, where 18 players force
position labels to 7px and names to 8px. That is in direct tension with §1
principle 1 ("readable in one glance" on a sunlit sideline): the pitch is the
one surface a coach reads at a glance mid-game, and it carries the smallest text
in the app. Recorded rather than silently changed, because fixing it is a
density decision — 18 chips have to fit.

### 2.3 Spacing scale

`4px · 6px · 8px · 10px · 12px · 14px · 16px · 20px · 32px`

Most layouts use 8/10/12px gaps. Page padding is typically 12-16px. Card internal padding 8-14px.

### 2.4 Radius scale

| Token | Value | Usage |
|---|---|---|
| `--r-xs` | 2px | BETA badge |
| `--r-sm` | 4-6px | Inputs, small chips |
| `--r-md` | 8px | Standard cards, primary buttons |
| `--r-lg` | 10-12px | Modal panels, large buttons |
| `--r-pill` | 14px | Pill-shaped chips |
| `--r-tab` | 20-24px | Tab bar pill, view switcher |
| `--r-circle` | 50% | Step buttons, hamburger button |

### 2.5 Shadows

| Token | Value | Usage |
|---|---|---|
| `--sh-raise` | `0 2px 8px rgba(0,0,0,.3)` | Card / button rest |
| `--sh-press` | `0 1px 2px rgba(0,0,0,.4)` | Button active state |
| `--sh-popup` | `0 8px 24px rgba(0,0,0,.65)` | Dropdown menus, formation picker |

### 2.6 Motion

| Token | Duration | Easing | Usage |
|---|---|---|---|
| `--mo-fast` | 150ms | ease | Hover, active states |
| `--mo-base` | 300ms | ease-out | Modal fade-in, screen transitions |
| `--mo-sub` | 850ms | ease-in-out | Player sub swap animation |
| `--mo-splash` | 1600ms | ease-in | Launch splash fade |

---

## 3. App shell

The app has two **persistent anchors** that frame every screen.

### 3.0 Safe areas — the two rules (v2.9.45)

**Rule 1: `viewport-fit=cover` is load-bearing.** It must stay in the viewport
meta. Without it iOS insets the web view *below* the status bar and *above* the
home indicator — the app is letterboxed in the page background (no full bleed) —
**and every `env(safe-area-inset-*)` resolves to 0**, so every safe-area calc in
the file silently does nothing. It was missing until v2.9.45; all the inset maths
below had never once run on a phone.

**Rule 2: a fixed-height bar GROWS by its inset; it never pads its content away.**
Everything is `box-sizing:border-box` (line 37), so `height:44px` +
`padding-top:env(safe-area-inset-top)` crushes the 44px content row to nothing
once the inset is real. Write `height:calc(44px + env(safe-area-inset-top))`.
Same for the landscape rails, where the notch inset is ~59px: the nav rail is
`width:calc(64px + env(safe-area-inset-left))` and the dash column
`calc(92px + env(safe-area-inset-right))` — widen, don't pad.

**Corollary — never hard-code a bar's height.** `#bottomTabBar` has no fixed
height (icon + label + padding + inset ≈ 67px, more under iOS Dynamic Type), and
the 58px screens used to reserve put the game dash's SUB / START *under* it.
`syncTabBarHeight()` measures the real `offsetHeight` and publishes it as
`--tabbar-h` on every `renderViewSwitcher` / resize / orientation change (0 when
the bar is hidden or rotated into the landscape rail). Reserve
`var(--tabbar-h)`, never a number.

### 3.1 Top brand bar (`#appBrandBar`)

- `position:fixed; top:0; left:0; right:0`
- `height: calc(44px + env(safe-area-inset-top))` — grows into the status bar and
  paints it (§3.0 rule 2); the 44px content row is preserved by the matching
  `padding-top`
- Background `var(--surface-card-2)` with 1px bottom border `var(--border-section)`
- **Three slots** (v2.7.82): hamburger LEFT · logo CENTRE · version RIGHT
  - Left: `#globalMenuBtn` 36×36 hamburger; routes to active screen's drawer
  - Centre: animated dots logo (14×21px) · SUB TIMER name (12px, weight 900, 2px letter-spacing) · BETA badge
  - Right: version tag (10px, muted, tabular)
- The brand bar **IS** the persistent app header on every screen. Per-screen `.hdr` (if present) sits below as screen-specific content.

### 3.2 Bottom tab bar (`#bottomTabBar`)

- `position:fixed; bottom:0; left:0; right:0`
- Padding 6px top, `calc(6px + env(safe-area-inset-bottom))` bottom
- Background `var(--surface-card-2)` with 1px top border `var(--border-subtle)`
- 3 tabs: **Game** (sport-aware ball icon) · **Plan** (clipboard) · **Team** (people)
- Each tab is 62px min-width, 22×22px icon stacked above 10px label
- Active tab: tint `var(--accent-cyan-tint)`, text `var(--accent-cyan)`, 14px pill background
- Inactive: text `var(--text-muted)`, no background
- **Visibility rule (v2.7.80)**: hidden on landing-style screens (home, sport picker, grade picker). The tabs only show once a team context is active.

### 3.3 Page header (`.hdr`) — REMOVED from content screens (v2.9.28)

- **v2.9.28 (owner): the heading bands are gone — the brand bar is the only
  header, and per-screen navigation lives in the bottom action zone.**
  Back sits beside the primary action as a `.btn-o` in a flex row: ← Squad /
  ← Keeper beside Next (setup pages), ← Squad beside Apply settings (s2),
  Delete beside Save Team (team editor); pickers and history get a plain
  bottom `.btn-o`. Each page's question lives in its `.info` line
  ("Who's in goal? …", "Full time — match summary").
- The only `.hdr` markup left is home's, hidden since v2.7.82
  (`#home > .hdr { display:none }`); the sticky-band CSS remains solely for it.
- Historical note: the sticky band displaced itself 44px down over the element
  that followed it (the `.info` lines were never actually visible beneath it) —
  removing the bands closed that class of bug.

### 3.4 Side drawer (v2.7.83)

- `position:fixed; top:0; left:0`, width 280px (max 80vw), height 100dvh
- `transform: translateX(-100%)` by default; `.drawer-open` → `translateX(0)`
- 0.25s ease transition
- Background `var(--surface-card-2)` with 1px right border `var(--border-emphasized)` + 4px×24px ambient shadow
- Padding top accounts for brand bar (`calc(48px + env(safe-area-inset-top) + 12px)`)
- Companion **scrim** `#appDrawerScrim` — `position:fixed inset:0`, 55% black, z-index 9400. Tap to close.
- **DOM placement rule (v2.9.43):** the three drawers live at **body level, after the scrim** — `hoistDrawers()` moves them there before the first open. They must NOT sit inside a screen's `.scr` scroll container: WebKit hit-tests a fixed element nested in an overflow scroller below the body-level scrim (taps land on the scrim → drawer closes, nothing else fires) even though it paints above it. Chromium is unaffected, so only a real iPhone catches a regression.
- Triggered by `#globalMenuBtn` via `toggleGlobalMenu()` which routes to the active screen's drawer (home / game / plan)
- **Drawer body**: vertical list of menu items, each `13px 14px` padding, 15px label, leading icon
- **Drawer footer** (`.drawer-donate`): pinned to the bottom via `margin-top:auto`, divided from the body by a 1px top border. Always contains Send feedback + Donate (amber pill).

### 3.4 Page content padding

All `.scr` screens:
- `padding-top: calc(44px + env(safe-area-inset-top))` — clears brand bar
- `padding-bottom: var(--tabbar-h)` — clears the tab bar at its **measured**
  height (§3.0 corollary; was a hard-coded 58px until v2.9.45)

Game screen (`#s4`) and Plan screen (`#subOrderOv`) override with overflow:hidden flex layout — their internal bottom-band (`#gameDash` / `#planControlBand`) absorbs the tab-bar offset via inline `calc(8px + var(--tabbar-h))`, which is also what keeps the 8px of air under the action tiles.

---

## 4. Components

### 4.1 Button

> **The `ui-` system (v2.9.3) — in progress.** Everything documented below §4.1.0
> is the **legacy** treatment. It is what 121 inline-styled buttons, in 54
> distinct combinations, actually look like today. The set below replaces it.

#### 4.1.0 The `ui-` button system

Six variants. Prefixed `ui-` so it cannot collide with the legacy `.btn` /
`.chip` / `.st-btn` classes while both exist — the old ones are removed screen
by screen as callers migrate, never in one sweep.

| Class | Role | Size |
|---|---|---|
| `.ui-btn--primary` | The one action a screen exists for. At most one per view. | 48px min |
| `.ui-btn--secondary` | Everything supporting. Takes a tone modifier for meaning. | 44px min |
| `.ui-btn--ghost` | Menu and drawer rows. Full width, left-aligned. | 48px min |
| `.ui-btn--link` | Text-only tertiary action inside a dialog (Forgot password? / Cancel). No fill, no border; 44px hit area. v2.9.44 | 44px min |
| `.ui-btn--danger` | Loses data or ends something. | 44px min |
| `.ui-chip` | Compact, inline with content — tags, toggles, scores. | — |
| `.ui-chip--card` | Block chip with a title + description line (strategy cards). | full width |
| `.ui-step` | The −/+ steppers. | **44×44** |

Tone modifiers sit **on top of** `--secondary` rather than multiplying into new
variants: `.is-go` (green), `.is-preview` (cyan), `.is-plan` (purple),
`.is-attention` (amber). Same meanings as §2.1. `--ghost` takes colour-only
tones (no fill — a menu row stays a row): `.is-plan` for plan-scoped rows,
`.is-danger` (the `.ui-step.is-danger` colour) for destructive rows like
End game.

**The treatment: fun, familiar, approachable.** The audience is a volunteer
parent on a sideline, not an engineer. An earlier cut borrowed from
developer-tool design systems (Linear, Vercel Geist — flat, low-contrast, 600
weight) and read cold and corporate for a kids' sport app. The reference set is
now apps a grassroots coach already has on their phone: GameChanger, TeamSnap,
Spond, Heja, Stack Team App — and Duolingo for the tactile press.

| | Legacy | `ui-` |
|---|---|---|
| Type | system sans, 800, +.3px tracking | `ui-rounded` (SF Pro Rounded on Apple), 700 |
| Press | 1px nudge | ~~3px colour lip~~ → scale compression (§5.0.7 flat stamp, v2.9.34) |
| Fill | `linear-gradient(180deg,…)` | solid, confident |
| Radius | 8px | 16px (14px chips) |
| Height | 7–13px padding | 48–52px min-height |

`ui-rounded` is a CSS generic family, so Apple devices — most of the audience —
get rounded type natively, with a graceful fallback elsewhere. No webfont, no
CSP problem, no download.

**Zero new tokens** — no new colours, and nothing new on the type or radius
scales. That was not true of the first draft, and both gates caught it:
`ui-check` rejected `999px` and `19px` (pulled back to the existing `14px` and
`18px`, visually identical at these sizes), and `design-check` rejected nine
invented tints — every one of which turned out to have an exact token already,
`#04201a` being `--text-inverse`, whose documented usage is literally "text on
green primary buttons". Worth recording: the ratchets caught a claim of "no new
colours" that was wrong by nine.

Two documented gaps close with it: `.ui-step` at 44×44 removes 9 of the 34
undersized controls (§8), and one `:focus-visible` rule on the base classes
closes the focus-ring gap §8 has carried since it was written.

**Migration** — step 1 (define the classes, no markup touched) and step 2
(drawer/menu rows → `--ghost`, v2.9.6) are done. Steps 3–5 are in §11 backlog
item 1b.

#### 4.1.1 Primary action — `.gd-go` *(legacy)*

```css
flex: 1.5;
min-height: 56px;
background: linear-gradient(180deg, #1ae0b8, #00c2a0);
border: 1px solid #0a9d83;
color: #06231d;
font-size: 13px;
font-weight: 800;
border-radius: var(--r-sm);
box-shadow: var(--sh-raise);
```

Used for: START, SAVE, primary CTAs.

#### 4.1.2 Default action — `.gd-btn`

```css
flex: 1;
min-height: 56px;
background: linear-gradient(180deg, #13203a, #0d1828);
border: 1.5px solid #2a3550;
color: #9fb3c8;
font-size: 11px;
font-weight: 800;
border-radius: var(--r-sm);
display: inline-flex;
flex-direction: column;
align-items: center;
gap: 4px;
```

Used for: Sub, Undo, Prev sub, Next sub, dashboard tiles.

#### 4.1.3 Variants

| Variant | Modifier | Background | Border | Text |
|---|---|---|---|---|
| Reset (danger) | `.gd-reset` | linear-gradient red tint | `#e94560` | `#ff7088` |
| Sub | `.gd-sub` | gradient cyan tint | `#5bc0de` | `#5bc0de` |
| Pause | `.gd-pause` | amber tint | `#f0a500` | `#f0a500` |

#### 4.1.4 Icon-only button

Square 38×38, `border-radius:10px`, `border:1px solid #444`, background `none`, icon inherits `color:#ccc`.

Used for: hamburger menu trigger, settings, donate.

#### 4.1.5 Stepper

Two circular `-`/`+` buttons flanking a tabular numeric value.

```css
button { width: 18-26px; height: 18-26px; border-radius: 50%; }
```

Tinted by context (red for half-length, green for sub-every, cyan for players-per-sub).

### 4.2 Chip / Pill

#### 4.2.1 Player chip — bench

```css
display: inline-flex;
gap: 4px;
padding: 4px 10px;
background: rgba(240,165,0,.10);
border: 1px solid rgba(240,165,0,.35);
border-radius: 14px;
font-size: 12px;
font-weight: 700;
color: #f0a500;
```

#### 4.2.2 Player chip — on field

Same shape; uses `--accent-green` family.

#### 4.2.3 Formation chip — selected

```css
padding: 4px 9px;
background: rgba(0,212,170,.16);
border: 1.5px solid #00d4aa;
color: #00d4aa;
border-radius: 14px;
font-size: 11px;
font-weight: 800;
```

#### 4.2.4 Formation chip — unselected

Same but `background: transparent`, `border-color: #2a3550`, `color: #9fb3c8`.

#### 4.2.5 Plan-profile chip

Purple-tinted pill containing a name + pencil-rename icon + × delete icon.

### 4.3 Card

```css
background: var(--surface-card);
border: 1px solid var(--border-subtle);
border-radius: var(--r-md);
overflow: hidden;
```

Internal padding 8-12px. Often has a header row with an eyebrow label (10px, weight 800, 1.2px letter-spacing, uppercase) on the left and optional action chips on the right.

#### 4.3.1 Grouped settings list — `.set-group` / `.opt-row` (v2.9.32)

ONE container per settings section instead of a box per row (the Settings tab
read as a wall of panels). `.set-group` is a `#16213e` 12px-radius card whose
children divide with `--border-subtle` hairlines; `.set-row` inside it drops
its own fill/radius/margins. `.opt-row` is the radio-list choice row (sub
strategy): full-width transparent button, title + one-line stance, selected =
the solid-fill flip below. Surfaces visible on a settings screen are exactly
three: background / section card / control.

**Selection affordance (v2.9.32, owner):** selected = a SOLID accent fill
with inverse (#06231d) text — no ✓ tick, no tint. The old treatment
(16%-alpha tint + ✓) was a whisper plus furniture; the solid fill is a
luminance flip, which is what survives sunlight and colour-blindness (WCAG
1.4.1 is satisfied by lightness contrast, not hue). The fill takes the
option's semantic accent: green by default, GK pink for keeper picks, amber
for player-of-the-match, the strategy's own colour on strategy rows.

### 4.4 DSEG clock

```css
font-family: 'DSEG', monospace;
font-size: min(13vw, 56px);
font-weight: bold;
letter-spacing: 2px;
font-variant-numeric: tabular-nums;
line-height: 1;
```

Used everywhere a time value is displayed. Colours:
- White / `var(--text-primary)` — main game time
- `var(--accent-green)` — countdown to next sub (running)
- `var(--accent-cyan)` — scrubbed-off-live state
- `var(--accent-red)` — half-length adjustment, period label

### 4.5 Overlay / Modal

Two patterns:

#### 4.5.1 `.ov` — full-screen modal

```css
position: fixed; inset: 0;
background: rgba(0,0,0,.88);
display: none;
align-items: center;
justify-content: center;
z-index: 9500;
```

Visible when `.show` class is added. Contains an `.ab` (modal body) inside.

#### 4.5.2 `.ab` — modal body

```css
background: var(--surface-card);
border: 1px solid var(--accent-cyan);
border-radius: var(--r-lg);
padding: 20px;
max-width: 380px;
width: 90%;
max-height: 90dvh;
overflow-y: auto;
```

#### 4.5.3 Dropdown menu — `#gameMenu` / `#planMenu`

```css
position: absolute;
top: 50px;
left: 8px;
background: #0d1828;
border: 1px solid #2a3550;
border-radius: 12px;
box-shadow: var(--sh-popup);
padding: 8px;
min-width: 220px;
z-index: 9500;
```

Items are full-width buttons with leading icon (15-17×15-17px), 13-15px label, 13px vertical padding.

#### 4.5.4 Floating popup — formation picker

Same shape as dropdown menu but positioned absolutely above an in-card trigger button.

#### 4.5.5 Drawer item (v2.7.83)

Standard item inside the side drawer:

```css
width: 100%;
padding: 13px 14px;
background: transparent;
border: none;
color: var(--text-secondary);
font-size: 15px;
font-weight: 700;
text-align: left;
border-radius: 8px;
display: flex; align-items: center; gap: 12px;
```

Leading icon 15×15. Destructive items (End game) use `color: var(--accent-red-light)`. The Donate footer item uses an amber pill background (`rgba(255,196,40,.08)` bg, `rgba(255,196,40,.4)` border, `var(--accent-yellow)` text).

#### 4.5.6 Daily coach quote (v2.7.80→.82)

Centred italic line on the home page body, replaces the static tagline once a coach has at least one team. Picks one of 10 quotes per local date (stable across refreshes within the same day).

```html
<div id="hdrQuoteTop" style="font-size:13px;color:#eee;font-weight:600;font-style:italic;line-height:1.35">
  "Every kid deserves a turn."
  <span style="opacity:.6;font-style:normal;font-weight:600">— grassroots mantra</span>
</div>
```

### 4.8 Team card (home list)

Each team in the home list renders as a chevron-tappable card with the sport-icon + name + meta line. Variants:

- **Default** — neutral border, chevron action on the right
- **Needs setup** — amber Set up pill on the right (renders when `players.length < FORMATS[fmt].onField`)
- **Has active game (v2.7.77)** — `border: 1.5px solid var(--accent-green)` + `box-shadow: 0 0 0 4px rgba(0,212,170,.08)` accent ring. Adds an inline "Game in progress · Q1 · 0:00 · 0-0" meta line under the player count. Right-side action becomes a pair of buttons: outlined **Discard** + green **Resume**. Tapping anywhere else on the card also resumes.

### 4.6 Tab strip (AUTO/CUSTOM)

```css
background: var(--surface-card);
border: 1px solid var(--border-subtle);
border-radius: var(--r-md);
padding: 4px;
display: flex;
gap: 4px;
```

Each tab fills equal width, padding `9px 4px`, font 12px / weight 800 / .4px letter-spacing. Selected tab gets cyan tint + 1.5px cyan border.

### 4.7 Field viewer

#### 4.7.1 3D pitch (afl3d)

Three.js renderer hosted in a container div. Provides Behind / Side / Top / Top-landscape (`top-h`) camera presets via in-canvas overlay buttons (top-left). Pills are HTML overlays projected over the canvas. Supports soccer, AFL, netball, basketball.

#### 4.7.2 2D pitch fallback

SVG-based pitch with rotateX-transformed plane to simulate perspective. Used when Three.js isn't available.

#### 4.7.3 Field pill (`.fc`)

Player shirt + name + minutes, positioned absolutely. Variants:
- `.fc-on` — green outline (on field)
- `.fc-off` — red outline (coming off this sub)
- `.fc-gk` — pink outline (goalkeeper)
- `.fc-sel` — cyan glow (selected for swap)
- `.fc-just-on` — green pulse animation (just subbed on)
- `.fc-just-swap` — cyan pulse (just swapped)

### 4.9 Dev-mode panel (v2.8.8) — non-coach surface

The only component in the app not intended for a coach. Hidden unless `?dev=1`
has been visited on this device (`#devFab` is `display:none` otherwise).

| Element | Spec |
|---|---|
| Launcher `#devFab` | Fixed pill, `right:10px bottom:70px` (clears the tab bar), `z-index:9998`. `--accent-purple` border + label on a `.15` tint. Label `DEV`, 11px/800, 1px tracking. |
| Panel `#devOv` | Standard `.ov` / `.ab` modal (§4.5), `max-width:400px`, `max-height:88vh`, scrolls internally. |
| Section eyebrows | 10px/800, 1px tracking, uppercase, `--accent-purple`. |
| Primary actions | `--accent-purple` border + label on `rgba(167,139,250,.15)`. |
| Secondary actions | `--border-emphasized` border, `--text-secondary` label (matches §4.1 secondary). |
| State readout | Monospace 11px, `--surface-card` on `--border-subtle`, `line-height:1.6`. |
| Destructive | "Turn dev mode OFF" uses `--accent-red`, per §4.1. |

**Colour note.** This panel first shipped with three invented purples
(`#a06cd5`, `#c9a6f0`, `#2b1a3d`) because it was built without consulting this
document — the exact failure §10 warns about. Corrected in v2.8.9 to the
existing `--accent-purple` `#a78bfa`, which the Game Plan panel and "Save plan
profile" already use. Purple means *"planning / meta"* in this app; dev mode
belongs to that family.

---

## 5. Patterns

### 5.0 THE BENCHMARK — the Team settings standard (owner-stamped, v2.9.32)

The refined Settings tab (`teamSettings`; before/after record in
`docs/records/v2.9.32-team-settings/`) is **the bar every screen gets
measured against**. What makes it the benchmark:

1. **Two colours used** (owner's words): NEUTRALS + ONE ACCENT. The page is
   surfaces and blue-grey text, with brand green as the only accent — on
   selection fills, stepper values, the one helper action. Red and amber may
   appear ONLY when their meaning is on screen (danger / opponent / a live
   warning), never as decoration or variety.
2. **Three surfaces max**: background / section card / control. ONE
   `.set-group` card per section, rows divided by hairlines — never a box
   per row.
3. **Selection is a solid accent fill** with inverse text — a luminance
   flip. No ticks, no tints.
4. **One component per family**, shared with every other screen
   (`renderFormationTiles`, `.ui-chip` shapes, `.ui-step`) — nothing bespoke
   that another screen renders differently.
5. **Quiet labels**: units and qualifiers live in an 11px sub-line, not in
   parentheses; helper text lives INSIDE the row it tunes, as its footer.
6. **Real controls**: `<button>` everywhere, ≥44pt hit areas, and a capped
   measure (600px) so wide screens keep labels beside their controls.
7. **FLAT (owner, 2026-08-14, v2.9.34)**: solid fills, no gradients, no
   resting shadows on controls; press feedback is a scale compression
   (.94–.98), not a drop or a lip. This supersedes the v2.9.3 "3px colour
   lip" press treatment in §4.1.0. Elevation belongs to the overlay layer
   only (drawers/menus keep their scrim shadow); state glows on the pitch
   are pitch identity, not chrome.

Rolling the rest of the app onto this bar is the §11 backlog's frame; the
component census (`docs/COMPONENT-CENSUS.md`) is the checklist. Suggested
order: game settings `s2` (shares three families with the benchmark, most
divergent sibling) → squad select `s1` → keeper/shape steps → summary `s5`
→ the Plan page.

### 5.1 Sub-flow gestures

1. **Tap a field player** → arms swap selection (cyan glow)
2. **Tap a second field player** → swap positions
3. **Long-press a field player (500ms)** → injury sub mode
4. **Tap a bench player while in injury mode** → bring on, prompt to send injured player off or back-to-bench

### 5.2 Sub strategies

- **Equal time** — app rotates players for balanced minutes
- **Matched pairs** — coach defines pairs that always swap together
- **Custom** — coach builds an explicit event-by-event plan

Internal keys `fair` / `paired` / `planned`. UI toggle exposes `auto` (fair+paired) and `custom` (planned).

### 5.3 Plan-page sandwich layout

- Top: clock anchor (game time + sub-every dual clock)
- Middle: scrollable body (tabs, profiles, players-per-sub, equal-time tile, field card, projected minutes, sub list)
- Bottom: control band (Prev sub · LIVE · Next sub)

### 5.4 Page entry routes

- **Play now** (team-action menu) → Squad picker → Game screen
- **Plan ahead** (team-action menu) → Plan screen directly (no squad picker)
- **Past games** (team-action menu) → Match history
- **Edit team** (team-action menu) → Team editor

### 5.5 Navigation primitives

The bottom tab bar handles the 3 core context switches:
- **Game** → `s4` if active game exists, else home
- **Plan** → `subOrderOv` if active game exists, else home
- **Team** → `editTeam` for current team

The brand-bar hamburger (top-left) opens the active screen's drawer:
- **Home drawer** — Settings · Sign in / account · (footer) Send feedback · Donate
- **Game drawer** — Edit team · Settings · End game · (footer) Send feedback · Donate
- **Plan drawer** — Edit team · Settings · End game · (CUSTOM only: Save plan · Edit Lineup) · (footer) Send feedback · Donate

### 5.6 Auto-naming new teams (v2.7.76)

If the coach saves a team without entering a name, generate it from `sport + format`:
- "Soccer 11v11" · "Netball GO" · "AFL U13" · "Basketball 5v5" · "Water Polo Junior 25m"
- Collision → append `#2`, `#3`, etc.

Legacy `"Untitled Team"` rows migrate on next load.

### 5.7 Day-stable rotating content

The daily quote uses `Math.floor(new Date().setHours(0,0,0,0)/86400000) % N` so the same quote shows all day across refreshes, advances at midnight. Same pattern is reusable for any "once-per-day" surfaced content.

### 5.8 Bench urgency escalation (v2.9.38)

The live game's bench escalates on the **countdown's own stamped thresholds**
(§4.4: amber ≤ 30s, red ≤ 10s) — never on thresholds of its own:

| Window | Bench behaviour |
|---|---|
| Ambient | Quiet pills; the countdown dominates (SCREEN-BRIEFS s4, "three kings") |
| ≤ 30s (`#s4.sub-soon`) | **Colour only** — next-on borders amber, NEXT ON tag grows "· get ready", countdown digits amber (a v2.9.38 cascade fix: `.tmr-c.tmr-sub` used to out-order `.warn`). No layout change: a 44dvh bench expansion was tried and starved the pitch at 3 players per sub |
| ≤ 10s (`#s4.sub-now`) | Borders red + `bpPop` pulse (scale 1 → 1.015, flat — no glow added); **portrait phone only (< 768px):** `#s4.bench-takeover` — the bench slides up as a **bottom drawer** (`#benchDrawer`) over the field; window-scoped Field/Bench chip (`#benchViewBtn`) as escape hatch. Landscape phones keep their right-rail bench — the drawer is inert there |
| Sub fires / none upcoming | All classes clear; the drawer slides away; the relay card owns the sub-due moment |

The drawer is **overlay grammar** (§2.5 / v2.9.34: elevation belongs to the
overlay layer) — sheet radius 16 top, grab handle, scrim-grade shadow, slide
.28s (none under `prefers-reduced-motion`). Because it overlays rather than
re-flows, the pitch beneath never changes size while it's up; `#pitchMid`
carries `isolation:isolate` so the tokens' depth-sort z-indexes stay beneath
it. `renderRoster` renders the bench into the drawer body while takeover is
active, `#benchTop` otherwise.

Rationale: the takeover lands at sub-NOW, not sub-soon — the s4 brief puts
"everything else recedes" at sub-due, and the field is an ambient Must-show; a
30s-early takeover would be a fourth king on a timer. The chip exists only
inside the window (s4's choice budget is over target — no standing toggle).
Threshold crossings re-render the roster (px-projected tokens must re-read the
pitch height when the in-flow cap changes); the escalation is driven from
`updateClkSub` → `_setBenchUrgency`.

The next-on wave renders as ONE benchmark card (§5.0 grammar — one card,
hairline rows) laid out as a table: columns ↑ COMING ON | ↓ OFF | AT (+ minutes
+ reorder chevrons), so incoming names read straight down a column. Direction
language is the announce screen's (§7): ↑ green = coming on, ↓ amber = coming
off — the only two colours the bench speaks; jersey numbers are neutral.
Injury-pick mode and the landscape rail (170px) keep per-player pills.

---

## 6. States

| State | Visual treatment |
|---|---|
| Default | Per component |
| Hover (desktop) | Not used — touch-first |
| Active / pressed | `transform: translateY(1px)`, smaller shadow |
| Selected | Accent-tinted background, accent border, accent text |
| Disabled | `opacity: .4`, `cursor: default`, no shadow |
| Loading | (No spinner pattern yet — uses skeleton/text) |
| Warning | Amber tint, amber border, amber text |
| Danger | Red tint, red border, red text |
| Success / Live | Green tint, green border, green text |
| Off-live (scrub) | Cyan tint, cyan border, cyan text |

---

## 7. Sports-aware content

| Sport | Format codes | Periods | GK | Ball icon | Field-viz status |
|---|---|---|---|---|---|
| Soccer | 4v4 / 5v5 / 6v6 / 7v7 / 9v9 / 11v11 | Halves | Yes (5v5+) | Pentagon-seamed circle | Full 3D |
| Netball | Set / GO / Junior / Open | Quarters | No | Cross-seamed circle | Full 3D |
| AFL | Auskick / U9-U16 / Senior | Quarters | No | Tilted ellipse | Full 3D |
| Basketball | 5v5 | Quarters | No | X-seamed circle | Full 3D (court accuracy backlog item) |
| Water polo | Junior 25m / Senior 30m | Quarters | Yes | (TBD) | Preview — pool builder pending |

Position labels (rendered on shirt or chip):
- Soccer: GK / LB / RB / CB / LM / CM / RM / LW / RW / ST / FW
- Netball: GS / GA / WA / C / WD / GD / GK
- AFL: FB / HB / C / W / HF / FF / RUC / R
- Basketball: PG / SG / SF / PF / C

---

## 8. Accessibility

Verified by `npm run a11y` (`test/a11y-check.mjs`), which walks eight screens in
a real browser at 390×844. Claims below are marked with how they stand.

- ✅ **All interactive elements include `aria-label` or visible text.** Enforced —
  a control with no accessible name fails the build. 114 controls checked.
  Elements inside an `aria-hidden` subtree (the drawer scrim) are deliberately
  excluded; that is what `aria-hidden` means.
- 🟡 **Hit targets ≥ 44×44pt (iOS HIG minimum).** This is the **target**, not the
  current state: **34 controls are below it** and the check is ratcheted at that
  number, so it can fall but never rise.
  Until v2.9.1 this section asserted the minimum flatly, which was simply false —
  and being written down stopped anyone checking. The worst offenders are the
  clock steppers (18×18) and the tip-carousel arrows (24×24). Sizing them up is a
  layout change, not a token change: the steppers are small so two clock anchors
  fit side by side on a phone. Either they change or this standard does — but the
  document and the app must not disagree again.
- ✅ Color is never the sole indicator of state — labels accompany colour cues
- ✅ DSEG digits and tabular nums prevent layout shift as time changes
- ✅ Safe-area insets respected for iPhone notch + home indicator
- 🔴 **Focus rings** — one rule exists; there is no systematic `:focus-visible`
  treatment. Reported by the check on every run until it is closed.

---

## 9. Naming conventions

- IDs use camelCase for app-state elements (`subOrderOv`, `planClockAnchor`)
- CSS classes use kebab-case (`gd-btn`, `fc-on`, `bottom-tab-bar`)
- Sport keys lowercase (`soccer`, `afl`, `netball`, `basketball`)
- Format keys hyphenated with sport prefix when ambiguous (`nb-go`, `afl-13`, `bball-5`)

---

## 10. Versioning + change log

The running version (e.g. `v2.7.75`) appears in the brand bar. Each release adds an entry to `CHANGELOG_DATA` in `index.html` + a row in `CHANGELOG.md`. A "What's New" modal fires once per version bump.

When introducing or modifying components: update this document **first**, then implement against the spec. The doc is the source of truth.

---

## 11. Cleanup backlog

### 11.0 STAMPED CONTROL STANDARD (owner, 2026-08-09) — the consolidation target

Stamped from the live-gallery elements audit (`dev-gallery.html` strip +
`test/grid-check.mjs`), which exposed three button font systems — including
the legacy `.btn` family silently falling back to **Arial** (no font-family
declared, so it never inherits the app stack: primary buttons render in a
different typeface from the rest of the app on-device).

The target every migration step (03–05 below) now aims at:

| Decision | Stamp |
|---|---|
| Button typeface | **SF Rounded** (`ui-rounded` first, as the ui- family already does) — controls only; content stays `-apple-system` |
| Action-button label | **16px / 800** (bottom-zone Next / Save / START tier). Micro-labels keep their small tier (tabs 10/700, tags 10/800, dash tiles 13/800) |
| Radius scale | **{4, 8, 12, 16}** + pill — tags 4 · chips/inputs 8 or 12 · buttons 12 · sheets/pills 16. Everything else (6, 10, 14, 20…) migrates to the nearest step |
| Touch targets | ≥44px hit area on every control — visual can stay smaller with padded hit zones (steppers 40, score ± 24, plan Build chip are the offenders) |
| Immediate bug fix | ✅ **done v2.9.29** — `font-family:inherit` on the legacy `.btn` / `.back-btn` / `.st-btn` / `.chip` controls kills the Arial fallback ahead of the full migration; ui-check now gates all four classes declaring a font stack |

Audit tooling: `node test/grid-check.mjs` (margins 16 · heights %4 · the
radius scale · ≥44 targets — reporting now, ratchet once numbers settle);
the gallery's elements strip annotates every specimen with its measured
font/size/radius so drift is visible at a glance.

### Done since v2.7.75
- ✅ Untitled Team auto-naming (v2.7.76)
- ✅ Resume-banner → inline team-card affordance (v2.7.77)
- ✅ Basketball 3D pills floating + zoom broken (v2.7.78)
- ✅ Landscape phone Plan clock + home tagline overlap + formation chip orphan (v2.7.79)
- ✅ Tab bar hidden on landing pages + daily quote (v2.7.80)
- ✅ Home cleanup — single hamburger / no floating buttons (v2.7.81 → .82)
- ✅ Hamburger → side drawer with Donate + Feedback footer (v2.7.83)
- ✅ Single app header (hamburger LEFT · logo CENTRE · version RIGHT) (v2.7.82)

### Still open

0. **Token coverage (v2.8.9)** — `npm run design` counts colours in `index.html`
   that aren't written down here. It started at **64 colours / 232 uses**;
   documenting the neutral ramp and the position-tag palette (both of which were
   real, deliberate systems that had simply never been recorded) took it to
   **43 / 59**. The check is ratcheted at 43: it may fall, never rise, so new
   drift fails the gate immediately.
   The remainder is mostly **gradient stop pairs** — nearly every raised button
   and card has a light/dark stop derived from a token but undocumented, the way
   `--accent-green-light/-dark/-deep` are for the primary button. Documenting
   that family is the next pass and would take this close to zero.
1. **Collapse the neutral ramp** — nine greys for text is too many. Target ~4.
   This is a visual change on every dense list, so it needs an eye on it, not a
   find-and-replace.
1a. **Pitch-chip legibility — DECIDED: keep current sizes (v2.9.2)**
   11 declarations of sub-9px text sit on the 3D player chips; AFL uses **7px**
   position labels and 8px names because 18 players must fit.
   A dynamic version was built and rejected: `--chip-scale` derived from
   container width and chip count, text floored at 9px via `max()`, with a
   `[data-dense]` mode shedding the minutes badge and position code. It did
   raise AFL to 9px, but it changes a surface that works today, and the owner's
   call was to keep the current sizes. Kept in `git stash` on
   `claude/game-flow-recorder` if it's ever wanted.
   **Do not re-attempt without a fresh decision.** Two things learned if it is
   revisited: (a) crowding must only ever *shrink* type — scaling sparse
   formations up made labels wider and collided harder, because a 7v7 pitch is
   the same size as an 11v11 one; (b) the sub-9px count is the *symptom*, and
   the real constraint is label **width**, not font size.
   Note the separate, pre-existing issue this surfaced: on soccer, `LB`/`RB`
   labels overlap the keeper's shirt at the current sizes too. Unrelated to the
   above, unfixed.
1b. **Migrate onto the `ui-` button system (v2.9.3)** — the six variants are
   defined (§4.1.0). Remaining steps, each verifiable alone with
   a before/after screenshot and the `ui` ratchet lowered deliberately after:
   **2.** ~~drawer + menu rows → `.ui-btn--ghost`~~ **done v2.9.6** — the 12
   true drawer rows (game menu 3, plan menu 4, `openDrawer()` injected 5)
   migrated; ghost gained colour-only `.is-plan` / `.is-danger` tones. The
   original "46" count was the file-wide `text-align:left` tally, which
   includes modal containers and the team-action menu — those belong to
   steps 4–5.
   **3.** steppers + chips → `.ui-step` / `.ui-chip` (21; where the 44pt fix
   lands). **DONE.** 3a (v2.9.30): all 14 `.st-btn` steppers → `.ui-step`
   (class deleted), and the §11.0 hit-area offenders (score ± 28px, AFL
   GOAL/BEH/undo, plan Build chip) got ≥44 boxes via the `.hit44` pattern —
   transparent ≥44×44 button, visual on an inner span, negative margin keeps
   the layout footprint (a11y ratchet 31 → 27). 3b (v2.9.31): all 16 `.chip`
   call sites → `.ui-chip`; `.chip` + `.chip.gk-sel` (dead) deleted; the
   `.sel` ✓ tick moved onto `.ui-chip.sel` so every selected chip — including
   POTM and scorer — shares one affordance.
   **4.** outline actions → `.ui-btn--secondary` + tone modifiers (27)
   **5.** primary/destructive, then judge the rest — genuinely singular things
   may stay inline if naming them adds nothing.
   Note this step **does** change how the app looks, unlike the rest of the
   consistency work, which deliberately moved no pixels. Scope is chrome only:
   the clock, pitch and player chips are the app's identity and are out.
2. **Team-action menu hierarchy** — "Edit team" greyed pill clashes with the three coloured action items. Either match the colours or move into the drawer.
3. **Tab bar icon contrast** — verify the inactive icon stroke is bright enough against the dark bar on real-device displays.
4. **Equal-time ideal tile** — large text block on the Plan page; reduce to one tight line or roll into the clock anchor as a tag.
5. **Focus rings** — none defined; add a visible focus indicator for keyboard navigation.
6. **Light theme** — not supported. Document as out of scope or plan.
7. **Basketball court accuracy** — match real NBA / FIBA markings: straight-side 3-point line, inner centre circle (4ft), backboard 4ft inside the baseline, half-dashed free-throw circle.
8. **Water polo field viz** — `_buildWaterPolo()` builder + pool tinted ground + goal posts at each end.
9. **3D pitch race on first paint** — occasionally renders black if the screen flips visible after afl3d.init runs at 0×0 size. Investigate ResizeObserver fallback timing.

---

## 12. References

- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines)
- [Figma — Design System Examples](https://www.figma.com/resource-library/design-system-examples/)
- iOS native apps (Clock, Timer, Phone) — pattern reference for the bottom tab bar
- Material Design 3 — surface elevation, motion duration scale
