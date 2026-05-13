# Sub Timer — Lessons from the build

If we built this app again from scratch, what would we get right on the first pass? This doc captures the corrections that mattered — especially the **taste** corrections that wouldn't have come from a spec.

The technical patterns are at the bottom. The product taste is at the top, because that's what made the difference.

---

## Part 1 — Taste corrections (what the coach knew that the engineer didn't)

### 1. The app is a coaching aide, not a stopwatch

**Initial framing:** "Sub Timer — sideline rotation timer for grassroots team sports."
**Corrected framing:** "Smart Subs for grassroots coaches."

The category ("timer") was technically accurate but commercially weak. Once we'd shipped position tags, sub strategies, undo, bench reorder, AI roster import — we'd outgrown the timer label. **Lead with the differentiator, not the category.**

If we did it again: name and tagline around *Smart Subs* from day one. Build the timer *under* that idea.

### 2. Describe the coach, not the algorithm

**First attempt at strategy copy:** *"App picks the longest on-field player to come off, and longest-benched to come on."*
**Corrected:** *"I just want everyone to play."* (italic, leading the card)

Coaches don't pick strategies. They pick **stances**. Each strategy now has an archetype stance line above the algorithm description. The mode becomes an identity choice, not a configuration value.

If we did it again: every strategy card has three layers from day one — archetype stance (italic), one-line explanation, optional warning. Same pattern.

### 3. Add a joke for every strategy

**The fix:** Each card ends with a parenthetical coach reference matching the stance:
- Equal time → *Ted Lasso energy*
- Paired rotation → *Ancelotti at the school dropoff*
- I'll call them → *Klopp on the touchline*
- Full control → *Pep Guardiola, but for U8s*

Affectionate, not mocking. Coaches who recognise the names smile; coaches who don't still get the strategy from the explanation. **Voice matters. Don't be afraid to be warm.**

### 4. Use-with-caution honesty

The Full Control card carries: *"⚠ Use with caution — game day rarely goes to plan."*

Pre-planned subs sound great until a kid trips at 3 minutes and the sequence is off by one. **Don't oversell features. Flag the trade-off where it lives.** Users trust products that are honest about limits.

### 5. Sub Strategy is an identity choice — it goes at the top

We initially buried Sub Strategy below Half Length / Sub Frequency / Players-per-Sub. The coach said *"should it sit up higher?"* and once you see it, you can't unsee it:

- Game Format = *what are we playing*
- **Sub Strategy = how am I coaching** (identity)
- Formation = *tactical shape*
- Half Length / Sub Frequency / Players-per-Sub = *tuning my strategy*

The tuning rows belong **after** the strategy choice they're tuning. Information hierarchy follows decision order.

### 6. Meet the coach where they already are

The notebook photo Sean's friend Jarad keeps — handwritten sub plan with timestamps and position abbreviations — is **not** evidence the app is failing. It's evidence the app should accommodate his workflow:

1. Coach picks Full Control
2. App auto-generates a fair plan as a starting point
3. Coach EITHER tweaks inline OR **snaps a photo of his existing notebook**, AI digitises it

The marketing pitch becomes: *"Bring your notebook. We'll digitise it."*

**Lesson:** the analog workflow is not the enemy. It's the demo. AI's job is to translate, not replace.

### 7. Auto-suggest, never blank slate

When the coach picks Full Control, the Game Plan view doesn't start empty. It starts pre-populated with the Equal-time-fair plan. The coach overrides only the 2–3 swaps they care about.

This drops friction from "plan 36 slot decisions" to "review and tweak the 3 that matter." Same applies to AI roster import — names + positions + jersey numbers pre-fill; coach corrects.

**Lesson:** never make a user start with nothing. Whatever the system can pre-fill, it should pre-fill.

### 8. The 4th strategy is the 3rd, evolved

Manual ("I'll call them") and Full Control ("I plan every sub") are **sibling strategies** — both are *coach's choice*. The difference is *when* the thinking happens (in the moment vs. before kickoff), not *who* does the thinking.

Recognising this clarified that Equal time / Paired live in one column (algorithm decides) and Manual / Full Control live in another (coach decides). **Categorising the strategy menu by who-decides gave us a real product axis.**

### 9. Sport-specific everything

Side / foot preferences only show for soccer (netball positions are fixed by rule). Jersey numbers show for both sports because coaches across grassroots use them universally. "Quarters" not "halves" for netball settings.

**Lesson:** don't force domain concepts where they don't apply. But don't gate universally-useful features on sport either. Each feature gets its own sport-relevance check.

### 10. Safety nets at every layer

AI extracted "Lucy D" as the player's NAME instead of separating name="Lucy" + position="D". Three-layer defence:

1. **Prompt** — explicit example: *"Lucy D → name='Lucy' position='D'"*
2. **Server validation** — schema enforces position/name separation
3. **Client cleanup** — `stripTrailingPosition` peels any leftover position letter off the name before saving

Plus a **one-tap "Clean up names" banner** in the editor for teams imported before the fix. The banner only shows when something needs fixing — zero clutter otherwise.

**Lesson:** AI is unreliable enough that you build safety nets at every layer. Plus give users a rescue button when defences have been breached.

### 11. The hamburger is a trap

We considered consolidating Match History / Send Feedback / Buy Me a Coffee into a hamburger menu when the home screen felt crowded. The right call was *no* — none of those actions are infrequent enough to hide.

Instead: side-by-side New Team + Match History row, Coffee + Feedback at the footer, BETA blurb subtle below.

**Lesson:** hamburger menus are for desktop-era apps with 8+ secondary actions. A focused tool's home screen should put primary actions in plain sight. Hide nothing important.

### 12. Sideline distance reading

"Next sub at 05:00" was 12px, weight 400, #666. Real coach feedback: *"slightly bigger."* Bumped to 14px, weight 600, #888.

**Lesson:** screen text needs to be readable at **arm's length on a phone held at chest height in bright outdoor sun.** Test in context, not in dev tools.

### 13. The empty state is a different design problem

The big animated 2-3-1 dot logo looked beautiful as the empty-state hero. Once the screen had 4 team cards, the same logo floating between heading and list looked stranded.

Hide the floating logo when teams exist; show it as a hero only on empty state.

**Lesson:** empty state ≠ populated state. They're separate layouts that share components.

### 14. Card-level primary action

Initial team cards: tap anywhere to "open team" → squad → settings → start. Three taps to the game.

Now: every card has a green **Start** button. Card-tap still works as a fallback, but the primary action is explicit and one tap.

For incomplete teams (no format / not enough players), the card shows a yellow **Set up** button instead. Same surface, conditional intent.

**Lesson:** the most common action a user takes from a list view should be a button on each item, not implicit on a tap.

### 15. Real coach feedback beats imagined coach feedback

We theorised an app should have:
- Whole-game sub plan view ← validated by Jarad's notebook
- "Use with caution" on Full Control ← validated by reality of game day
- Jersey numbers ← validated by "also a thing"
- AI capturing position labels ← validated by *"it didn't mark the players preferred positions on the setup"*

Every meaningful product correction in this build came from a coach showing or saying something concrete. **Beta-tester voice > engineer instinct.**

---

## Part 2 — Technical patterns we'd keep

### Single-file HTML app

`sub-timer.html` is one file. Inline CSS, inline JS. Deployed by copying to a git repo that Vercel auto-builds. **~3,500 lines total** as of v1.8 with full feature set.

**Benefits:**
- Zero build step
- Trivial to grep / diff / commit
- AI assistant can hold the whole file in context
- Deploys in 30 seconds via Vercel

**When to break this:** when state management or routing needs a real framework, or when the file passes ~6,000 lines.

### Three-file knowledge trio

| File | Purpose | Source-of-truth for |
|---|---|---|
| `FEATURES.md` | What the app does, every surface catalogued | Onboarding / regression testing |
| `CHANGELOG.md` | What shipped when, per version | Project history |
| `LESSONS.md` (this file) | Why we built it this way | Future builds / similar products |

The in-app **What's New modal** mirrors `CHANGELOG.md`'s top entry — same source of truth, different surface.

### Per-team JSON maps for player attributes

```js
team = {
  id, name, sport, format, players: ['Hannah','Darcy',...],
  positions: { 'Hannah': ['DEF'] },
  sides:     { 'Hannah': 'L' },
  foots:     { 'Hannah': 'R' },
  numbers:   { 'Hannah': '4' }
}
```

Player name is the key. Rename / delete handlers migrate keys across all attribute maps. Cloud sync uses **smart merge** — prefer the side that has data, never let an empty cloud map overwrite a populated local one.

**This pattern scales** — when we shipped jersey numbers in v1.7, it took ~30 lines because the pattern was well-trodden.

### Sub strategy as runtime polymorphism

```js
if (strat === 'planned')      { /* use G.subPlan */ }
else if (strat === 'fair')    { /* equal-time pick */ }
else if (strat === 'manual')  { /* same suggestion as fair */ }
else if (G.pairs.length > 0)  { /* paired + equal-time */ }
else                          { /* fallback */ }
```

`trigSub` reads `G.subStrategy` and routes. New strategy = one more branch. **Don't over-abstract early** — four branches in one function is fine when each is ~10 lines.

### Edge function with mode parameter

`extract-roster` started as a single-purpose extractor. When we needed plan extraction too, we added `mode: 'plan'` rather than spinning up a second function. Same auth, same client wrapper, same error handling.

**Lesson:** prefer enriched single endpoints to a fleet of micro-services when the call site is the same.

### Smart-merge for cloud sync

```js
const cloudHasPos = ct.positions && Object.keys(ct.positions).length > 0;
const localHasPos = existing?.positions && Object.keys(existing.positions).length > 0;
const positions = cloudHasPos ? ct.positions : (localHasPos ? existing.positions : {});
// if local was richer, queue a re-push
if (localHasPos && !cloudHasPos) needsRePush.push(merged);
```

Prefer cloud when non-empty, fall back to local when cloud is empty, re-push if we recovered local data. **This pattern caught and fixed the most painful bug in the build** — coaches' position tags were getting wiped by stale sync. Apply this rule to every nested field by default.

### Lucide icons via CDN + custom inline SVG for gaps

```js
const ICON_CUSTOM = {
  soccerBall: '<path d="M3 12a9 9 0 1 0 18 0..." />...',
  netball:    '<circle cx="12" cy="12" r="10"/>...'
};
const ICON_ALIAS = { play:'play', message:'message-square', ... };

function ic(name, size, color) {
  if (ICON_CUSTOM[name]) return /* inline SVG */;
  return `<i data-lucide="${ICON_ALIAS[name]||name}" ...>`;
}
```

Lucide via CDN handles 95% of icons. Custom inline SVGs cover the gaps (no soccer ball in Lucide). After every render that injects icons, call `lucide.createIcons()` to materialise the `<i>` placeholders.

### Active game snapshot survives refresh

`G` (active game state) snapshots to localStorage every few seconds. On reload, the resume banner appears if a snapshot is present. Cleared on `saveMatch()` or `discardActiveGame()`. **No cross-device resume** (intentional — would require server-side state).

### Undo by snapshot, not log replay

Before every sub, snapshot the relevant slice of state (on, bench, pairs, pairIdx, minutes, log length). Undo restores the snapshot. Only the **most recent** sub is undoable; halftime clears the snapshot.

**Lesson:** for short-horizon undo, snapshot the affected state. Don't try to model an inverse for each action.

---

## Part 3 — Build process patterns

### Ship the CHANGELOG + What's New modal early

Took 30 minutes to wire up the version-tracking modal. Pays dividends every release: coaches see what changed without us having to send a newsletter. **Build this in your second release, not your tenth.**

### Bump version every batch of features. Don't bump for every bug fix.

We bumped 1.4 → 1.5 → 1.6 → 1.7 → 1.8 for substantive feature sets. Bug fixes within a version (e.g. the netball icon hot fix on v1.5) stayed at the same version with the in-app modal not refiring. **Versions are for users, not engineering archaeology.**

### One-file commits with descriptive messages

Every commit covers one feature or fix. Commit messages explain *why*, not *what* — code diff already shows what. **Commit history doubles as a CHANGELOG draft.**

### Smoke test every release

After each version bump, do a quick smoke test of the new features end-to-end. Caught:
- Landing hero version tag not rendering (timing bug)
- Halftime ≠ end-of-game (test step missed that distinction)
- "Continuous across both halves" hardcoded text for netball games

**Lesson:** even a 10-minute smoke run catches the obvious before users do.

### Real-artifact testing for AI features

Don't ship the AI photo-import pipeline without uploading a real handwritten plan through it. We were two versions deep before realising the AI was leaving position letters in player names. **Test the killer feature on the killer use-case before declaring done.**

### Documentation grows with the product, not after it

`FEATURES.md`, `CHANGELOG.md`, `LESSONS.md` all live in the same folder as the source HTML. Each gets updated in the same commit as the feature it documents. If we'd left documentation until "later" it would never have happened.

---

## Part 4 — Things we'd do differently

| | Did | Would do |
|---|---|---|
| **Brand** | Started as "Sideline rotation timer" | Lead with *Smart Subs* on day one |
| **Strategy copy** | Algorithm descriptions | Coach archetypes (with jokes) from v1.0 |
| **Settings order** | Logical (format → formation → tuning → strategy) | Decision order (format → strategy → tuning) |
| **AI roster import** | Names only initially | Names + position + number from v1.0 |
| **Cloud sync** | Last-write-wins on every field | Smart-merge for nested maps from v1.0 |
| **Onboarding** | Build the editor first | Build the **photo import** first so coaches can start with their existing data |
| **Documentation** | Wrote it after v1.4 | Three-file trio from v1.0 |
| **Version display** | Added in v1.4 | Bake into the header HTML on commit 1 |
| **What's New modal** | Built at v1.5 | Build at v1.1 — it's a one-day feature that compounds |
| **Coach archetype framing** | Discovered at v1.6 | Open with this concept |

---

## Closing thought

The product got better every time a coach looked at it and said *"hmm, what about…"* — the corrections were always small but consistently shifted the centre of gravity toward what coaches actually do on a Saturday morning. Engineering instinct alone would have produced a perfectly-functional, slightly-cold app.

**The taste came from staying close to the coach.** Keep doing that.
