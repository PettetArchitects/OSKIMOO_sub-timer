#!/usr/bin/env node
// ===========================================================================
// Sub Timer — design-grid audit (reporting tool, like screen-audit)
// ---------------------------------------------------------------------------
// Measures the RENDERED app against the grid system the design should obey:
//
//   margins   screen edge offset = 16px (or 0 for full-bleed bands)
//   spacing   8pt system: padding/heights on a 4px half-step minimum
//   radii     one scale: {0, 4, 8, 12, 16} + pill (>=50% of height)
//   targets   interactive height >= 44px
//
// Reports violations per screen with the worst offenders named. Not a gate
// yet — when the numbers settle, ratchet it like screen-audit → ui-check.
//
//   node test/grid-check.mjs
// ===========================================================================
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const { loadChromium, browserExecutable, startServer } = await import(join(ROOT, 'test', 'harness.mjs'));

const { srv, port } = await startServer();
const chromium = await loadChromium();
const browser = await chromium.launch({ executablePath: browserExecutable(), headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });

const SCREENS = [
  ['Squad select s1', "selectTeam(teams[teams.length-1].id)"],
  ['Keeper gkStep', 'startFromSquad()'],
  ['Live game s4', 'gkStepNext(); shapeStepNext()'],
  ['Team settings', "switchToView('settings')"],
  ['Team editor', "editTeamScreen(teams[teams.length-1].id)"],
];

const audit = `(() => {
  const RADII = [0, 4, 8, 12, 16];
  const vis = (el) => {
    const r = el.getBoundingClientRect();
    if (r.width < 8 || r.height < 8 || r.bottom < 0 || r.top > innerHeight) return false;
    const s = getComputedStyle(el);
    return s.visibility !== 'hidden' && s.display !== 'none' && Number(s.opacity) > 0.05;
  };
  const els = [...document.querySelectorAll('.scr.active button, .scr.active input, .scr.active .card, .scr.active .sec > *, .scr.active .info')].filter(vis);
  const out = { badMargin: [], offGridH: [], badRadius: [], smallTarget: [] };
  for (const el of els) {
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    const id = (el.tagName + '.' + String(el.className).split(' ')[0] + ' "' + (el.textContent || '').trim().slice(0, 14) + '"');
    const L = Math.round(r.left), W = Math.round(r.width), H = Math.round(r.height);
    // margins: containers/controls should start at 0 (full bleed) or 16
    if (W < 370 && ![0, 16].some(m => Math.abs(L - m) <= 1) && r.right < 374) {
      if (el.parentElement && Math.abs(el.parentElement.getBoundingClientRect().left - r.left) > 1)
        out.badMargin.push(id + ' @x' + L);
    }
    // 4px half-step heights on controls
    if (el.tagName === 'BUTTON' && H % 4 !== 0) out.offGridH.push(id + ' h' + H);
    // radius scale
    const rad = parseInt(s.borderRadius) || 0;
    const pill = rad >= H / 2;
    if (!pill && !RADII.includes(rad)) out.badRadius.push(id + ' r' + rad);
    // touch targets
    if (el.tagName === 'BUTTON' && (H < 44 || r.width < 44)) out.smallTarget.push(id + ' ' + Math.round(r.width) + 'x' + H);
  }
  const dedupe = (a) => [...new Set(a)];
  return { n: els.length, badMargin: dedupe(out.badMargin), offGridH: dedupe(out.offGridH), badRadius: dedupe(out.badRadius), smallTarget: dedupe(out.smallTarget) };
})()`;

try {
  const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
  page.on('dialog', (d) => d.accept().catch(() => {}));
  await page.goto(`http://127.0.0.1:${port}/index.html`, { waitUntil: 'load' });
  await page.waitForFunction(() => typeof newTeam === 'function', { timeout: 10000 });
  await page.evaluate(() => {
    newTeam(); pickSport('soccer'); pickFormat('7v7', 'soccer'); fillSampleSquad();
    document.getElementById('teamNameInput').value = 'GridAudit'; saveAndBack();
  });

  console.log('\nDesign-grid audit — margins 16 · heights %4 · radii {0,4,8,12,16}+pill · targets ≥44  (375×812)\n');
  const totals = { badMargin: 0, offGridH: 0, badRadius: 0, smallTarget: 0 };
  for (const [label, drive] of SCREENS) {
    await page.evaluate(drive);
    await page.waitForTimeout(350);
    const r = await page.evaluate(audit);
    for (const k of Object.keys(totals)) totals[k] += r[k].length;
    console.log(`  ${label.padEnd(18)} ${String(r.n).padStart(3)} els · margin ✗${r.badMargin.length} · height ✗${r.offGridH.length} · radius ✗${r.badRadius.length} · target ✗${r.smallTarget.length}`);
    const worst = [...r.badMargin.slice(0, 2), ...r.badRadius.slice(0, 2), ...r.offGridH.slice(0, 2), ...r.smallTarget.slice(0, 2)];
    for (const w of worst) console.log(`      · ${w}`);
  }
  console.log(`\n  totals: margin ✗${totals.badMargin} · height ✗${totals.offGridH} · radius ✗${totals.badRadius} · target ✗${totals.smallTarget}`);
  console.log('  (reporting only — ratchet once the numbers settle, per the screen-audit → ui-check pattern)\n');
} finally { await browser.close(); srv.close(); }
