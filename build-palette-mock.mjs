// Build palette-mock.html — design.md §2.1.1 **Option C**: three accents
// (green = ours/go/selected · red = theirs/stop/danger · amber = attention),
// neutrals for everything else, on top of Option B's surface/grey work.
import { readFileSync, writeFileSync } from 'fs';

// Targeted rule rewrites — semantic changes a global swap can't express.
const RULES = [
  // red exits navigation: secondary / back are neutral chrome, not danger
  ['.back-btn{background:none;border:none;color:#e94560;',
   '.back-btn{background:none;border:none;color:#9fb3c8;'],
  ['.btn-o{background:rgba(233,69,96,.16);border:none;color:#e94560}',
   '.btn-o{background:#13203a;border:none;color:#9fb3c8}'],
  // one tag treatment — position is metadata, the TEXT is the signal
  ['.pos-tag-gk{background:#3a1525;color:#e94560;border-color:#e94560}',
   '.pos-tag-gk{background:rgba(240,165,0,.12);color:#f0a500;border-color:rgba(240,165,0,.5)}'],
  ['.pos-tag-def{background:#0a2a2a;color:#00d4aa;border-color:#00d4aa}',
   '.pos-tag-def{background:rgba(159,179,200,.10);color:#9fb3c8;border-color:rgba(159,179,200,.4)}'],
  ['.pos-tag-mid{background:#1a1a3e;color:#7b8cff;border-color:#7b8cff}',
   '.pos-tag-mid{background:rgba(159,179,200,.10);color:#9fb3c8;border-color:rgba(159,179,200,.4)}'],
  ['.pos-tag-wng{background:#1a2a1a;color:#8dd68d;border-color:#8dd68d}',
   '.pos-tag-wng{background:rgba(159,179,200,.10);color:#9fb3c8;border-color:rgba(159,179,200,.4)}'],
  ['.pos-tag-fwd{background:#2a1f0a;color:#f0a500;border-color:#f0a500}',
   '.pos-tag-fwd{background:rgba(159,179,200,.10);color:#9fb3c8;border-color:rgba(159,179,200,.4)}'],
];

const MAP = [
  // ── Option B base: surfaces + greys ──
  ['#1a1a2e', '#152032'],
  ['#0f1422', '#0d1828'], ['#141a2e', '#152032'], ['#1a2747', '#1c2a4a'],
  ['#141f3a', '#13203a'], ['#0f3460', '#2a3550'],
  ['#cccccc', '#c9d4e0'], ['#ccc', '#c9d4e0'],
  ['#bbbbbb', '#9fb3c8'], ['#bbb', '#9fb3c8'],
  ['#aaaaaa', '#9fb3c8'], ['#aaa', '#9fb3c8'],
  ['#999999', '#7d8a9c'], ['#999', '#7d8a9c'],
  ['#888888', '#7d8a9c'], ['#888', '#7d8a9c'],
  ['#666666', '#5a6b82'], ['#666', '#5a6b82'],
  ['#94a3b8', '#9fb3c8'],
  ['#22c55e', '#00d4aa'], ['#ec4899', '#ff7088'],
  ['#ef5872', '#ff7088'], ['#e0344f', '#e94560'], ['#c8334b', '#e94560'],
  ['#ffc428', '#f0a500'], ['#ffb52e', '#f7ad14'], ['#ec9c00', '#e09a00'],
  ['rgba(0,212,170,.14)', 'rgba(0,212,170,.16)'],
  // ── Option C: accent-hue collapse ──
  // cyan (preview / info / SUB) joins the interactive green family
  ['rgba(91,192,222,.14)', 'rgba(0,212,170,.16)'],
  ['rgba(91,192,222,', 'rgba(0,212,170,'],
  ['#5bc0de', '#00d4aa'],
  // purple (plan / custom) becomes neutral — the mode label does the work
  ['rgba(167,139,250,', 'rgba(159,179,200,'],
  ['#a78bfa', '#9fb3c8'],
  // GK pink folds into selection green (the IN GOAL label carries the role)
  ['rgba(255,123,172,', 'rgba(0,212,170,'],
  ['#ff7bac', '#00d4aa'],
  // stray tag hues
  ['#7b8cff', '#9fb3c8'], ['#8dd68d', '#9fb3c8'],
];

let html = readFileSync('index.html', 'utf8');
let rn = 0;
for (const [from, to] of RULES) {
  if (html.includes(from)) { html = html.replaceAll(from, to); rn++; }
  else console.warn('rule NOT found:', from.slice(0, 40));
}
let total = 0;
for (const [from, to] of MAP) {
  const re = new RegExp(from.replace(/[.()]/g, '\\$&') + (from.length === 4 ? '(?![0-9a-fA-F])' : ''), 'g');
  total += (html.match(re) || []).length;
  html = html.replace(re, to);
}
writeFileSync('palette-mock.html', html);
console.log(`palette-mock.html (Option C) — ${rn}/${RULES.length} rules rewritten, ${total} colour substitutions`);
