# Sub Timer — UI Map (factual, auto-generated)

> Generated from `index.html` by `test/uimap.mjs`. Regenerate with
> `node test/uimap.mjs --runtime`. This is the "what the app
> actually wires up" layer; intended journeys live in `docs/UX-PATHWAYS.md`.
>
> App version: **v2.9.42-beta** · 0 static + 119 JS-rendered controls · runtime-verified 9 screens.

## Screen flow (`showScr` targets)

- `home` — Home (8 routes in)
- `s4` — Live game (7 routes in)
- `s1` — Squad select (4 routes in)
- `sportPicker` — Sport picker (2 routes in)
- `editTeam` — Team editor (2 routes in)
- `gkStep` (2 routes in)
- `shapeStep` (2 routes in)
- `s3` — Lineup + GK (2 routes in)
- `s5` — Summary (2 routes in)
- `s6` — Match history (2 routes in)
- `teamSettings` — Team settings (1 route in)
- `gradePicker` — Format / grade picker (1 route in)
- `s2` — Settings (1 route in)
- `subOrderOv` (1 route in)

## A. Static controls (in markup — reliably placed)

## B. JS-rendered controls (grouped by render function — screen approximate)

These are emitted by `innerHTML` templates; a static parse can't say which
screen shows them. See §C for the runtime-verified placement.

- **`(unknown)()`** → `addPlayerField`, `adj`, `aflTiltAdj`, `applyBulkTag`, `changeSubStrategy`, `closeAnnounce`, `closeAnyDrawer`, `closeAppSettings`, `closeBugReport`, `closeBulkTag`, `closeGameMenu`, `closeGkPick`, `closePlanMenu`, `closeShareTeam`, `closeSoundPicker`, `closeSubSettings`, `closeTeamActions`, `closeTeamCodeEntry`, `closeWhatsNew`, `confSub`, `copyTeamShareLink`, `cycleView`, `deleteTeam`, `devFlowLoad`, `devFlowPlay`, `devFlowStep`, `devJump`, `devSeedGame`, `devSkipToBreak`, `devSkipToFullTime`, `discardActiveGame`, `dismissTip`, `endPeriodNow`, `exportGameFlow`, `fillSampleSquad`, `gkStepNext`, `hideRelay`, `importWelcomeClose`, `importWelcomePlay`, `newTeam`, `nextTip`, `openFeedback`, `openGkPick`, `pickSubStrategy`, `prevTip`, `quickStart`, `resumeActiveGame`, `saveAndBack`, `saveMatch`, `sendBugReport`, `sendFeedback`, `sendMagicLink`, `setDevMode`, `shapeStepBack`, `shapeStepNext`, `shareTeamNative`, `showScr`, `skipGoalStep`, `soAdj`, `ssAdj`, `startFromSquad`, `subOrderApply`, `submitTeamCode`, `teamActionEdit`, `teamActionPastGames`, `teamActionPlanAhead`, `teamActionShare`, `tog`, `toggleAflView`, `toggleBenchView`, `toggleDevPanel`, `toggleGameFormation`, `toggleGameMenu`, `toggleGlobalMenu`, `toggleHomeMenu`, `togglePlanMenu`, `undoLastSub`
- **`renderMatchDetail()`** → `histEditCancel`, `histEditSave`, `histEditStart`, `histToggleScorer`, `openBugReport`, `showHistory`
- **`renderPlanRosterOverview()`** → `planAddStarter`, `planAutoFillStarters`, `planClearField`, `planFinishStarters`, `planRemoveStarter`
- **`renderEditTeam()`** → `cleanupPlayerNames`, `openBulkTag`, `removePlayerField`
- **`renderScore()`** → `adjScore`, `aflScore`, `aflUndo`
- **`renderPlanProfiles()`** → `applyPlanProfile`, `deletePlanProfile`, `renamePlanProfile`
- **`renderHome()`** → `newTeam`, `openTeamCodeEntry`
- **`renderSquadPlanPicker()`** → `pickSquadPlan`, `planAheadFromSquad`
- **`showSum()`** → `saveMatch`, `showScr`
- **`renderPlanControlBand()`** → `planScrubLive`, `planScrubStep`
- **`renderAuthChip()`** → `signOutCloud`
- **`renderFlowList()`** → `exportGameFlow`
- **`renderViewSwitcher()`** → `switchToView`
- **`renderEqualTimeHint()`** → `applyEqualTime`
- **`openPlanSwapEditor()`** → `closePlanEdit`
- **`renderG()`** → `openAnnounce`
- **`injurySub()`** → `confInjury`
- **`renderSumLog()`** → `promptScorer`
- **`renderSsStratGrid()`** → `ssSetStrat`
- **`renderPlanFormationChips()`** → `setPlanFormation`
- **`renderSubOrderTabs()`** → `subOrderPick`
- **`renderPlanClockAnchor()`** → `planClkAdj`
- **`openDrawer()`** → `closeAnyDrawer`
- **`renderSubOrder()`** → `planScrubJump`

## C. Runtime-verified controls per screen (ground truth)

Booted the app, navigated to each screen, recorded the controls actually
visible/clickable. This corrects §A/§B guesses.

### Home `home` — 6 visible

- `add()`
- `closeAnyDrawer()`
- `home()`
- `newTeam()`
- `openTeamCodeEntry()`
- `toggleGlobalMenu()`

### Sport picker `sportPicker` — 4 visible

- `closeAnyDrawer()`
- `home()`
- `showScr()`
- `toggleGlobalMenu()`

### Team editor `editTeam` — 10 visible

- `addPlayerField()`
- `click()`
- `closeAnyDrawer()`
- `fillSampleSquad()`
- `home()`
- `openBulkTag()`
- `removePlayerField()`
- `saveAndBack()`
- `switchToView()`
- `toggleGlobalMenu()`

### Squad select `s1` — 6 visible

- `closeAnyDrawer()`
- `home()`
- `planAheadFromSquad()`
- `startFromSquad()`
- `switchToView()`
- `toggleGlobalMenu()`

### Team settings `teamSettings` — 4 visible

- `closeAnyDrawer()`
- `home()`
- `switchToView()`
- `toggleGlobalMenu()`

### Live game `s4` — 5 visible

- `closeAnyDrawer()`
- `gkStepNext()`
- `home()`
- `showScr()`
- `toggleGlobalMenu()`

### Plan page `subOrderOv` — 13 visible

- `closeAnyDrawer()`
- `closePlanMenu()`
- `home()`
- `planClearField()`
- `planClkAdj()`
- `planScrubJump()`
- `planScrubLive()`
- `planScrubStep()`
- `setPlanFormation()`
- `soAdj()`
- `subOrderPick()`
- `switchToView()`
- `toggleGlobalMenu()`

### Summary `s5` — 6 visible

- `closeAnyDrawer()`
- `home()`
- `saveMatch()`
- `showScr()`
- `switchToView()`
- `toggleGlobalMenu()`

### Match history `s6` — 5 visible

- `closeAnyDrawer()`
- `home()`
- `showScr()`
- `switchToView()`
- `toggleGlobalMenu()`


---
_Static attribution is heuristic; §C (runtime) is authoritative. Regenerate after UI changes._
