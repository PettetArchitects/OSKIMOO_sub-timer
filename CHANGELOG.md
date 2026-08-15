# Sub Timer — Changelog

All notable changes to the app, by version. The in-app "What's New" modal pulls the same data from `CHANGELOG_DATA` in `sub-timer.html`.

---

## v2.9.57-beta — Position-aware rotation (P8; owner: "is there a way that you can look at the team's strengths and positions to set up a strategy" → "ok")

Mapped first as **UX-PATHWAYS P8**, then built on the two things that already existed: `generateAutoPlan()` (the minute-by-minute Plan-page simulator, minutes-only) and the live Equal-time engine (minutes-only). One shared chooser, `chooseOffByFit(onArr, gk, elig, onKids, rotOf, tol)`: the incoming kids are still the least-played; **who comes off** is chosen from everyone within *half a sub interval* of the most-played (i.e. tied on minutes — fairness can't drift) as the subset the incoming kids fit best (`_fitScore`: 2 tagged-for / 1 untagged / 0 tagged-elsewhere; brute force, pool capped at 8), then paired to slots by `pairByFit`, then the same `_reseatArr` pass. Fit dominates; then never two ★ off together; then more minutes off. Used by `trigSub` (fair + manual), `getNextSwap` (the card) and the planner (`pairByFit` now takes an explicit on-field array so it works pre-kickoff when `G` is null). Plan events carry `at` (final slot per incoming kid) and `moves` (cover moves); the Plan page rows show both; genuine compromises (`_fitScore === 0` after everything) go to `plan.issues` and render as an amber advisory above the timeline ("OUT OF POSITION — FAIR TIME LEFT NO FIT … re-tag or accept") instead of blocking the plan. **★ Key player** (`team.stars`, Positions tab, synced — migration `teams_stars`) is a tie-breaker after fit; fair minutes remain the floor. Edge: plan with a fully-tagged 3-DEF/3-MID/2-FWD squad → spread 5′, ≤ 2 unavoidable mismatches (the fair-only planner produced 5+); live Equal-time takes off `LM,FW` (the kids the bench can replace) rather than the two most-played defenders; two ★ not off together among equal fit. Full gate green.

## v2.9.56-beta — The card says where she'll really play (owner, on the deployed .55: "first sub you have Molly going into a position she is marked not to play")

Paired strategy: the off-group is BOTH defenders, so both incoming kids inherit DEF slots and no pairing order (v2.9.55) can help; the post-confirm re-seat moved the not-DEF kid to a slot she plays and dropped an untagged midfielder to RB — but the card showed the **pre**-re-seat slot. Fix: `repairSeating` refactored into a pure `_reseatArr(onArr,gk)`; `getNextSwap` now simulates the swap **and the identical re-seat** and returns `finalPos` (where each incoming kid will actually play) and `moves` (kids already on the field who shift). The NEXT ON card's AT column shows the final slot and a footer names the cover ("Charlie moves to RB"), in the same words the relay card uses afterwards. Edge check: paired 2-3-1, defenders off, one incoming MID/FWD → card `LM`, `Charlie→RB`, and the sub does exactly that.

## v2.9.55-beta — Top view, turned (owner: "the top view on the pitch rotated 90 degrees from its current default")

The game screen's `top` camera preset now points its offset along X instead of Z (`[0.04,1,0]`, the same direction the Plan page has used as `top-h` since v2.7.55), so the field's long axis runs across the screen with the goals left and right. The old portrait framing survives as `top-v` for programmatic use.

**Also — the bottom band, finally (owner: "it still is off the bottom … as if a bottom Safari address bar would be" · "I really think you're barking up the wrong tree" — correct).** The band appeared in v2.9.45, the version that added `viewport-fit=cover`; the owner's v2.9.44 screenshot has the tab bar flush at the bottom. iOS standalone web apps have a known viewport miscalculation where the layout behaves as if Safari's bottom toolbar were present ([Apple forums 799216](https://developer.apple.com/forums/thread/799216); Safari 26.1 notes "Fixed a bottom gap appearing on layouts with viewport-sized fixed containers on iOS"), and `cover` is what exposed it here: `win 506×1027` on a 430×932 screen = a viewport computed for a frame that isn't the screen, then scaled to fit. **`viewport-fit=cover` is removed again.** The full-bleed look is kept another way: `html{background:#0d1828}` — with `black-translucent` iOS insets the layout below the status bar but the web view still extends under it, and that strip is painted by the ROOT background, so it reads as the brand bar running edge to edge. `env(safe-area-inset-*)` is 0 again; the v2.9.45 inset maths stays (harmless, and right if iOS ever reports insets). The page-zoom theory (v2.9.54) was wrong for this phone — the standalone shell itself lays the page out ~18% wider than the screen and scales it (owner: "it must shrink it"); the zoom card is now Safari-only. With no reported inset the bar sat under the home indicator (owner: "just looks too low") → `body.ios-noinset` (installed iPhone app, `env()` = 0) lifts it 22px.

**Nav bar stamped: the floating capsule** (owner: "floating in a capsule shape that unifies them all, inset from the edge like a lot of modern iOS apps") — the v2.9.53 float variant becomes the default (inset 12px, lifted 8px, radius 22, glass + elevation); `body.tabbar-classic` restores the full-width HIG bar. design.md §3.2 updated.

**Game settings not sticking (owner)** — a real local bug, not sync (the cloud row had the new prefs): every `teams=loadTeams()` (each `renderHome()`) builds new objects while `currentTeam` kept pointing at the old one, so a Settings-tab edit after any visit to home mutated an orphan and `saveTeams(teams)` wrote the list without it. `_rebindTeamRefs()` after every reload + `saveTeamSettings` writes the edited object by id. Verified: edit after `renderHome()` now persists.

**"Deliberately not a defender" (owner)** — `smartAssign` filled slots in formation order (LB, RB first in 2-3-1) and scored every non-matching player 0, lowest index wins — so a low-index FWD-only kid took RB before the FW slot had looked at her, and "tagged for other positions" was indistinguishable from "no preference". Now a mismatch scores −5 (below untagged 0, below exact 10) and slots are seated by **scarcity** (fewest exact-tag candidates first, formation order as tie-break). Edge check reproduces the report on the old code (`Charlie at RB`) and passes on the new (`Charlie at FW`).

**"Tried to sub on someone into a position they don't play" (owner)** — the engine chose WHO by minutes but paired incoming→outgoing by list order, so the NEXT ON card (and the sub) could put a DEF-only kid at RM, with only the post-confirm re-seat to fix it. `pairByFit()` (2 tagged-for / 1 untagged / 0 tagged-elsewhere; best total, original order breaks ties) now runs in `getNextSwap` (preview) and `trigSub` (engine) before anything is shown. Edge check: MID+DEF bench in the wrong order → DEF→LB, MID→LM in preview and after the sub.

**The LAN diag rig is permanent**: `?diag=1` (sticky per origin; on by default on a LAN address) shows a live strip — viewport, screen, `env()` insets, both bars, document size, visualViewport, UA, device-width matches. Serve the working build on :8001, open `http://<mac-ip>:8001/?diag=1` on the phone, Add to Home Screen to test the standalone shell.

## v2.9.54-beta — It tells you when Safari is zooming it (owner: "bottom tab is still too high" — with the diag numbers at last)

The .51 diag readout from the owner's phone: `win 506×1027 · scr 430×932 · inT 59 · inB 34 · brand 0/103 · tab 943/84 · sa Y`. **The layout viewport is 506 CSS px on a 430pt screen — 430 ÷ 506 = 85%.** That is Safari's per-site *Page Zoom* (the aA menu / Settings → Apps → Safari → Page Zoom), which the home-screen app inherits: iOS renders the whole page at 85%, so text is small, the brand bar sits low, and the web view ends 59pt above the screen bottom — the dead band under the tab bar in every screenshot today. It was set before the first report; "full bleed not working" in v2.9.44 was the same thing. Every safe-area number is actually correct (`inT 59 / inB 34`, brand bar 103 = 44 + 59, tab bar 84 = 49 + 34 + hairline). CSS cannot override page zoom, so the app now **detects** it (`screen.width / innerWidth`, iPhone, portrait, once per session) and shows a dismissible card naming the percentage and the fix. The temporary diag readouts (.51 toast, .54 draft version-tag) are removed. Owner-side fix: Safari → aA → 100% for sub-timer.vercel.app.

## v2.9.53-beta — The tab bar goes native (owner: "the bottom nav I want as a modern iOS nav bar" · "isn't there some off the shelf standards for this?")

There is: **Apple's HIG tab-bar spec.** The bar is rewritten to it number for number and the numbers are now the contract in design.md §3.2 — 49pt + home-indicator inset, full width, hairline top edge, translucent material (`rgba(13,24,40,.82)` + `backdrop-filter: saturate(180%) blur(20px)`), items **evenly distributed** (`flex:1`), 24pt icon over a 10pt label, active = tint colour + *filled* glyph (our set is stroke-only, so fill = tint at .22 alpha behind a heavier stroke), inactive = grey outline, **no pill/background behind the active item** (that was Material, not iOS), press = §5.0 scale compression. Same DOM and classes (`.btb-pill`/`.btb-btn`), so the landscape side rail, the a11y/ui checks and the gallery strip all keep working. `syncTabBarHeight()` now publishes *viewport-bottom minus bar-top* rather than `offsetHeight`, so `--tabbar-h` is right for any bar shape. An **iOS-26 floating "glass" pill** variant ships behind `body.tabbar-float` — same items, same rules, inset 12px with a 28px radius — **unstamped**; classic is the default until the owner picks. Both shown in `docs/records/v2.9.53-hig-tabbar/`. Also, owner: "a weird gradient colour on the left hand side" — the closed side drawer is parked one width off-screen at `translateX(-100%)`, but its `4px 0 24px` box-shadow still bled ~28px onto the page's left edge on every screen; the shadow now applies only while `.drawer-open`.

## v2.9.52-beta — Favourites stick, properly (owner: "still not working and it is 51")

The .51 merge let the **cloud's** `favorite` win. The pin the owner set on .50 was local-only (the push never existed), so the first .51 boot pulled `false` from the cloud and overwrote the local `true` — and the Supabase edge logs confirm it: only `GET /rest/v1/teams` from the phone, never a `PATCH`, because nothing had been toggled since. Fix: for the favourite (a pin, effectively a device preference) **local wins** when a local copy exists; the cloud only seeds a device with no copy; any disagreement lands in `needsRePush` so the cloud catches up on that boot. Toggling still pushes immediately.

## v2.9.51-beta — Favourites stick (owner: "the favourited team does not persist") + a temporary layout diag

`toggleFavorite` called a `syncTeamsToCloud()` that **never existed** (a `typeof … === 'function'` guard silenced it), and the `teams` cloud row had no `favorite` column anyway — so the pin lived only in the phone's localStorage, and any team rebuilt from the cloud (second device, or a re-sync that didn't find the local row) came back unpinned. Same gap for `prefs`: the Settings-tab game defaults never left the device either. Migration `teams_favorite_and_prefs` adds `favorite boolean` + `prefs jsonb`; `pushCloudTeam` sends both; the initial-sync merge takes cloud's favourite (it's pushed the moment it's toggled) and applies the richer-side rule to prefs (an old client that never pushed prefs can't wipe local ones); `toggleFavorite` now actually pushes. **Also (temporary):** the ☰ → Check for updates toast appends a layout readout — inner/screen size, `env()` insets, brand-bar and tab-bar rects, visualViewport, standalone flag — so the owner's "it's pushed itself up too far" report on the deployed v2.9.50 can be diagnosed with numbers rather than by pixel-reading a screenshot. Removed once the layout is settled.

## v2.9.50-beta — The home-screen app keeps itself current (owner: "why if I save the app as a bookmark app it doesn't refresh?")

Not a caching bug — every layer was already right (network-first service worker, `must-revalidate` at the CDN edge, `no-store` meta) — but **nothing ever triggered a load.** A home-screen PWA on iOS is *resumed*, not reloaded: tapping the icon brings the suspended web view back exactly as it was, and iOS can keep it alive for days. So the running JS stayed on the build it opened with, however fresh the server was. Fix: `checkForUpdate()` — on every resume (`visibilitychange` → visible), on load, and every 10 minutes while open — does a **HEAD** on `index.html` (no body; the service worker passes non-GET straight through; `cache:'no-store'` reaches origin) and compares the ETag (Last-Modified fallback) with the one the page booted with. Changed → `location.reload()` if no game is underway (the app between games — the common case, no interruption); mid-game → a "New version — tap to update" pill under the brand bar (never over the dash — SUB/START are the stamped thumb zone), tap saves + reloads, and the game resumes from localStorage. Verified: HEAD tag captured at boot; touch → mid-game check shows the pill, no reload; idle check reloads and the new page boots with the new tag and no pill. Owner, same breath: "integrate a check for updates thing in the menu" — a **Check for updates** row in every ☰ drawer (shows the running version), unthrottled HEAD; current → toast "You're on the latest version"; newer → saves and reloads immediately (the coach asked); no signal → toast says so.

## v2.9.49-beta — Tap, tap, confirm (owner, brainstormed from the sideline: "the long press is a bit subtle — we need a better way to make these manual changes that is clear" → "tap player and then tap the player you want to do a swap with and then confirm the move" → "if it's an injury it is a swap with someone on the bench" → "once the interchange has been done we can mark the player on the bench as not in the queue")

**The problem, mapped first (P3b in `docs/UX-PATHWAYS.md`):** mid-game manual changes were scattered across hidden gestures — long-press = injury, tap-two = instant position swap, chevrons = reorder — and one of them (*this kid isn't going back on*) didn't exist at all; the nearest thing was faking an injury and tapping OUT FOR GAME. The injured-keeper dead end (v2.9.48) existed precisely because nobody could see the gap.

**One grammar.** Tap a player, tap the other player, **confirm**. Field+field = position swap. Field↔bench (either order) = interchange, routed through the same path as an engine sub (`G.ps` → `confSub`) so afterwards it is indistinguishable: same log row, same relay shout, same undo, same re-seating report. Bench+bench = swap queue places. A keeper anywhere in the pair hands over the gloves — the card says "*Harper takes the gloves*", `creditExKeeper` runs, `gk1/gk2` follow, undo hands them back (`lastSub.prevGk`). **Nothing applies before Confirm** — the previous two-tap position swap applied instantly, so a mistap moved two kids mid-play; that's the one stamped behaviour this changes (owner: yes). Cancel, tapping the same kid again, or tapping elsewhere disarms. The confirm card lives in the existing `#subBanner` slot; an engine sub firing while a proposal is half-built supersedes it. The injury long-press is retired to a shortcut that arms the same flow; the red "tap a bench player" injury-pick mode is unreachable (functions kept for the harness).

**Out of the queue** (`G.out`, persisted with the game). A visible toggle on every bench row — 44px hit, `user-x` / `user-check` glyph — not a gesture. `benchQ()` is the queue (bench minus out); every picker (`getNextSwap`, `trigSub` in all strategies, the break rotation, the SUB button's enable, the countdown/urgency guards) reads the queue, and the fairness maths' "others" set drops them while out. `G.bench` still holds them — they're at the ground, their minutes are theirs, and toggling back restores their exact queue index. Rendered as a greyed dashed **OUT OF THE QUEUE** group at the bottom of the bench with a green *back in* tap. Match log records both directions (`queue` rows). Whether it's an injury, a sulk or a lift home the app doesn't ask — one state, no reason field.

**Gate:** two new edge scenarios, 15 checks (99/99 edge) — every P3b ✓ line is now `[edge: …]`-tagged and the section is 🟢. Verified interactively at 390×844: propose → nothing moved → confirm → moved; cancel no-op; interchange log/relay/undo; keeper card + handover + undo; queue swap; out-of-queue skipped by all three strategies, sub still fires, place restored, survives reload.

## v2.9.48-beta — An injured keeper can come off (owner: "bug noted you cant do a keeper swap if the keeper is injured")

Confirmed a genuine dead end. `fieldPillPointerDown` returned early for the keeper with the comment "GK injury goes through the keeper-change flow, not here" — but that flow (`openGkPick`, the ⚑ GK button) is gated on `planSetupPhase()`, i.e. pre-kickoff or a break, **so mid-play an injured keeper had no path at all.** Fix: the keeper long-presses like any outfielder; `confInjury` detects `G.gk===off` and performs the handover — `creditExKeeper` (so the old keeper's GK minutes aren't treated as rest by the fairness maths), `G.gk` → replacement, `gk1`/`gk2` follow (explicit pick), a `gk` log entry alongside the `injury_sub`. The banner adds "*Quinn takes the gloves*" so the keeper — the one slot where "on for Alex" isn't enough — is instructed. Verified mid-play (clock running, `planSetupPhase()` false): Alex → Quinn, `G.gk`/`gk1` = Quinn, both log rows written, bench shrinks correctly.

## v2.9.47-beta — Changes reach the game you're in (owner: "I updated the sub time to even recommended 7mins but it didn't change when I went back to the game" · "if I change a players positional preferences it doesnt take effect unless I start a new game")

Two reports, one root: **a live game was a snapshot.** `saveTeamSettings()` deliberately skipped `applyTeamPrefsToCfg` while a match was underway ("a live/pre-kick game keeps its cfg; the next game picks the changes up"), and seating was assigned once at kick-off and never revisited. Defensible in the abstract, but the Settings tab is *one tap from the live game* on the bottom bar and its controls look like they work — so from the sideline it reads as broken, twice. **Owner call: apply to the live game.** Sub interval, players-per-sub, strategy and breaks-only now reach the running match. The hazard that motivated the original rule is handled explicitly rather than by refusing the change: `absorbPassedSubTimes()` marks every time in the *new* schedule at or before `G.secs` as done, so the new cadence starts from now instead of firing a retroactive sub the instant the coach saves. Verified — 5′→7′ at 8:00 with 5′ already fired: schedule `[300,600,900]`→`[420,840]`, `G.sd` `[300]`→`[300,420]`, next sub 14:00, `wouldFireImmediateSub: false`.

Position preferences get the same treatment: returning to the game from a mid-game roster edit re-runs `repairSeating()` immediately, instead of leaving the new tags to be applied invisibly by the next sub.

Which closes the third report — **"it also moved a players position"** — from the other end. `repairSeating()` could always relocate a player who had nothing to do with the sub (that is how it resolves a bad fit for the incoming kid), and it did so silently; the owner was seeing the *same* mechanism as the position-preference gap, from the opposite side. Owner call: keep the re-seating, **name the moves**. `repairSeating()` now returns `[{name,pos}]` for every changed slot, the relay card appends "Molly moves to CM" for anyone who stayed on the field (incoming subs are already named above, so they're filtered out), and a mid-game edit shows the same rows under "POSITIONS UPDATED — TELL THEM". Verified: two deliberately mis-seated players → `[{Riley,LB},{Jordan,FW}]` reported on the card.

Owner also stamped **no change** to the relay's timing this session — the card stays a post-swap record.

## v2.9.46-beta — The next-on card named the wrong kids (owner, from the field: "something weird no one coming off on this one?")

The NEXT ON card rendered a row with an empty OFF cell and `SUB` in place of a position. **Two different lists were being crossed.** The card's rows came from `G.bench.slice(0, cfg.sc)` — the first *n* names in **bench order** — while the OFF / AT cells came from `getNextSwap()`'s `swapMap`, and in equal-time (`fair`) / manual mode that engine picks the incoming players by **least-played**, not bench order. When the two disagree the extra bench name has no pairing (`—` / `SUB`) *and* the player genuinely coming on is demoted into a later `+5′` wave. Reproduced: bench order Quinn · Taylor · Harper · Billie, engine bringing on **Quinn + Billie** → card showed **Quinn + Taylor**, Taylor unpaired, Billie down in the tail. In the owner's photo, Dylan was the phantom and Georgia the buried one — the pitch's `↑Georgia` marker over Tully was right all along (it reads the same `swapMap`), only the card was wrong. Fix: wave 0 is now the engine's `onArr` (filtered to the current bench), later waves are the remaining bench in order, and bench order stays the fallback for when there is no pending swap (end of period, no eligible pairing). Also owner, same session: **the panel fill behind the field is gone** (`.afl3d-wrap` background → transparent) — the pitch graphic is the surface, the hairline is the only edge, matching the score band in v2.9.45.

## v2.9.45-beta — Full bleed on iPhone + the clipped dash (owner report from the phone: "the full bleed isn't really working if intended and there is some clipping of buttons")

Three bugs, one photograph. **(1) `viewport-fit=cover` was never in the viewport meta** — without it iOS insets the web view below the status bar and above the home indicator, letterboxing the app in the page background (the mismatched strip above the brand bar), *and* resolves every `env(safe-area-inset-*)` to 0. Every safe-area calc in the file — the brand bar, `.scr`, the drawers, the tab bar, the landscape rails — had been dead since it was written. Adding it turns them all on at once, which exposed **(2)**: `#appBrandBar` was `height:44px` with `padding-top:env(safe-area-inset-top)` under the global `box-sizing:border-box`, so a real 59px inset would have crushed the 44px content row to nothing. Height now *includes* the inset — the bar grows into the status bar and paints it. Same class of bug fixed in the landscape rails: the nav rail padded its 64px content away by the notch inset (~59px, leaving ~5px of usable rail) and the dash column did the same on the right — both now widen by the inset instead. **(3) The clipped buttons**: screens reserved a hard-coded **58px** for the bottom tab bar, but the bar has no fixed height — it's icon + label + padding + inset, measuring **67px** in Chromium at 390px and taller again under iOS Dynamic Type. The dash's SUB / START sat *under* the bar. Replaced with `--tabbar-h`, published by `syncTabBarHeight()` from the bar's real `offsetHeight` on every `renderViewSwitcher`, resize and orientation change (0 when the bar is hidden or rotated into the landscape rail). Verified with simulated iPhone insets (59 top / 34 bottom): brand bar 103px with its content row intact at y=59, `--tabbar-h` 101px, dash buttons clearing the bar by 9px. Also, owner in the same message: **the `#16213e` fill behind the score line is gone** — the score sits on the page ground, divided by the hairline alone (§5.0: three surfaces, structure by rule not by fill).

## v2.9.44-beta — Email + password sign-in (owner: "I want to create an email password system, this magic link doesn't work")

Magic links retired; the sign-in modal is now email + password with three actions: **Sign in** (`signInWithPassword`), **Create account** (`signUp` — if the project has "Confirm email" on, the modal says so and waits for the confirmation), **Forgot password?** (`resetPasswordForEmail` → the recovery link lands back in the app, `PASSWORD_RECOVERY` flips the same modal into set-a-new-password mode). Signed-in users get a **Set / change password** row in the ☰ drawer (`updateUser({password})`) — the on-ramp for the four accounts that only ever had magic-link sign-in. Errors translate to coach copy (wrong password → nudge to Forgot password; already registered → sign in instead; rate limit → wait a minute). Modal buttons move to the `ui-` family (§11 migration). Owner actions that still gate the email legs: Supabase Auth URL Configuration (Site URL / Redirect URLs for `sub-timer.vercel.app`) for confirmation + reset links; "Confirm email" can be left off for a frictionless first sign-up. Also **Continue with Google**: the modal reads `/auth/v1/settings` and shows the Google button only once the provider is enabled on the project (owner: Google Cloud OAuth client → Supabase Providers → Google), so it ships dark and lights up without an app change. Docs: FEATURES.md, UX-PATHWAYS §sync, SCREEN-BRIEFS drawer.

## v2.9.43-beta — The ☰ drawer works on iPhone (owner report from the field: "sign in via cloud link isn't working")

Bug on WebKit only (iPhone Safari, and Chrome-on-iPhone which is WebKit underneath): every tap inside the side drawer — Sign in for cloud sync, Help & gestures, Send feedback, Donate — closed the drawer and did nothing else. Diagnosed with a temporary on-screen `?diag=1` log strip served to the owner's phone over LAN: the click's target was `#appDrawerScrim`, not the drawer button. Root cause: the three drawers are `position:fixed` but were authored INSIDE their screens' `.scr` scroll containers; WebKit hit-tests a fixed element nested in an overflow scroller wrongly — it paints the drawer above the scrim (z 9500 vs 9400) but routes taps to the scrim. Chromium hit-tests correctly, so no desktop test or gallery tile ever caught it. Fix: `hoistDrawers()` moves `#homeMenu/#gameMenu/#planMenu` to body, immediately after the scrim, before any drawer opens (fixed elements don't depend on the DOM parent for layout; `toggleGlobalMenu` already routes by the active screen). Verified on the owner's iPhone (iOS 18.7): tap → `.drawer-auth` → `authOv show`. Separately confirmed and NOT an app bug: the magic-link email redirect falls back to the Supabase project's Site URL (`http://localhost:3000`) because `https://sub-timer.vercel.app` is not on the auth Redirect allow-list — a dashboard setting for the owner. Record: docs/records/v2.9.43-drawer-webkit/.

## v2.9.42-beta — Sideways nav for sideways phones (owner: rotate the bottom nav to the side in landscape)

In short-landscape the bottom tab bar becomes a 64px LEFT side rail (tabs stacked vertically, full height under the brand bar) — height is the scarce dimension sideways, and the pitch reclaims the bar's whole band. Side chosen deliberately: the owner proposed the right edge, but that's the dash's stamped thumb zone (SUB/START, v2.9.36 stable slots) and nav beside START is a mis-tap adjacency — nav is the occasional action, so it takes the quiet left. Content clears the rail via `body.has-tabbar` (set in `renderViewSwitcher`), so landing/wizard screens that hide the bar keep the full width — no dead edge. Portrait untouched. Record: docs/records/v2.9.41-landscape/v2.9.42-sidenav.png.

## v2.9.41-beta — Landscape earns its keep (owner: "landscape view is a mess")

Root cause found by measurement, not eyeballing: **`.app` stayed pinned to the 430px portrait column in landscape**, so the whole game squeezed into the middle of the viewport — the score band ran *underneath* the bench rail (clipping THEM), and the clock hoist (`right:8px`, which predated the 262px rail padding) painted the clocks off-canvas behind the brand bar: invisible. Fixes: the app takes the full width in short-landscape; the header is one row (menu | the v2.9.39 single-line score, centred); the clocks return as an in-flow compact row (22px digits, labels inline) — never absolute-positioned into a padding zone again; the rails start below the 44px brand bar (the BENCH · N header was buried) and stop above the tab bar (the pitch's back line and START were running under it); rail pills get a compact tier (26px badge, 15px name, minutes dropped) sized for the 170px rail. One real bug fell out: **the takeover class was set in landscape too, sending renderRoster's bench into the display:none drawer — an empty rail in the final 10 seconds.** The portrait gate now lives in `_setBenchUrgency` (JS), not just CSS. Also: embedded app instances (gallery tiles, any iframe) skip the What's New modal — it was wallpapering all 17 tiles per version bump. Records: docs/records/v2.9.41-landscape/ (before/after + red state).

## v2.9.40-beta — Less chrome before kick-off (owner: remove the announce link)

The pre-kickoff "announce the line-up" link under the clock retired — with the timing strip already gone (v2.9.38) it was the last pre-kick chrome between the clocks and the pitch, and the pitch it pointed at already displays the complete starting line-up. The announce view itself is untouched and keeps its stamped break-time door ("announce it", v2.9.11: the break ritual ends in announce); `openAnnounce()` remains for the break flow, the gallery tile, and tests. The edge guard flips from "pre-kickoff offers the announce door" to "pre-kickoff nsi carries no announce chrome; the break door survives".

## v2.9.39-beta — A slimmer scoreboard (owner: "if it's going to be persistent, tighten it up")

The score idea arrived as "pop it behind a bottom button", which collides with the standing exception stamped 2026-08-08 (score entry one tap away in ALL states — goals arrive at random moments) — so the display compacted instead of the entry moving. The band is now ONE row: each team's label sits beside its − score + cluster (mirrored so both scores hug the colon), digits 34 → 26px, band min-height 84 → 52px (the v2.7.69 84px Plan-header height-match was moot once the Plan page left the game view in v2.9.11). The + / − stay .hit44 one-tap targets in their exact positions; AFL's goals/behinds layout is untouched. ~40px returns to the pitch/bench on every phone.

## v2.9.38-beta — The bench warms up with the countdown (owner: glanceable who's-on/who's-off, pops as sub time nears)

The bench now escalates with the next-sub countdown, on the countdown's own stamped thresholds (amber ≤ 30s, red ≤ 10s). **Ambient:** unchanged — quiet pills, the countdown dominates. **≤ 30s ("get ready"):** colour only — next-on borders go amber, the NEXT ON tag grows a "· get ready", and the countdown DIGITS finally go amber too (cascade fix: `.tmr-c.tmr-sub` out-ordered `.warn`, so the digits stayed green until the final 10s — only the label followed the thresholds). A 44dvh bench expansion in this window was tried and rejected: at 3 players per sub (owner test case) it starved the pitch, and the field is an ambient Must-show. **≤ 10s, portrait phone only:** the bench slides up as a **bottom drawer** over the field (overlay grammar — the sheet earns its shadow per the v2.9.34 elevation rule, and the pitch beneath never re-lays-out; landscape keeps its right-rail bench) — the list is the instruction being executed — with a window-scoped Field/Bench chip as the escape hatch; the drawer slides away the instant the swap fires (the relay card then owns the moment, per the s4 brief's sub-due state). The takeover deliberately does NOT start at 30s: SCREEN-BRIEFS s4's "three states, three kings" doctrine puts the receding of everything else at sub-due, and the field is a Must-show in ambient — a 30s-early takeover would be a fourth king on a timer (and the owner's "field minimises to a standing toggle" idea was tested against the brief and trimmed to the window-scoped chip: s4's choice budget is 8 with 12 already on screen). **The next-on wave becomes a table** (owner: "two columns — who's coming on, who's going off, the third is the position"): ONE benchmark-grammar card (§5.0 — one card, hairline rows, not N bordered pills) with aligned columns ↑ COMING ON | ↓ OFF | AT + minutes + reorder chevrons, so the coach reads all incoming names straight down one column; injury-pick mode and the landscape rail keep per-player pills (tap targets / 170px width). **The v2.9.7 timing confirm strip retired** (owner: "just taking up space") — s2 "Today's game" (v2.9.35) confirms timing one step earlier; the pitch gets the band back, and `openMatchSettings`/`.strip-link` go with it. Pill legibility: the OFF line gains the ↓, matching the announce screen's ↑green/↓amber direction language; jersey numbers go neutral. Threshold crossings re-render the roster so the px-projected pitch tokens track the bench height changes; urgency classes clear the moment no sub is upcoming. Dev gallery: fixture squad topped up to 11 (7 field + 4 bench) so multi-wave bench states are exercised; `gallery-server.py` + a second launch config open the gallery in one step.

## v2.9.37-beta — Next-on steps up a tier (owner: the most important information on the live game)

The next-on bench rows — who's coming on, for whom, at which position — are the sub manager's primary read, and they weren't dominant enough. They step up a full tier: 18px/800 names, 14px instruction line, a 36px position badge, deeper padding, a 2px border on a 12px radius. Later waves keep their v2.9.36 quieter-but-legible tier, so the hierarchy next-on ≫ later ≫ everything-else reads in one glance. The team editor gets its benchmark §5.0 pass in the same version: an identity info line, `.sec-label` eyebrows replace its `h2`s, the photo auto-fill loses its cyan/purple gradient for a flat green tint (two-colour rule + §5.0.7), the sample-squad and hint boxes join the neutral/radius scale, and the screen caps at the 600px measure.

## v2.9.36-beta — The game dash stops shapeshifting; the whole bench reads as the bench

Owner report on the main game screen: "buttons in awkward spots… doesn't feel logical." The cause was a morphing slot — the same dash position was amber SUB while running and became red RESET when paused, so the button coaches build muscle memory on changed meaning with the clock, and the rarest destructive action held a primary slab. The dash now has STABLE slots ranked by frequency: [Undo · quiet] [END HALF · quiet amber, play-only] [SUB · loud] [START/PAUSE · loud] — SUB owns its position permanently, dims when it can't fire, and **works while paused** (stoppages are when coaches sub). RESET moved to the game menu as "Reset half" (`resetHalfConfirm` — dialog confirm per the endPeriodNow precedent; row visible exactly when the old button was tappable; `.gd-reset` CSS deleted). Second owner report: the bench "only shows two players" — later-wave bench pills were 3px-padded `#888` rows that read as metadata; they keep their quieter tier but get real padding, 14px/700 blue-grey names and tokened minutes, so every wave reads as players. Dash background flattens (§5.0.7 straggler: it was still a gradient).

## v2.9.35-beta — Navigation audit lands (A1/A2/A4) + the Plan page's benchmark-lite pass

Three jump-audit items ship (NAVIGATION.md §4, owner go): **A1** — the tab bar hides on the deep wizard steps `gkStep`/`shapeStep` (mistap-mid-ritual was the audit's biggest "jumps all over" source; `s1` keeps the bar as the Roster tab's landing pending A3, `s4` keeps it for mid-game utility; the gallery's "ghosted 25%" staged option is deleted — the stamp chose hiding). **A2** — `s2` is **"Today's game"**: a new identity info line ("tweaks for this match only. Season defaults live in Settings.") and an "Apply for today" primary end the two-screens-called-Settings confusion. **A4** — back buttons name places: "← Home", "← Sport", "← Home". The Plan page gets its benchmark-lite pass: AUTO/CUSTOM tabs select as the solid-green flip at 44pt, the Players/sub mini-steppers join the green family with `.hit44` zones (were 22px cyan circles), the Profiles eyebrow and saved-plan chips go neutral. Fuller Plan-page work (choice budget −4, remaining `.is-plan` purple) waits on the palette stamp.

## v2.9.34-beta — Flat (benchmark §5.0.7): shadows and gradients leave the controls

Owner: "we were going for a flat look." Every control goes solid-and-flat: legacy `.btn` loses `--sh-raise` and its gradient fills (`btn-g`/`btn-r` → solid green/red), the ui- family and `.ui-step` lose the v2.9.3 "3px colour lip" (superseded — press is now a scale compression), and the game-dash tiles (START/SUB/PAUSE/RESET/Undo) lose gradients, resting shadows and the armed-state glows (solid tints carry the state). Elevation now belongs to the overlay layer only (drawer/menu scrim shadows stay); pitch glows are pitch identity, untouched. design.md §5.0 gains rule 7 and §4.1.0's press row is restruck; ui-check's benchmark guards grow three flat assertions (no press-lip shadow, no resting shadow on `.btn`, no gradient fills on controls).

## v2.9.33-beta — The benchmark rollout: setup path joins the §5.0 standard

The owner-stamped benchmark (§5.0) rolls onto the PLAY-mode path. **Game settings (s2)** gets the full treatment: `h2` bands → `.sec-label` eyebrows (new shared class; `renderTeamSettings` adopts it too), the three single-row timing "sections" collapse into ONE `.set-group` card with quiet unit sub-lines, the strategy picker becomes benchmark `.opt-row` rows (solid-green selection, stance + warning; long descriptions dropped from the matchday path), the Game-Plan panel and SNAP button de-purple, GK selects lose their red borders, and the screen caps at the 600px measure. **A stale, factually wrong hint died in the process:** s2 claimed sub cadence was "continuous across both halves — doesn't restart at halftime", but subs have restarted each period since v2.8.2 (UX-PATHWAYS P3.8 asserts it) — the copy now says so. **Red exits navigation app-wide:** `.btn-o` and `.back-btn` go neutral (red = danger/theirs only; Delete team keeps red via inline override). **Squad select** loses the purple plan-nudge (neutral chrome + one green action), saved-plan chips select solid green, and the **keeper pick** joins selection green — IN GOAL carries the role (the pitch's pink GK shirt, identity layer, is untouched). Setup screens (`s1`/`gkStep`/`shapeStep`) join the 600px measure. **The gate now defends the benchmark:** ui-check grows §5.0 guards — solid-fill selection can't regress to tick+tint, `.btn-o`/`.back-btn` can't silently go red again.

## v2.9.32-beta — Team settings refined; ONE formation tile on every screen (owner report)

The owner's pass over the Settings tab (with the live gallery open) found the formation picker rendered differently on three screens — Settings' flat text chips, the shape page's big cyan-tinted slabs (its own selected colour, no descriptor), and game settings' key+descriptor tiles. A single `renderFormationTiles()` now serves all three: 16px key over a 10px one-line descriptor on a `.ui-chip--tile`, standard `.sel`, the container grid deciding column count. Two chip shapes join the ui- system for content-bearing chips — `--tile` (column) and `--card` (block title+description; the s2 strategy picker + in-game strategy modal adopt it). **Selection itself is restamped (owner: "no subtle colour shift, the tick annoys me"):** selected = a solid accent fill with inverse `#06231d` text — a luminance flip that survives sunlight and colour-blindness (WCAG 1.4.1 via lightness, not hue) — and the `.sel` ✓ tick is deleted everywhere (squad, keeper's pink IN GOAL pick, POTM/scorer amber, strategy rows in their own colour, formation tiles). The tab itself de-noises (owner: too many panels): a new `.set-group` pattern gives ONE hairline-divided card per section — the three sub-strategy choices become `.opt-row` radio rows in one card (same `.sel` tint + ✓), and the three timing steppers + breaks-only switch share another — so the visible surface count drops to background / section / control. Also: the even-time suggestion moved inside the Sub-every row it tunes (row footer under a hairline, same one-tap USE); stepper units left the label parentheses for a quiet sub-line ("Half length (min / half)" → "Half length" / "minutes per half"); the breaks-only toggle got the `.hit44` 44pt zone (a11y ratchet 27 → 26) and a `role="switch"`; strategy rows and formation tiles became real `<button>`s; `.set-row` radius joined the stamped scale (10 → 12); and `#teamSettings .sec` caps at 600px so iPad rows keep labels beside their controls.

## v2.9.31-beta — Every chip joins the ui- system (migration step 3b — step 3 complete)

All 16 `.chip` call sites — squad picker, keeper/shape step tiles, formation/format/sport pickers, sub-strategy cards, sound packs, scorer picker, opposition formation — become `.ui-chip`: solid fill (gradients gone), 14px radius, SF Rounded 13/700. The `.chip` class and the dead `.chip.gk-sel` are deleted; ui-check's legacy list is down to `.btn` + `.back-btn`. The `.sel` ✓ tick the squad picker relied on moves to `.ui-chip.sel::after`, so every selected chip (now including POTM and scorer picks) shares one affordance. `.ui-chip` gains `justify-content:center;text-align:center` so grid tiles centre; inline-flex is blockified inside `.chip-grid`, and the one stacked-content site without an explicit display (plan sub-strategy rows) sets `display:block`.

## v2.9.30-beta — Steppers join the ui- system; 44pt hit zones for the score cluster (migration step 3a)

All 14 `−/+` stepper buttons (`.st-btn`, 40×40 red circles) become `.ui-step` — 48×48, SF Rounded, the 3px press lip; the `.st-btn` class is deleted and leaves ui-check's legacy list. The remaining §11.0 hit-area offenders get the padded-hit-zone treatment via a new `.hit44` pattern (transparent ≥44×44 button, visual on an inner span, negative margin keeps the layout footprint): score ± (28px visual), AFL GOAL/BEH/undo, and the squad page's Build → chip. a11y ratchet lowered 31 → 27, inline-button-signature ratchet 52 → 49; chips → `.ui-chip` (step 3b) is next.

## v2.9.29-beta — Legacy controls stop falling back to Arial (design.md §11.0 immediate fix)

The live-gallery elements audit exposed three button font systems — including the legacy `.btn` family declaring **no font-family at all**. Buttons don't inherit fonts, so primary buttons, back buttons, steppers (`.st-btn`) and chips rendered in the UA default (Arial) on-device, a different typeface from the rest of the app. All four legacy control classes now carry `font-family:inherit` — the stamped stopgap ahead of the full `ui-` migration (steps 3–5, design.md §11.1b). A new ui-check gate item asserts every legacy control class declares a font stack, so the fallback can't return.

## v2.9.28-beta — Heading bands removed; back joins the bottom action row (owner directive)

"I thought we were going to remove the headings" + "I want that whole band removed and the page navigation back can sit in line with the next" (atlas review, section D circled). v2.9.23 dropped header *back-links*; the h1 bands survived — no recorded decision either way, so this stamps one: **the brand bar is the only header, and per-screen navigation lives in the bottom action zone.** All ten h1s AND all content `.hdr` bands go (only home's long-hidden band markup remains). Each page's question folds into its info line ("Who's in goal? …", "Full time — match summary"); the squad page's team-name identity moves into the info line via `renderS1`. Back controls relocate: ← Squad / ← Keeper sit beside **Next** (keeper/shape pages), ← Squad beside **Apply settings** (s2), **Delete** beside **Save Team** (editor), ← Cancel / ← Back as bottom buttons (sport/format pickers, history). `s1Title`/`editTitle`, the h1/.sub/.hdr-row CSS removed. Also closes a latent bug found on the way: the sticky band was displacing 44px over the element beneath it (the info lines were never visible under it).

"The sub timing should also have even time split by players." The Settings tab's TIMING section gains the equal-time suggestion (same math as the squad-page hint — `round(hm × periods × sc / roster)`), computed from the FULL roster midweek, with a one-tap 44px USE button that live-saves; a quiet ✓ line when the interval already matches. Updates live as hm/sc/roster change (the section re-renders on every change).

## v2.9.26-beta — The whole bench on screen (owner report)

"I can't see the full bench for a team with more than two subs." The bench area was capped at 26dvh with an invisible scroll, and v2.9.25's bigger next-on rows pushed wave-2+ kids below the fold — against the s4 must-show (bench **with rest times**). Cap raised to 36dvh and later-wave rows compacted (3px padding, 18px badge — one quiet line each), so a typical 4–5-kid bench fits entirely; big AFL benches still scroll. The next-on hierarchy is untouched — if anything sharper.

## v2.9.25-beta — Bench "next on" hierarchy (owner request)

"Bump up the next-on bench sizes in terms of the hierarchy — that's the thing the sub manager is going to be looking at." The next-on wave's rows grow (name 13→16px/800, instruction line 10→13px, position badge 24→30px, roomier padding); later waves keep the small quiet treatment — the size difference is the hierarchy. Existing type sizes only (no new ratchet entries). Also per the owner: the **Team tab is renamed Positions** (key stays `team` for programmatic compat) — it holds the players and their position strengths; game defaults live in the Settings tab beside it.

## v2.9.24-beta — Position-ledger alignment (review findings on v2.9.22)

Codex review caught two P1s and a P2 in the position build, all confirmed. **①** The per-position ledger (and `repairSeating`) indexed formation slots by raw `G.on` position, but the app's rendered mapping (announce view, roster) is *outfielders in `G.on` order with the keeper filtered out, onto `positions[1..]`* — so whenever the keeper sat away from index 0, every outfielder before her accrued (and was repaired against) the wrong label. Both now use the canonical ordinal mapping; the smoke mirror updated to match. **②** The kickoff repair ran only before the setup pages — a keeper/shape change there could re-scramble seating after the sole repair; the final hop into the field (`finishSetupToField`) now re-repairs. **③** It also re-snapshots (`snapshotHalfStart`), so Reset Half restores the repaired kickoff line-up rather than the pre-repair order. Also fixes the FLOW.md edge left behind by the v2.9.23 back-link removal.

## v2.9.23-beta — Game settings get their own tab (owner directive)

The Game Settings block (formation tiles, sub-strategy cards, timing steppers, breaks-only toggle) leaves the team editor for a new **Settings** tab on the bottom bar — a PLAN-mode surface of its own (`teamSettings`), sitting next to Team; Game stays first, Roster stays last, visual weight unchanged. The editor is roster-only now. The controls are the same ones (`renderTeamSettings`, formerly `renderEditTeamPrefs`) but they operate directly on `currentTeam` and **live-save on every change** (`saveTeamSettings`: `saveTeams()` + debounced cloud push + a quiet Saved tick) — no Save button to forget. With no game underway a change also refreshes the working `cfg` immediately (`applyTeamPrefsToCfg`, extracted from `selectTeam`), so Settings → Roster → kick off uses the new defaults without a re-select; mid-game the live cfg is untouched and the next game picks the changes up. Smoke: tab presence, navigation + highlight, formation tap and stepper change persisting to the stored team, editor asserted clean of the old block.

## v2.9.22-beta — Position time + strengths adherence + quieter clocks (owner asks ×3)

Three from the Dragonflies review session. **① Position-time tracking:** `G.ppt` accrues seconds per formation-slot label every tick (keeper always GK, wherever her slot index sits); saved into each `playingTime` entry (`pos:{LB:1200,…}` — rides the existing jsonb, no schema change); summary + history rows show "LB 20′ · FW 10′" (sub-minute stints folded). **② Strengths adherence** (verified gap: an untagged kid at RB at kickoff via stale `luOrd`; rotations inherit slots tag-blind): new `repairSeating()` re-seats the on-field XI by swapping slots while mismatches strictly decrease — never changes who plays, untagged players fit anywhere, keeper untouched; runs at kickoff (after saved-plan apply, before the review pages) and after every engine sub before the relay card reads the slots; never in Plan-ahead build mode, never on coach tap-swaps. **③ Clock steppers removed** (min-half / min-subs under the clocks) — timing is seasonal (team settings) with the strip's Change link for exceptions; also deletes 4 of the worst a11y hit-target offenders (`clkAdj` retired; the Plan page's `planClkAdj` unaffected).

## v2.9.21-beta — Keeper handover credit (owner rule, from the first real bug report)

The Dragonflies vs Curl Curl review (sent via the new v2.9.20 button) found no engine error — every rotation followed "longest-on off, least-played on" exactly — but exposed a design gap in the v2.9.5 keeper rule: after a mid-game gloves handover, the ex-keeper's zero outfield seconds made her unrotatable (she played all of H2), the new keeper was locked on by role, and the remaining kids churned through 5 slots (one sat the entire last 10 minutes; another was benched at the rotation right after coming on, three times). **Owner rule:** the ex-keeper goes *"back into the normal cycle as if the keeper played their allotted time"* — on handover her rotation clock is credited up to the group average, held in a new `G.rotCredit` ledger feeding `_rotSecs()` only (pt untouched — displayed minutes stay true; `gkt` keeps meaning goal-seconds). Credit fires at every mid-game handover path (field tap-swap, break/live keeper pick, explicit 2nd-half keeper); pre-kick picks are no-ops. Plan-page projections read the same ledger so preview and engine agree. Snapshot/reset/resume all carry the ledger. Smoke: reproduces the Dragonflies shape (10 players, 7v7, 5′ subs, HT gloves swap) and asserts the ex-keeper rotates in H2 and the outfield spread tightens.

## v2.9.20-beta — The bug report button (owner request)

"Can you code a button so I can send game for bug review?" History detail grows **Send this game for review**: one tap posts the saved match record + the matching replay flow (time-matched from the recorder, scores as tie-breaker) + an optional note/email to a new `bug_reports` table — insert-only RLS mirroring the feedback table, readable only via the service role. No files, no share sheets — the existing "Send game flow" share-sheet route stays for manual exports, but the car-park path is now one tap. Reports carry app version + user agent for triage.

## v2.9.19-beta — The half-time override (owner request)

"We need something to override it and say it's already half time." An **END HALF** button (amber, flag icon — FULL TIME on the last period, END Q2 on quarter sports) sits in the game dashboard **next to PAUSE** — the owner's placement call after a first pass on the period label proved too subtle. Shown only while a period is genuinely underway (never pre-kick, never at a break — the same window `endPeriodNow()` accepts); tap → sport-aware confirm → the period ends at the current clock through the exact same `advH()` path as the natural expiry: break state, true-order period_end log with the clock where it actually stopped, auto break-rotation, summary on the final period.

## v2.9.18-beta — The summary scorer picker (owner report)

"The note who scored the goal didn't work after logging it." The at-goal picker works (verified live) — the hole was the gap between the moments: a skipped "Who scored?" had NO affordance on the full-time summary; scorer editing only existed after saving (edit-from-history, v2.9.15). The summary's game log now gives our goals the same "name the scorer / change scorer" button, routed through the existing live picker (`promptScorer` — scorer + assist, writes `G.log`). `showSum`'s log block factored into `renderSumLog()`; `closeGoalPicker` repaints just that card so typed opponent/location text survives. The scorer is now nameable at all three moments: at the goal, at full time, and from history.

## v2.9.17-beta — The setup step pages (owner directive)

Keeper and shape become explicit pages BEFORE the game screen: squad → **keeper page** (`gkStep`) → **shape page** (`shapeStep`) → line-up review (s4) → announce → kick off. The game is built first (`quickStart` — engine proposes), so each page is a one-tap review with the proposal marked; picks route through the existing `setPlanKeeper()` / `selectGameFormation()`. Keeperless sports skip the keeper page, fixed-formation sports skip the shape page (`routeSetupSteps()`); the v2.9.16 GK/formation pills stay as re-entry + break doors. `finishSetupSteps()` is the programmatic walk-through used by the test harness and every direct `startFromSquad()` caller (13 sites). New briefs for both screens; screen-audit + a11y audit them; FLOW.md map updated.

## v2.9.16-beta — The keeper door (owner report: "where is the keeper workflow?")

Play mode 4 removed the live game's doors to the Plan page — and the keeper picker lived there, so choosing the keeper silently lost its only discoverable path (field tap-swap transfers the gloves, but nobody would find it). The game screen now owns the gloves: a **GK pill on the pitch** (top-right, 44px, shows the current keeper's name) appears exactly in the ritual window (`planSetupPhase()` — pre-kickoff + breaks, never mid-play) and opens a chip picker (on-field first, bench under a separator). Taps route through the existing `setPlanKeeper()`, so all the established behaviour holds: a benched pick swaps onto the field and displaces the old keeper; a break pick is an explicit 2nd-half keeper (`gk2Explicit`); the keeper stays out of the rotation pairs. Smoke: setup pick, benched pick (displacement asserted), break pick (gk2Explicit asserted), and mid-play hiding.

## v2.9.15-beta — Edit-from-history (s5 gap ②)

The enrich-later half of the whistle ritual: history detail grows an **Edit details** door. Editable: opponent, location, per-goal scorer (one tap per goal, inline chip strip; clearing a scorer clears its assist; a scorer can't assist their own goal), and player of the match. **The record's facts stay read-only** — score, minutes, event times are never editable, resolving the P5.4 tension flagged in the s6 brief. Edits work on a deep copy and land on Save: local matches store updated in place; signed-in edits sync via a new `updateCloudMatch()` UPDATE path (only the deferred fields travel — opponent, location, log). The log-borne potm event is kept in step with the field on every save. Smoke: scenario covers the full edit round-trip including cancel-discards.

## v2.9.14-beta — iPad fix: input focus auto-zoom (right side clipped)

Owner report: the right side of the app was clipped on the iPad. Cause: iOS Safari zooms the page when a focused text field is under 16px, and with `user-scalable=no` the zoom can stick after blur — the app then sits zoomed with its right edge off-screen. Every text field (`.input` was 15px; share-link 11px; team-code 12px; dev flow-JSON 11px) is now 16px — the documented iOS fix; pinch zoom untouched, no layout change otherwise. New a11y gate check: every focusable text field must be ≥16px, full-DOM, so the trap can't be reintroduced. (A stuck iPad clears with one pinch-out or a reload.)

## v2.9.13-beta — Player of the match (s5 gap ①)

First feature from the rehearsal backlog. The summary grows a huddle-fast picker: one row of name chips under a star heading, playing-time order (likely candidates float up), one tap picks, tap again clears — no overlay, no extra screen. `G.potm` persists through backgrounding via the active-game save; `saveMatch()` writes `match.potm` **and** a `{type:'potm'}` log event so the pick survives the cloud round-trip without a schema change (the `matches` table has no potm column; `log` is jsonb — `_matchPotm()` reads either shape). History detail shows the star line. The log renderer silences the potm event (the star line is its display). Smoke: new scenario covers pick → save → reread from history — the first automated coverage on the save-match path.

## v2.9.12-beta — Play mode 5: Home is the Plan/Play fork

The start screen now IS the mode split (owner-stamped brief). PLAY: the team card tap goes straight into squad select — no action menu in between — and when a game is live the card resumes it (resume outranks everything). PLAN: the card's quiet purple clipboard button opens the midweek sheet (Plan ahead / Past games / Edit / Share — "Play now" left the sheet since the card does it), and **+ New Team** loses its matchday red for the quiet plan tone (`ui-btn--secondary is-plan`). First-run landing keeps its own primary CTA. Share copy updated ("tap the team to play"). `teamActionPlayNow()` removed.

## v2.9.11-beta — Play mode 4: the Plan tab leaves the live game

The constitution's split lands in the tab bar: the Plan page is midweek-only. The Plan tab, the game drawer's Sub Plan row, the break-hint's "set next line-up" link, and the dead `subOrderBtn` are removed from the live game — its only door is now the team card's **Plan ahead**. Mid-game doubt is answered by the game screen's ambient info (countdown, coming swaps, bench rest), never by dropping the coach into build mode.

**Decision recorded (follows the owner-stamped s4 break ritual):** break line-up editing lives on the game screen's break state, on the field — tap-swap positions, keeper pick, formation change — ending in the announce view. The P4.4b engine guarantee (plan-at-break describes only the upcoming period) stays gated for the programmatic/midweek route. `switchToView('plan')` survives as the programmatic route (tests, replay flows). While the Plan page is open, no tab highlights; exit via Game/Team/Roster.

## v2.9.10-beta — De-outline: the first visual clean-up (owner directive)

Outlines removed from buttons and panels app-wide — chips, dashboard buttons, outline buttons, steppers, modals (the 3px red frame), drawers, pop-up menus, tip cards, banners, and the JS-rendered pickers (squad-plan, strategy, formation, plan tabs). Fills and colour now carry hierarchy and selection; selected states switched from coloured rings to tinted fills. Kept: the two structural shell hairlines (brand bar, tab bar), form inputs, and the position-tag pairs (colour-coded identity). Zero behaviour changes.

## v2.9.9-beta — Play mode 3a: the relay card

At every fired sub the screen scripts the shout in speaking order — who comes on, for whom, at which position (slot mapping computed post-swap so the position is where the kid runs to). Tap or 12 s dismisses; undo withdraws it; break rotations defer to the announce view. Edge-gated ×4.

## v2.9.8-beta — Play mode 2: the announce views

The huddle script: a read-aloud line-up view (starters with position codes, keeper marked, bench grouped) reachable pre-kickoff ("announce the line-up") and at every break ("announce it", titled with the upcoming period). Edge-gated ×5.

## v2.9.7-beta — Play mode 1: the timing confirm strip (game-day setup simplifies)

First code to land from the owner's Saturday rehearsal (docs/SCREEN-BRIEFS.md): **timing is seasonal, not matchday** — period length, cadence, group size and strategy are per-team config, set once. The pre-kickoff review now carries a one-line **timing confirm strip** ("20′ halves · subs every 5′ · 2 per sub · Equal time — *Change*"); Change opens the settings screen on demand, Apply returns to the review.

- 🧭 The settings screen (`s2`) formally leaves the matchday path — code archaeology showed it had already fallen out (`goSettings()` had no live callers since squad-select started routing straight to the game); the strip gives it a deliberate on-demand door instead of none, and its button now reads **Apply settings**.
- 📜 UX-PATHWAYS P2.3 rewritten to match intent; new invariant gated in `edge`: the strip shows pre-kickoff with the seasonal values and vanishes once the game is genuinely underway.
- 🧱 Zero new colours; the strip wears existing tokens.

Matchday is now: squad → pre-kickoff review (+ glance) → kick off.

## v2.9.6-beta — Drawer rows move onto the `ui-` button system (migration step 02)

First step of the button-system migration that changes pixels (step 01 defined the classes and touched nothing). The 12 drawer/menu rows — game menu (Edit Team, Sub Plan, End game), plan menu (Edit Team, Save plan profile, Edit Lineup, End game) and the rows `openDrawer()` injects into every drawer (Sub-alert sound, Help & gestures, Sign in, Send feedback, Send game flow) — are now `.ui-btn--ghost` instead of twelve near-identical inline style strings.

- 🎨 Two colour-only ghost tones added: `.is-plan` (purple rows on the plan menu) and `.is-danger` (End game), following the `.ui-step.is-danger` precedent. Zero new colours.
- 📏 Rows get the system's 50px min-height (was ~46px), 14px radius, `ui-rounded` type at 700 — the "fun familiar approachable" treatment from design.md §4.1.0.
- 🧹 The amber Donate row keeps its deliberate one-off treatment.
- 🔒 `UI_BUTTONS` ratchet lowered 54 → the post-migration count; the budget can keep falling, never rise.

Behaviour untouched: same items, same order, same handlers.

## v2.9.5-beta — Time in goal doesn't count as game time for equal play

From a real game, better described the second time: **Molly kept the whole first half, handed over the gloves at the break, and was then subbed off "way too many times" in the second half.**

Reproduced exactly (9-player 7v7, subs every 5): the keeper never rotates, so Molly reached HT on 20 minutes when nobody else had more than 15. Equal-time always pulls the highest-minutes player off — so as an outfielder she became the permanent target: **off at 5', forced back on at 10' by the two-deep bench, off again at 15'.** Two yanks in a half, 5-minute stints, worst of any player.

**The owner's rule, now implemented: keeper time is not game time for equal play.**

- ⏱ `G.gkt` tracks seconds in goal per player. All rotation *selection* — live engine (`trigSub`, every strategy), the on-pitch next-sub preview (`getNextSwap`), the Plan-page simulation (`buildPlanTimeline`) and the Full-Control plan generator (`generateAutoPlan`) — sorts on **outfield seconds** (`pt − gkt`). Plan and live stay in agreement, per the v2.8.2 principle.
- 🖥 **Displayed minutes are unchanged everywhere** — pitch chips, summary, history show true total time. Only the fairness ledger changed.
- 🎿 When the keeper never changes, `gkt` cancels out of every comparison — behaviour is provably identical. The rule only bites at a handover.
- 🔁 Survives refresh (snapshot + reset-half carry `gkt`; old saves backfill empty and start tracking).
- 🐛 Fixed in passing: `generateAutoPlan`'s keeper was constant, so after its HT `gk_swap` the plan kept excluding the **ex**-keeper from rotation — pinning them on the pitch for the entire second half. `simGk` now follows the gloves.

**The stated trade-off:** the H1 keeper now tends to play the whole second half (Molly: 40 total vs ~30 for others — but 20 *outfield* vs their ~28, which is what the rule says matters). Flagged for real-game judgement.

Guarded by `secondhalf: H1 keeper is not rotation-targeted after handing over the gloves` (5 checks, red against v2.9.4).

### The fairness hunt (`npm run fairness`) — and what it found in its first hour

Molly's bug passed every structural gate; nothing was in a wrong *state* — one player's *experience over time* was absurd. `test/fairness.mjs` hunts that class: ~150 seeded games through the real engine (randomised squad, cadence, group size, strategy, keeper handovers, injuries), judging each player's stints, waits, off-counts and outfield spread. Exploratory like the hunt — findings are judgements, not merge blockers. Every game replays from its seed; the Molly game is pinned as game zero.

**Two engine bugs found on the first sweep, both fixed and gated (`edge`):**

- 🥇 **The odd pair never rotated.** Paired rotation compared pairs by minute **sum** — so the leftover pair from an uneven split (7 outfielders in 3s → `[3,3,1]`) could never outweigh a full triple, and its occupant played the whole game: **96 of 100 minutes while teammates averaged 55**. Affected every paired game whose outfield doesn't divide by the group size, including 11v11 in 3s. Pairs now compare per-member **averages** — live engine and Plan sim identically.
- 🩹 **An out-for-game injury made the replacement invisible.** The victim was dropped from their pair without seating the replacement — and paired rotation only ever subs off pair members, so the replacement stayed on untouched. The replacement now takes the vacated pair seat.

**Left open, deliberately — judgement calls, not bug fixes:** the greedy equal-time scheduler drifts up to ~3 intervals of spread with single-player swaps on quarter sports (a smarter scheduler is a product decision); and 22 of 151 random configs **mathematically cannot** cycle their bench (16 players, subs every 8, 30-minute game) — the engine can't fix arithmetic, but the app could warn at setup and today it doesn't.

---

## v2.9.4-beta — Fixed: sign-in was unreachable for anyone with a team

Reported as "there is no login", and it was right — on production, for about 40 versions.

**Sign-in had three routes and two were dead:**

- `renderAuthChip()` writes into `#authChip` — **an element that has never existed in the markup**, so the function returns at its own guard and paints nothing.
- The app-settings modal (`#appSettingsOv`) contains a working sign-in row, but **nothing anywhere opens that modal**.
- The drawer's settings block — whose v2.7.85 comment explicitly promises "Sub-alert sound + Help & gestures + **Sign in if not already on home**" — only ever contained the first two.

That left the landing hero, which renders only when `teams.length === 0 && !cloudUser`. **The moment a coach saved their first team, sign-in vanished** — and if they were already signed in, sign-out went with it. Cloud sync was unreachable for every existing user.

- ✅ **Sign in / Sign out now lives in the menu**, on every screen, where the comment always said it should. The row refreshes each time the drawer opens, so it reflects the current session rather than being baked once.
- 📴 **Honest when offline** — Supabase loads from a CDN, so with no connection there is no auth client at all. The row now says "Sign in — needs a connection" and disables itself, rather than opening a form that can only fail. That case became reachable in v2.9.3, when the service worker made the app open offline.

### Notes
This bug lived in **UX-PATHWAYS P7 (account & cloud sync)** — the pathway `docs/CONTROL-DOCS.md` flagged as having **no invariants at all**. The audit predicted the gap; the bug was sitting in it. P7 now has its first assertion and moves 🔴 → 🟡, guarded by `edge: sign-in reachable from the menu with a team saved`.

---

## v2.9.3-beta — Works at a ground with no signal

Prompted by a simple question — "fonts correct as well?" — applied with the same skepticism as the design and accessibility claims. The stack was fine. The delivery wasn't.

- 🔤 **The clock font is inlined, not fetched.** DSEG-7 Classic came from `cdn.jsdelivr.net` with no service worker, so `document.fonts.check()` returned **false** offline and the clock fell back to plain monospace — the scoreboard identity simply absent, in the exact place the app is used. Now a base64 data URI: 5KB raw, 6.7KB inlined, on a 612KB file. Verified by loading with the CDN blocked.
- 📴 **Service worker — the app opens with no reception.** `manifest.json` declared `display:standalone`, so it installed to the home screen looking native, and then needed a network to render its own clock. A cold start offline previously showed the browser's offline page. Verified: network fully down, cold start, full app with the DSEG clock.
- 🌐 **Network-first, deliberately.** The obvious choice for an offline app is cache-first, but this app ships often and cache-first is how PWAs strand users on a three-week-old build. Network-first gives current-when-online, last-good-when-offline. Also **no `skipWaiting()`** — a worker taking over mid-match could reload the page during a game; new versions activate on the next cold start instead.
- 🎨 **Three.js stays on the CDN.** 600KB isn't worth inlining and the 2D pitch fallback renders correctly without it. Cloud sync failing offline is also correct. The clock was the only cosmetic dependency, and it was the app's identity.

### Notes
- `docs/PRIVACY.md` gains a Cache Storage row. It holds no personal data — shell and icons only — but rule 1 says a new place to put data gets a row *before* it ships, not after. The rule is about the place, not the contents.
- `design.md` §2.2 now documents delivery, not just the stack.

---

## v2.9.2-beta — UI consistency check, and the pitch-legibility finding

- 🔎 **`test/ui-check.mjs`** — in the gate and CI. Ratchets four counts so the gap between `design.md` and the code can shrink but never grow: sub-9px text (11), distinct font sizes (20), distinct radii (11), distinct inline button treatments (54).
- 🎯 **Radius sprawl measured, not changed** — 13 distinct corner radii against a 7-step scale. Three were briefly snapped onto the scale and then reverted: they were only changed to satisfy a metric introduced the same day, and the pixels they altered were working. The ratchet holds at 13, which is what stops NEW ones appearing.
- 📉 **The pitch carries the smallest text in the app.** All 11 sub-9px declarations are on the 3D player chips, and AFL is worst: 18 players force position labels to **7px** and names to 8px. That is in direct tension with design principle #1 — *"the coach is on a sideline in sunlight… readable in one glance"* — because the pitch is precisely the surface read at a glance mid-game. **Recorded, not silently changed:** fixing it is a density trade-off (18 chips have to fit), so it needs a decision, not a token edit.
- 📐 **One Button, 54 treatments.** `design.md` §4.1 documents a single Button component, but **121 of 158 buttons are inline-styled** across 54 distinct padding/size/radius/weight combinations. A document can't govern a component the code doesn't use. Ratcheted, with convergence (promoting the common signatures to classes — the top 8 cover ~65 buttons) recorded as backlog.
- 📝 `design.md` §2.2 now states the real count next to the eight documented roles, rather than implying the roles are the whole story.

---

## v2.9.1-beta — Accessibility check, and the stray button it found

- 🐛 **Removed an invisible 4×4 pixel button from the Home screen.** `#historyBtn` was left behind when Match History moved into the team-action menu — its label stripped, but `renderHome` still un-hiding it. Tappable, unlabelled, doing nothing a coach could see. The accessibility lens found it before any functional test did, because it was invisible rather than broken.
- 🔎 **`test/a11y-check.mjs`** — walks eight screens in a real browser at 390×844, in the gate and CI.
  - **Accessible names: hard fail.** All 114 controls pass. A control with no name a screen reader can announce now fails the build.
  - **Hit targets: ratcheted at 34.** 34 controls sit below the 44×44pt minimum `design.md` §8 requires; the count can fall, never rise.
  - **Focus rings:** reported every run until closed.
- 📝 **`design.md` §8 now states what's true.** It asserted the 44pt minimum flatly while most controls failed it — and being written down is exactly what stopped anyone checking. It now reads as a target with the real number beside it, per `docs/CONTROL-DOCS.md`: a control that asserts the opposite of reality is worse than no control.
- 🔇 The drawer scrim is `aria-hidden` — a decorative click-catcher shouldn't appear to a screen reader as an unnamed full-screen control when the drawer already has labelled close affordances.

Checking all eight screens rather than only the game screen roughly doubled the count (18 → 34). The worst offenders are the clock steppers (18×18) and tip-carousel arrows (24×24); sizing those is a layout decision, since the steppers are deliberately small so two clock anchors fit side by side on a phone.

---

## v2.9.0-beta — Data & privacy policy (no functional change)

No change to how the app works. `docs/PRIVACY.md` records what Sub Timer stores, what leaves the device, and the rule for the next feature; `test/privacy-check.mjs` fails the build if a `localStorage` key appears with no row in it.

The policy is deliberately proportionate — a junior roster of first names and jersey numbers is low-sensitivity, and treating it as a compliance exercise would be silly. It exists because the app gained cloud sync, share links, photo import and flow export across ten versions, each reasonable alone, with nothing tracking the cumulative picture.

Writing the inventory surfaced three things worth knowing, none of which was the share link that prompted the discussion:

- **Photo roster import is the widest egress.** `extract-roster` uploads an arbitrary photograph to a server-side vision model. The intended subject is a team list, but a photographed club team sheet routinely carries surnames, parent phone numbers and dates of birth. Everything else the app sends is structured data whose shape we chose; this is the only path that can send data the app has never seen.
- **Names are full names by design.** The screen shows first names, which makes it easy to assume that is all we hold. `fn()` splits on whitespace and renders the last word as an initial ("Sarah B") — so any coach with two Sarahs is pushed into entering surnames, and the raw string is what is stored, synced and shared.
- **Match history has no delete path.** `matches` is insert-and-select only, so saved matches — names, minutes, location — can't be removed.

Also adds `docs/CONTROL-DOCS.md`, a register of which documents govern this app and which of them actually enforce anything.

---

## v2.8.9-beta — The match log reads the way the game happened

- 🕐 **The half-time change is no longer filed under the first half.** `advH()` pre-applies the recommended rotation at the break, and `confSub()` stamped those swaps with the clock as it stood when the half ended — so the log read `1H 20:00 Quinn → Sam` / `1H 20:00 Taylor → Jordan`, *above* the Halftime line, for two players who never took the field in the first half. It also made the halves look asymmetric: 1H showed subs at 5/10/15/**20**, 2H only 5/10/15. Those rows now read **HT** and sit under Halftime.
- 🧹 **Removed the blank row at the top of every match log** — the `sub_strategy` entry recorded at kickoff, which no renderer handled and so drew an empty line stamped `1H 00:00`.
- 🩹 **Injury subs, half resets and opposition-shape changes now render** instead of silently drawing empty rows for the same reason.

### Architecture notes
- `period_end` is now pushed by `advH()` when the break begins, not by `startNextPeriod()`. It has to be logged *before* the rotation is applied, or the break marker lands after the change it precedes.
- `_breakRotation` is set around the `trigSub()`/`confSub()` call in `advH()`; `confSub()` tags the resulting entries `atBreak:true`.
- New shared `_logTimeLabel(e)` (break rows and `atBreak` rows read "HT"/"Q3") and `_logRenders(e)` (filters `LOG_SILENT_TYPES`), used by both the summary and the match-history renderers so the two can't drift.

---

## v2.8.8-beta — Dev mode: the test harness, inside the app

Built after a run of screenshots showed `00:01` on the clock six minutes into a half. That was **not** the app — it was the throwaway fast-forward helper in the screenshot script, which advanced `G.secs` without `G.elapsedMs`. Every test script had been re-inventing that helper, and getting it subtly wrong. Now there is one implementation, in the app, that testing and debugging both use.

- 🧪 **Hidden dev panel**, gated on visiting the app with **`?dev=1`**. The flag is stripped from the URL immediately (so a shared or bookmarked link never carries it) and the choice is remembered on that device. Turn it off from inside the panel or with `?dev=0`. Nothing renders or wires when it's off — coaches will never see it.
- ⏱ **Jump the clock** to any period and minute. Runs the **real** per-second logic (`tickSecond()`), so auto-subs fire and playing minutes accrue exactly as in a live game — a jumped-to state is indistinguishable from a played-to one. Plus skip-to-break and skip-to-full-time.
- ⏪ **Rewind within the current period** by restoring the kickoff snapshot and re-simulating. Rewinding *across* periods is refused outright rather than silently doing nothing — nothing records enough history to rebuild an earlier period faithfully.
- 🌱 **Seed a game** in one tap for any of the 23 formats — team, squad, settings, straight onto the pitch. No more clicking through setup to test a half-time behaviour.
- 🎞 **Replay a game flow on screen.** Paste an exported flow and step or play through it in the real app, watching the bug happen, instead of only headlessly via `test/replay.mjs`.
- 🔍 **State inspector** — live readout of period, clock, on-field, bench, keeper (and whether `gk2` is an explicit pick or the default), rotation pairs, subs done and per-player minutes.

### Architecture notes
- `devFreezeClock()` stops the loop and reconciles `G.elapsedMs = G.secs*1000`. `renderG` paints the clock from `elapsedMs` while `tickSecond` only advances `secs` (the live rAF loop is what normally reconciles them) — every ad-hoc harness that skipped this displayed the wrong time.
- `devAdvanceTo(period, secs)` drives `tickSecond()` in a loop and calls `startNextPeriod()` across breaks. At a break the current position is taken as the *end* of `G.half`, since `G.half` is still the finished period; treating it as `G.secs` made a rewind request from half-time neither happen nor get refused.
- In-app flow replay mirrors `test/replay.mjs`: rebuild from `flow.setup`, advance the clock to each action, and skip `auto` actions (they are reproduced by the clock, and re-applying them would double-substitute).

---

## v2.8.7-beta — Second-half setup fixes (the 2nd-half keeper, and the Plan page at a break)

Both found by a targeted sweep of the period boundary after a coach reported "an issue with player setup in the second half".

- 🧤 **The "2nd Half GK" setting now actually works.** It had never been wired to anything: it was stored, persisted, and rendered on the Plan page as **"HALFTIME GK SWAP"**, but nothing ever assigned it to the live keeper — so the first-half keeper played the whole match. The nominated player now takes the gloves at the break, and is brought on from the bench (displacing the outgoing keeper) if that's where they were.
- 🎯 **Only an explicit pick swaps.** `gk2` auto-defaults to a *different* player than `gk1`, so every keeper-format game was silently displaying a halftime keeper change that never fired. A new `gk2Explicit` flag means the swap happens only when the coach actually chose someone — leaving the setting untouched changes nothing, and the Plan page no longer promises a swap it won't perform.
- 🔒 **A defaulted 2nd-half keeper is no longer locked out of the rotation.** The plan generator excluded `gk2` from outfield rotation for the whole game on the assumption it would become the keeper; with the swap never firing, that pinned an outfielder on the pitch, never rotated, for 90 minutes.
- 🧹 **The keeper choice no longer leaks between teams.** `gk1`/`gk2` are indices into a *specific* squad, and `selectTeam()` never reset them — so an explicit pick could have handed the gloves to whoever sat at that index in the next team. Cleared on team switch.
- 📋 **The Plan page at a period break showed the wrong half.** At a break `G.half` is still the period that just *finished* (`startNextPeriod()` is what increments it), so the timeline regenerated the finished half's sub slots as upcoming: stepping the sub preview forward at half-time showed sub points that had already happened, the "NOW" tag sat on the wrong column, and the entire second-half projection — including projected minutes — was computed from a line-up that never existed. Display-only; it never corrupted the live game.

### Architecture notes
- New `applySecondHalfKeeper(upcoming)` runs from `startNextPeriod()` *before* `snapshotHalfStart()`, so RESET restores the correct keeper. Scoped to two-period sports (matching the setting's label and the plan's soccer-only `gk_swap` event); quarter sports change the keeper by tapping at the break, which already worked. Remaps `G.pairs` the same way `swapFieldPositions()` does, and logs a `gk` event.
- `gk2Explicit` is set by the two GK `<select>` controls and by `setPlanKeeper()` for a later period; cleared wherever `gk2` is auto-defaulted or nulled, and in `selectTeam()`. Persisted through `saveActiveGame`/`resumeActiveGame`, plan profiles, and game flows.
- `buildPlanTimeline()`, `computeProjectedMinutes()`, `getPlanScrubState()` and the period-column render all derive an effective current period `curP = G.atBreak ? G.half+1 : G.half` (and `curSecs = G.atBreak ? 0 : G.secs`) instead of using `G.half` directly.
- New `test/secondhalf.mjs` (68 checks) added to the merge gate, covering both defects plus the must-NOT-swap default case, a benched pick, a break-time tap winning over an older setting, and survival across a refresh at the break.

---

## v2.8.6-beta — Game flow recording (send a bug, don't describe it)

- 🎞 **Every game is recorded as a replayable "flow"** — the setup it started from plus every tap you made, in order, stamped with the game clock and the line-up it produced. The last 12 games are kept.
- 📤 **Send game flow** — new item in the menu (☰). Pick a game, and it goes out via the share sheet on a phone or downloads as a `.json` on desktop. A bug seen on the sideline can then be replayed exactly on a laptop instead of being guessed at from a description.
- 🕶 **Names never leave the phone** — players become `Player 1, 2, 3…` before anything is stored, mapped consistently, with duplicates preserved so the two-players-with-the-same-name case still reproduces. Jersey numbers and position tags are kept, because they steer auto-fill and rotation.
- ♻️ **Survives a refresh** — a game interrupted at half-time (app backgrounded, phone locked, browser reloaded) stays one continuous recording rather than splitting in two.
- ✅ **Recorded games are now a test suite** — `npm run flow` plays ten scripted games, weighted to the second-half setup path, records each the way the app does and replays it; `npm run replay` re-runs every real game committed under `flows/`. Both are merge gates, so a game that once went wrong can never go wrong the same way again.

### Architecture notes
- `tickLoop()`'s per-second body factored out as `tickSecond()` so the live game and the replayer run **identical** logic — a replay exercises the real code path, not a model of it.
- `flowInstall()` wraps the user-facing action functions; `flowRecord()` opens an entry (call + args + clock) and `flowSeal()` closes it with the resulting state. A `_flowDepth` guard records only top-level calls — `trigSub()` calls `confSub()` internally, and recording both would double-apply on replay. A `_flowInTick` counter flags clock-fired actions `auto:true`; the replayer reproduces those by running the clock rather than re-applying them.
- `flowBegin()` at kickoff, `flowResume()` re-attaches after a reload via `G.startTime`. `_flowScrub()` walks both keys and values (playing time is keyed by player name). Storage is capped at 12 games / 4000 actions, and a quota failure sheds the oldest games instead of throwing mid-match.
- New: `test/replay.mjs` (exports its in-page engine), `test/flow.mjs`, `flows/`. See `PROCESS.md` for the REPLAY layer this adds to Map → Gate → Hunt.

---

## v2.8.5-beta — Team share link (access code for parents & co-coaches)

- 🔗 **Share team** — new item in the team-action menu. Builds a link that carries the whole team setup: roster, position tags, jersey numbers, preferred sides/feet, format and saved game settings. Send it to a parent or co-coach; opening it installs the team on their phone with a **"TEAM IS READY — Play now"** welcome that lands them one tap from kickoff. No account needed on either end of the receive.
- 📋 **Copy link** + native **share sheet** (mobile) from the share overlay.
- ⌨️ **Paste-a-code fallback** — "Got a team link from your coach? Add it here" on the welcome screen accepts the full link or the bare `ST1.` code, for messengers that mangle URLs.
- ♻️ **Safe to re-send** — re-opening a code for a team you already imported refreshes it in place (no duplicates), and opening your own link never clones your own team.

### Architecture notes
- Payload is self-contained base64url JSON in the URL hash (`#team=ST1.<payload>`): `{v, sid, n, s, f, p, pos, sd, ft, nm, pr}` — no server round-trip, works on preview deployments (link uses `location.origin`). `sid` (the sharer's team id) is stamped onto the import as `sharedFrom` and is the dedupe key. Import runs at boot **before** `renderHome()` (`importTeamFromUrl`), then `history.replaceState` strips the code so refreshes don't re-trigger; a bad/unknown-format payload (e.g. from a newer app) is rejected whole rather than half-imported. New edge-suite scenario round-trips a share code onto a wiped device.

---

## v2.2.0-beta — 3D pitch for soccer & netball too

- ⚽ **Soccer** and 🥅 **netball** now use the same real 3D playing surface as AFL — drag to rotate, pinch to zoom, tap a player. Same Behind / Side / Top presets, lock toggle, and auto-zoom-to-fit.
- ⚽ **Soccer pitch** renders the full kit: touch/goal lines, halfway line, centre circle + spot, penalty boxes, 6-yard boxes, penalty arcs (the "D"), corner arcs, and goal frames (posts + crossbar) at each end.
- 🥅 **Netball court** renders the thirds (two transverse lines), centre circle, both goal-circle semicircles, and a standing goal post with ring at each goal line.

### Architecture notes
- `afl3d` generalised into a sport-aware viewer. New `DIMS` map (`afl` oval 135×165, `soccer` rect 104×160, `netball` rect 76.5×153, each with a `goalH`); `setSport(key)` swaps `FIELD_W/L`, rebuilds the ground group in place (no renderer teardown), regenerates fit points, and re-runs `setView`. `buildGround()` dispatches to `_buildAfl` / `_buildSoccer` / `_buildNetball`; shared helpers `_grass(oval)`, `_post`, `_bar`. `_buildFitPts()` samples an ellipse ring (AFL) or rectangle perimeter (soccer/netball) plus goal-height points so `autoFit` frames any surface. `update(container, buildPill, sport)` sets dims before a fresh `init` and calls `setSport` on a switch. `renderRoster` routes all three sports to the 3D viewer when `afl3d.ready()` and passes the sport key; the 2D pitch remains the fallback when Three.js is unavailable.

---

## v2.1.0-beta — AFL oval is now a real 3D model

- 🏉 **True 3D AFL ground** built with Three.js (WebGL). Drag to rotate, pinch to zoom, tap a player exactly like before. The oval, goal posts, centre square, centre circles and 50m arcs all render in real 3D space.
- 🎥 **Three locked camera presets** — **Behind** the goals (default), **Side** on, and **Top** down. One tap each; the active preset is highlighted until you drag away.
- 🔒 **Lock toggle** (🔓/🔒) freezes the camera so you can't nudge it mid-game.
- 🧩 Players are HTML pills projected over the 3D canvas, so they stay upright, readable and tappable at any angle. The pitch lives in its own isolated zone — no clipping over the rest of the UI.

### Architecture notes
- New `afl3d` object owns a `THREE.WebGLRenderer` + `OrbitControls` (rotate/zoom, `enablePan:false`, damping, `minDistance 130`/`maxDistance 520`, polar clamp `0.04–1.46`). `buildGround()` draws the oval (filled `ShapeGeometry` ellipse + boundary `LineLoop`), centre square 50×50, centre circles r5/r1.5, 50m arcs, goal squares and 4 standing posts per end. `worldOf(px,py,h)` maps formation %→world (`FIELD_W 135 × FIELD_L 165`). `projectPills()` runs each rAF frame: `worldOf(...).project(camera)` → overlay `left/top`. `setView(name)` hard-resets the orbit frame (`camera.up=(0,1,0)` + `lookAt`) so presets never end up rotated; the `top` preset is nudged off the exact zenith (`z=55`) to keep the length axis vertical (no gimbal flip). `controls 'start'` clears the preset highlight. `afl3d.update(container, buildPill)` re-inits if the canvas was wiped and resizes the renderer to the settled zone each `renderG`. Falls back to the 2D AFL views (`v2.0.4–2.0.9`) when Three.js is unavailable.
- `renderRoster` routes AFL teams to the 3D viewer when `afl3d.ready()`; `renderG` hides the old 2D view/tilt controls (`#aflViewBtn`/`#aflTiltCtrl`) when 3D is active.

---

## v2.0.5-beta — AFL scoring (goals & behinds)

- 🏉 **Proper AFL scoring** — the score header is sport-aware. AFL teams get separate **GOAL (6)** and **BEHIND (1)** buttons per side; score shows the footy way **goals.behinds (total)** — e.g. `5.3 (33)`. **−** undoes the last score. Goals fire the scorer + assist picker; behinds don't. Match log + full-time summary distinguish goals from behinds. Soccer/netball keep the simple −/＋ tally.

### Architecture notes
- `G.glUs/bhUs/glThem/bhThem` track goals/behinds; `G.scoreUs/scoreThem` stay point totals (cloud save/history unchanged). `renderScore()` renders the score area per-sport from `renderG`. `aflScore(who,type)` logs `{type:'goal', afl:'goal'|'behind'}`; `aflUndo(who)` reverses the last.

---

## v2.0.4-beta — AFL isometric oval + tidy-ups

- 🏉 AFL oval shown in **portrait isometric** (foreshortened tilted-ground look, cabinet projection — no egg), 18 players spaced cleanly with no overlap, smaller AFL tokens.
- 🔢 Period call-out (Q1 / 1ST HALF / HALFTIME) moved to the **left of the score**.
- 🧹 **Opponent-shape overlay removed** (parked until it's properly tested/useful).
- ⏸️ Youngest AFL grades (Auskick/U9/U10) default to **subs-at-breaks**; toggle hint is now sport-aware.

### Architecture notes
- `.lu-pitch.np-afl` aspect `135/118` (length foreshortened ≈ ×0.72) does the uniform cabinet squash; `aflProject` identity, top-down SVG, %-tokens squash with the box. AFL formations portrait (length=y). Opp-marker block + `#oppFmtLbl`/`#oppFmtPicker` removed.

---

## v2.0.3-beta — Subs at breaks only (netball rule)

Requested by a netball coach: many netball comps only allow substitutions at the quarter/half breaks, not rolling mid-play.

- ⏸️ **"Subs at breaks only"** toggle in Edit Team → Game Settings. When on, there are **no rolling mid-play subs** — the game screen shows "Subs at quarter break" instead of a countdown, and the recommended rotation is applied when you tap Start (next period). **Default ON for netball**, off for soccer/AFL.
- The manual **SUB** and **Injury** buttons still work mid-play (for injuries etc.) — only the automatic prompts are suppressed.
- The squad-screen equal-time helper adapts: in breaks-only mode it says "rotate at each break for fair time" instead of suggesting an interval.

### Architecture notes
- `team.prefs.breaksOnly` (seeded `true` for netball in `getTeamPrefs`), loaded into `cfg.breaksOnly` in `selectTeam`. Toggle rendered in `renderEditTeamPrefs()`.
- `tickLoop` skips the auto-sub trigger and the clock warn/alert colouring when `cfg.breaksOnly`. `renderG()` shows a "Subs at the break" line. Break rotation is handled by the existing `advH()` (applies the recommended swap at the period boundary for fair/paired).

---

## v2.0.2-beta — Equal game-time helper

Inspired by the grassroots rule of thumb ("divide the total game time by the number of players and sub that often" — Just Play's substitutions guide).

- ⚖️ **Equal game-time suggestion** on the squad screen — once you've marked who's here, it calculates the sub interval that shares minutes evenly across the squad that turned up, and shows it with a one-tap **"USE"** button. Recalculates live as you toggle availability.
- ⏱️ **Projected minutes per player** ("~X min each over Y min") so a coach can see the fair-play split before kickoff.

### Architecture notes
- `renderEqualTimeHint(n, onField)` in `renderS1()`: `totalGame = cfg.hm × periodCount`; `suggested = round(totalGame × cfg.sc / n)` (matches the guide's example: 6 players, 36 min → 6 min); `perPlayer = round(onField × totalGame / n)`. Shown only when `n > onField` (i.e. there are subs). `applyEqualTime(i)` sets `cfg.sf` for this match (per-game, not a saved team pref). Confirms with a ✓ once the interval matches.

---

## v2.0.1-beta — Sample squad + AFL isometric pitch

- 👥 **Fill a sample squad** — a button in the team editor drops in a generic roster sized to the format (on-field + ~30% bench) with names, jersey numbers and a spread of position tags, so a brand-new team can start a game and try the app immediately. Won't overwrite real players (tops up to a playable count); names a still-unnamed team automatically.
- 🏉 **AFL oval is now isometric** — rendered as a foreshortened (tilted-back) ground rather than flat top-down, matching the cabinet-projection look from the design prototype. Achieved by foreshortening the oval's box vertically (`.lu-pitch.np-afl` aspect 135/140 ≈ 165 m length × sin 58°) — a uniform squash (no "egg"); markings and %-positioned tokens foreshorten together while shirts stay upright.

### Architecture notes
- `fillSampleSquad()` + `SAMPLE_NAMES`; button `#sampleSquadBtn` under the photo-import in the team editor. Appends unique generic players (with `numbers` + cycled non-GK `positions`) up to `onField + round(onField*0.3)`.
- AFL pitch kept top-down in `aflPitchSvg()`; the isometric foreshortening is the box aspect-ratio (135/140) so tokens (positioned by %) and SVG markings (preserveAspectRatio=none) squash uniformly — same visual result as the prototype's cabinet projection, far simpler than baking the tilt into every coordinate.

---

## v2.0-beta — AFL mode

Australian Rules Football is now a third sport, alongside Soccer and Netball. Shipped but unannounced.

- 🏉 **AFL sport** — pick it from New Team. Age formats from **Auskick → Senior** (Auskick 6, U9–U10 12, U11–U12 15, U13+ & Senior 18 a-side).
- 🟢 **Oval pitch** — proper Aussie-rules oval with centre square, centre circles, **50m arcs**, goal squares and goal/behind posts. Rendered top-down with the real 135×165 m field proportions (adapted from the cabinet-projection geometry — no "egg"). No GK.
- 🕐 **4 quarters** reuse the netball period engine, with the new **inline break** showing Quarter / Half / Three-Quarter Time.
- ♻️ Everything else is sport-agnostic and works as-is: sub strategies, set-line-up-on-the-pitch, injury subs, undo, team-level Game Settings, jersey numbers, cloud sync, match history.
- 🏐 Custom **Sherrin** ball icon for the sport picker / team cards.

### Architecture notes
- `SPORTS.afl` (periodCount 4, quarter labels, simplified position tags, `formats`). `FORMATS['afl-*']` (10 presets, `hasGk:false`). `FORMATIONS` gets shared 6/12/15/18-player oval layouts (`AFL_F6/F12/F15/F18`).
- `aflPitchSvg()` builds the oval + markings in a 100×100 viewBox (TILT=90 → identity projection, portrait/`DEPTH_AXIS='x'`); `.lu-pitch.np-afl` carries the 135/165 aspect so the unit circle displays as a correct oval and metre-squares stay square.
- `renderRoster()` branches: `_topDown = netball || afl` → tokens use raw x/y% (no `pitchPt` perspective, no plane), skips the dims read. `adjustY()` returns identity for AFL. Formation button hidden for AFL (single formation per format).
- **Known gaps (follow-ups):** scoring is still a single counter (no goals/behinds split yet); senior 75-rotation cap not implemented; only the default formation per age format. See `AFL-MODE-SPEC.md` §7–8.

---

## v1.11.3-beta — Formation button

- 🧩 **Formation moved into the bottom control bar** — it's now a button showing the current shape (e.g. "2-3-1") next to START / SUB, big and easy to hit. Tapping opens the formation picker just above the bar. Removed the small formation pill from the chrome row. Hidden for netball (fixed positions).

### Architecture notes
- New `#gdFormation` button in `#gameDash` (→ `toggleGameFormation()`); `renderGameDash()` paints it with `curFormation` + a `layout-grid` icon and an `active` state while the picker is open. `#gameFmtPicker` relocated to just above the control bar. `renderG()` no longer touches `#fmtLbl`/`#fmtVs` (removed from the chrome row).

---

## v1.11.2-beta — 2nd-half line-up ready

- 🔄 **Line-up ready at the break** — when the period ends, the recommended rotation is applied automatically so the pitch already shows your **2nd-half starting line-up**. Tap **Start 2nd Half** and go.
- ✋ Tweak it during the break with **Swap**, or **Undo** to revert the auto-rotation.
- Applies to **Equal time** and **Paired rotation** (the auto-rotating strategies). **Manual** and **Full control** leave the break subs entirely to the coach.

### Architecture notes
- `advH()` calls `trigSub()` then `confSub()` for `fair`/`paired` when the bench is non-empty, applying one recommended rotation before showing the break state. The sub is `G.lastSub` (undoable during the break); `startNextPeriod()` then clears it at the boundary as before.

---

## v1.11.1-beta — Inline halftime

- ⏸️ **No more halftime popup** — at the end of a period the game screen itself switches to a break state: the period label reads **HALF TIME** (or QUARTER/THREE-QUARTER TIME for netball), the clock goes amber, and the primary button becomes **Start 2nd Half** (one tap to begin).
- 🔁 **Prep during the break** — swap or sub right on the pitch before starting the next period; changes carry into the new half.
- 🥅 **Keeper at the break** is just a normal Swap (tap the GK) — the separate halftime keeper picker is gone.

### Architecture notes
- `advH()` now sets `G.atBreak=true` + re-renders (was: populate + show `#htOv`). `renderG()` has a break branch (clock label, amber clock, "Start 2nd Half" button, hint in `#nsi`). `startNextPeriod()` logs `period_end`, increments `G.half`, resets, clears `atBreak` and starts the clock. `tog()` delegates to it when `G.atBreak`.
- Removed the `#htOv` overlay and `confHT()` / `renderHtMsg()` / `updateHtGk()`. No automatic halftime GK swap — keeper continues unless swapped on the pitch. (`gk2` still exists for the optional per-game options screen + the Full-control plan simulation.)

---

## v1.11-beta — Straight to the pitch

The pre-game flow used to be: squad → a big settings screen → game. Most of those settings rarely change, so they're now **team-level preferences** and the settings screen is no longer a required step.

- ⚡ **Faster start** — tap **Start** → pick who's here → **Start Game** drops you straight onto the pitch, using the team's saved settings.
- 🎛️ **Game Settings live on the team** — formation, sub strategy, half/quarter length, sub interval and players-per-sub are now edited under **Edit Team → Game Settings** and remembered for every game.
- 🗓️ **Per-game override** — a **"Game options for today"** link on the squad screen still opens the full settings screen (incl. the Full-control game plan / photo import) when you need to change something just for one match.
- ✏️ **Mid-game** — the dashboard **Edit Team** button (was "Edit Players") opens the same editor, so you can adjust settings without leaving the game.

### Architecture notes
- `team.prefs = { formation, subStrategy, hm, sf, sc }`, lazily seeded from the format defaults via `getTeamPrefs(team)`. Rendered/edited by `renderEditTeamPrefs()` in the team editor; persisted with the team via `saveAndBack()` (localStorage + cloud).
- `selectTeam()` loads `team.prefs` into the live `cfg` + `curFormation` (falling back to `FORMATS[fmt]` defaults), so the fast path needs no settings screen.
- New `startFromSquad()` (squad screen primary button) sets `avail` and calls `quickStart()` → `smartAssign()` → `startGame()`. `goSettings()` (s2) kept intact as the optional per-game override.
- `planned` strategy with no plan still falls back to Equal-time logic at runtime; use "Game options for today" to build/snap a plan for a specific match.

---

## v1.10.3-beta — Settings page

- ⚙️ **Settings page** — added a gear button (top-right of the home header) that opens an app **Settings** overlay. The **sub-alert sound** picker now lives here instead of as a pill on the game screen, since it's an app-level preference you set once, not something to change mid-game.
- 🧹 One less pill in the in-game chrome row.

### Architecture notes
- Removed `#soundPackLbl` from `#fmtRow` (`renderSoundPicker()` already guards `if(lbl)` so the missing element is fine). Repurposed the `#soundOv` overlay into a titled "Settings" page with a "Sub-alert sound" section. `openSettings()` (home gear) → `openSoundPicker()` renders the grid and shows the overlay.

---

## v1.10.2-beta — Tidier game screen

- 🧩 **One combined chrome row** — the formation, opponent, sub-strategy and sound pills now sit in the **same row as the tap-tip**, in a single band just above the bench (`#modeHint` is now an inline tinted chip inside `#fmtRow`).
- ⬆️ **Pills cleared off the top** — the top of the screen is now just the score + clock + "next sub", so the pitch gets more vertical room. Formation pickers open below the pill row, above the bench.
- ✂️ **Shorter tap-tip** — "Tap two to swap (incl. keeper)".

### Architecture notes
- `#fmtRow` (+ `#gameFmtPicker` / `#oppFmtPicker`) moved from below the clock to between `#pitchMid` and `#benchTop`. `#modeHint` is now a `<span>` child of `#fmtRow`; `renderRoster()` writes the tip into it as an inline chip (was a full-width banner). Render order still populates bench + hint before reading pitch dims.

---

## v1.10.1-beta — Assists + bench placement

- 🅰️ **Assists on goals** — tagging a goal is now a two-step picker: who scored, then who assisted (or "No assist"). The assist list is **on-field players only** (a benched player can't set up a goal) with the scorer excluded; the step is skipped automatically if no one else is on the field. Assists show in both the live timeline and the saved match-history log (`X scored · assist Y`).
- 🪑 **Bench moved above the control bar** — the subs-coming-on strip now sits just above the bottom buttons instead of at the very top, so it no longer overlaps the pitch / forward line. Game-screen order is now: header → clock → formation → **pitch** → mode hint → **bench** → sub banner → bottom bar.

### Architecture notes
- Goal picker: `_goalStep` ('scorer'|'assist') + `_goalScorer` drive `renderGoalPicker()`, which repaints the shared `#scorerOv` grid per step. `chooseScorer()` records `log[idx].scorer` then advances to the assist step; `chooseAssist()` records `log[idx].assist`. `skipGoalStep()`/`closeGoalPicker()` reset state. `skipScorer()` kept as a back-compat alias.
- Both log renderers append `· assist <name>` when `e.assist` is set on a `who==='us'` goal.
- `#benchTop` relocated in the DOM below `#pitchMid`/`#modeHint`. `renderRoster()` still populates bench + hint before reading the pitch dimensions (they remain flex-shrink:0 siblings), so token projection is unaffected.

---

## v1.10-beta — Thumb-zone game screen

A layout overhaul for two-handed iPad use: controls drop to the thumb zone, the subs-coming-on move up top.

- 🎮 **All controls in one bottom bar** — `START · SUB · Swap · Injury · Edit Players · Undo` in a single row at the bottom of the game screen, where thumbs naturally rest. START + SUB are colour-emphasised (green / amber) and slightly wider so the primary actions stand out from the soft-UI secondary buttons.
- ⬆️ **Subs coming on moved to the top** — the bench (next-on / wave grid) now sits above the pitch so the players coming on are glanceable at the top of the screen.
- ⚽ **Pitch fills the middle** — flexes to whatever vertical space is left between the top strip and the bottom bar; aspect-correct in both portrait and landscape, no clipping.
- 🧹 **Removed the duplicate Undo** — the in-bench "UNDO LAST SUB" pill is gone; Undo now lives only in the bottom bar.

### Architecture notes
- Game screen (`#s4`) is now: header (score) → clock → formation row → `#benchTop` (flex-shrink:0, subs at top) → `#pitchMid` (flex:1, pitch) → `#modeHint` → `#subBanner` → `#gameDash` (bottom bar). The `gameDash` id is kept so `renderGameDash()` still resolves.
- `renderRoster()` reordered: it populates `#benchTop` (via the extracted `renderBenchInto(container, swapMap, posForPlayer)`) and `#modeHint` **before** appending the pitch and reading `pitch.clientWidth/Height` — so the flex pitch height is final when `pitchPt()` projects the tokens (avoids stale-dimension mis-placement).
- Bottom-bar buttons share `.gd-btn` (stacked icon+label, `min-height:56px`). Primary variants `.gd-go` (START), `.gd-pause` (running), `.gd-sub` (SUB) add colour + `flex:1.5`. `renderG()` swaps ppB between `gd-go`/`gd-pause`; `renderGameDash()` paints the SUB label once.
- Bottom bar uses `padding-bottom: calc(8px + env(safe-area-inset-bottom))` to clear the iPad home indicator.

---

## v1.9.2-beta — Edit button + clearer sub mode

- ✏️ **Edit** added to the in-game dashboard — opens the player positions / preferences editor and returns straight to the live game (`editTeamFromGame()` + `_editingFromGame`). Removed the duplicate "Edit" chip from the formation row so there's a single, discoverable Swap / Injury / Edit / Undo bar.
- 🔁 **Sub strategy mode shown clearly** — the game screen chip now reads **"SUBS · Equal time / Paired / Manual / Full control"** with the strategy's own colour + icon and a faint tinted fill. Tap it to change. Added the missing **Full control** (`planned`) case to the badge map so every strategy renders.

### Architecture notes
- `renderGameDash()` now also paints `#gdEdit` (pencil icon, "Edit" label) — it's an action button, never carries the active-mode highlight since it navigates away rather than arming a tap-mode.
- `subStratLbl` badge in `renderG()`: `stratMap` extended with `planned → {clipboard, 'Full control', #a78bfa}`; chip gains a "SUBS" prefix label and a `color+'1a'` background tint for prominence.

---

## v1.9.1-beta — In-game control dashboard

- 🎛️ **Action dashboard** under the timer — **Swap / Injury / Undo** in one persistent control bar, instead of hidden tap-gestures.
- ↔️ **Swap** — tap two players to exchange positions. Sets the starting line-up before kickoff and reshuffles mid-game. **Tap the keeper** in a swap to change who's in goal (role transfers automatically) — no separate keeper button needed.
- 🚑 **Injury** — tap the injured player, the bench lights up, tap exactly who comes on (no longer forced to the front of the queue). "Out for game" option preserved.
- ↩️ **Undo** surfaced as a dashboard button (disabled when there's nothing to revert).
- ✨ **Subtle soft-UI pass** — consistent corner radii, soft drop shadows + faint top highlight, gentle gradients and tactile press states across buttons, chips and cards. Reads premium without heavy neumorphism.

### Architecture notes
- `gameMode` ('swap' | 'keeper' | 'injury') drives what tapping a player does; `setGameMode()` toggles it (tapping the active mode returns to the safe Swap default).
- `tapFieldPlayer()` branches on mode; `tapBenchForInjury()` completes the injury flow with the chosen replacement; `makeKeeper()` reuses `swapFieldPositions()` for the role transfer.
- `injurySub(pIdx, replacementIdx)` now takes an optional chosen replacement, defaulting to `bench[0]`.
- Soft-UI tokens: `--r-btn/--r-chip/--r-sm` radii, `--sh-raise/--sh-raise-lg/--sh-press` shadows. Applied to `.btn*`, `.chip*`, `.card`, `.gd-btn`.

---

## v1.9-beta — 3D pitch + jersey pills

- 🎯 **Soccer pitch in 3D perspective** — bottom-pivoted 45° tilt with depth foreshortening (broadcast-cam feel). Near edge anchors the layout so the far end tapers inward without clipping.
- 👕 **Jersey-shirt player pills** — each player is an outlined shirt (light fill) with their number ON the shirt; position chip + name on a pill below. GK shirt is **pink** (distinct from amber "about to sub").
- ✋ **Set the line-up on the pitch** — before kickoff, tap two players to swap their starting positions. Works for outfield players and the GK (role transfers). After kickoff, tapping a player is an injury sub as before.
- 🪑 **Bench as a wave grid** — Next on / +5′ / +10′ columns (sized off sub interval × players-per-sub). Auto-fits more columns for big benches (AFL-ready).
- ↩️ **Undo Last Sub** surfaced in the bench header — instantly reverts a mistaken swap.
- ✏️ **Heavier line work** + removed the distracting centre/penalty dots.
- 📐 FIFA-correct dimensions preserved — penalty area 40.32×16.5m, goal area 18.32×5.5m, centre circle r=9.15m, penalty spot 11m, corner arc r=1m, goal mouth 7.32m.

### Architecture notes
- `.pitch-flex` (flex:1) holds `.lu-pitch` absolutely-centred (`inset:0; margin:auto; aspect-ratio:105/80; max-width/height:100%`) — fits the largest aspect-correct box in the available space, no scroll.
- `.lu-plane` is the tilted ground (`rotateX(45deg)`, `transform-origin:50% 100%`, `height:240%`) containing the SVG; calibrated so the perspective-projected plane fills the container.
- `pitchPt(px, py)` mirrors the CSS bottom-pivot + perspective matrix in JS; falls back to identity (raw px/py) if `_pitchDims` is unset OR has zero width/height — guarantees tokens never disappear on first paint.
- `tapFieldPlayer()` branches on `G.secs===0 && !G.running` → position swap, else injury sub. `swapFieldPositions()` swaps slots in `G.on`, transfers the GK role, and keeps paired-rotation groups consistent.
- Netball stays top-down (existing CSS-based markings); identity fallback in `pitchPt` when `_pitchDims` is null.

---

## v1.8-beta — Full Control mode + Game Plan view

- 📋 **New "Full control" sub strategy** — coach plans every sub before kickoff
- 🪄 **Auto-suggested plan** using Equal-time fairness — coach starts with a sensible default rather than a blank slate
- ✏️ **Tap any swap to override** — modal picks alternate off/on players from those on field / bench at that moment
- 📷 **Snap a photo of your handwritten plan** — `extract-roster` edge function extended with a `plan` mode that returns structured `{start, events, gk}` JSON. Fuzzy-matches handwritten names to the roster.
- 🧠 **Strategy descriptions lead with the coach archetype** — stance lines ("I just want everyone to play", "Keep my pairs together", "I'll call them as I see them", "I plan every sub before kickoff") above the algorithm description
- ⚙️ At runtime, `trigSub` honours the plan's off/on for the current half + time; falls back to Equal-time logic when no planned event matches (e.g. mid-cycle manual SUB)
- ☁️ Plan is copied from `cfg.subPlan` to `G.subPlan` at game start and snapshotted with the active-game save
- 📷 **Roster photo import now also captures position labels + jersey numbers** — handwritten "Lucy D" / "Maya CD" / "Tilly M" type entries auto-tag the player on save. C-prefix maps to `side='B'`; L/R prefix maps to side. Falls back to name-only if no labels are visible.
- 🔤 New `translateRosterPosition()` helper handles the abbreviations: D/CD/LB/RB/CB → DEF, M/CM/LM/RM → MID, W/LW/RW/WNG → WNG, S/F/FW/ST/FWD → FWD, GK → GK

### Architecture notes
- `generateAutoPlan()` simulates whole-game timeline minute-by-minute crediting minutes, picking highest-min on-field to come off and lowest-min benched to come on at each scheduled sub time
- Edge function `extract-roster` accepts `mode: 'plan'` with optional `roster` hint for name matching; `high` image detail used in plan mode for handwriting recognition
- Plan stale flag (`cfg.subPlanStale`) triggers regeneration when Sub Strategy or interval settings change

---

## v1.7-beta — Jersey numbers

- 🔢 **Per-player jersey number** — small input on each row in the team editor (all sports)
- 🔢 **Displayed on pitch cards + bench rows** at runtime so coaches can call players by number
- 🔢 **Optional** — leave blank for kids without fixed jerseys, no impact
- ☁ New `numbers` JSONB column on cloud `teams` table; merge logic preserves the richer side, same pattern as positions / sides / foots
- 📝 Rename + delete handlers migrate the numbers key alongside everything else

---

## v1.6-beta — Player side + foot preferences

- 🦶 **Per-player side preference** (L / R / Both) — captured in the team editor for soccer teams
- 🦶 **Per-player dominant foot** (L / R / Both) — a right-footer often prefers playing left to cut inside, so we keep these as separate fields
- 🆕 Open any existing team's editor to fill these in — defaults are "Both" so old teams aren't broken
- 🏐 Soccer only — netball positions are fixed by rule, no side concept
- ☁ New `sides` + `foots` JSONB columns on the cloud `teams` table; merge logic preserves the richer side
- 📝 Rename + delete handlers migrate side/foot keys alongside positions

---

## v1.5-beta — Sync hardening + smarter score handling

- 🛡 **Position tags no longer get wiped when syncing across devices** — the cloud merge now preserves whichever side has data
- 🛡 **Players added offline are preserved** on sync — the longer list wins
- 🎯 **Sub strategy + GK settings** are correctly preserved across sync
- ✓ **Tap −1 on the score** to correct a fat-finger goal — match log stays clean (no phantom goals)
- 🏐 **Sport-aware text** on Settings — netball shows "quarters", soccer shows "halves"
- 🏐 **Legacy netball teams** now correctly identified by format (no more soccer ball icon on netball cards)
- 🏷 **Version tag** visible next to the BETA pill (header + landing hero)
- 📐 "Next sub at" time on the game screen — slightly bigger so it's easier to glance
- ✨ **What's New modal** introduced — you're looking at it

---

## v1.4-beta — Undo + reorder + futsal

- ↶ **Undo Last Sub** — instantly reverts a swap, restoring players, minutes, and the match log
- ↕ **Bench reorder chevrons** — promote or demote players in the sub queue (Manual + Equal-time modes)
- ⏱ **Sub strategy chooser moved to Settings** — pick Equal-time, Paired rotation, or Manual before kickoff, not as a post-Start popup
- 🔄 **Paired rotation now balances minutes** — the pair with the most game time goes off, keeping groups together AND minutes fair
- 🕐 **Whole-game continuous sub schedule** — sub cadence flows continuously across both halves rather than restarting each period
- 🥅 **Custom soccer ball icon** with proper pentagon-centre geometry
- 🏐 **Custom netball icon** with proper volleyball-style seam pattern
- ⚽ **Futsal 5v5 format** — 4 outfield + 1 GK, 2-minute hockey-style line rotations, 1-2-1 diamond default
- ☀ **Summer 6v6 format** — 5 outfield + 1 GK, classic 2-2-1 default
- 🎨 **Lucide icon library** replaces all emoji throughout the app
- 🏠 **Tighter home screen** — Start/Edit buttons on every team card, side-by-side New Team + Match History row, floating logo banished
- 🏃 **11v11 default half = 45 minutes** (was 30)

---

## v1.3-beta — Beta release + feedback channel

- 🆕 **BETA badge** + version tag in the header
- 💬 **In-app feedback** channel — writes to a Supabase `feedback` table
- 💡 **Home tips carousel** — feature reminders for returning users
- 🎯 **Tactical tips** per formation
- ☕ **Buy Me a Coffee** tip jar (home + match summary)
- 📲 **PWA home-screen icons** (PNG)
- ⚽ **Scorer picker** when you tag a goal for your team
- 🔔 **Sound-pack picker** — 6 alert sounds (Classic, Whistle, Air Horn, Bell, Retro, Silent)
- ☁ **Match history cloud sync** with sync-state indicator
- 📐 **Sticky header fix** — no more "hanging heading" mid-page
- 📐 **iPad scaling** — app widens to 560/640px on larger screens
- 📋 **Scannable formation pills** with short descriptors

---

## v1.2-beta — Multi-sport core (Netball)

- 🏐 **Netball** added as a second sport (Set, GO, Junior, Open formats)
- 🏐 **Netball court** rendered with thirds + semicircular goal circles
- ⏱ **Quarter Length** / "Minutes per quarter" labels for netball
- 🌅 **Animated 2-3-1 dot logo** — represents subs flowing on/off
- 🆕 **New-user signup hardened** against Supabase duplicate-email race
- ✕ **Abandon-game** button on the game screen
- 🌗 **Light mode** added, then removed (contrast issues)

---

## v1.1-beta — Auth + sync + position tags

- 🔐 **Magic-link sign-in** via Supabase + Resend SMTP
- ☁ **Teams sync** across devices via Supabase Postgres
- 🎯 **Position tags** per player (GK/DEF/MID/WNG/FWD)
- 📷 **AI roster import** via photo (OpenAI gpt-4o-mini vision)
- ⚽ **Same-first-name** disambiguation with last-name initial

---

## v1.0-beta — First public version

- ⏱ Live game clock with sub alerts at scheduled times
- 🔄 Paired-rotation substitution model
- 📊 Per-player playing-time tracking
- 🏃 Manual SUB button + automatic prompts
- 🥅 Goalkeeper choice (1H + 2H)
- 📝 Match log with subs / goals / period boundaries
- 💾 Match history with score, opponent, location

---

## How to update this file

Append a new section at the top when bumping `APP_VERSION` in `sub-timer.html`. Mirror the change list into `CHANGELOG_DATA` near the top of the JS so the in-app **What's New** modal shows the same entries when users open the app on the new version.
