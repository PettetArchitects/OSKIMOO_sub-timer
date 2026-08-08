#!/usr/bin/env node
// ===========================================================================
// Sub Timer — accessibility check
// ---------------------------------------------------------------------------
// design.md §8 states three things. Until now nothing verified any of them, and
// one was measurably false: it requires 44×44pt hit targets (iOS HIG) while
// most controls on the game screen are smaller. A control that asserts the
// opposite of reality is worse than no control, because it stops people
// looking.
//
// This walks the real screens in a real browser and checks:
//   1. Every visible interactive element has an accessible name.   HARD FAIL
//      (passing today — so it may never regress)
//   2. Hit targets ≥ 44×44 CSS px.                                 RATCHET
//      (failing today — the count may fall, never rise)
//   3. A visible focus style exists for keyboard users.            REPORT
//      (§8 already admits this gap; reported until it's closed)
//
//   node test/a11y-check.mjs
//   node test/a11y-check.mjs --list      # every offender, not just a summary
//   A11Y_BUDGET=n node test/a11y-check.mjs
// ===========================================================================
import { loadChromium, browserExecutable, startServer } from './harness.mjs';

// Ratchet: distinct controls below the 44×44 minimum at the time of writing.
// Lower it as they're fixed; the build fails if it grows.
const BUDGET = Number(process.env.A11Y_BUDGET || 0) || 34;
const LIST = process.argv.includes('--list');
const MIN = 44;

// The screens a coach actually passes through. Each entry drives the app into
// that state via its own functions, so this exercises real render paths.
const SCREENS = [
  ['home', () => { showScr('home'); }],
  ['squad (S1)', () => { renderS1(); showScr('s1'); }],
  ['settings (S2)', () => { goSettings(); }],
  ['lineup (S3)', () => { goLineup(); }],
  ['game (S4)', () => { switchToView('game'); }],
  ['plan', () => { switchToView('plan'); }],
  ['roster', () => { switchToView('roster'); }],
  ['summary (S5)', () => { showSum(); }],
];

const probe = () => {
  const sig = (e) => {
    const id = e.id ? `#${e.id}` : '';
    const cls = (typeof e.className === 'string' && e.className.trim())
      ? '.' + e.className.trim().split(/\s+/).slice(0, 2).join('.') : '';
    const label = (e.getAttribute('aria-label') || e.innerText || '').trim().slice(0, 24).replace(/\s+/g, ' ');
    return `${e.tagName.toLowerCase()}${id}${cls}${label ? ` "${label}"` : ''}`;
  };
  const interactive = [...document.querySelectorAll('button,a[href],select,input,textarea,[onclick],[role="button"]')]
    .filter((e) => {
      // aria-hidden subtrees are deliberately outside the a11y tree (scrims,
      // decorative click-catchers). Honour that rather than counting them.
      if (e.closest('[aria-hidden="true"]')) return false;
      if (e.offsetParent === null && getComputedStyle(e).position !== 'fixed') return false;
      const r = e.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    });
  const unnamed = [], small = [];
  for (const e of interactive) {
    const name = (e.getAttribute('aria-label') || e.innerText.trim() || e.getAttribute('title')
      || e.getAttribute('placeholder') || (e.querySelector('img[alt]')?.alt) || '').trim();
    if (!name) unnamed.push(sig(e));
    const r = e.getBoundingClientRect();
    if (r.width < 44 || r.height < 44) small.push({ sig: sig(e), w: Math.round(r.width), h: Math.round(r.height) });
  }
  return { total: interactive.length, unnamed, small };
};

(async () => {
  const chromium = await loadChromium();
  const { srv, port } = await startServer();
  const browser = await chromium.launch({
    executablePath: browserExecutable(),
    headless: !process.env.SMOKE_HEADED,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  page.on('dialog', (d) => d.accept().catch(() => {}));

  await page.goto(`http://127.0.0.1:${port}/index.html`, { waitUntil: 'load' });
  await page.waitForFunction(() => typeof newTeam === 'function' && typeof devSeedGame === 'function', null, { timeout: 10000 });
  await page.waitForTimeout(1800);

  // A game in progress, so the dense screens actually have controls on them.
  await page.evaluate(() => {
    localStorage.clear();
    devFillFormats(); document.getElementById('devSeedFmt').value = '7v7';
    devSeedGame();
    document.querySelectorAll('.ov.show').forEach((o) => o.classList.remove('show'));
    try { localStorage.setItem('subTimerLastSeenVersion', APP_VERSION); } catch (e) {}
  });

  const unnamed = new Map();   // sig -> screens
  const small = new Map();     // sig -> {w,h,screens}
  let totalSeen = 0;

  console.log(`\nAccessibility check — design.md §8, at 390×844\n`);
  for (const [name, drive] of SCREENS) {
    try { await page.evaluate(`(${drive.toString()})()`); } catch (e) { console.log(`  · ${name}: could not reach (${e.message.slice(0, 60)})`); continue; }
    await page.waitForTimeout(280);
    const r = await page.evaluate(probe);
    totalSeen += r.total;
    r.unnamed.forEach((s) => { if (!unnamed.has(s)) unnamed.set(s, new Set()); unnamed.get(s).add(name); });
    r.small.forEach((x) => { if (!small.has(x.sig)) small.set(x.sig, { ...x, screens: new Set() }); small.get(x.sig).screens.add(name); });
    console.log(`  · ${name.padEnd(15)} ${String(r.total).padStart(3)} controls · ${r.small.length} under ${MIN}px · ${r.unnamed.length} unnamed`);
  }

  // v2.9.14: iOS input auto-zoom guard. Safari zooms the page when a focused
  // text field's font-size is under 16px — and with user-scalable=no the zoom
  // can stick after blur, leaving the app clipped on the right (reported on
  // iPad). Every focusable text field must be ≥16px. Full-DOM check: fields on
  // hidden screens still zoom when their screen shows.
  const smallInputs = await page.evaluate(() => {
    return [...document.querySelectorAll('input, textarea')]
      .filter((el) => !['checkbox', 'radio', 'file', 'range', 'hidden'].includes(el.type))
      .map((el) => ({ sig: `${el.tagName.toLowerCase()}#${el.id || el.className || el.placeholder || '?'}`, px: parseFloat(getComputedStyle(el).fontSize) }))
      .filter((x) => x.px < 16);
  });

  // Focus styles — §8 admits none are defined. Check rather than assume.
  const focus = await page.evaluate(() => {
    const sheets = [...document.styleSheets].filter((s) => { try { return s.cssRules; } catch (e) { return false; } });
    const rules = sheets.flatMap((s) => [...s.cssRules].map((r) => r.selectorText || ''));
    return rules.filter((sel) => /:focus(-visible)?\b/.test(sel)).length;
  });

  await browser.close();
  srv.close();

  let failed = 0;
  console.log('');

  if (!unnamed.size) console.log(`  ✓ every interactive control has an accessible name (${totalSeen} seen)`);
  else {
    console.log(`  ✗ ${unnamed.size} control(s) with no accessible name — design.md §8:`);
    [...unnamed].slice(0, 12).forEach(([s, scr]) => console.log(`      ${s}   [${[...scr].join(', ')}]`));
    failed++;
  }

  const over = small.size > BUDGET;
  console.log(`  ${over ? '✗' : '·'} ${small.size} distinct control(s) below ${MIN}×${MIN} — budget ${BUDGET}`);
  if (over) { console.log(`     A control smaller than the documented minimum was added. Either size it up, or change design.md §8 and lower the budget deliberately.`); failed++; }
  if (LIST || over) {
    [...small.values()].sort((a, b) => a.w * a.h - b.w * b.h).slice(0, LIST ? 99 : 10)
      .forEach((x) => console.log(`      ${String(x.w + '×' + x.h).padEnd(9)} ${x.sig}   [${[...x.screens].join(', ')}]`));
  }

  if (!smallInputs.length) console.log('  ✓ every text field is ≥16px (no iOS focus auto-zoom)');
  else {
    console.log(`  ✗ ${smallInputs.length} text field(s) under 16px — iOS zooms the page on focus and the zoom can stick (right-side clipping):`);
    smallInputs.slice(0, 8).forEach((x) => console.log(`      ${x.px}px  ${x.sig}`));
    failed++;
  }

  if (focus > 0) console.log(`  ✓ ${focus} focus style rule(s) defined`);
  else console.log(`  · no :focus / :focus-visible styles — design.md §8 records this as an outstanding gap`);

  console.log('');
  if (failed) { console.log(`❌ ${failed} accessibility issue(s).\n`); process.exit(1); }
  console.log('✅ Accessibility within budget.\n');
})().catch((e) => { console.error('FATAL', e.stack || e); process.exit(2); });
