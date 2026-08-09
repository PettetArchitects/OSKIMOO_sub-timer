#!/usr/bin/env node
// ===========================================================================
// Sub Timer — smoke test harness
// ---------------------------------------------------------------------------
// Boots index.html in a headless browser and walks the core coach journeys:
// team setup → game clock → subs/undo → Plan page (keeper + pick-starters) →
// half-time carry-over → summary, plus a non-keeper sport. It captures console
// / page errors (filtering known offline-CDN noise), screenshots every step,
// prints a pass/fail report, and exits non-zero on any failure so CI and the
// smoke-tester agent can gate on it.
//
//   node test/smoke.mjs                 # run everything
//   SMOKE_BROWSER=/path/to/chrome ...   # override the browser binary
//   SMOKE_HEADED=1 node test/smoke.mjs  # watch it run
//
// No app dependency: serves the repo over a throwaway HTTP server and resolves
// Playwright from either local node_modules or a global install.
// ===========================================================================
import http from 'node:http';
import { readFile, mkdir, writeFile, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { extname, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SHOTS = join(__dirname, 'screenshots');

// --- resolve Playwright from local node_modules OR a global install --------
async function loadChromium() {
  try { return (await import('playwright')).chromium; } catch {}
  try { return (await import('playwright-core')).chromium; } catch {}
  const require = createRequire(import.meta.url);
  const candidates = [
    process.env.PLAYWRIGHT_PATH,
    '/opt/node22/lib/node_modules/playwright',
    '/usr/local/lib/node_modules/playwright',
    '/usr/lib/node_modules/playwright',
  ].filter(Boolean);
  for (const p of candidates) { try { return require(p).chromium; } catch {} }
  throw new Error('Playwright not found. Install it with:\n  npm install\n  npx playwright install chromium');
}
function browserExecutable() {
  if (process.env.SMOKE_BROWSER && existsSync(process.env.SMOKE_BROWSER)) return process.env.SMOKE_BROWSER;
  for (const p of ['/opt/pw-browsers/chromium-1194/chrome-linux/chrome']) if (existsSync(p)) return p;
  return undefined; // fall back to Playwright's managed browser
}

// --- tiny static file server -----------------------------------------------
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml',
  '.css': 'text/css', '.webmanifest': 'application/manifest+json' };
function startServer() {
  return new Promise((resolve) => {
    const srv = http.createServer(async (req, res) => {
      try {
        let p = decodeURIComponent((req.url || '/').split('?')[0]);
        if (p === '/' || p === '') p = '/index.html';
        const fp = join(ROOT, p);
        if (!fp.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
        const buf = await readFile(fp);
        res.writeHead(200, { 'content-type': MIME[extname(fp)] || 'application/octet-stream' });
        res.end(buf);
      } catch { res.writeHead(404); res.end('not found'); }
    });
    srv.listen(0, '127.0.0.1', () => resolve({ srv, port: srv.address().port }));
  });
}

// --- known-noise filter (offline CDNs, fonts, icons, service worker) -------
const NOISE = /ERR_CERT|Failed to load resource|ERR_NAME|ERR_CONNECTION|ERR_INTERNET|ERR_ABORTED|net::|supabase|lucide|gstatic|googleapis|unpkg|jsdelivr|cdn|three|favicon|manifest|ServiceWorker|sw\.js|the server responded with a status/i;

// --- runner state ----------------------------------------------------------
const R = { checks: [], errors: [] };
const chk = (name, ok, extra = '') => {
  R.checks.push({ name, ok: !!ok });
  console.log(`  ${ok ? '✓' : '✗'} ${name}${extra ? '  ' + extra : ''}`);
  return !!ok;
};

// --- helpers ---------------------------------------------------------------
async function bootstrap(page, { sport = 'soccer', onField = 7, name = 'Smoke FC', needGk = true } = {}) {
  await page.evaluate(({ sport, onField, name, needGk }) => {
    newTeam(); pickSport(sport);
    const keys = (typeof SPORTS !== 'undefined' && SPORTS[sport] && SPORTS[sport].formats) || Object.keys(FORMATS);
    const f = keys.find(k => FORMATS[k] && FORMATS[k].onField === onField && (!needGk || FORMATS[k].hasGk))
      || keys.find(k => FORMATS[k] && (!needGk || FORMATS[k].hasGk)) || keys[0];
    pickFormat(f, sport);
    fillSampleSquad();
    const inp = document.getElementById('teamNameInput'); if (inp) inp.value = name;
    saveAndBack();
    selectTeam(teams[teams.length - 1].id);
    startFromSquad(); if(typeof finishSetupSteps==="function")finishSetupSteps();
  }, { sport, onField, name, needGk });
  await page.waitForTimeout(300);
}
const screenText = (page, id) => page.evaluate((id) => {
  const el = document.getElementById(id); return el ? el.innerText : '';
}, id);
async function shot(page, label) {
  try { await page.screenshot({ path: join(SHOTS, `${String(R.shotN = (R.shotN || 0) + 1).padStart(2, '0')}-${label}.png`) }); } catch {}
}

// --- scenarios -------------------------------------------------------------
const SCENARIOS = [
  ['load + globals', async (page) => {
    await page.waitForFunction(() => typeof newTeam === 'function' && typeof FORMATS === 'object', { timeout: 8000 });
    chk('app globals present', true);
    chk('home screen rendered', await page.evaluate(() => !!document.querySelector('button, .chip, [onclick]')));
    await shot(page, 'home');
  }],

  ['soccer setup → Plan: keeper + pick-starters (pre-kickoff)', async (page) => {
    await bootstrap(page, { sport: 'soccer', onField: 7 });
    chk('game screen has on-field XI', await page.evaluate(() => G && G.on && G.on.length === Math.min(FORMATS[curFmt].onField, avail.length)));
    chk('pre-kickoff = setup phase', await page.evaluate(() => planSetupPhase() === true));
    await page.evaluate(() => switchToView('plan'));
    await page.waitForTimeout(500);
    const html = await page.evaluate(() => document.getElementById('planRosterOverview').innerHTML);
    chk('keeper picker present (GK sport)', /Keeper/.test(html));
    chk('"Clear field — pick starters" present', /Clear field/.test(html));
    // empty the pitch, then tap players back to full
    await page.evaluate(() => planClearField());
    const cleared = await page.evaluate(() => ({ on: G.on.length, pick: _pickStarters }));
    chk('clear field empties the pitch', cleared.on === 0 && cleared.pick === true);
    await page.evaluate(() => { const n = FORMATS[curFmt].onField; while (G.on.length < n && G.bench.length) planAddStarter(G.bench[0]); planFinishStarters(); });
    const filled = await page.evaluate(() => ({ on: G.on.length, n: FORMATS[curFmt].onField, gkOn: G.on.includes(G.gk), pairs: (G.pairs || []).length }));
    chk('pick-starters fills field to onField', filled.on === filled.n);
    chk('keeper valid + rotation rebuilt', filled.gkOn && filled.pairs > 0);
    chk('no NaN on Plan page', !/\bNaN\b/.test(await screenText(page, 'subOrderOv')));
    await shot(page, 'plan-pick');
    // pick ANY player as keeper — a benched pick swaps onto the field
    const res = await page.evaluate(() => {
      const benchIdx = G.bench[G.bench.length - 1];
      const prevGk = G.gk, prevOn = G.on.length;
      setPlanKeeper(benchIdx);
      return { benchIdx, prevGk, gk: G.gk, on: G.on.length, gkOn: G.on.includes(G.gk), oldBenched: G.bench.includes(prevGk), prevOn };
    });
    chk('benched player becomes keeper, on field', res.gk === res.benchIdx && res.gkOn);
    chk('field size preserved on keeper swap', res.on === res.prevOn);
    chk('displaced keeper sent to bench', res.oldBenched);
    await shot(page, 'keeper-any');
  }],

  // Regression (v2.7.95): building a line-up from scratch while the scrub bar is
  // parked on a future-sub preview used to desync the pitch/chips/keeper from the
  // real line-up — players you never picked showed on the field and the wrong
  // keeper got the projected minutes. Editing must snap the view back to LIVE so
  // what you see equals what you built.
  ['edit-while-scrubbed stays in sync (no phantom players)', async (page) => {
    await bootstrap(page, { sport: 'soccer', onField: 7, name: 'Scrub FC' });
    await page.evaluate(() => switchToView('plan'));
    await page.waitForTimeout(400);
    const r = await page.evaluate(() => {
      // Park the scrub bar on a future preview (the trigger condition).
      if (typeof planScrubStep === 'function') planScrubStep(1);
      const scrubbedAway = (typeof _planScrubIdx !== 'undefined') && _planScrubIdx !== 0;
      // Build a line-up from scratch while (previously) scrubbed.
      planClearField();
      const bench = [...G.bench];
      for (const idx of bench.slice(0, 6)) planAddStarter(idx);
      const st = getPlanScrubState();
      return {
        scrubbedAway,
        backToLive: st.isLive === true && _planScrubIdx === 0,
        match: JSON.stringify(G.on) === JSON.stringify(st.on),
        gkOnField: G.gk == null || G.on.includes(G.gk),
      };
    });
    chk('reproduced the scrubbed-preview condition', r.scrubbedAway);
    chk('editing snaps the view back to LIVE', r.backToLive);
    chk('pitch/chips match the built line-up (no phantom players)', r.match);
    chk('keeper is on the field', r.gkOnField);
    await shot(page, 'edit-while-scrubbed');
  }],

  // Regression (v2.7.96): the Next/Prev sub buttons used to redraw the pitch but
  // not the ON FIELD chips, so a preview step showed the after-sub XI on the
  // pitch while the chips stayed on the starters — reading as "a player dropped
  // off the field". Stepping back to LIVE redrew everything ("Prev shows the
  // full"). This is the coach demoing a custom line-up → auto rotation. The
  // pitch and chips must never contradict: at LIVE they match; on a preview the
  // editable chips hide rather than show a stale list.
  ['Next/Prev sub: pitch and chips never contradict', async (page) => {
    await bootstrap(page, { sport: 'soccer', onField: 7, name: 'Scrub2 FC' });
    await page.evaluate(() => switchToView('plan'));
    await page.waitForTimeout(400);
    // Build a custom starting line-up first (the coach's plan starting point).
    await page.evaluate(() => { planClearField(); const n = FORMATS[curFmt].onField; while (G.on.length < n && G.bench.length) planAddStarter(G.bench[0]); });
    const read = () => page.evaluate(() => {
      const st = getPlanScrubState();
      const html = document.getElementById('planRosterOverview').innerHTML;
      const chipIdx = [...html.matchAll(/planRemoveStarter\((\d+)\)/g)].map(m => +m[1]);
      return { isLive: st.isLive, pitch: st.on.map(i => avail[i]), chipsShown: chipIdx.length > 0, chips: chipIdx.map(i => avail[i]) };
    });
    const live = await read();
    chk('at LIVE, chips match the pitch', live.isLive && JSON.stringify(live.pitch) === JSON.stringify(live.chips));
    await page.evaluate(() => planScrubStep(1));
    const preview = await read();
    chk('on a preview step, stale chips are hidden (not contradicting the pitch)', preview.isLive === false && preview.chipsShown === false);
    await page.evaluate(() => planScrubStep(-1));
    const back = await read();
    chk('Prev back to LIVE restores the full line-up, chips match', back.isLive && JSON.stringify(back.pitch) === JSON.stringify(back.chips) && back.chips.length === 7);
    await shot(page, 'next-prev-sync');
  }],

  // Regression (v2.7.97): changing the keeper rebuilt the rotation pairs but did
  // NOT invalidate the projected-minutes timeline, so the panel replayed the old
  // keeper — crediting a full game's minutes to an outfielder while the real
  // keeper sat lower. The keeper is never subbed, so they must be the single
  // highest projected-minutes player.
  ['keeper gets full projected minutes after a keeper change', async (page) => {
    await bootstrap(page, { sport: 'soccer', onField: 7, name: 'Proj FC' });
    await page.evaluate(() => switchToView('plan'));
    await page.waitForTimeout(400);
    const r = await page.evaluate(() => {
      // Build a custom line-up, then make a NON-default on-field player the keeper.
      planClearField();
      const n = FORMATS[curFmt].onField; while (G.on.length < n && G.bench.length) planAddStarter(G.bench[0]);
      const target = G.on.find(i => i !== G.gk);
      setPlanKeeper(target);
      const keeperName = avail[G.gk];
      const pt = computeProjectedMinutes();
      const rows = Object.entries(pt).map(([nm, sec]) => ({ nm, m: Math.round(sec / 60) })).sort((a, b) => b.m - a.m);
      const maxGame = cfg.hm * getSport(currentTeam).periodCount;
      return { keeperName, keeperMins: Math.round((pt[keeperName] || 0) / 60), top: rows[0], maxGame, anyZero: rows.some(x => x.m === 0) };
    });
    chk('keeper is the top projected-minutes player', r.top.nm === r.keeperName);
    chk('keeper is credited the full game', r.keeperMins === r.maxGame);
    chk('projection is non-empty (no all-zeros)', !r.anyZero);
    await shot(page, 'keeper-projected-minutes');
  }],

  // Regression (v2.7.98): the Equal-time rotation sorted only by minutes, tying
  // on array order — so it pulled/returned the same players (uneven spread) and
  // benched someone one interval after they came on. Fair tiebreakers (off = on
  // longest; on = waiting longest) make minutes converge. For a squad where even
  // is achievable, the outfield spread should be ~0 and nobody bounced.
  ['Equal-time rotation evens outfield minutes (no churn)', async (page) => {
    await bootstrap(page, { sport: 'soccer', onField: 7, name: 'Even FC' });
    await page.evaluate(() => switchToView('plan'));
    await page.waitForTimeout(400);
    const r = await page.evaluate(() => {
      // True Equal-time: 'fair' strategy, no matched pairs.
      G.subStrategy = 'fair'; G.pairs = [];
      _planTimeline = null; buildPlanTimeline();
      // churn: a player SUBBED ON at one event and subbed OFF at the very next.
      // Starters (initialOn) don't count — leave their "came on" index undefined
      // so their first real sub-off isn't mistaken for churn.
      const ev = _planTimeline.events.filter(e => !e.past);
      const onAt = {};
      let churn = 0;
      ev.forEach((e, idx) => {
        (e.off || []).forEach(i => { if (onAt[i] === idx - 1) churn++; });
        (e.on || []).forEach(i => { onAt[i] = idx; });
      });
      const pt = computeProjectedMinutes();
      const gk = avail[G.gk];
      const outfield = Object.entries(pt).filter(([n]) => n !== gk).map(([, sec]) => Math.round(sec / 60));
      const spread = Math.max(...outfield) - Math.min(...outfield);
      return { spread, churn, outfield };
    });
    chk('outfield minutes are even (spread <= 5m)', r.spread <= 5, `(spread ${r.spread}m)`);
    chk('no player benched right after coming on', r.churn === 0, `(churn ${r.churn})`);
    await shot(page, 'equal-time-even');
  }],

  // Regression (v2.7.99): picking an outfielder as keeper then tapping Auto-fill
  // stranded the displaced pure goalkeeper in an outfield slot (e.g. right-mid)
  // while better-fit bench players sat. The keeper is a manual pick; a pure GK
  // (tagged only GK) must never be auto-placed outfield when outfielders are free.
  ['auto-fill never strands a pure keeper in an outfield slot', async (page) => {
    const r = await page.evaluate(() => {
      localStorage.clear(); teams = loadTeams(); if (G) { G.running = false; if (G.raf) { try { cancelAnimationFrame(G.raf); } catch (e) {} } } G = null;
      newTeam(); pickSport('soccer'); pickFormat('7v7', 'soccer'); fillSampleSquad();
      const p = editingTeam.players;
      editingTeam.positions = {};
      // Alex = pure GK; everyone else has an outfield role.
      Object.assign(editingTeam.positions, {
        [p[0]]: ['GK'], [p[1]]: ['DEF'], [p[2]]: ['DEF'], [p[3]]: ['MID'],
        [p[4]]: ['MID'], [p[5]]: ['MID'], [p[6]]: ['FWD'], [p[7]]: ['DEF'], [p[8]]: ['FWD'],
      });
      document.getElementById('teamNameInput').value = 'GK FC';
      saveAndBack(); selectTeam(teams[teams.length - 1].id); startFromSquad(); if(typeof finishSetupSteps==="function")finishSetupSteps(); switchToView('plan');
      // Pick an OUTFIELDER (a midfielder) as keeper, then auto-fill.
      setPlanKeeper(avail.indexOf(p[4]));
      planAutoFillStarters();
      const positions = getPositions();
      const pureGkName = p[0];
      const onIdx = G.on.findIndex(i => avail[i] === pureGkName);
      const onFieldSlot = onIdx >= 0 ? positions[onIdx].label : null;
      return {
        keeperIsChosen: avail[G.gk] === p[4],
        pureGkOnField: onIdx >= 0,
        pureGkSlot: onFieldSlot,
        onCount: G.on.length, onField: FORMATS[curFmt].onField,
      };
    });
    chk('chosen keeper is honoured', r.keeperIsChosen);
    chk('field is full', r.onCount === r.onField);
    chk('displaced pure keeper is benched, not stranded outfield', !r.pureGkOnField, r.pureGkSlot ? `(was at ${r.pureGkSlot})` : '');
    await shot(page, 'keeper-autofill');
  }],

  // v2.9.17: the setup ritual as explicit pages — squad → keeper → shape → s4
  // (owner directive). Engine proposes; each page is a one-tap review.
  ['setup steps: squad → keeper page → shape page → field', async (page) => {
    const r = await page.evaluate(() => {
      selectTeam(teams[teams.length - 1].id);
      startFromSquad();
      const onGk = document.getElementById('gkStep').classList.contains('active');
      const chips = document.querySelectorAll('#gkStepGrid .chip').length;
      const other = G.on.find((i) => i !== G.gk);
      const chip = [...document.querySelectorAll('#gkStepGrid .chip')].find((c) => c.textContent.includes(fn(avail[other])));
      if (chip) chip.click();
      const gkChanged = G.gk === other;
      gkStepNext();
      const onShape = document.getElementById('shapeStep').classList.contains('active');
      const tiles = [...document.querySelectorAll('#shapeStepGrid .chip')];
      const otherTile = tiles.find((t) => t.textContent !== curFormation);
      const target = otherTile ? otherTile.textContent : null;
      if (otherTile) otherTile.click();
      const shapeChanged = target ? curFormation === target : true;
      shapeStepNext();
      const onGame = document.getElementById('s4').classList.contains('active');
      return { onGk, chips, gkChanged, onShape, shapeChanged, onGame };
    });
    chk('squad Next lands on the keeper page', r.onGk && r.chips > 0);
    chk('keeper changes from the keeper page', r.gkChanged);
    chk('keeper Next lands on the shape page', r.onShape);
    chk('shape changes from the shape page', r.shapeChanged);
    chk('shape Next lands on the game screen', r.onGame);
    await shot(page, 'setup-steps');
  }],

  // v2.9.16: the keeper door — the game screen's own gloves control, visible
  // exactly in the ritual window (pre-kickoff + breaks), hidden mid-play.
  // Routes through setPlanKeeper, so benched picks displace the old keeper.
  ['keeper door: pick from the pitch pre-kickoff', async (page) => {
    const r = await page.evaluate(() => {
      const btn = document.getElementById('gkToggle');
      const shownPreKick = btn && btn.style.display !== 'none';
      openGkPick();
      const ovShown = document.getElementById('gkPickOv').classList.contains('show');
      const chips = [...document.querySelectorAll('#gkPickGrid .chip')];
      // pick a BENCHED player as keeper — must come on, old keeper must step off
      const oldGk = G.gk;
      const benchIdx = (G.bench || [])[0];
      pickGk(benchIdx);
      return {
        shownPreKick, ovShown, chipCount: chips.length,
        newGk: G.gk, benchIdx, oldGk,
        newKeeperOnField: G.on.includes(benchIdx),
        oldKeeperOff: !G.on.includes(oldGk),
        closed: !document.getElementById('gkPickOv').classList.contains('show'),
        label: document.getElementById('gkToggle').textContent,
      };
    });
    chk('GK pill shows on the pitch pre-kickoff', r.shownPreKick);
    chk('keeper picker opens with the full squad', r.ovShown && r.chipCount > 0);
    chk('benched pick takes the gloves and comes on', r.newGk === r.benchIdx && r.newKeeperOnField);
    chk('displaced keeper steps off the field', r.oldKeeperOff);
    chk('GK pill names the new keeper', r.closed && /GK ·/.test(r.label));
    const mid = await page.evaluate(() => {
      tog(); renderG(); // clock running — ritual window closed
      const hidden = document.getElementById('gkToggle').style.display === 'none';
      tog(); renderG();
      return hidden;
    });
    chk('GK pill hides once the clock runs', mid);
  }],

  ['game: start / pause clock', async (page) => {
    await page.evaluate(() => switchToView('game'));
    await page.waitForTimeout(200);
    await page.evaluate(() => { if (!G.running) tog(); });
    await page.waitForTimeout(600);
    chk('clock running after start', await page.evaluate(() => G.running === true));
    await page.evaluate(() => { if (G.running) tog(); });
    chk('clock pauses', await page.evaluate(() => G.running) === false);
    chk('no NaN on game screen', !/\bNaN\b/.test(await page.evaluate(() => document.body.innerText)));
    await shot(page, 'game');
  }],

  ['subs + undo', async (page) => {
    // advance to the first sub time and trigger a rotation
    const before = await page.evaluate(() => {
      const ns = (typeof nxtST === 'function') ? nxtST() : 5 * 60;
      G.secs = (ns || 300); G.elapsedMs = G.secs * 1000;
      return { on: [...G.on], bench: [...G.bench] };
    });
    const subbed = await page.evaluate(() => { const ok = G.bench.length > 0; if (ok) trigSub(); if (G.ps && typeof confSub === 'function') confSub(); return { on: [...G.on], hadBench: ok, lastSub: !!G.lastSub }; });
    if (subbed.hadBench) {
      chk('trigSub changed the on-field set', JSON.stringify(subbed.on) !== JSON.stringify(before.on));
      const undone = await page.evaluate(() => { if (typeof undoLastSub === 'function') undoLastSub(); return [...G.on]; });
      chk('undoLastSub restores the line-up', JSON.stringify(undone) === JSON.stringify(before.on));
    } else {
      chk('subs scenario (no bench — skipped)', true);
    }
    await shot(page, 'subs');
  }],

  ['half-time: 2nd-half line-up carries over', async (page) => {
    await page.evaluate(() => switchToView('game'));
    await page.waitForTimeout(200);
    await page.evaluate(() => { if (!G.running) tog(); const t = cfg.hm * 60; G.elapsedMs = (t - 1) * 1000; G.secs = t - 1; G.lastTs = performance.now(); });
    await page.waitForTimeout(1800);
    const brk = await page.evaluate(() => ({ atBreak: !!G.atBreak, nsi: document.getElementById('nsi').innerText }));
    chk('reached half-time break', brk.atBreak);
    // v2.9.11: the break edits ON the field and ends in the announce view — the
    // "set 2nd-half line-up" detour to the Plan page is gone (owner-stamped ritual).
    chk('break screen exposes the announce touch point', /announce/i.test(brk.nsi));
    chk('break hint no longer detours to the Plan page', !/set .*line-up/i.test(brk.nsi));
    // v2.9.16: the keeper door is part of the break ritual — pill visible, and a
    // pick through it is an EXPLICIT 2nd-half keeper (gk2Explicit).
    const gk = await page.evaluate(() => {
      const shown = document.getElementById('gkToggle').style.display !== 'none';
      openGkPick();
      const other = (G.on || []).find(i => i !== G.gk);
      pickGk(other);
      return { shown, picked: other, gk: G.gk, explicit: !!gk2Explicit };
    });
    chk('GK pill shows at the break', gk.shown);
    chk('break pick via the pill is an explicit 2nd-half keeper', gk.gk === gk.picked && gk.explicit);
    await shot(page, 'halftime');
    // set a distinct 2nd-half keeper + custom XI on the Plan, then start the period
    await page.evaluate(() => openSubOrder()); await page.waitForTimeout(400);
    const planned = await page.evaluate(() => {
      const other = G.on.find(i => i !== G.gk); setPlanKeeper(other);
      planClearField();
      const n = FORMATS[curFmt].onField; while (G.on.length < n && G.bench.length) planAddStarter(G.bench[0]);
      planFinishStarters();
      return { gk: G.gk, on: [...G.on] };
    });
    await page.evaluate(() => startNextPeriod()); await page.waitForTimeout(300);
    const p2 = await page.evaluate(() => ({ half: G.half, gk: G.gk, on: [...G.on], gkOn: G.on.includes(G.gk), running: G.running }));
    chk('2nd period started', p2.half === 2 && p2.running);
    chk('2nd-half keeper carried into period', p2.gk === planned.gk && p2.gkOn);
    chk('2nd-half line-up carried into period', JSON.stringify(p2.on) === JSON.stringify(planned.on));
  }],

  // Regression (v2.8.0): at half-time the keeper picker was gated on the sub
  // scrub bar being on LIVE, so stepping the preview forward made it DISAPPEAR
  // — a coach couldn't change the keeper for the 2nd half. The picker (a setup
  // control) must stay available throughout the break regardless of scrub
  // position; and the 1st-half keeper should stay on the field in the 2nd half.
  ['half-time: keeper picker stays available even when sub preview is stepped', async (page) => {
    // Fully reset first: a prior scenario may leave a game running with a live
    // animation frame, which would fight this scenario's manual clock control.
    await page.evaluate(() => { if (typeof G !== 'undefined' && G) { G.running = false; if (G.raf) { try { cancelAnimationFrame(G.raf); } catch (e) {} G.raf = null; } G = null; } localStorage.clear(); });
    await bootstrap(page, { sport: 'soccer', onField: 7, name: 'HT Keeper FC' });
    const r = await page.evaluate(() => {
      const keeperShown = () => /Keeper/.test(document.getElementById('planRosterOverview').innerHTML);
      // Cancel any animation-frame loop a prior scenario left running, so the
      // manual clock-jump below isn't fought by a stray tickLoop.
      if (G.raf) { try { cancelAnimationFrame(G.raf); } catch (e) {} G.raf = null; }
      G.running = false; G.lastTs = null;
      // jump to the break
      G.secs = cfg.hm * 60; G.elapsedMs = cfg.hm * 60 * 1000;
      advH();
      switchToView('plan');
      const atBreak = !!G.atBreak;
      const shownLive = keeperShown();
      // step the sub preview forward (the trigger) — picker must NOT vanish
      if (typeof planScrubStep === 'function') planScrubStep(1);
      const scrubbed = _planScrubIdx !== 0;
      const shownScrubbed = keeperShown();
      // change the keeper to the 1st-half keeper's replacement, confirm carry-over
      const h1keeper = G.gk;
      const newK = G.on.find(i => i !== G.gk);
      setPlanKeeper(newK);
      startNextPeriod();
      return {
        atBreak, shownLive, scrubbed, shownScrubbed,
        h2started: G.half === 2 && G.running,
        newKeeperKept: G.gk === newK && G.on.includes(G.gk),
        h1keeperOnFieldH2: G.on.includes(h1keeper),
      };
    });
    chk('reached the break', r.atBreak);
    chk('keeper picker shown at break (LIVE)', r.shownLive);
    chk('keeper picker STILL shown after stepping the sub preview', r.scrubbed && r.shownScrubbed);
    chk('2nd half started with the chosen new keeper', r.h2started && r.newKeeperKept);
    chk('1st-half keeper stays on the field in the 2nd half', r.h1keeperOnFieldH2);
    await shot(page, 'halftime-keeper');
  }],

  ['summary screen renders', async (page) => {
    await page.evaluate(() => { G.half = getSport(currentTeam).periodCount; if (typeof advH === 'function') advH(); });
    await page.waitForTimeout(400);
    const sum = await page.evaluate(() => { const c = document.getElementById('sumCard'); return c ? c.innerText : ''; });
    chk('summary shows playing-time rows', /[′'][0-9]/.test(sum) || /Playing Time/i.test(sum), `(${sum.slice(0, 40).replace(/\n/g, ' ')}…)`);
    chk('no NaN in summary', !/\bNaN\b/.test(sum));
    await shot(page, 'summary');
  }],

  // v2.9.18: a goal whose "Who scored?" was skipped mid-game is nameable from
  // the summary's game log (owner report — the scorer is never locked out).
  ['summary: name a skipped goal’s scorer from the game log', async (page) => {
    const r = await page.evaluate(() => {
      // fixture: an unattributed goal in the log (the coach skipped the picker)
      G.log.push({ type: 'goal', who: 'us', time: 30, half: 1 });
      const opp = document.getElementById('sumOpponent');
      opp.value = 'Typed Opponent';                       // must survive the repaint
      renderSumLog();
      const btn = [...document.querySelectorAll('#sumLog button')].find((b) => /name the scorer/i.test(b.textContent));
      if (!btn) return { hasBtn: false };
      btn.click();                                        // opens the live picker
      const ovShown = document.getElementById('scorerOv').classList.contains('show');
      const chip = document.querySelector('#scorerGrid .chip');
      const picked = chip ? chip.querySelector('div').textContent : null;
      if (chip) chip.click();                             // scorer step
      skipGoalStep();                                     // no assist
      const goal = G.log.find((e) => e.type === 'goal' && e.time === 30);
      const rowText = document.getElementById('sumLog').innerText;
      return { hasBtn: true, ovShown, picked, savedScorer: goal && goal.scorer, rowShows: new RegExp(picked + ' scored').test(rowText), oppSurvived: document.getElementById('sumOpponent').value === 'Typed Opponent' };
    });
    chk('unattributed goal offers "name the scorer" on the summary', r.hasBtn && r.ovShown);
    chk('summary pick writes the scorer to the log', !!r.picked && r.savedScorer === r.picked);
    chk('the log card repaints with the scorer named', r.rowShows);
    chk('typed opponent text survives the repaint', r.oppSurvived);
  }],

  // v2.9.13: player of the match (s5 gap ①) — huddle-fast chip pick on the
  // summary, persisted into the match record (and into the log for cloud sync),
  // shown in the history detail.
  ['player of the match: pick, save, reread from history', async (page) => {
    const picked = await page.evaluate(() => {
      const chips = [...document.querySelectorAll('#potmChips .ui-chip')];
      if (!chips.length) return { ok: false };
      chips[0].click();
      const name = G.potm;
      const sel = document.querySelector('#potmChips .ui-chip[aria-pressed="true"]');
      return { ok: true, name, chipCount: chips.length, selShown: !!sel };
    });
    chk('potm chips render on the summary (one per player)', picked.ok && picked.chipCount > 0);
    chk('tapping a chip selects the player of the match', !!picked.name && picked.selShown);
    const saved = await page.evaluate(() => {
      saveMatch();
      const m = loadMatches()[0];
      return { potm: m.potm, logHasPotm: (m.log || []).some(e => e && e.type === 'potm'), reader: _matchPotm(m) };
    });
    chk('player of the match persists into the saved match', saved.potm === picked.name);
    chk('potm rides in the log for cloud sync', saved.logHasPotm && saved.reader === picked.name);
    const detail = await page.evaluate(() => {
      showMatchDetail(loadMatches()[0]);
      return document.getElementById('sumMatch').innerText;
    });
    chk('history detail shows the player of the match', /Player of the match/i.test(detail));
    await shot(page, 'potm');
  }],

  // v2.9.15: edit-from-history (s5 gap ②) — the deferred fields (opponent,
  // location, scorers, potm) are editable after save; the facts are not.
  ['edit-from-history: enrich a saved match from the car park', async (page) => {
    const r = await page.evaluate(() => {
      // fixture: give the saved match an unattributed goal to name a scorer for
      const all = loadMatches();
      all[0].log.push({ type: 'goal', who: 'us', time: 60, half: 1 });
      saveMatches(all);
      showMatchDetail(loadMatches()[0]);
      histEditStart();
      const editing = !!document.getElementById('histOpponent');
      document.getElementById('histOpponent').value = 'Wanderers';
      document.getElementById('histLocation').value = 'Blackman Park';
      // name the scorer via the inline strip
      const goalBtn = [...document.querySelectorAll('#sumLog button')].find(b => /name the scorer/i.test(b.textContent));
      if (goalBtn) goalBtn.click();
      const chip = [...document.querySelectorAll('#sumLog .ui-chip')].find(c => c.textContent !== 'No scorer');
      const scorerName = chip ? chip.textContent : null;
      if (chip) chip.click();
      // re-grab the inputs (renderMatchDetail rebuilt them), then save
      document.getElementById('histOpponent').value = 'Wanderers';
      document.getElementById('histLocation').value = 'Blackman Park';
      histEditSave();
      const m = loadMatches()[0];
      const goal = m.log.find(e => e.type === 'goal' && e.who === 'us');
      return { editing, scorerName, opponent: m.opponent, location: m.location, savedScorer: goal && goal.scorer, backToRead: !document.getElementById('histOpponent') };
    });
    chk('edit mode opens from history detail', r.editing);
    chk('opponent + location editable after save', r.opponent === 'Wanderers' && r.location === 'Blackman Park');
    chk('goal scorer named from history', !!r.scorerName && r.savedScorer === r.scorerName);
    chk('save returns to the read-only view', r.backToRead);
    const cancel = await page.evaluate(() => {
      histEditStart();
      document.getElementById('histOpponent').value = 'SHOULD-NOT-STICK';
      histEditCancel();
      return loadMatches()[0].opponent;
    });
    chk('cancel discards edits', cancel === 'Wanderers');
    await shot(page, 'edit-history');
  }],

  // v2.9.20: the bug report button — one tap sends the saved match + matched
  // replay flow to the cloud. Supabase stubbed; asserts the payload shape.
  ['bug report: send a saved game for review', async (page) => {
    const r = await page.evaluate(async () => {
      showMatchDetail(loadMatches()[0]);
      const btn = [...document.querySelectorAll('#s5 .sec button')].find((b) => /send this game for review/i.test(b.textContent));
      if (!btn) return { hasBtn: false };
      btn.click();
      const ovShown = document.getElementById('bugReportOv').classList.contains('show');
      document.getElementById('bugNote').value = 'The subs looked wrong in H2';
      if (!sb) return { hasBtn: true, ovShown, noCloud: true };   // CDN blocked — transport untestable here
      let captured = null;
      const realFrom = sb.from.bind(sb);
      sb.from = (t) => ({ insert: async (row) => { captured = { table: t, row }; return { error: null }; } });
      await sendBugReport();
      sb.from = realFrom;
      return {
        hasBtn: true, ovShown,
        table: captured && captured.table,
        hasMatch: !!(captured && captured.row.match && captured.row.match.log),
        note: captured && captured.row.note,
        version: captured && captured.row.app_version,
        status: document.getElementById('bugStatus').textContent,
      };
    });
    chk('history detail offers "send this game for review"', r.hasBtn && r.ovShown);
    if (r.noCloud) { chk('bug-report transport (no cloud in this env — skipped)', true); return; }
    chk('report posts to bug_reports with the full match', r.table === 'bug_reports' && r.hasMatch);
    chk('note and app version ride along', /subs looked wrong/.test(r.note || '') && /^v\d/.test(r.version || ''));
    chk('coach sees the sent confirmation', /sent/i.test(r.status));
  }],

  // v2.9.19: the half-time override — the ref's whistle beats the clock. Tap
  // the period label → confirm → the period ends at the current clock via the
  // same advH path as the natural expiry. Fresh bootstrap: no state bleed.
  ['half-time override: the period label ends the half early', async (page) => {
    // One synchronous evaluate for the WHOLE journey: cross-evaluate gaps let
    // leftover rAF/timer state from earlier scenarios advance the game between
    // steps (observed: a fresh game mutating to half 2 across a 250ms gap).
    const r = await page.evaluate(() => {
      if (typeof G !== 'undefined' && G) { G.running = false; if (G.raf) { try { cancelAnimationFrame(G.raf); } catch {} G.raf = null; } }
      G = null; localStorage.clear(); teams = loadTeams();
      newTeam(); pickSport('soccer'); pickFormat('7v7', 'soccer'); fillSampleSquad();
      document.getElementById('teamNameInput').value = 'Override FC'; saveAndBack();
      selectTeam(teams[teams.length - 1].id);
      startFromSquad(); if (typeof finishSetupSteps === 'function') finishSetupSteps();
      window.confirm = () => true;                     // the coach confirms
      // wiring: the END HALF button sits in the dashboard next to PAUSE (owner
      // placement); hidden pre-kick, shown while a period is underway
      const btn = document.getElementById('gdEndHalf');
      const wired = !!btn && /endPeriodNow/.test(btn.getAttribute('onclick') || '');
      const hiddenPreKick = btn.style.display === 'none';
      const preKick = (() => { endPeriodNow(); return !G.atBreak; })(); // guard: pre-kick tap does nothing
      tog(); renderGameDash();
      const shownMidPlay = btn.style.display !== 'none' && /END HALF/i.test(btn.textContent);
      G.elapsedMs = 7 * 60 * 1000; G.secs = 7 * 60;    // 7' into a 20' half
      endPeriodNow();                                   // the tap
      const hiddenAtBreak = (renderGameDash(), btn.style.display === 'none');
      const pe = G.log.find((e) => e.type === 'period_end');
      const atBreak = !!G.atBreak, paused = !G.running;
      const again = (() => { endPeriodNow(); return G.half === 1 && !!G.atBreak; })(); // no-op at the break
      // final-period branch: 2nd half underway, whistle beats the clock → summary
      startNextPeriod();
      if (!G.running) tog();
      G.elapsedMs = 12 * 60 * 1000; G.secs = 12 * 60;
      endPeriodNow();
      const onSummary = document.getElementById('s5').classList.contains('active');
      G.running = false;                                // leave nothing ticking for later scenarios
      return { wired, hiddenPreKick, shownMidPlay, hiddenAtBreak, preKick, atBreak, paused, peTime: pe && pe.time, again, onSummary };
    });
    chk('END HALF button wired next to PAUSE', r.wired);
    chk('END HALF hidden pre-kick, shown mid-play, hidden at the break', r.hiddenPreKick && r.shownMidPlay && r.hiddenAtBreak);
    chk('pre-kickoff call is a no-op (guard)', r.preKick);
    chk('label tap ends the half at the current clock', r.atBreak && r.paused && r.peTime === 7 * 60);
    chk('tapping again at the break is a no-op', r.again);
    chk('override on the final period goes to full time (summary)', r.onSummary);
  }],

  // v2.9.22: position-time tracking + strengths adherence (owner asks, from
  // the Dragonflies review). Single evaluate per the LESSONS.md rule.
  ['position time + seating: tracked, saved, honoured', async (page) => {
    const r = await page.evaluate(() => {
      if (typeof G !== 'undefined' && G) { G.running = false; if (G.raf) { try { cancelAnimationFrame(G.raf); } catch {} G.raf = null; } }
      G = null; localStorage.clear(); teams = loadTeams();
      newTeam(); pickSport('soccer'); pickFormat('7v7', 'soccer'); fillSampleSquad();
      document.getElementById('teamNameInput').value = 'Pos FC'; saveAndBack();
      selectTeam(teams[teams.length - 1].id);
      startFromSquad(); if (typeof finishSetupSteps === 'function') finishSetupSteps();
      window.confirm = () => true;
      // kickoff seating: every tagged outfielder sits in a slot they're tagged
      // for, wherever a swap could achieve it (repairSeating ran in startFromSquad)
      const pp = getPositions();
      const fits = (pIdx, slot) => {
        const lbl = (pp[slot] && pp[slot].label) || '';
        const tag = labelToTag(lbl);
        if (!tag || tag === 'GK') return true;
        const ptags = (getPlayerPos(currentTeam, avail[pIdx]) || []).filter((t) => t !== 'GK');
        if (!ptags.length || ptags.includes(tag)) return true;
        return /^(LM|RM)$/.test(lbl) && ptags.includes('WNG');   // wide-mid accepts wingers
      };
      // "honoured" = repair reached a local optimum: no swap of two on-field
      // players would strictly reduce mismatches (some states are genuinely
      // unsatisfiable mid-rotation — e.g. both DEF-tagged kids benched together).
      const noFixableMismatch = () => {
        const idxs = []; for (let i = 1; i < G.on.length; i++) if (G.on[i] !== G.gk) idxs.push(i);
        for (const i of idxs) {
          if (fits(G.on[i], i)) continue;
          for (const j of idxs) {
            if (i === j) continue;
            const before = 1 + (fits(G.on[j], j) ? 0 : 1);
            const after = (fits(G.on[j], i) ? 0 : 1) + (fits(G.on[i], j) ? 0 : 1);
            if (after < before) return false;
          }
        }
        return true;
      };
      const kickoffMismatches = G.on.filter((p, i) => p !== G.gk && i > 0 && !fits(p, i)).length;
      // run half the game with auto subs; accrue position seconds
      tog();
      let guard = 0; let everFixable = false;
      while (guard++ < 800 && !G.atBreak) {
        G.elapsedMs += 5000; tickSecond();
        if (G.ps) { confSub(); if (!noFixableMismatch()) everFixable = true; }
      }
      const postSubOptimal = !everFixable;
      const gkName = avail[G.gk];
      const gkAccruesGK = (G.ppt[gkName] && G.ppt[gkName].GK > 0) || false;
      const someoneHasPos = Object.values(G.ppt).some((m) => Object.keys(m).some((k) => k !== 'GK' && m[k] > 60));
      // finish and save; breakdown must reach the record and the summary DOM
      G.half = getSport(currentTeam).periodCount; advH();
      const sumHasBreakdown = /[A-Z]{2,3} \d+′/.test(document.getElementById('sumCard').innerText);
      saveMatch();
      const saved = loadMatches()[0].playingTime.some((p) => p.pos && Object.keys(p.pos).length);
      return { kickoffMismatches, postSubOptimal, gkAccruesGK, someoneHasPos, sumHasBreakdown, saved };
    });
    chk('kickoff seating honours position tags', r.kickoffMismatches === 0);
    chk('engine subs re-seat by tags', r.postSubOptimal);
    chk('position seconds accrue per slot label', r.gkAccruesGK && r.someoneHasPos);
    chk('summary shows where each player played', r.sumHasBreakdown);
    chk('position breakdown saved with the match', r.saved);
  }],

  // v2.9.21: keeper handover credit (owner rule, from the Dragonflies review).
  // Broken behaviour: after a HT gloves swap the ex-keeper had zero outfield
  // seconds, was never the longest-on, and played ALL of H2 while others churned.
  ['keeper handover: ex-keeper rejoins the normal cycle', async (page) => {
    const r = await page.evaluate(() => {
      if (typeof G !== 'undefined' && G) { G.running = false; if (G.raf) { try { cancelAnimationFrame(G.raf); } catch {} G.raf = null; } }
      G = null; localStorage.clear(); teams = loadTeams();
      newTeam(); pickSport('soccer'); pickFormat('7v7', 'soccer'); fillSampleSquad();
      document.getElementById('teamNameInput').value = 'Handover FC'; saveAndBack();
      selectTeam(teams[teams.length - 1].id);
      startFromSquad(); if (typeof finishSetupSteps === 'function') finishSetupSteps();
      window.confirm = () => true;
      cfg.hm = 20; cfg.sf = 5; cfg.sc = 2;
      const gkH1 = G.gk;
      tog();
      let guard = 0;
      const stepGame = () => { G.elapsedMs += 5000; tickSecond(); if (G.ps && typeof confSub === 'function') confSub(); };
      while (guard++ < 2000 && !G.atBreak) stepGame();
      // half time: hand the gloves to an on-field outfielder (the real game's path)
      const newGk = G.on.find((p) => p !== G.gk);
      swapFieldPositions(G.gk, newGk);
      const credited = (G.rotCredit && G.rotCredit[avail[gkH1]] > 0) || false;
      startNextPeriod();
      while (guard++ < 4000 && G.half === 2 && (G.running || G.atBreak === false)) {
        stepGame();
        if (!G.running && !G.atBreak) break;
      }
      const exKeeperSubbedOffH2 = G.log.some((e) => e.type === 'sub' && e.half === 2 && e.off === avail[gkH1]);
      return { gkH1: avail[gkH1], newGk: avail[newGk], credited, exKeeperSubbedOffH2,
        h2gk: avail[G.gk], mins: avail.map((n) => `${n}:${Math.round((G.pt[n] || 0) / 60)}`).join(' ') };
    });
    chk('handover credits the ex-keeper\'s rotation clock', r.credited);
    chk('ex-keeper rotates normally after the handover', r.exKeeperSubbedOffH2, `(${r.gkH1} → gloves to ${r.newGk}; minutes ${r.mins})`);
  }],

  // v2.9.23: the Settings tab — the team's game defaults (formation / strategy /
  // timing) moved out of the team editor onto their own bottom-bar tab, and
  // every control live-saves to the team. One synchronous evaluate for the whole
  // journey (bootstrap + act + assert): cross-evaluate gaps are the flake hazard.
  ['settings tab: game defaults live-save on their own screen', async (page) => {
    const r = await page.evaluate(() => {
      if (typeof G !== 'undefined' && G) { G.running = false; if (G.raf) { try { cancelAnimationFrame(G.raf); } catch {} G.raf = null; } }
      G = null; localStorage.clear(); teams = loadTeams();
      newTeam(); pickSport('soccer'); pickFormat('7v7', 'soccer'); fillSampleSquad();
      document.getElementById('teamNameInput').value = 'Settings FC'; saveAndBack();
      selectTeam(teams[teams.length - 1].id);
      // the editor is roster-only now — no Game Settings block, no prefs host
      const editorClean = !document.querySelector('#editTeam #teamPrefsSection')
        && !/Game Settings/.test(document.getElementById('editTeam').innerHTML);
      // the tab appears once a team is in context
      const hasTab = /switchToView\('settings'\)/.test(document.getElementById('bottomTabBar').innerHTML);
      switchToView('settings');
      const onScreen = document.getElementById('teamSettings').classList.contains('active');
      const tabBtn = [...document.querySelectorAll('#bottomTabBar .btb-btn')].find((b) => /Settings/.test(b.textContent));
      const highlighted = !!tabBtn && tabBtn.classList.contains('active');
      // formation tap → persists to the team (live-save, no Save button)
      const host = document.getElementById('teamPrefsSection');
      const before = getTeamPrefs(currentTeam).formation;
      const target = Object.keys(FORMATIONS[currentTeam.format]).find((n) => n !== before);
      const tile = [...host.querySelectorAll('.chip')].find((c) => c.textContent.trim() === target);
      if (tile) tile.click();
      // stepper change → persists too (re-query: each change repaints the screen)
      const hmBefore = getTeamPrefs(currentTeam).hm;
      const firstRow = document.querySelector('#teamPrefsSection .set-row');
      const plus = firstRow && [...firstRow.querySelectorAll('.st-btn')].find((b) => b.textContent === '+');
      if (plus) plus.click();
      const saved = (JSON.parse(localStorage.getItem('subTimerTeams') || '[]')).find((t) => t.name === 'Settings FC');
      return {
        editorClean, hasTab, onScreen, highlighted, target,
        savedFormation: saved && saved.prefs && saved.prefs.formation,
        savedHm: saved && saved.prefs && saved.prefs.hm, hmBefore,
        cfgHm: cfg.hm,   // no game underway → the working cfg refreshes immediately
      };
    });
    chk('team editor no longer carries the Game Settings block', r.editorClean);
    chk('Settings tab shows once a team is selected', r.hasTab);
    chk('switchToView(settings) lands on the teamSettings screen, tab highlighted', r.onScreen && r.highlighted);
    chk('formation tap live-saves to the team', !!r.target && r.savedFormation === r.target);
    chk('stepper change live-saves to the team', r.savedHm === r.hmBefore + 1);
    chk('with no game underway the working cfg picks the change up', r.cfgHm === r.hmBefore + 1);
  }],

  ['non-keeper sport (netball)', async (page) => {
    await page.evaluate(() => { localStorage.clear(); });
    await page.reload({ waitUntil: 'load' });
    await page.waitForFunction(() => typeof newTeam === 'function', { timeout: 8000 });
    await bootstrap(page, { sport: 'netball', onField: 7, name: 'Smoke Net', needGk: false });
    chk('netball game started', await page.evaluate(() => G && G.on && G.on.length > 0));
    chk('netball format has no keeper', await page.evaluate(() => FORMATS[curFmt].hasGk === false));
    await page.evaluate(() => switchToView('plan')); await page.waitForTimeout(400);
    const html = await page.evaluate(() => document.getElementById('planRosterOverview').innerHTML);
    chk('no keeper control for non-GK sport', !/Keeper/.test(html));
    chk('no NaN on netball Plan', !/\bNaN\b/.test(await screenText(page, 'subOrderOv')));
    await shot(page, 'netball-plan');
  }],
];

// --- main ------------------------------------------------------------------
(async () => {
  await rm(SHOTS, { recursive: true, force: true }).catch(() => {});
  await mkdir(SHOTS, { recursive: true });
  const chromium = await loadChromium();
  const { srv, port } = await startServer();
  const BASE = `http://127.0.0.1:${port}/index.html`;
  const browser = await chromium.launch({
    executablePath: browserExecutable(),
    headless: !process.env.SMOKE_HEADED,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  page.on('console', (m) => { if (m.type() === 'error' && !NOISE.test(m.text())) R.errors.push('[console] ' + m.text()); });
  page.on('pageerror', (e) => { if (!NOISE.test(e.message)) R.errors.push('[pageerror] ' + e.message); });

  console.log(`\nSub Timer smoke — ${BASE}\n`);
  await page.goto(BASE, { waitUntil: 'load' });
  await page.waitForTimeout(800);

  for (const [name, fn] of SCENARIOS) {
    console.log(`▶ ${name}`);
    try { await fn(page); }
    catch (e) { chk(`${name} — threw`, false, e.message); await shot(page, 'ERROR-' + name.replace(/\W+/g, '-')); }
  }

  await browser.close();
  srv.close();

  // --- report --------------------------------------------------------------
  const failed = R.checks.filter((c) => !c.ok);
  const summary = {
    when: new Date().toISOString(),
    checks: R.checks.length, passed: R.checks.length - failed.length, failed: failed.length,
    consoleErrors: R.errors.length,
    failures: failed.map((f) => f.name), errors: R.errors,
  };
  await writeFile(join(SHOTS, 'summary.json'), JSON.stringify(summary, null, 2)).catch(() => {});

  console.log('\n========== SMOKE SUMMARY ==========');
  console.log(`${summary.passed}/${summary.checks} checks passed · ${R.errors.length} console error(s)`);
  if (failed.length) console.log('FAILED: ' + failed.map((f) => f.name).join(' | '));
  if (R.errors.length) console.log('CONSOLE/PAGE ERRORS:\n  ' + R.errors.join('\n  '));
  console.log(`screenshots → test/screenshots/  (summary.json written)`);
  process.exit(failed.length || R.errors.length ? 1 : 0);
})().catch((e) => { console.error('FATAL', e.stack || e); process.exit(2); });
