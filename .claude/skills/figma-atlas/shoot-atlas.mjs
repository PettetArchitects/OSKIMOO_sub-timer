#!/usr/bin/env node
// ===========================================================================
// Sub Timer — Figma UI Atlas shoot script
// ---------------------------------------------------------------------------
// Drives the real app through the atlas journey at three viewports and writes
// the screenshots that get swapped onto the Figma frames as image fills.
// See SKILL.md beside this file for the state → nodeId map and upload steps.
//
//   node .claude/skills/figma-atlas/shoot-atlas.mjs        (from repo root)
//
// Output: atlas-shots/{phone,ipad,web}-NN.png + manifest.json
// Journey mirrors test/screen-audit.mjs — if a driver breaks here, check that
// file first; the app's function names are the shared contract.
// ===========================================================================
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const OUT = join(ROOT, 'atlas-shots');
mkdirSync(OUT, { recursive: true });

const { loadChromium, browserExecutable, startServer } = await import(join(ROOT, 'test', 'harness.mjs'));

const VIEWPORTS = [
  { key: 'phone', width: 375, height: 812 },
  { key: 'ipad', width: 768, height: 1024 },
  { key: 'web', width: 1280, height: 800 },
];

// One journey, shot in this order. A state without `sizes` captures at every
// viewport; with `sizes` it captures only there but still RUNS elsewhere (the
// app must pass through it) unless `skipRunElsewhere` marks it a pure detour.
// Keep state numbers in sync with SKILL.md's swap map.
const JOURNEY = [
  { n: '01', label: 'Landing (fresh)', go: () => {} },
  { n: '02', label: 'Sport picker', go: () => newTeam() },
  { n: '03', label: 'Format picker', go: () => pickSport('soccer') },
  { n: '04', label: 'Team editor', go: () => { pickFormat('7v7', 'soccer'); fillSampleSquad(); } },
  { n: '05', label: 'Home — My Teams', go: () => { document.getElementById('teamNameInput').value = 'Atlas'; saveAndBack(); } },
  { n: '13', label: 'Home drawer', go: () => openDrawer('homeMenu') },
  { n: '06', label: 'Squad select', go: () => { closeAnyDrawer(); selectTeam(teams[teams.length - 1].id); } },
  { n: '15', label: 'Keeper page', go: () => startFromSquad(), sizes: ['phone', 'ipad'] },
  { n: '16', label: 'Shape page', go: () => gkStepNext(), sizes: ['phone', 'ipad'] },
  { n: '07', label: 'Live game', go: () => shapeStepNext() },
  { n: '14', label: 'Announce view', go: () => openAnnounce(), sizes: ['phone', 'ipad'], skipRunElsewhere: true },
  { n: '10', label: 'Game drawer', go: () => { if (typeof closeAnnounce === 'function') closeAnnounce(); openDrawer('gameMenu'); } },
  { n: '08', label: 'Plan page', go: () => { closeAnyDrawer(); switchToView('plan'); } },
  { n: '09', label: 'Plan drawer', go: () => openDrawer('planMenu') },
  { n: '11', label: 'Summary', go: () => { closeAnyDrawer(); switchToView('game'); G.half = getSport(currentTeam).periodCount; advH(); } },
  { n: '12', label: 'Match history', go: () => showHistory() },
  { n: '17', label: 'Team settings', go: () => switchToView('settings'), sizes: ['phone', 'ipad'], skipRunElsewhere: true },
];

const { srv, port } = await startServer();
const chromium = await loadChromium();
const browser = await chromium.launch({ executablePath: browserExecutable(), headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });

const manifest = [];
try {
  for (const vp of VIEWPORTS) {
    // Fresh context per viewport → clean localStorage → state 01 is a true first run.
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 2 });
    const page = await ctx.newPage();
    page.on('dialog', (d) => d.accept().catch(() => {}));
    await page.goto(`http://127.0.0.1:${port}/index.html`, { waitUntil: 'load' });
    await page.waitForFunction(() => typeof newTeam === 'function', { timeout: 10000 });

    for (const st of JOURNEY) {
      const capture = !st.sizes || st.sizes.includes(vp.key);
      if (!capture && st.skipRunElsewhere) continue; // pure detours: skip entirely where not captured
      await page.evaluate(st.go);
      await page.waitForTimeout(400);
      if (!capture) continue;
      const file = `${vp.key}-${st.n}.png`;
      let ok = false;
      // Headless capture flakes under load ("Unable to capture screenshot") —
      // bringToFront + generous backoff clears it; seen clustering on the
      // first shots of a fresh context.
      for (let attempt = 0; attempt < 5 && !ok; attempt++) {
        try { await page.bringToFront(); await page.screenshot({ path: join(OUT, file), timeout: 15000 }); ok = true; }
        catch (e) { if (attempt === 4) throw e; await page.waitForTimeout(1000 * (attempt + 1)); }
      }
      manifest.push({ file, viewport: vp.key, state: st.n, label: st.label });
      console.log(`  ✓ ${file}  ${st.label}`);
    }
    await ctx.close();
  }
} finally { await browser.close(); srv.close(); }

writeFileSync(join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2));
console.log(`\n${manifest.length} shots → ${OUT}\nNext: swap fills by nodeId per SKILL.md (upload_assets → curl multipart).`);
