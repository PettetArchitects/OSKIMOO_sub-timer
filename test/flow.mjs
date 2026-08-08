#!/usr/bin/env node
// ===========================================================================
// Sub Timer — game flow round-trip suite ("log every game, then re-run it")
// ---------------------------------------------------------------------------
// This is the self-test for the recorder + replayer pair, AND a regression
// corpus generator. For each scripted game it:
//
//   1. plays the game in a real browser, exactly as a coach would drive it,
//   2. reads back the flow the app recorded on its own,
//   3. replays that flow against the same build in a clean page,
//   4. asserts the replay reproduces the recording step for step, and that the
//      structural invariants hold at every step of both.
//
// If step 4 fails the recorder and the app disagree — which means a flow sent
// in from the sideline could NOT be trusted to reproduce a bug. So this suite
// is what makes "send me the game flow" a real workflow rather than a hope.
//
// The scripted games deliberately concentrate on the SECOND-HALF SETUP path
// (the reported problem area): changing the line-up, the keeper, and the
// rotation at the break, and refreshing the app mid-break.
//
//   node test/flow.mjs                 # run everything
//   FLOW_WRITE=1 node test/flow.mjs    # also write each flow into flows/generated/
//   REPLAY_HEADED=1 node test/flow.mjs # watch it
// ===========================================================================
import { writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadChromium, browserExecutable, startServer } from './harness.mjs';
import { installReplayEngine, replayFlow } from './replay.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', 'flows', 'generated');
const NOISE = /ERR_|net::|supabase|lucide|gstatic|googleapis|unpkg|jsdelivr|cdn|three|favicon|manifest|ServiceWorker|sw\.js|the server responded/i;

// --- the scripted games -----------------------------------------------------
// Each `drive` runs IN THE PAGE against the live app. Helpers available:
//   runClock(n)      advance n seconds of game time (real per-second logic)
//   toBreak()        run to the end of the current period (fires advH)
//   reload()         round-trip through localStorage like a refresh at the break
// Keep every action a real user-facing call so the recorder sees what a coach
// would actually produce.
const GAMES = [
  {
    name: 'soccer 7v7 · equal-time · keeper changed at the break',
    format: '7v7', sport: 'soccer', strategy: 'fair',
    drive: `
      tog(); toBreak();
      setPlanKeeper(G.bench[0]);
      startNextPeriod(); runClock(400); toBreak();
    `,
  },
  {
    name: 'soccer 7v7 · clear field and re-pick the whole 2nd-half XI',
    format: '7v7', sport: 'soccer', strategy: 'fair',
    drive: `
      tog(); toBreak();
      planClearField();
      // pick a deliberately different XI: take the bench first
      const order = [...G.bench];
      order.slice(0, FORMATS[curFmt].onField).forEach(p => planAddStarter(p));
      planFinishStarters();
      startNextPeriod(); runClock(400); toBreak();
    `,
  },
  {
    name: 'soccer 11v11 · paired rotation · swap two players at the break',
    format: '11v11', sport: 'soccer', strategy: 'paired',
    drive: `
      tog(); toBreak();
      tapFieldPlayer(G.on[1], false); tapFieldPlayer(G.on[3], false);
      setPlanKeeper(G.on[0]);
      startNextPeriod(); runClock(500); toBreak();
    `,
  },
  {
    name: 'soccer 7v7 · undo the auto-applied halftime rotation',
    format: '7v7', sport: 'soccer', strategy: 'fair',
    drive: `
      tog(); toBreak();
      undoLastSub();
      startNextPeriod(); runClock(300); toBreak();
    `,
  },
  {
    name: 'soccer 7v7 · refresh the app AT the break, then set up the 2nd half',
    format: '7v7', sport: 'soccer', strategy: 'fair',
    drive: `
      tog(); toBreak();
      reload();
      setPlanKeeper(G.bench[0]);
      startNextPeriod(); runClock(300); toBreak();
    `,
  },
  {
    name: 'soccer 7v7 · scrub the sub preview at the break, then edit',
    format: '7v7', sport: 'soccer', strategy: 'fair',
    drive: `
      tog(); toBreak();
      switchToView('plan');
      planScrubStep(1); planScrubStep(1); planScrubLive();
      setPlanKeeper(G.bench[0]);
      switchToView('game');
      startNextPeriod(); runClock(300); toBreak();
    `,
  },
  {
    name: 'netball nb-go · four quarters, line-up changed at every break',
    format: 'nb-go', sport: 'netball', strategy: 'fair',
    drive: `
      tog();
      for (let q = 0; q < 4; q++) {
        toBreak();
        if (!G.atBreak) break;
        if (G.bench.length) { tapFieldPlayer(G.on[0], false); tapFieldPlayer(G.on[1], false); }
        startNextPeriod();
      }
    `,
  },
  {
    name: 'soccer 4v4 · no keeper · rotation across the break',
    format: '4v4', sport: 'soccer', strategy: 'fair',
    drive: `
      tog(); toBreak();
      startNextPeriod(); runClock(400); toBreak();
    `,
  },
  {
    name: 'soccer 7v7 · goals, injury sub, then a 2nd-half keeper change',
    format: '7v7', sport: 'soccer', strategy: 'fair',
    drive: `
      tog(); runClock(200);
      adjScore('us', 1); adjScore('them', 1);
      injurySub(G.on[2], G.bench[0]); confInjury(false);
      toBreak();
      setPlanKeeper(G.bench[0]);
      startNextPeriod(); runClock(400);
      adjScore('us', 1);
      toBreak();
    `,
  },
  {
    name: 'soccer 7v7 · subs-at-breaks-only (netball rule) across the break',
    format: '7v7', sport: 'soccer', strategy: 'fair', breaksOnly: true,
    drive: `
      tog(); toBreak();
      setPlanKeeper(G.bench[0]);
      startNextPeriod(); runClock(400); toBreak();
    `,
  },
];

// Helpers injected into the page for the drive scripts.
function installDriveHelpers() {
  // The replayer owns the clock in both phases, so nothing may leave a live
  // rAF chain running — a leaked loop would advance the game during an await
  // and make the recording non-deterministic.
  window.__stopClock = () => {
    if (!window.G) return;
    if (G.raf) { try { cancelAnimationFrame(G.raf); } catch (e) {} G.raf = null; }
    G.running = false; G.lastTs = null;
  };
  window.runClock = (n) => {
    for (let i = 0; i < n; i++) {
      if (!G || G.atBreak) break;
      G.running = true;
      const ended = tickSecond();
      window.__stopClock();
      if (ended) break;
    }
  };
  window.toBreak = () => {
    let guard = 0;
    while (G && !G.atBreak && guard++ < 20000) {
      G.running = true;
      const ended = tickSecond();
      window.__stopClock();
      if (ended) break;
    }
  };
  window.reload = () => {
    // Not a real page reload (that would lose the harness); the equivalent
    // round-trip through localStorage, which is what resumeActiveGame does.
    saveActiveGame();
    G = null;
    resumeActiveGame();
    window.__stopClock();
  };
}

async function playGame(page, game) {
  return page.evaluate(({ game }) => {
    if (typeof G !== 'undefined' && G) { G.running = false; if (G.raf) { try { cancelAnimationFrame(G.raf); } catch (e) {} G.raf = null; } }
    G = null;
    localStorage.clear();
    teams = loadTeams();
    newTeam();
    pickSport(game.sport);
    pickFormat(game.format, game.sport);
    fillSampleSquad();
    document.getElementById('teamNameInput').value = 'Flow ' + game.format;
    saveAndBack();
    selectTeam(teams[teams.length - 1].id);
    if (game.strategy) cfg.subStrategy = game.strategy;
    if (game.breaksOnly != null) cfg.breaksOnly = !!game.breaksOnly;
    startFromSquad(); if(typeof finishSetupSteps==="function")finishSetupSteps();
    window.__stopClock();
    if (game.strategy) G.subStrategy = game.strategy;

    let err = null;
    try { eval(game.drive); } catch (e) { err = e.message; }
    window.__stopClock();
    flowFlush();
    const flows = loadFlows();
    return { err, flow: flows[0] || null, finalHalf: G ? G.half : null };
  }, { game });
}

// Structural invariants applied to the RECORDING itself, so a bug that the
// phone hit shows up even if the replay faithfully reproduces it.
function auditRecording(flow) {
  const problems = [];
  if (!flow) return ['no flow recorded'];
  if (!flow.actions || !flow.actions.length) problems.push('flow has no actions');
  const squadSize = (flow.setup && flow.setup.avail || []).length;
  (flow.actions || []).forEach((a) => {
    const st = a.after;
    if (!st) return;
    const on = st.on || [], bench = st.bench || [];
    if (new Set(on).size !== on.length) problems.push(`step ${a.i} (${a.fn}): duplicate on field [${on}]`);
    const both = on.filter((p) => bench.includes(p));
    if (both.length) problems.push(`step ${a.i} (${a.fn}): player on field AND bench [${both}]`);
    if (squadSize && on.length + bench.length > squadSize) problems.push(`step ${a.i} (${a.fn}): ${on.length + bench.length} players accounted for, squad is ${squadSize}`);
  });
  // Real names must never survive into a shareable flow.
  const json = JSON.stringify(flow);
  const aliasOnly = (flow.setup && flow.setup.avail || []).every((n) => /^Player \d+$/.test(n));
  if (!aliasOnly) problems.push('setup.avail contains non-pseudonymised names');
  const ptKeys = Object.keys((flow.result && flow.result.pt) || {});
  const leaked = ptKeys.filter((k) => !/^Player \d+$/.test(k));
  if (leaked.length) problems.push(`playing time leaks real names: ${leaked.slice(0, 3).join(', ')}`);
  if (json.length > 400000) problems.push(`flow is ${Math.round(json.length / 1024)}KB — too big for localStorage comfort`);
  return problems;
}

(async () => {
  const chromium = await loadChromium();
  const { srv, port } = await startServer();
  const browser = await chromium.launch({
    executablePath: browserExecutable(),
    headless: !process.env.REPLAY_HEADED,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  const page = await browser.newPage();
  const consoleErrs = [];
  page.on('dialog', (d) => d.accept().catch(() => {}));
  page.on('pageerror', (e) => { if (!NOISE.test(e.message)) consoleErrs.push('pageerror: ' + e.message); });
  page.on('console', (m) => { if (m.type() === 'error' && !NOISE.test(m.text())) consoleErrs.push('console: ' + m.text()); });

  await page.goto(`http://127.0.0.1:${port}/index.html`, { waitUntil: 'load' });
  await page.waitForFunction(() => typeof newTeam === 'function' && typeof tickSecond === 'function' && typeof flowInstall === 'function', { timeout: 10000 });
  await page.evaluate(installDriveHelpers);
  await page.evaluate(installReplayEngine);

  console.log(`\n🎬 Game flow round-trip — ${GAMES.length} scripted games\n`);
  const results = [];
  const written = [];

  for (const game of GAMES) {
    console.log(`── ${game.name}`);
    const { err, flow } = await playGame(page, game);
    if (err) { console.log(`  ✗ drive script threw: ${err}`); results.push({ game, issues: [{ kind: 'DRIVE', step: '-', detail: err }] }); continue; }

    const recIssues = auditRecording(flow).map((d) => ({ kind: 'RECORDING', step: '-', detail: d }));
    if (recIssues.length) recIssues.forEach((i) => console.log(`  ✗ [RECORDING] ${i.detail}`));
    else console.log(`  ✓ recorded ${flow.actions.length} actions`);

    if (process.env.FLOW_WRITE && flow) {
      await mkdir(OUT_DIR, { recursive: true });
      const f = join(OUT_DIR, game.name.replace(/\W+/g, '-').toLowerCase() + '.json');
      await writeFile(f, JSON.stringify({ kind: 'sub-timer-flow', v: flow.v, app: flow.app, flows: [flow] }, null, 2));
      written.push(f);
    }

    // Replay it in a clean state and compare against the recording.
    const R = [];
    const replayIssues = flow ? await replayFlow(page, flow, R) : [{ kind: 'REPLAY', step: '-', detail: 'nothing to replay' }];
    results.push({ game, issues: [...recIssues, ...replayIssues] });
  }

  await browser.close();
  srv.close();

  const failing = results.filter((r) => r.issues.length);
  console.log('\n========== GAME FLOW SUMMARY ==========');
  console.log(`${results.length - failing.length}/${results.length} games recorded + replayed clean · ${consoleErrs.length} console error(s)`);
  if (written.length) console.log(`wrote ${written.length} flow(s) → flows/generated/`);
  if (failing.length) {
    console.log('');
    for (const r of failing) {
      console.log(`${r.game.name}`);
      for (const i of r.issues) console.log(`  [${i.kind}] step ${i.step}: ${i.detail}`);
      console.log('');
    }
  }
  if (consoleErrs.length) console.log('CONSOLE/PAGE ERRORS:\n  ' + [...new Set(consoleErrs)].join('\n  '));
  process.exit(failing.length || consoleErrs.length ? 1 : 0);
})().catch((e) => { console.error('FATAL', e.stack || e); process.exit(2); });
