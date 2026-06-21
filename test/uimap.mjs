#!/usr/bin/env node
// ===========================================================================
// Sub Timer — UI map extractor (static + runtime)
// ---------------------------------------------------------------------------
// Generates docs/UIMAP.md: the FACTUAL map of the interface. Pairs with the
// hand-authored docs/UX-PATHWAYS.md (the intended experience); bugs live in the
// gap between the two.
//
//   node test/uimap.mjs            # static pass only (fast, no browser)
//   node test/uimap.mjs --runtime  # static + runtime verification (browser)
//
// Two passes, because ~half of Sub Timer's controls are rendered by JS template
// strings, not static markup — a static parse alone can't place those on a
// screen:
//   • STATIC  — onclick handlers in literal markup, attributed to the screen/
//               overlay container they sit in. Reliable for these.
//   • DYNAMIC — onclick handlers that appear inside JS (innerHTML templates).
//               Listed separately, grouped by the render function that emits
//               them — we can't statically say which screen shows them.
//   • RUNTIME — (--runtime) boots the app, visits each screen, and records the
//               controls actually VISIBLE/clickable there. This is ground truth
//               and corrects the static guesses.
// ===========================================================================
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'index.html');
const html = readFileSync(SRC, 'utf8');
const RUNTIME = process.argv.includes('--runtime');

const SCREENS = {
  home: 'Home', sportPicker: 'Sport picker', gradePicker: 'Format / grade picker',
  editTeam: 'Team editor', s1: 'Squad select', s2: 'Settings', s3: 'Lineup + GK',
  s4: 'Live game', s5: 'Summary', s6: 'Match history',
};

// Split the HTML into the markup region and the <script> region. onclicks in
// the script region are JS-rendered (dynamic); in markup they're static.
const firstScript = html.indexOf('<script');
const markupEnd = firstScript >= 0 ? firstScript : html.length;

function clicksIn(from, to) {
  const slice = html.slice(from, to);
  return [...slice.matchAll(/onclick=["']([a-zA-Z_$][\w$]*)\s*\(/g)]
    .map((m) => ({ fn: m[1], pos: from + m.index }))
    .filter((c) => c.fn !== 'if');
}

// --- STATIC pass: attribute markup-region onclicks to their screen container -
const screenAt = Object.keys(SCREENS)
  .map((id) => { const m = html.match(new RegExp(`id=["']${id}["']`)); return m ? { id, pos: m.index } : null; })
  .filter(Boolean).sort((a, b) => a.pos - b.pos);

const staticByScreen = {};
for (const c of clicksIn(0, markupEnd)) {
  let owner = '(global / header)';
  for (const s of screenAt) { if (s.pos <= c.pos) owner = s.id; else break; }
  (staticByScreen[owner] ??= new Set()).add(c.fn);
}

// --- DYNAMIC pass: onclicks in the JS region, grouped by the enclosing
//     function that renders them (best-effort: nearest preceding `function X`) -
const fnDefs = [...html.matchAll(/function\s+([a-zA-Z_$][\w$]*)\s*\(/g)].map((m) => ({ name: m[1], pos: m.index }));
const dynamicByRender = {};
for (const c of clicksIn(markupEnd, html.length)) {
  let render = '(unknown)';
  for (const f of fnDefs) { if (f.pos <= c.pos) render = f.name; else break; }
  (dynamicByRender[render] ??= new Set()).add(c.fn);
}

const navTargets = {};
for (const m of html.matchAll(/showScr\(['"]([a-zA-Z0-9]+)['"]\)/g)) navTargets[m[1]] = (navTargets[m[1]] || 0) + 1;

const version = (html.match(/APP_VERSION\s*=\s*['"]([^'"]+)/) || [])[1] || '?';
const staticCount = Object.values(staticByScreen).reduce((n, s) => n + s.size, 0);
const dynamicCount = Object.values(dynamicByRender).reduce((n, s) => n + s.size, 0);

// --- optional RUNTIME pass ---------------------------------------------------
let runtime = null;
if (RUNTIME) runtime = await runtimeSnapshot();

// --- emit markdown -----------------------------------------------------------
let md = `# Sub Timer — UI Map (factual, auto-generated)

> Generated from \`index.html\` by \`test/uimap.mjs\`. Regenerate with
> \`node test/uimap.mjs${RUNTIME ? ' --runtime' : ''}\`. This is the "what the app
> actually wires up" layer; intended journeys live in \`docs/UX-PATHWAYS.md\`.
>
> App version: **${version}** · ${staticCount} static + ${dynamicCount} JS-rendered controls${runtime ? ` · runtime-verified ${runtime.length} screens` : ''}.

## Screen flow (\`showScr\` targets)

${Object.entries(navTargets).sort((a, b) => b[1] - a[1]).map(([t, n]) => `- \`${t}\`${SCREENS[t] ? ' — ' + SCREENS[t] : ''} (${n} route${n > 1 ? 's' : ''} in)`).join('\n')}

## A. Static controls (in markup — reliably placed)

`;
for (const id of [...Object.keys(SCREENS), '(global / header)']) {
  const set = staticByScreen[id];
  if (!set) continue;
  md += `### ${SCREENS[id] || id}${SCREENS[id] ? `  \`#${id}\`` : ''} — ${set.size}\n\n` + [...set].sort().map((f) => `- \`${f}()\``).join('\n') + '\n\n';
}

md += `## B. JS-rendered controls (grouped by render function — screen approximate)

These are emitted by \`innerHTML\` templates; a static parse can't say which
screen shows them. ${RUNTIME ? 'See §C for the runtime-verified placement.' : 'Run with --runtime to place them.'}

`;
for (const [render, set] of Object.entries(dynamicByRender).sort((a, b) => b[1].size - a[1].size)) {
  if (set.size < 1) continue;
  md += `- **\`${render}()\`** → ${[...set].sort().map((f) => `\`${f}\``).join(', ')}\n`;
}

if (runtime) {
  md += `\n## C. Runtime-verified controls per screen (ground truth)

Booted the app, navigated to each screen, recorded the controls actually
visible/clickable. This corrects §A/§B guesses.

`;
  for (const scr of runtime) {
    md += `### ${scr.label} \`${scr.via}\` — ${scr.controls.length} visible\n\n` +
      (scr.controls.length ? scr.controls.map((f) => `- \`${f}()\``).join('\n') : '_(none captured)_') + '\n\n';
  }
}

md += `\n---\n_Static attribution is heuristic; §C (runtime) is authoritative. Regenerate after UI changes._\n`;

mkdirSync(join(ROOT, 'docs'), { recursive: true });
writeFileSync(join(ROOT, 'docs', 'UIMAP.md'), md);
console.log(`✓ docs/UIMAP.md — ${staticCount} static + ${dynamicCount} dynamic controls${runtime ? `, ${runtime.length} screens runtime-verified` : ''} (app ${version})`);

// ---------------------------------------------------------------------------
async function runtimeSnapshot() {
  const { loadChromium, browserExecutable, startServer } = await import('./harness.mjs');
  const { srv, port } = await startServer();
  const chromium = await loadChromium();
  const browser = await chromium.launch({ executablePath: browserExecutable(), headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const out = [];
  try {
    const page = await browser.newPage();
    page.on('dialog', (d) => d.accept().catch(() => {}));
    await page.goto(`http://127.0.0.1:${port}/index.html`, { waitUntil: 'load' });
    await page.waitForFunction(() => typeof newTeam === 'function', { timeout: 10000 });

    // helper: list onclick fns of controls currently visible on screen
    const visible = () => page.evaluate(() => {
      const seen = new Set();
      document.querySelectorAll('[onclick]').forEach((el) => {
        const r = el.getBoundingClientRect();
        const vis = r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden' && getComputedStyle(el).display !== 'none';
        if (!vis) return;
        // capture the first APP function call in the handler, skipping common
        // DOM/inline noise so the map lists real user actions, not plumbing.
        const NOISE = new Set(['if', 'getElementById', 'querySelector', 'preventDefault', 'stopPropagation', 'event']);
        const calls = [...(el.getAttribute('onclick') || '').matchAll(/([a-zA-Z_$][\w$]*)\s*\(/g)].map((x) => x[1]);
        const fn = calls.find((c) => !NOISE.has(c));
        if (fn) seen.add(fn);
      });
      return [...seen].sort();
    });

    // Visit each reachable screen by driving the real flow.
    const steps = [
      { label: 'Home', via: 'home', go: () => {} },
      { label: 'Sport picker', via: 'sportPicker', go: () => newTeam() },
      { label: 'Team editor', via: 'editTeam', go: () => { newTeam(); pickSport('soccer'); pickFormat('7v7', 'soccer'); fillSampleSquad(); } },
      { label: 'Squad select', via: 's1', go: () => { newTeam(); pickSport('soccer'); pickFormat('7v7', 'soccer'); fillSampleSquad(); document.getElementById('teamNameInput').value = 'Map'; saveAndBack(); selectTeam(teams[teams.length - 1].id); } },
      { label: 'Live game', via: 's4', go: () => { startFromSquad(); } },
      { label: 'Plan page', via: 'subOrderOv', go: () => { switchToView('plan'); } },
      { label: 'Summary', via: 's5', go: () => { G.half = getSport(currentTeam).periodCount; advH(); } },
      { label: 'Match history', via: 's6', go: () => { showHistory(); } },
    ];
    for (const s of steps) {
      try { await page.evaluate(s.go); await page.waitForTimeout(250); out.push({ label: s.label, via: s.via, controls: await visible() }); }
      catch (e) { out.push({ label: s.label, via: s.via, controls: [], error: e.message }); }
    }
  } finally { await browser.close(); srv.close(); }
  return out;
}
