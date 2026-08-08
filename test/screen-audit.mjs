#!/usr/bin/env node
// ===========================================================================
// Sub Timer — per-screen look & cognitive-load audit (first pass)
// ---------------------------------------------------------------------------
// Drives each screen in the real app and measures the audit proxies:
//
//   choices    visible interactive elements (tappable things — Hick's law)
//   objects    total visible elements (competition for attention)
//   under44    interactive elements with a hit target below 44×44
//   fonts      distinct computed font sizes on screen
//   colors     distinct computed text colours on screen
//   anims      elements with a running CSS animation
//   dominance  primary-action dominance: (area×weight of biggest action) /
//              runner-up — ≥1.5 means the screen clearly says what to do
//
// Reporting tool, not a gate (yet): prints the scorecard per screen and
// writes screen-audit.json for the review. Budgets live in SCREEN-BRIEFS.md;
// when the numbers settle this becomes cognitive-check with ratchets.
//
//   node test/screen-audit.mjs
// ===========================================================================
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const { loadChromium, browserExecutable, startServer } = await import('./harness.mjs');

const { srv, port } = await startServer();
const chromium = await loadChromium();
const browser = await chromium.launch({ executablePath: browserExecutable(), headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });

const out = [];
try {
  const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
  page.on('dialog', (d) => d.accept().catch(() => {}));
  await page.goto(`http://127.0.0.1:${port}/index.html`, { waitUntil: 'load' });
  await page.waitForFunction(() => typeof newTeam === 'function', { timeout: 10000 });

  const audit = (id) => page.evaluate((screenId) => {
    const vis = (el) => {
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) return false;
      if (r.bottom < 0 || r.top > innerHeight) return false;
      const s = getComputedStyle(el);
      return s.visibility !== 'hidden' && s.display !== 'none' && Number(s.opacity) > 0.05;
    };
    const interactive = [...document.querySelectorAll('button, a[href], [onclick], input, select, [role=button]')].filter(vis);
    const all = [...document.querySelectorAll('body *')].filter(vis);
    const fonts = new Set(), colors = new Set();
    let anims = 0;
    for (const el of all) {
      const s = getComputedStyle(el);
      if (el.innerText && el.innerText.trim() && el.children.length === 0) {
        fonts.add(s.fontSize);
        colors.add(s.color);
      }
      if (s.animationName !== 'none' && s.animationPlayState === 'running') anims++;
    }
    const under44 = interactive.filter((el) => { const r = el.getBoundingClientRect(); return r.width < 44 || r.height < 44; }).length;
    // dominance: score = area × (has accent-ish bg ? 2 : 1) for button-like els
    const score = (el) => {
      const r = el.getBoundingClientRect();
      const s = getComputedStyle(el);
      const bg = s.backgroundColor;
      const vivid = bg && !bg.startsWith('rgba(0, 0, 0, 0)') && !/rgb\((1[0-9]|2[0-9]|3[0-9]|4[0-9]),/.test(bg);
      return r.width * r.height * (vivid ? 2 : 1);
    };
    const btns = interactive.filter((el) => el.tagName === 'BUTTON');
    const scores = btns.map(score).sort((a, b) => b - a);
    const dominance = scores.length > 1 ? Math.round((scores[0] / scores[1]) * 10) / 10 : null;
    return { screenId, choices: interactive.length, objects: all.length, under44, fonts: fonts.size, colors: colors.size, anims, dominance };
  }, id);

  const step = async (label, id, go) => {
    try {
      await page.evaluate(go);
      await page.waitForTimeout(350);
      out.push({ label, ...(await audit(id)) });
    } catch (e) { out.push({ label, screenId: id, error: e.message.slice(0, 80) }); }
  };

  await step('Home (first run)', 'home', () => {});
  await step('Sport picker', 'sportPicker', () => newTeam());
  await step('Format picker', 'gradePicker', () => pickSport('soccer'));
  await step('Team editor', 'editTeam', () => { pickFormat('7v7', 'soccer'); fillSampleSquad(); });
  await step('Home (teams)', 'home', () => { document.getElementById('teamNameInput').value = 'Audit'; saveAndBack(); });
  await step('Squad select', 's1', () => selectTeam(teams[teams.length - 1].id));
  await step('Live game', 's4', () => startFromSquad());
  await step('Game drawer open', 'drawer', () => openDrawer('gameMenu'));
  await step('Plan page', 'subOrderOv', () => { closeAnyDrawer(); switchToView('plan'); });
  await step('Summary', 's5', () => { switchToView('live'); G.half = getSport(currentTeam).periodCount; advH(); });
  await step('Match history', 's6', () => showHistory());
} finally { await browser.close(); srv.close(); }

// --- report ------------------------------------------------------------------
console.log('\nScreen audit — look & cognitive-load proxies (375×812)\n');
console.log('  screen               choices objects <44px fonts colors anims dominance');
for (const r of out) {
  if (r.error) { console.log(`  ${r.label.padEnd(20)} ERROR ${r.error}`); continue; }
  console.log(`  ${r.label.padEnd(20)} ${String(r.choices).padStart(7)} ${String(r.objects).padStart(7)} ${String(r.under44).padStart(5)} ${String(r.fonts).padStart(5)} ${String(r.colors).padStart(6)} ${String(r.anims).padStart(5)} ${r.dominance === null ? '      —' : String(r.dominance).padStart(9)}`);
}
console.log('\n  choices = visible tappables · objects = visible elements · <44px = undersized targets');
console.log('  fonts/colors = distinct on-screen · dominance = top action score ÷ runner-up (≥1.5 = clear)');
writeFileSync(join(ROOT, 'screen-audit.json'), JSON.stringify(out, null, 2));
console.log('\n  → screen-audit.json written\n');
