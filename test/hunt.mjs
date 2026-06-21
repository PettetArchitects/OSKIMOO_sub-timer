#!/usr/bin/env node
// ===========================================================================
// Sub Timer — bug-hunting harness ("the hunt")
// ---------------------------------------------------------------------------
// This is the DISCOVERY half of the fix loop. Where smoke/sports/edge assert
// known-good behaviour, this actively *looks for new bugs*: it drives the Plan
// page through many interaction sequences (the messy area where every desync
// bug this project has hit was found) and checks a set of INVARIANTS that must
// always hold. Any violation is reported with the exact sequence that produced
// it, so a human (or the smoke-tester agent) can reproduce and fix it.
//
// It is deliberately NOT wired into the merge gate — exploratory checks can be
// noisy, and a found issue needs a judgment call, not an auto-merge. Run it on
// demand to hunt:  node test/hunt.mjs   (exit 1 if any invariant is violated)
//
// The invariants (each maps to a real bug we shipped a fix for):
//   I1  At LIVE, the on-field chips equal the pitch (no phantom players).      [#10/#11]
//   I2  On a scrubbed preview, editable pick-starters chips are hidden.        [#11]
//   I3  No duplicate player appears on the pitch.                              [#11]
//   I4  For a GK format, the keeper is on the field (or field is mid-edit).    [#10]
//   I5  The on-field count never exceeds the format's onField.                 [general]
//   I6  Projected minutes are never all-zero when a plan exists.               [#12]
//   I7  A pure-GK player is never auto-filled into an outfield slot.           [#13]
//   I8  In setup phase (pre-kickoff / break) the keeper picker is available.   [#14]
//   I9  No uncaught console / page error fires during any sequence.            [general]
// ===========================================================================
import { loadChromium, browserExecutable, startServer } from './harness.mjs';

const FORMATS_TO_HUNT = [
  { fmt: '7v7', sport: 'soccer', gk: true },
  { fmt: '11v11', sport: 'soccer', gk: true },
  { fmt: '5v5', sport: 'soccer', gk: true },
  { fmt: '4v4', sport: 'soccer', gk: false },
  { fmt: 'nb-go', sport: 'netball', gk: false },
  { fmt: 'wp-senior', sport: 'waterpolo', gk: true },
];

// A library of single "moves" the hunter can apply on the Plan page. Each is a
// string naming a function call; the runner applies them in many orders.
const MOVES = [
  'planClearField()',
  'planAutoFillStarters()',
  'scrubFwd()',          // step the sub preview forward (only when not building)
  'scrubBack()',         // step the sub preview back
  'planScrubLive()',
  'addOneStarter()',     // helper installed in-page
  'removeOneStarter()',  // helper installed in-page
  'keeperToBench()',     // make a benched player keeper
  'keeperToOnfield()',   // make an on-field player keeper
  'gotoGameThenPlan()',  // leave to game screen and back
  'toHalfTimeBreak()',   // jump the clock to the break
];

function makeReporter() {
  const findings = [];
  return {
    findings,
    note: (inv, detail, seq) => findings.push({ inv, detail, seq: [...seq] }),
  };
}

async function huntFormat(page, cfg, R, opts) {
  const { fmt, sport, gk } = cfg;
  // (Re)boot a fresh game for this format.
  await page.evaluate(({ fmt, sport }) => {
    if (typeof G !== 'undefined' && G) { G.running = false; if (G.raf) { try { cancelAnimationFrame(G.raf); } catch (e) {} G.raf = null; } }
    G = null; localStorage.clear(); teams = loadTeams();
    newTeam(); pickSport(sport); pickFormat(fmt, sport); fillSampleSquad();
    document.getElementById('teamNameInput').value = 'Hunt ' + fmt;
    saveAndBack(); selectTeam(teams[teams.length - 1].id); startFromSquad();
    switchToView('plan');
    // install in-page move helpers + the invariant checker. Each helper guards
    // its own PRECONDITION so the hunt only applies moves reachable in the real
    // app — e.g. you cannot start/advance the clock while still building the
    // starting line-up (pick-starters mode), so the clock moves finish the
    // line-up first. Applying impossible move orders produced false positives.
    window.addOneStarter = () => { if (_pickStarters && G.bench.length) planAddStarter(G.bench[0]); };
    window.removeOneStarter = () => { if (_pickStarters && G.on.length) planRemoveStarter(G.on[G.on.length - 1]); };
    window.keeperToBench = () => { if (FORMATS[curFmt].hasGk && G.bench.length) setPlanKeeper(G.bench[0]); };
    window.keeperToOnfield = () => { if (FORMATS[curFmt].hasGk) { const o = G.on.find(i => i !== G.gk); if (o != null) setPlanKeeper(o); } };
    // Scrubbing previews the sub PLAN, which only exists once the line-up is
    // locked — so don't scrub mid-build (no plan to preview yet).
    window.scrubFwd = () => { if (!_pickStarters) planScrubStep(1); };
    window.scrubBack = () => { if (!_pickStarters) planScrubStep(-1); };
    window.gotoGameThenPlan = () => { if (_pickStarters) planFinishStarters(); switchToView('game'); switchToView('plan'); };
    window.toHalfTimeBreak = () => {
      if (G.half >= getSport(currentTeam).periodCount) return; // already last period
      if (_pickStarters) planFinishStarters();   // can't advance the clock mid-build — lock the line-up first
      if (G.on.length < FORMATS[curFmt].onField) return; // need a full field to kick off
      if (!G.running) tog();
      if (G.raf) { try { cancelAnimationFrame(G.raf); } catch (e) {} G.raf = null; }
      G.running = false; G.lastTs = null; G.secs = cfg2hm() * 60; G.elapsedMs = cfg2hm() * 60 * 1000;
      advH();
    };
    window.cfg2hm = () => cfg.hm;
    window.__invariants = () => {
      const out = [];
      try {
        const st = getPlanScrubState();
        const host = document.getElementById('planRosterOverview');
        const html = host ? host.innerHTML : '';
        const chipIdx = [...html.matchAll(/planRemoveStarter\((\d+)\)/g)].map(m => +m[1]);
        const onField = FORMATS[curFmt].onField;
        const hasGk = FORMATS[curFmt].hasGk;
        const setup = planSetupPhase();
        // A "settled" state is one safe to judge: LIVE-or-clearly-preview, not
        // mid pick-starters edit (the field can legitimately be partial/empty
        // there), and the field actually full. Transient mid-edit states caused
        // every false positive in the first hunt, so gate the strict checks.
        const fieldFull = st.on.length === onField;
        const settled = !_pickStarters && fieldFull;

        // I1: at LIVE in pick mode, chips that ARE shown must match the pitch.
        if (st.isLive && _pickStarters && chipIdx.length) {
          if (JSON.stringify(st.on) !== JSON.stringify(chipIdx)) out.push(['I1', 'chips≠pitch at LIVE: pitch=' + st.on + ' chips=' + chipIdx]);
        }
        // I2: a scrubbed preview must never show editable pick-starters chips.
        if (!st.isLive && _pickStarters && chipIdx.length) out.push(['I2', 'pick-starters chips shown during preview (scrubIdx=' + _planScrubIdx + ')']);
        // I3: no duplicate on the pitch (always invalid).
        if (new Set(st.on).size !== st.on.length) out.push(['I3', 'duplicate on pitch: ' + st.on]);
        // I4: in a settled state, the keeper must be on the field.
        if (hasGk && settled && st.isLive && !(G.gk != null && G.on.includes(G.gk)))
          out.push(['I4', 'keeper not on field: gk=' + G.gk + ' on=' + G.on]);
        // I5: never overfill (always invalid).
        if (G.on.length > onField) out.push(['I5', 'overfill: on=' + G.on.length + ' max=' + onField]);
        // I6: in a settled state, projected minutes must not be all-zero.
        if (settled) {
          const pt = computeProjectedMinutes();
          const vals = Object.values(pt);
          if (vals.length && vals.every(v => v === 0)) out.push(['I6', 'projected minutes all zero']);
        }
        // I7: a pure-GK is never auto-filled into an outfield slot (settled).
        if (hasGk && settled && currentTeam) {
          const positions = getPositions();
          st.on.forEach((pIdx, i) => {
            const tags = getPlayerPos(currentTeam, avail[pIdx]);
            const slot = positions[i] ? positions[i].label : null;
            if (slot && slot !== 'GK' && tags.length && tags.every(t => t === 'GK'))
              out.push(['I7', 'pure-GK ' + avail[pIdx] + ' in outfield slot ' + slot]);
          });
        }
        // I8: in setup phase, the keeper picker must be present (GK formats).
        if (hasGk && setup && !/Keeper/.test(html)) out.push(['I8', 'keeper picker missing in setup phase']);
      } catch (e) { out.push(['ERR', 'invariant check threw: ' + e.message]); }
      return out;
    };
  }, { fmt, sport });

  // Drive random move sequences; check invariants after every move.
  const seqLen = opts.seqLen, trials = opts.trials;
  for (let t = 0; t < trials; t++) {
    // reset to a clean LIVE state between trials
    await page.evaluate(() => { try { planScrubLive(); } catch (e) {} });
    const seq = [];
    for (let m = 0; m < seqLen; m++) {
      const move = MOVES[(Math.random() * MOVES.length) | 0];
      seq.push(move);
      try {
        await page.evaluate((mv) => { try { eval(mv); } catch (e) { window.__moveErr = mv + ': ' + e.message; } }, move);
      } catch (e) { R.note('ERR', 'move "' + move + '" threw in page: ' + e.message, seq); continue; }
      const moveErr = await page.evaluate(() => { const e = window.__moveErr; window.__moveErr = null; return e; });
      if (moveErr) R.note('ERR', 'move threw: ' + moveErr, seq);
      // Let renders settle before judging — transient mid-render states caused
      // false positives in the first hunt. Re-check twice and only report a
      // violation that persists, so we flag real bugs, not momentary blips.
      await page.waitForTimeout(60);
      const v1 = await page.evaluate(() => window.__invariants());
      if (!v1.length) continue;
      await page.waitForTimeout(120);
      const v2 = await page.evaluate(() => window.__invariants());
      const persist = new Set(v2.map(x => x[0] + '|' + x[1]));
      const violations = v1.filter(x => persist.has(x[0] + '|' + x[1]));
      for (const [inv, detail] of violations) R.note(inv, `[${fmt}] ${detail}`, seq);
      if (violations.length) break; // stop this trial at first violation (seq is the repro)
    }
  }
}

(async () => {
  const trials = Number(process.env.HUNT_TRIALS || 40);
  const seqLen = Number(process.env.HUNT_SEQLEN || 8);
  // Deep-run controls. The per-move settle-waits make a full deep sweep slow, so
  // give two ways to keep it inside a time budget instead of being killed mid-run:
  //   HUNT_ONLY=5v5,nb-go   — hunt only these formats (run/debug/resume one at a time)
  //   HUNT_BUDGET_MS=480000 — stop cleanly between formats once the budget elapses,
  //                           reporting what WAS covered (no scary FATAL timeout).
  const onlyFmts = (process.env.HUNT_ONLY || '').split(',').map(s => s.trim()).filter(Boolean);
  const budgetMs = Number(process.env.HUNT_BUDGET_MS || 0);
  const startedAt = Date.now();
  const formats = onlyFmts.length ? FORMATS_TO_HUNT.filter(f => onlyFmts.includes(f.fmt)) : FORMATS_TO_HUNT;
  const chromium = await loadChromium();
  const { srv, port } = await startServer();
  const browser = await chromium.launch({ executablePath: browserExecutable(), headless: !process.env.SMOKE_HEADED, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const page = await browser.newPage();
  const consoleErrs = [];
  page.on('dialog', d => d.accept().catch(() => {}));
  page.on('pageerror', e => { if (!/ERR_|net::|supabase|lucide|gstatic|cdn|favicon|manifest|three/i.test(e.message)) consoleErrs.push('pageerror: ' + e.message); });
  page.on('console', m => { if (m.type() === 'error' && !/ERR_|net::|supabase|lucide|gstatic|cdn|favicon|manifest|three|the server responded/i.test(m.text())) consoleErrs.push('console: ' + m.text()); });

  await page.goto(`http://127.0.0.1:${port}/index.html`, { waitUntil: 'load' });
  await page.waitForFunction(() => typeof newTeam === 'function', { timeout: 10000 });

  const R = makeReporter();
  console.log(`\n🔎 Bug hunt — ${trials} trials × ${seqLen} moves per format, ${formats.length} format(s)${budgetMs ? ` · budget ${Math.round(budgetMs / 1000)}s` : ''}\n`);
  let covered = 0, skipped = [];
  for (const cfg of formats) {
    if (budgetMs && Date.now() - startedAt > budgetMs) { skipped.push(cfg.fmt); continue; }
    process.stdout.write(`  hunting ${cfg.fmt} (${cfg.sport})… `);
    const before = R.findings.length;
    await huntFormat(page, cfg, R, { trials, seqLen });
    console.log(`${R.findings.length - before} issue(s)`);
    covered++;
  }
  if (skipped.length) console.log(`  ⏱️ budget reached — skipped ${skipped.length} format(s): ${skipped.join(', ')} (re-run with HUNT_ONLY=${skipped.join(',')})`);
  // I9: console errors collected across the whole run
  consoleErrs.forEach(e => R.note('I9', e, ['(whole run)']));

  await browser.close();
  srv.close();

  // De-duplicate findings by invariant+detail (same bug found many times).
  const seen = new Map();
  for (const f of R.findings) {
    const key = f.inv + '|' + f.detail;
    if (!seen.has(key)) seen.set(key, f);
  }
  const unique = [...seen.values()];

  console.log('\n========== BUG HUNT REPORT ==========');
  if (!unique.length) {
    console.log('No invariant violations found. ✓');
    console.log(`(${trials * seqLen * FORMATS_TO_HUNT.length} move-checks across ${covered} format(s))`);
    process.exit(0);
  }
  console.log(`${unique.length} distinct issue(s) found:\n`);
  unique.forEach((f, i) => {
    console.log(`${i + 1}. [${f.inv}] ${f.detail}`);
    console.log(`   repro: ${f.seq.join(' → ')}`);
  });
  console.log('\nThese are candidate bugs — reproduce, judge, and fix (not auto-merged).');
  process.exit(1);
})().catch(e => { console.error('FATAL', e.stack || e); process.exit(2); });
