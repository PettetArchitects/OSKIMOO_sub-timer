#!/usr/bin/env node
// ===========================================================================
// Sub Timer — bug-finding LOOP runner
// ---------------------------------------------------------------------------
// Runs the discovery cycle on a repeat, so you can leave it hunting:
//
//   node test/loop.mjs                 # default: a few rounds, then stop
//   LOOP_ROUNDS=20 node test/loop.mjs  # 20 rounds
//   LOOP_FOREVER=1 node test/loop.mjs  # until it finds something or you stop
//   LOOP_INTERVAL_MS=300000 ...        # pause between rounds (default 0)
//
// Each ROUND:
//   1. sanity   — does the app still parse?
//   2. gate     — smoke + sports + edge (no known-good behaviour regressed)
//   3. hunt     — fuzz the app for NEW invariant violations
//
// The loop is a DISCOVERY tool, not an auto-fixer. It STOPS and reports the
// moment a round fails (gate regression or a fresh hunt finding), because a
// real finding needs a human judgment call + reproduction — exactly the step
// this project has shown you can't safely automate. Each round also fuzzes with
// fresh randomness, so more rounds = wider coverage of interaction orderings.
//
// Exit codes: 0 = all rounds clean · 1 = a finding (details printed) · 2 = error
// ===========================================================================
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const ROUNDS = Number(process.env.LOOP_ROUNDS || 3);
const FOREVER = process.env.LOOP_FOREVER === '1';
const INTERVAL = Number(process.env.LOOP_INTERVAL_MS || 0);

// The steps each round runs, in order. `hunt` is optional — only if present.
function steps() {
  const s = [
    { name: 'sanity', cmd: 'node', args: ['test/sanity.mjs'] },
    { name: 'smoke', cmd: 'node', args: ['test/smoke.mjs'] },
    { name: 'sports', cmd: 'node', args: ['test/sports.mjs'] },
    { name: 'edge', cmd: 'node', args: ['test/edge.mjs'] },
  ];
  if (existsSync(join(__dirname, 'hunt.mjs'))) {
    s.push({ name: 'hunt', cmd: 'node', args: ['test/hunt.mjs'] });
  }
  return s;
}

function run(step, env) {
  return new Promise((resolve) => {
    const child = spawn(step.cmd, step.args, { cwd: join(__dirname, '..'), env: { ...process.env, ...env } });
    let out = '';
    child.stdout.on('data', (d) => { out += d; });
    child.stderr.on('data', (d) => { out += d; });
    child.on('close', (code) => resolve({ code: code ?? 1, out }));
  });
}

// Pull the one-line summary each suite prints, for a compact round log.
function summarize(name, out) {
  const m = out.match(/(\d+)\/(\d+) checks passed/);
  if (m) return `${m[1]}/${m[2]}`;
  if (name === 'sanity') { const v = out.match(/index\.html (v[\d.\w-]+)/); return v ? v[1] : 'ok'; }
  if (name === 'hunt') {
    const f = out.match(/(\d+) distinct issue/);
    if (f) return `${f[1]} found`;
    if (/No invariant violations/.test(out)) return 'clean';
  }
  return out.split('\n').filter(Boolean).pop()?.slice(0, 60) || '';
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

(async () => {
  const STEPS = steps();
  console.log(`\n🔁 Bug-finding loop — ${FOREVER ? 'forever (until a finding)' : ROUNDS + ' round(s)'}, steps: ${STEPS.map((s) => s.name).join(' → ')}\n`);

  let round = 0;
  while (FOREVER || round < ROUNDS) {
    round++;
    const tag = `round ${round}${FOREVER ? '' : '/' + ROUNDS}`;
    process.stdout.write(`▶ ${tag}\n`);
    for (const step of STEPS) {
      // give the hunt fresh randomness + a moderate workload each round
      const env = step.name === 'hunt' ? { HUNT_TRIALS: process.env.HUNT_TRIALS || '20', HUNT_SEQLEN: process.env.HUNT_SEQLEN || '8' } : {};
      const t0 = Date.now();
      const { code, out } = await run(step, env);
      const secs = ((Date.now() - t0) / 1000).toFixed(0);
      const ok = code === 0;
      console.log(`   ${ok ? '✓' : '✗'} ${step.name.padEnd(7)} ${summarize(step.name, out)}  (${secs}s)`);
      if (!ok) {
        console.log(`\n🛑 ${tag}: "${step.name}" FAILED — stopping the loop for a human to look.\n`);
        // print the tail of the failing step so the finding is actionable
        console.log(out.split('\n').slice(-30).join('\n'));
        console.log(`\nReproduce: npm run ${step.name === 'hunt' ? 'hunt' : step.name}`);
        process.exit(1);
      }
    }
    if (INTERVAL && (FOREVER || round < ROUNDS)) await sleep(INTERVAL);
  }

  console.log(`\n✅ Loop complete — ${round} round(s), no regressions and no new findings.`);
  process.exit(0);
})().catch((e) => { console.error('FATAL', e.stack || e); process.exit(2); });
