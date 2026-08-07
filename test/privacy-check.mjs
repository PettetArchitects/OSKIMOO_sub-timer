#!/usr/bin/env node
// ===========================================================================
// Sub Timer — privacy inventory check
// ---------------------------------------------------------------------------
// docs/PRIVACY.md carries a table of every localStorage key and what it holds.
// An inventory nobody checks is the same as no inventory: the app gained cloud
// sync, share links, photo import and flow export across ten versions, each
// reasonable alone, and nothing tracked the cumulative picture.
//
// This fails when index.html reads or writes a storage key that has no row in
// the document — so a new place to put data can't appear without someone
// saying what goes in it.
//
//   node test/privacy-check.mjs
// ===========================================================================
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(ROOT, 'index.html'), 'utf8');
const doc = readFileSync(join(ROOT, 'docs/PRIVACY.md'), 'utf8');

// Keys the app touches. Also catches the removeItem/getItem forms.
const used = new Set(
  [...html.matchAll(/localStorage\.(?:get|set|remove)Item\(\s*['"]([^'"]+)['"]/g)].map((m) => m[1])
);
// Keys the document accounts for — any `backticked` token in the inventory.
const documented = new Set([...doc.matchAll(/`([A-Za-z][\w-]*)`/g)].map((m) => m[1]));

const undocumented = [...used].filter((k) => !documented.has(k)).sort();
const stale = [...documented].filter((k) => /^(subTimer|afl)/.test(k) && !used.has(k)).sort();

console.log(`\nPrivacy inventory — ${used.size} storage key(s) in index.html\n`);

let failed = 0;
if (!undocumented.length) console.log('  ✓ every storage key is inventoried in docs/PRIVACY.md');
else {
  console.log(`  ✗ ${undocumented.length} storage key(s) with no row in docs/PRIVACY.md:`);
  undocumented.forEach((k) => console.log(`      ${k}`));
  console.log('    Add a row saying what it holds and whether it is personal data.');
  failed++;
}

if (stale.length) console.log(`  · ${stale.length} documented key(s) no longer used: ${stale.join(', ')}`);

// The flow exporter is the one path that ships game data off-device by design;
// its pseudonymisation is the standard the policy sets, so assert it's wired.
if (/_flowScrub\s*\(/.test(html) && /Player '\+/.test(html)) {
  console.log('  ✓ game-flow export pseudonymises player names');
} else {
  console.log('  ✗ game-flow export no longer pseudonymises — docs/PRIVACY.md rule 2');
  failed++;
}

console.log('');
if (failed) { console.log(`❌ ${failed} privacy issue(s).\n`); process.exit(1); }
console.log('✅ Privacy inventory in sync.\n');
