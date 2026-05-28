# Sub Timer — Design System

> Last updated: v2.7.83
> Sub Timer is a single-file PWA for grassroots youth-sports coaches. This document is the canonical reference for every design token and component used in the app. Inspired by Apple's Human Interface Guidelines + Figma's design-system examples.

---

## 1. Design principles

1. **Game day clarity over screen real-estate** — the coach is on a sideline in sunlight watching twelve seven-year-olds. Every screen must be readable in one glance. Big DSEG clocks, big sub buttons, no precious typography.
2. **One consistent app shell, many views** — two persistent anchors (top brand bar + bottom tab bar) wrap every screen so the coach never loses orientation. Per-page chrome lives inside that shell.
3. **Auto by default, custom by intent** — the app picks fair subs unless the coach explicitly builds a plan. The custom path is one tap deeper, not the default.
4. **Tactile, gestural** — tap to swap, long-press for injury sub, drag to reorder. Buttons are large; hit targets exceed 44×44pt.
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

### 2.2 Typography

| Role | Size | Weight | Letter-spacing | Notes |
|---|---|---|---|---|
| `.tmr-c` (DSEG clock) | `min(13vw, 56px)` | bold | 2px | DSEG-7 Classic Bold font, tabular-nums |
| Page title (`h1` in `.hdr`) | 16px | 700 | — | |
| Card title eyebrow | 10px | 800 | 1.2px | `text-transform:uppercase` |
| Section heading | 13px | 800 | 1.5px | |
| Body | 13-14px | 600-700 | — | |
| Button label | 11-13px | 800 | .3-.5px | |
| Pill label | 11-12px | 700 | .3px | |
| Meta / caption | 10-11px | 600 | .4px | |

Font stack: `-apple-system, BlinkMacSystemFont, sans-serif`. DSEG-7 Classic Bold loaded via `@font-face` for the digital clocks.

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

### 3.1 Top brand bar (`#appBrandBar`)

- `position:fixed; top:0; left:0; right:0`
- Height 44px + `env(safe-area-inset-top)`
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

### 3.3 Page header (`.hdr`)

- 84px min-height, vertically centred content (`min-height:84px;display:flex;flex-direction:column;justify-content:center`)
- Padding `10px 16px`
- Background: linear gradient `#16213e → #0f3460`
- 3px bottom border `var(--accent-red)`
- `position:sticky; top: calc(44px + env(safe-area-inset-top))` — sticks below the brand bar
- Contents per-page (title / score / actions)
- **Home exception (v2.7.82)**: `#home > .hdr { display:none }` — the brand bar IS the only header on home; the body content starts immediately below it.

### 3.4 Side drawer (v2.7.83)

- `position:fixed; top:0; left:0`, width 280px (max 80vw), height 100dvh
- `transform: translateX(-100%)` by default; `.drawer-open` → `translateX(0)`
- 0.25s ease transition
- Background `var(--surface-card-2)` with 1px right border `var(--border-emphasized)` + 4px×24px ambient shadow
- Padding top accounts for brand bar (`calc(48px + env(safe-area-inset-top) + 12px)`)
- Companion **scrim** `#appDrawerScrim` — `position:fixed inset:0`, 55% black, z-index 9400. Tap to close.
- Triggered by `#globalMenuBtn` via `toggleGlobalMenu()` which routes to the active screen's drawer (home / game / plan)
- **Drawer body**: vertical list of menu items, each `13px 14px` padding, 15px label, leading icon
- **Drawer footer** (`.drawer-donate`): pinned to the bottom via `margin-top:auto`, divided from the body by a 1px top border. Always contains Send feedback + Donate (amber pill).

### 3.4 Page content padding

All `.scr` screens:
- `padding-top: calc(34px + env(safe-area-inset-top))` — clears brand bar
- `padding-bottom: calc(58px + env(safe-area-inset-bottom))` — clears tab bar

Game screen (`#s4`) and Plan screen (`#subOrderOv`) override with overflow:hidden flex layout — their internal bottom-band (`#gameDash` / `#planControlBand`) absorbs the tab-bar offset via inline padding.

---

## 4. Components

### 4.1 Button

#### 4.1.1 Primary action — `.gd-go`

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

---

## 5. Patterns

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

- All interactive elements include `aria-label` or visible text
- Hit targets ≥ 44×44pt (iOS HIG minimum)
- Color is never the sole indicator of state — labels accompany colour cues
- DSEG digits and tabular nums prevent layout shift as time changes
- Safe-area insets respected for iPhone notch + home indicator
- Focus rings: not currently styled — relies on browser default. **Outstanding gap.**

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
1. **Team-action menu hierarchy** — "Edit team" greyed pill clashes with the three coloured action items. Either match the colours or move into the drawer.
2. **Tab bar icon contrast** — verify the inactive icon stroke is bright enough against the dark bar on real-device displays.
3. **Equal-time ideal tile** — large text block on the Plan page; reduce to one tight line or roll into the clock anchor as a tag.
4. **Focus rings** — none defined; add a visible focus indicator for keyboard navigation.
5. **Light theme** — not supported. Document as out of scope or plan.
6. **Basketball court accuracy** — match real NBA / FIBA markings: straight-side 3-point line, inner centre circle (4ft), backboard 4ft inside the baseline, half-dashed free-throw circle.
7. **Water polo field viz** — `_buildWaterPolo()` builder + pool tinted ground + goal posts at each end.
8. **3D pitch race on first paint** — occasionally renders black if the screen flips visible after afl3d.init runs at 0×0 size. Investigate ResizeObserver fallback timing.

---

## 12. References

- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines)
- [Figma — Design System Examples](https://www.figma.com/resource-library/design-system-examples/)
- iOS native apps (Clock, Timer, Phone) — pattern reference for the bottom tab bar
- Material Design 3 — surface elevation, motion duration scale
