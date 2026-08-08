# Sub Timer — Screen Flow

> The map of screens and the routes between them. Screens are `showScr`
> targets (ids match `UIMAP.md` and `SCREEN-BRIEFS.md`); edges are the
> journeys from `UX-PATHWAYS.md`. The drawer overlays every screen.

```mermaid
flowchart TD
    home["🏠 Home · home<br/>(teams · resume banner)"]

    subgraph setup ["P1 — Team setup (once per team)"]
        sportPicker["Sport picker · sportPicker"]
        gradePicker["Format picker · gradePicker"]
        editTeam["Team editor · editTeam"]
    end

    subgraph pregame ["P2 — Pre-game (every game day)"]
        s1["Squad select · s1<br/>(deselect the no-shows)"]
        s2["Game settings · s2"]
        s3["Line-up + GK · s3"]
    end

    subgraph game ["P3/P4 — The game"]
        s4["⏱ Live game · s4"]
        subOrderOv["Plan page · subOrderOv<br/>(preview + saved plans)"]
    end

    subgraph record ["P5 — The record"]
        s5["Summary · s5"]
        s6["Match history · s6"]
    end

    home -->|"+ New Team"| sportPicker
    sportPicker -->|"pick sport"| gradePicker
    gradePicker -->|"pick format"| editTeam
    editTeam -->|"save"| home

    home ==>|"team card → Play now"| s1
    home -.->|"⋯ → Past games"| s6
    home -.->|"⋯ → Plan ahead"| subOrderOv
    home ==>|"Resume (game live)"| s4

    s1 -->|"Settings"| s2
    s2 --> s3
    s1 ==>|"quick start"| s4
    s3 ==>|"kick off"| s4
    s1 -.->|"apply saved plan"| s4

    s4 <-->|"Sub Plan (drawer) / Plan tab"| subOrderOv
    subOrderOv -->|"apply plan"| s4

    s4 ==>|"full time"| s5
    s5 -->|"save match"| s6
    s5 --> home
    s6 --> home

    s4 -.->|"End game (drawer)"| home

    linkStyle default stroke:#888
```

**Reading it:** bold edges (⇒) are the Saturday path — Home → squad →
kick off → full time → save. Thin edges are setup and detours; dotted are
menu routes. The Live game ⇄ Plan page pair is the app's working core: the
same game seen as "now" and as "the whole schedule".

_Not drawn: the drawer (overlays every screen — see `SCREEN-BRIEFS.md`
`drawer`), modals (feedback, share, sound picker, what's-new), and the dev
panel (`?dev=1`)._

---

## The coach's workflow tree (user flow, decision-first)

The same app from the coach's side: what they're deciding, not what screen
they're on. This is the tree the cognitive-load budgets protect — every
diamond is a decision the UI must make obvious.

> **Stamped by the owner 2026-08-08** (v2 — entry is a neutral "Open app";
> matchday is a branch, not a premise; midweek intents drawn explicitly).
>
> **v3 (rehearsal decisions, same day — FigJam board has the full redraw):**
> the two branches ARE the app's two modes — **PLAY mode** (matchday: squad →
> review keeper/shape/positions + timing glance → ANNOUNCE → kick off; in-play
> relay cards; break ritual keeper→shape→positions→announce; full-time =
> confirm score + player of the match, enrichment deferred to the car park)
> and **PLAN mode** (midweek: create/edit teams, set the sub plan, review +
> opposition notes, share). Settings are seasonal. The Plan page does NOT
> live on the game view. See SCREEN-BRIEFS.md "The governing split".

```mermaid
flowchart TD
    open(["Open app"]) --> live{"Game<br/>already live?"}
    live -->|yes| resume["RESUME<br/>→ straight back to the clock"]
    live -->|no| team{"Team exists?"}

    team -->|no — first time| create["Create team once:<br/>sport → format → roster<br/>(paste / photo / sample)"]
    create --> day
    team -->|yes| day{"Matchday?"}

    day -->|"no — midweek"| midweek["Plan ahead · tweak roster ·<br/>review past games · share team"]
    midweek --> later(["Back on Saturday"])

    day -->|yes| ready{"Planned this game<br/>in advance?"}

    ready -->|yes| applyPlan["Apply saved plan<br/>(line-up + keeper + timings preset)"]
    ready -->|no| squad["Who's here?<br/>DESELECT the no-shows"]

    squad --> defaults{"Happy with<br/>defaults?"}
    defaults -->|yes| kickoff
    defaults -->|no| tweak["Adjust: period length ·<br/>sub cadence · group size ·<br/>strategy · 2nd-half GK"]
    tweak --> lineup["Place starters + pick keeper<br/>(auto-fill, then correct)"]
    lineup --> kickoff(["⚽ KICK OFF"])
    applyPlan --> kickoff

    kickoff --> during{{"During play —<br/>the app drives"}}
    during -->|"sub due (alert)"| subq{"Accept the<br/>suggested swap?"}
    subq -->|yes| conf["CONFIRM — one tap"]
    subq -->|no| adjust["Adjust who goes on/off,<br/>then confirm"]
    conf --> during
    adjust --> during
    during -->|goal| score["Score +/- <br/>(log scorer later)"] --> during
    during -->|"player hurt"| injury{"Back soon?"}
    injury -->|yes| benchInj["Back-to-bench<br/>(stays in rotation)"] --> during
    injury -->|no| outInj["Out-for-game<br/>(replacement joins rotation)"] --> during
    during -->|"break (HT/Q)"| break_["Break: change keeper?<br/>confirm next line-up"] --> during
    during -->|"doubt (any time)"| plan["Peek the Plan page:<br/>whole schedule + minutes"] --> during
    during -->|"phone locks / app switched"| saved["Auto-saved instantly —<br/>resume banner on return"] --> during
    during -->|"abandon early (drawer)"| abandoned(["End game — nothing saved<br/>unless summary reached"])

    during -->|"full time"| ft["Summary: score ·<br/>minutes · story"]
    ft --> save{"Keep the<br/>record?"}
    save -->|yes| history["SAVE MATCH<br/>→ history (+ cloud)"]
    save -->|no| done(["Done — pack up the cones"])
    history --> done
```

**The shape to protect:** one decision per moment. Before the game the coach
answers at most four questions (who's here → defaults? → line-up → kick off);
during it the *app* raises the questions and the coach mostly answers yes.
Any redesign that adds a decision to the left half of a diamond is adding
cognitive load — check it against the choice budgets in `SCREEN-BRIEFS.md`.

**Environment states that shape every flow** (not drawn as nodes — they are
ambient): offline at the ground (cold start works, 2D pitch fallback — v2.9.3),
one-handed use, sunlight. Design against these on every screen, not per-flow.

---

## Service blueprint — what the engine does beneath each coach action

The backstage lane. Frontstage is the coach; backstage is the rotation and
persistence machinery; the data lane is device-first, cloud-second.

```mermaid
flowchart LR
    subgraph coach ["Frontstage — the coach"]
        cSetup["Pick squad + line-up"]
        cKick["Kick off"]
        cConfirm["Confirm / adjust the sub"]
        cScore["Tap score"]
        cInjury["Long-press injured player"]
        cBreak["At break: keeper, line-up"]
        cLock["Locks phone / switches app"]
        cSave["Save match"]
    end

    subgraph engine ["Backstage — the engine"]
        eGroups["Build rotation groups + equal-time ideal"]
        eTimeline["Build plan timeline (sub times restart each period)"]
        eTick["Clock tick: accrue minutes (keeper time ledgered separately — G.gkt)"]
        eDue["Sub due: choose swaps by OUTFIELD minutes"]
        eApply["Apply swap: preserve field size, write the log"]
        eReseat["Seat replacement in the vacated group"]
        eCarry["Carry keeper + line-up into next period"]
        eTotals["Compute TRUE totals for display"]
    end

    subgraph store ["Data — device first, cloud second"]
        sSnap[("Snapshot after every event")]
        sFlow[("Game-flow recorder")]
        sMatch[("Match history — local + cloud push")]
    end

    cSetup --> eGroups --> eTimeline
    cKick --> eTick --> eDue -->|"alert"| cConfirm
    cConfirm --> eApply --> sSnap
    eApply --> sFlow
    cScore --> sSnap
    cInjury --> eReseat --> sSnap
    cBreak --> eCarry --> sSnap
    cLock ==>|"immediately"| sSnap
    eTick -.-> eTotals --> cSave --> sMatch
```

The blueprint's design rule: **every arrow from frontstage to backstage is a
decision the coach was spared.** When considering a new feature, first ask
which lane it belongs in — most good Sub Timer features are backstage.

---

_Status: descriptive, not yet enforced — by CONTROL-DOCS' own rule this file
is currently a description. Candidate check: every screen-map edge must
correspond to a `showScr` route in UIMAP (a small `flow-check`). Until then,
treat divergence between this file and UIMAP as a bug in this file._
