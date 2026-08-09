// ===========================================================================
// Shared test harness for Sub Timer
// ---------------------------------------------------------------------------
// Sub Timer is a single-file PWA (index.html). Every suite (smoke, sports,
// edge) needs the same plumbing: serve the repo over a throwaway HTTP server,
// launch headless Chromium, capture console/page errors (minus offline-CDN
// noise), screenshot steps, tally pass/fail, and exit non-zero on failure.
// That lives here once; suites just provide a list of scenarios.
//
//   import { runSuite, bootstrap } from './harness.mjs';
//   runSuite({ title: 'my suite', scenarios: [ ['name', async (page, t) => {...}] ] });
// ===========================================================================
import http from 'node:http';
import { readFile, mkdir, writeFile, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { extname, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// --- resolve Playwright from local node_modules OR a global install --------
export async function loadChromium() {
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
export function browserExecutable() {
  if (process.env.SMOKE_BROWSER && existsSync(process.env.SMOKE_BROWSER)) return process.env.SMOKE_BROWSER;
  for (const p of [
    '/opt/pw-browsers/chromium-1223/chrome-linux/chrome',
    '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  ]) if (existsSync(p)) return p;
  return undefined; // fall back to Playwright's managed browser
}

// --- tiny static file server -----------------------------------------------
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml',
  '.css': 'text/css', '.webmanifest': 'application/manifest+json' };
export function startServer() {
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
// page.reload({waitUntil:'load'}) intermittently hangs in CI (the netball
// smoke flake) — and a fallback goto can then race the zombie reload
// ("interrupted by another navigation"). So: no reload at all. Park on
// about:blank (cleanly kills any pending navigation), then goto the URL
// fresh, with retries. Identical semantics for a single-file app.
export async function safeReload(page) {
  const url = page.url();
  try { await page.goto('about:blank', { timeout: 10000 }); } catch { /* nothing to kill */ }
  for (let i = 0; i < 3; i++) {
    try { await page.goto(url, { waitUntil: 'load', timeout: 20000 }); return; }
    catch (e) { if (i === 2) throw e; await page.waitForTimeout(500); }
  }
}

export const NOISE =/ERR_CERT|Failed to load resource|ERR_NAME|ERR_CONNECTION|ERR_INTERNET|ERR_ABORTED|net::|supabase|lucide|gstatic|googleapis|unpkg|jsdelivr|cdn|three|favicon|manifest|ServiceWorker|sw\.js|the server responded with a status/i;

// --- shared app-driving helpers (run in the browser via page.evaluate) -----

// Spin up a fresh game from scratch for a given format key. Mirrors the real
// coach flow: new team → pick sport → pick format → sample squad → save →
// select → start. Works for every sport (GK and non-GK).
export async function bootstrap(page, { format = '7v7', name = 'Test Team', extraBench = 0, squad = 0 } = {}) {
  await page.evaluate(({ format, name, extraBench, squad }) => {
    // Start from a clean slate. Cancel any animation frame the previous game
    // left scheduled: tickLoop reschedules itself via requestAnimationFrame and
    // mutates the live G; a leftover loop from a prior scenario would keep
    // advancing the clock / auto-firing subs on the new game, causing flaky
    // cross-scenario failures. Then null the in-memory game: startFromSquad()
    // calls confirm() when gameInProgress() is true, and headless auto-dismisses
    // confirm() as false — which would block re-bootstrapping on the same page.
    // G=null makes gameInProgress() false so the rebuild always runs.
    if (typeof G !== 'undefined' && G) {
      G.running = false;
      if (G.raf) { try { cancelAnimationFrame(G.raf); } catch {} G.raf = null; }
    }
    G = null;
    localStorage.clear();
    teams = loadTeams();
    const sportKey = FORMATS[format].sport;
    newTeam();
    pickSport(sportKey);
    pickFormat(format, sportKey);
    fillSampleSquad();
    // Optionally pad the bench so rotation/sub scenarios always have spares.
    for (let i = 0; i < extraBench; i++) addPlayerField();
    // Or force an EXACT squad size (e.g. exactly onField for a no-bench edge
    // case): trim or pad editingTeam.players to `squad` before saving.
    if (squad > 0) {
      while (editingTeam.players.length > squad) editingTeam.players.pop();
      while (editingTeam.players.length < squad) addPlayerField();
    }
    const inp = document.getElementById('teamNameInput'); if (inp) inp.value = name;
    saveAndBack();
    selectTeam(teams[teams.length - 1].id);
    startFromSquad();
    // v2.9.17: startFromSquad routes through the setup step pages (keeper →
    // shape) before s4. Walk them like a coach tapping Next twice.
    if (typeof finishSetupSteps === 'function') finishSetupSteps();
  }, { format, name, extraBench, squad });
  await page.waitForTimeout(250);
}

// Read the live game snapshot fields a test commonly asserts on.
export const gameState = (page) => page.evaluate(() => {
  if (!G) return { hasG: false };
  return {
    hasG: true, half: G.half, running: !!G.running, atBreak: !!G.atBreak,
    on: [...G.on], bench: [...G.bench], gk: G.gk, secs: G.secs,
    onLen: G.on.length, benchLen: G.bench.length,
    scoreUs: G.scoreUs, scoreThem: G.scoreThem,
    periodCount: getSport(currentTeam).periodCount,
    onField: FORMATS[curFmt].onField, hasGk: FORMATS[curFmt].hasGk,
    pt: { ...G.pt }, logLen: (G.log || []).length,
  };
});

export const bodyText = (page) => page.evaluate(() => document.body.innerText);
export const elText = (page, id) => page.evaluate((id) => { const e = document.getElementById(id); return e ? e.innerText : ''; }, id);

// Run a whole game from the current (just-started) state to the summary
// screen: for each period, jump the clock to full time and call advH(); on
// the resulting break, start the next period. Returns the summary card text.
export async function playToSummary(page, { confirmBreakSubs = true } = {}) {
  const periods = await page.evaluate(() => getSport(currentTeam).periodCount);
  for (let p = 1; p <= periods; p++) {
    await page.evaluate(() => {
      // Stop the running clock the right way: cancel the animation frame BEFORE
      // anything else. advH() only cancels G.raf when it sees G.running === true,
      // so we must not pre-clear running or the tickLoop chain leaks — and
      // startNextPeriod() starts a fresh chain each period, so a leaked loop
      // accumulates across scenarios and mutates the live game during awaits.
      if (G.raf) { try { cancelAnimationFrame(G.raf); } catch {} G.raf = null; }
      G.running = false; G.lastTs = null;
      // jump to end of the current period and finalize it
      const full = cfg.hm * 60;
      G.secs = full; G.elapsedMs = full * 1000;
      advH();
    });
    await page.waitForTimeout(150);
    // If not the last period, advH set a break — start the next one.
    const atBreak = await page.evaluate(() => !!(G && G.atBreak));
    if (atBreak) {
      if (confirmBreakSubs) await page.evaluate(() => { if (G.ps && typeof confSub === 'function') confSub(); });
      await page.evaluate(() => startNextPeriod());
      await page.waitForTimeout(150);
    }
  }
  return page.evaluate(() => { const c = document.getElementById('sumCard'); return c ? c.innerText : ''; });
}

// --- suite runner ----------------------------------------------------------
// scenarios: array of [name, async (page, t) => void] where t exposes chk/shot.
export async function runSuite({ title, scenarios, viewport = { width: 390, height: 844 }, slug }) {
  const id = slug || title.replace(/\W+/g, '-').toLowerCase();
  const SHOTS = join(__dirname, 'screenshots', id);
  await rm(SHOTS, { recursive: true, force: true }).catch(() => {});
  await mkdir(SHOTS, { recursive: true });

  const R = { checks: [], errors: [], shotN: 0 };
  const chk = (name, ok, extra = '') => {
    R.checks.push({ name, ok: !!ok });
    console.log(`  ${ok ? '✓' : '✗'} ${name}${extra ? '  ' + extra : ''}`);
    return !!ok;
  };
  const shot = async (page, label) => {
    try { await page.screenshot({ path: join(SHOTS, `${String(++R.shotN).padStart(2, '0')}-${label.replace(/\W+/g, '-')}.png`) }); } catch {}
  };

  const chromium = await loadChromium();
  const { srv, port } = await startServer();
  const BASE = `http://127.0.0.1:${port}/index.html`;
  const browser = await chromium.launch({
    executablePath: browserExecutable(),
    headless: !process.env.SMOKE_HEADED,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  // Accept any confirm()/alert() so a stray dialog never blocks the run.
  page.on('dialog', (d) => d.accept().catch(() => {}));
  page.on('console', (m) => { if (m.type() === 'error' && !NOISE.test(m.text())) R.errors.push('[console] ' + m.text()); });
  page.on('pageerror', (e) => { if (!NOISE.test(e.message)) R.errors.push('[pageerror] ' + e.message); });

  console.log(`\n${title} — ${BASE}\n`);
  await page.goto(BASE, { waitUntil: 'load' });
  await page.waitForFunction(() => typeof newTeam === 'function' && typeof FORMATS === 'object', { timeout: 10000 });
  await page.waitForTimeout(400);

  for (const [name, fn] of scenarios) {
    console.log(`▶ ${name}`);
    try { await fn(page, { chk, shot }); }
    catch (e) { chk(`${name} — threw`, false, e.message); await shot(page, 'ERROR-' + name); }
  }

  await browser.close();
  srv.close();

  const failed = R.checks.filter((c) => !c.ok);
  const summary = {
    suite: title, when: new Date().toISOString(),
    checks: R.checks.length, passed: R.checks.length - failed.length, failed: failed.length,
    consoleErrors: R.errors.length, failures: failed.map((f) => f.name), errors: R.errors,
  };
  await writeFile(join(SHOTS, 'summary.json'), JSON.stringify(summary, null, 2)).catch(() => {});

  console.log(`\n========== ${title.toUpperCase()} ==========`);
  console.log(`${summary.passed}/${summary.checks} checks passed · ${R.errors.length} console error(s)`);
  if (failed.length) console.log('FAILED: ' + failed.map((f) => f.name).join(' | '));
  if (R.errors.length) console.log('CONSOLE/PAGE ERRORS:\n  ' + R.errors.join('\n  '));
  console.log(`screenshots → test/screenshots/${id}/`);

  const code = failed.length || R.errors.length ? 1 : 0;
  return { code, summary };
}
