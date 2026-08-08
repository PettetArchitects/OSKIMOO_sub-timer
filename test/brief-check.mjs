#!/usr/bin/env node
// ===========================================================================
// Sub Timer — screen-brief check
// ---------------------------------------------------------------------------
// docs/SCREEN-BRIEFS.md is the per-screen contract: purpose, pathways served,
// primary action, choice budget. A document is only a control if something
// fails when it is violated (docs/CONTROL-DOCS.md) — this is that something.
//
//   1. Every runtime-verified screen in docs/UIMAP.md §C has a brief.
//   2. Every brief's screenId exists in UIMAP's screen-flow list (or AUX).
//   3. Every `action()` named in a brief is a real function in index.html.
//   4. Every P# pathway reference resolves to a heading in UX-PATHWAYS.md.
//   5. Every brief has a Purpose, exactly one Primary action field, and a
//      numeric Choice budget.
//   6. Budget vs current UIMAP visible count is REPORTED (the declutter gap),
//      not failed — the budget is the target the redesign closes in on.
//
//   node test/brief-check.mjs
// ===========================================================================
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const briefs = readFileSync(join(ROOT, 'docs', 'SCREEN-BRIEFS.md'), 'utf8');
const uimap = readFileSync(join(ROOT, 'docs', 'UIMAP.md'), 'utf8');
const pathways = readFileSync(join(ROOT, 'docs', 'UX-PATHWAYS.md'), 'utf8');
const html = readFileSync(join(ROOT, 'index.html'), 'utf8');

// Screens that are real surfaces but not showScr targets (drawer overlays).
const AUX_IDS = new Set(['drawer']);

let failed = 0;
const ok = (m) => console.log(`  ✓ ${m}`);
const bad = (m) => { console.log(`  ✗ ${m}`); failed++; };
const info = (m) => console.log(`  · ${m}`);

console.log('\nScreen-brief check — docs/SCREEN-BRIEFS.md vs UIMAP + UX-PATHWAYS + code\n');

// --- parse the briefs -------------------------------------------------------
const sections = briefs.split(/\n(?=## )/)
  .map((chunk) => { const m = chunk.match(/^## (.+?) · `([\w-]+)`\n([\s\S]*)$/); return m && { title: m[1], id: m[2], body: m[3] }; })
  .filter(Boolean);
if (sections.length === 0) bad('no brief sections parsed — format is `## Name · \`screenId\``');

// --- sources of truth -------------------------------------------------------
const flowIds = new Set([...uimap.matchAll(/^- `([\w-]+)`/gm)].map((m) => m[1]));
const runtimeScreens = [...uimap.matchAll(/^### .+? `([\w-]+)` — (\d+) visible/gm)]
  .map((m) => ({ id: m[1], visible: Number(m[2]) }));
const pathwayIds = new Set([...pathways.matchAll(/^## (P\d)\b/gm)].map((m) => m[1]));
const fnDefs = new Set([...html.matchAll(/function\s+([a-zA-Z_$][\w$]*)\s*\(/g)].map((m) => m[1]));

// --- 1. coverage: every runtime screen has a brief --------------------------
const briefIds = new Set(sections.map((s) => s.id));
const missing = runtimeScreens.filter((s) => !briefIds.has(s.id));
if (missing.length === 0) ok(`all ${runtimeScreens.length} runtime-verified screens have a brief`);
else bad(`screens missing a brief: ${missing.map((s) => s.id).join(', ')}`);

// --- per-section checks -----------------------------------------------------
const budgets = [];
for (const s of sections) {
  const where = `[${s.id}]`;

  // 2. id resolves
  if (!flowIds.has(s.id) && !AUX_IDS.has(s.id)) bad(`${where} screenId not in UIMAP screen-flow list`);

  // 5. required fields
  if (!/\*\*Purpose:\*\*/.test(s.body)) bad(`${where} missing **Purpose:**`);
  const primary = s.body.match(/\*\*Primary action:\*\*/g) || [];
  if (primary.length !== 1) bad(`${where} needs exactly one **Primary action:** (found ${primary.length})`);
  const budget = s.body.match(/\*\*Choice budget:\*\*\s*(\d+)/);
  if (!budget) bad(`${where} missing numeric **Choice budget:**`);
  else budgets.push({ id: s.id, budget: Number(budget[1]) });

  // 3. actions exist in code
  for (const m of s.body.matchAll(/`([a-zA-Z_$][\w$]*)\(\)`/g)) {
    if (!fnDefs.has(m[1])) bad(`${where} action \`${m[1]}()\` is not a function in index.html`);
  }

  // 4. pathway refs resolve
  for (const m of s.body.matchAll(/\bP(\d)(?:\.\d+[a-z]?)?\b/g)) {
    if (!pathwayIds.has(`P${m[1]}`)) bad(`${where} pathway ref P${m[1]} not found in UX-PATHWAYS.md`);
  }
}
if (failed === 0) ok(`${sections.length} briefs structurally valid — every action + pathway ref resolves`);

// --- 6. budget vs reality (informational — this is the declutter gap) -------
console.log('\n  Choice budget vs current visible controls (target vs UIMAP §C):');
for (const { id, budget } of budgets) {
  const rt = runtimeScreens.find((s) => s.id === id);
  if (!rt) { info(`${id.padEnd(12)} budget ${budget}  (no runtime count)`); continue; }
  const mark = rt.visible <= budget ? '✓' : `over by ${rt.visible - budget}`;
  info(`${id.padEnd(12)} budget ${String(budget).padEnd(3)} current ${String(rt.visible).padEnd(3)} ${mark}`);
}

console.log('');
if (failed) {
  console.log(`❌ ${failed} brief violation(s). The brief, the pathways and the wired UI must agree.\n`);
  process.exit(1);
}
console.log('✅ Screen briefs in sync with UIMAP, UX-PATHWAYS and the code.\n');
