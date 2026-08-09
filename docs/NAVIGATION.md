# Sub Timer — Navigation Plan

> **The wayfinding constitution.** Why the app moves the way it does, the
> rules every door must follow, and the audit of where today's doors break
> them. Companion to `FLOW.md` (the map of screens), `SCREEN-BRIEFS.md`
> (what each screen is for) and `UX-PATHWAYS.md` (the oracle). Where those
> describe *what exists*, this file rules on *how movement should feel*.
>
> Owner directive (2026-08-09): "need to build our navigation plan — I feel
> like things jump all over the place." Reference model: Justinmind's
> navigation-design guide — patterns don't rank universally; pick per
> product, then enforce wayfinding cues ("navigation cues create a calm
> state of mind") and consistent labels.

---

## 1. The model — a hub and two rails

Sub Timer is not a website with a menu; it is **one hub, two rails, and an
overlay layer**. Every door in the app should be explainable in these terms —
if a door doesn't fit, it's a navigation bug, not a feature.

```
                 ┌────────────── HOME (the hub, the mode fork) ──────────────┐
                 │  team card = PLAY door · clipboard = PLAN door · + New Team│
                 └──────┬──────────────────────────────────┬─────────────────┘
        PLAY RAIL (wizard, forward-only)         PLAN SURFACES (flat, tabbed)
   s1 squad → gkStep → shapeStep → s4 game       editTeam(Positions) · teamSettings
        → s5 summary → s6 history → home         · subOrderOv plan · s6 history
                                                 · share · sport/format pickers
                 OVERLAY LAYER: drawers + modals — transient, never navigation
                 ESCAPE HATCH: brand-bar logo → Home, from anywhere
```

- **The hub.** Home is the only screen that fans out. Mode is chosen here
  and nowhere else: card tap = matchday, clipboard sheet = midweek
  (SCREEN-BRIEFS "the governing split", owner-stamped 2026-08-08).
- **The PLAY rail is a wizard.** Squad → keeper → shape → game → summary is
  strictly forward-motion: one loud primary at bottom-right, one quiet
  labeled back at bottom-left (v2.9.28 bottom action row). Mid-rail
  sideways jumps are the enemy — a coach mid-ritual should never land on a
  midweek surface by accident.
- **PLAN is a flat set.** Midweek surfaces are peers reached from the hub
  (clipboard sheet) or the tab bar; they don't nest. Depth ≤ 2 from Home.
- **Overlays are not places.** Drawers and modals never count as
  navigation: they open over a screen and close back to the same screen.
  Nothing inside an overlay may teleport without saying where it's going.
- **One escape hatch.** The brand-bar logo always goes Home. It's the only
  unlabeled door allowed, because it's the same door on every screen.

## 2. Wayfinding rules (every door follows these)

1. **You-are-here, always.** Each screen answers "where am I" without a
   heading band (v2.9.28): the PLAY wizard by its info-line question
   ("Who's in goal? …"), PLAN surfaces by the lit tab, the game by the
   pitch itself, overlays by their sheet chrome.
2. **Back is labeled with its destination.** "← Squad", "← Keeper" — never
   a bare "← Back". A back button is a promise about where you'll land;
   name the place. (Audit below flags the three violators.)
3. **Back is bottom-left, quiet; forward is bottom-right, loud.** The
   v2.9.28 bottom action row is the *only* home for screen navigation.
   One primary per screen (dominance ≥1.5, screen-audit); back never
   competes with it.
4. **Tabs are furniture, not teleporters.** The tab bar may only show where
   every tab is a *safe* jump — i.e. on surfaces where leaving costs
   nothing. Mid-wizard and mid-modal it must hide or refuse.
5. **A door's label matches its destination's identity.** If the tab says
   Roster, it must land on a screen whose job is the roster — not a screen
   that merely contains the roster.
6. **Two doors to one place is fine; two places for one name is not.**
   History reachable from Home *and* Summary: good (hub pattern). Two
   different screens both called "Settings": bug (see audit).
7. **New doors need a sentence in this file.** Any PR adding a route says
   which rail it belongs to and which rule lets it exist.

## 3. The door registry (entry ▸ back ▸ forward, per screen)

| Screen | Rail | Doors in | Back (labeled) | Forward (primary) |
|---|---|---|---|---|
| `home` | hub | app open · logo (all screens) · save/done (s5, s6) · End game (drawer) | — | team card → `s1` · resume → `s4` |
| `sportPicker` | PLAN | + New Team (home) | ← Cancel → home ⚠︎R2 | sport chip → `gradePicker` |
| `gradePicker` | PLAN | sport chip | ← Back → sportPicker ⚠︎R2 | format chip → `editTeam` |
| `editTeam` | PLAN | format chip · Positions tab · team sheet Edit | — (tabs/logo) | Save Team → home (Delete beside it) |
| `teamSettings` | PLAN | Settings tab | — (tabs/logo) | live-save, no exit CTA |
| `s1` squad | PLAY | team card · Roster tab ⚠︎A3 | — (logo only) | Next → `gkStep` |
| `gkStep` | PLAY | s1 Next · GK pill (s4) | ← Squad | Next → `shapeStep` |
| `shapeStep` | PLAY | gkStep Next | ← Keeper (dyn.) | Next → `s4` |
| `s2` game options | PLAY detour | s1 Settings link ⚠︎A2 | ← Squad | Apply settings → `s3` |
| `s3` lineup | PLAY detour | s2 apply | ← Done → s4 | kick off → `s4` |
| `s4` game | PLAY | shapeStep · resume · apply plan | — (game IS the place) | full time → `s5` |
| `subOrderOv` plan | PLAN | team sheet Plan ahead · squad planAhead | — (drawer/logo) | apply plan → `s4` |
| `s5` summary | PLAY | full time (advH) | — (ritual end) | Save Match → `s6` · Done → home |
| `s6` history | PLAN | team sheet Past games · s5 save | ← Back → home ⚠︎R2 | detail → edit/replay |

## 4. The jump audit — why it feels like it "jumps all over"

Ranked by how much calm each fix buys. These are candidates for the
backlog, not shipped decisions — each needs an owner stamp.

**A1 — The tab bar rides the PLAY wizard.** On `s1`/`gkStep`/`shapeStep`
(and `s4`) the tab bar offers Positions / Settings / Roster — three PLAN
surfaces — while the coach is mid-ritual. One mistap during "who's in
goal?" teleports to seasonal settings, and the wizard's state feeling is
gone. This is the single biggest "jumps all over" source and directly
breaks Rule 4. *Candidate: hide the tab bar on wizard steps (precedent:
landing screens already hide it, v2.7.80) — or keep only Game.*

**A2 — Two screens answer to "Settings".** `teamSettings` (seasonal
defaults, PLAN tab) and `s2` (today's game options, PLAY detour from
squad). Same word, different rails, different lifetimes — the coach can't
form a stable mental model of where "settings" live. Breaks Rule 6.
*Candidate: s2 rebrands everywhere as "Today's game" (it already only
holds per-game tweaks).*

**A3 — The Roster tab lands on a PLAY screen.** `switchToView('roster')`
jumps to `s1` squad select — mid-game that's correct (wave in late
arrivals), but from PLAN surfaces the label "Roster" landing on the
matchday who's-here screen conflates the season roster (editTeam) with
today's availability (s1). Breaks Rule 5. *Candidate: Roster tab only
while a game context exists; otherwise it belongs to Positions.*

**A4 — Back labels that name an action, not a place.** "← Cancel"
(sportPicker), "← Back" (gradePicker), "← Back" (s6). Rule 2 violators.
*Candidate: "← Home", "← Sport", "← Home" — one-word renames.*

**A5 — The plan page has three doors and no back.** `subOrderOv` opens
from the team sheet, from squad's plan-ahead, and programmatically — exits
are the drawer or the logo. As the only PLAN surface without a labeled way
back it relies on the escape hatch. *Candidate: bottom "← Home" per Rule 3
once A1 settles the tab question.*

**A6 — noted, no action.** History's two parents (hub pattern, fine);
the unlabeled logo-home (allowed as the single escape hatch, Rule 1's
"same door everywhere"); drawers navigating (End game → home) — announced
by a confirm, acceptable.

## 5. How to test navigation (before shipping any of the fixes)

- **Walk the atlas.** The Figma prototype flows (Phone/iPad/Web
  walkthrough) ARE the navigation model — a re-shot atlas that feels wrong
  to click through is the earliest warning.
- **3–5 user rule** (per the reference article): watch a parent-coach do
  squad → kick off and midweek plan-edit without prompting; every hesitation
  at a door is a Rule 1–5 violation to log here.
- **The gate keeps the counts honest**: screen-audit dominance ≥1.5 on
  wizard steps, choice budgets in SCREEN-BRIEFS, taps-to-kickoff ratchet
  (backlog) once A1 lands.
