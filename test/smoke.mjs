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
    startFromSquad();
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
    chk('break screen exposes 2nd-half line-up touch point', /2nd-half line-up/i.test(brk.nsi));
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

  ['summary screen renders', async (page) => {
    await page.evaluate(() => { G.half = getSport(currentTeam).periodCount; if (typeof advH === 'function') advH(); });
    await page.waitForTimeout(400);
    const sum = await page.evaluate(() => { const c = document.getElementById('sumCard'); return c ? c.innerText : ''; });
    chk('summary shows playing-time rows', /[′'][0-9]/.test(sum) || /Playing Time/i.test(sum), `(${sum.slice(0, 40).replace(/\n/g, ' ')}…)`);
    chk('no NaN in summary', !/\bNaN\b/.test(sum));
    await shot(page, 'summary');
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

  ['sub schedule: per-half cadence (odd frequency)', async (page) => {
    // Regression: when cfg.sf does NOT divide evenly into cfg.hm the live timer
    // used to shift the 2nd-half sub times off a continuous whole-game timeline,
    // desyncing them from the Plan page + Settings preview (subs fired at the
    // wrong times, minutes drifted, the countdown disagreed). subTs() must now
    // return the SAME per-half cadence the coach is shown, for every half.
    const r = await page.evaluate(() => {
      const savedHm = cfg.hm, savedSf = cfg.sf;
      cfg.hm = 20; cfg.sf = 7;                 // 7 ∤ 20 → the previously-broken case
      const expect = [];                       // what updPrev() promises ("subs at 7′, 14′")
      for (let t = cfg.sf; t < cfg.hm; t += cfg.sf) expect.push(t * 60);
      if (!G) G = {};
      G.half = 1; const h1 = subTs();
      G.half = 2; const h2 = subTs();
      cfg.hm = savedHm; cfg.sf = savedSf;
      return { expect, h1, h2 };
    });
    chk('half 1 sub times = per-half preview', JSON.stringify(r.h1) === JSON.stringify(r.expect), `(${r.h1.map((s) => s / 60 + '′').join(', ')})`);
    chk('half 2 cadence restarts (matches half 1)', JSON.stringify(r.h2) === JSON.stringify(r.h1), `(${r.h2.map((s) => s / 60 + '′').join(', ')})`);
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
