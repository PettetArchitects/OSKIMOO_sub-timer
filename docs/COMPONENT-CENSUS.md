# Sub Timer — Component Census

> **The map of every repeated UI component across screens, and whether it is
> one thing yet.** Born v2.9.32 from the owner's gallery pass ("the formation
> interface is different on different screens"). The live gallery's elements
> strip (`dev-gallery.html`) is the visual twin of this file; `ui-check` /
> `a11y-check` / `grid-check` hold the ratchets. Update the status column as
> migration steps land — this is the checklist §11.1b works through.

Status key: ✅ one component · 🟡 one class, local drift · 🔴 divergent treatments.

| # | Family | Where it appears | Status | Target |
|---|---|---|---|---|
| 1 | **Formation picker** | Team settings · shape page · game settings (s2) | ✅ v2.9.32 — `renderFormationTiles()` on `.ui-chip--tile` | The in-game pitch popup (`#fmtToggle`) stays bespoke — documented exception, space-constrained overlay |
| 2 | **Sub-strategy chooser** | Team settings · game settings (`renderSubStratPicker`) · in-game modal (`#subStratOv`) | 🔴 three treatments: settings has the `.opt-row` grouped list (v2.9.32); the other two are `.ui-chip--card` stacks with different copy depth | One `.set-group` + `.opt-row` list everywhere; copy depth may differ by mode (midweek = dense, matchday = stance only) per SCREEN-BRIEFS |
| 3 | **Primary action button** | Next / Save / START etc. — legacy `.btn.btn-g` | 🔴 legacy class + inline variants (~46 `class="btn…"` sites incl. secondary) | `.ui-btn--primary` — migration step 5 (§11.1b) |
| 4 | **Secondary / outline / back** | `.btn.btn-o` + `.back-btn` | 🔴 27 outline call sites + back buttons | `.ui-btn--secondary` + tone modifiers — migration step 4 |
| 5 | **Steppers −/+** | 14 sites | ✅ v2.9.30 — `.ui-step` 48×48 | — |
| 6 | **Chips (single-line)** | squad picker, keeper, format, sport, scorer, POTM… (16 sites) | ✅ v2.9.31 — `.ui-chip`, one `.sel` ✓ affordance | — |
| 7 | **Content chips** | title+description cards · key+descriptor tiles | ✅ v2.9.32 — `--card` / `--tile` shapes, ✓ pinned top-right | Adopt at any new content-chip site; never rebuild inline |
| 8 | **Grouped settings list** | Team settings (strategy + timing) | ✅ v2.9.32 — `.set-group` (+`.opt-row` for choices) | Candidates: app-settings modal rows, sound-pack picker, s2 sections |
| 9 | **Toggle switch** | Subs at breaks only (Team settings) | 🟡 single site — `.hit44` + `role="switch"`, visual inline | If a second boolean pref appears, extract `.ui-switch`; do not invent a second pill |
| 10 | **Section labels** | ~43 uppercase eyebrow labels + 35 `<h2>` | 🔴 two systems for "what section am I in", mixed 10/11px | Decide: `<h2>` names screen sections, eyebrow names card-internal clusters; write into design.md §2 type ramp, then sweep |
| 11 | **Info band** | 5 `.info` bands | 🟡 one class, inline flex overrides per screen | Fold recurring overrides into the class (e.g. `.info--row`) |
| 12 | **Overlays / sheets** | 21 `.ov` scrims + `.ab` panels | 🟡 shell consistent; internal action rows are inline-styled | Action rows inherit steps 4–5; shell is fine |
| 13 | **Pitch player chips (`.fc-*`)** | game / plan pitch | ✅ deliberately bespoke — the app's identity (§11 1a/1b: out of scope) | — |
| 14 | **Brand bar · tab bar · drawer rows** | every screen | ✅ constitutional (NAVIGATION.md); drawer rows `.ui-btn--ghost` since v2.9.6 | — |

**Process:** when a family goes ✅, lower the matching ratchet in the same
commit (ui-check inline-signature count, a11y count) so it cannot regress.
When adding a new screen, shop this table before styling anything new.
