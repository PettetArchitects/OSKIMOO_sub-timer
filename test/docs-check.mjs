#!/usr/bin/env node
// ===========================================================================
// Sub Timer — docs drift check
// ---------------------------------------------------------------------------
// Fails when the documentation falls out of sync with the code, so doc rot
// can't be merged (the same way the smoke gate stops broken code). This is the
// durable answer to "will my changes make it into the docs?" — if they don't,
// this check goes red.
//
//   node test/docs-check.mjs        # report drift, exit 1 if any
//   node test/docs-check.mjs --fix  # auto-fix what's mechanically fixable
//
// What it checks (only things verifiable by machine — intent still needs a
// human, but staleness markers do not):
//   1. Version sync — FEATURES.md and docs/UIMAP.md reference the current
//      APP_VERSION from index.html.
//   2. Changelog presence — CHANGELOG_DATA has an entry for the current version.
//   3. UIMAP freshness — docs/UIMAP.md matches a fresh `uimap.mjs` regeneration
//      (so the factual UI map can't silently rot). [static pass; fast]
//   4. UX-PATHWAYS test links — every `[smoke|edge|sports: <name>]` tag points
//      at a check that actually exists in the suites (no dangling links).
// ===========================================================================
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const FIX = process.argv.includes('--fix');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

const html = read('index.html');
const VERSION = (html.match(/APP_VERSION\s*=\s*['"]([^'"]+)/) || [])[1];

const problems = [];
const fixes = [];
const ok = (msg) => console.log(`  ✓ ${msg}`);
const bad = (msg, fix) => { problems.push(msg); if (fix) fixes.push(fix); console.log(`  ✗ ${msg}`); };

console.log(`\nDocs drift check — code is at ${VERSION}\n`);

// --- 1. Version sync --------------------------------------------------------
{
  const features = read('FEATURES.md');
  const fmVer = (features.match(/\*\*Version:\*\*\s*([\w.\-]+)/) || [])[1];
  if (fmVer === VERSION) ok(`FEATURES.md version (${fmVer})`);
  else bad(`FEATURES.md version is ${fmVer}, code is ${VERSION}`, () => {
    writeFileSync(join(ROOT, 'FEATURES.md'), features.replace(/(\*\*Version:\*\*\s*)[\w.\-]+/, `$1${VERSION}`));
  });

  const uimap = read('docs/UIMAP.md');
  const umVer = (uimap.match(/App version:\s*\*\*([\w.\-]+)\*\*/) || [])[1];
  if (umVer === VERSION) ok(`UIMAP.md version (${umVer})`);
  else bad(`UIMAP.md version is ${umVer}, code is ${VERSION} — run \`npm run uimap\``, null);
}

// --- 2. Changelog presence --------------------------------------------------
{
  const hasEntry = new RegExp(`['"]${VERSION.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]\\s*:`).test(html);
  if (hasEntry) ok(`CHANGELOG_DATA has a ${VERSION} entry`);
  else bad(`CHANGELOG_DATA has no entry for ${VERSION} (add a "What's New" line)`, null);
}

// --- 3. UIMAP freshness ----------------------------------------------------
{
  // The map's §B groups dynamic controls by render function and §C lists
  // runtime-visible ones; both use `fn` (no parens) AND `fn()` formats. Collect
  // every backtick-quoted identifier from the map and check that each control
  // wired in the app appears SOMEWHERE in it. (Version check above already
  // flags a stale regeneration; this catches a NEW control never mapped.)
  const liveSet = new Set(
    [...html.matchAll(/onclick=["']([a-zA-Z_$][\w$]*)\s*\(/g)].map((m) => m[1]).filter((f) => f !== 'if')
  );
  const uimap = read('docs/UIMAP.md');
  const docTokens = new Set([...uimap.matchAll(/`([a-zA-Z_$][\w$]*)(?:\(\))?`/g)].map((m) => m[1]));
  const missing = [...liveSet].filter((f) => !docTokens.has(f));
  if (missing.length === 0) ok(`UIMAP references all ${liveSet.size} wired controls`);
  else bad(`UIMAP missing ${missing.length} wired control(s): ${missing.slice(0, 8).join(', ')}${missing.length > 8 ? '…' : ''} — run \`npm run uimap\``, null);
}

// --- 4. UX-PATHWAYS test links resolve --------------------------------------
{
  const pathways = read('docs/UX-PATHWAYS.md');
  const suites = ['smoke', 'edge', 'sports'].map((s) => read(`test/${s}.mjs`)).join('\n');
  const checkNames = new Set([...suites.matchAll(/chk\(\s*['"]([^'"]+)['"]/g)].map((m) => m[1]));
  // tags look like:  [smoke: <name> / <name2>]  ·  [edge: <name>]  ·  [hunt: I#]
  // A combined tag may chain suites:  [smoke: foo · hunt: I7].
  const tagged = [...pathways.matchAll(/\[(smoke|edge|sports):\s*([^\]]+)\]/g)];
  const dangling = [];
  for (const [, suite, body] of tagged) {
    body.split(/\s*(?:\/|·)\s*/).map((s) => s.trim()).filter(Boolean).forEach((name) => {
      if (/^hunt:\s*I\d+$/i.test(name)) return;              // hunt invariant — not a test check
      if (/^<.*>$/.test(name)) return;                       // a literal placeholder example in the header
      const found = [...checkNames].some((cn) => cn.includes(name) || name.includes(cn));
      if (!found) dangling.push(`[${suite}: ${name}]`);
    });
  }
  if (dangling.length === 0) ok(`all UX-PATHWAYS test links resolve (${tagged.length} tags)`);
  else bad(`${dangling.length} UX-PATHWAYS link(s) don't match any test check: ${dangling.slice(0, 5).join(', ')}${dangling.length > 5 ? '…' : ''}`, null);
}

// --- apply fixes / report ---------------------------------------------------
if (FIX && fixes.length) {
  fixes.forEach((f) => f());
  console.log(`\n🔧 Auto-fixed ${fixes.length} item(s). Re-run to confirm, and regenerate UIMAP with \`npm run uimap\` if flagged.`);
  process.exit(0);
}

console.log('');
if (problems.length === 0) {
  console.log('✅ Docs in sync with the code.');
  process.exit(0);
}
console.log(`❌ ${problems.length} drift issue(s). Fix the docs, then re-run.`);
console.log(`   Mechanically-fixable items: \`node test/docs-check.mjs --fix\``);
console.log(`   UIMAP staleness: \`npm run uimap\`.`);
console.log(`   Version/changelog/intent: update FEATURES.md, docs/UX-PATHWAYS.md, CHANGELOG_DATA by hand.`);
process.exit(1);
