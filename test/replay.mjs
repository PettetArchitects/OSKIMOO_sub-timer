#!/usr/bin/env node
// ===========================================================================
// Sub Timer — game flow replayer
// ---------------------------------------------------------------------------
// Turns a game recorded on a coach's phone back into a running game on this
// machine. The app records every game as a "flow" (see the GAME FLOW RECORDER
// block in index.html): the setup it started from, plus every top-level action
// in order, each stamped with the game clock and the state it produced.
//
// This replays those actions against the current build and reports:
//   • DIVERGENCE — a step where this build produced a different on-field /
//     bench / keeper state than the phone did. That IS the bug, localised to
//     one action, with the before/after on both sides.
//   • INVARIANTS — structural rules that must hold at every step regardless of
//     what the phone did (no duplicate players, keeper on field, squad
//     conserved, …). These catch bugs the phone had too, so a flow recorded on
//     a buggy build still tells you what's wrong.
//
//   node test/replay.mjs flows/<file>.json     # replay one export
//   node test/replay.mjs flows/                # replay every flow in a folder
//   node test/replay.mjs                       # replay everything in flows/
//   REPLAY_HEADED=1 node test/replay.mjs …     # watch it happen
//
// Exit code is 1 if any flow diverged or violated an invariant, so this can
// gate a merge once a corpus of real games is committed under flows/.
// ===========================================================================
import { readFile, readdir } from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadChromium, browserExecutable, startServer } from './harness.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const FLOW_DIR = join(ROOT, 'flows');

const NOISE = /ERR_|net::|supabase|lucide|gstatic|googleapis|unpkg|jsdelivr|cdn|three|favicon|manifest|ServiceWorker|sw\.js|the server responded/i;

// --- collect the flow files to replay ---------------------------------------
async function collectFiles(argv) {
  const targets = argv.length ? argv : [FLOW_DIR];
  const files = [];
  for (const t of targets) {
    const p = t.startsWith('/') ? t : join(ROOT, t);
    if (!existsSync(p)) { console.error(`  ! not found: ${t}`); continue; }
    if (statSync(p).isDirectory()) {
      for (const f of (await readdir(p)).sort()) if (f.endsWith('.json')) files.push(join(p, f));
    } else files.push(p);
  }
  return files;
}

// An export file holds {kind:'sub-timer-flow', flows:[…]}; accept a bare flow
// or a bare array too, so a hand-trimmed file still replays.
function flowsFrom(json, file) {
  if (Array.isArray(json)) return json;
  if (json && Array.isArray(json.flows)) return json.flows;
  if (json && json.actions) return [json];
  console.error(`  ! ${basename(file)}: not a recognised flow file`);
  return [];
}

// --- the in-page replay engine ----------------------------------------------
// Installed once per page. Rebuilds the exact game the flow started from, then
// applies each action, advancing the clock deterministically to the action's
// timestamp first (via tickSecond(), the same per-second logic the live rAF
// loop runs — so a replayed game exercises the real code path, not a model
// of it). Exported so test/flow.mjs can round-trip record→replay in one page.
export function installReplayEngine() {
  window.__replaySetup = (flow) => {
    // Tear down anything left from a previous flow: a leaked rAF chain would
    // keep advancing the clock and firing subs under the next replay.
    if (typeof G !== 'undefined' && G) {
      G.running = false;
      if (G.raf) { try { cancelAnimationFrame(G.raf); } catch (e) {} G.raf = null; }
    }
    G = null;
    localStorage.clear();
    teams = loadTeams();

    const s = flow.setup || {};
    const sportKey = FORMATS[flow.format] ? FORMATS[flow.format].sport : flow.sport;
    newTeam();
    pickSport(sportKey);
    pickFormat(flow.format, sportKey);
    // Rebuild the recorded squad exactly — size, names, numbers and position
    // tags all steer auto-fill and rotation, so an approximation would replay
    // a different game. team.players is an array of name strings; numbers and
    // position tags live in side maps keyed by name.
    const squad = s.squad || [];
    editingTeam.players = squad.map((p) => p.name);
    editingTeam.numbers = {};
    editingTeam.positions = {};
    squad.forEach((p) => {
      if (p.number) editingTeam.numbers[p.name] = p.number;
      if (p.pos && p.pos.length) editingTeam.positions[p.name] = [...p.pos];
    });
    document.getElementById('teamNameInput').value = 'Replay ' + flow.format;
    saveAndBack();
    selectTeam(teams[teams.length - 1].id);

    // Restore the game settings the coach was actually playing under.
    if (s.cfg) Object.assign(cfg, s.cfg);
    if (flow.formation && FORMATIONS[curFmt] && FORMATIONS[curFmt][flow.formation]) curFormation = flow.formation;

    // Restore the line-up the game started from, bypassing auto-fill.
    if (Array.isArray(s.luOrd) && s.luOrd.length) luOrd = [...s.luOrd];
    if (Array.isArray(s.rotPairs)) rotPairs = s.rotPairs.map((p) => ({ on: [...p.on] }));
    if (s.gk1 != null) gk1 = s.gk1;
    if (s.gk2 != null) gk2 = s.gk2;

    startFromSquad(); if(typeof finishSetupSteps==="function")finishSetupSteps();

    // startGame() derives on/bench from luOrd; if the recording captured a
    // different opening XI (coach edited on the Plan page pre-kickoff), honour
    // the recorded one so step 0 already matches.
    if (Array.isArray(s.initialOn) && s.initialOn.length) {
      G.on = [...s.initialOn];
      G.bench = [...(s.initialBench || [])];
      if (s.initialGk !== undefined) G.gk = s.initialGk;
    }
    if (s.subStrategy) G.subStrategy = s.subStrategy;
    if (s.subPlan) G.subPlan = JSON.parse(JSON.stringify(s.subPlan));
    // Never let a live rAF loop run during replay — the replayer owns the clock.
    if (G.raf) { try { cancelAnimationFrame(G.raf); } catch (e) {} G.raf = null; }
    G.running = false; G.lastTs = null;
    return { on: [...G.on], bench: [...G.bench], gk: G.gk };
  };

  // Advance the game clock to (half, secs) using the real per-second logic.
  // Returns false if we couldn't get there (e.g. the period already ended).
  window.__replayAdvance = (half, secs) => {
    let guard = 0;
    while (G && G.half === half && G.secs < secs && !G.atBreak && guard++ < 20000) {
      // tickSecond() assumes a running game for its end-of-period bookkeeping.
      G.running = true;
      const ended = tickSecond();
      G.running = false;
      if (G.raf) { try { cancelAnimationFrame(G.raf); } catch (e) {} G.raf = null; }
      if (ended) break;
    }
    return { half: G ? G.half : null, secs: G ? G.secs : null };
  };

  // Apply one recorded action. Actions are recorded as top-level calls, so
  // calling the function with the same args reproduces its nested calls too.
  window.__replayApply = (fn, args) => {
    if (fn === '__resumed') {
      // The coach refreshed / re-opened the app here. Reproduce the round-trip
      // through localStorage — this path has its own restore bugs.
      saveActiveGame();
      const before = G;
      G = null;
      const ok = resumeActiveGame();
      if (!ok) G = before;
      return { applied: true, note: 'resumed' };
    }
    const f = window[fn];
    if (typeof f !== 'function') return { applied: false, error: 'no such function: ' + fn };
    try {
      f.apply(window, args || []);
      // Keep the clock under the replayer's control after any action that
      // starts it (tog / startNextPeriod both kick off a live rAF chain).
      if (G && G.raf) { try { cancelAnimationFrame(G.raf); } catch (e) {} G.raf = null; }
      if (G) { G.running = false; G.lastTs = null; }
      return { applied: true };
    } catch (e) {
      return { applied: false, error: e.message };
    }
  };

  window.__replayState = () => {
    if (!G) return null;
    return {
      half: G.half, secs: G.secs, gk: G.gk,
      on: [...(G.on || [])], bench: [...(G.bench || [])],
      atBreak: !!G.atBreak,
      scoreUs: G.scoreUs, scoreThem: G.scoreThem,
    };
  };

  // Structural rules that must hold at EVERY step, whatever the phone did.
  window.__replayInvariants = () => {
    const bad = [];
    try {
      if (!G) return ['no game'];
      const fmtDef = FORMATS[curFmt];
      const onField = Math.min(fmtDef.onField, avail.length);
      const on = G.on || [], bench = G.bench || [];
      if (new Set(on).size !== on.length) bad.push(`duplicate player on field: [${on}]`);
      if (new Set(bench).size !== bench.length) bad.push(`duplicate player on bench: [${bench}]`);
      const both = on.filter((p) => bench.includes(p));
      if (both.length) bad.push(`player both on field and benched: [${both}]`);
      // Squad conservation: nobody may vanish. Injury-out-for-game legitimately
      // removes a player, so only flag a SHRINKING squad when no injury has
      // been logged.
      const injuredOut = (G.log || []).some((e) => e.type === 'injury_sub' && e.outForGame);
      const total = on.length + bench.length;
      if (!injuredOut && total !== avail.length) bad.push(`squad not conserved: ${total} accounted for, ${avail.length} available`);
      if (on.length > onField) bad.push(`overfilled field: ${on.length} > ${onField}`);
      // Keeper rules only apply once the field is settled (mid-edit states are
      // legitimately partial).
      if (fmtDef.hasGk && !_pickStarters && on.length === onField) {
        if (G.gk == null) bad.push('no keeper set on a keeper format');
        else if (!on.includes(G.gk)) bad.push(`keeper ${G.gk} is not on the field: [${on}]`);
      }
      (G.pairs || []).forEach((pair, i) => {
        (pair.on || []).forEach((p) => {
          if (p == null || p < 0 || p >= avail.length) bad.push(`rotation pair ${i} references unknown player ${p}`);
          if (fmtDef.hasGk && G.gk != null && p === G.gk) bad.push(`keeper ${p} is inside rotation pair ${i}`);
        });
      });
      if (G.pairs && G.pairs.length && G.pairIdx > G.pairs.length) bad.push(`pairIdx ${G.pairIdx} out of range (${G.pairs.length} pairs)`);
      Object.entries(G.pt || {}).forEach(([n, t]) => { if (t < 0) bad.push(`negative playing time for ${n}: ${t}`); });
    } catch (e) { bad.push('invariant check threw: ' + e.message); }
    return bad;
  };
}

export const sameState = (a, b) =>
  a && b &&
  JSON.stringify(a.on) === JSON.stringify(b.on) &&
  JSON.stringify(a.bench) === JSON.stringify(b.bench) &&
  a.gk === b.gk;

export async function replayFlow(page, flow, R) {
  const label = `${flow.format || '?'} · ${flow.sport || '?'} · ${(flow.actions || []).length} actions · ${flow.app || '?'}`;
  console.log(`\n▶ ${label}`);
  const issues = [];

  await page.evaluate((f) => window.__replaySetup(f), flow);
  await page.waitForTimeout(120);

  let firstDivergence = null;
  for (const act of flow.actions || []) {
    // Get the clock to where it was when the coach tapped.
    if (act.half != null && act.secs != null) {
      await page.evaluate(([h, s]) => window.__replayAdvance(h, s), [act.half, act.secs]);
    }
    // Clock-derived actions (auto-subs, end of period) are reproduced BY the
    // clock advance above — applying them again would double-substitute.
    if (!act.auto) {
      const res = await page.evaluate(([fn, args]) => window.__replayApply(fn, args), [act.fn, act.args]);
      if (!res.applied) {
        issues.push({ kind: 'ERROR', step: act.i, detail: `${act.fn}(): ${res.error}` });
        continue;
      }
    }
    const now = await page.evaluate(() => window.__replayState());
    const viol = await page.evaluate(() => window.__replayInvariants());
    for (const v of viol) issues.push({ kind: 'INVARIANT', step: act.i, detail: `after ${act.fn}(): ${v}` });

    // Compare against what the phone recorded. Only the FIRST divergence is
    // meaningful — after that the two games have different state and every
    // later step disagrees for free.
    if (act.after && !firstDivergence && !sameState(now, act.after)) {
      firstDivergence = { step: act.i, fn: act.fn, half: act.half, secs: act.secs, phone: act.after, here: now };
      issues.push({
        kind: 'DIVERGENCE', step: act.i,
        detail: `after ${act.fn}(${JSON.stringify(act.args || []).slice(0, 80)}) at P${act.half} ${act.secs}s\n` +
                `      phone: on=[${act.after.on}] bench=[${act.after.bench}] gk=${act.after.gk}\n` +
                `      here:  on=[${now.on}] bench=[${now.bench}] gk=${now.gk}`,
      });
    }
  }

  if (!issues.length) console.log('  ✓ replayed clean — no divergence, no invariant violations');
  else {
    const byKind = issues.reduce((m, i) => ((m[i.kind] = (m[i.kind] || 0) + 1), m), {});
    console.log(`  ✗ ${Object.entries(byKind).map(([k, n]) => `${n} ${k}`).join(', ')}`);
    // Print the first of each kind — the rest are almost always downstream.
    const seen = new Set();
    for (const i of issues) {
      if (seen.has(i.kind)) continue;
      seen.add(i.kind);
      console.log(`    [${i.kind}] step ${i.step}: ${i.detail}`);
    }
    if (issues.length > seen.size) console.log(`    (${issues.length - seen.size} more — see the report below)`);
  }
  R.push({ label, flow, issues });
  return issues;
}

// Only run the CLI when invoked directly — flow.mjs imports the engine above.
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) await (async () => {
  const files = await collectFiles(process.argv.slice(2));
  if (!files.length) {
    console.log('\nNo flow files to replay.');
    console.log(`Drop an exported flow into ${FLOW_DIR}/ (menu → Send game flow) and re-run.\n`);
    process.exit(0);
  }

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
  await page.waitForFunction(() => typeof newTeam === 'function' && typeof tickSecond === 'function', { timeout: 10000 });
  await page.evaluate(installReplayEngine);

  console.log(`\n🎞  Replaying ${files.length} flow file(s) against this build\n`);
  const R = [];
  for (const file of files) {
    let json;
    try { json = JSON.parse(await readFile(file, 'utf8')); }
    catch (e) { console.error(`  ! ${basename(file)}: ${e.message}`); continue; }
    console.log(`── ${basename(file)}`);
    for (const flow of flowsFrom(json, file)) await replayFlow(page, flow, R);
  }

  await browser.close();
  srv.close();

  const failing = R.filter((r) => r.issues.length);
  console.log('\n========== REPLAY REPORT ==========');
  console.log(`${R.length - failing.length}/${R.length} flow(s) replayed clean · ${consoleErrs.length} console error(s)`);
  if (failing.length) {
    console.log('');
    for (const r of failing) {
      console.log(`${r.label}`);
      for (const i of r.issues) console.log(`  [${i.kind}] step ${i.step}: ${i.detail}`);
      console.log('');
    }
  }
  if (consoleErrs.length) console.log('CONSOLE/PAGE ERRORS:\n  ' + [...new Set(consoleErrs)].join('\n  '));
  process.exit(failing.length || consoleErrs.length ? 1 : 0);
})().catch((e) => { console.error('FATAL', e.stack || e); process.exit(2); });
