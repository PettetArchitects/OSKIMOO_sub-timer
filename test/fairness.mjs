#!/usr/bin/env node
// ===========================================================================
// Sub Timer — fairness hunt (experience invariants over whole games)
// ---------------------------------------------------------------------------
// Molly's bug (v2.9.5) passed every structural gate: squad conserved, keeper
// on the field, final minutes spread of five. Nothing was in a wrong STATE —
// one kid's EXPERIENCE over time was absurd (kept H1, then yanked off-on-off
// through H2). Structural invariants can't see that; these can.
//
// This simulates whole games — randomised squad size, sub cadence, group size,
// strategy, keeper handovers at breaks, injuries — through the REAL engine
// (tickSecond, trigSub, advH, startNextPeriod: the same code a live game runs)
// and judges each player's experience:
//
//   E1  targeted   more rotation-offs in one period than a fair cycle needs
//   E2  disparity  total offs exceed everyone else's by 2+
//   E3  starved    an available player who never got on at all
//   E4  spread     outfield minutes spread > 2 sub-intervals (never-keepers)
//   E5  long sit   benched longer than a full fair bench cycle
//
// Exploratory, like the hunt: findings need a human judgement, so this does
// NOT gate merges. Every game is seeded — a finding prints its seed and exact
// config, and FAIR_SEED replays just that game.
//
//   node test/fairness.mjs                # ~150 seeded games (fixed base seed)
//   FAIR_GAMES=500 node test/fairness.mjs
//   FAIR_SEED=1234 node test/fairness.mjs # replay one game, verbose
// ===========================================================================
import { loadChromium, browserExecutable, startServer } from './harness.mjs';

const GAMES = Number(process.env.FAIR_GAMES || 0) || 150;
const ONE_SEED = process.env.FAIR_SEED ? Number(process.env.FAIR_SEED) : null;
const BASE_SEED = Number(process.env.FAIR_BASE || 0) || 20260808;

// Deterministic PRNG — a finding must be reproducible from its seed alone.
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const FORMATS_POOL = [
  { fmt: '7v7', sport: 'soccer', gk: true },
  { fmt: '11v11', sport: 'soccer', gk: true },
  { fmt: '5v5', sport: 'soccer', gk: true },
  { fmt: '4v4', sport: 'soccer', gk: false },
  { fmt: 'nb-go', sport: 'netball', gk: false },
];

// One seeded game config. Everything the in-page runner needs, pre-decided —
// no randomness inside the page, so replay is exact.
function makeConfig(seed) {
  const r = mulberry32(seed);
  const pick = (arr) => arr[Math.floor(r() * arr.length)];
  const F = pick(FORMATS_POOL);
  const onField = { '7v7': 7, '11v11': 11, '5v5': 5, '4v4': 4, 'nb-go': 7 }[F.fmt];
  const bench = 1 + Math.floor(r() * 5);                  // 1..5
  const hm = pick([15, 20, 25]);
  const sf = pick([4, 5, 6, 8]);
  const sc = Math.min(1 + Math.floor(r() * 3), bench);    // 1..3, ≤ bench
  const strategy = pick(['fair', 'fair', 'paired']);      // fair-weighted
  const periods = F.sport === 'netball' ? 4 : 2;
  // Keeper handover at each break — the Molly ingredient, GK formats only.
  const handover = [];
  for (let b = 0; b < periods - 1; b++) {
    handover.push(F.gk && r() < 0.5 ? { target: Math.floor(r() * 32) } : null);
  }
  // At most one injury per game, sometime in the first period.
  const injury = r() < 0.3 ? {
    half: 1, secs: (1 + Math.floor(r() * (hm - 2))) * 60,
    victim: Math.floor(r() * 32), repl: Math.floor(r() * 32), out: r() < 0.4,
  } : null;
  return { seed, fmt: F.fmt, sport: F.sport, gk: F.gk, squad: onField + bench, onField, bench, hm, sf, sc, strategy, periods, handover, injury };
}

// The Molly game, pinned as game zero — the suite must stay able to describe
// the incident that created it. Clean on ≥v2.9.5; findings on anything before.
const MOLLY = {
  seed: 0, fmt: '7v7', sport: 'soccer', gk: true, squad: 9, onField: 7, bench: 2,
  hm: 20, sf: 5, sc: 2, strategy: 'fair', periods: 2,
  handover: [{ target: 0 }], injury: null, label: 'Molly (pinned regression)',
};

// Runs entirely in the page against the real engine. Samples on-field
// membership after every simulated second, so transitions are truth — whatever
// caused them (rotation, injury, keeper promotion) — rather than a
// reconstruction from the log.
function installRunner() {
  window.__fairRun = (C) => {
    const stop = () => { if (G && G.raf) { try { cancelAnimationFrame(G.raf); } catch (e) {} G.raf = null; } if (G) { G.running = false; G.lastTs = null; G.elapsedMs = G.secs * 1000; } };
    if (typeof G !== 'undefined' && G) stop();
    G = null; localStorage.clear(); teams = loadTeams();
    newTeam(); pickSport(C.sport); pickFormat(C.fmt, C.sport);
    editingTeam.players = Array.from({ length: C.squad }, (_, i) => 'P' + (i + 1));
    editingTeam.numbers = {}; editingTeam.positions = {};
    document.getElementById('teamNameInput').value = 'Fair ' + C.seed;
    saveAndBack(); selectTeam(teams[teams.length - 1].id);
    cfg.subStrategy = C.strategy; cfg.hm = C.hm; cfg.sf = C.sf; cfg.sc = C.sc; cfg.breaksOnly = false;
    startFromSquad(); stop();
    G.subStrategy = C.strategy;

    const transitions = [];
    let prevOn = new Set(G.on);
    const keepers = new Set(); if (G.gk != null) keepers.add(G.gk);
    const gameSecs = () => (G.half - 1) * C.hm * 60 + G.secs;
    const sample = () => {
      const now = new Set(G.on);
      for (const p of now) if (!prevOn.has(p)) transitions.push({ p, d: 'on', t: gameSecs(), h: G.half });
      for (const p of prevOn) if (!now.has(p)) transitions.push({ p, d: 'off', t: gameSecs(), h: G.half });
      prevOn = now;
    };

    let breakIdx = 0, injuryDone = false, injuredOut = null, guard = 0;
    while (guard++ < 40000) {
      G.running = true; const ended = tickSecond(); stop(); sample();
      if (C.injury && !injuryDone && G.half === C.injury.half && G.secs >= C.injury.secs && G.bench.length && !G.atBreak) {
        const elig = G.on.filter((p) => p !== G.gk);
        if (elig.length) {
          const v = elig[C.injury.victim % elig.length];
          injurySub(v, G.bench[C.injury.repl % G.bench.length]);
          confInjury(C.injury.out);
          if (C.injury.out) injuredOut = v;
          injuryDone = true; stop(); sample();
        }
      }
      if (G.atBreak) {
        const h = C.handover[breakIdx];
        if (h && FORMATS[curFmt].hasGk) {
          // On-field target only: realistic, and keeps membership sampling clean.
          const elig = G.on.filter((p) => p !== G.gk);
          if (elig.length) { setPlanKeeper(elig[h.target % elig.length]); keepers.add(G.gk); }
        }
        breakIdx++;
        startNextPeriod(); stop(); sample();
        continue;
      }
      if (ended && G.half >= C.periods) break;
    }
    return {
      initialOn: null, transitions,
      pt: { ...G.pt }, gkt: { ...(G.gkt || {}) }, avail: [...avail],
      keepers: [...keepers], injuredOut,
      startedOn: null,
    };
  };
}

// ---- the judge --------------------------------------------------------------
function judge(C, R) {
  const findings = [];
  const interval = C.sf * 60;
  const total = C.periods * C.hm * 60;
  const N = R.avail.length;
  const players = R.avail.map((_, i) => i);
  const keeperSet = new Set(R.keepers);

  // Rebuild each player's on/off intervals from the sampled transitions.
  const perPlayer = players.map((p) => ({ p, offs: [], ons: [], offsByPeriod: {}, stints: [], waits: [] }));
  const evs = {}; players.forEach((p) => (evs[p] = []));
  R.transitions.forEach((e) => evs[e.p].push(e));
  for (const p of players) {
    const name = R.avail[p];
    const started = !evs[p].length || evs[p][0].d === 'off';   // first event OFF ⇒ was on at kickoff
    let on = started, since = 0;
    for (const e of evs[p]) {
      if (e.d === 'off' && on) { perPlayer[p].stints.push(e.t - since); perPlayer[p].offs.push(e.t); perPlayer[p].offsByPeriod[e.h] = (perPlayer[p].offsByPeriod[e.h] || 0) + 1; on = false; since = e.t; }
      else if (e.d === 'on' && !on) { perPlayer[p].waits.push(e.t - since); on = true; since = e.t; }
    }
    if (on) perPlayer[p].stints.push(total - since); else perPlayer[p].waits.push(total - since);
    perPlayer[p].name = name;
    perPlayer[p].pt = R.pt[name] || 0;
    perPlayer[p].rot = (R.pt[name] || 0) - (R.gkt[name] || 0);
  }

  const outfielders = perPlayer.filter((x) => !keeperSet.has(x.p) && x.p !== R.injuredOut);
  const rotationsPerPeriod = Math.max(1, Math.floor((C.hm - 1) / C.sf));
  const fairOffsPerPeriod = Math.ceil((rotationsPerPeriod * C.sc) / Math.max(1, C.squad - (C.gk ? 1 : 0) - C.sc));
  // Feasibility: with S total rotation slots and a bench of B, fielding
  // everyone needs S ≥ B, and converging minutes needs several cycles. When the
  // coach's config can't do it (16 players, subs every 8, 30-minute game: four
  // slots all game), the outcome is arithmetic, not an engine defect — the
  // judge must not blame the algorithm for it. These configs are counted and
  // surfaced separately: the app could warn at setup, and today it doesn't.
  const slots = rotationsPerPeriod * C.periods * C.sc;
  const canFieldEveryone = slots >= C.bench;
  const canConverge = slots >= 2 * C.bench;

  for (const x of perPlayer) {
    if (x.p === R.injuredOut) continue;
    // E1 — targeted within a period: more offs than a fair cycle can need.
    for (const [h, n] of Object.entries(x.offsByPeriod)) {
      if (n > fairOffsPerPeriod + 1) findings.push({ inv: 'E1', who: x.name, detail: `${n} rotation-offs in period ${h} (fair cycle needs ≤${fairOffsPerPeriod + 1})` });
    }
    // E2 — total-off disparity vs everyone else.
    const others = perPlayer.filter((y) => y.p !== x.p && y.p !== R.injuredOut);
    const maxOther = Math.max(0, ...others.map((y) => y.offs.length));
    if (x.offs.length >= maxOther + 2) findings.push({ inv: 'E2', who: x.name, detail: `${x.offs.length} total offs vs next-worst ${maxOther}` });
    // E3 — never played at all (only when the config made it possible to).
    if (x.pt === 0 && canFieldEveryone) findings.push({ inv: 'E3', who: x.name, detail: 'available all game, zero minutes' });
    // E5 — benched past a full fair bench cycle. Paired cycles by GROUP, which
    // is lumpier than the per-player model by up to one extra interval.
    const allowedWait = (Math.ceil(C.bench / C.sc) + 1 + (C.strategy === 'paired' ? 1 : 0)) * interval + 60;
    const worst = Math.max(0, ...x.waits);
    if (worst > allowedWait) findings.push({ inv: 'E5', who: x.name, detail: `sat ${Math.round(worst / 60)}m straight (fair cycle ≤${Math.round(allowedWait / 60)}m)` });
  }
  // E4 — outfield-minute spread among players the rule says should converge.
  if (outfielders.length >= 2 && canConverge) {
    const rots = outfielders.map((x) => x.rot);
    const spread = Math.max(...rots) - Math.min(...rots);
    if (spread > 2 * interval) findings.push({ inv: 'E4', who: '(squad)', detail: `outfield spread ${Math.round(spread / 60)}m > ${(2 * C.sf)}m across never-keepers` });
  }
  return findings;
}

const cfgLine = (C) => `${C.label || 'seed ' + C.seed} · ${C.fmt} squad ${C.squad} (bench ${C.bench}) · ${C.hm}m×${C.periods} · subs ${C.sf}m×${C.sc} · ${C.strategy}` +
  `${C.handover.some(Boolean) ? ' · handover@break' : ''}${C.injury ? (C.injury.out ? ' · injury-out' : ' · injury') : ''}`;

(async () => {
  const chromium = await loadChromium();
  const { srv, port } = await startServer();
  const browser = await chromium.launch({ executablePath: browserExecutable(), headless: !process.env.SMOKE_HEADED, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const page = await browser.newPage();
  const errs = [];
  page.on('dialog', (d) => d.accept().catch(() => {}));
  page.on('pageerror', (e) => { if (!/ERR_|net::|cdn|three|favicon|manifest|supabase|lucide|gstatic|responded/i.test(e.message)) errs.push(e.message); });
  await page.goto(`http://127.0.0.1:${port}/index.html`, { waitUntil: 'load' });
  await page.waitForFunction(() => typeof newTeam === 'function' && typeof tickSecond === 'function', null, { timeout: 10000 });
  await page.waitForTimeout(400);
  await page.evaluate(installRunner);

  const configs = ONE_SEED != null
    ? [makeConfig(ONE_SEED)]
    : [MOLLY, ...Array.from({ length: GAMES }, (_, i) => makeConfig(BASE_SEED + i))];

  console.log(`\n⚖️  Fairness hunt — ${configs.length} game(s) through the real engine\n`);
  const report = [];
  let infeasible = 0;
  let done = 0;
  for (const C of configs) {
    const slots = Math.max(1, Math.floor((C.hm - 1) / C.sf)) * C.periods * C.sc;
    if (slots < 2 * C.bench) infeasible++;
    const R = await page.evaluate((c) => window.__fairRun(c), C);
    const findings = judge(C, R);
    if (findings.length) report.push({ C, findings });
    if (ONE_SEED != null) {
      console.log(cfgLine(C));
      const rows = R.avail.map((n, i) => ({ n, pt: R.pt[n] || 0, gk: R.gkt[n] || 0, offs: R.transitions.filter((e) => e.p === i && e.d === 'off').length }))
        .sort((a, b) => b.pt - a.pt);
      rows.forEach((r) => console.log(`  ${r.n.padEnd(5)} total ${String(Math.round(r.pt / 60)).padStart(3)}m  in-goal ${String(Math.round(r.gk / 60)).padStart(3)}m  offs ${r.offs}`));
    }
    if (++done % 25 === 0) console.log(`  … ${done}/${configs.length} games, ${report.length} with findings`);
  }
  await browser.close(); srv.close();

  console.log(`\n========== FAIRNESS REPORT ==========`);
  console.log(`${configs.length - report.length}/${configs.length} games clean · ${infeasible} config(s) couldn't cycle their bench (coach-config — the app could warn at setup) · ${errs.length} page error(s)`);
  if (report.length) {
    // Group identical signatures so 40 repeats of one behaviour read as one issue.
    const bySig = new Map();
    for (const r of report) for (const f of r.findings) {
      const sig = `${f.inv} ${f.detail.replace(/\d+/g, 'N')}`;
      if (!bySig.has(sig)) bySig.set(sig, { inv: f.inv, examples: [] });
      bySig.get(sig).examples.push({ game: cfgLine(r.C), who: f.who, detail: f.detail, seed: r.C.seed });
    }
    console.log(`${bySig.size} distinct behaviour(s):\n`);
    for (const [sig, g] of bySig) {
      const ex = g.examples[0];
      console.log(`[${g.inv}] ×${g.examples.length}  e.g. ${ex.who}: ${ex.detail}`);
      console.log(`      ${ex.game}`);
      console.log(`      replay: FAIR_SEED=${ex.seed} node test/fairness.mjs\n`);
    }
    console.log('Findings are judgements-in-waiting, not failures — some may be the rules working as intended.');
  }
  if (errs.length) console.log('PAGE ERRORS:\n  ' + [...new Set(errs)].join('\n  '));
  process.exit(report.length ? 1 : 0);
})().catch((e) => { console.error('FATAL', e.stack || e); process.exit(2); });
