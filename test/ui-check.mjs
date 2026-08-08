#!/usr/bin/env node
// ===========================================================================
// Sub Timer — UI consistency check
// ---------------------------------------------------------------------------
// design.md documents 8 typography roles, a 9-value spacing scale, a 7-step
// radius scale and one Button component. The code uses 20 font sizes, 12 radii
// and 54 distinct inline button treatments across 121 buttons. The system is
// described; it is largely not the thing the code is built from.
//
// The cause is structural: 121 of 158 buttons are inline-styled, so there is no
// component for the document to govern. This check doesn't fix that — it makes
// the gap countable and stops it widening while it's worked down.
//
//   1. Legibility floor — text below MIN_FONT px.               RATCHET
//      design.md §1: "readable in one glance" on a sunlit sideline.
//   2. Type scale sprawl — distinct font sizes.                 RATCHET
//   3. Radius sprawl — distinct border-radius values.           RATCHET
//   4. Button drift — distinct inline button signatures.        RATCHET
//
//   node test/ui-check.mjs [--list]
//   UI_FONTS=n UI_RADII=n UI_BUTTONS=n UI_TINY=n node test/ui-check.mjs
// ===========================================================================
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(ROOT, 'index.html'), 'utf8');
const LIST = process.argv.includes('--list');

// Ratchets — the counts when this check was written. They may fall, never rise.
const B = {
  tiny: Number(process.env.UI_TINY || 0) || 11,      // declarations below MIN_FONT
  fonts: Number(process.env.UI_FONTS || 0) || 20,    // distinct font-size values
  radii: Number(process.env.UI_RADII || 0) || 13,    // distinct border-radius values
  buttons: Number(process.env.UI_BUTTONS || 0) || 52, // distinct inline button styles (54 → 52: drawer rows → .ui-btn--ghost, v2.9.6)
};
const MIN_FONT = 9;   // below this, text on a sunlit sideline is not glanceable

const count = (re) => {
  const out = new Map();
  let m;
  while ((m = re.exec(html))) {
    const v = m[1].trim();
    if (!out.has(v)) out.set(v, { n: 0, line: html.slice(0, m.index).split('\n').length });
    out.get(v).n++;
  }
  return out;
};

const fonts = count(/font-size:\s*([0-9.]+px)/g);
const radii = count(/border-radius:\s*([0-9]+px)\b/g);

// Text below the legibility floor, with where it lives — the "why" matters more
// than the count (pitch chips are dense by necessity; a caption is not).
const tiny = [];
for (const [v, e] of fonts) {
  if (parseFloat(v) < MIN_FONT) tiny.push({ v, n: e.n, line: e.line });
}

// Distinct inline button treatments. A component used 121 times should have a
// handful of variants, not 54.
const buttonSigs = new Map();
for (const m of html.matchAll(/<button[^>]*style="([^"]*)"/g)) {
  const s = m.group ? m.group(1) : m[1];
  const g = (k) => { const r = new RegExp(k + ':\\s*([^;]+)').exec(s); return r ? r[1].trim() : '-'; };
  const sig = `pad=${g('padding')} size=${g('font-size')} r=${g('border-radius')} w=${g('font-weight')}`;
  buttonSigs.set(sig, (buttonSigs.get(sig) || 0) + 1);
}
const totalButtons = (html.match(/<button/g) || []).length;
const classed = (html.match(/<button[^>]*class="/g) || []).length;

let failed = 0;
const line = (ok, over, msg) => { console.log(`  ${over ? '✗' : ok ? '✓' : '·'} ${msg}`); if (over) failed++; };

console.log(`\nUI consistency — ${totalButtons} buttons, ${classed} using a class\n`);

const tinyN = tiny.reduce((s, t) => s + t.n, 0);
line(false, tinyN > B.tiny, `${tinyN} declaration(s) of text below ${MIN_FONT}px — budget ${B.tiny}   [design.md §1: readable in one glance]`);
if (LIST || tinyN > B.tiny) tiny.sort((a, b) => parseFloat(a.v) - parseFloat(b.v))
  .forEach((t) => console.log(`      ${t.v.padEnd(7)} ×${String(t.n).padEnd(3)} first at line ${t.line}`));

line(false, fonts.size > B.fonts, `${fonts.size} distinct font sizes — budget ${B.fonts}   [design.md §2.2 documents 8 roles]`);
if (LIST) [...fonts].sort((a, b) => parseFloat(a[0]) - parseFloat(b[0]))
  .forEach(([v, e]) => console.log(`      ${v.padEnd(8)} ×${e.n}`));

line(false, radii.size > B.radii, `${radii.size} distinct radii — budget ${B.radii}   [design.md §2.4 documents 7 steps]`);
if (LIST) [...radii].sort((a, b) => parseFloat(a[0]) - parseFloat(b[0]))
  .forEach(([v, e]) => console.log(`      ${v.padEnd(8)} ×${e.n}`));

line(false, buttonSigs.size > B.buttons, `${buttonSigs.size} distinct inline button styles across ${[...buttonSigs.values()].reduce((a, c) => a + c, 0)} buttons — budget ${B.buttons}   [design.md §4.1 documents one Button]`);
if (LIST) [...buttonSigs].sort((a, b) => b[1] - a[1]).slice(0, 20)
  .forEach(([k, v]) => console.log(`      ×${String(v).padEnd(3)} ${k}`));

console.log('');
if (failed) {
  console.log(`❌ ${failed} UI consistency budget(s) exceeded.`);
  console.log(`   Reuse an existing value from design.md, or add the new one there and lower the budget deliberately.\n`);
  process.exit(1);
}
console.log('✅ UI consistency within budget.\n');
