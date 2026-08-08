#!/usr/bin/env node
// ===========================================================================
// Sub Timer — second-half setup suite
// ---------------------------------------------------------------------------
// Guards the period boundary: who takes the field for the second half, who is
// in goal, and what the Plan page tells the coach while they set it up.
//
// Both defects this locks down were live in v2.8.6 and reported from a real
// match ("issue with player setup in the second half"):
//
//   A. The "2nd Half GK" setting was never wired to anything. It was stored,
//      persisted, and rendered on the Plan page as "HALFTIME GK SWAP", but
//      nothing ever assigned it to G.gk — so the first-half keeper played the
//      whole match. It also auto-defaults to a DIFFERENT player than the
//      first-half keeper, so every keeper-format game silently displayed a
//      halftime keeper change that never happened. Fixed in v2.8.7, and only
//      an explicit pick fires the swap (see gk2Explicit).
//
//   B. At a period break, G.half is still the period that just FINISHED —
//      startNextPeriod() is what increments it. The Plan page simulated from
//      G.half, so it regenerated the finished half's sub slots as upcoming:
//      scrubbing forward at half-time previewed sub points that had already
//      happened, and the whole second-half projection ran from a line-up that
//      never existed. Fixed in v2.8.7.
//
//   node test/secondhalf.mjs
// ===========================================================================
import { runSuite } from './harness.mjs';

// Build a game and drive it to the first break, through the real pre-game
// screens so the GK dropdowns populate and default exactly as a coach sees.
// `pickGk2` is the index to choose in the "2nd Half GK" control, or null to
// leave it untouched (the case that must NOT swap).
const setup = (page, { format, sport, pickGk2 = null, strategy = 'fair', breaksOnly = false }) =>
  page.evaluate(({ format, sport, pickGk2, strategy, breaksOnly }) => {
    const stop = () => {
      if (!window.G) return;
      if (G.raf) { try { cancelAnimationFrame(G.raf); } catch (e) {} G.raf = null; }
      G.running = false; G.lastTs = null;
    };
    if (typeof G !== 'undefined' && G) stop();
    G = null; localStorage.clear(); teams = loadTeams();
    newTeam(); pickSport(sport); pickFormat(format, sport); fillSampleSquad();
    document.getElementById('teamNameInput').value = '2H ' + format;
    saveAndBack(); selectTeam(teams[teams.length - 1].id);

    // Squad → Settings → Lineup, the way the coach walks it.
    renderS1();
    sel = new Set(currentTeam.players.map((_, i) => i));
    avail = [...sel].map((i) => currentTeam.players[i]);
    setDisplayNameList(avail);
    goSettings();
    goLineup();
    const defaulted = { gk1, gk2, gk2Explicit };

    if (pickGk2 !== null) {
      const el = document.getElementById('gk2SettingSel');
      el.value = String(pickGk2);
      el.dispatchEvent(new Event('change'));
    }
    cfg.subStrategy = strategy;
    cfg.breaksOnly = !!breaksOnly;

    // What does the Plan page promise the coach before kickoff?
    const promised = (generateAutoPlan().events || []).filter((e) => e.type === 'gk_swap').length;

    startGame(); stop();
    if (strategy) G.subStrategy = strategy;
    const gkAtKickoff = G.gk;

    let guard = 0;
    while (G && !G.atBreak && guard++ < 20000) { G.running = true; const e = tickSecond(); stop(); if (e) break; }
    return { defaulted, promised, gkAtKickoff, atBreak: !!G.atBreak, gkAtBreak: G.gk };
  }, { format, sport, pickGk2, strategy, breaksOnly });

const startSecondHalf = (page) => page.evaluate(() => {
  startNextPeriod();
  if (G.raf) { try { cancelAnimationFrame(G.raf); } catch (e) {} G.raf = null; }
  G.running = false; G.lastTs = null;
  return {
    half: G.half, gk: G.gk, gkName: avail[G.gk],
    on: [...G.on], bench: [...G.bench],
    gkOnField: G.on.includes(G.gk),
    gkInAnyPair: (G.pairs || []).some((p) => (p.on || []).includes(G.gk)),
    squadOk: G.on.length + G.bench.length === avail.length,
    noDupes: new Set(G.on).size === G.on.length,
  };
});

const scenarios = [
  // ---- A. the "2nd Half GK" setting ----------------------------------------
  ['2nd-half keeper: an explicit pick takes the gloves at half-time', async (page, t) => {
    for (const format of ['7v7', '11v11']) {
      const pre = await setup(page, { format, sport: 'soccer', pickGk2: 3 });
      t.chk(`${format}: reaches the break`, pre.atBreak);
      t.chk(`${format}: first-half keeper is unchanged at the break`, pre.gkAtBreak === pre.gkAtKickoff);
      t.chk(`${format}: an explicit pick is promised on the Plan page`, pre.promised === 1);
      const h2 = await startSecondHalf(page);
      t.chk(`${format}: the chosen player is in goal for the 2nd half`, h2.gk === 3, `gk=${h2.gk} expected 3`);
      t.chk(`${format}: the new keeper is on the field`, h2.gkOnField);
      t.chk(`${format}: the new keeper is out of the outfield rotation`, !h2.gkInAnyPair);
      t.chk(`${format}: squad still conserved`, h2.squadOk);
      t.chk(`${format}: no duplicate on the pitch`, h2.noDupes);
    }
    await t.shot(page, 'explicit-gk2');
  }],

  ['2nd-half keeper: an UNTOUCHED setting must not swap anyone', async (page, t) => {
    // The regression that made this urgent: gk2 auto-defaults to a different
    // player than gk1, so honouring the default would silently start changing
    // keepers at half-time in every existing game.
    for (const format of ['7v7', '11v11']) {
      const pre = await setup(page, { format, sport: 'soccer', pickGk2: null });
      t.chk(`${format}: gk2 auto-defaults away from gk1`, pre.defaulted.gk2 !== pre.defaulted.gk1,
        `gk1=${pre.defaulted.gk1} gk2=${pre.defaulted.gk2}`);
      t.chk(`${format}: the default is not marked as an explicit pick`, pre.defaulted.gk2Explicit === false);
      t.chk(`${format}: no halftime swap promised on the Plan page`, pre.promised === 0);
      const h2 = await startSecondHalf(page);
      t.chk(`${format}: the keeper is unchanged in the 2nd half`, h2.gk === pre.gkAtKickoff,
        `gk=${h2.gk} expected ${pre.gkAtKickoff}`);
      t.chk(`${format}: keeper still on the field`, h2.gkOnField);
      t.chk(`${format}: squad still conserved`, h2.squadOk);
    }
    await t.shot(page, 'default-gk2');
  }],

  ['2nd-half keeper: a benched pick is brought on, displacing the old keeper', async (page, t) => {
    await setup(page, { format: '7v7', sport: 'soccer', pickGk2: null });
    const r = await page.evaluate(() => {
      // Choose a keeper who is currently on the BENCH.
      const benched = G.bench[0];
      const el = document.getElementById('gk2SettingSel');
      el.value = String(benched); el.dispatchEvent(new Event('change'));
      const oldGk = G.gk;
      startNextPeriod();
      if (G.raf) { try { cancelAnimationFrame(G.raf); } catch (e) {} G.raf = null; }
      G.running = false;
      return {
        benched, oldGk, gk: G.gk,
        newKeeperOnField: G.on.includes(benched),
        oldKeeperBenched: G.bench.includes(oldGk),
        squadOk: G.on.length + G.bench.length === avail.length,
        noDupes: new Set(G.on).size === G.on.length,
        onLen: G.on.length, onField: FORMATS[curFmt].onField,
        gkInAnyPair: (G.pairs || []).some((p) => (p.on || []).includes(G.gk)),
        loggedGkChange: (G.log || []).some((e) => e.type === 'gk' && e.half === 2),
      };
    });
    t.chk('benched pick becomes the keeper', r.gk === r.benched, `gk=${r.gk} expected ${r.benched}`);
    t.chk('the new keeper is on the field', r.newKeeperOnField);
    t.chk('the outgoing keeper went to the bench', r.oldKeeperBenched);
    t.chk('field is still the right size', r.onLen === r.onField, `${r.onLen}/${r.onField}`);
    t.chk('squad conserved', r.squadOk);
    t.chk('no duplicate on the pitch', r.noDupes);
    t.chk('new keeper is out of the rotation', !r.gkInAnyPair);
    t.chk('the change is in the match log', r.loggedGkChange);
  }],

  ['2nd-half keeper: tapping a keeper at the break still wins', async (page, t) => {
    // A pick made at the break must not be overridden by an older setting.
    await setup(page, { format: '7v7', sport: 'soccer', pickGk2: 3 });
    const r = await page.evaluate(() => {
      const target = G.on.find((p) => p !== G.gk);
      setPlanKeeper(target);
      startNextPeriod();
      if (G.raf) { try { cancelAnimationFrame(G.raf); } catch (e) {} G.raf = null; }
      G.running = false;
      return { target, gk: G.gk, onField: G.on.includes(G.gk), squadOk: G.on.length + G.bench.length === avail.length };
    });
    t.chk('the keeper tapped at the break is the one in goal', r.gk === r.target, `gk=${r.gk} expected ${r.target}`);
    t.chk('that keeper is on the field', r.onField);
    t.chk('squad conserved', r.squadOk);
  }],

  ['2nd-half keeper: survives a refresh at the break', async (page, t) => {
    await setup(page, { format: '7v7', sport: 'soccer', pickGk2: 3 });
    const r = await page.evaluate(() => {
      saveActiveGame();
      G = null; gk2 = null; gk2Explicit = false;   // wipe module state like a reload
      resumeActiveGame();
      if (G.raf) { try { cancelAnimationFrame(G.raf); } catch (e) {} G.raf = null; }
      G.running = false;
      const restored = { gk2, gk2Explicit, atBreak: !!G.atBreak };
      startNextPeriod();
      if (G.raf) { try { cancelAnimationFrame(G.raf); } catch (e) {} G.raf = null; }
      G.running = false;
      return { restored, gk: G.gk, onField: G.on.includes(G.gk) };
    });
    t.chk('the break survives the reload', r.restored.atBreak);
    t.chk('the 2nd-half keeper choice survives the reload', r.restored.gk2 === 3 && r.restored.gk2Explicit === true,
      `gk2=${r.restored.gk2} explicit=${r.restored.gk2Explicit}`);
    t.chk('and still takes the gloves after resuming', r.gk === 3, `gk=${r.gk}`);
    t.chk('keeper on the field', r.onField);
  }],

  ['auto-defaulted gk2 is not locked out of the outfield rotation', async (page, t) => {
    // The knock-on defect: the plan excluded gk2 from rotation for the whole
    // game on the assumption it would become the keeper, pinning that player
    // on the pitch when the swap never came.
    await setup(page, { format: '7v7', sport: 'soccer', pickGk2: null, strategy: 'fair' });
    const r = await page.evaluate(() => {
      const plan = generateAutoPlan();
      const moved = new Set();
      const add = (v) => { if (Array.isArray(v)) v.forEach((p) => moved.add(p)); else if (v != null) moved.add(v); };
      const subs = (plan.events || []).filter((e) => e.type !== 'gk_swap');
      subs.forEach((e) => { add(e.off); add(e.on); });
      return { gk1, gk2, gk2Rotates: moved.has(gk2), subCount: subs.length };
    });
    t.chk('the plan has subs to inspect', r.subCount > 0);
    t.chk('a defaulted gk2 is rotated like any outfielder', r.gk2Rotates,
      `gk2=${r.gk2} never appears in any planned swap`);
  }],

  // ---- B. the Plan page at a break -----------------------------------------
  ['Plan page at a break shows the period about to be played', async (page, t) => {
    for (const [format, sport] of [['7v7', 'soccer'], ['nb-go', 'netball']]) {
      for (const breaksOnly of [false, true]) {
        const tag = `${format}${breaksOnly ? ' (breaks-only)' : ''}`;
        await setup(page, { format, sport, breaksOnly });
        const r = await page.evaluate(() => {
          buildPlanTimeline();
          const tl = _planTimeline;
          const finished = G.half;                       // still the finished period at a break
          const ghosts = tl.events.filter((e) => !e.past && e.period === finished).map((e) => e.time);
          const live = getPlanScrubState();
          // Step the scrub bar forward once — the first preview must be in the
          // period the coach is about to play, not the one that just ended.
          planScrubStep(1);
          const stepped = getPlanScrubState();
          planScrubLive();
          return {
            finished, ghosts,
            livePeriod: live.period, liveIsLive: live.isLive,
            liveOn: live.on, actualOn: [...G.on],
            steppedPeriod: stepped.period,
            projTotal: Object.values(computeProjectedMinutes()).reduce((a, b) => a + b, 0),
          };
        });
        t.chk(`${tag}: no phantom upcoming subs in the finished period`, r.ghosts.length === 0,
          `ghost times: [${r.ghosts}]`);
        t.chk(`${tag}: LIVE preview matches the pitch`, JSON.stringify(r.liveOn) === JSON.stringify(r.actualOn));
        t.chk(`${tag}: LIVE is labelled with the upcoming period`, r.livePeriod === r.finished + 1,
          `labelled P${r.livePeriod}, upcoming is P${r.finished + 1}`);
        t.chk(`${tag}: first scrub step is not in the finished period`, r.steppedPeriod > r.finished,
          `stepped to P${r.steppedPeriod}, finished P${r.finished}`);
        t.chk(`${tag}: projected minutes are non-zero`, r.projTotal > 0);
      }
    }
    await t.shot(page, 'plan-at-break');
  }],

  // Reported from a real game: Molly kept goal for the whole first half, handed
  // the gloves over at the break, and was then subbed off "way too many times"
  // in the second half. Cause: the keeper never rotates, so she reached HT with
  // the most minutes of anyone — and equal-time always pulls the highest-minutes
  // player off, so the moment she became an outfielder she was the permanent
  // target (off at 5', forced back on at 10' by a 2-deep bench, off again at 15').
  // Owner's rule, v2.9.5: TIME IN GOAL DOES NOT COUNT AS GAME TIME FOR EQUAL
  // PLAY. Only outfield minutes compete. When the keeper never changes this is
  // behaviour-identical to before — the rule only bites at a handover.
  ['H1 keeper is not rotation-targeted after handing over the gloves', async (page, t) => {
    const r = await page.evaluate(() => {
      const stop = () => { if (G && G.raf) { try { cancelAnimationFrame(G.raf); } catch (e) {} G.raf = null; } if (G) { G.running = false; G.lastTs = null; G.elapsedMs = G.secs * 1000; } };
      G = null; localStorage.clear(); teams = loadTeams();
      newTeam(); pickSport('soccer'); pickFormat('7v7', 'soccer');
      // 9 players → bench of 2, the worst case: the ex-keeper is forced back on
      // at every rotation and (pre-fix) straight off again.
      editingTeam.players = ['Molly', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8', 'P9'];
      editingTeam.numbers = {}; editingTeam.positions = {};
      document.getElementById('teamNameInput').value = 'Molly churn';
      saveAndBack(); selectTeam(teams[teams.length - 1].id);
      cfg.subStrategy = 'fair';
      startFromSquad(); if(typeof finishSetupSteps==="function")finishSetupSteps(); stop();
      G.subStrategy = 'fair';
      const molly = avail.indexOf('Molly');
      setPlanKeeper(molly);                 // Molly keeps all of H1
      tog(); stop();
      let g = 0; while (G && !G.atBreak && g++ < 20000) { G.running = true; const e = tickSecond(); stop(); if (e) break; }
      const htMolly = G.pt['Molly'] || 0;
      const gktMolly = (G.gkt && G.gkt['Molly']) || 0;
      setPlanKeeper(G.on.find((p) => p !== molly && p !== G.gk));   // gloves handed over
      startNextPeriod(); stop();
      g = 0; while (G && g++ < 20000) { G.running = true; const e = tickSecond(); stop(); if (e || G.atBreak) break; }
      const h2 = (G.log || []).filter((e) => e.type === 'sub' && e.half === 2);
      const offs = {};
      h2.forEach((e) => { offs[e.off] = (offs[e.off] || 0) + 1; });
      // Churn: anyone subbed OFF who came ON at the immediately preceding sub time.
      const times = [...new Set(h2.map((e) => e.time))].sort((a, b) => a - b);
      let churned = [];
      for (let i = 1; i < times.length; i++) {
        const prevOn = h2.filter((e) => e.time === times[i - 1]).map((e) => e.on);
        h2.filter((e) => e.time === times[i]).forEach((e) => { if (prevOn.includes(e.off)) churned.push(e.off + '@' + times[i]); });
      }
      return {
        htMolly, gktMolly,
        mollyOffs: offs['Molly'] || 0,
        maxOtherOffs: Math.max(0, ...avail.filter((n) => n !== 'Molly').map((n) => offs[n] || 0)),
        churned,
        ptMolly: G.pt['Molly'] || 0,
      };
    });
    t.chk('Molly kept the whole first half', r.htMolly >= 1150, `pt=${r.htMolly}s`);
    t.chk('her keeper time is tracked separately', r.gktMolly >= 1150, `gkt=${r.gktMolly}s`);
    t.chk('she is NOT subbed off more than anyone else in H2', r.mollyOffs <= r.maxOtherOffs,
      `Molly ${r.mollyOffs} offs vs worst other ${r.maxOtherOffs}`);
    t.chk('nobody is benched at the rotation right after coming on', r.churned.length === 0,
      `churned: ${r.churned.join(', ') || 'none'}`);
    t.chk('her displayed total minutes still include the keeper half', r.ptMolly >= r.htMolly,
      `total=${r.ptMolly}s`);
  }],

  ['second-half XI is exactly what the coach set at the break', async (page, t) => {
    await setup(page, { format: '7v7', sport: 'soccer' });
    const r = await page.evaluate(() => {
      planClearField();
      const picked = [...G.bench].slice(0, FORMATS[curFmt].onField);
      picked.forEach((p) => planAddStarter(p));
      planFinishStarters();
      const intended = [...G.on];
      startNextPeriod();
      if (G.raf) { try { cancelAnimationFrame(G.raf); } catch (e) {} G.raf = null; }
      G.running = false;
      return { intended, actual: [...G.on], half: G.half, squadOk: G.on.length + G.bench.length === avail.length };
    });
    t.chk('second half started', r.half === 2);
    t.chk('the XI at kickoff is the coach\'s pick', JSON.stringify(r.actual) === JSON.stringify(r.intended),
      `set [${r.intended}] got [${r.actual}]`);
    t.chk('squad conserved', r.squadOk);
  }],
];

const { code } = await runSuite({ title: 'Sub Timer second-half setup', scenarios, slug: 'secondhalf' });
process.exit(code);
