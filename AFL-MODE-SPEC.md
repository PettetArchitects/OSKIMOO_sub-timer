# Sub Timer — AFL Mode Spec

**Status:** research complete, build not started · **Target version:** v2.0-beta
**Scope:** add Australian Rules Football as a third sport, alongside Soccer and Netball.

---

## 1. What's different about AFL vs the sports we already support

| | Soccer | Netball | **AFL** |
|---|---|---|---|
| Field shape | Rectangle | Rectangle (thirds + circles) | **Oval** |
| Players on field | 4–11 | 7 | **12 / 15 / 18** (age-dependent) |
| Bench | Up to 5 | Up to 2 | **5 interchange (senior) / unlimited rolling (junior)** |
| Periods | 2 halves | 4 quarters | **4 quarters** (reuse netball logic) |
| Positions | 5 tags (GK/DEF/MID/WNG/FWD) | 7 fixed (GS/GA/WA/C/WD/GD/GK) | **~18 with line groupings** + specialist Ruck |
| GK concept | Yes | No (GK is a position not a role) | **No GK at all** |
| Field markings | Centre circle, boxes, goals | Three thirds, semicircle arcs | **Centre square, 50m arcs, goal squares, 4 posts/end** |
| Rotation rule | Unlimited rolling | Unlimited rolling | **Senior: 75/match cap; Junior: unlimited rolling** |

The headline complexity adds: **oval graphic, 18-position taxonomy, age-bracketed format presets, no GK**.

---

## 2. Format presets we need to add

Following the AFL NSW Juniors / AFL Sydney pattern, with senior on top:

| Format key | Age / League | On field | Bench | Qtr length | Field |
|---|---|---|---|---|---|
| `afl-auskick` | U5–U8 (Auskick) | 4–6 | unlimited | 8–10 min (or session-based) | Modified small |
| `afl-9` | U9 | 12 | unlimited | 10 min | Modified, zones |
| `afl-10` | U10 | 12 | unlimited | 12 min | Modified, zones |
| `afl-11` | U11 | 15 | unlimited | 15 min | Half-full, zones transitioning out |
| `afl-12` | U12 | 15 | unlimited | 15 min | Full ground, simplified positions |
| `afl-13` | U13 | 18 | unlimited | 18 min | Full ground, full 18 positions |
| `afl-14` | U14 | 18 | unlimited | 18–20 min | Full ground, full 18 |
| `afl-15` | U15 | 18 | unlimited | 20 min | Full ground, full 18 |
| `afl-16` | U16 | 18 | unlimited | 20 min | Full ground, full 18 |
| `afl-senior` | Open / senior | 18 | 5 interchange (75-rotation cap) | 20 min + time-on | Full senior oval |

**Note:** Junior quarter lengths verified before locking — current AFL Sydney Juniors 2026 by-laws are the source of truth.

---

## 3. Position taxonomy

AFL has 18 standard positions grouped into lines. We model this in three tiers:

### Tier A — "Zones only" (Auskick / U9–U10)
Three big buckets, no specialist positions:
- **F** Forward
- **C** Centre
- **B** Back

Maps to existing position-tag style. Simple. Coach rotates kids across F/C/B each quarter.

### Tier B — "Simplified" (U11 / U12)
Six lines + ruck:
- **FB** Full back / **BP** Back pocket
- **HB** Half back
- **C** Centre / **W** Wing
- **HF** Half forward
- **FF** Full forward / **FP** Forward pocket
- **RUC** Ruck

Coach starts thinking about specialists but rotates liberally.

### Tier C — "Full 18" (U13+ and senior)
The standard 18-position structure:

```
Full Back  •  Back Pocket × 2          (3 backs)
Centre Half Back  •  Half Back Flank × 2  (3 half-backs)
Centre  •  Wing × 2                    (3 mid)
Centre Half Forward  •  Half Forward Flank × 2  (3 half-forwards)
Full Forward  •  Forward Pocket × 2    (3 forwards)
Ruck  •  Ruck Rover  •  Rover          (3 followers / ruck division)
```

Per-format defaults in the app:
- Auskick → Tier A
- U9–U10 → Tier A
- U11–U12 → Tier B (default), Tier C optional
- U13+ → Tier C (default), Tier B optional
- Senior → Tier C only

This gives coaches the right level of detail for their kids' age.

---

## 4. The oval pitch graphic

This is the **biggest visual lift** in the build.

### Approach options

**A. Pure CSS** — `border-radius: 50% / 50%` on a div with the right aspect ratio gives an ellipse. Add markings via positioned children. Cheap, clean, scales perfectly.

**B. SVG** — draw the oval as an `<ellipse>` element with markings as `<path>` / `<rect>` overlays. More precise control over markings (50m arcs as actual SVG arcs vs faked with CSS borders).

**C. Inline canvas / image** — overkill.

**Recommendation: CSS ellipse + absolute-positioned marking divs**, matching the pattern we use for the soccer rectangle and netball rectangle. Markings to draw:

| Marking | How |
|---|---|
| Outer oval | `border-radius: 50% / 50%`, white border |
| Centre square (50m × 50m) | Centred square ~ 22% of pitch width, white border |
| Centre circle | 4% diameter, white border |
| 50m arcs | Two semicircles cut by the goal line — CSS `border-top-left-radius` + `border-top-right-radius` |
| Goal squares | Small rectangles at each end, 9m × 6.4m proportional |
| Goal + behind posts | 4 short vertical line markers at each end of the long axis |

Apply the same **perspective tilt** (`rotateX(10deg)`) we use for soccer/netball so all three sports share the same visual language.

### Position placement

Player cards positioned with x/y % coordinates on the oval. The ground is wider than tall, so x ranges fuller than y. Example for an 18-player Full 18 layout:

```js
'full-18-3-3-3': [
  // Backs (y ≈ 85%)
  {label:'FB',   x:50, y:88},
  {label:'BPL',  x:30, y:85}, {label:'BPR', x:70, y:85},
  // Half-backs (y ≈ 72%)
  {label:'CHB',  x:50, y:72},
  {label:'HBFL', x:25, y:70}, {label:'HBFR', x:75, y:70},
  // Mid (y ≈ 50%)
  {label:'C',    x:50, y:50},
  {label:'WL',   x:18, y:50}, {label:'WR',   x:82, y:50},
  // Half-forwards (y ≈ 28%)
  {label:'CHF',  x:50, y:28},
  {label:'HFFL', x:25, y:30}, {label:'HFFR', x:75, y:30},
  // Forwards (y ≈ 12%)
  {label:'FF',   x:50, y:12},
  {label:'FPL',  x:30, y:15}, {label:'FPR',  x:70, y:15},
  // Followers (centre area)
  {label:'RUC',  x:50, y:40}, {label:'RR',   x:42, y:55}, {label:'R',    x:58, y:55}
]
```

---

## 5. Sport-aware text + behaviour we'll need to add

We already have a sport-aware system (`getSport()`, `sport.periodCount`, `sport.periodShort`, `sport.breakLabels`, `sport.positions`). For AFL:

```js
afl: {
  key: 'afl', label: 'AFL', icon: 'aflBall',
  positions: ['FB','BP','HB','C','W','HF','FP','FF','RUC','R'],  // simplified Tier B for the tag picker
  periodCount: 4,
  periodShort: q => `Q${q}`,
  breakLabels: { 1: 'QUARTER TIME', 2: 'HALF TIME', 3: 'THREE-QUARTER TIME' },
  formats: ['afl-auskick','afl-9','afl-10','afl-11','afl-12','afl-13','afl-14','afl-15','afl-16','afl-senior']
}
```

Quarters reuse the netball logic verbatim. Break labels are word-for-word identical to netball (already shipped).

**No GK** for any AFL format — `hasGk: false` across all preset entries. Frees us from the GK-swap UI flow at halftime for AFL teams.

---

## 6. Custom icon: AFL ball

Lucide doesn't have an Aussie-rules ball. We add one to `ICON_CUSTOM` alongside the soccer and netball balls:

- Oval/ellipse shape (not round)
- Laces stripe across the centre (the iconic Sherrin laces)
- Roughly 24×24 inline SVG, matching the line-art style of the others

---

## 7. The interchange / rotation cap (senior only)

For `afl-senior`:
- Track interchange count via the existing match log (`type:'sub'` events count toward the cap)
- Display a counter on the game screen: `Rotations: 23 / 75`
- Warn at 70 — *"Approaching rotation cap"*
- Block at 75 — *"Rotation cap reached"* unless the coach overrides

For junior AFL: no cap, no counter, no warning — same as our existing soccer/netball behaviour.

Plus the **concussion permanent-removal** flow already implemented via "out for game" injury sub — works as-is for AFL.

---

## 8. Build phasing

### Phase 1 — Spec foundation (~3 hr)
- Add `afl` to SPORTS with periodCount, breakLabels, formats list
- Add ~3 representative formats first: `afl-12`, `afl-13`, `afl-senior` (covers junior tier B, junior tier C, senior)
- Add custom AFL ball icon to ICON_CUSTOM
- Add Tier C 18-position formation array
- No oval pitch yet — uses existing rectangular pitch as a placeholder

Lets a coach create an AFL team and start a game with all the existing strategy / sub / undo features. Pitch will look wrong but functionality is there.

### Phase 2 — Oval pitch graphic (~3 hr)
- CSS ellipse with markings
- Sport-aware pitch class (`.lu-pitch.np-afl`)
- 18-position formation layout fine-tuned for the oval shape

### Phase 3 — Format depth (~2 hr)
- Add the remaining junior age formats (U9–U16) with correct quarter lengths + on-field counts
- Auskick format
- Tier A (zones-only) + Tier B (simplified) position layouts for junior formats

### Phase 4 — Senior rotation cap + counter (~2 hr)
- Rotation counter on game screen for `afl-senior`
- Warning + block at thresholds
- Match log totals "rotations used" alongside the existing playing-time stats

### Phase 5 — Polish (~1 hr)
- Format-specific defaults (sub frequency by age, sub strategy hints)
- Sport-aware tactical tips (analogous to existing soccer formation tips)
- AFL terminology check ("interchange" vs "sub" — coaches use both)

**Total: ~11 hr** for fully-featured AFL mode. Phase 1 alone (~3 hr) ships a usable basic AFL flow.

---

## 9. Open questions to resolve before building

1. **Which age first?** What level does the requesting coach actually coach — U10? U13? Senior club? Determines which format gets locked in first.
2. **NSW vs national rules** — should AFL Sydney Juniors quarter lengths be the default, or national averages? (NSW is fine for v2.0; expand later.)
3. **Position-tag depth for the editor** — do we expose all 18 positions in the tag picker for U13+, or stick with Tier B (6–7 tags) for editor sanity and rely on smart-assign to place to specific slots?
4. **Ruck handling** — do we treat Ruck as a special role like GK in soccer (i.e. a separate slot that doesn't sub like outfielders) or just another position tag?
5. **Mixed-sport coaches** — Sean's friends might coach soccer AND AFL. Does sport-picker need a "favourites" or default to last-used sport for new teams?

---

## 10. What we don't need to do

For clarity, here's what stays untouched:

- Sub strategies (Equal time / Paired / Manual / Full Control) — work identically for AFL
- Bench reorder, undo last sub, jersey numbers, side / foot prefs — all sport-agnostic
- Cloud sync, team management, AI roster import — same code path
- What's New modal, CHANGELOG — same release flow

The lift is **visual (oval) + taxonomic (18 positions) + format (age presets)**. The substitution-management engine we've built is the core of the app and serves AFL with zero changes.

---

## 11. Sources (for the eventual builder)

- [AFL Laws of Australian Football 2026 (PDF)](https://resources.afl.com.au/afl/document/2026/02/13/8676d880-481a-4211-a479-305f138ce8b6/Laws-of-Australian-Football-Final-13-February-2026-.pdf)
- [AFL Regulations 2026 (PDF)](https://resources.afl.com.au/afl/document/2026/02/13/54c158af-15e9-483b-a195-62a0f4e33b11/AFL-Regulations-Final-11-February-2026-.pdf)
- [Play AFL — Junior Rules](https://play.afl/junior-rules)
- [Junior Football Rules Program Handbook (May 2024 PDF)](https://play.afl/sites/default/files/2024-06/JuniorRules_May24_Final.pdf)
- [AFL Sydney Juniors (Play AFL)](https://play.afl/nswact/aflsj)
- [AFL Sydney by-laws & policies](https://sydneyafl.com.au/resources/by-laws-regulations-and-policies/)
- [NAB AFL Auskick](https://play.afl/play/auskick)
- [Australian rules football playing field (Wikipedia)](https://en.wikipedia.org/wiki/Australian_rules_football_playing_field)
- [2026 AFL rule changes explainer](https://www.afl.com.au/news/1464391/explainer-the-seven-afl-rule-changes-coming-in-for-2026)
- [Sydney Swans — 2026 rule changes explained](https://www.sydneyswans.com.au/news/1922948/2026-afl-additional-rule-changes-explained)
- [Hornsby Berowra Eagles — modified junior rules](https://hornsbyberowraeagles.com/modified-rules/)

**Caveat:** lock in the AFL Sydney Juniors 2026 by-laws (PDF behind their by-laws page) before locking junior age-format quarter lengths — the table above is the well-established national pattern, but NSW has some local quirks.
