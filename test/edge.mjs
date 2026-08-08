#!/usr/bin/env node
// ===========================================================================
// Sub Timer — edge-case & use-case suite
// ---------------------------------------------------------------------------
// Beyond the happy-path smoke and the per-format sports matrix, this exercises
// the messier real-world journeys a coach hits on the sideline:
//   • Save / resume — close the app mid-game and reopen (the #1 reliability
//     risk): saveActiveGame → page reload → resumeActiveGame restores clock,
//     score, line-up; discardActiveGame clears it.
//   • In-game interactions — manual sub, injury sub (back-to-bench vs out-for-
//     game), sub-strategy switching, undo.
//   • Team management & settings — delete team, add/remove players, live
//     mid-match settings changes (half length / sub frequency).
//   • Boundary conditions — exactly-onField squad (no bench), live player
//     removal (no-show) with index remap, reset-half restore.
// Covers keeper and non-keeper sports. Run with `npm run edge`.
// ===========================================================================
import { runSuite, bootstrap, gameState, bodyText } from './harness.mjs';

const SCENARIOS = [
  // ---- Save / resume -----------------------------------------------------
  ['save + resume restores a mid-game state', async (page, { chk, shot }) => {
    await bootstrap(page, { format: '7v7', name: 'Resume FC' });
    const saved = await page.evaluate(() => {
      if (!G.running) tog();
      // advance the clock, score, and make a sub so there's real state to restore
      G.secs = 8 * 60; G.elapsedMs = G.secs * 1000;
      adjScore('us', 1); adjScore('them', 1);
      if (G.bench.length) { trigSub(); if (G.ps) confSub(); }
      saveActiveGame();
      return { half: G.half, secs: G.secs, on: [...G.on], gk: G.gk, scoreUs: G.scoreUs, scoreThem: G.scoreThem, hasSnapshot: !!loadActiveGame() };
    });
    chk('active game written to storage', saved.hasSnapshot);
    // Reload the page (simulates closing/reopening the app) and resume.
    await page.reload({ waitUntil: 'load' });
    await page.waitForFunction(() => typeof resumeActiveGame === 'function', { timeout: 10000 });
    const resumed = await page.evaluate(() => {
      const ok = resumeActiveGame();
      return { ok, half: G && G.half, secs: G && G.secs, on: G ? [...G.on] : null, gk: G ? G.gk : null, scoreUs: G && G.scoreUs, scoreThem: G && G.scoreThem };
    });
    chk('resumeActiveGame returns true', resumed.ok === true);
    chk('clock restored', resumed.secs === saved.secs && resumed.half === saved.half);
    chk('score restored', resumed.scoreUs === saved.scoreUs && resumed.scoreThem === saved.scoreThem);
    chk('line-up + keeper restored', JSON.stringify(resumed.on) === JSON.stringify(saved.on) && resumed.gk === saved.gk);
    chk('no NaN after resume', !/\bNaN\b/.test(await bodyText(page)));
    await shot(page, 'resumed');
  }],

  ['discard clears the saved game', async (page, { chk }) => {
    const res = await page.evaluate(() => {
      const had = !!loadActiveGame();
      discardActiveGame();
      return { had, after: !!loadActiveGame() };
    });
    chk('a saved game existed', res.had);
    chk('discardActiveGame clears storage', res.after === false);
  }],

  // Regression (v2.8.1): an in-progress game must be saved when the app is
  // backgrounded or closed — not only on the 5s checkpoint. On a phone, the OS
  // can evict a backgrounded tab; without this, everything since the last
  // checkpoint was lost ("the game didn't save"). visibilitychange(hidden) and
  // pagehide both persist the live state (clock + score) immediately.
  ['backgrounding the app saves the in-progress game', async (page, { chk }) => {
    await bootstrap(page, { format: '7v7', name: 'BG FC' });
    const r = await page.evaluate(() => {
      if (!G.running) tog();
      // distinctive state that has NOT hit a checkpoint or explicit save
      localStorage.removeItem('subTimerActive');
      G.secs = 437; G.elapsedMs = 437000; G.scoreUs = 3;
      const before = loadActiveGame();
      // simulate app-switch / screen-lock
      Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
      document.dispatchEvent(new Event('visibilitychange'));
      const onHide = loadActiveGame();
      // simulate close / reload
      localStorage.removeItem('subTimerActive');
      window.dispatchEvent(new Event('pagehide'));
      const onPagehide = loadActiveGame();
      return {
        noneBefore: before === null,
        savedOnHide: !!onHide, clock: onHide && onHide.G.secs, score: onHide && onHide.G.scoreUs,
        savedOnPagehide: !!onPagehide,
      };
    });
    chk('un-checkpointed state would have been lost', r.noneBefore);
    chk('backgrounding (hidden) saves the game', r.savedOnHide);
    chk('saved snapshot preserves the live clock + score', r.clock === 437 && r.score === 3);
    chk('pagehide (close/reload) also saves', r.savedOnPagehide);
  }],

  // ---- In-game interactions ---------------------------------------------
  ['manual sub + undo', async (page, { chk, shot }) => {
    await bootstrap(page, { format: '9v9', name: 'Manual FC' });
    const r = await page.evaluate(() => {
      if (!G.running) tog();
      const before = [...G.on];
      manualSub(); if (G.ps) confSub();
      const after = [...G.on];
      undoLastSub();
      return { before, after, undone: [...G.on], hadBench: true };
    });
    chk('manual sub changed the line-up', JSON.stringify(r.before) !== JSON.stringify(r.after));
    chk('undo restored the line-up', JSON.stringify(r.undone) === JSON.stringify(r.before));
    await shot(page, 'manual-sub');
  }],

  ['injury sub: back-to-bench vs out-for-game', async (page, { chk }) => {
    await bootstrap(page, { format: '7v7', name: 'Injury FC' });
    // Minor knock — player returns to the bench queue.
    const minor = await page.evaluate(() => {
      if (!G.running) tog();
      const off = G.on.find(i => i !== G.gk);
      const benchBefore = G.bench.length;
      injurySub(off); confInjury(false);
      return { off, onField: G.on.length, offOnBench: G.bench.includes(off), benchBefore, benchAfter: G.bench.length };
    });
    chk('injury(minor): field size preserved', minor.onField === 7);
    chk('injury(minor): knocked player back on bench', minor.offOnBench);

    // Serious — player is out for the game (removed from rotation, not benched).
    const serious = await page.evaluate(() => {
      const off = G.on.find(i => i !== G.gk);
      injurySub(off); confInjury(true);
      const inRotation = (G.pairs || []).some(p => p.on.includes(off));
      return { off, onField: G.on.length, offOnBench: G.bench.includes(off), inRotation };
    });
    chk('injury(out): field size preserved', serious.onField === 7);
    chk('injury(out): player removed from rotation', !serious.inRotation);
    chk('injury(out): player not on bench', !serious.offOnBench);
  }],

  ['sub strategy switching is recorded', async (page, { chk }) => {
    await bootstrap(page, { format: '7v7', name: 'Strat FC' });
    const r = await page.evaluate(() => {
      if (!G.running) tog();
      const out = {};
      ['auto', 'planned', 'paired', 'fair'].forEach(s => {
        ssSetStrat(s);
        out[s] = G.subStrategy;
      });
      const logged = G.log.filter(e => e.type === 'sub_strategy').length;
      return { out, logged };
    });
    chk('strategy changes apply to G.subStrategy', !!r.out.fair && !!r.out.paired);
    chk('strategy changes are logged', r.logged >= 4);
  }],

  // ---- Settings ----------------------------------------------------------
  ['live settings: half length + sub frequency clamp', async (page, { chk }) => {
    await bootstrap(page, { format: '7v7', name: 'Settings FC' });
    const r = await page.evaluate(() => {
      if (!G.running) tog();
      const hm0 = cfg.hm, sf0 = cfg.sf;
      ssAdj('hm', 5); const hmUp = cfg.hm;
      ssAdj('sf', 2); const sfUp = cfg.sf;
      // drive below the floor — must clamp at 1
      for (let i = 0; i < 50; i++) { ssAdj('hm', -1); ssAdj('sf', -1); }
      return { hm0, sf0, hmUp, sfUp, hmFloor: cfg.hm, sfFloor: cfg.sf };
    });
    chk('half length increases', r.hmUp === r.hm0 + 5);
    chk('sub frequency increases', r.sfUp === r.sf0 + 2);
    chk('half length clamps at >=1', r.hmFloor >= 1);
    chk('sub frequency clamps at >=1', r.sfFloor >= 1);
  }],

  // Regression (v2.8.2): the live sub schedule must MATCH what the Plan page +
  // preview show — subs restart each period (sf, 2·sf, …), not run on a
  // continuous whole-game timeline. With a frequency that doesn't divide evenly
  // into the period (7-min subs, 20-min half) the 2nd half used to drift to
  // 1′/8′/15′; it must now be 7′/14′ in every period, equal to the plan.
  ['sub timing matches the plan (per-period cadence, odd frequency)', async (page, { chk }) => {
    await bootstrap(page, { format: '7v7', name: 'Cadence FC' });
    const r = await page.evaluate(() => {
      // clean slate so prior scenarios don't bleed state into the schedule
      if (G.raf) { try { cancelAnimationFrame(G.raf); } catch (e) {} G.raf = null; }
      G.running = false; G.sd = [];
      cfg.hm = 20; cfg.sf = 7;            // odd frequency: doesn't divide evenly
      // Plan-page projection FIRST (from kickoff), so its half-1 events aren't
      // marked "past" by a clock we advanced for the subTs reads.
      G.half = 1; G.secs = 0;
      G.subStrategy = 'fair'; _planTimeline = null; buildPlanTimeline();
      const ev = _planTimeline.events.filter((e) => !e.past);
      const planH1 = ev.filter((e) => e.period === 1).map((e) => Math.round(e.time / 60));
      const planH2 = ev.filter((e) => e.period === 2).map((e) => Math.round(e.time / 60));
      // live engine per period (schedule depends only on cfg now, not the clock)
      G.half = 1; G.secs = 0; const h1 = subTs().map((s) => s / 60);
      G.half = 2; G.secs = 0; const h2 = subTs().map((s) => s / 60);
      return { h1, h2, planH1, planH2 };
    });
    chk('half 1 fires at 7′, 14′', JSON.stringify(r.h1) === JSON.stringify([7, 14]), `(${r.h1})`);
    chk('half 2 restarts (7′, 14′ — no drift)', JSON.stringify(r.h2) === JSON.stringify([7, 14]), `(${r.h2})`);
    chk('live engine matches the Plan page (half 1)', JSON.stringify(r.h1) === JSON.stringify(r.planH1));
    chk('live engine matches the Plan page (half 2)', JSON.stringify(r.h2) === JSON.stringify(r.planH2));
  }],

  // ---- Saved plans (build once, reuse, tweak on game day) ----------------
  // Coverage for the workflow: build a custom plan → save it → start a fresh
  // game using it → modify it on game day. Crucially, live edits must NOT
  // corrupt the saved plan (they share luOrd/pairs shapes).
  ['saved plan: build → save → reuse → modify on game day', async (page, { chk }) => {
    const r = await page.evaluate(() => {
      localStorage.clear(); teams = loadTeams(); if (typeof G !== 'undefined' && G) { G.running = false; if (G.raf) { try { cancelAnimationFrame(G.raf); } catch (e) {} } G = null; }
      // stub prompt() so saveCurrentPlanPrompt gets a name (headless prompt
      // returns null otherwise, which makes the save a no-op).
      window.prompt = () => 'Strong XI';
      newTeam(); pickSport('soccer'); pickFormat('7v7', 'soccer'); fillSampleSquad();
      document.getElementById('teamNameInput').value = 'Plan FC'; saveAndBack();
      selectTeam(teams[teams.length - 1].id); startFromSquad(); switchToView('plan');
      // build a distinctive plan: a non-default keeper
      planClearField();
      const n = FORMATS[curFmt].onField; while (G.on.length < n && G.bench.length) planAddStarter(G.bench[0]);
      setPlanKeeper(G.on.find((i) => i !== G.gk)); planFinishStarters();
      const planKeeper = avail[G.gk];
      saveCurrentPlanPrompt();
      const saved = (currentTeam.plans || []).length === 1;
      const planId = currentTeam.plans[currentTeam.plans.length - 1].id;
      // start a FRESH game applying the saved plan
      _squadPickedPlanId = planId; startFromSquad();
      const appliedKeeper = avail[G.gk];
      // modify on game day: change keeper, then re-pick the XI
      switchToView('plan');
      setPlanKeeper(G.on.find((i) => i !== G.gk));
      const modKeeper = avail[G.gk];
      planClearField();
      while (G.on.length < FORMATS[curFmt].onField && G.bench.length) planAddStarter(G.bench[0]);
      planFinishStarters();
      const pt = computeProjectedMinutes();
      return {
        saved,
        applyRestoredKeeper: appliedKeeper === planKeeper,
        modifyTookEffect: modKeeper !== appliedKeeper,
        fieldFull: G.on.length === FORMATS[curFmt].onField,
        keeperOnField: G.on.includes(G.gk),
        minutesCompute: Object.values(pt).some((v) => v > 0),
        savedPlanIntact: !!(currentTeam.plans[0].luOrd && currentTeam.plans[0].luOrd.length),
      };
    });
    chk('plan saved to the team', r.saved);
    chk('reusing the plan restores its keeper', r.applyRestoredKeeper);
    chk('game-day modification takes effect', r.modifyTookEffect);
    chk('modified game stays valid (field full, keeper on)', r.fieldFull && r.keeperOnField);
    chk('projected minutes still compute after modify', r.minutesCompute);
    chk('live edits do NOT corrupt the saved plan', r.savedPlanIntact);
  }],

  // Regression (v2.8.4): "Save plan profile" must be reachable in AUTO mode, not
  // only Custom — a coach can build a custom line-up + keeper in Auto, so there's
  // always something worth saving. It used to be force-hidden in Auto (buried).
  // The Edit-Lineup item stays Custom-only.
  ['save-plan is available in Auto mode (not buried in Custom)', async (page, { chk }) => {
    const r = await page.evaluate(() => {
      localStorage.clear(); teams = loadTeams(); if (typeof G !== 'undefined' && G) { G.running = false; if (G.raf) { try { cancelAnimationFrame(G.raf); } catch (e) {} } G = null; }
      newTeam(); pickSport('soccer'); pickFormat('7v7', 'soccer'); fillSampleSquad();
      document.getElementById('teamNameInput').value = 'Auto FC'; saveAndBack();
      selectTeam(teams[teams.length - 1].id); startFromSquad(); switchToView('plan');
      if (typeof ssSetStrat === 'function') ssSetStrat('auto');   // default mode
      if (typeof renderSubOrder === 'function') renderSubOrder();
      const menu = document.getElementById('planMenu');
      const vis = (el) => { let n = el; while (n && n !== menu) { if (getComputedStyle(n).display === 'none') return false; n = n.parentElement; } return !!el; };
      const saveBtn = document.getElementById('subOrderSaveBtn');
      const lineupBtn = document.getElementById('subOrderLineupBtn');
      const grp = document.getElementById('planMenuCustomGroup');
      return {
        saveShown: vis(saveBtn),
        saveOutsideCustomGroup: saveBtn && !grp.contains(saveBtn),
        lineupHidden: !vis(lineupBtn),  // Edit Lineup still Custom-only
        strat: G.subStrategy,
      };
    });
    chk('Save plan button is shown in Auto mode', r.saveShown);
    chk('Save plan is outside the Custom-only group', r.saveOutsideCustomGroup);
    chk('Edit Lineup stays Custom-only (hidden in Auto)', r.lineupHidden);
  }],

  // ---- Team management ---------------------------------------------------
  ['delete team removes it from the list', async (page, { chk }) => {
    const r = await page.evaluate(() => {
      localStorage.clear(); teams = loadTeams();
      // make two teams
      newTeam(); pickSport('soccer'); pickFormat('7v7', 'soccer'); fillSampleSquad();
      document.getElementById('teamNameInput').value = 'Keep FC'; saveAndBack();
      newTeam(); pickSport('netball'); pickFormat('nb-go', 'netball'); fillSampleSquad();
      document.getElementById('teamNameInput').value = 'Delete NC'; saveAndBack();
      const before = teams.length;
      const victim = teams.find(t => t.name === 'Delete NC');
      // deleteTeam() operates on editingTeam (the editor's working copy), which
      // the UI sets by opening the team editor — mirror that here.
      editingTeam = victim;
      deleteTeam();
      return { before, after: teams.length, stillThere: teams.some(t => t.name === 'Delete NC'), keepThere: teams.some(t => t.name === 'Keep FC') };
    });
    chk('two teams created', r.before === 2);
    chk('deleteTeam removed one', r.after === 1);
    chk('correct team deleted', r.stillThere === false && r.keepThere === true);
  }],

  ['team editor: add and remove players', async (page, { chk }) => {
    const r = await page.evaluate(() => {
      newTeam(); pickSport('soccer'); pickFormat('7v7', 'soccer'); fillSampleSquad();
      const base = editingTeam.players.length;
      addPlayerField(); addPlayerField();
      const added = editingTeam.players.length;
      removePlayerField(editingTeam.players.length - 1);
      const removed = editingTeam.players.length;
      return { base, added, removed };
    });
    chk('add player grows the squad', r.added === r.base + 2);
    chk('remove player shrinks the squad', r.removed === r.added - 1);
  }],

  // ---- Boundary conditions ----------------------------------------------
  ['exactly-onField squad: no bench, sub is a no-op, no NaN', async (page, { chk, shot }) => {
    await bootstrap(page, { format: '7v7', name: 'Thin FC', squad: 7 });
    const r = await page.evaluate(() => {
      const onField = FORMATS[curFmt].onField;
      if (!G.running) tog();
      const before = [...G.on];
      // No bench → trigSub / manualSub must not change or crash anything.
      trigSub(); if (G.ps) confSub();
      manualSub();
      return { onField, avail: avail.length, benchLen: G.bench.length, before, after: [...G.on] };
    });
    chk('squad equals onField (no bench)', r.avail === r.onField && r.benchLen === 0);
    chk('sub with empty bench is a no-op', JSON.stringify(r.before) === JSON.stringify(r.after));
    chk('no NaN with a thin squad', !/\bNaN\b/.test(await bodyText(page)));
    await shot(page, 'thin-squad');
  }],

  ['live player removal (no-show) remaps indices safely', async (page, { chk, shot }) => {
    await bootstrap(page, { format: '9v9', name: 'NoShow FC' });
    const r = await page.evaluate(() => {
      if (!G.running) tog();
      const onField = FORMATS[curFmt].onField;
      const availBefore = avail.length;
      // remove an on-field, non-keeper player mid-game
      const victim = G.on.find(i => i !== G.gk);
      const victimName = avail[victim];
      liveRemovePlayer(victim);
      return {
        onField, availBefore, availAfter: avail.length,
        victimGone: !avail.includes(victimName),
        onLen: G.on.length, benchLen: G.bench.length,
        gkValid: G.gk == null || (G.gk >= 0 && G.gk < avail.length),
        onValid: G.on.every(i => i >= 0 && i < avail.length),
      };
    });
    chk('roster shrank by one', r.availAfter === r.availBefore - 1);
    chk('removed player is gone from the roster', r.victimGone);
    chk('field refilled toward onField', r.onLen === Math.min(r.onField, r.onLen + r.benchLen));
    chk('all on-field indices remain valid', r.onValid);
    chk('keeper index remains valid', r.gkValid);
    chk('no NaN after live removal', !/\bNaN\b/.test(await bodyText(page)));
    await shot(page, 'live-removal');
  }],

  ['reset half restores the kickoff line-up', async (page, { chk }) => {
    await bootstrap(page, { format: '7v7', name: 'Reset FC' });
    const r = await page.evaluate(() => {
      const kickoff = [...G.on];
      if (!G.running) tog();
      G.secs = 6 * 60; G.elapsedMs = G.secs * 1000;
      if (G.bench.length) { trigSub(); if (G.ps) confSub(); }
      const changed = [...G.on];
      // resetHalf needs the clock stopped; it's a two-tap (arm, then confirm).
      G.running = false;
      resetHalf(); resetHalf();
      return { kickoff, changed, afterReset: [...G.on], secs: G.secs };
    });
    chk('a sub changed the line-up first', JSON.stringify(r.kickoff) !== JSON.stringify(r.changed));
    chk('reset restores the kickoff XI', JSON.stringify(r.afterReset) === JSON.stringify(r.kickoff));
    chk('reset returns the clock to 0', r.secs === 0);
  }],

  // ---- Team share link (v2.8.5) -------------------------------------------
  ['team share link imports the team on a fresh device', async (page, { chk, shot }) => {
    await bootstrap(page, { format: '7v7', name: 'Dragonflies U8' });
    const shared = await page.evaluate(() => {
      const t = teams[teams.length - 1];
      // give the payload something real to round-trip beyond names
      t.numbers = { [t.players[0]]: '7' };
      t.prefs = Object.assign(t.prefs || {}, { hm: 22 });
      saveTeams(teams);
      return { code: buildTeamShareCode(t), players: t.players.length, sid: String(t.id) };
    });
    chk('code carries the ST1. prefix', /^ST1\./.test(shared.code));
    // Fresh device: wipe storage, then open the app via the share link.
    await page.evaluate((c) => { localStorage.clear(); location.hash = '#team=' + c; }, shared.code);
    await page.reload({ waitUntil: 'load' });
    await page.waitForFunction(() => typeof teams !== 'undefined' && Array.isArray(teams), { timeout: 10000 });
    const r = await page.evaluate(() => ({
      count: teams.length,
      name: teams[0] && teams[0].name,
      players: teams[0] ? teams[0].players.length : 0,
      number: teams[0] && teams[0].numbers ? teams[0].numbers[teams[0].players[0]] : null,
      hm: teams[0] && teams[0].prefs ? teams[0].prefs.hm : null,
      welcome: document.getElementById('teamImportOv').classList.contains('show'),
      hashCleared: !location.href.includes('team='),
    }));
    chk('team imported on the fresh device', r.count === 1 && r.name === 'Dragonflies U8');
    chk('full roster carried across', r.players === shared.players);
    chk('jersey number + game settings carried across', r.number === '7' && r.hm === 22);
    chk('welcome overlay offers Play now', r.welcome);
    chk('share code stripped from the URL', r.hashCleared);
    await shot(page, 'share-imported');
    // Play now → squad picker for the imported team.
    const play = await page.evaluate(() => {
      importWelcomePlay();
      return { onS1: document.getElementById('s1').classList.contains('active'), team: currentTeam && currentTeam.name };
    });
    chk('Play now lands on the squad picker', play.onS1 && play.team === 'Dragonflies U8');
    // Re-importing the same code must refresh in place, not duplicate.
    const dedup = await page.evaluate((c) => { importSharedTeam(parseTeamShareCode(c)); return teams.length; }, shared.code);
    chk('re-importing the same code does not duplicate', dedup === 1);
  }],

  // Found by the fairness hunt (seed 20260817), fixed in v2.9.5: paired
  // rotation compared pairs by minute SUM, so the leftover odd pair (7
  // outfielders in groups of 3 → [3,3,1]) could never outweigh a full triple
  // and its occupant played the entire game — 96 of 100 minutes. Pairs now
  // compare per-member AVERAGES. Same round: an out-for-game injury dropped
  // the victim from their pair without seating the replacement, making the
  // replacement invisible to rotation.
  ['paired rotation: the leftover odd pair still rotates', async (page, { chk }) => {
    const r = await page.evaluate(() => {
      const stop = () => { if (G && G.raf) { try { cancelAnimationFrame(G.raf); } catch (e) {} G.raf = null; } if (G) { G.running = false; G.lastTs = null; G.elapsedMs = G.secs * 1000; } };
      G = null; localStorage.clear(); teams = loadTeams();
      newTeam(); pickSport('netball'); pickFormat('nb-go', 'netball');
      editingTeam.players = Array.from({ length: 12 }, (_, i) => 'P' + (i + 1));
      editingTeam.numbers = {}; editingTeam.positions = {};
      document.getElementById('teamNameInput').value = 'Odd pair';
      saveAndBack(); selectTeam(teams[teams.length - 1].id);
      cfg.subStrategy = 'paired'; cfg.hm = 25; cfg.sf = 4; cfg.sc = 3; cfg.breaksOnly = false;
      startFromSquad(); stop();
      G.subStrategy = 'paired';
      const singleton = (G.pairs || []).find((p) => p.on.length === 1);
      let guard = 0;
      while (guard++ < 40000) {
        G.running = true; const ended = tickSecond(); stop();
        if (G.atBreak) { startNextPeriod(); stop(); continue; }
        if (ended && G.half >= 4) break;
      }
      const total = 4 * 25 * 60;
      const maxPt = Math.max(...avail.map((n) => G.pt[n] || 0));
      const offs = {};
      (G.log || []).filter((e) => e.type === 'sub').forEach((e) => { offs[e.off] = (offs[e.off] || 0) + 1; });
      const neverOff = avail.filter((n) => !offs[n]);
      return { hadSingleton: !!singleton, total, maxPt, neverOff };
    });
    chk('the group split produced a leftover odd pair', r.hadSingleton);
    chk('nobody plays essentially the whole game', r.maxPt <= r.total - 2 * 4 * 60,
      `max ${Math.round(r.maxPt / 60)}m of ${Math.round(r.total / 60)}m`);
    chk('every player is subbed off at least once', r.neverOff.length === 0, r.neverOff.join(', '));
  }],

  ['injury out-for-game: the replacement takes the pair seat', async (page, { chk }) => {
    const r = await page.evaluate(() => {
      const stop = () => { if (G && G.raf) { try { cancelAnimationFrame(G.raf); } catch (e) {} G.raf = null; } if (G) { G.running = false; G.lastTs = null; } };
      G = null; localStorage.clear(); teams = loadTeams();
      newTeam(); pickSport('soccer'); pickFormat('7v7', 'soccer'); fillSampleSquad();
      document.getElementById('teamNameInput').value = 'Pair seat';
      saveAndBack(); selectTeam(teams[teams.length - 1].id);
      cfg.subStrategy = 'paired';
      startFromSquad(); stop();
      G.subStrategy = 'paired';
      const victim = (G.pairs[0] && G.pairs[0].on[0]);
      const sizeBefore = G.pairs[0].on.length;
      const replacement = G.bench[0];
      injurySub(victim, replacement);
      confInjury(true);   // out for the game
      return {
        sizeBefore, sizeAfter: G.pairs[0].on.length,
        replacementSeated: G.pairs.some((p) => p.on.includes(replacement)),
        victimGone: !G.pairs.some((p) => p.on.includes(victim)),
      };
    });
    chk('the pair keeps its size', r.sizeAfter === r.sizeBefore, `${r.sizeBefore} → ${r.sizeAfter}`);
    chk('the replacement is seated in the pair', r.replacementSeated);
    chk('the injured player is out of every pair', r.victimGone);
  }],

  // P7 — Account & cloud sync. This pathway had no invariants at all, and a
  // real bug was living in it: sign-in was reachable ONLY from the landing
  // hero, which renders when `teams.length===0 && !cloudUser`. The moment a
  // coach saved a team it vanished, and there was no way back to it — the
  // #authChip container was never in the markup so renderAuthChip() no-op'd,
  // nothing opened #appSettingsOv, and the drawer's Sign in item (promised in
  // a v2.7.85 comment) was never added. Cloud sync was unreachable for every
  // existing user. Shipped on main for ~40 versions.
  ['sign-in stays reachable once a team exists', async (page, { chk, shot }) => {
    const routes = () => page.evaluate(() => {
      const visible = (e) => e && e.offsetParent !== null;
      const found = [...document.querySelectorAll('button,[onclick]')].filter((e) => {
        const oc = (e.getAttribute('onclick') || '') + (e.onclick ? e.onclick.toString() : '');
        return /authOv|signOutCloud/.test(oc);
      }).filter(visible);
      return { n: found.length, labels: found.map((e) => (e.innerText || '').trim().slice(0, 40)) };
    });

    await page.evaluate(() => {
      G = null; localStorage.clear(); teams = loadTeams();
      document.querySelectorAll('.ov.show').forEach((o) => o.classList.remove('show'));
      renderHome(); showScr('home');
    });
    await page.waitForTimeout(300);
    const landing = await routes();
    chk('landing offers sign-in', landing.n >= 1, landing.labels.join(' / '));

    // Save a team — the state the bug hid in.
    await page.evaluate(() => {
      newTeam(); pickSport('soccer'); pickFormat('7v7', 'soccer'); fillSampleSquad();
      document.getElementById('teamNameInput').value = 'Auth reach';
      saveAndBack();
      document.querySelectorAll('.ov.show').forEach((o) => o.classList.remove('show'));
      showScr('home');
    });
    await page.waitForTimeout(300);

    await page.evaluate(() => toggleGlobalMenu());
    await page.waitForTimeout(500);
    const drawer = await routes();
    chk('sign-in reachable from the menu with a team saved', drawer.n >= 1, drawer.labels.join(' / '));
    chk('and it is labelled for what it does', /sign in/i.test(drawer.labels.join(' ')), drawer.labels.join(' / '));
    await shot(page, 'auth-in-drawer');
    await page.evaluate(() => closeAnyDrawer());
  }],

  // v2.9.7 — the timing confirm strip. Timing is seasonal (per-team prefs);
  // matchday glances a one-line summary pre-kickoff instead of walking a
  // settings screen. The strip must vanish once the game is genuinely
  // underway — it is setup chrome, not game chrome.
  ['timing confirm strip — pre-kickoff glance, gone once underway', async (page, { chk }) => {
    await bootstrap(page);
    const strip = () => page.evaluate(() => {
      const el = document.getElementById('timingStrip');
      return { shown: !!el && el.style.display !== 'none', text: document.getElementById('timingStripTxt').textContent, hm: cfg.hm, sf: cfg.sf, sc: cfg.sc };
    });
    const pre = await strip();
    chk('timing strip shown pre-kickoff', pre.shown, pre.text);
    chk('strip carries the seasonal values', pre.text.includes(`${pre.hm}′`) && pre.text.includes(`${pre.sf}′`) && pre.text.includes(`${pre.sc} per sub`), pre.text);

    // Change opens the on-demand settings screen; Apply returns to the game.
    await page.evaluate(() => openMatchSettings());
    await page.waitForTimeout(200);
    const onS2 = await page.evaluate(() => document.getElementById('s2').classList.contains('active'));
    chk('Change opens settings on demand', onS2);
    await page.evaluate(() => quickStart());
    await page.waitForTimeout(200);
    const back = await strip();
    const onS4 = await page.evaluate(() => document.getElementById('s4').classList.contains('active'));
    chk('Apply returns to the pre-kickoff review', onS4 && back.shown, back.text);

    // Underway (time has accrued, paused): the strip must be gone.
    await page.evaluate(() => { G.elapsedMs = 5000; G.secs = 5; renderG(); });
    const mid = await strip();
    chk('timing strip hidden once underway', !mid.shown);
  }],

  // v2.9.8 — the announce view: the line-up as read to the huddle. Every
  // starter carries a position, the keeper is marked, the bench is listed;
  // at a break the title names the period about to be played.
  ['announce view — the huddle script, pre-kickoff and at the break', async (page, { chk }) => {
    await bootstrap(page);
    const open = () => page.evaluate(() => {
      openAnnounce();
      const body = document.getElementById('announceBody').innerText;
      const title = document.getElementById('announceTitle').textContent;
      const shown = document.getElementById('announceOv').classList.contains('show');
      closeAnnounce();
      return { title, body, shown, starters: G.on.map((p) => avail[p]), benchNames: G.bench.map((p) => avail[p]), gkName: G.gk !== null ? avail[G.gk] : null };
    });
    const pre = await open();
    chk('announce view opens pre-kickoff', pre.shown, pre.title);
    const fieldLines = pre.body.split('STARTING ON THE BENCH')[0];
    chk('announce lists every starter with a position', pre.starters.every((n) => fieldLines.includes(n)), `${pre.starters.length} starters`);
    chk('announce marks the keeper', pre.gkName === null || fieldLines.includes('(keeper)'), pre.gkName || 'no-GK format');
    chk('announce lists the bench', pre.benchNames.every((n) => pre.body.includes(n)), pre.benchNames.join(', '));

    // Reach the break and announce again — the title must name the NEXT period.
    await page.evaluate(() => { G.secs = cfg.hm * 60; advH(); });
    await page.waitForTimeout(300);
    const brk = await open();
    chk('break announce titles the upcoming period', /2nd-half|Period 2/i.test(brk.title), brk.title);
  }],

  // v2.9.9 — the relay card: the moment a sub fires, the screen scripts the
  // shout (who on, for whom, at which position). Undo withdraws the shout;
  // break auto-rotation is silent (the announce view owns breaks).
  ['relay card — the shout script at every sub', async (page, { chk }) => {
    await bootstrap(page);
    const fired = await page.evaluate(() => {
      trigSub(); // auto-applies via confSub
      const el = document.getElementById('relayCard');
      const last = G.lastSub;
      return {
        shown: el.style.display !== 'none',
        text: el.innerText,
        onName: avail[last.on[0]],
        offName: avail[last.off[0]],
        pos: posLabelFor(last.on[0]),
      };
    });
    chk('relay card scripts the shout', fired.shown && fired.text.includes(fired.onName) && fired.text.includes(fired.offName), fired.text.replace(/\n/g, ' · '));
    chk('relay names the position', !fired.pos || fired.text.includes(fired.pos), fired.pos || 'no slot label');
    const undone = await page.evaluate(() => { undoLastSub(); return document.getElementById('relayCard').style.display === 'none'; });
    chk('undo dismisses the relay', undone);
    // Break rotation must NOT raise the card.
    const atBreak = await page.evaluate(() => {
      G.secs = cfg.hm * 60; advH();
      return { atBreak: G.atBreak, relayShown: document.getElementById('relayCard').style.display !== 'none' };
    });
    chk('break rotation skips the relay', atBreak.atBreak && !atBreak.relayShown);
  }],
];

runSuite({ title: 'Sub Timer edge cases', slug: 'edge', scenarios: SCENARIOS })
  .then(({ code }) => process.exit(code))
  .catch((e) => { console.error('FATAL', e.stack || e); process.exit(2); });
